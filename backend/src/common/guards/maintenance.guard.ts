import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ALLOW_DURING_MAINTENANCE_KEY } from '../decorators/allow-during-maintenance.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'MANAGER', 'VIEWER']);
const SETTINGS_TTL_MS = 30_000; // re-fetch every 30 s

@Injectable()
export class MaintenanceGuard implements CanActivate {
  private cachedMaintenance: boolean | null = null;
  private lastFetchedAt = 0;

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Routes decorated with @AllowDuringMaintenance always pass.
    const allowDuring = this.reflector.getAllAndOverride<boolean>(
      ALLOW_DURING_MAINTENANCE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowDuring) return true;

    // 2. Routes decorated with @Public always pass.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 3. Fetch maintenance flag (cached TTL).
    const maintenanceMode = await this.getMaintenanceMode();
    if (!maintenanceMode) return true;

    // 4. Maintenance is ON — still allow admin users through.
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;

    if (user?.role && ADMIN_ROLES.has(user.role)) return true;

    throw new ServiceUnavailableException(
      'The platform is currently under maintenance. Please try again later.',
    );
  }

  private async getMaintenanceMode(): Promise<boolean> {
    const now = Date.now();
    if (
      this.cachedMaintenance !== null &&
      now - this.lastFetchedAt < SETTINGS_TTL_MS
    ) {
      return this.cachedMaintenance;
    }

    const settings = await this.prisma.systemSettings.findFirst({
      select: { maintenanceMode: true },
    });

    this.cachedMaintenance = settings?.maintenanceMode ?? false;
    this.lastFetchedAt = now;
    return this.cachedMaintenance;
  }
}
