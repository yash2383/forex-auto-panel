import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma, NotificationEvent } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/crypto.util';
import {
  createTransactionGroup,
  reverseTransactionGroup,
} from '../common/ledger.util';
import { NotificationsService } from '../notifications/notifications.service';
import { ObservabilityService } from '../observability/observability.service';
import { sendFcmTopicMessage, unsubscribeFromTopic } from '../notifications/firebase-admin';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    public prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async onModuleInit() {
    await this.validateSettingsOnStartup();
  }

  async validateSettingsOnStartup() {
    this.logger.log('Running Startup Settings & Configuration Health Check...');
    try {
      const systemSettings = await this.prisma.systemSettings.findFirst();
      if (!systemSettings) {
        this.logger.error(
          '[STARTUP_ERROR] SystemSettings row is missing in the database. Please seed the database.',
        );
        this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'system' });
      } else {
        if (
          systemSettings.platformProfitCut === null ||
          systemSettings.platformProfitCut === undefined
        ) {
          this.logger.error(
            '[STARTUP_ERROR] SystemSettings.platformProfitCut is null/undefined.',
          );
          this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'system' });
        } else {
          const cut = Number(systemSettings.platformProfitCut);
          if (cut < 0 || cut > 100) {
            this.logger.error(
              `[STARTUP_ERROR] SystemSettings.platformProfitCut (${cut}) is out of bounds (0-100).`,
            );
            this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'system' });
          }
        }

        if (
          systemSettings.maintenanceMode === null ||
          systemSettings.maintenanceMode === undefined
        ) {
          this.logger.error(
            '[STARTUP_ERROR] SystemSettings.maintenanceMode is null/undefined.',
          );
          this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'system' });
        }
      }

      const referralSettings = await this.prisma.referralSettings.findFirst();
      if (!referralSettings) {
        this.logger.error(
          '[STARTUP_ERROR] ReferralSettings row is missing in the database. Please seed the database.',
        );
        this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'referral' });
      } else {
        if (
          referralSettings.commissionRate === null ||
          referralSettings.commissionRate === undefined
        ) {
          this.logger.error(
            '[STARTUP_ERROR] ReferralSettings.commissionRate is null/undefined.',
          );
          this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'referral' });
        } else {
          const rate = Number(referralSettings.commissionRate);
          if (rate < 0 || rate > 100) {
            this.logger.error(
              `[STARTUP_ERROR] ReferralSettings.commissionRate (${rate}) is out of bounds (0-100).`,
            );
            this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'referral' });
          }
        }
      }
    } catch (e: any) {
      this.logger.error(
        `[STARTUP_ERROR] Failed to run startup settings validator: ${e.message}`,
      );
      this.observabilityService.increment('settings_validation_failures_total', { settings_type: 'system' });
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+plan$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async getData() {
    const [
      dbUsers,
      dbPayments,
      dbTrades,
      dbLogs,
      dbPartners,
      dbSettings,
      dbCampaigns,
      dbReferrals,
      dbAdmins,
      dbWithdrawals,
      dbPlans,
      dbProfitDistributions,
      dbReferralSettings,
      dbGeneratedReports,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { isDeleted: false },
        include: {
          wallet: true,
          partner: true,
          userPlans: {
            where: { active: true },
            include: { plan: true },
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tradeRecord.findMany({ orderBy: { tradeDate: 'desc' } }),
      this.prisma.securityEvent.findMany({
        include: { admin: true, user: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.partner.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.systemSettings.findFirst(),
      this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.referral.findMany({
        orderBy: { createdAt: 'desc' },
        include: { reward: true },
      }),
      this.prisma.admin.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.withdrawal.findMany({
        include: { user: { include: { wallet: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.profitDistribution.findMany({
        include: { user: true },
        orderBy: { distributionDate: 'desc' },
      }),
      this.prisma.referralSettings.findFirst(),
      this.prisma.generatedReport.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const users = dbUsers.map((u) => {
      const activeUserPlan = u.userPlans?.[0];
      const plan = activeUserPlan?.plan?.name || 'None';

      let statusLabel = 'New';
      if (u.status === 'ACTIVE') statusLabel = 'Active';
      else if (u.status === 'VIP') statusLabel = 'VIP';
      else if (u.status === 'EXPIRED') statusLabel = 'Expired';
      else if (u.status === 'BLOCKED') statusLabel = 'Blocked';

      const balance = u.wallet ? Number(u.wallet.realizedBalance) : 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        campaign: u.campaignCode || 'Direct',
        deposit: `$${balance.toLocaleString('en-US')}`,
        rawDeposit: balance,
        plan,
        status: statusLabel,
        partnerId: u.partnerId,
        partnerName: u.partner?.name || 'N/A',
        isVerified: u.isVerified,
      };
    });

    const payments = dbPayments.map((p: any) => {
      let statusLabel = 'Pending';
      let dotColor = 'bg-yellow-400';
      if (p.status === 'APPROVED') {
        statusLabel = 'Approved';
        dotColor = 'bg-green-400';
      } else if (p.status === 'REJECTED') {
        statusLabel = 'Rejected';
        dotColor = 'bg-red-400';
      } else if (p.status === 'VERIFIED') {
        statusLabel = 'Verified';
        dotColor = 'bg-blue-400';
      }

      return {
        id: p.id,
        user: p.user?.name || 'Unknown User',
        email: p.user?.email || '',
        initials: (p.user?.name || 'U')
          .split(' ')
          .map((n: any) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        plan: p.planName,
        amount: `$${Number(p.amount).toLocaleString('en-US')}`,
        rawAmount: Number(p.amount),
        utr: p.utr || '',
        txnHash: p.txnHash || '',
        network: p.network || 'TRC20',
        screenshot: p.screenshot || '',
        date: p.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: p.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        dot: dotColor,
        status: statusLabel,
        paymentType: p.paymentType,
        remark: p.remark || '',
      };
    });

    const trades = dbTrades.map((t: any) => ({
      id: t.id,
      pair: t.pair,
      side: t.side,
      entryPrice: Number(t.entryPrice),
      exitPrice: Number(t.exitPrice),
      tradeDate: t.tradeDate,
      result: t.result,
      profitLoss: Number(t.profitLoss),
      notes: t.notes || '',
      status: t.status,
    }));

    const logs = dbLogs.map((l) => ({
      id: l.id,
      actor: l.admin?.name || l.user?.name || 'System',
      action: l.action,
      module: l.action.split('_')[0] || 'System',
      targetId: l.userId || l.adminId || '',
      time:
        l.createdAt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }) +
        ' - ' +
        l.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      status: 'Success',
      ipAddress: l.ipAddress || '127.0.0.1',
    }));

    const partners = dbPartners.map((p: any) => ({
      id: p.slug,
      rawId: p.id,
      name: p.name,
      companyName: p.companyName,
      email: p.email,
      profitShare: Number(p.profitSharePct),
      maxAllowedShare: Number(p.maxAllowedPct),
      domain: p.domain,
      logo: p.logo || p.name.slice(0, 2).toUpperCase(),
      usersCount: dbUsers.filter((u) => u.partnerId === p.id).length,
      revenue: Number(
        dbPayments
          .filter((pay) => pay.partnerId === p.id && pay.status === 'APPROVED')
          .reduce((sum, pay) => sum + Number(pay.amount), 0),
      ),
      withdrawn: Number(
        dbWithdrawals
          .filter((w: any) => w.partnerId === p.id && w.status === 'APPROVED')
          .reduce((sum: number, w: any) => sum + Number(w.amount), 0),
      ),
      status: p.status === 'ACTIVE' ? 'Active' : 'Suspended',
    }));

    const campaigns = dbCampaigns.map((c) => {
      const campUsers = dbUsers.filter((u) => u.campaignCode === c.slug && u.partnerId === c.partnerId);
      const usersCount = campUsers.length;

      const campPayments = dbPayments.filter((p: any) => p.status === 'APPROVED' && campUsers.some((u) => u.id === p.userId));
      const approvedDepositsCount = campPayments.length;
      const revenueVal = campPayments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        code: c.slug,
        trackingLink: `/register?campaign=${c.slug}`,
        users: usersCount,
        revenue: `$${Number(revenueVal).toLocaleString('en-US')}`,
        deposits: approvedDepositsCount,
        status: c.isActive ? 'Active' : 'Paused',
        source: 'Direct',
        budget: '0',
        startDate: '',
        endDate: '',
      };
    });

    const referrals = dbReferrals.map((r: any) => {
      const referrerUser = dbUsers.find((u) => u.id === r.referrerId);
      const referredUser = dbUsers.find((u) => u.id === r.referredId);
      return {
        id: r.id,
        referrer: referrerUser?.name || 'Unknown',
        referrerId: r.referrerId,
        user: referredUser?.name || 'Unknown',
        deposit: r.reward?.depositAmount
          ? `$${Number(r.reward.depositAmount).toLocaleString('en-US')}`
          : referredUser?.wallet
            ? `$${Number(referredUser.wallet.realizedBalance).toLocaleString('en-US')}`
            : '$0',
        reward: `$${Number(r.reward?.commissionAmount || 0).toLocaleString('en-US')}`,
        status:
          r.status === 'PENDING'
            ? 'Pending'
            : r.status === 'PAID'
              ? 'Paid'
              : r.status === 'APPROVED'
                ? 'Approved'
                : r.status === 'REJECTED'
                  ? 'Rejected'
                  : 'Cancelled',
        rewardDetails: r.reward ? {
          planName: r.reward.planName,
          depositAmount: Number(r.reward.depositAmount || 0),
          platformFeePercent: Number(r.reward.platformFeePercent || 0),
          platformFeeAmount: Number(r.reward.platformFeeAmount || 0),
          referralRate: Number(r.reward.referralRate || 0),
          commissionAmount: Number(r.reward.commissionAmount || 0),
          approvedAt: r.reward.approvedAt,
          paidAt: r.reward.paidAt,
        } : null,
      };
    });

    const admins = dbAdmins.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      role:
        a.role === 'SUPER_ADMIN'
          ? 'Super Admin'
          : a.role === 'MANAGER'
            ? 'Manager'
            : 'Viewer',
      status: a.status === 'ACTIVE' ? 'Active' : 'Suspended',
      permissions:
        typeof a.permissions === 'string'
          ? JSON.parse(a.permissions)
          : a.permissions,
    }));

    const transactions = [
      ...dbWithdrawals
        .filter((w: any) => w.status === 'APPROVED')
        .map((w: any) => ({
          id: w.id,
          withdrawalId: w.withdrawalId,
          userId: w.userId,
          userName: w.user?.name || 'Unknown User',
          userEmail: w.user?.email || 'N/A',
          type: 'Withdrawal',
          amount: Number(w.amount),
          rawAmount: Number(w.amount),
          method: w.method || 'Bank Transfer',
          accountDetails: w.accountDetails || '',
          notes: w.notes || '',
          status: 'Approved',
          currentEquity: w.user?.wallet
            ? Number(w.user.wallet.currentEquity)
            : 0,
          availableBalance: w.user?.wallet
            ? Number(w.user.wallet.availableBalance)
            : 0,
          pendingWithdrawals: w.user?.wallet
            ? Number(w.user.wallet.pendingWithdrawals)
            : 0,
          requestedAt: w.createdAt,
          processedAt: w.processedAt,
          date: w.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time: w.createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
      ...dbPayments
        .filter((p: any) => p.status === 'APPROVED')
        .map((p: any) => ({
          id: p.id,
          userId: p.userId,
          userName: p.user?.name || 'Unknown User',
          userEmail: p.user?.email || 'N/A',
          type: 'Deposit',
          amount: Number(p.amount),
          rawAmount: Number(p.amount),
          method: p.paymentType,
          status: 'Approved',
          date: p.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          time: p.createdAt.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalUsers = dbUsers.length;
    const activeUsers = dbUsers.filter(
      (u) => u.status === 'ACTIVE' || u.status === 'VIP',
    ).length;
    const totalRevenue = dbPayments
      .filter((p: any) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalUserWalletBalance = dbUsers.reduce(
      (sum, u) => sum + (u.wallet ? Number(u.wallet.realizedBalance) : 0),
      0,
    );
    const pendingPayments = dbPayments.filter(
      (p: any) => p.status === 'PENDING',
    ).length;
    const totalCapital = dbUsers.reduce(
      (sum, u) => sum + (u.wallet ? Number(u.wallet.currentEquity) : 0),
      0,
    );
    const activeWalletBalance = dbUsers
      .filter((u) => u.status === 'ACTIVE' || u.status === 'VIP')
      .reduce(
        (sum, u) => sum + (u.wallet ? Number(u.wallet.availableBalance) : 0),
        0,
      );
    const totalProfit = dbProfitDistributions
      .filter((pd: any) => pd.status === 'COMPLETED')
      .reduce((sum, pd: any) => sum + Number(pd.netProfit ?? 0), 0);

    const platformStats = {
      totalUsers: totalUsers.toLocaleString(),
      activeUsers: activeUsers.toLocaleString(),
      totalRevenue: `$${totalRevenue.toLocaleString('en-US')}`,
      totalUserWalletBalance: `$${totalUserWalletBalance.toLocaleString('en-US')}`,
      totalCapital: `$${totalCapital.toLocaleString('en-US')}`,
      activeWalletBalance: `$${activeWalletBalance.toLocaleString('en-US')}`,
      pendingPayments: pendingPayments.toLocaleString(),
      totalProfit: `$${totalProfit.toLocaleString('en-US')}`,
    };

    if (dbSettings) {
      if (
        Number(dbSettings.platformProfitCut ?? 30) !==
        Number(dbSettings.platformFeePct ?? 30)
      ) {
        this.logger.warn({
          event: 'SETTINGS_DIVERGENCE',
          field: 'platformProfitCut',
          legacy: Number(dbSettings.platformFeePct ?? 30),
          canonical: Number(dbSettings.platformProfitCut ?? 30),
        });
        this.observabilityService.increment('settings_divergence_total', { field: 'platformProfitCut' });
      }
      if (
        Boolean(dbSettings.maintenanceMode) !== Boolean(dbSettings.maintenance)
      ) {
        this.logger.warn({
          event: 'SETTINGS_DIVERGENCE',
          field: 'maintenanceMode',
          legacy: Boolean(dbSettings.maintenance),
          canonical: Boolean(dbSettings.maintenanceMode),
        });
        this.observabilityService.increment('settings_divergence_total', { field: 'maintenanceMode' });
      }
      if (
        Boolean(dbSettings.enableBulkDistribution ?? true) !==
        Boolean(dbSettings.enableBulkDist ?? true)
      ) {
        this.logger.warn({
          event: 'SETTINGS_DIVERGENCE',
          field: 'enableBulkDistribution',
          legacy: Boolean(dbSettings.enableBulkDist ?? true),
          canonical: Boolean(dbSettings.enableBulkDistribution ?? true),
        });
        this.observabilityService.increment('settings_divergence_total', { field: 'enableBulkDistribution' });
      }
      if (
        Boolean(dbSettings.allowDuplicateWeeklyPayouts ?? false) !==
        Boolean(dbSettings.allowDuplicateDist ?? false)
      ) {
        this.logger.warn({
          event: 'SETTINGS_DIVERGENCE',
          field: 'allowDuplicateWeeklyPayouts',
          legacy: Boolean(dbSettings.allowDuplicateDist ?? false),
          canonical: Boolean(dbSettings.allowDuplicateWeeklyPayouts ?? false),
        });
        this.observabilityService.increment('settings_divergence_total', { field: 'allowDuplicateWeeklyPayouts' });
      }
    }

    const settings = {
      upiId: dbSettings?.upiId || '',
      upiName: dbSettings?.upiName || '',
      upiQrCode: dbSettings?.upiQrCode || '',
      usdt: {
        network: dbSettings?.usdtNetwork || 'TRC20',
        walletAddress: dbSettings?.usdtAddress || '',
        usdtQrCode: dbSettings?.usdtQrCode || '',
      },
      financials: {
        platformFee: Number(
          dbSettings?.platformProfitCut ?? dbSettings?.platformFeePct ?? 30,
        ),
        referralFee: Number(dbSettings?.referralFeePct || 10),
      },
      system: {
        maintenanceMode:
          dbSettings?.maintenanceMode ?? dbSettings?.maintenance ?? false,
      },
      paymentModes: {
        upi: dbSettings?.upiEnabled ?? false,
        bank: false,
        usdt: dbSettings?.usdtEnabled ?? true,
      },
      profitDist: {
        individualProfitPct: Number(dbSettings?.individualProfitPct ?? 5.0),
        clubProfitPct: Number(dbSettings?.clubProfitPct ?? 7.0),
        enableBulkDist:
          dbSettings?.enableBulkDistribution ??
          dbSettings?.enableBulkDist ??
          true,
        allowDuplicateDist:
          dbSettings?.allowDuplicateWeeklyPayouts ??
          dbSettings?.allowDuplicateDist ??
          false,
      },
    };

    const profitDistributions = dbProfitDistributions.map((pd: any) => ({
      id: pd.id,
      reference: pd.reference,
      userId: pd.userId,
      userName: pd.user?.name || 'Unknown',
      userEmail: pd.user?.email || '',
      // Legacy: expose netProfit as 'amount' for frontend backward compat
      amount: Number(pd.netProfit ?? 0),
      netProfit: Number(pd.netProfit ?? 0),
      grossProfit: Number(pd.grossProfit ?? 0),
      platformCut: Number(pd.platformCut ?? 0),
      investmentAmount: Number(pd.investmentAmount ?? 0),
      type: pd.type,
      status: pd.status,
      weekKey: pd.weekKey,
      note: pd.note || '',
      distributionDate: pd.distributionDate,
      createdAt: pd.createdAt,
    }));

    const withdrawals = dbWithdrawals.map((w: any) => ({
      id: w.id,
      withdrawalId: w.withdrawalId,
      userId: w.userId,
      userName: w.user?.name || 'Unknown User',
      userEmail: w.user?.email || 'N/A',
      amount: Number(w.amount),
      rawAmount: Number(w.amount),
      method: w.method || 'Bank Transfer',
      accountDetails: w.accountDetails || '',
      notes: w.notes || '',
      status:
        w.status === 'PENDING'
          ? 'Pending'
          : w.status === 'APPROVED'
            ? 'Approved'
            : 'Rejected',
      currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
      availableBalance: w.user?.wallet
        ? Number(w.user.wallet.availableBalance)
        : 0,
      pendingWithdrawals: w.user?.wallet
        ? Number(w.user.wallet.pendingWithdrawals)
        : 0,
      requestedAt: w.createdAt,
      processedAt: w.processedAt,
      date: w.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: w.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    const generatedReports = dbGeneratedReports.map((gr: any) => ({
      id: gr.id,
      userId: gr.userId,
      userName: gr.user?.name || 'Unknown User',
      userEmail: gr.user?.email || 'N/A',
      partnerId: gr.user?.partnerId || '',
      fileName: gr.fileName,
      reportType: gr.reportType,
      fileUrl: gr.fileUrl,
      createdAt: gr.createdAt,
    }));

    return {
      stats: platformStats,
      users,
      payments,
      trades,
      logs,
      partners,
      campaigns,
      referrals,
      admins,
      transactions,
      settings,
      profitDistributions,
      withdrawals,
      plans: dbPlans.map((p: any) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        capitalLabel: p.capitalLabel,
        desc: p.desc,
        features: p.features,
        btnText: p.btnText,
        status: p.status,
        isPopular: p.isPopular,
        amount:
          p.amount !== null && p.amount !== undefined ? Number(p.amount) : null,
        weeklyProfit: Number(p.weeklyProfit ?? 0),
        durationDays: Number(p.durationDays ?? 0),
        pricingType: p.pricingType || 'FIXED',
        platformFeePercent: Number(p.platformFeePercent ?? 4.00),
        referralEligible: !!p.referralEligible,
      })),
      referralSettings: dbReferralSettings,
      generatedReports,
    };
  }

  async createUser(adminId: string, body: any, clientIp: string) {
    const { name, email, password, partnerId, plan, deposit } = body;
    if (!name || !email || !password)
      return { error: 'Name, email and password are required', status: 400 };

    let targetPartnerId = partnerId;
    if (!targetPartnerId) {
      const partner = await this.prisma.partner.findFirst();
      if (!partner)
        return {
          error: 'No white-label partners exist. Create a partner first.',
          status: 400,
        };
      targetPartnerId = partner.id;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        partnerId: targetPartnerId,
        email: email.toLowerCase().trim(),
        isDeleted: false,
      },
    });
    if (existing)
      return {
        error: 'User email already exists under this partner',
        status: 400,
      };

    let userStatus = 'NEW';
    if (plan === 'Basic') userStatus = 'ACTIVE';
    else if (plan === 'Premium') userStatus = 'VIP';
    else if (plan === 'Pro') userStatus = 'ACTIVE';
    else if (plan === 'VIP') userStatus = 'VIP';

    const cleanDeposit = deposit
      ? Number(String(deposit).replace(/[^\d.-]/g, ''))
      : 0;

    const user = await this.prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          partnerId: targetPartnerId,
          name,
          email: email.toLowerCase().trim(),
          passwordHash: hashPassword(password),
          status: userStatus as any,
        },
      });
      await tx.wallet.create({
        data: {
          userId: u.id,
          realizedBalance: isNaN(cleanDeposit) ? 0 : cleanDeposit,
          unrealizedBalance: 0,
          currentEquity: isNaN(cleanDeposit) ? 0 : cleanDeposit,
          availableBalance: isNaN(cleanDeposit) ? 0 : cleanDeposit,
          pendingWithdrawals: 0,
          totalWithdrawn: 0,
          currency: 'USD',
        },
      });
      return u;
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId: user.id,
        partnerId: targetPartnerId,
        action: 'USER_CREATE',
        reason: `Manually created user ${user.email}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, user };
  }

  async updateUser(
    adminId: string,
    userId: string,
    body: any,
    clientIp: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found', status: 404 };

    const { name, email, plan, deposit, status } = body;
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();

    if (status !== undefined) {
      if (status === 'Active') updateData.status = 'ACTIVE';
      else if (status === 'Blocked') updateData.status = 'BLOCKED';
      else if (status === 'VIP') updateData.status = 'VIP';
      else if (status === 'New') updateData.status = 'NEW';
      else if (status === 'Expired') updateData.status = 'EXPIRED';
    } else if (plan !== undefined) {
      if (plan === 'Basic') updateData.status = 'ACTIVE';
      else if (plan === 'Premium') updateData.status = 'VIP';
      else if (plan === 'None') updateData.status = 'NEW';
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (updateData.status === 'BLOCKED') {
      this.notificationsService
        .sendToUser(userId, NotificationEvent.ACCOUNT_BLOCKED, {})
        .catch((err) =>
          console.error(
            `Failed to send ACCOUNT_BLOCKED notification for user ${userId}`,
            err,
          ),
        );
        
      this.prisma.deviceToken.findMany({ where: { userId } }).then(tokens => {
        tokens.forEach(t => {
          unsubscribeFromTopic(t.token, 'daily_profit').catch((err: any) => console.error(`Unsubscribe failed for ${t.token}:`, err.message));
        });
      }).catch((err: any) => console.error("Failed fetching tokens for unsubscribe:", err.message));
    }

    if (deposit !== undefined) {
      const cleanDeposit = Number(String(deposit).replace(/[^\d.-]/g, ''));
      if (!isNaN(cleanDeposit)) {
        await this.prisma.wallet.update({
          where: { userId },
          data: { realizedBalance: cleanDeposit },
        });
      }
    }

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId,
        partnerId: user.partnerId,
        action: 'USER_UPDATE',
        reason: `Updated user details. Modified fields: ${Object.keys(
          updateData,
        )
          .concat(deposit !== undefined ? ['deposit'] : [])
          .join(', ')}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, user: updatedUser };
  }

  async deleteUser(adminId: string, userId: string, clientIp: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found', status: 404 };

    await this.prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true },
    });

    this.prisma.deviceToken.findMany({ where: { userId } }).then(tokens => {
      tokens.forEach(t => {
        unsubscribeFromTopic(t.token, 'daily_profit').catch((err: any) => console.error(`Unsubscribe failed for ${t.token}:`, err.message));
      });
    }).catch((err: any) => console.error("Failed fetching tokens for unsubscribe:", err.message));

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId,
        partnerId: user.partnerId,
        action: 'USER_DELETE',
        reason: `Soft deleted user ${user.email}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, message: 'User soft deleted successfully' };
  }

  async createPartner(adminId: string, body: any, clientIp: string) {
    const {
      name,
      companyName,
      email,
      password,
      profitShare,
      maxAllowedShare,
      domain,
      logo,
    } = body;
    if (!name || !companyName || !email || !password || !domain)
      return { error: 'Missing required partner fields', status: 400 };

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedDomain = domain.toLowerCase().trim();

    const existing = await this.prisma.partner.findFirst({
      where: {
        OR: [
          { slug },
          { email: normalizedEmail },
          { domain: normalizedDomain },
        ],
      },
    });
    if (existing)
      return {
        error: 'Partner with similar name, email, or domain already exists',
        status: 400,
      };

    const partner = await this.prisma.partner.create({
      data: {
        slug,
        name,
        companyName,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        profitSharePct: Number(profitShare || 30.0),
        maxAllowedPct: Number(maxAllowedShare || 40.0),
        domain: normalizedDomain,
        logo: logo || name.slice(0, 2).toUpperCase(),
        status: 'ACTIVE',
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'PARTNER_CREATE',
        reason: `Created white-label partner ${name} (${slug})`,
        ipAddress: clientIp,
      },
    });

    return { success: true, partner };
  }

  async createPlan(adminId: string, body: any, clientIp: string) {
    const {
      name,
      subtitle,
      capitalLabel,
      desc,
      features,
      btnText,
      status,
      isPopular,
      amount,
      weeklyProfit,
      durationDays,
      pricingType,
      slug,
      platformFeePercent,
      referralEligible,
    } = body;
    if (!name || !subtitle || !capitalLabel || !desc)
      return {
        error: 'Name, subtitle, capital label, and description are required',
        status: 400,
      };

    const typeOfPricing = pricingType || 'FIXED';
    const amountVal =
      amount !== undefined && amount !== null && amount !== ''
        ? Number(amount)
        : null;

    if (amountVal === null && typeOfPricing === 'FIXED') {
      return {
        error: 'Plan must have a fixed amount if pricingType is FIXED.',
        status: 400,
      };
    }

    const platformFeePctVal =
      platformFeePercent !== undefined && platformFeePercent !== null && platformFeePercent !== ''
        ? Number(platformFeePercent)
        : 4.00;
    if (platformFeePctVal < 0 || platformFeePctVal > 100) {
      return {
        error: 'Platform fee percentage must be between 0 and 100.',
        status: 400,
      };
    }

    const plan = await this.prisma.plan.create({
      data: {
        name,
        subtitle,
        capitalLabel,
        desc,
        slug: slug ? this.slugify(slug) : this.slugify(name),
        features: Array.isArray(features) ? features : [],
        btnText: btnText || 'Get Started',
        status: status || 'Active',
        isPopular: !!isPopular,
        amount: typeOfPricing === 'FLEXIBLE' ? null : amountVal,
        pricingType: typeOfPricing,
        weeklyProfit: Number(weeklyProfit) || 5,
        durationDays: Number(durationDays) || 30,
        platformFeePercent: platformFeePctVal,
        referralEligible: referralEligible !== undefined ? !!referralEligible : true,
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'PLAN_CREATE',
        reason: `Created pricing plan ${plan.name}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, plan };
  }

  async updatePlan(
    adminId: string,
    planId: string,
    body: any,
    clientIp: string,
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: 'Plan not found', status: 404 };

    const typeOfPricing = body.pricingType || plan.pricingType;
    let amountVal =
      body.amount !== undefined
        ? body.amount !== null && body.amount !== ''
          ? Number(body.amount)
          : null
        : plan.amount
          ? Number(plan.amount)
          : null;

    if (typeOfPricing === 'FLEXIBLE') {
      amountVal = null;
    } else if (typeOfPricing === 'FIXED' && amountVal === null) {
      return {
        error: 'Plan must have a fixed amount if pricingType is FIXED.',
        status: 400,
      };
    }

    const platformFeePctVal =
      body.platformFeePercent !== undefined && body.platformFeePercent !== null && body.platformFeePercent !== ''
        ? Number(body.platformFeePercent)
        : undefined;
    if (platformFeePctVal !== undefined && (platformFeePctVal < 0 || platformFeePctVal > 100)) {
      return {
        error: 'Platform fee percentage must be between 0 and 100.',
        status: 400,
      };
    }

    const updatedPlan = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        name: body.name ?? plan.name,
        slug:
          body.slug !== undefined
            ? this.slugify(body.slug)
            : body.name !== undefined
              ? this.slugify(body.name)
              : plan.slug,
        subtitle: body.subtitle ?? plan.subtitle,
        capitalLabel: body.capitalLabel ?? plan.capitalLabel,
        desc: body.desc ?? plan.desc,
        features: body.features ?? plan.features,
        btnText: body.btnText ?? plan.btnText,
        status: body.status ?? plan.status,
        isPopular:
          body.isPopular !== undefined ? body.isPopular : plan.isPopular,
        amount: amountVal,
        pricingType: typeOfPricing,
        weeklyProfit:
          body.weeklyProfit !== undefined
            ? Number(body.weeklyProfit)
            : Number(plan.weeklyProfit),
        durationDays:
          body.durationDays !== undefined
            ? Number(body.durationDays)
            : Number(plan.durationDays),
        platformFeePercent: platformFeePctVal !== undefined ? platformFeePctVal : undefined,
        referralEligible: body.referralEligible !== undefined ? !!body.referralEligible : undefined,
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'PLAN_UPDATE',
        reason: `Updated pricing plan ${updatedPlan.name}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, plan: updatedPlan };
  }

  async deletePlan(adminId: string, planId: string, clientIp: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: 'Plan not found', status: 404 };

    await this.prisma.plan.delete({ where: { id: planId } });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'PLAN_DELETE',
        reason: `Deleted pricing plan ${plan.name}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, message: 'Plan deleted successfully' };
  }

  async getSettings() {
    const settings = await this.prisma.systemSettings.findFirst();
    return { success: true, settings };
  }

  async updateSettings(adminId: string, body: any, clientIp: string) {
    const {
      upiId,
      usdtAddress,
      usdtNetwork,
      platformFee,
      referralFee,
      maintenance,
      individualProfitPct,
      clubProfitPct,
      enableBulkDist,
      allowDuplicateDist,
      upiEnabled,
      usdtEnabled,
      upiName,
      upiQrCode,
      usdtQrCode,
    } = body;

    if (upiEnabled === true) {
      if (!upiId || !upiId.trim()) {
        return {
          error: 'UPI ID is required when UPI payment rail is enabled',
          status: 400,
        };
      }
      if (!upiName || !upiName.trim()) {
        return {
          error:
            'UPI Account Name is required when UPI payment rail is enabled',
          status: 400,
        };
      }
    }

    if (usdtEnabled === true) {
      if (!usdtAddress || !usdtAddress.trim()) {
        return {
          error:
            'USDT Wallet Address is required when USDT payment rail is enabled',
          status: 400,
        };
      }
      if (!usdtNetwork || !usdtNetwork.trim()) {
        return {
          error: 'USDT Network is required when USDT payment rail is enabled',
          status: 400,
        };
      }
    }

    if (individualProfitPct !== undefined) {
      const indVal = Number(individualProfitPct);
      if (isNaN(indVal) || indVal < 0 || indVal > 100) {
        return {
          error:
            'Individual Weekly Profit percentage must be between 0 and 100',
          status: 400,
        };
      }
    }

    if (clubProfitPct !== undefined) {
      const clubVal = Number(clubProfitPct);
      if (isNaN(clubVal) || clubVal < 0 || clubVal > 100) {
        return {
          error: 'Club Weekly Profit percentage must be between 0 and 100',
          status: 400,
        };
      }
    }

    const existing = await this.prisma.systemSettings.findFirst();

    let settings;
    if (existing) {
      settings = await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          upiId: upiId !== undefined ? upiId : existing.upiId,
          usdtAddress:
            usdtAddress !== undefined ? usdtAddress : existing.usdtAddress,
          usdtNetwork:
            usdtNetwork !== undefined ? usdtNetwork : existing.usdtNetwork,
          upiEnabled:
            upiEnabled !== undefined
              ? Boolean(upiEnabled)
              : existing.upiEnabled,
          usdtEnabled:
            usdtEnabled !== undefined
              ? Boolean(usdtEnabled)
              : existing.usdtEnabled,
          upiName: upiName !== undefined ? upiName : existing.upiName,
          upiQrCode: upiQrCode !== undefined ? upiQrCode : existing.upiQrCode,
          usdtQrCode:
            usdtQrCode !== undefined ? usdtQrCode : existing.usdtQrCode,
          platformFeePct:
            platformFee !== undefined
              ? Number(platformFee)
              : existing.platformFeePct,
          referralFeePct:
            referralFee !== undefined
              ? Number(referralFee)
              : existing.referralFeePct,
          maintenance:
            maintenance !== undefined
              ? Boolean(maintenance)
              : existing.maintenance,
          individualProfitPct:
            individualProfitPct !== undefined
              ? Number(individualProfitPct)
              : existing.individualProfitPct,
          clubProfitPct:
            clubProfitPct !== undefined
              ? Number(clubProfitPct)
              : existing.clubProfitPct,
          enableBulkDist:
            enableBulkDist !== undefined
              ? Boolean(enableBulkDist)
              : existing.enableBulkDist,
          allowDuplicateDist:
            allowDuplicateDist !== undefined
              ? Boolean(allowDuplicateDist)
              : existing.allowDuplicateDist,

          // Keep new schema fields in sync
          maintenanceMode:
            maintenance !== undefined
              ? Boolean(maintenance)
              : existing.maintenanceMode,
          platformProfitCut:
            platformFee !== undefined
              ? Number(platformFee)
              : existing.platformProfitCut,
          enableBulkDistribution:
            enableBulkDist !== undefined
              ? Boolean(enableBulkDist)
              : existing.enableBulkDistribution,
          allowDuplicateWeeklyPayouts:
            allowDuplicateDist !== undefined
              ? Boolean(allowDuplicateDist)
              : existing.allowDuplicateWeeklyPayouts,
        },
      });
    } else {
      settings = await this.prisma.systemSettings.create({
        data: {
          upiId: upiId || null,
          usdtAddress: usdtAddress || null,
          usdtNetwork: usdtNetwork || 'TRC20',
          upiEnabled: upiEnabled !== undefined ? Boolean(upiEnabled) : true,
          usdtEnabled: usdtEnabled !== undefined ? Boolean(usdtEnabled) : true,
          upiName: upiName || '',
          upiQrCode: upiQrCode || '',
          usdtQrCode: usdtQrCode || '',
          platformFeePct:
            platformFee !== undefined ? Number(platformFee) : 30.0,
          referralFeePct:
            referralFee !== undefined ? Number(referralFee) : 10.0,
          maintenance: maintenance !== undefined ? Boolean(maintenance) : false,
          individualProfitPct:
            individualProfitPct !== undefined
              ? Number(individualProfitPct)
              : 5.0,
          clubProfitPct:
            clubProfitPct !== undefined ? Number(clubProfitPct) : 7.0,
          enableBulkDist:
            enableBulkDist !== undefined ? Boolean(enableBulkDist) : true,
          allowDuplicateDist:
            allowDuplicateDist !== undefined
              ? Boolean(allowDuplicateDist)
              : false,

          // Keep new schema fields in sync
          maintenanceMode:
            maintenance !== undefined ? Boolean(maintenance) : false,
          platformProfitCut:
            platformFee !== undefined ? Number(platformFee) : 30.0,
          enableBulkDistribution:
            enableBulkDist !== undefined ? Boolean(enableBulkDist) : true,
          allowDuplicateWeeklyPayouts:
            allowDuplicateDist !== undefined
              ? Boolean(allowDuplicateDist)
              : false,
        },
      });
    }

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'SETTINGS_UPDATE',
        reason: 'Updated global platform settings',
        ipAddress: clientIp,
      },
    });

    return { success: true, settings };
  }

  // -------------------------------------------------------
  // Granular settings updaters (v3 engine fields)
  // -------------------------------------------------------

  async updateFinancialSettings(adminId: string, body: any, clientIp: string) {
    const { platformProfitCut, referralBonusMultiplier } = body;
    const existing = await this.prisma.systemSettings.findFirst();
    const data: any = {};
    if (platformProfitCut !== undefined) {
      const v = Number(platformProfitCut);
      if (isNaN(v) || v < 0 || v > 100)
        return {
          error: 'platformProfitCut must be between 0 and 100',
          status: 400,
        };
      data.platformProfitCut = v;
      data.platformFeePct = v;
    }
    if (referralBonusMultiplier !== undefined) {
      const v = Number(referralBonusMultiplier);
      if (isNaN(v) || v < 0)
        return { error: 'referralBonusMultiplier must be >= 0', status: 400 };
      data.referralBonusMultiplier = v;
    }
    let settings;
    if (existing) {
      settings = await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await this.prisma.systemSettings.create({ data });
    }
    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'SETTINGS_UPDATE',
        reason: 'Updated financial engine settings',
        ipAddress: clientIp,
      },
    });
    return { success: true, settings };
  }

  async updateDistributionSettings(
    adminId: string,
    body: any,
    clientIp: string,
  ) {
    const { enableBulkDistribution, allowDuplicateWeeklyPayouts } = body;
    const existing = await this.prisma.systemSettings.findFirst();
    const data: any = {};
    if (enableBulkDistribution !== undefined) {
      data.enableBulkDistribution = Boolean(enableBulkDistribution);
      data.enableBulkDist = Boolean(enableBulkDistribution);
    }
    if (allowDuplicateWeeklyPayouts !== undefined) {
      data.allowDuplicateWeeklyPayouts = Boolean(allowDuplicateWeeklyPayouts);
      data.allowDuplicateDist = Boolean(allowDuplicateWeeklyPayouts);
    }
    let settings;
    if (existing) {
      settings = await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await this.prisma.systemSettings.create({ data });
    }
    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'SETTINGS_UPDATE',
        reason: 'Updated distribution settings',
        ipAddress: clientIp,
      },
    });
    return { success: true, settings };
  }

  async updateSystemSettings(adminId: string, body: any, clientIp: string) {
    const { maintenanceMode } = body;
    const existing = await this.prisma.systemSettings.findFirst();
    const data: any = {};
    if (maintenanceMode !== undefined) {
      data.maintenanceMode = Boolean(maintenanceMode);
      data.maintenance = Boolean(maintenanceMode);
    }
    let settings;
    if (existing) {
      settings = await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      settings = await this.prisma.systemSettings.create({ data });
    }
    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'SETTINGS_UPDATE',
        reason: `Maintenance mode set to ${maintenanceMode}`,
        ipAddress: clientIp,
      },
    });
    return { success: true, settings };
  }

  async getReferralSettings() {
    let settings = await this.prisma.referralSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.referralSettings.create({
        data: {}, // Use defaults defined in schema
      });
    }
    return { success: true, settings };
  }

  async updateReferralSettings(adminId: string, body: any, clientIp: string) {
    const {
      enabled,
      commissionRate,
      minimumDeposit,
      autoApprove,
      allowMultipleDeposits,
      commissionPayoutMode,
      maxReferralCommission,
      requireActiveSubscription,
      requireReferrerDeposit,
      signupBonus,
    } = body;

    const existing = await this.prisma.referralSettings.findFirst();

    let settings;
    if (existing) {
      settings = await this.prisma.referralSettings.update({
        where: { id: existing.id },
        data: {
          enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
          commissionRate:
            commissionRate !== undefined
              ? Number(commissionRate)
              : existing.commissionRate,
          minimumDeposit:
            minimumDeposit !== undefined
              ? Number(minimumDeposit)
              : existing.minimumDeposit,
          autoApprove:
            autoApprove !== undefined
              ? Boolean(autoApprove)
              : existing.autoApprove,
          allowMultipleDeposits:
            allowMultipleDeposits !== undefined
              ? Boolean(allowMultipleDeposits)
              : existing.allowMultipleDeposits,
          commissionPayoutMode:
            commissionPayoutMode !== undefined
              ? String(commissionPayoutMode)
              : existing.commissionPayoutMode,
          maxReferralCommission:
            maxReferralCommission !== undefined
              ? maxReferralCommission
                ? Number(maxReferralCommission)
                : null
              : existing.maxReferralCommission,
          requireActiveSubscription:
            requireActiveSubscription !== undefined
              ? Boolean(requireActiveSubscription)
              : existing.requireActiveSubscription,
          requireReferrerDeposit:
            requireReferrerDeposit !== undefined
              ? Boolean(requireReferrerDeposit)
              : existing.requireReferrerDeposit,
          signupBonus:
            signupBonus !== undefined
              ? Number(signupBonus)
              : existing.signupBonus,
        },
      });
    } else {
      settings = await this.prisma.referralSettings.create({
        data: {
          enabled: enabled !== undefined ? Boolean(enabled) : false,
          commissionRate:
            commissionRate !== undefined ? Number(commissionRate) : 10.0,
          minimumDeposit:
            minimumDeposit !== undefined ? Number(minimumDeposit) : 1000.0,
          autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : false,
          allowMultipleDeposits:
            allowMultipleDeposits !== undefined
              ? Boolean(allowMultipleDeposits)
              : false,
          commissionPayoutMode:
            commissionPayoutMode !== undefined
              ? String(commissionPayoutMode)
              : 'PENDING',
          maxReferralCommission: maxReferralCommission
            ? Number(maxReferralCommission)
            : null,
          requireActiveSubscription: requireActiveSubscription !== undefined ? Boolean(requireActiveSubscription) : true,
          requireReferrerDeposit: requireReferrerDeposit !== undefined ? Boolean(requireReferrerDeposit) : true,
          signupBonus: signupBonus !== undefined ? Number(signupBonus) : 100.0,
        },
      });
    }

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'SETTINGS_UPDATE',
        reason: 'Updated Referral Program settings',
        ipAddress: clientIp,
      },
    });

    return { success: true, settings };
  }

  async getReferrals() {
    const referrals = await this.prisma.referral.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { id: true, name: true, email: true } },
        referredUser: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: { select: { realizedBalance: true } },
          },
        },
        reward: true,
      },
    });

    const formatted = referrals.map((r) => {
      const referrerName = r.referrer ? (r.referrer.name || r.referrer.email) : 'Unknown';
      const referredName = r.referredUser ? (r.referredUser.name || r.referredUser.email) : 'Unknown';

      return {
        id: r.id,
        referrer: referrerName,
        referrerId: r.referrerId,
        user: referredName,
        deposit: r.reward?.depositAmount
          ? `$${Number(r.reward.depositAmount).toLocaleString('en-US')}`
          : r.referredUser?.wallet
            ? `$${Number(r.referredUser.wallet.realizedBalance).toLocaleString('en-US')}`
            : '$0',
        reward: `$${Number(r.reward?.commissionAmount || 0).toLocaleString('en-US')}`,
        status:
          r.status === 'PENDING'
            ? 'Pending'
            : r.status === 'PAID'
              ? 'Paid'
              : r.status === 'APPROVED'
                ? 'Approved'
                : r.status === 'REJECTED'
                  ? 'Rejected'
                  : 'Cancelled',
        rewardDetails: r.reward ? {
          planName: r.reward.planName,
          depositAmount: Number(r.reward.depositAmount || 0),
          platformFeePercent: Number(r.reward.platformFeePercent || 0),
          platformFeeAmount: Number(r.reward.platformFeeAmount || 0),
          referralRate: Number(r.reward.referralRate || 0),
          commissionAmount: Number(r.reward.commissionAmount || 0),
          approvedAt: r.reward.approvedAt,
          paidAt: r.reward.paidAt,
        } : null,
      };
    });

    return { success: true, referrals: formatted };
  }

  async getReferralStats() {
    const referrals = await this.prisma.referral.findMany({
      include: { reward: true },
    });
    const paid = referrals.filter((r) => r.status === 'PAID' || r.status === 'APPROVED');
    const pending = referrals.filter((r) => r.status === 'PENDING');
    const totalPayouts = paid.reduce(
      (sum, r) => sum + Number(r.reward?.commissionAmount || 0),
      0,
    );

    return {
      success: true,
      stats: {
        total: referrals.length,
        paid: paid.length,
        pending: pending.length,
        totalPayouts,
      },
    };
  }

  private async creditReferralReward(
    tx: any,
    referral: any,
    rewardAmount: number,
    qualifyingPayment: any,
    adminId?: string,
  ) {
    // 1. Credit referrer wallet
    const referrerWallet = await tx.wallet.findUnique({
      where: { userId: referral.referrerId },
    });
    if (referrerWallet) {
      await tx.wallet.update({
        where: { id: referrerWallet.id },
        data: {
          realizedBalance: { increment: rewardAmount },
          availableBalance: { increment: rewardAmount },
          currentEquity: { increment: rewardAmount },
        },
      });
    }

    // 2. Create WalletLedger credit entry
    await tx.walletLedger.create({
      data: {
        userId: referral.referrerId,
        type: 'REFERRAL_COMMISSION',
        entryType: 'CREDIT',
        amount: rewardAmount,
        referenceId: referral.id,
        note: `Referral commission from deposit by ${qualifyingPayment?.user?.email || referral.referredUser?.email || 'referred user'}`,
      },
    });

    // 3. Create double-entry ledger group
    await createTransactionGroup(tx, {
      type: 'REFERRAL_PAYOUT',
      description: `Referral commission payout | Referral: ${referral.id}`,
      idempotencyKey: `REF_COMMISSION_${referral.id}`,
      entries: [
        {
          accountType: 'SYSTEM',
          entryType: 'DEBIT',
          amount: rewardAmount,
          currency: qualifyingPayment?.currency || 'USD',
        },
        {
          userId: referral.referrerId,
          partnerId: referral.partnerId,
          accountType: 'USER',
          entryType: 'CREDIT',
          amount: rewardAmount,
          currency: qualifyingPayment?.currency || 'USD',
        },
      ],
    });

    // 4. Create financial event
    await tx.financialEvent.create({
      data: {
        eventType: 'REFERRAL_APPROVED',
        userId: referral.referrerId,
        actorId: adminId,
        referenceId: referral.id,
        metadata: {
          depositUserId: referral.referredId,
          amount: rewardAmount,
          autoApproved: !adminId,
        },
      },
    });
  }

  private async processReferralReward(
    tx: any,
    referralId: string,
    adminId?: string,
  ) {
    const referral = await tx.referral.findUnique({
      where: { id: referralId },
      include: {
        reward: true,
        referrer: { include: { wallet: true } },
        referredUser: {
          include: {
            payments: {
              where: { status: 'APPROVED' },
              orderBy: { createdAt: 'desc' },
              include: { initiation: { include: { plan: true } } },
            },
          },
        },
      },
    });

    if (!referral) throw new Error('Referral record not found');

    // If a reward already exists and is APPROVED or PAID, do not allow reprocessing.
    if (referral.reward) {
      if (referral.reward.status === 'APPROVED' || referral.reward.status === 'PAID') {
        return; // Already processed
      }
    }

    const refSettings = await tx.referralSettings.findFirst();
    if (!refSettings) {
      throw new Error('Referral settings not configured.');
    }

    if (!refSettings.enabled) {
      return; // Referral program is disabled
    }

    // 1. Verify if referrer meets conditions if required
    if (refSettings.requireActiveSubscription) {
      const referrerActivePlan = await tx.userPlan.findFirst({
        where: {
          userId: referral.referrerId,
          active: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
      });
      if (!referrerActivePlan) {
        this.logger.log({
          event: 'REFERRAL_SKIPPED_INACTIVE_REFERRER',
          message: `Referrer ${referral.referrerId} does not have an active plan. Referral commission skipped.`,
        });
        return;
      }
    }

    if (refSettings.requireReferrerDeposit) {
      const referrerDeposits = await tx.payment.findFirst({
        where: {
          userId: referral.referrerId,
          status: 'APPROVED',
        },
      });
      if (!referrerDeposits) {
        this.logger.log({
          event: 'REFERRAL_SKIPPED_NO_REFERRER_DEPOSIT',
          message: `Referrer ${referral.referrerId} has no approved deposits. Referral commission skipped.`,
        });
        return;
      }
    }

    // 2. Find the qualifying deposit/payment of the referred user
    const qualifyingPayment = referral.referredUser.payments.find(
      (p: any) => Number(p.amount) >= Number(refSettings.minimumDeposit)
    );

    if (!qualifyingPayment) {
      this.logger.log({
        event: 'REFERRAL_SKIPPED_NO_QUALIFYING_DEPOSIT',
        message: `Referred user ${referral.referredId} has no approved payment meeting the minimum deposit of $${refSettings.minimumDeposit}.`,
      });
      return;
    }

    // 3. Resolve the plan details for platform fee percent
    const resolvedPlan = qualifyingPayment.initiation?.plan ?? await tx.plan.findFirst({
      where: { name: { equals: qualifyingPayment.planName, mode: 'insensitive' } }
    });

    if (resolvedPlan && !resolvedPlan.referralEligible) {
      this.logger.log({
        event: 'REFERRAL_SKIPPED_PLAN_INELIGIBLE',
        message: `Plan ${resolvedPlan.name} is not eligible for referral commissions.`,
      });
      return;
    }

    const platformFeePercent = resolvedPlan ? Number(resolvedPlan.platformFeePercent) : 4.00;
    const commissionRate = Number(refSettings.commissionRate ?? 10);
    
    const sysSettings = await tx.systemSettings.findFirst();
    const bonusMultiplier = Number(sysSettings?.referralBonusMultiplier ?? 100) / 100;

    // Calculate reward: Reward = DepositAmount * PlanFee% * ReferralCommission% * multiplier
    const depositAmount = Number(qualifyingPayment.amount);
    const platformFeeAmount = depositAmount * (platformFeePercent / 100);
    const baseCommission = platformFeeAmount * (commissionRate / 100);
    const rewardAmount = baseCommission * bonusMultiplier;

    // Status: Use auto-approve setting if not specified by status transition
    const autoApprove = refSettings.autoApprove ?? false;
    const finalStatus = autoApprove ? 'APPROVED' : 'PENDING';

    // 4. Create or update ReferralReward snapshot
    let rewardRecord = referral.reward;
    if (rewardRecord) {
      rewardRecord = await tx.referralReward.update({
        where: { id: referral.reward.id },
        data: {
          paymentId: qualifyingPayment.id,
          planId: resolvedPlan?.id || null,
          planName: resolvedPlan?.name || qualifyingPayment.planName,
          depositAmount,
          platformFeePercent,
          platformFeeAmount,
          referralRate: commissionRate,
          commissionAmount: rewardAmount,
          status: finalStatus,
        },
      });
    } else {
      rewardRecord = await tx.referralReward.create({
        data: {
          referralId: referral.id,
          paymentId: qualifyingPayment.id,
          planId: resolvedPlan?.id || null,
          planName: resolvedPlan?.name || qualifyingPayment.planName,
          depositAmount,
          platformFeePercent,
          platformFeeAmount,
          referralRate: commissionRate,
          commissionAmount: rewardAmount,
          status: finalStatus,
        },
      });
    }

    // Update Referral status matching the reward status
    await tx.referral.update({
      where: { id: referral.id },
      data: { status: finalStatus as any },
    });

    if (finalStatus === 'APPROVED') {
      await this.creditReferralReward(tx, referral, rewardAmount, qualifyingPayment, adminId);
      
      await tx.referral.update({
        where: { id: referral.id },
        data: { status: 'APPROVED' },
      });

      await tx.referralReward.update({
        where: { referralId: referral.id },
        data: {
          status: 'APPROVED',
          approvedBy: adminId || 'SYSTEM',
          approvedAt: new Date(),
          paidAt: new Date(),
        },
      });
    }
  }

  async updateReferralStatus(
    adminId: string,
    referralId: string,
    status: string,
    clientIp: string,
  ) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: { reward: true },
    });
    if (!referral) return { error: 'Referral not found', status: 404 };

    const upperStatus = status.toUpperCase();
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];
    if (!validStatuses.includes(upperStatus))
      return { error: 'Invalid status', status: 400 };

    // Block: PAID or APPROVED -> PENDING, PAID or APPROVED -> APPROVED/PAID if already credited
    const isAlreadyCredited = referral.status === 'APPROVED' || referral.status === 'PAID';
    if (isAlreadyCredited) {
      return { error: 'Paid/Approved referrals are immutable.', status: 400 };
    }

    if (upperStatus === 'APPROVED' || upperStatus === 'PAID') {
      // Consolidate payout logic
      await this.prisma.$transaction(async (tx: any) => {
        // Run processReferralReward but force approval flow
        await tx.referral.update({
          where: { id: referralId },
          data: { status: 'PENDING' },
        });
        
        const ref = await tx.referral.findUnique({
          where: { id: referralId },
          include: {
            reward: true,
            referrer: { include: { wallet: true } },
            referredUser: {
              include: {
                payments: {
                  where: { status: 'APPROVED' },
                  orderBy: { createdAt: 'desc' },
                  include: { initiation: { include: { plan: true } } },
                },
              },
            },
          },
        });
        
        const refSettings = await tx.referralSettings.findFirst();
        const qualifyingPayment = ref.referredUser.payments.find(
          (p: any) => Number(p.amount) >= Number(refSettings?.minimumDeposit ?? 1000)
        );
        
        if (!qualifyingPayment) {
          throw new Error('Referred user has no approved deposits to calculate commission.');
        }

        const resolvedPlan = qualifyingPayment.initiation?.plan ?? await tx.plan.findFirst({
          where: { name: { equals: qualifyingPayment.planName, mode: 'insensitive' } }
        });

        const platformFeePercent = resolvedPlan ? Number(resolvedPlan.platformFeePercent) : 4.00;
        const commissionRate = Number(refSettings?.commissionRate ?? 10);
        const sysSettings = await tx.systemSettings.findFirst();
        const bonusMultiplier = Number(sysSettings?.referralBonusMultiplier ?? 100) / 100;

        const depositAmount = Number(qualifyingPayment.amount);
        const platformFeeAmount = depositAmount * (platformFeePercent / 100);
        const baseCommission = platformFeeAmount * (commissionRate / 100);
        const rewardAmount = baseCommission * bonusMultiplier;

        let rewardRecord = ref.reward;
        if (rewardRecord) {
          rewardRecord = await tx.referralReward.update({
            where: { id: ref.reward.id },
            data: {
              paymentId: qualifyingPayment.id,
              planId: resolvedPlan?.id || null,
              planName: resolvedPlan?.name || qualifyingPayment.planName,
              depositAmount,
              platformFeePercent,
              platformFeeAmount,
              referralRate: commissionRate,
              commissionAmount: rewardAmount,
              status: upperStatus,
              approvedBy: adminId,
              approvedAt: new Date(),
              paidAt: new Date(),
            },
          });
        } else {
          rewardRecord = await tx.referralReward.create({
            data: {
              referralId: ref.id,
              paymentId: qualifyingPayment.id,
              planId: resolvedPlan?.id || null,
              planName: resolvedPlan?.name || qualifyingPayment.planName,
              depositAmount,
              platformFeePercent,
              platformFeeAmount,
              referralRate: commissionRate,
              commissionAmount: rewardAmount,
              status: upperStatus,
              approvedBy: adminId,
              approvedAt: new Date(),
              paidAt: new Date(),
            },
          });
        }

        await this.creditReferralReward(tx, ref, rewardAmount, qualifyingPayment, adminId);

        await tx.referral.update({
          where: { id: referralId },
          data: { status: upperStatus as any },
        });

        await tx.referralReward.update({
          where: { referralId },
          data: {
            status: upperStatus,
            approvedBy: adminId,
            approvedAt: new Date(),
            paidAt: new Date(),
          },
        });
      });
    } else {
      await this.prisma.referral.update({
        where: { id: referralId },
        data: { status: upperStatus as any },
      });
    }

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'REFERRAL_UPDATE',
        reason: `Updated referral ${referralId} status to ${upperStatus}`,
        ipAddress: clientIp,
      },
    });

    const updated = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: { reward: true },
    });

    return { success: true, referral: updated };
  }

  async getCampaigns() {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const users = await this.prisma.user.findMany({
      where: {
        isDeleted: false,
        campaignCode: { not: null },
      },
      include: {
        payments: {
          where: {
            status: 'APPROVED',
          },
        },
      },
    });

    const formatted = campaigns.map((c) => {
      const campUsers = users.filter((u) => u.campaignCode === c.slug && u.partnerId === c.partnerId);
      const usersCount = campUsers.length;

      let approvedDepositsCount = 0;
      let totalRevenue = 0;

      campUsers.forEach((u) => {
        approvedDepositsCount += u.payments.length;
        u.payments.forEach((p) => {
          totalRevenue += Number(p.amount);
        });
      });

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        code: c.slug,
        trackingLink: `/register?campaign=${c.slug}`,
        users: usersCount,
        revenue: `$${Number(totalRevenue).toLocaleString('en-US')}`,
        deposits: approvedDepositsCount,
        status: c.isActive ? 'Active' : 'Paused',
        source: 'Direct',
        budget: '0',
        startDate: '',
        endDate: '',
      };
    });

    return { success: true, campaigns: formatted };
  }

  async getCampaignUsers(idOrSlug: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });

    if (!campaign) {
      return { error: 'Campaign not found', status: 404 };
    }

    const users = await this.prisma.user.findMany({
      where: {
        campaignCode: campaign.slug,
        partnerId: campaign.partnerId,
        isDeleted: false,
      },
      include: {
        payments: {
          where: {
            status: 'APPROVED',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formatted = users.map((u) => {
      const depositSum = u.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const joinDate = u.createdAt.toISOString().split('T')[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        joinDate,
        deposit: `$${Number(depositSum).toLocaleString('en-US')}`,
        status: u.status === 'ACTIVE' || u.status === 'VIP' ? 'Active' : 'Registered',
      };
    });

    const createdDate = campaign.createdAt.toISOString().split('T')[0];

    const totalUsers = formatted.length;
    const totalApprovedDeposits = users.reduce((sum, u) => sum + u.payments.length, 0);
    const totalRevenue = users.reduce((sum, u) => sum + u.payments.reduce((pSum, p) => pSum + Number(p.amount), 0), 0);

    return {
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        slug: campaign.slug,
        status: campaign.isActive ? 'Active' : 'Paused',
        usersRegistered: totalUsers,
        approvedDeposits: totalApprovedDeposits,
        revenue: `$${Number(totalRevenue).toLocaleString('en-US')}`,
        created: createdDate,
      },
      users: formatted,
    };
  }

  async createCampaign(adminId: string, body: any, clientIp: string) {
    const { name, code, status } = body;
    if (!name) return { error: 'Campaign Name is required', status: 400 };

    const slug = (code || name).toUpperCase().replace(/\s+/g, '_');

    const partner = await this.prisma.partner.findFirst();
    if (!partner) return { error: 'No partner found in the system.', status: 400 };

    const partnerId = body.partnerId || partner.id;

    const existing = await this.prisma.campaign.findUnique({
      where: {
        partnerId_slug: { partnerId, slug },
      },
    });
    if (existing) return { error: 'Campaign slug already exists for this partner', status: 400 };

    const isActive = status === 'Active';

    const campaign = await this.prisma.campaign.create({
      data: {
        partnerId,
        name,
        slug,
        isActive,
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'CAMPAIGN_CREATE',
        reason: `Created campaign ${campaign.id} (${slug})`,
        ipAddress: clientIp,
      },
    });

    return { success: true, campaign };
  }

  async updateCampaign(adminId: string, id: string, body: any, clientIp: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign) return { error: 'Campaign not found', status: 404 };

    const { name, code, status } = body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) {
      data.slug = code.toUpperCase().replace(/\s+/g, '_');
    }
    if (status !== undefined) {
      data.isActive = status === 'Active';
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data,
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'CAMPAIGN_UPDATE',
        reason: `Updated campaign ${id}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, campaign: updated };
  }

  async deleteCampaign(adminId: string, id: string, clientIp: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!campaign) return { error: 'Campaign not found', status: 404 };

    await this.prisma.campaign.delete({
      where: { id },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'CAMPAIGN_DELETE',
        reason: `Deleted campaign ${id} (${campaign.slug})`,
        ipAddress: clientIp,
      },
    });

    return { success: true };
  }

  async createTrade(adminId: string, body: any, clientIp: string) {
    const { userId, pair, type, entry, stopLoss, target } = body;
    if (!userId || !pair || !type || !entry || !stopLoss || !target)
      return { error: 'Missing required trade signal fields', status: 400 };

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'Target user not found', status: 404 };

    const trade = await this.prisma.trade.create({
      data: {
        userId,
        partnerId: user.partnerId,
        pair,
        type: type === 'BUY' ? 'BUY' : 'SELL',
        entryPrice: Number(entry),
        currentPrice: Number(entry),
        stopLoss: Number(stopLoss),
        target: Number(target),
        profit: 0,
        pnl: 0,
        status: 'ACTIVE',
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId,
        partnerId: user.partnerId,
        action: 'TRADE_CREATE',
        reason: `Created active trade signal for ${pair} (Type: ${type}, Entry: ${entry})`,
        ipAddress: clientIp,
      },
    });

    return { success: true, trade };
  }

  async closeTrade(
    adminId: string,
    tradeId: string,
    exitPrice: number | undefined,
    clientIp: string,
  ) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: { include: { wallet: true } } },
    });
    if (!trade) return { error: 'Trade not found', status: 404 };
    if (trade.status !== 'ACTIVE')
      return { error: 'Trade is not active', status: 400 };
    if (!exitPrice || Number(exitPrice) <= 0)
      return { error: 'A valid exit price is required', status: 400 };

    const entryPrice = trade.entryPrice;
    const settlementPrice = new Prisma.Decimal(exitPrice);
    const quantity = trade.quantity;

    const isBuy = trade.type === 'BUY';
    let pnl = settlementPrice.minus(entryPrice).mul(quantity);
    if (!isBuy) pnl = entryPrice.minus(settlementPrice).mul(quantity);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.trade.update({
        where: { id: trade.id },
        data: {
          status: 'CLOSED',
          currentPrice: settlementPrice,
          exitPrice: settlementPrice,
          pnl,
          profit: pnl,
          closedAt: new Date(),
        },
      });

      if (trade.user?.wallet) {
        const originalMargin = entryPrice.mul(quantity);
        const returnAmount = originalMargin.add(pnl);
        const nextBalance = trade.user.wallet.realizedBalance.add(returnAmount);

        await tx.wallet.update({
          where: { id: trade.user.wallet.id },
          data: { realizedBalance: nextBalance },
        });

        const group = await tx.transactionGroup.create({
          data: {
            type: pnl.isPositive() ? 'TRADE_PROFIT' : 'TRADE_LOSS',
            description: `Admin closed trade ${trade.id} | PnL: $${pnl.toFixed(2)}`,
            idempotencyKey: `TRADE_SETTLE_ADMIN_${trade.id}`,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionGroupId: group.id,
            userId: trade.userId,
            partnerId: trade.partnerId,
            accountType: 'USER',
            entryType: pnl.isPositive() ? 'CREDIT' : 'DEBIT',
            amount: pnl.abs(),
            currency: 'USD',
          },
        });
      }
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId: trade.userId,
        partnerId: trade.partnerId,
        action: 'TRADE_CLOSE',
        reason: `Admin closed trade ${trade.id}`,
        ipAddress: clientIp,
      },
    });

    return { success: true };
  }

  async listTradeRecords() {
    return this.prisma.tradeRecord.findMany({ orderBy: { tradeDate: 'desc' } });
  }

  async createTradeRecord(body: any) {
    const {
      pair,
      side,
      entryPrice,
      exitPrice,
      tradeDate,
      profitLoss,
      result,
      notes,
      status,
    } = body;
    if (
      !pair ||
      !side ||
      entryPrice === undefined ||
      exitPrice === undefined ||
      !tradeDate ||
      profitLoss === undefined ||
      !result
    ) {
      return { error: 'Missing required fields for trade record', status: 400 };
    }
    const tradeRecord = await this.prisma.tradeRecord.create({
      data: {
        pair,
        side,
        entryPrice: Number(entryPrice),
        exitPrice: Number(exitPrice),
        tradeDate: tradeDate ? new Date(tradeDate) : new Date(),
        profitLoss: Number(profitLoss),
        result,
        notes: notes || '',
        status: status || 'published',
      },
    });

    if (tradeRecord.result === 'WIN' && tradeRecord.status === 'published' && tradeRecord.profitLoss > 0) {
      // Auto-trigger profit distribution asynchronously
      this.distributeTradeProfit(tradeRecord.id).catch(err => console.error("Auto distribution error:", err));
    }

    return { success: true, tradeRecord };
  }

  async updateTradeRecord(id: string, body: any) {
    const {
      pair,
      side,
      entryPrice,
      exitPrice,
      tradeDate,
      profitLoss,
      result,
      notes,
      status,
    } = body;
    const existing = await this.prisma.tradeRecord.findUnique({
      where: { id },
    });
    if (!existing) return { error: 'Trade record not found', status: 404 };

    const updated = await this.prisma.tradeRecord.update({
      where: { id },
      data: {
        pair: pair ?? existing.pair,
        side: side ?? existing.side,
        entryPrice:
          entryPrice !== undefined ? Number(entryPrice) : existing.entryPrice,
        exitPrice:
          exitPrice !== undefined ? Number(exitPrice) : existing.exitPrice,
        tradeDate: tradeDate ? new Date(tradeDate) : existing.tradeDate,
        profitLoss:
          profitLoss !== undefined ? Number(profitLoss) : existing.profitLoss,
        result: result ?? existing.result,
        notes: notes !== undefined ? notes : existing.notes,
        status: status ?? existing.status,
      },
    });

    if (!existing.profitDistributed && updated.result === 'WIN' && updated.status === 'published' && updated.profitLoss > 0) {
      // Auto-trigger profit distribution asynchronously
      this.distributeTradeProfit(updated.id).catch(err => console.error("Auto distribution error:", err));
    }

    return { success: true, tradeRecord: updated };
  }

  async distributeTradeProfit(tradeRecordId: string, triggerSource: string = 'AUTO') {
    const trade = await this.prisma.tradeRecord.findUnique({ where: { id: tradeRecordId } });
    if (!trade) return { error: 'Trade not found', status: 404 };
    if (trade.profitDistributed) return { error: 'Profit already distributed', status: 400 };
    if (trade.result !== 'WIN' && trade.profitLoss <= 0) return { error: 'Trade is not a winning trade', status: 400 };
    if (trade.status !== 'published') return { error: 'Trade is not published', status: 400 };

    // Claim first (Atomic Guard)
    const claimed = await this.prisma.tradeRecord.updateMany({
      where: {
        id: tradeRecordId,
        profitDistributed: false
      },
      data: {
        profitDistributed: true
      }
    });

    if (claimed.count === 0) {
      return { error: 'Trade was already distributed in another process', status: 400 };
    }

    const totalProfit = Number(trade.profitLoss);

    const users = await this.prisma.user.findMany({
      where: {
        userPlans: {
          some: { active: true }
        }
      },
      include: {
        wallet: true
      }
    });

    if (users.length === 0) return { error: 'No eligible users found', status: 400 };

    // Deterministic sorting to ensure remainder always hits the same user order
    users.sort((a, b) => a.id.localeCompare(b.id));

    const { Prisma } = require('@prisma/client');
    const n = users.length;
    const totalProfitDec = new Prisma.Decimal(totalProfit);
    const baseShare = totalProfitDec.div(n).toDecimalPlaces(4, Prisma.Decimal.ROUND_DOWN);
    
    // Check if base share is > 0
    if (baseShare.lte(0) && totalProfitDec.lte(0)) {
      return { error: 'Per user profit is too small to distribute', status: 400 };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        let distributed = new Prisma.Decimal(0);
        let sumDistributed = new Prisma.Decimal(0);

        for (let i = 0; i < n; i++) {
          const user = users[i];
          if (!user.wallet) continue;

          let shareDec;
          if (i === n - 1) {
            shareDec = totalProfitDec.minus(distributed);
          } else {
            shareDec = baseShare;
            distributed = distributed.plus(shareDec);
          }

          sumDistributed = sumDistributed.plus(shareDec);
          const share = shareDec.toNumber();

          await tx.wallet.update({
            where: { userId: user.id },
            data: {
              realizedBalance: { increment: share },
              availableBalance: { increment: share },
              currentEquity: { increment: share }
            }
          });
        }

        const diff = totalProfitDec.minus(sumDistributed);
        if (!diff.isZero()) {
          throw new Error("Distribution mismatch detected");
        }

        await tx.tradeDistributionLog.create({
          data: {
            tradeRecordId: tradeRecordId,
            totalProfit: totalProfit,
            userCount: users.length,
            perUserProfit: baseShare.toNumber(),
            // triggerSource and executedAt will rely on schema defaults if applied
          }
        });
      }, { timeout: 10000 });

      return { success: true, message: 'Profit distributed successfully' };
    } catch (error: any) {
      console.error('Profit distribution failed:', error);
      // Rollback the claim if distribution fails
      await this.prisma.tradeRecord.update({
        where: { id: tradeRecordId },
        data: { profitDistributed: false }
      }).catch(err => console.error("Failed to rollback claim", err));

      return { error: error.message || 'Profit distribution failed', status: 500 };
    }
  }

  async deleteTradeRecord(id: string) {
    const existing = await this.prisma.tradeRecord.findUnique({
      where: { id },
    });
    if (!existing) return { error: 'Trade record not found', status: 404 };

    await this.prisma.tradeRecord.delete({ where: { id } });
    return { success: true, message: 'Trade record deleted successfully' };
  }

  async setTradeRecordStatus(id: string, status: string) {
    const existing = await this.prisma.tradeRecord.findUnique({
      where: { id },
    });
    if (!existing) return { error: 'Trade record not found', status: 404 };

    const updated = await this.prisma.tradeRecord.update({
      where: { id },
      data: { status },
    });

    if (!existing.profitDistributed && updated.result === 'WIN' && updated.status === 'published' && updated.profitLoss > 0) {
      // Auto-trigger profit distribution asynchronously
      this.distributeTradeProfit(updated.id).catch(err => console.error("Auto distribution error:", err));
    }

    return { success: true, tradeRecord: updated };
  }

  async approvePayment(adminId: string, paymentId: string, clientIp: string) {
    const result = await this.prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          user: true,
          initiation: { include: { plan: true } },
        },
      });
      if (!payment) throw new Error('Payment record not found');
      if (payment.status === 'APPROVED')
        throw new Error('Payment has already been approved');

      const amountVal = Number(payment.amount);
      const idempotencyKey = `DEP_APPROVAL_${payment.id}`;

      const ledgerGroup = await createTransactionGroup(tx, {
        type: 'DEPOSIT',
        description: `Manual approval of checkout payment ${payment.id}`,
        idempotencyKey,
        entries: [
          {
            accountType: 'SYSTEM',
            entryType: 'DEBIT',
            amount: amountVal,
            currency: payment.currency,
          },
          {
            userId: payment.userId,
            partnerId: payment.partnerId,
            accountType: 'USER',
            entryType: 'CREDIT',
            amount: amountVal,
            currency: payment.currency,
          },
        ],
      });

      let nextStatus = 'ACTIVE';
      const planNameLower = payment.planName.toLowerCase();
      if (planNameLower.includes('premium') || planNameLower.includes('vip'))
        nextStatus = 'VIP';

      await tx.user.update({
        where: { id: payment.userId },
        data: { status: nextStatus as any },
      });
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'APPROVED', ledgerTransactionGroupId: ledgerGroup.id },
      });

      // -------------------------------------------------------
      // UserPlan activation — resolve plan, record history
      // -------------------------------------------------------
      const resolvedPlan: {
        id: string;
        name: string;
        durationDays: number;
      } | null =
        payment.initiation?.plan ??
        (await tx.plan.findFirst({
          where: {
            name: { equals: payment.planName, mode: 'insensitive' },
            isActive: true,
          },
        }));

      const canActivatePlan =
        updatedPayment.status === 'APPROVED' &&
        (!payment.initiation || payment.initiation.status === 'completed');

      if (resolvedPlan && canActivatePlan) {
        // Deactivate any existing active plans for this user
        await tx.userPlan.updateMany({
          where: { userId: payment.userId, active: true },
          data: { active: false },
        });

        const expiresAt = new Date();
        expiresAt.setDate(
          expiresAt.getDate() + (resolvedPlan.durationDays ?? 30),
        );

        await tx.userPlan.create({
          data: {
            userId: payment.userId,
            planId: resolvedPlan.id,
            active: true,
            startedAt: new Date(),
            expiresAt,
          },
        });

        await tx.financialEvent.create({
          data: {
            eventType: 'PLAN_ASSIGNED',
            userId: payment.userId,
            actorId: adminId,
            referenceId: payment.id,
            metadata: {
              planId: resolvedPlan.id,
              planName: resolvedPlan.name,
              expiresAt: expiresAt.toISOString(),
            },
          },
        });
      }

      // -------------------------------------------------------
      // Referral commission engine
      // -------------------------------------------------------
      if (payment.user.referredBy) {
        // Find or create the Referral relationship
        let referral = await tx.referral.findFirst({
          where: {
            referredId: payment.userId,
            referrerId: payment.user.referredBy,
          },
        });
        if (!referral) {
          referral = await tx.referral.create({
            data: {
              partnerId: payment.partnerId,
              referrerId: payment.user.referredBy,
              referredId: payment.userId,
              status: 'PENDING',
            },
          });
        }
        
        try {
          await this.processReferralReward(tx, referral.id, adminId);
        } catch (err: any) {
          this.logger.error({
            event: 'REFERRAL_PROCESSING_FAILED',
            message: `Failed to process referral reward for referral ${referral.id}: ${err.message}`,
          });
        }
      }

      await tx.securityEvent.create({
        data: {
          adminId,
          userId: payment.userId,
          partnerId: payment.partnerId,
          action: 'PAYMENT_APPROVED',
          reason: `Approved payment ${payment.id} for amount ${amountVal}`,
          ipAddress: clientIp,
        },
      });

      return updatedPayment;
    });

    if (result) {
      this.notificationsService
        .sendToUser(result.userId, NotificationEvent.PAYMENT_APPROVED, {
          amount: Number(result.amount),
        })
        .catch((err) =>
          console.error(
            `Failed to send PAYMENT_APPROVED for user ${result.userId}:`,
            err,
          ),
        );

      this.notificationsService
        .sendToUser(result.userId, NotificationEvent.PLAN_ACTIVATED, {
          planName: result.planName,
        })
        .catch((err) =>
          console.error(
            `Failed to send PLAN_ACTIVATED for user ${result.userId}:`,
            err,
          ),
        );
    }

    return { success: true, payment: result };
  }

  async rejectPayment(
    adminId: string,
    paymentId: string,
    remark: string,
    clientIp: string,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return { error: 'Payment record not found', status: 404 };
    if (payment.status === 'APPROVED')
      return { error: 'Approved payments cannot be rejected', status: 400 };

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REJECTED', remark: remark || 'Declined by admin' },
    });

    this.notificationsService
      .sendToUser(updatedPayment.userId, NotificationEvent.PAYMENT_REJECTED, {
        amount: Number(updatedPayment.amount),
      })
      .catch((err) =>
        console.error(
          `Failed to send PAYMENT_REJECTED for user ${updatedPayment.userId}:`,
          err,
        ),
      );

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId: payment.userId,
        partnerId: payment.partnerId,
        action: 'PAYMENT_REJECTED',
        reason: `Rejected payment ${payment.id}. Reason: ${remark || 'Declined by admin'}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, payment: updatedPayment };
  }

  async verifyPayment(adminId: string, paymentId: string, clientIp: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) return { error: 'Payment record not found', status: 404 };
    if (payment.status !== 'PENDING')
      return { error: 'Only pending payments can be verified', status: 400 };

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'VERIFIED' },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        userId: payment.userId,
        partnerId: payment.partnerId,
        action: 'PAYMENT_VERIFIED',
        reason: `Verified details for payment ${payment.id}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, payment: updatedPayment };
  }

  async approveWithdrawal(
    adminId: string,
    withdrawalId: string,
    clientIp: string,
  ) {
    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        const withdrawal = await tx.withdrawal.findUnique({
          where: { id: withdrawalId },
        });
        if (!withdrawal) throw new Error('Withdrawal record not found');
        if (withdrawal.status !== 'PENDING')
          throw new Error('Withdrawal has already been processed');

        const wallet = await tx.wallet.findUnique({
          where: { userId: withdrawal.userId },
        });
        if (!wallet) throw new Error('Wallet not found');

        const amountVal = Number(withdrawal.amount);

        if (Number(wallet.pendingWithdrawals) < amountVal) {
          throw new Error('Reserved withdrawal balance mismatch');
        }

        const nextPending = Number(wallet.pendingWithdrawals) - amountVal;
        const nextTotalWithdrawn = Number(wallet.totalWithdrawn) + amountVal;

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            pendingWithdrawals: nextPending,
            totalWithdrawn: nextTotalWithdrawn,
          },
        });

        const idempotencyKey = `WITHDRAWAL_APPROVAL_${withdrawal.id}`;

        const ledgerGroup = await createTransactionGroup(tx, {
          type: 'WITHDRAWAL',
          description: `Manual approval of withdrawal request ${withdrawal.id}`,
          idempotencyKey,
          entries: [
            {
              userId: withdrawal.userId,
              partnerId: withdrawal.partnerId,
              accountType: 'USER',
              entryType: 'DEBIT',
              amount: amountVal,
              currency: withdrawal.currency,
            },
            {
              accountType: 'SYSTEM',
              entryType: 'CREDIT',
              amount: amountVal,
              currency: withdrawal.currency,
            },
          ],
        });

        const updatedWithdrawal = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            ledgerTransactionGroupId: ledgerGroup.id,
            processedAt: new Date(),
            processedBy: adminId,
          },
        });

        await tx.securityEvent.create({
          data: {
            adminId,
            userId: withdrawal.userId,
            partnerId: withdrawal.partnerId,
            action: 'WITHDRAWAL_APPROVED',
            reason: `Approved withdrawal ${withdrawal.id} for amount ${amountVal}`,
            ipAddress: clientIp,
          },
        });

        return updatedWithdrawal;
      });

      if (result) {
        this.notificationsService
          .sendToUser(result.userId, NotificationEvent.WITHDRAWAL_APPROVED, {
            amount: Number(result.amount),
          })
          .catch((err) =>
            console.error(
              `Failed to send WITHDRAWAL_APPROVED for user ${result.userId}:`,
              err,
            ),
          );
      }

      return { success: true, withdrawal: result };
    } catch (e: any) {
      return { error: e.message || 'Approval failed', status: 400 };
    }
  }

  async rejectWithdrawal(
    adminId: string,
    withdrawalId: string,
    clientIp: string,
  ) {
    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        const withdrawal = await tx.withdrawal.findUnique({
          where: { id: withdrawalId },
        });
        if (!withdrawal) throw new Error('Withdrawal record not found');
        if (withdrawal.status !== 'PENDING')
          throw new Error('Only pending withdrawals can be rejected');

        const wallet = await tx.wallet.findUnique({
          where: { userId: withdrawal.userId },
        });
        if (!wallet) throw new Error('Wallet not found');

        const amountVal = Number(withdrawal.amount);

        const nextAvailable = Number(wallet.availableBalance) + amountVal;
        const nextPending = Math.max(
          0,
          Number(wallet.pendingWithdrawals) - amountVal,
        );

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            availableBalance: nextAvailable,
            pendingWithdrawals: nextPending,
          },
        });

        const updatedWithdrawal = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            processedAt: new Date(),
            processedBy: adminId,
          },
        });

        await tx.securityEvent.create({
          data: {
            adminId,
            userId: withdrawal.userId,
            partnerId: withdrawal.partnerId,
            action: 'WITHDRAWAL_REJECTED',
            reason: `Rejected withdrawal request ${withdrawal.id}`,
            ipAddress: clientIp,
          },
        });

        return updatedWithdrawal;
      });

      if (result) {
        this.notificationsService
          .sendToUser(result.userId, NotificationEvent.WITHDRAWAL_REJECTED, {
            amount: Number(result.amount),
            reason: 'Declined by admin',
          })
          .catch((err) =>
            console.error(
              `Failed to send WITHDRAWAL_REJECTED for user ${result.userId}:`,
              err,
            ),
          );
      }

      return { success: true, withdrawal: result };
    } catch (e: any) {
      return { error: e.message || 'Rejection failed', status: 400 };
    }
  }

  async reverseTransaction(
    adminId: string,
    transactionGroupId: string,
    reason: string,
    clientIp: string,
  ) {
    const result = await this.prisma.$transaction(async (tx: any) => {
      return reverseTransactionGroup(
        tx,
        transactionGroupId,
        reason,
        adminId,
        clientIp,
      );
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'TRANSACTION_REVERSED',
        reason: `Reversed transaction group ${transactionGroupId}. Reason: ${reason}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, reversalGroup: result };
  }

  async generateProfitDistributionReference(date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `PD-${year}${month}${day}`;

    const latest = await this.prisma.profitDistribution.findFirst({
      where: {
        reference: {
          startsWith: datePrefix,
        },
      },
      orderBy: {
        reference: 'desc',
      },
    });

    let sequence = 1;
    if (latest) {
      const parts = latest.reference.split('-');
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    const seqStr = String(sequence).padStart(3, '0');
    return `${datePrefix}-${seqStr}`;
  }

  async createProfitDistribution(body: any) {
    const { userId, amount, type, status, note, distributionDate } = body;
    if (!userId || amount === undefined || !type || !distributionDate) {
      return {
        error: 'userId, amount, type, and distributionDate are required',
        status: 400,
      };
    }

    const distDate = new Date(distributionDate);
    const normalizedStatus =
      status === 'PAID' ? 'COMPLETED' : status || 'COMPLETED';
    const distributionAmount = Number(amount);
    const reference = await this.generateProfitDistributionReference(distDate);

    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        const profitDist = await tx.profitDistribution.create({
          data: {
            reference,
            userId,
            grossProfit: distributionAmount,
            netProfit: distributionAmount,
            type,
            status: normalizedStatus,
            note: note || '',
            distributionDate: distDate,
            weekKey: this.getWeekKey(distDate),
          },
          include: {
            user: true,
          },
        });

        if (profitDist.status === 'COMPLETED') {
          await tx.walletLedger.create({
            data: {
              userId: profitDist.userId,
              type: 'PROFIT_DISTRIBUTION',
              entryType: 'CREDIT',
              amount: profitDist.netProfit,
              referenceId: profitDist.id,
              note: `Manual profit distribution | Ref: ${reference}`,
            },
          });

          await createTransactionGroup(tx, {
            type: 'TRADE_PROFIT',
            description: `Manual Profit payout | Ref: ${reference}`,
            idempotencyKey: `PROFIT_DIST_${reference}`,
            entries: [
              {
                accountType: 'SYSTEM',
                entryType: 'DEBIT',
                amount: profitDist.netProfit,
                currency: 'USD',
              },
              {
                userId: profitDist.userId,
                partnerId: profitDist.user.partnerId,
                accountType: 'USER',
                entryType: 'CREDIT',
                amount: profitDist.netProfit,
                currency: 'USD',
              },
            ],
          });
        }

        return profitDist;
      });

      if (result && result.status === 'COMPLETED') {
        this.notificationsService
          .sendToUser(result.userId, NotificationEvent.PROFIT_DISTRIBUTED, {
            amount: Number(result.netProfit),
          })
          .catch((err) =>
            console.error(
              `Failed to send PROFIT_DISTRIBUTED for user ${result.userId}:`,
              err,
            ),
          );
      }

      return { success: true, profitDistribution: result };
    } catch (e: any) {
      console.error('Manual profit dist error:', e);
      return { error: e.message || 'Database error', status: 500 };
    }
  }

  async updateProfitDistribution(id: string, body: any) {
    const { amount, type, status, note, distributionDate } = body;
    const normalizedStatus = status === 'PAID' ? 'COMPLETED' : status;

    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        const currentDist = await tx.profitDistribution.findUnique({
          where: { id },
          include: { user: true },
        });
        if (!currentDist) throw new Error('Profit distribution not found');

        if (
          currentDist.status === 'COMPLETED' &&
          normalizedStatus === 'PENDING'
        ) {
          throw new Error(
            'Cannot revert a COMPLETED profit distribution back to PENDING. This would require a ledger reversal.',
          );
        }

        const dataToUpdate: any = {};
        if (amount !== undefined) {
          const distributionAmount = Number(amount);
          dataToUpdate.grossProfit = distributionAmount;
          dataToUpdate.netProfit = distributionAmount;
        }
        if (type !== undefined) dataToUpdate.type = type;
        if (normalizedStatus !== undefined)
          dataToUpdate.status = normalizedStatus;
        if (note !== undefined) dataToUpdate.note = note;
        if (distributionDate !== undefined) {
          const nextDate = new Date(distributionDate);
          dataToUpdate.distributionDate = nextDate;
          dataToUpdate.weekKey = this.getWeekKey(nextDate);
        }

        const updated = await tx.profitDistribution.update({
          where: { id },
          data: dataToUpdate,
          include: {
            user: true,
          },
        });

        const isPaidTransition =
          currentDist.status === 'PENDING' && updated.status === 'COMPLETED';

        // Trigger ledger if status transitions from PENDING to COMPLETED
        if (isPaidTransition) {
          await tx.walletLedger.create({
            data: {
              userId: updated.userId,
              type: 'PROFIT_DISTRIBUTION',
              entryType: 'CREDIT',
              amount: updated.netProfit,
              referenceId: updated.id,
              note: `Manual profit distribution | Ref: ${updated.reference}`,
            },
          });

          await createTransactionGroup(tx, {
            type: 'TRADE_PROFIT',
            description: `Manual Profit payout | Ref: ${updated.reference}`,
            idempotencyKey: `PROFIT_DIST_${updated.reference}`,
            entries: [
              {
                accountType: 'SYSTEM',
                entryType: 'DEBIT',
                amount: updated.netProfit,
                currency: 'USD',
              },
              {
                userId: updated.userId,
                partnerId: updated.user.partnerId,
                accountType: 'USER',
                entryType: 'CREDIT',
                amount: updated.netProfit,
                currency: 'USD',
              },
            ],
          });
        }

        return { updated, isPaidTransition };
      });

      if (result && result.isPaidTransition) {
        this.notificationsService
          .sendToUser(
            result.updated.userId,
            NotificationEvent.PROFIT_DISTRIBUTED,
            {
              amount: Number(result.updated.netProfit),
            },
          )
          .catch((err) =>
            console.error(
              `Failed to send PROFIT_DISTRIBUTED for user ${result.updated.userId}:`,
              err,
            ),
          );
      }

      return { success: true, profitDistribution: result.updated };
    } catch (e: any) {
      console.error('Update profit dist error:', e);
      return { error: e.message || 'Database error', status: 400 };
    }
  }

  async deleteProfitDistribution(id: string) {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        const currentDist = await tx.profitDistribution.findUnique({
          where: { id },
        });
        if (!currentDist) throw new Error('Profit distribution not found');

        if (currentDist.status === 'COMPLETED') {
          throw new Error(
            'Cannot delete a COMPLETED profit distribution because it is tied to an active ledger transaction. Please create a manual adjustment instead.',
          );
        }

        await tx.profitDistribution.delete({
          where: { id },
        });
      });
      return { success: true };
    } catch (e: any) {
      return { error: e.message, status: 400 };
    }
  }

  // -------------------------------------------------------
  // Distribution Engine — v3
  // Uses UserPlan → Plan for resolution, Decimal math, weekKey
  // idempotency via @@unique([userId, weekKey]), WalletLedger
  // -------------------------------------------------------

  private isBulkDistributeRunning = false;
  private processedRequestIds = new Set<string>();

  /** Compute ISO week key: "YYYY-WNN" based on UTC Monday. */
  private getWeekKey(date: Date): string {
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const day = d.getUTCDay() || 7; // Mon=1 … Sun=7
    d.setUTCDate(d.getUTCDate() + 4 - day); // Thu in week
    const year = d.getUTCFullYear();
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const week = Math.ceil(
      ((d.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7,
    );
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  private getPlanWeight(planName: string): number {
    const name = planName.toUpperCase();
    if (name.includes("CLUB")) return 2;
    if (name.includes("INDIVIDUAL")) return 1;
    return 1;
  }

  /** Resolve eligible users + payout breakdown without DB writes. */
  async previewDistribution(body: any) {
    const { totalProfitPool, eligiblePlans, method } = body;
    const now = new Date();
    const weekKey = body.weekKey ?? this.getWeekKey(now);
    
    if (!totalProfitPool || !eligiblePlans || !eligiblePlans.length || !method) {
      return { success: false, error: "Missing required fields" };
    }

    const activeUserPlans = await this.prisma.userPlan.findMany({
      where: { active: true },
      include: {
        user: { select: { id: true, email: true, name: true, isDeleted: true, status: true } },
        plan: true,
      },
    });

    const eligibleUsers = activeUserPlans.filter(up => {
      if (up.user.isDeleted) return false;
      if (up.user.status !== 'ACTIVE' && up.user.status !== 'VIP') return false;
      if (up.expiresAt && up.expiresAt < now) return false;
      
      if (eligiblePlans.includes("ALL")) return true;
      
      const pName = up.plan.name.toUpperCase();
      return eligiblePlans.some((ep: string) => pName.includes(ep.toUpperCase()));
    });

    if (eligibleUsers.length === 0) {
      return { success: true, eligibleUsers: 0, breakdown: [] };
    }

    const breakdown: any[] = [];
    const pool = Number(totalProfitPool);

    if (method === 'EQUAL') {
      let remainingPool = pool;
      for (let i = 0; i < eligibleUsers.length; i++) {
        const up = eligibleUsers[i];
        const isLast = i === eligibleUsers.length - 1;
        const amount = isLast ? remainingPool : Math.floor((pool / eligibleUsers.length) * 100) / 100;
        remainingPool -= amount;
        
        breakdown.push({
          userId: up.user.id,
          email: up.user.email,
          name: up.user.name,
          planName: up.plan.name,
          weight: 1,
          amount: +amount.toFixed(2),
        });
      }
    } else {
      const totalWeight = eligibleUsers.reduce((sum, up) => sum + this.getPlanWeight(up.plan.name), 0);
      let remainingPool = pool;
      for (let i = 0; i < eligibleUsers.length; i++) {
        const up = eligibleUsers[i];
        const weight = this.getPlanWeight(up.plan.name);
        const isLast = i === eligibleUsers.length - 1;
        const amount = isLast ? remainingPool : Math.floor(((pool * weight) / totalWeight) * 100) / 100;
        remainingPool -= amount;

        breakdown.push({
          userId: up.user.id,
          email: up.user.email,
          name: up.user.name,
          planName: up.plan.name,
          weight,
          amount: +amount.toFixed(2),
        });
      }
    }

    return {
      success: true,
      weekKey,
      method,
      totalProfitPool: pool,
      eligibleUsers: eligibleUsers.length,
      estimatedAmount: pool,
      totalAmount: pool,
      totalNetProfit: pool,
      breakdown,
    };
  }

  async bulkDistributeProfit(adminId: string, clientIp: string, body: any) {
    const { totalProfitPool, eligiblePlans, method, distributionType, note, dryRun } = body;
    const isDryRun = dryRun === true;
    const now = new Date();
    const weekKey = body.weekKey ?? this.getWeekKey(now);
    const pool = Number(totalProfitPool);

    if (!pool || !eligiblePlans || !eligiblePlans.length || !method) {
      return { success: false, error: "Missing required fields", status: 400 };
    }

    let distributionLock: any = null;

    if (!isDryRun) {
      try {
        distributionLock = await this.prisma.profitDistributionLock.create({
          data: {
            dateKey: weekKey,
            status: 'RUNNING',
            startedAt: new Date(),
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          return {
            error: `Distribution for week ${weekKey} is already running or completed.`,
            status: 409,
          };
        }
        throw error;
      }
    }

    const activeUserPlans = await this.prisma.userPlan.findMany({
      where: { active: true },
      include: {
        user: { include: { wallet: true } },
        plan: true,
      },
    });

    const settings = await this.prisma.systemSettings.findFirst();
    const allowDuplicateDist =
      settings?.allowDuplicateWeeklyPayouts ??
      settings?.allowDuplicateDist ??
      false;

    const skipped: {
      alreadyPaid: string[];
      expiredPlan: string[];
      invalidPlan: string[];
      inactiveUser: string[];
    } = { alreadyPaid: [], expiredPlan: [], invalidPlan: [], inactiveUser: [] };

    const alreadyPaidSet = new Set<string>();
    if (!allowDuplicateDist) {
      const existing = await this.prisma.profitDistribution.findMany({
        where: { weekKey },
        select: { userId: true },
      });
      existing.forEach((d) => alreadyPaidSet.add(d.userId));
    }

    const eligibleUsers = [];

    for (const up of activeUserPlans) {
      const user = up.user;
      if (user.isDeleted) continue;
      
      const pName = up.plan.name.toUpperCase();
      const isEligiblePlan = eligiblePlans.includes("ALL") || eligiblePlans.some((ep: string) => pName.includes(ep.toUpperCase()));
      
      if (!isEligiblePlan) {
        skipped.invalidPlan.push(user.email);
        continue;
      }
      if (user.status !== 'ACTIVE' && user.status !== 'VIP') {
        skipped.inactiveUser.push(user.email);
        continue;
      }
      if (up.expiresAt && up.expiresAt < now) {
        skipped.expiredPlan.push(user.email);
        continue;
      }
      if (!allowDuplicateDist && alreadyPaidSet.has(user.id)) {
        skipped.alreadyPaid.push(user.email);
        continue;
      }

      eligibleUsers.push(up);
    }

    const totalProcessed = activeUserPlans.length;
    const successCount = eligibleUsers.length;
    const skippedCount = Object.values(skipped).reduce((s, a) => s + a.length, 0);

    if (isDryRun || successCount === 0) {
      return {
        success: true,
        weekKey,
        summary: {
          totalProcessed,
          eligible: successCount,
          successCount: isDryRun ? successCount : 0,
          failedCount: 0,
          skippedCount,
          totalAmount: isDryRun ? pool : 0,
          estimatedAmount: isDryRun ? pool : 0,
          totalNetProfit: isDryRun ? pool : 0,
        },
        skipped,
      };
    }

    this.isBulkDistributeRunning = true;

    try {
      const result = await this.prisma.$transaction(async (tx: any) => {
        let totalShares = 0;
        if (method === 'WEIGHTED') {
            totalShares = eligibleUsers.reduce((sum, up) => sum + this.getPlanWeight(up.plan.name), 0);
        } else {
            totalShares = eligibleUsers.length;
        }

        const batch = await tx.profitDistributionBatch.create({
          data: {
            createdBy: adminId,
            totalProcessed,
            successCount,
            failedCount: 0,
            skippedCount,
            dryRun: false,
            weekKey,
            totalGrossProfit: pool,
            totalNetProfit: pool,
            method,
            totalShares,
            status: 'COMPLETED',
          },
        });

        const datePrefix = `PD-${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
        let remainingPool = pool;
        let sumCredited = 0;

        for (let i = 0; i < eligibleUsers.length; i++) {
          const up = eligibleUsers[i];
          const isLast = i === eligibleUsers.length - 1;
          const weight = method === 'WEIGHTED' ? this.getPlanWeight(up.plan.name) : 1;
          
          let amount = 0;
          if (method === 'EQUAL') {
              amount = isLast ? remainingPool : Math.floor((pool / eligibleUsers.length) * 100) / 100;
          } else {
              amount = isLast ? remainingPool : Math.floor(((pool * weight) / totalShares) * 100) / 100;
          }
          remainingPool -= amount;
          
          // Ensure rounding safely before db save
          amount = Math.round(amount * 100) / 100;
          sumCredited += amount;

          const seqStr = String(i + 1).padStart(3, '0');
          const reference = `${datePrefix}-${batch.id.slice(-6).toUpperCase()}-${seqStr}`;

          await tx.profitDistribution.create({
            data: {
              reference,
              userId: up.user.id,
              planId: up.planId,
              batchId: batch.id,
              investmentAmount: 0,
              grossProfit: amount,
              platformCut: 0,
              netProfit: amount,
              weight,
              type: distributionType || 'Weekly Profit',
              status: 'COMPLETED',
              note: note || `Bulk ${method} distribution | Batch: ${batch.id}`,
              distributionDate: now,
              weekKey,
            },
          });

          await tx.walletLedger.create({
            data: {
              userId: up.user.id,
              type: 'PROFIT_DISTRIBUTION',
              entryType: 'CREDIT',
              amount: amount,
              referenceId: reference,
              note: `${distributionType || 'Weekly Profit'} | ${weekKey} | Plan: ${up.plan.name}`,
            },
          });

          await createTransactionGroup(tx, {
            type: 'TRADE_PROFIT',
            description: `${distributionType || 'Weekly Profit'} | Ref: ${reference}`,
            idempotencyKey: `PROFIT_DIST_${reference}`,
            entries: [
              { accountType: 'SYSTEM', entryType: 'DEBIT', amount: amount, currency: 'USD' },
              { userId: up.user.id, partnerId: up.user.partnerId, accountType: 'USER', entryType: 'CREDIT', amount: amount, currency: 'USD' },
            ],
          });
        }

        // Verify mathematically
        sumCredited = Math.round(sumCredited * 100) / 100;
        if (sumCredited !== Math.round(pool * 100) / 100) {
           throw new Error(`Distribution mismatch: pool=${pool}, distributed=${sumCredited}`);
        }

        await tx.financialEvent.create({
          data: {
            eventType: 'PROFIT_DISTRIBUTED',
            actorId: adminId,
            referenceId: batch.id,
            metadata: { weekKey, successCount, totalNetProfit: pool, method },
          },
        });

        await tx.securityEvent.create({
          data: {
            adminId,
            action: 'PROFIT_DIST_BULK',
            reason: JSON.stringify({ batchId: batch.id, weekKey, successCount, totalNetProfit: pool }),
            ipAddress: clientIp,
          },
        });

        return batch;
      });

      if (distributionLock) {
        await this.prisma.profitDistributionLock.update({
          where: { id: distributionLock.id },
          data: { status: 'COMPLETED', endedAt: new Date() }
        }).catch(err => this.logger.error('Failed to mark lock COMPLETED', err));
      }

      return {
        success: true,
        summary: {
          totalProcessed,
          success: successCount,
          failed: 0,
          skipped: skippedCount,
          weekKey,
          batchId: result.id,
          totalAmount: pool,
          totalNetProfit: pool,
        },
        skipped,
      };
    } catch (error: any) {
      if (distributionLock) {
        await this.prisma.profitDistributionLock.update({
          where: { id: distributionLock.id },
          data: { status: 'FAILED_RECONCILIATION', endedAt: new Date() }
        }).catch(err => this.logger.error('Failed to mark lock FAILED', err));
      }
      return {
        success: false,
        error: error.message || 'Database transaction error',
        summary: { totalProcessed, success: 0, failed: successCount, skipped: skippedCount },
        skipped,
      };
    }
  }

  async reverseDistribution(
    adminId: string,
    batchId: string,
    reason: string,
    clientIp: string,
  ) {
    try {
      await this.prisma.$transaction(async (tx: any) => {
        const batch = await tx.profitDistributionBatch.findUnique({
          where: { id: batchId },
          include: { profitDistributions: { include: { user: true } } },
        });
        if (!batch) throw new Error('Batch not found');
        if (batch.status === 'REVERSED')
          throw new Error('This batch has already been reversed');

        const now = new Date();

        await tx.profitDistributionBatch.update({
          where: { id: batchId },
          data: { status: 'REVERSED', reversedAt: now, reversedBy: adminId },
        });

        for (const dist of batch.profitDistributions) {
          if (dist.status === 'REVERSED') continue;

          await tx.profitDistribution.update({
            where: { id: dist.id },
            data: { status: 'REVERSED', reversedAt: now, reversedBy: adminId },
          });

          const ledgerGroup = await tx.transactionGroup.findFirst({
            where: { idempotencyKey: `PROFIT_DIST_${dist.reference}` },
          });
          if (ledgerGroup) {
            await reverseTransactionGroup(
              tx,
              ledgerGroup.id,
              reason,
              adminId,
              clientIp,
            );
          }

          await tx.walletLedger.create({
            data: {
              userId: dist.userId,
              type: 'PROFIT_REVERSAL',
              entryType: 'DEBIT',
              amount: dist.netProfit,
              referenceId: dist.id,
              note: `Reversal of ${dist.reference} — ${reason}`,
            },
          });
        }

        await tx.financialEvent.create({
          data: {
            eventType: 'PROFIT_REVERSED',
            actorId: adminId,
            referenceId: batchId,
            metadata: {
              reason,
              reversedCount: batch.profitDistributions.length,
            },
          },
        });

        await tx.securityEvent.create({
          data: {
            adminId,
            action: 'PROFIT_DIST_REVERSED',
            reason: `Reversed batch ${batchId}: ${reason}`,
            ipAddress: clientIp,
          },
        });
      });

      return {
        success: true,
        message: `Batch ${batchId} reversed successfully`,
      };
    } catch (e: any) {
      console.error('Distribution reversal error:', e);
      return { error: e.message || 'Reversal failed', status: 400 };
    }
  }

  async getUserDetail(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        wallet: true,
        payments: { orderBy: { createdAt: 'desc' } },
        withdrawals: { orderBy: { createdAt: 'desc' } },
        trades: { orderBy: { createdAt: 'desc' } },
        securityEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
        generatedReports: { orderBy: { createdAt: 'desc' } },
        userPlans: {
          where: { active: true },
          include: { plan: true },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        partner: true,
      },
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    const walletBalance = user.wallet ? Number(user.wallet.realizedBalance) : 0;
    const unrealizedBalance = user.wallet
      ? Number(user.wallet.unrealizedBalance)
      : 0;
    const currentEquity = walletBalance + unrealizedBalance;

    const totalDeposits = user.payments
      .filter((p) => p.status === 'APPROVED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalWithdrawals = user.withdrawals
      .filter((w) => w.status === 'APPROVED')
      .reduce((sum, w) => sum + Number(w.amount), 0);

    const totalTrades = user.trades.length;
    const winningTrades = user.trades.filter((t) => Number(t.pnl) > 0).length;
    const losingTrades = user.trades.filter((t) => Number(t.pnl) <= 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const activeUserPlan = user.userPlans?.[0];
    let subscription: any = null;
    if (activeUserPlan) {
      const now = new Date();
      const expiresAt = activeUserPlan.expiresAt;
      const daysRemaining = expiresAt
        ? Math.max(
            0,
            Math.ceil(
              (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : null;
      const isActive = !expiresAt || (daysRemaining ?? 0) > 0;

      subscription = {
        planName: activeUserPlan.plan.name,
        status: isActive ? 'Active' : 'Expired',
        paidAt: activeUserPlan.startedAt,
        expiresAt: expiresAt?.toISOString() ?? null,
        daysRemaining,
      };
    }

    return {
      success: true,
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastLoginIP: user.lastLoginIP,
        partnerName: user.partner?.name || 'N/A',
      },
      subscription,
      wallet: {
        balance: walletBalance,
        unrealizedBalance,
        equity: currentEquity,
        totalDeposits,
        totalWithdrawals,
      },
      trading: {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
      },
      payments: user.payments.map((p) => ({
        id: p.id,
        planName: p.planName,
        amount: Number(p.amount),
        currency: p.currency,
        paymentType: p.paymentType,
        txnHash: p.txnHash || p.utr || p.id.slice(0, 12).toUpperCase(),
        status: p.status,
        createdAt: p.createdAt,
      })),
      trades: user.trades.map((t) => ({
        id: t.id,
        pair: t.pair,
        type: t.type,
        entryPrice: Number(t.entryPrice),
        currentPrice: Number(t.currentPrice),
        quantity: Number(t.quantity),
        exitPrice: Number(t.exitPrice),
        stopLoss: Number(t.stopLoss),
        target: Number(t.target),
        profit: Number(t.profit),
        pnl: Number(t.pnl),
        status: t.status,
        createdAt: t.createdAt,
        closedAt: t.closedAt,
      })),
      reports: user.generatedReports.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        reportType: r.reportType,
        fileUrl: r.fileUrl,
        createdAt: r.createdAt,
      })),
      security: {
        lastLoginAt: user.lastLoginAt,
        lastLoginIP: user.lastLoginIP,
        emailVerified: true,
        twoFactorEnabled: false,
        events: user.securityEvents.map((e) => ({
          id: e.id,
          action: e.action,
          reason: e.reason,
          ipAddress: e.ipAddress,
          createdAt: e.createdAt,
        })),
      },
    };
  }

  async listWithdrawals() {
    const list = await this.prisma.withdrawal.findMany({
      include: { user: { include: { wallet: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((w: any) => ({
      id: w.id,
      withdrawalId: w.withdrawalId,
      userId: w.userId,
      userName: w.user?.name || 'Unknown User',
      userEmail: w.user?.email || 'N/A',
      amount: Number(w.amount),
      status:
        w.status === 'PENDING'
          ? 'Pending'
          : w.status === 'APPROVED'
            ? 'Approved'
            : 'Rejected',
      method: w.method || 'Bank Transfer',
      accountDetails: w.accountDetails || '',
      notes: w.notes || '',
      currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
      availableBalance: w.user?.wallet
        ? Number(w.user.wallet.availableBalance)
        : 0,
      pendingWithdrawals: w.user?.wallet
        ? Number(w.user.wallet.pendingWithdrawals)
        : 0,
      requestedAt: w.createdAt,
      processedAt: w.processedAt,
      date: w.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));
  }

  async getWithdrawalDetail(id: string) {
    const w = await this.prisma.withdrawal.findFirst({
      where: {
        OR: [{ id }, { withdrawalId: id }],
      },
      include: { user: { include: { wallet: true } } },
    });
    if (!w) throw new Error('Withdrawal request not found');
    return {
      id: w.id,
      withdrawalId: w.withdrawalId,
      userId: w.userId,
      userName: w.user?.name || 'Unknown User',
      userEmail: w.user?.email || 'N/A',
      amount: Number(w.amount),
      status:
        w.status === 'PENDING'
          ? 'Pending'
          : w.status === 'APPROVED'
            ? 'Approved'
            : 'Rejected',
      method: w.method || 'Bank Transfer',
      accountDetails: w.accountDetails || '',
      notes: w.notes || '',
      currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
      availableBalance: w.user?.wallet
        ? Number(w.user.wallet.availableBalance)
        : 0,
      pendingWithdrawals: w.user?.wallet
        ? Number(w.user.wallet.pendingWithdrawals)
        : 0,
      requestedAt: w.createdAt,
      processedAt: w.processedAt,
      date: w.createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
  }

  async getPnlReports() {
    const trades = await this.prisma.tradeRecord.findMany({
      orderBy: { tradeDate: 'desc' },
    });

    const totalTrades = trades.length;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;
    let totalPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    const monthlyPnlMap: Record<string, number> = {};

    trades.forEach((t) => {
      const pnl = Number(t.profitLoss);
      totalPnl += pnl;

      if (pnl > 0) {
        winningTrades++;
        grossProfit += pnl;
      } else if (pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(pnl);
      } else {
        breakevenTrades++;
      }

      const date = new Date(t.tradeDate);
      const month = date.toLocaleString('default', { month: 'short' });
      monthlyPnlMap[month] = (monthlyPnlMap[month] || 0) + pnl;
    });

    const winRate =
      totalTrades > 0
        ? ((winningTrades / totalTrades) * 100).toFixed(2)
        : '0.00';
    const lossRate =
      totalTrades > 0
        ? ((losingTrades / totalTrades) * 100).toFixed(2)
        : '0.00';
    const breakevenRate =
      totalTrades > 0
        ? ((breakevenTrades / totalTrades) * 100).toFixed(2)
        : '0.00';

    const averageWin =
      winningTrades > 0 ? (grossProfit / winningTrades).toFixed(2) : '0.00';
    const averageLoss =
      losingTrades > 0 ? (grossLoss / losingTrades).toFixed(2) : '0.00';

    const profitFactor =
      grossLoss > 0
        ? (grossProfit / grossLoss).toFixed(2)
        : grossProfit > 0
          ? 'Infinite'
          : '0.00';

    const monthlyPnl = Object.keys(monthlyPnlMap).map((month) => ({
      month,
      pnl: monthlyPnlMap[month],
    }));

    const rows = [
      [
        'All Users',
        `$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        '-',
        `${winRate}%`,
      ],
    ];

    return {
      overview: {
        totalTrades,
        winningTrades,
        losingTrades,
        breakevenTrades,
        winRate: Number(winRate),
        lossRate: Number(lossRate),
        breakevenRate: Number(breakevenRate),
        totalPnl,
        averageWin: Number(averageWin),
        averageLoss: Number(averageLoss),
        profitFactor,
        grossProfit,
        grossLoss,
      },
      profitDistribution: {
        winningTrades,
        losingTrades,
        breakevenTrades,
        winRate: Number(winRate),
        lossRate: Number(lossRate),
        breakevenRate: Number(breakevenRate),
      },
      monthlyPnl,
      rows,
    };
  }

  async getInquiries() {
    return this.prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInquiryStatus(id: string, status: string) {
    if (!['PENDING', 'RESPONDED', 'CLOSED'].includes(status)) {
      return { error: 'Invalid status value', status: 400 };
    }
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
    });
    if (!inquiry) {
      return { error: 'Inquiry not found', status: 404 };
    }
    return this.prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }

  async getInitiatedPayments() {
    const initiations = await this.prisma.paymentInitiation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        plan: { select: { name: true } },
      },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let initiatedToday = 0;
    let initiatedWeek = 0;
    let pendingFollowUps = 0;
    let convertedLeads = 0;
    let abandonedValue = 0;
    let recoveredRevenue = 0;

    for (const init of initiations) {
      if (new Date(init.createdAt) >= today) initiatedToday++;
      if (new Date(init.createdAt) >= weekAgo) initiatedWeek++;
      if (['PENDING', 'FOLLOWUP_REQUIRED'].includes(init.followUpStatus))
        pendingFollowUps++;

      const amount = Number(init.amount) || 0;
      if (init.followUpStatus === 'CONVERTED' || init.status === 'completed') {
        convertedLeads++;
        recoveredRevenue += amount;
      } else {
        abandonedValue += amount;
      }
    }

    const conversionRate =
      initiations.length > 0
        ? Number(((convertedLeads / initiations.length) * 100).toFixed(1))
        : 0;

    return {
      success: true,
      metrics: {
        initiatedToday,
        initiatedWeek,
        pendingFollowUps,
        convertedLeads,
        abandonedValue,
        recoveredRevenue,
        conversionRate,
      },
      initiatedPayments: initiations,
    };
  }

  async updateInitiatedPayment(
    id: string,
    body: any,
    adminId: string,
    clientIp: string,
  ) {
    const { followUpStatus, remarks, contactedAt } = body;
    const existing = await this.prisma.paymentInitiation.findUnique({
      where: { id },
    });
    if (!existing)
      return { error: 'Payment initiation not found', status: 404 };

    const updateData: any = {};
    if (followUpStatus) updateData.followUpStatus = followUpStatus;
    if (remarks) updateData.remarks = remarks;
    if (contactedAt) updateData.contactedAt = new Date(contactedAt);

    const updated = await this.prisma.paymentInitiation.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId,
        action: 'PAYMENT_INITIATION_UPDATE',
        reason: `Updated followUpStatus to ${followUpStatus} for ${id}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, initiatedPayment: updated };
  }

  async uploadQrCode(base64Image: string) {
    if (!base64Image) {
      return { error: 'No image data provided', status: 400 };
    }
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return {
        error: 'Invalid image format. Must be a base64 encoded image.',
        status: 400,
      };
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    if (
      !['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(mimeType)
    ) {
      return {
        error: 'Invalid image type. Only PNG, JPEG, JPG, and WEBP are allowed.',
        status: 400,
      };
    }

    const extension = mimeType.split('/')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return { error: 'File size too large. Max 5MB.', status: 400 };
    }

    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'uploads', 'payment-methods');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `upi-qr-${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    return { success: true, url: `/uploads/payment-methods/${fileName}` };
  }
}
