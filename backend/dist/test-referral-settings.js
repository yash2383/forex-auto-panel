"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const admin_service_1 = require("./src/admin/admin.service");
const prisma_service_1 = require("./src/prisma/prisma.service");
async function bootstrap() {
    console.log('\nBooting NestJS application context for Referral Engine Verification...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const adminService = app.get(admin_service_1.AdminService);
    const prisma = app.get(prisma_service_1.PrismaService);
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
    function assert(label, condition, detail) {
        if (condition) {
            console.log(`  ✅ PASS: ${label}`);
            pass++;
        }
        else {
            console.error(`  ❌ FAIL: ${label}`, detail);
            fail++;
        }
    }
    try {
        console.log('\n=== TEST 1: Happy Path Referral Test (Auto-Approve Enabled) ===');
        await prisma.referralSettings.deleteMany();
        const refSettings1 = await prisma.referralSettings.create({
            data: {
                enabled: true,
                commissionRate: 12.00,
                minimumDeposit: 1000.00,
                autoApprove: true,
            },
        });
        const pair1 = await createReferredPair();
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
        await adminService.approvePayment(admin.id, payment1.id, '127.0.0.1');
        const referral1 = await prisma.referral.findFirst({
            where: { paymentId: payment1.id },
        });
        assert('Referral record is created', referral1 !== null);
        if (referral1) {
            assert('Commission percentage matches ReferralSettings rate (12%)', Number(referral1.commissionPct) === 12);
            assert('Commission reward amount is correct (₹180)', Number(referral1.commissionAmount) === 180);
            assert('Referral status is APPROVED', referral1.status === 'APPROVED');
            const referrerWallet = await prisma.wallet.findUnique({
                where: { userId: pair1.referrer.id },
            });
            const ledgerEntry = await prisma.walletLedger.findFirst({
                where: { userId: pair1.referrer.id, type: 'REFERRAL_COMMISSION' }
            });
            assert('Referrer wallet ledger credit entry exists', ledgerEntry !== null);
            assert('Ledger credit amount matches commission', Number(ledgerEntry?.amount) === 180);
        }
        console.log('\n=== TEST 2: Threshold Path Referral Test (Deposit < Minimum) ===');
        const pair2 = await createReferredPair();
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
        await adminService.approvePayment(admin.id, payment2.id, '127.0.0.1');
        const referral2 = await prisma.referral.findFirst({
            where: { paymentId: payment2.id },
        });
        assert('No Referral record is created for deposit below minimum', referral2 === null);
        console.log('\n=== TEST 3: Disabled Referral Test (Enabled = false) ===');
        await prisma.referralSettings.updateMany({
            data: { enabled: false },
        });
        const pair3 = await createReferredPair();
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
        await adminService.approvePayment(admin.id, payment3.id, '127.0.0.1');
        const referral3 = await prisma.referral.findFirst({
            where: { paymentId: payment3.id },
        });
        assert('No Referral record is created when referral engine is disabled', referral3 === null);
        console.log('\n=== TEST 4: Auto-Approve Disabled Test (Auto-Approve = false) ===');
        await prisma.referralSettings.updateMany({
            data: { enabled: true, autoApprove: false },
        });
        const pair4 = await createReferredPair();
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
        await adminService.approvePayment(admin.id, payment4.id, '127.0.0.1');
        const referral4 = await prisma.referral.findFirst({
            where: { paymentId: payment4.id },
        });
        assert('Referral record is created when auto-approve is disabled', referral4 !== null);
        if (referral4) {
            assert('Referral status is PENDING', referral4.status === 'PENDING');
            const ledgerEntry4 = await prisma.walletLedger.findFirst({
                where: { userId: pair4.referrer.id, type: 'REFERRAL_COMMISSION' }
            });
            assert('No wallet ledger credit entry is created yet', ledgerEntry4 === null);
        }
    }
    catch (error) {
        console.error('VERIFICATION ERROR:', error);
        fail++;
    }
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Verification Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) {
        console.log('🎉 ALL REFERRAL ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
    }
    else {
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
//# sourceMappingURL=test-referral-settings.js.map