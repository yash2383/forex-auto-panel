import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AdminService } from './src/admin/admin.service';
import { PrismaService } from './src/prisma/prisma.service';
import { randomUUID } from 'crypto';

async function bootstrap() {
  console.log('\nBooting NestJS application context for Referral Engine Verification...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const adminService = app.get(AdminService);
  const prisma = app.get(PrismaService);

  // ── Setup Test Admins & Partners ──────────────────────────────────────────
  let admin = await prisma.admin.findFirst();
  if (!admin) {
    admin = await prisma.admin.create({
      data: {
        name: 'Test Super Admin',
        email: 'test-admin@mail.com',
        passwordHash: 'hashed',
        role: 'SUPER_ADMIN',
        permissions: {},
      },
    });
  }

  let partner = await prisma.partner.findFirst();
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        slug: 'test-partner',
        name: 'TestPartner',
        companyName: 'TestPartner Inc',
        email: 'test-partner@mail.com',
        passwordHash: 'hashed',
        profitSharePct: 30.00,
        maxAllowedPct: 40.00,
        domain: 'testpartner.com',
        status: 'ACTIVE',
      },
    });
  }

  if (!admin || !partner) {
    throw new Error('Admin or Partner is missing and could not be resolved/created.');
  }

  const activePartner = partner;
  const activeAdmin = admin;

  // ── Helper functions for creating Referred/Referrer pairs ────────────────
  let userCounter = 0;
  async function createReferredPair() {
    userCounter++;
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const referrer = await prisma.user.create({
      data: {
        partnerId: activePartner.id,
        name: `Referrer ${userCounter}`,
        email: `referrer-${userCounter}-${uniqueSuffix}@mail.com`,
        passwordHash: 'hashed',
        referralCode: `REF${userCounter}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      },
    });
    
    await prisma.wallet.create({
      data: {
        userId: referrer.id,
        realizedBalance: 0,
        unrealizedBalance: 0,
        currency: 'INR',
      },
    });

    const referred = await prisma.user.create({
      data: {
        partnerId: activePartner.id,
        name: `Referred ${userCounter}`,
        email: `referred-${userCounter}-${uniqueSuffix}@mail.com`,
        passwordHash: 'hashed',
        referredBy: referrer.id,
        referralCode: `REFD${userCounter}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      },
    });

    await prisma.wallet.create({
      data: {
        userId: referred.id,
        realizedBalance: 0,
        unrealizedBalance: 0,
        currency: 'INR',
      },
    });

    return { referrer, referred };
  }

  let pass = 0;
  let fail = 0;
  function assert(label: string, condition: boolean, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      pass++;
    } else {
      console.error(`  ❌ FAIL: ${label}`, detail);
      fail++;
    }
  }

  try {
    // ══════════════════════════════════════════════════════════════════════════
    // TEST 1 — Happy Path Referral Test (Enabled=true, AutoApprove=true, Deposit >= Min)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 1: Happy Path Referral Test (Auto-Approve Enabled) ===');
    
    // Ensure clean ReferralSettings
    await prisma.referralSettings.deleteMany();
    const refSettings1 = await prisma.referralSettings.create({
      data: {
        enabled: true,
        commissionRate: 12.00,
        minimumDeposit: 1000.00,
        autoApprove: true,
        requireActiveSubscription: false,
        requireReferrerDeposit: false,
      },
    });

    // Create Referred pair
    const pair1 = await createReferredPair();
    
    // Create payment
    const payment1 = await prisma.payment.create({
      data: {
        userId: pair1.referred.id,
        partnerId: partner.id,
        planName: 'Club Plan',
        amount: 1500.00,
        currency: 'INR',
        paymentType: 'USDT',
        status: 'PENDING',
      },
    });

    // Approve payment
    await adminService.approvePayment(admin.id, payment1.id, '127.0.0.1');

    // Verify Referral record
    const referral1 = await prisma.referral.findFirst({
      where: { referredId: pair1.referred.id },
      include: { reward: true },
    });
    
    assert('Referral record is created', referral1 !== null);
    if (referral1) {
      assert('Commission percentage matches ReferralSettings rate (12%)', Number(referral1.reward?.referralRate) === 12);
      assert('Commission reward amount is correct (₹7.20)', Number(referral1.reward?.commissionAmount) === 7.2);
      assert('Referral status is APPROVED', referral1.status === 'APPROVED');
      
      // Verify Referrer wallet balance
      const referrerWallet = await prisma.wallet.findUnique({
        where: { userId: pair1.referrer.id },
      });
      const ledgerEntry = await prisma.walletLedger.findFirst({
        where: { userId: pair1.referrer.id, type: 'REFERRAL_COMMISSION' }
      });
      assert('Referrer wallet ledger credit entry exists', ledgerEntry !== null);
      assert('Ledger credit amount matches commission', Number(ledgerEntry?.amount) === 7.2);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 2 — Threshold Path Referral Test (Deposit < Min)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 2: Threshold Path Referral Test (Deposit < Minimum) ===');
    
    // Create Referred pair
    const pair2 = await createReferredPair();
    
    // Create payment below minimum (800 < 1000)
    const payment2 = await prisma.payment.create({
      data: {
        userId: pair2.referred.id,
        partnerId: partner.id,
        planName: 'Club Plan',
        amount: 800.00,
        currency: 'INR',
        paymentType: 'USDT',
        status: 'PENDING',
      },
    });

    // Approve payment
    await adminService.approvePayment(admin.id, payment2.id, '127.0.0.1');

    // Verify ReferralReward record
    const reward2 = await prisma.referralReward.findFirst({
      where: { paymentId: payment2.id },
    });
    
    assert('No ReferralReward record is created for deposit below minimum', reward2 === null);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 3 — Disabled Referral Test (Enabled = false)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 3: Disabled Referral Test (Enabled = false) ===');
    
    // Update ReferralSettings to disabled
    await prisma.referralSettings.updateMany({
      data: { enabled: false },
    });

    // Create Referred pair
    const pair3 = await createReferredPair();
    
    // Create payment above minimum (5000 >= 1000)
    const payment3 = await prisma.payment.create({
      data: {
        userId: pair3.referred.id,
        partnerId: partner.id,
        planName: 'Club Plan',
        amount: 5000.00,
        currency: 'INR',
        paymentType: 'USDT',
        status: 'PENDING',
      },
    });

    // Approve payment
    await adminService.approvePayment(admin.id, payment3.id, '127.0.0.1');

    // Verify ReferralReward record
    const reward3 = await prisma.referralReward.findFirst({
      where: { paymentId: payment3.id },
    });
    
    assert('No ReferralReward record is created when referral engine is disabled', reward3 === null);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 4 — Auto-Approve Disabled Test (Enabled = true, Auto Approve = false)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 4: Auto-Approve Disabled Test (Auto-Approve = false) ===');
    
    // Update ReferralSettings to enabled, autoApprove = false
    await prisma.referralSettings.updateMany({
      data: {
        enabled: true,
        autoApprove: false,
        requireActiveSubscription: false,
        requireReferrerDeposit: false,
      },
    });

    // Create Referred pair
    const pair4 = await createReferredPair();
    
    // Create payment above minimum (5000 >= 1000)
    const payment4 = await prisma.payment.create({
      data: {
        userId: pair4.referred.id,
        partnerId: partner.id,
        planName: 'Club Plan',
        amount: 5000.00,
        currency: 'INR',
        paymentType: 'USDT',
        status: 'PENDING',
      },
    });

    // Approve payment
    await adminService.approvePayment(admin.id, payment4.id, '127.0.0.1');

    // Verify Referral record
    const referral4 = await prisma.referral.findFirst({
      where: { referredId: pair4.referred.id },
    });
    
    assert('Referral record is created when auto-approve is disabled', referral4 !== null);
    if (referral4) {
      assert('Referral status is PENDING', referral4.status === 'PENDING');
      
      // Verify no wallet ledger credit entry exists
      const ledgerEntry4 = await prisma.walletLedger.findFirst({
        where: { userId: pair4.referrer.id, type: 'REFERRAL_COMMISSION' }
      });
      assert('No wallet ledger credit entry is created yet', ledgerEntry4 === null);
    }

  } catch (error) {
    console.error('VERIFICATION ERROR:', error);
    fail++;
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Verification Results: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('🎉 ALL REFERRAL ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    console.log('⚠️  Some verification tests failed — check errors above.');
  }
  console.log('═'.repeat(60));

  await app.close();
  process.exit(fail === 0 ? 0 : 1);
}

bootstrap().catch((e) => {
  console.error('Fatal bootstrapping test:', e);
  process.exit(1);
});
