import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../common/crypto.util';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

    // Find the latest approved payment as the active subscription
    const latestApprovedPayment = await this.prisma.payment.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });

    let activePlan: any = null;
    if (latestApprovedPayment) {
      const approvedDate = new Date(latestApprovedPayment.createdAt);
      const expiresAt = new Date(approvedDate);
      expiresAt.setDate(expiresAt.getDate() + 365);

      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const isActive = daysRemaining > 0;

      activePlan = {
        name: latestApprovedPayment.planName,
        status: isActive ? 'ACTIVE' : 'EXPIRED',
        amount: Number(latestApprovedPayment.amount),
        currency: latestApprovedPayment.currency,
        approvedAt: latestApprovedPayment.createdAt,
        expiresAt: expiresAt.toISOString(),
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
   * Get subscription status derived from the latest approved payment.
   * Expiry is computed dynamically: approvedPayment.createdAt + 365 days
   */
  async getSubscription(userId: string) {
    const latestApprovedPayment = await this.prisma.payment.findFirst({
      where: { userId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestApprovedPayment) {
      // Check if there's a pending payment
      const latestPending = await this.prisma.payment.findFirst({
        where: { userId, status: { in: ['PENDING', 'VERIFIED'] } },
        orderBy: { createdAt: 'desc' },
      });

      if (latestPending) {
        return {
          hasSubscription: false,
          pendingCheckout: {
            status: latestPending.status,
            planName: latestPending.planName,
            amount: Number(latestPending.amount),
            submittedAt: latestPending.createdAt,
          },
        };
      }

      return { hasSubscription: false, pendingCheckout: null };
    }

    const approvedDate = new Date(latestApprovedPayment.createdAt);
    const expiresAt = new Date(approvedDate);
    expiresAt.setDate(expiresAt.getDate() + 365);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isActive = daysRemaining > 0;

    return {
      hasSubscription: true,
      subscription: {
        planName: latestApprovedPayment.planName,
        amount: Number(latestApprovedPayment.amount),
        currency: latestApprovedPayment.currency,
        status: isActive ? 'ACTIVE' : 'EXPIRED',
        approvedAt: latestApprovedPayment.createdAt,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
        totalDays: 365,
      },
      pendingCheckout: null,
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
      return { error: 'New password and confirmation do not match', status: 400 };
    }

    if (newPassword.length < 6) {
      return { error: 'New password must be at least 6 characters', status: 400 };
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

    return { success: true, message: 'Password changed successfully' };
  }
}
