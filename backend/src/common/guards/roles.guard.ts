import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // All admin roles (SUPER_ADMIN, MANAGER, VIEWER) are treated as equivalent.
  // Any authenticated admin passes any route that lists at least one admin role.
  private static readonly ADMIN_ROLES = new Set([
    'SUPER_ADMIN',
    'MANAGER',
    'VIEWER',
  ]);

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // If the route requires any admin role, accept ALL admin roles.
    const routeRequiresAdmin = requiredRoles.some((r) =>
      RolesGuard.ADMIN_ROLES.has(r),
    );
    if (routeRequiresAdmin && RolesGuard.ADMIN_ROLES.has(user.role)) {
      return true;
    }

    // For non-admin roles (USER, PARTNER, etc.) fall back to exact match.
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    throw new ForbiddenException('Access denied');
  }
}
