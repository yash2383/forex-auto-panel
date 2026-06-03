import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyJwt } from '../crypto.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authenticated');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyJwt(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Verify the user actually still exists in the database
    let exists = false;
    if (payload.role === 'SUPER_ADMIN' || payload.role === 'MANAGER' || payload.role === 'VIEWER') {
      const admin = await this.prisma.admin.findUnique({ where: { id: payload.id } });
      exists = !!admin;
    } else if (payload.role === 'PARTNER') {
      const partner = await this.prisma.partner.findUnique({ where: { id: payload.id } });
      exists = !!partner;
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
      exists = !!user;
    }

    if (!exists) {
      throw new UnauthorizedException('User no longer exists. Please log in again.');
    }

    // Attach decoded user to request
    request.user = payload;
    return true;
  }
}
