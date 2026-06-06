import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+plan$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private serializePlan(plan: any) {
    return {
      ...plan,
      amount: plan.amount !== null ? Number(plan.amount) : null,
      weeklyProfit: Number(plan.weeklyProfit),
      durationDays: Number(plan.durationDays),
    };
  }

  async getActivePlans() {
    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { plans: plans.map((plan) => this.serializePlan(plan)) };
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan || !plan.isActive) return null;
    return { plan: this.serializePlan(plan) };
  }

  async getPlanBySlug(slug: string) {
    if (!slug || slug === 'undefined') return null;

    const normalizedSlug = this.slugify(slug);
    const plan = await this.prisma.plan.findFirst({
      where: {
        isActive: true,
        OR: [{ slug: normalizedSlug }, { slug }],
      },
    });
    if (!plan) return null;
    return { plan: this.serializePlan(plan) };
  }

  async getPaymentMethods() {
    const settings = await this.prisma.systemSettings.findFirst();
    return {
      success: true,
      methods: [
        {
          key: 'USDT',
          enabled: settings?.usdtEnabled ?? true,
          walletAddress: settings?.usdtAddress || 'TXYZ123ABC456DEF789GHI',
          network: settings?.usdtNetwork || 'TRC20',
          usdtQrCode: settings?.usdtQrCode || '',
        },
      ],
    };
  }

  async getAllPlans() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return { plans };
  }

  async createPlan(data: any) {
    const pricingType = data.pricingType || 'FIXED';
    const amountVal =
      data.amount !== undefined && data.amount !== null && data.amount !== ''
        ? Number(data.amount)
        : null;

    if (amountVal === null && pricingType === 'FIXED') {
      throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
    }

    const plan = await this.prisma.plan.create({
      data: {
        slug: data.slug ? this.slugify(data.slug) : this.slugify(data.name),
        name: data.name,
        subtitle: data.subtitle || '',
        capitalLabel: data.capitalLabel || '',
        desc: data.desc || '',
        features: data.features || [],
        btnText: data.btnText || 'Get Started',
        status: data.status || 'Active',
        isPopular: data.isPopular || false,
        amount: pricingType === 'FLEXIBLE' ? null : amountVal,
        pricingType: pricingType,
        weeklyProfit: data.weeklyProfit || 5,
        durationDays: data.durationDays || 30,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
    return { plan };
  }

  async updatePlan(id: string, data: any) {
    const current = await this.prisma.plan.findUnique({ where: { id } });
    if (!current) throw new Error('Plan not found');

    const pricingType = data.pricingType || current.pricingType;
    const amountVal =
      data.amount !== undefined
        ? data.amount !== null && data.amount !== ''
          ? Number(data.amount)
          : null
        : current.amount
          ? Number(current.amount)
          : null;

    if (pricingType === 'FLEXIBLE') {
      data.amount = null;
    } else if (pricingType === 'FIXED' && amountVal === null) {
      throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...data,
        slug:
          data.slug !== undefined
            ? this.slugify(data.slug)
            : data.name !== undefined
              ? this.slugify(data.name)
              : current.slug,
      },
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
