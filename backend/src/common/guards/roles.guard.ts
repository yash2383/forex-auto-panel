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
    console.log(
      '[RolesGuard] path:',
      request.url,
      'required:',
      requiredRoles,
      'user.role:',
      user?.role,
      'user:',
      user,
    );

    if (!user || !requiredRoles.includes(user.role)) {
      console.warn(
        '[RolesGuard] Access denied for user role:',
        user?.role,
        'required:',
        requiredRoles,
      );
      throw new ForbiddenException('Access denied');
    }

    return true;
  }
}
