import { SetMetadata } from '@nestjs/common';

export const ALLOW_DURING_MAINTENANCE_KEY = 'allowDuringMaintenance';

/**
 * Mark a controller or route handler as accessible even when
 * the platform is in maintenance mode. Use this on endpoints that
 * must remain operational regardless of system state, such as
 * webhook receivers, health checks, or auth endpoints.
 */
export const AllowDuringMaintenance = () =>
  SetMetadata(ALLOW_DURING_MAINTENANCE_KEY, true);
