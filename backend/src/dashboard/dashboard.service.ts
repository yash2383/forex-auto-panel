import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEvent, Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getData(userId: string) {
    // Fetch user details along with wallet
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Fetch trades
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch payments (deposits)
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch withdrawals
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const closedTrades = trades.filter((t: any) => t.status === 'CLOSED');
    const activeTrades = trades.filter((t: any) => t.status === 'ACTIVE');

    const totalProfit = closedTrades.reduce(
      (sum: number, t: any) => sum + Number(t.profit),
      0,
    );
    const realizedPnL = totalProfit;
    const unrealizedPnL = activeTrades.reduce(
      (sum: number, t: any) => sum + Number(t.profit),
      0,
    );

    const winningTrades = closedTrades.filter(
      (t: any) => Number(t.profit) > 0,
    ).length;
    const winRate =
      closedTrades.length > 0
        ? Number(((winningTrades / closedTrades.length) * 100).toFixed(2))
        : 72.91;

    // Fetch profit distributions
    const profitDistributions = await this.prisma.profitDistribution.findMany({
      where: { userId },
      orderBy: { distributionDate: 'desc' },
    });

    const paidDistributions = profitDistributions.filter(
      (d: any) => d.status === 'PAID',
    );
    const pendingDistributions = profitDistributions.filter(
      (d: any) => d.status === 'PENDING',
    );

    const totalProfitEarned = paidDistributions.reduce(
      (sum: number, d: any) => sum + d.amount,
      0,
    );
    const pendingProfit = pendingDistributions.reduce(
      (sum: number, d: any) => sum + d.amount,
      0,
    );

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthlyProfit = paidDistributions
      .filter((d: any) => {
        const dDate = new Date(d.distributionDate);
        return (
          dDate.getFullYear() === currentYear &&
          dDate.getMonth() === currentMonth
        );
      })
      .reduce((sum: number, d: any) => sum + d.amount, 0);

    const lastDistribution =
      profitDistributions.length > 0
        ? profitDistributions[0].distributionDate
        : null;

    return {
      stats: {
        totalProfit,
        realizedPnL,
        unrealizedPnL,
        winRate,
        activeTradesCount: activeTrades.length,
      },
      wallet: user.wallet,
      trades: trades.map((t: any) => ({
        id: t.id,
        symbol: t.pair,
        side: t.type,
        entry: Number(t.entryPrice),
        exit: Number(t.exitPrice),
        target: Number(t.target),
        stopLoss: Number(t.stopLoss),
        breakeven: Number(t.stopLoss),
        pnl:
          Number(t.pnl) >= 0
            ? `+$${Number(t.pnl).toFixed(2)}`
            : `-$${Math.abs(Number(t.pnl)).toFixed(2)}`,
        rawPnl: Number(t.pnl),
        points: `${Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}`,
        qty: '1.00',
        date: t.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        result: Number(t.pnl) > 0 ? 'WIN' : Number(t.pnl) < 0 ? 'LOSS' : 'BE',
        status: t.status === 'ACTIVE' ? 'Active' : 'Closed',
      })),
      payments: payments.map((p: any) => ({
        id: p.id,
        plan: p.planName,
        amount: `₹${Number(p.amount).toLocaleString('en-IN')}`,
        txnHash: p.txnHash || 'N/A',
        utr: p.utr || 'N/A',
        network: p.network || 'N/A',
        date: p.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: p.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status:
          p.status === 'PENDING'
            ? 'Pending'
            : p.status === 'APPROVED'
              ? 'Approved'
              : p.status === 'REJECTED'
                ? 'Rejected'
                : 'Verified',
      })),
      withdrawals: withdrawals.map((w: any) => ({
        id: w.id,
        amount: `₹${Number(w.amount).toLocaleString('en-IN')}`,
        date: w.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status:
          w.status === 'PENDING'
            ? 'Pending'
            : w.status === 'APPROVED'
              ? 'Approved'
              : 'Rejected',
      })),
      profitDistributions: profitDistributions.map((pd: any) => ({
        id: pd.id,
        reference: pd.reference,
        amount: pd.amount,
        type: pd.type,
        status: pd.status,
        note: pd.note || '',
        distributionDate: pd.distributionDate,
        createdAt: pd.createdAt,
      })),
      profitSummary: {
        totalProfit: totalProfitEarned,
        pendingProfit,
        monthlyProfit,
        lastDistribution,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        autoTrading: user.autoTrading,
        riskSetting: user.riskSetting,
      },
    };
  }

  async initiatePayment(userId: string, partnerId: string, body: any) {
    const { amount, paymentGateway, source, planId } = body;

    let finalAmount = Number(amount) || 0;
    if (planId) {
      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      if (plan && plan.pricingType === 'FIXED' && plan.amount !== null) {
        finalAmount = Number(plan.amount);
      }
    }

    // Attempt to reuse an existing active initiation created in the last 30 minutes
    if (planId) {
      const existing = await this.prisma.paymentInitiation.findFirst({
        where: {
          userId,
          planId,
          status: 'initiated',
          createdAt: {
            gt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes window
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        console.log(
          'Payment initiation reuse short-circuit: returning existing active initiation',
          existing.id,
        );
        return { success: true, initiationId: existing.id };
      }
    }

    const initiation = await this.prisma.paymentInitiation.create({
      data: {
        userId,
        partnerId,
        planId: planId || null,
        amount: finalAmount,
        paymentGateway: paymentGateway || 'usdt',
        paymentType: paymentGateway === 'upi' ? 'UPI' : 'USDT',
        source: source || 'Direct',
        status: 'initiated',
      },
    });
    return { success: true, initiationId: initiation.id };
  }

  async deposit(
    actor: { id: string; role: string; partnerId?: string },
    body: any,
  ) {
    const {
      planName,
      amount,
      txnHash,
      utr,
      paymentType,
      network,
      initiationId,
      idempotencyKey,
      email,
      screenshot,
      remark,
    } = body;

    let finalTxnHash = txnHash ? String(txnHash).trim().toUpperCase() : null;
    let finalUtr = utr ? String(utr).trim().toUpperCase() : null;

    if (paymentType === 'UPI') {
      const reference = finalUtr || finalTxnHash;
      if (!reference) {
        return {
          error: 'UPI Transaction Reference (UTR) is required',
          status: 400,
        };
      }
      const cleanedRef = reference.replace(/[^A-Z0-9]/g, '');
      if (cleanedRef.length < 8) {
        return {
          error:
            'Invalid UPI UTR reference. It must be at least 8 alphanumeric characters.',
          status: 400,
        };
      }
      finalUtr = cleanedRef;
      finalTxnHash = cleanedRef;
    } else if (paymentType === 'USDT' || !paymentType) {
      if (finalTxnHash) {
        finalTxnHash = finalTxnHash.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      }
    }

    if (
      !planName ||
      amount === undefined ||
      amount === null ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return {
        error: 'Plan name and a positive amount are required',
        status: 400,
      };
    }

    const actorUserId = actor.id;
    let targetUserId = actor.id;
    let targetPartnerId = actor.partnerId;

    // ── Resolve target user ─────────────────────────────────────────────────
    if (actor.role !== 'USER') {
      if (!email?.trim()) {
        return {
          error:
            'Target user email is required for admin/partner deposit creation',
          status: 400,
        };
      }

      const normalizedEmail = email.toLowerCase().trim();
      const targetUser = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          isDeleted: false,
          ...(actor.role === 'PARTNER' ? { partnerId: actor.partnerId } : {}),
        },
      });

      if (!targetUser) {
        return { error: `User with email "${email}" not found`, status: 404 };
      }
      if (targetUser.id === actorUserId) {
        return {
          error: 'Admin cannot initiate deposit for self via admin flow',
          status: 400,
        };
      }

      targetUserId = targetUser.id;
      targetPartnerId = targetUser.partnerId;
    }

    // ── Early partnerId validation (before any transaction) ─────────────────
    if (!targetPartnerId) {
      console.error('DEPOSIT FLOW: targetPartnerId is missing', {
        actorUserId,
        targetUserId,
      });
      return {
        error: 'Partner context could not be resolved for target user',
        status: 400,
      };
    }

    // ── Anti-tampering check: verify deposit amount matches plan configuration ─
    let matchedPlan = null;
    if (initiationId) {
      const initiation = await this.prisma.paymentInitiation.findUnique({
        where: { id: initiationId },
        include: { plan: true },
      });
      if (initiation?.plan) {
        matchedPlan = initiation.plan;
      }
    }

    if (!matchedPlan && planName) {
      const cleanName = planName.replace(/\s+\d+\s+Days$/i, '').trim();
      matchedPlan = await this.prisma.plan.findFirst({
        where: {
          OR: [{ name: planName }, { name: cleanName }],
          isActive: true,
        },
      });
    }

    if (matchedPlan) {
      if (matchedPlan.pricingType === 'FIXED') {
        const expected = new Prisma.Decimal(matchedPlan.amount!);
        const actual = new Prisma.Decimal(amount);
        if (!expected.equals(actual)) {
          return {
            error: `Invalid payment amount. The ${planName} plan requires a deposit of ${expected.toString()}.`,
            status: 400,
          };
        }
      } else if (matchedPlan.pricingType === 'FLEXIBLE') {
        const PLAN_MIN_AMOUNTS: Record<string, number> = {
          club: 10,
          individual: 1000,
          custom: 5000,
        };
        const slug =
          matchedPlan.slug || matchedPlan.name.split(' ')[0].toLowerCase();
        const minAllowed = PLAN_MIN_AMOUNTS[slug] || 1;
        if (Number(amount) < minAllowed) {
          return {
            error: `Invalid payment amount. The ${matchedPlan.name} plan requires a minimum deposit of $${minAllowed} USDT.`,
            status: 400,
          };
        }
      }
    }

    // ── Pre-DB Logging ────────────────────────────────────────────────────────
    console.log('DEPOSIT FLOW:', {
      actor: actorUserId,
      role: actor.role,
      targetUserId,
      targetPartnerId,
      amount: Number(amount),
      initiationId: initiationId || null,
      idempotencyKey: idempotencyKey || null,
      email: email || null,
    });

    // ── Pre-transaction idempotency short-circuit ────────────────────────────
    // If this idempotencyKey was already used, return the cached payment immediately.
    // This avoids unnecessary transaction overhead on duplicate requests.
    if (idempotencyKey) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: { idempotencyKey },
      });
      if (existingPayment) {
        // Guard: ensure the key isn't being reused with mismatching parameters (prevents exploits)
        const expectedDec = new Prisma.Decimal(existingPayment.amount);
        const actualDec = new Prisma.Decimal(amount);
        const amountMismatch = !expectedDec.equals(actualDec);
        const planMismatch = existingPayment.planName !== planName;
        const initiationMismatch =
          initiationId && existingPayment.initiationId !== initiationId;

        if (amountMismatch || planMismatch || initiationMismatch) {
          console.error(
            'DEPOSIT FLOW: idempotency key reused with mismatching parameters',
            {
              idempotencyKey,
              existing: {
                amount: expectedDec.toString(),
                planName: existingPayment.planName,
                initiationId: existingPayment.initiationId,
              },
              incoming: {
                amount: actualDec.toString(),
                planName,
                initiationId,
              },
            },
          );
          return {
            error:
              'Idempotency key reused with mismatching payment parameters (amount, plan, or intent mismatch). Use a new key.',
            status: 409,
          };
        }
        console.log(
          'DEPOSIT FLOW: idempotency short-circuit — returning cached payment',
          existingPayment.id,
        );
        return { success: true, payment: existingPayment, cached: true };
      }
    }

    // ── Atomic PI state lock (CAS: initiated → processing) ──────────────────
    // Uses updateMany so no separate read is needed — eliminates the race window.
    // If two requests reach here simultaneously, only one will get count === 1.
    let piLocked = false;
    if (initiationId) {
      const lockResult = await this.prisma.paymentInitiation.updateMany({
        where: { id: initiationId, status: 'initiated' },
        data: { status: 'processing', processingAt: new Date() },
      });
      piLocked = lockResult.count === 1;

      if (!piLocked) {
        // Check why: is it already processing/completed, or does it not exist?
        const pi = await this.prisma.paymentInitiation.findUnique({
          where: { id: initiationId },
        });
        if (!pi) {
          return { error: 'Payment initiation record not found', status: 404 };
        }
        if (pi.status === 'completed') {
          return {
            error: 'This payment initiation has already been completed',
            status: 409,
          };
        }
        if (pi.status === 'processing') {
          return {
            error: 'This payment is already being processed. Please wait.',
            status: 409,
          };
        }
        return {
          error: `Payment initiation is in an invalid state: ${pi.status}`,
          status: 409,
        };
      }
    }

    // ── ACID transaction: create Payment + complete PI ────────────────────────
    let payment: any;
    try {
      payment = await this.prisma.$transaction(async (tx: any) => {
        // Create the payment record
        const newPayment = await tx.payment.create({
          data: {
            userId: targetUserId,
            partnerId: targetPartnerId,
            planName,
            amount: Number(amount),
            currency: 'INR',
            paymentType: paymentType || 'USDT',
            network: network || null,
            txnHash: finalTxnHash || null,
            utr: finalUtr || null,
            screenshot: screenshot || null,
            remark: remark || null,
            status: 'PENDING',
            initiationId: initiationId || null,
            idempotencyKey: idempotencyKey || null,
          },
        });

        // Idempotent PI completion — only updates if still "processing" (safe against double-update)
        if (initiationId && piLocked) {
          await tx.paymentInitiation.updateMany({
            where: { id: initiationId, status: 'processing' },
            data: {
              status: 'completed',
              completedAt: new Date(),
              converted: true,
              followUpStatus: 'CONVERTED',
              amount: Number(amount), // Lock final amount
              paymentType: paymentType || 'USDT',
            },
          });
        }

        return newPayment;
      });
    } catch (err: any) {
      // P2002 = unique constraint violation (duplicate idempotencyKey or initiationId)
      // This is the hard safety net — DB-level protection catches any race that slipped through.
      if (err?.code === 'P2002') {
        console.warn(
          'DEPOSIT FLOW: P2002 unique constraint — recovering cached payment',
          {
            idempotencyKey,
            initiationId,
            target: err?.meta?.target,
          },
        );

        // Roll back PI lock if we held it (PI stays processing but payment didn't create — reset to initiated)
        if (initiationId && piLocked) {
          await this.prisma.paymentInitiation
            .updateMany({
              where: { id: initiationId, status: 'processing' },
              data: { status: 'initiated', processingAt: null },
            })
            .catch((e) =>
              console.error('DEPOSIT FLOW: Failed to reset PI after P2002', e),
            );
        }

        // Return the existing payment (idempotent recovery with strict verification)
        const cached = await this.prisma.payment.findFirst({
          where: {
            ...(idempotencyKey ? { idempotencyKey } : {}),
            ...(initiationId ? { initiationId } : {}),
          },
        });
        if (cached) {
          const expectedDec = new Prisma.Decimal(cached.amount);
          const actualDec = new Prisma.Decimal(amount);
          const amountMismatch = !expectedDec.equals(actualDec);
          const planMismatch = cached.planName !== planName;
          const initiationMismatch =
            initiationId && cached.initiationId !== initiationId;

          if (amountMismatch || planMismatch || initiationMismatch) {
            console.error(
              'DEPOSIT FLOW: idempotency key reused with mismatching parameters during P2002 race recovery',
              {
                idempotencyKey,
                existing: {
                  amount: expectedDec.toString(),
                  planName: cached.planName,
                  initiationId: cached.initiationId,
                },
                incoming: {
                  amount: actualDec.toString(),
                  planName,
                  initiationId,
                },
              },
            );
            return {
              error:
                'Idempotency key reused with mismatching payment parameters (amount, plan, or intent mismatch). Use a new key.',
              status: 409,
            };
          }
          console.log(
            'DEPOSIT FLOW: idempotency short-circuit via P2002 recovery — returning cached payment',
            cached.id,
          );
          return { success: true, payment: cached, cached: true };
        }
      }

      console.error('DEPOSIT FLOW: Transaction failed', err);
      // If PI was locked but transaction failed, roll back PI status
      if (initiationId && piLocked) {
        await this.prisma.paymentInitiation
          .updateMany({
            where: { id: initiationId, status: 'processing' },
            data: { status: 'initiated', processingAt: null },
          })
          .catch((e) =>
            console.error(
              'DEPOSIT FLOW: Failed to reset PI on transaction error',
              e,
            ),
          );
      }
      return { error: err?.message || 'Payment creation failed', status: 500 };
    }

    // ── Side effects (outside transaction — decoupled from request lifecycle) ─
    this.notificationsService
      .sendToUser(targetUserId, NotificationEvent.PAYMENT_SUBMITTED, {
        amount: Number(payment.amount),
      })
      .catch((err) =>
        console.error(
          `Failed to send PAYMENT_SUBMITTED notification for user ${targetUserId}`,
          err,
        ),
      );

    if (actor.role !== 'USER') {
      this.notificationsService
        .logAdminAudit(
          actorUserId,
          'PAYMENT_CREATED_BY_ADMIN',
          'Payment',
          payment.id,
          { targetUserId, targetUserEmail: email },
        )
        .catch((err) =>
          console.error(
            'Failed to log admin audit for manual payment creation',
            err,
          ),
        );
    }

    return { success: true, payment };
  }

  async withdraw(userId: string, partnerId: string, amount: number) {
    const requestAmount = Number(amount);
    if (!requestAmount || requestAmount <= 0) {
      return {
        error: 'A valid positive withdrawal amount is required',
        status: 400,
      };
    }

    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        // 1. Get Wallet balance and verify
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        const available = Number(wallet.availableBalance);

        if (available < requestAmount) {
          throw new Error(
            `Insufficient funds. Available: ₹${available.toLocaleString('en-IN')}`,
          );
        }

        const sequence = await tx.withdrawal.count();
        const withdrawalId = `WD-${String(sequence + 1001).padStart(6, '0')}`;

        // Create pending withdrawal record
        const withdrawal = await tx.withdrawal.create({
          data: {
            withdrawalId,
            userId,
            partnerId,
            amount: requestAmount,
            currency: 'INR',
            status: 'PENDING',
            method: 'Bank Transfer',
          },
        });

        // Update wallet atomically
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: available - requestAmount,
            pendingWithdrawals:
              Number(wallet.pendingWithdrawals) + requestAmount,
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

      return { success: true, withdrawal: result };
    } catch (error: any) {
      return { error: error.message || 'Withdrawal failed', status: 400 };
    }
  }

  async updateSettings(
    userId: string,
    body: { autoTrading?: boolean; riskSetting?: string },
  ) {
    const dataToUpdate: any = {};
    if (typeof body.autoTrading === 'boolean') {
      dataToUpdate.autoTrading = body.autoTrading;
    }
    if (
      body.riskSetting &&
      ['LOW', 'MEDIUM', 'HIGH'].includes(body.riskSetting)
    ) {
      dataToUpdate.riskSetting = body.riskSetting;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return { error: 'No valid settings to update', status: 400 };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        autoTrading: updatedUser.autoTrading,
        riskSetting: updatedUser.riskSetting,
      },
    };
  }

  async getMyPaymentStatus(userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      return { success: false, found: false, status: null };
    }

    const planSlug = payment.planName
      ? payment.planName.split(' ')[0].toLowerCase()
      : 'individual';

    return {
      success: true,
      found: true,
      status: payment.status,
      plan: planSlug,
      planName: payment.planName,
      amount: Number(payment.amount),
      remark: payment.remark || null,
      adminNote: payment.remark || null,
      subscriptionActive: payment.status === 'APPROVED',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      message: payment.status === 'PENDING' || payment.status === 'VERIFIED' ? 'Payment is under review' : undefined,
    };
  }
}
