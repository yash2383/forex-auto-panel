import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async getActivePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { plans };
  }

  async getAllPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { plans };
  }

  async createPlan(data: any) {
    const plan = await this.prisma.plan.create({
      data: {
        name: data.name,
        subtitle: data.subtitle || '',
        capitalLabel: data.capitalLabel || '',
        desc: data.desc || '',
        features: data.features || [],
        btnText: data.btnText || 'Get Started',
        status: data.status || 'Active',
        isPopular: data.isPopular || false,
        amount: data.amount || 0,
        weeklyProfit: data.weeklyProfit || 5,
        durationDays: data.durationDays || 30,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return { plan };
  }

  async updatePlan(id: string, data: any) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data,
    });
    return { plan };
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.update({
      where: { id },
      data: { isActive: false },
    });
    return { plan };
  }
}
