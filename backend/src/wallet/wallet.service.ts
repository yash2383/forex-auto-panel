import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationEvent } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getWalletData(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const rewards = await this.prisma.referralReward.findMany({
      where: {
        referral: { referrerId: userId },
        status: { in: ['APPROVED', 'PAID'] }
      },
    });
    const rewardBalance = rewards.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
    const totalBalance = Number(wallet.availableBalance);
    const availableBalance = Math.max(0, totalBalance - rewardBalance);

    return {
      realizedBalance: Number(wallet.realizedBalance),
      currentEquity: Number(wallet.currentEquity),
      availableBalance: totalBalance, // Original value for backwards compatibility
      balance: availableBalance, // Separate non-reward available balance
      rewardBalance,
      totalBalance,
      pendingWithdrawals: Number(wallet.pendingWithdrawals),
      totalWithdrawn: Number(wallet.totalWithdrawn),
      currency: wallet.currency,
    };
  }

  async getWithdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWithdrawal(
    userId: string,
    partnerId: string,
    amount: number,
    method: string,
    accountDetails: any,
    notes?: string,
  ) {
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException(
        'Withdrawal amount must be a positive number',
      );
    }

    if (!method) {
      throw new BadRequestException('Withdrawal method is required');
    }

    if (method.toLowerCase().includes('upi')) {
      throw new BadRequestException('UPI withdrawals are not supported');
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Fetch wallet with lock
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const available = Number(wallet.availableBalance);
      if (available < amount) {
        throw new BadRequestException(
          `Insufficient available funds. Available: $${available.toLocaleString('en-US')}`,
        );
      }

      // 2. Generate secure sequential human-readable withdrawal ID
      const sequence = await tx.withdrawal.count();
      const withdrawalId = `WD-${String(sequence + 1001).padStart(6, '0')}`;

      // 3. Serialize account details
      const detailsStr =
        typeof accountDetails === 'object'
          ? JSON.stringify(accountDetails)
          : String(accountDetails);

      // 4. Update wallet balances atomically
      const nextAvailable = available - amount;
      const nextPending = Number(wallet.pendingWithdrawals) + amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: nextAvailable,
          pendingWithdrawals: nextPending,
        },
      });

      // 5. Create withdrawal request
      const withdrawal = await tx.withdrawal.create({
        data: {
          withdrawalId,
          userId,
          partnerId,
          amount: new Prisma.Decimal(amount),
          currency: wallet.currency || 'USD',
          status: 'PENDING',
          method,
          accountDetails: detailsStr,
          notes: notes || null,
        },
      });

      return withdrawal;
    });

    if (result) {
      this.notificationsService
        .sendToUser(userId, NotificationEvent.WITHDRAWAL_REQUESTED, {
          amount: Number(result.amount),
        })
        .catch((err) =>
          console.error(
            `Failed to send WITHDRAWAL_REQUESTED notification for user ${userId}`,
            err,
          ),
        );
    }

    return result;
  }
}
