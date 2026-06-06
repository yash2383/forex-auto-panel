import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createTransactionGroup } from '../common/ledger.util';

@Injectable()
export class InvestmentService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // ADMIN PLAN CRUD
  // ==========================================

  async getPlansAdmin(partnerId: string) {
    const plans = await this.prisma.investmentPlan.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
      include: {
        userInvestments: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    return plans.map((p) => {
      const activeInvestments = p.userInvestments.filter(
        (ui) => ui.status === 'ACTIVE',
      );
      const totalInvested = activeInvestments.reduce(
        (sum, ui) => sum + Number(ui.amount),
        0,
      );
      const weeklyLiability = activeInvestments.reduce(
        (sum, ui) => sum + (Number(ui.amount) * Number(p.weeklyProfit)) / 100,
        0,
      );

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        image: p.image,
        minAmount: Number(p.minAmount),
        maxAmount: Number(p.maxAmount),
        weeklyProfit: Number(p.weeklyProfit),
        lockPeriod: p.lockPeriod,
        referralBonus: Number(p.referralBonus),
        status: p.status,
        investorsCount: activeInvestments.length,
        totalInvested,
        weeklyLiability,
        createdAt: p.createdAt,
      };
    });
  }

  async getPlanInvestors(planId: string) {
    const investments = await this.prisma.userInvestment.findMany({
      where: { planId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return investments.map((ui) => ({
      id: ui.id,
      amount: Number(ui.amount),
      profitRate: Number(ui.profitRate),
      startDate: ui.startDate,
      nextProfitDate: ui.nextProfitDate,
      status: ui.status,
      userName: ui.user?.name || 'Unknown',
      userEmail: ui.user?.email || 'Unknown',
      createdAt: ui.createdAt,
    }));
  }

  async createPlan(
    partnerId: string,
    data: {
      name: string;
      description?: string;
      image?: string;
      minAmount: number;
      maxAmount: number;
      weeklyProfit: number;
      lockPeriod: number;
      referralBonus: number;
      status?: boolean;
    },
  ) {
    if (data.minAmount <= 0 || data.maxAmount < data.minAmount) {
      throw new BadRequestException('Invalid min/max investment bounds.');
    }
    if (data.weeklyProfit < 0 || data.weeklyProfit > 100) {
      throw new BadRequestException(
        'Weekly profit rate must be between 0% and 100%.',
      );
    }

    return this.prisma.investmentPlan.create({
      data: {
        partnerId,
        name: data.name,
        description: data.description || null,
        image: data.image || null,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        weeklyProfit: data.weeklyProfit,
        lockPeriod: data.lockPeriod,
        referralBonus: data.referralBonus,
        status: data.status !== undefined ? data.status : true,
      },
    });
  }

  async updatePlan(
    planId: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
      minAmount?: number;
      maxAmount?: number;
      weeklyProfit?: number;
      lockPeriod?: number;
      referralBonus?: number;
      status?: boolean;
    },
  ) {
    const plan = await this.prisma.investmentPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Investment plan not found.');
    }

    const updateData: any = { ...data };

    if (data.minAmount !== undefined || data.maxAmount !== undefined) {
      const min =
        data.minAmount !== undefined ? data.minAmount : Number(plan.minAmount);
      const max =
        data.maxAmount !== undefined ? data.maxAmount : Number(plan.maxAmount);
      if (min <= 0 || max < min) {
        throw new BadRequestException('Invalid min/max investment bounds.');
      }
    }

    if (
      data.weeklyProfit !== undefined &&
      (data.weeklyProfit < 0 || data.weeklyProfit > 100)
    ) {
      throw new BadRequestException(
        'Weekly profit rate must be between 0% and 100%.',
      );
    }

    return this.prisma.investmentPlan.update({
      where: { id: planId },
      data: updateData,
    });
  }

  async deletePlan(planId: string) {
    const plan = await this.prisma.investmentPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Investment plan not found.');
    }

    // Check if there are active user investments under this plan
    const activeInvestmentsCount = await this.prisma.userInvestment.count({
      where: { planId, status: 'ACTIVE' },
    });

    if (activeInvestmentsCount > 0) {
      throw new BadRequestException(
        'Cannot delete plan with active user investments.',
      );
    }

    await this.prisma.investmentPlan.delete({ where: { id: planId } });
    return { success: true };
  }

  // ==========================================
  // USER ACTIONS
  // ==========================================

  async getActivePlansUser(partnerId: string) {
    const plans = await this.prisma.investmentPlan.findMany({
      where: { partnerId, status: true },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      image: p.image,
      minAmount: Number(p.minAmount),
      maxAmount: Number(p.maxAmount),
      weeklyProfit: Number(p.weeklyProfit),
      lockPeriod: p.lockPeriod,
      referralBonus: Number(p.referralBonus),
      status: p.status,
    }));
  }

  async getUserInvestments(userId: string) {
    const investments = await this.prisma.userInvestment.findMany({
      where: { userId },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return investments.map((ui) => ({
      id: ui.id,
      planName: ui.plan?.name || 'Unknown Plan',
      amount: Number(ui.amount),
      profitRate: Number(ui.profitRate),
      startDate: ui.startDate,
      nextProfitDate: ui.nextProfitDate,
      status: ui.status,
      createdAt: ui.createdAt,
    }));
  }

  async createInvestment(
    userId: string,
    partnerId: string,
    planId: string,
    amount: number,
  ) {
    if (amount <= 0) {
      throw new BadRequestException(
        'Investment amount must be greater than zero.',
      );
    }

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Fetch the plan
      const plan = await tx.investmentPlan.findFirst({
        where: { id: planId, partnerId, status: true },
      });

      if (!plan) {
        throw new NotFoundException('Active investment plan not found.');
      }

      // 2. Validate amount limits
      if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
        throw new BadRequestException(
          `Investment amount must be between $${Number(plan.minAmount).toLocaleString()} and $${Number(
            plan.maxAmount,
          ).toLocaleString()}.`,
        );
      }

      // 3. Fetch user wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new BadRequestException('User wallet not found.');
      }

      if (Number(wallet.availableBalance) < amount) {
        throw new BadRequestException(
          'Insufficient wallet balance to proceed with this investment.',
        );
      }

      // 4. Create Ledger entries & debit wallet
      const idempotencyKey = `INVEST_${userId}_${planId}_${Date.now()}`;
      await createTransactionGroup(tx, {
        type: 'SYSTEM_ADJUSTMENT',
        description: `Invested in ${plan.name}`,
        idempotencyKey,
        entries: [
          {
            userId,
            partnerId,
            accountType: 'USER',
            entryType: 'DEBIT',
            amount,
            currency: wallet.currency || 'USD',
          },
          {
            accountType: 'SYSTEM',
            entryType: 'CREDIT',
            amount,
            currency: wallet.currency || 'USD',
          },
        ],
      });

      // 5. Create user investment record
      const startDate = new Date();
      const nextProfitDate = new Date(startDate);
      nextProfitDate.setDate(nextProfitDate.getDate() + 7); // weekly payouts

      const userInvestment = await tx.userInvestment.create({
        data: {
          partnerId,
          userId,
          planId,
          amount,
          profitRate: plan.weeklyProfit,
          startDate,
          nextProfitDate,
          status: 'ACTIVE',
        },
      });

      return {
        success: true,
        investment: {
          id: userInvestment.id,
          amount: Number(userInvestment.amount),
          profitRate: Number(userInvestment.profitRate),
          startDate: userInvestment.startDate,
          nextProfitDate: userInvestment.nextProfitDate,
          status: userInvestment.status,
        },
      };
    });
  }
}
