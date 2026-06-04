"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const maintenance_guard_1 = require("./src/common/guards/maintenance.guard");
const prisma_service_1 = require("./src/prisma/prisma.service");
const core_2 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    console.log('\nBooting NestJS application context for Maintenance Guard Verification...');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, { logger: false });
    const prisma = app.get(prisma_service_1.PrismaService);
    const reflector = app.get(core_2.Reflector);
    const guard = new maintenance_guard_1.MaintenanceGuard(reflector, prisma);
    function resetGuardCache() {
        guard.lastFetchedAt = 0;
        guard.cachedMaintenance = null;
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
    function mockContext(userRole, isPublic = false, allowDuringMaintenance = false) {
        return {
            getHandler: () => () => { },
            getClass: () => class {
            },
            switchToHttp: () => ({
                getRequest: () => ({
                    user: userRole ? { role: userRole } : undefined,
                }),
            }),
            getType: () => 'http',
            getArgs: () => [],
            getArgByIndex: () => null,
            switchToRpc: () => { throw new Error('Not implemented'); },
            switchToWs: () => { throw new Error('Not implemented'); },
        };
    }
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            throw new Error('SystemSettings not seeded');
        }
        const originalGetAllAndOverride = reflector.getAllAndOverride;
        console.log('\n=== TEST 1: Maintenance Mode is OFF ===');
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { maintenanceMode: false, maintenance: false },
        });
        resetGuardCache();
        reflector.getAllAndOverride = () => false;
        const ctx1 = mockContext(undefined);
        const res1 = await guard.canActivate(ctx1);
        assert('Allows normal user request when maintenance is OFF', res1 === true);
        console.log('\n=== TEST 2: Maintenance Mode is ON (Normal user blocked) ===');
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { maintenanceMode: true, maintenance: true },
        });
        resetGuardCache();
        const ctx2 = mockContext(undefined);
        try {
            await guard.canActivate(ctx2);
            assert('Normal user blocked when maintenance is ON', false, 'Expected ServiceUnavailableException but none thrown');
        }
        catch (e) {
            assert('Throws ServiceUnavailableException when maintenance is ON', e instanceof common_1.ServiceUnavailableException);
            assert('Exception message warns about maintenance', e.message?.includes('under maintenance'));
        }
        console.log('\n=== TEST 3: Maintenance Mode is ON (Admin allowed) ===');
        const ctx3a = mockContext('SUPER_ADMIN');
        const res3a = await guard.canActivate(ctx3a);
        assert('Allows SUPER_ADMIN request', res3a === true);
        const ctx3b = mockContext('MANAGER');
        const res3b = await guard.canActivate(ctx3b);
        assert('Allows MANAGER request', res3b === true);
        console.log('\n=== TEST 4: Public decorator bypass ===');
        reflector.getAllAndOverride = (key) => {
            if (key === 'isPublic')
                return true;
            return false;
        };
        const ctx4 = mockContext(undefined);
        const res4 = await guard.canActivate(ctx4);
        assert('Allows normal user access to @Public routes', res4 === true);
        console.log('\n=== TEST 5: AllowDuringMaintenance decorator bypass ===');
        reflector.getAllAndOverride = (key) => {
            if (key === 'allowDuringMaintenance')
                return true;
            return false;
        };
        const ctx5 = mockContext(undefined);
        const res5 = await guard.canActivate(ctx5);
        assert('Allows normal user access to @AllowDuringMaintenance routes', res5 === true);
        reflector.getAllAndOverride = originalGetAllAndOverride;
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data: { maintenanceMode: false, maintenance: false },
        });
    }
    catch (error) {
        console.error('VERIFICATION ERROR:', error);
        fail++;
    }
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`Verification Results: ${pass} passed, ${fail} failed`);
    if (fail === 0) {
        console.log('🎉 ALL MAINTENANCE GUARD VERIFICATION TESTS PASSED SUCCESSFULLY!');
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
//# sourceMappingURL=test-maintenance-guard.js.map