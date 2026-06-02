import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getActivePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { status: 'Active' },
      orderBy: { createdAt: 'asc' },
    });
    return { plans };
  }
}
