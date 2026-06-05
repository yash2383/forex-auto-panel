import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../common/crypto.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEvent } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get full user profile in a single payload:
   * - Basic info (name, email, status, createdAt, lastLoginAt)
   * - Wallet balance
   * - Active plan (from latest APPROVED payment + 365-day expiry)
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Find the latest user plan as the active subscription
    const latestUserPlan: any = await this.prisma.userPlan.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });

    let activePlan: any = null;
    if (latestUserPlan) {
      const now = new Date();
      const expiresAt = latestUserPlan.expiresAt ? new Date(latestUserPlan.expiresAt) : null;
      const daysRemaining = expiresAt
        ? Math.max(
            0,
            Math.ceil(
              (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : 9999;
      const isActive = latestUserPlan.active && (expiresAt ? expiresAt.getTime() > now.getTime() : true);

      activePlan = {
        name: latestUserPlan.plan.name,
        status: isActive ? 'ACTIVE' : 'EXPIRED',
        amount: Number(latestUserPlan.plan.amount ?? 0),
        currency: 'INR',
        approvedAt: latestUserPlan.startedAt,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        daysRemaining,
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'USER',
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      walletBalance: user.wallet ? Number(user.wallet.realizedBalance) : 0,
      activePlan,
    };
  }

  /**
   * Update user profile (currently: name only)
   */
  async updateProfile(userId: string, data: { name?: string }) {
    const updateData: any = {};

    if (data.name && data.name.trim().length > 0) {
      updateData.name = data.name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return { error: 'No valid fields to update', status: 400 };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    };
  }

  /**
   * Get all payments for the user — same Payment table the admin manages.
   * Single source of truth.
   */
  async getPayments(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      payments: payments.map((p: any) => ({
        id: p.id,
        planName: p.planName,
        amount: Number(p.amount),
        currency: p.currency,
        paymentType: p.paymentType,
        network: p.network || null,
        txnHash: p.txnHash || null,
        utr: p.utr || null,
        remark: p.remark || null,
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    };
  }

  /**
   * Get subscription status derived from UserPlan (single source of truth)
   * with fallback to check for pending/verified checkouts.
   */
  async getSubscription(userId: string) {
    const latestUserPlan = await this.prisma.userPlan.findFirst({
      where: { userId },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });

    const latestPending = await this.prisma.payment.findFirst({
      where: { userId, status: { in: ['PENDING', 'VERIFIED'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (latestUserPlan) {
      const now = new Date();
      const expiresAt = latestUserPlan.expiresAt ? new Date(latestUserPlan.expiresAt) : null;
      const daysRemaining = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : null;
      const isActive = latestUserPlan.active && (expiresAt ? expiresAt.getTime() > now.getTime() : true);

      let pendingCheckout: any = null;
      if (latestPending) {
        pendingCheckout = {
          planName: latestPending.planName,
          amount: Number(latestPending.amount),
          status: latestPending.status,
        };
      }

      return {
        hasSubscription: true,
        subscription: {
          planName: latestUserPlan.plan.name,
          status: isActive ? 'ACTIVE' : 'EXPIRED',
          startedAt: latestUserPlan.startedAt.toISOString(),
          approvedAt: latestUserPlan.startedAt.toISOString(),
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
          daysRemaining,
          amount: Number(latestUserPlan.plan.amount ?? 0),
          currency: 'INR',
          totalDays: latestUserPlan.plan.durationDays || 30,
        },
        pendingCheckout,
      };
    }

    if (latestPending) {
      return {
        hasSubscription: false,
        subscription: null,
        pendingCheckout: {
          planName: latestPending.planName,
          amount: Number(latestPending.amount),
          status: latestPending.status,
        },
      };
    }

    return {
      hasSubscription: false,
      subscription: null,
      pendingCheckout: null,
    };
  }

  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found', status: 404 };

    const totalReferrals = await this.prisma.user.count({
      where: { referredBy: userId },
    });

    const activeReferrals = await this.prisma.userPlan.count({
      where: {
        user: { referredBy: userId },
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });

    const approvedRewards = await this.prisma.referralReward.findMany({
      where: { referrerId: userId, status: 'APPROVED' },
    });
    const rewardsEarned = approvedRewards.reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate pending rewards from pending/verified payments of referred users
    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        user: { referredBy: userId },
        status: { in: ['PENDING', 'VERIFIED'] }
      },
      select: { amount: true }
    });

    const refSettings = await this.prisma.referralSettings.findFirst();
    const sysSettings = await this.prisma.systemSettings.findFirst();
    const commissionRate = Number(refSettings?.commissionRate ?? 10);
    const bonusMultiplier = Number(sysSettings?.referralBonusMultiplier ?? 100);

    let pendingRewards = 0;
    pendingPayments.forEach(p => {
      const amt = Number(p.amount);
      const platformFee = amt * 0.04;
      const reward = (platformFee * commissionRate * (bonusMultiplier / 100)) / 100;
      pendingRewards += reward;
    });

    return {
      referralCode: user.referralCode,
      stats: {
        totalReferrals,
        activeReferrals,
        totalEarnings: rewardsEarned, // profile page backwards-compat
        pendingEarnings: pendingRewards, // profile page backwards-compat
        rewardsEarned,
        pendingRewards,
      },
    };
  }

  /**
   * Change user password with currentPassword verification.
   * Validates newPassword === confirmPassword before hashing.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: 'All password fields are required', status: 400 };
    }

    if (newPassword !== confirmPassword) {
      return {
        error: 'New password and confirmation do not match',
        status: 400,
      };
    }

    if (newPassword.length < 6) {
      return {
        error: 'New password must be at least 6 characters',
        status: 400,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return { error: 'Current password is incorrect', status: 401 };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashPassword(newPassword) },
    });

    this.notificationsService
      .sendToUser(userId, NotificationEvent.PASSWORD_CHANGED, {})
      .catch((err) =>
        console.error(
          `Failed to send PASSWORD_CHANGED notification for user ${userId}`,
          err,
        ),
      );

    return { success: true, message: 'Password changed successfully' };
  }

  async getReferrals(userId: string) {
    const users = await this.prisma.user.findMany({
      where: { referredBy: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        payments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { planName: true, amount: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      referrals: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joinDate: u.createdAt,
        plan: u.payments[0]?.planName || 'None',
        depositAmount: u.payments[0] ? Number(u.payments[0].amount) : 0,
      })),
    };
  }

  async getReferralEarnings(userId: string) {
    const earnings = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: { referredUser: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return {
      earnings: earnings.map((e) => ({
        id: e.id,
        date: e.createdAt,
        referredUser: e.referredUser.name,
        depositAmount: Number(e.depositAmount || 0),
        commissionPct: Number(e.commissionPct || 0),
        commissionAmount: Number(e.commissionAmount || 0),
        status: e.status,
      })),
    };
  }
}
