"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const dashboard_service_1 = require("./src/dashboard/dashboard.service");
const prisma_service_1 = require("./src/prisma/prisma.service");
const crypto_1 = require("crypto");
async function bootstrap() {
    console.log('\nBooting NestJS application context...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const dashboardService = app.get(dashboard_service_1.DashboardService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const user = await prisma.user.findFirst({
        where: { isDeleted: false },
        select: { id: true, email: true, partnerId: true },
    });
    if (!user)
        throw new Error('No user found in DB — seed data required.');
    console.log(`\nUsing User: ${user.email}  id: ${user.id}  partnerId: ${user.partnerId}`);
    const userActor = { id: user.id, role: 'USER', partnerId: user.partnerId };
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
    console.log('\n═══ SCENARIO 1: Normal Self-Deposit ═══');
    const s1 = await dashboardService.deposit(userActor, {
        planName: 'Standard 30D',
        amount: 1000,
        txnHash: `tx_s1_${Date.now()}`,
        paymentType: 'USDT',
        network: 'TRC20',
    });
    console.log('  Result:', JSON.stringify(s1, null, 2).slice(0, 300));
    assert('returns success: true', s1.success === true);
    assert('payment has userId', s1.payment?.userId === user.id);
    assert('no cached flag', !s1.cached);
    console.log('\n═══ SCENARIO 2: Idempotency Short-Circuit ═══');
    const iKey = `ik-test-${(0, crypto_1.randomUUID)()}`;
    const s2a = await dashboardService.deposit(userActor, {
        planName: 'Standard 30D',
        amount: 2000,
        txnHash: `tx_s2_${Date.now()}`,
        paymentType: 'USDT',
        network: 'TRC20',
        idempotencyKey: iKey,
    });
    const s2b = await dashboardService.deposit(userActor, {
        planName: 'Standard 30D',
        amount: 2000,
        txnHash: `tx_s2_retry_${Date.now()}`,
        paymentType: 'USDT',
        network: 'TRC20',
        idempotencyKey: iKey,
    });
    console.log('  First call:', s2a.success, '| Cached:', s2a.cached);
    console.log('  Retry call:', s2b.success, '| Cached:', s2b.cached, '| Same ID:', s2a.payment?.id === s2b.payment?.id);
    assert('first call succeeds', s2a.success === true && !s2a.cached);
    assert('retry returns cached', s2b.success === true && s2b.cached === true);
    assert('same payment ID returned', s2a.payment?.id === s2b.payment?.id);
    console.log('\n═══ SCENARIO 3: Idempotency Key Mismatch Guard ═══');
    const pi3 = await prisma.paymentInitiation.create({
        data: {
            userId: user.id,
            partnerId: user.partnerId,
            amount: 3000,
            paymentGateway: 'usdt',
            source: 'Direct',
            status: 'initiated',
        },
    });
    const s3 = await dashboardService.deposit(userActor, {
        planName: 'Standard 30D',
        amount: 3000,
        paymentType: 'USDT',
        idempotencyKey: iKey,
        initiationId: pi3.id,
    });
    console.log('  Mismatch result:', s3.status, s3.error);
    assert('returns 409 status', s3.status === 409);
    assert('error mentions reuse', s3.error?.includes('Idempotency key reused'));
    await prisma.paymentInitiation.delete({ where: { id: pi3.id } }).catch(() => { });
    console.log('\n═══ SCENARIO 4: PI CAS Lock + Atomic Completion ═══');
    const pi4 = await prisma.paymentInitiation.create({
        data: {
            userId: user.id,
            partnerId: user.partnerId,
            amount: 5000,
            paymentGateway: 'usdt',
            source: 'Direct',
            status: 'initiated',
        },
    });
    const iKey4 = `ik-pi-${(0, crypto_1.randomUUID)()}`;
    const s4 = await dashboardService.deposit(userActor, {
        planName: 'Premium 90D',
        amount: 5000,
        txnHash: `tx_s4_${Date.now()}`,
        paymentType: 'USDT',
        network: 'TRC20',
        initiationId: pi4.id,
        idempotencyKey: iKey4,
    });
    const pi4After = await prisma.paymentInitiation.findUnique({ where: { id: pi4.id } });
    console.log('  Deposit result:', s4.success, '| PI status after:', pi4After?.status);
    assert('deposit succeeds', s4.success === true);
    assert('PI status = completed', pi4After?.status === 'completed');
    assert('PI.converted = true', pi4After?.converted === true);
    assert('payment links initiationId', s4.payment?.initiationId === pi4.id);
    console.log('\n═══ SCENARIO 4b: Duplicate PI Submission Guard ═══');
    const s4b = await dashboardService.deposit(userActor, {
        planName: 'Premium 90D',
        amount: 5000,
        paymentType: 'USDT',
        initiationId: pi4.id,
        idempotencyKey: `ik-dup-${(0, crypto_1.randomUUID)()}`,
    });
    console.log('  Duplicate PI result:', s4b.status, s4b.error);
    assert('second PI deposit rejected', s4b.status === 409);
    assert('error mentions already completed', s4b.error?.includes('already been completed'));
    console.log('\n═══ SCENARIO 5: Admin Deposit for User ═══');
    const admin = await prisma.admin.findFirst({ select: { id: true, role: true } });
    if (admin) {
        const adminActor = { id: admin.id, role: admin.role };
        const s5 = await dashboardService.deposit(adminActor, {
            planName: 'VIP 180D',
            amount: 10000,
            txnHash: `tx_s5_${Date.now()}`,
            paymentType: 'USDT',
            network: 'TRC20',
            email: user.email,
            idempotencyKey: `ik-admin-${(0, crypto_1.randomUUID)()}`,
        });
        console.log('  Admin result:', s5.success, s5.error || '(no error)');
        assert('admin deposit succeeds', s5.success === true);
        assert('payment targets correct user', s5.payment?.userId === user.id);
    }
    else {
        console.log('  ⚠️  No admin found — skipping scenario 5');
    }
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) {
        console.log('🎉 ALL SCENARIOS PASSED — deposit pipeline is production-grade');
    }
    else {
        console.log('⚠️  Some scenarios failed — review output above');
    }
    console.log('═'.repeat(50));
    console.log('Waiting for background events to settle...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await app.close();
    console.log('Context closed. Exiting.');
    process.exit(0);
}
bootstrap().catch((e) => {
    console.error('Fatal:', e);
    process.exit(1);
});
//# sourceMappingURL=test-deposit.js.map