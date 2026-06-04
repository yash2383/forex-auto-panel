import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MaintenanceGuard } from './src/common/guards/maintenance.guard';
import { PrismaService } from './src/prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';

async function bootstrap() {
  console.log('\nBooting NestJS application context for Maintenance Guard Verification...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const reflector = app.get(Reflector);
  const guard = new MaintenanceGuard(reflector, prisma);

  // Clear cache behavior by resetting lastFetchedAt to force db checks
  function resetGuardCache() {
    (guard as any).lastFetchedAt = 0;
    (guard as any).cachedMaintenance = null;
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

  // Helper to create mocked ExecutionContext
  function mockContext(userRole?: string, isPublic = false, allowDuringMaintenance = false): ExecutionContext {
    return {
      getHandler: () => () => {},
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : undefined,
        }),
      }),
      // Mock Reflector results
      getType: () => 'http',
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => { throw new Error('Not implemented'); },
      switchToWs: () => { throw new Error('Not implemented'); },
    } as unknown as ExecutionContext;
  }

  try {
    // Resolve global system settings
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      throw new Error('SystemSettings not seeded');
    }

    // Mock reflector behaviors by stubbing reflector.getAllAndOverride
    const originalGetAllAndOverride = reflector.getAllAndOverride;

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 1 — Maintenance Mode is OFF
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 1: Maintenance Mode is OFF ===');
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: { maintenanceMode: false, maintenance: false },
    });
    resetGuardCache();

    // Mock no decorators
    reflector.getAllAndOverride = () => false;

    const ctx1 = mockContext(undefined); // Normal user, no role
    const res1 = await guard.canActivate(ctx1);
    assert('Allows normal user request when maintenance is OFF', res1 === true);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 2 — Maintenance Mode is ON (Normal user blocked)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 2: Maintenance Mode is ON (Normal user blocked) ===');
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: { maintenanceMode: true, maintenance: true },
    });
    resetGuardCache();

    const ctx2 = mockContext(undefined); // Normal user, no role
    try {
      await guard.canActivate(ctx2);
      assert('Normal user blocked when maintenance is ON', false, 'Expected ServiceUnavailableException but none thrown');
    } catch (e: any) {
      assert('Throws ServiceUnavailableException when maintenance is ON', e instanceof ServiceUnavailableException);
      assert('Exception message warns about maintenance', e.message?.includes('under maintenance'));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 3 — Maintenance Mode is ON (Admin user allowed)
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 3: Maintenance Mode is ON (Admin allowed) ===');
    
    const ctx3a = mockContext('SUPER_ADMIN');
    const res3a = await guard.canActivate(ctx3a);
    assert('Allows SUPER_ADMIN request', res3a === true);

    const ctx3b = mockContext('MANAGER');
    const res3b = await guard.canActivate(ctx3b);
    assert('Allows MANAGER request', res3b === true);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 4 — Public routes allowed during maintenance
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 4: Public decorator bypass ===');
    // Stub reflector to return true for IS_PUBLIC_KEY check
    reflector.getAllAndOverride = (key: any) => {
      if (key === 'isPublic') return true;
      return false;
    };

    const ctx4 = mockContext(undefined); // Normal user
    const res4 = await guard.canActivate(ctx4);
    assert('Allows normal user access to @Public routes', res4 === true);

    // ══════════════════════════════════════════════════════════════════════════
    // TEST 5 — AllowDuringMaintenance routes allowed during maintenance
    // ══════════════════════════════════════════════════════════════════════════
    console.log('\n=== TEST 5: AllowDuringMaintenance decorator bypass ===');
    // Stub reflector to return true for ALLOW_DURING_MAINTENANCE_KEY check
    reflector.getAllAndOverride = (key: any) => {
      if (key === 'allowDuringMaintenance') return true;
      return false;
    };

    const ctx5 = mockContext(undefined); // Normal user
    const res5 = await guard.canActivate(ctx5);
    assert('Allows normal user access to @AllowDuringMaintenance routes', res5 === true);

    // Restore original reflector
    reflector.getAllAndOverride = originalGetAllAndOverride;

    // Reset settings to false at end of tests
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: { maintenanceMode: false, maintenance: false },
    });

  } catch (error) {
    console.error('VERIFICATION ERROR:', error);
    fail++;
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Verification Results: ${pass} passed, ${fail} failed`);
  if (fail === 0) {
    console.log('🎉 ALL MAINTENANCE GUARD VERIFICATION TESTS PASSED SUCCESSFULLY!');
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
