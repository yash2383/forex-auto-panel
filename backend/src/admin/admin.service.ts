import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../common/crypto.util';
import { createTransactionGroup, reverseTransactionGroup } from '../common/ledger.util';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getData() {
    const [
      dbUsers, dbPayments, dbTrades, dbLogs, dbPartners, dbSettings,
      dbCampaigns, dbReferrals, dbAdmins, dbWithdrawals, dbPlans,
    ] = await Promise.all([
      this.prisma.user.findMany({ where: { isDeleted: false }, include: { wallet: true, partner: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.trade.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.securityEvent.findMany({ include: { admin: true, user: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      this.prisma.partner.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.systemSettings.findFirst(),
      this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.referral.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.admin.findMany({ orderBy: { createdAt: 'desc' } }),
      this.prisma.withdrawal.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } }),
    ]);

    const users = dbUsers.map((u) => {
      let plan = 'None';
      if (u.status === 'ACTIVE') plan = 'Basic';
      else if (u.status === 'VIP') plan = 'Premium';
      else if (u.status === 'EXPIRED') plan = 'Basic';

      let statusLabel = 'New';
      if (u.status === 'ACTIVE') statusLabel = 'Active';
      else if (u.status === 'VIP') statusLabel = 'VIP';
      else if (u.status === 'EXPIRED') statusLabel = 'Expired';
      else if (u.status === 'BLOCKED') statusLabel = 'Blocked';

      const balance = u.wallet ? Number(u.wallet.realizedBalance) : 0;

      return {
        id: u.id, name: u.name, email: u.email,
        deposit: `₹${balance.toLocaleString('en-IN')}`, rawDeposit: balance,
        plan, status: statusLabel, partnerId: u.partnerId,
        partnerName: u.partner?.name || 'N/A',
      };
    });

    const payments = dbPayments.map((p: any) => {
      let statusLabel = 'Pending';
      let dotColor = 'bg-yellow-400';
      if (p.status === 'APPROVED') { statusLabel = 'Approved'; dotColor = 'bg-green-400'; }
      else if (p.status === 'REJECTED') { statusLabel = 'Rejected'; dotColor = 'bg-red-400'; }
      else if (p.status === 'VERIFIED') { statusLabel = 'Verified'; dotColor = 'bg-blue-400'; }

      return {
        id: p.id,
        user: p.user?.name || 'Unknown User',
        email: p.user?.email || '',
        initials: (p.user?.name || 'U').split(' ').map((n: any) => n[0]).join('').toUpperCase().slice(0, 2),
        plan: p.planName,
        amount: `₹${Number(p.amount).toLocaleString('en-IN')}`,
        rawAmount: Number(p.amount),
        utr: p.utr || '', txnHash: p.txnHash || '', network: p.network || 'TRC20',
        screenshot: p.screenshot || '',
        date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: p.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        dot: dotColor, status: statusLabel, paymentType: p.paymentType, remark: p.remark || '',
      };
    });

    const trades = dbTrades.map((t: any) => ({
      id: t.id, pair: t.pair, type: t.type,
      entry: Number(t.entryPrice), exit: Number(t.exitPrice),
      stopLoss: Number(t.stopLoss), target: Number(t.target),
      profit: Number(t.profit), pnl: Number(t.pnl),
      status: t.status === 'ACTIVE' ? 'Active' : 'Closed',
      userId: t.userId, userName: t.user?.name || 'Unknown User',
    }));

    const logs = dbLogs.map((l) => ({
      id: l.id, actor: l.admin?.name || l.user?.name || 'System',
      action: l.action, module: l.action.split('_')[0] || 'System',
      targetId: l.userId || l.adminId || '',
      time: l.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' - ' + l.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      status: 'Success', ipAddress: l.ipAddress || '127.0.0.1',
    }));

    const partners = dbPartners.map((p: any) => ({
      id: p.slug, rawId: p.id, name: p.name, companyName: p.companyName,
      email: p.email, profitShare: Number(p.profitSharePct), maxAllowedShare: Number(p.maxAllowedPct),
      domain: p.domain, logo: p.logo || p.name.slice(0, 2).toUpperCase(),
      usersCount: dbUsers.filter((u) => u.partnerId === p.id).length,
      revenue: Number(dbPayments.filter((pay) => pay.partnerId === p.id && pay.status === 'APPROVED').reduce((sum, pay) => sum + Number(pay.amount), 0)),
      withdrawn: Number(dbWithdrawals.filter((w: any) => w.partnerId === p.id && w.status === 'APPROVED').reduce((sum: number, w: any) => sum + Number(w.amount), 0)),
      status: p.status === 'ACTIVE' ? 'Active' : 'Suspended',
    }));

    const campaigns = dbCampaigns.map((c) => ({
      id: c.id, name: c.name, trackingLink: `/register?campaign=${c.slug}`,
      users: dbUsers.filter((u) => u.partnerId === c.partnerId).length,
      revenue: `₹${Number(dbPayments.filter((p: any) => p.partnerId === c.partnerId && p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString('en-IN')}`,
      status: c.isActive ? 'Active' : 'Inactive',
    }));

    const referrals = dbReferrals.map((r) => {
      const referrerUser = dbUsers.find((u) => u.id === r.referrerId);
      const referredUser = dbUsers.find((u) => u.id === r.referredId);
      return {
        id: r.id, referrer: referrerUser?.name || 'Unknown', user: referredUser?.name || 'Unknown',
        deposit: referredUser?.wallet ? `₹${Number(referredUser.wallet.realizedBalance).toLocaleString('en-IN')}` : '₹0',
        reward: `₹${Number(r.rewardAmount).toLocaleString('en-IN')}`,
        status: r.status === 'PENDING' ? 'Pending' : r.status === 'PAID' ? 'Paid' : 'Cancelled',
      };
    });

    const admins = dbAdmins.map((a) => ({
      id: a.id, name: a.name, email: a.email,
      role: a.role === 'SUPER_ADMIN' ? 'Super Admin' : a.role === 'MANAGER' ? 'Manager' : 'Viewer',
      status: a.status === 'ACTIVE' ? 'Active' : 'Suspended',
      permissions: typeof a.permissions === 'string' ? JSON.parse(a.permissions) : a.permissions,
    }));

    const transactions = [
      ...dbWithdrawals.map((w: any) => ({
        id: w.id, userId: w.userId, userName: w.user?.name || 'Unknown User',
        type: 'Withdrawal', amount: `₹${Number(w.amount).toLocaleString('en-IN')}`, rawAmount: Number(w.amount),
        method: 'Bank Transfer',
        status: w.status === 'PENDING' ? 'Pending' : w.status === 'APPROVED' ? 'Approved' : 'Rejected',
        date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })),
      ...dbPayments.filter((p: any) => p.status === 'APPROVED').map((p: any) => ({
        id: p.id, userId: p.userId, userName: p.user?.name || 'Unknown User',
        type: 'Deposit', amount: `₹${Number(p.amount).toLocaleString('en-IN')}`, rawAmount: Number(p.amount),
        method: p.paymentType, status: 'Approved',
        date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalUsers = dbUsers.length;
    const activeUsers = dbUsers.filter((u) => u.status === 'ACTIVE' || u.status === 'VIP').length;
    const totalRevenue = dbPayments.filter((p: any) => p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount), 0);
    const totalUserWalletBalance = dbUsers.reduce((sum, u) => sum + (u.wallet ? Number(u.wallet.realizedBalance) : 0), 0);

    const platformStats = {
      totalUsers: totalUsers.toLocaleString(),
      activeUsers: activeUsers.toLocaleString(),
      totalRevenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
      totalUserWalletBalance: `₹${totalUserWalletBalance.toLocaleString('en-IN')}`,
    };

    const settings = {
      upiId: dbSettings?.upiId || 'tradebot@upi',
      usdt: { network: dbSettings?.usdtNetwork || 'TRC20', walletAddress: dbSettings?.usdtAddress || 'TXYZ123ABC456DEF789GHI' },
      financials: { platformFee: Number(dbSettings?.platformFeePct || 30), referralFee: Number(dbSettings?.referralFeePct || 10) },
      system: { maintenanceMode: dbSettings?.maintenance || false },
      paymentModes: { upi: !!dbSettings?.upiId, bank: false, usdt: dbSettings ? !!dbSettings.usdtAddress : true },
    };

    return {
      stats: platformStats, users, payments, trades, logs, partners, campaigns,
      referrals, admins, transactions, settings,
      plans: dbPlans.map((p: any) => ({
        id: p.id, name: p.name, subtitle: p.subtitle, capitalLabel: p.capitalLabel,
        desc: p.desc, features: p.features, btnText: p.btnText, status: p.status, isPopular: p.isPopular,
      })),
    };
  }

  async createUser(adminId: string, body: any, clientIp: string) {
    const { name, email, password, partnerId, plan, deposit } = body;
    if (!name || !email || !password) return { error: 'Name, email and password are required', status: 400 };

    let targetPartnerId = partnerId;
    if (!targetPartnerId) {
      const partner = await this.prisma.partner.findFirst();
      if (!partner) return { error: 'No white-label partners exist. Create a partner first.', status: 400 };
      targetPartnerId = partner.id;
    }

    const existing = await this.prisma.user.findFirst({
      where: { partnerId: targetPartnerId, email: email.toLowerCase().trim(), isDeleted: false },
    });
    if (existing) return { error: 'User email already exists under this partner', status: 400 };

    let userStatus = 'NEW';
    if (plan === 'Basic') userStatus = 'ACTIVE';
    else if (plan === 'Premium') userStatus = 'VIP';
    else if (plan === 'Pro') userStatus = 'ACTIVE';
    else if (plan === 'VIP') userStatus = 'VIP';

    const cleanDeposit = deposit ? Number(String(deposit).replace(/[^\d.-]/g, '')) : 0;

    const user = await this.prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: { partnerId: targetPartnerId, name, email: email.toLowerCase().trim(), passwordHash: hashPassword(password), status: userStatus as any },
      });
      await tx.wallet.create({
        data: { userId: u.id, realizedBalance: isNaN(cleanDeposit) ? 0 : cleanDeposit, unrealizedBalance: 0, currency: 'INR' },
      });
      return u;
    });

    await this.prisma.securityEvent.create({
      data: { adminId, userId: user.id, partnerId: targetPartnerId, action: 'USER_CREATE', reason: `Manually created user ${user.email}`, ipAddress: clientIp },
    });

    return { success: true, user };
  }

  async updateUser(adminId: string, userId: string, body: any, clientIp: string) {
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

    const updatedUser = await this.prisma.user.update({ where: { id: userId }, data: updateData });

    if (deposit !== undefined) {
      const cleanDeposit = Number(String(deposit).replace(/[^\d.-]/g, ''));
      if (!isNaN(cleanDeposit)) {
        await this.prisma.wallet.update({ where: { userId }, data: { realizedBalance: cleanDeposit } });
      }
    }

    await this.prisma.securityEvent.create({
      data: {
        adminId, userId, partnerId: user.partnerId, action: 'USER_UPDATE',
        reason: `Updated user details. Modified fields: ${Object.keys(updateData).concat(deposit !== undefined ? ['deposit'] : []).join(', ')}`,
        ipAddress: clientIp,
      },
    });

    return { success: true, user: updatedUser };
  }

  async deleteUser(adminId: string, userId: string, clientIp: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'User not found', status: 404 };

    await this.prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });

    await this.prisma.securityEvent.create({
      data: { adminId, userId, partnerId: user.partnerId, action: 'USER_DELETE', reason: `Soft deleted user ${user.email}`, ipAddress: clientIp },
    });

    return { success: true, message: 'User soft deleted successfully' };
  }

  async createPartner(adminId: string, body: any, clientIp: string) {
    const { name, companyName, email, password, profitShare, maxAllowedShare, domain, logo } = body;
    if (!name || !companyName || !email || !password || !domain) return { error: 'Missing required partner fields', status: 400 };

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedDomain = domain.toLowerCase().trim();

    const existing = await this.prisma.partner.findFirst({
      where: { OR: [{ slug }, { email: normalizedEmail }, { domain: normalizedDomain }] },
    });
    if (existing) return { error: 'Partner with similar name, email, or domain already exists', status: 400 };

    const partner = await this.prisma.partner.create({
      data: {
        slug, name, companyName, email: normalizedEmail, passwordHash: hashPassword(password),
        profitSharePct: Number(profitShare || 30.00), maxAllowedPct: Number(maxAllowedShare || 40.00),
        domain: normalizedDomain, logo: logo || name.slice(0, 2).toUpperCase(), status: 'ACTIVE',
      },
    });

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'PARTNER_CREATE', reason: `Created white-label partner ${name} (${slug})`, ipAddress: clientIp },
    });

    return { success: true, partner };
  }

  async createPlan(adminId: string, body: any, clientIp: string) {
    const { name, subtitle, capitalLabel, desc, features, btnText, status, isPopular } = body;
    if (!name || !subtitle || !capitalLabel || !desc) return { error: 'Name, subtitle, capital label, and description are required', status: 400 };

    const plan = await this.prisma.plan.create({
      data: {
        name, subtitle, capitalLabel, desc,
        features: Array.isArray(features) ? features : [],
        btnText: btnText || 'Get Started', status: status || 'Active', isPopular: !!isPopular,
      },
    });

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'PLAN_CREATE', reason: `Created pricing plan ${plan.name}`, ipAddress: clientIp },
    });

    return { success: true, plan };
  }

  async updatePlan(adminId: string, planId: string, body: any, clientIp: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: 'Plan not found', status: 404 };

    const updatedPlan = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        name: body.name ?? plan.name,
        subtitle: body.subtitle ?? plan.subtitle,
        capitalLabel: body.capitalLabel ?? plan.capitalLabel,
        desc: body.desc ?? plan.desc,
        features: body.features ?? plan.features,
        btnText: body.btnText ?? plan.btnText,
        status: body.status ?? plan.status,
        isPopular: body.isPopular !== undefined ? body.isPopular : plan.isPopular,
      },
    });

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'PLAN_UPDATE', reason: `Updated pricing plan ${updatedPlan.name}`, ipAddress: clientIp },
    });

    return { success: true, plan: updatedPlan };
  }

  async deletePlan(adminId: string, planId: string, clientIp: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return { error: 'Plan not found', status: 404 };

    await this.prisma.plan.delete({ where: { id: planId } });

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'PLAN_DELETE', reason: `Deleted pricing plan ${plan.name}`, ipAddress: clientIp },
    });

    return { success: true, message: 'Plan deleted successfully' };
  }

  async getSettings() {
    const settings = await this.prisma.systemSettings.findFirst();
    return { success: true, settings };
  }

  async updateSettings(adminId: string, body: any, clientIp: string) {
    const { upiId, usdtAddress, usdtNetwork, platformFee, referralFee, maintenance } = body;
    const existing = await this.prisma.systemSettings.findFirst();

    let settings;
    if (existing) {
      settings = await this.prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          upiId: upiId !== undefined ? upiId : existing.upiId,
          usdtAddress: usdtAddress !== undefined ? usdtAddress : existing.usdtAddress,
          usdtNetwork: usdtNetwork !== undefined ? usdtNetwork : existing.usdtNetwork,
          platformFeePct: platformFee !== undefined ? Number(platformFee) : existing.platformFeePct,
          referralFeePct: referralFee !== undefined ? Number(referralFee) : existing.referralFeePct,
          maintenance: maintenance !== undefined ? Boolean(maintenance) : existing.maintenance,
        },
      });
    } else {
      settings = await this.prisma.systemSettings.create({
        data: {
          upiId: upiId || null, usdtAddress: usdtAddress || null, usdtNetwork: usdtNetwork || 'TRC20',
          platformFeePct: platformFee !== undefined ? Number(platformFee) : 30.00,
          referralFeePct: referralFee !== undefined ? Number(referralFee) : 10.00,
          maintenance: maintenance !== undefined ? Boolean(maintenance) : false,
        },
      });
    }

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'SETTINGS_UPDATE', reason: 'Updated global platform settings', ipAddress: clientIp },
    });

    return { success: true, settings };
  }

  async createTrade(adminId: string, body: any, clientIp: string) {
    const { userId, pair, type, entry, stopLoss, target } = body;
    if (!userId || !pair || !type || !entry || !stopLoss || !target) return { error: 'Missing required trade signal fields', status: 400 };

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'Target user not found', status: 404 };

    const trade = await this.prisma.trade.create({
      data: {
        userId, partnerId: user.partnerId, pair, type: type === 'BUY' ? 'BUY' : 'SELL',
        entryPrice: Number(entry), currentPrice: Number(entry), stopLoss: Number(stopLoss), target: Number(target),
        profit: 0, pnl: 0, status: 'ACTIVE',
      },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId, userId, partnerId: user.partnerId, action: 'TRADE_CREATE',
        reason: `Created active trade signal for ${pair} (Type: ${type}, Entry: ${entry})`, ipAddress: clientIp,
      },
    });

    return { success: true, trade };
  }

  async closeTrade(adminId: string, tradeId: string, exitPrice: number | undefined, clientIp: string) {
    const trade = await this.prisma.trade.findUnique({
      where: { id: tradeId },
      include: { user: { include: { wallet: true } } },
    });
    if (!trade) return { error: 'Trade not found', status: 404 };
    if (trade.status !== 'ACTIVE') return { error: 'Trade is not active', status: 400 };
    if (!exitPrice || Number(exitPrice) <= 0) return { error: 'A valid exit price is required', status: 400 };

    const entryPrice = trade.entryPrice;
    const settlementPrice = new Prisma.Decimal(exitPrice);
    const quantity = trade.quantity;

    const isBuy = trade.type === 'BUY';
    let pnl = settlementPrice.minus(entryPrice).mul(quantity);
    if (!isBuy) pnl = entryPrice.minus(settlementPrice).mul(quantity);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.trade.update({
        where: { id: trade.id },
        data: { status: 'CLOSED', currentPrice: settlementPrice, exitPrice: settlementPrice, pnl, profit: pnl, closedAt: new Date() },
      });

      if (trade.user?.wallet) {
        const originalMargin = entryPrice.mul(quantity);
        const returnAmount = originalMargin.add(pnl);
        const nextBalance = trade.user.wallet.realizedBalance.add(returnAmount);

        await tx.wallet.update({ where: { id: trade.user.wallet.id }, data: { realizedBalance: nextBalance } });

        const group = await tx.transactionGroup.create({
          data: {
            type: pnl.isPositive() ? 'TRADE_PROFIT' : 'TRADE_LOSS',
            description: `Admin closed trade ${trade.id} | PnL: ₹${pnl.toFixed(2)}`,
            idempotencyKey: `TRADE_SETTLE_ADMIN_${trade.id}`,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionGroupId: group.id, userId: trade.userId, partnerId: trade.partnerId,
            accountType: 'USER', entryType: pnl.isPositive() ? 'CREDIT' : 'DEBIT',
            amount: pnl.abs(), currency: 'INR',
          },
        });
      }
    });

    await this.prisma.securityEvent.create({
      data: { adminId, userId: trade.userId, partnerId: trade.partnerId, action: 'TRADE_CLOSE', reason: `Admin closed trade ${trade.id}`, ipAddress: clientIp },
    });

    return { success: true };
  }

  async approvePayment(adminId: string, paymentId: string, clientIp: string) {
    const result = await this.prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
      if (!payment) throw new Error('Payment record not found');
      if (payment.status === 'APPROVED') throw new Error('Payment has already been approved');

      const amountVal = Number(payment.amount);
      const idempotencyKey = `DEP_APPROVAL_${payment.id}`;

      const ledgerGroup = await createTransactionGroup(tx, {
        type: 'DEPOSIT', description: `Manual approval of checkout payment ${payment.id}`, idempotencyKey,
        entries: [
          { accountType: 'SYSTEM', entryType: 'DEBIT', amount: amountVal, currency: payment.currency },
          { userId: payment.userId, partnerId: payment.partnerId, accountType: 'USER', entryType: 'CREDIT', amount: amountVal, currency: payment.currency },
        ],
      });

      let nextStatus = 'ACTIVE';
      const planName = payment.planName.toLowerCase();
      if (planName.includes('premium') || planName.includes('vip')) nextStatus = 'VIP';

      await tx.user.update({ where: { id: payment.userId }, data: { status: nextStatus as any } });
      const updatedPayment = await tx.payment.update({ where: { id: paymentId }, data: { status: 'APPROVED', ledgerTransactionGroupId: ledgerGroup.id } });

      await tx.securityEvent.create({
        data: { adminId, userId: payment.userId, partnerId: payment.partnerId, action: 'PAYMENT_APPROVED', reason: `Approved payment ${payment.id} for amount ${amountVal}`, ipAddress: clientIp },
      });

      return updatedPayment;
    });

    return { success: true, payment: result };
  }

  async rejectPayment(adminId: string, paymentId: string, remark: string, clientIp: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { error: 'Payment record not found', status: 404 };
    if (payment.status === 'APPROVED') return { error: 'Approved payments cannot be rejected', status: 400 };

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId }, data: { status: 'REJECTED', remark: remark || 'Declined by admin' },
    });

    await this.prisma.securityEvent.create({
      data: {
        adminId, userId: payment.userId, partnerId: payment.partnerId, action: 'PAYMENT_REJECTED',
        reason: `Rejected payment ${payment.id}. Reason: ${remark || 'Declined by admin'}`, ipAddress: clientIp,
      },
    });

    return { success: true, payment: updatedPayment };
  }

  async verifyPayment(adminId: string, paymentId: string, clientIp: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return { error: 'Payment record not found', status: 404 };
    if (payment.status !== 'PENDING') return { error: 'Only pending payments can be verified', status: 400 };

    const updatedPayment = await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'VERIFIED' } });

    await this.prisma.securityEvent.create({
      data: { adminId, userId: payment.userId, partnerId: payment.partnerId, action: 'PAYMENT_VERIFIED', reason: `Verified details for payment ${payment.id}`, ipAddress: clientIp },
    });

    return { success: true, payment: updatedPayment };
  }

  async approveWithdrawal(adminId: string, withdrawalId: string, clientIp: string) {
    const result = await this.prisma.$transaction(async (tx: any) => {
      const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!withdrawal) throw new Error('Withdrawal record not found');
      if (withdrawal.status !== 'PENDING') throw new Error('Withdrawal has already been processed');

      const amountVal = Number(withdrawal.amount);
      const idempotencyKey = `WITHDRAWAL_APPROVAL_${withdrawal.id}`;

      const ledgerGroup = await createTransactionGroup(tx, {
        type: 'WITHDRAWAL', description: `Manual approval of withdrawal request ${withdrawal.id}`, idempotencyKey,
        entries: [
          { userId: withdrawal.userId, partnerId: withdrawal.partnerId, accountType: 'USER', entryType: 'DEBIT', amount: amountVal, currency: withdrawal.currency },
          { accountType: 'SYSTEM', entryType: 'CREDIT', amount: amountVal, currency: withdrawal.currency },
        ],
      });

      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id: withdrawalId }, data: { status: 'APPROVED', ledgerTransactionGroupId: ledgerGroup.id },
      });

      await tx.securityEvent.create({
        data: { adminId, userId: withdrawal.userId, partnerId: withdrawal.partnerId, action: 'WITHDRAWAL_APPROVED', reason: `Approved withdrawal ${withdrawal.id} for amount ${amountVal}`, ipAddress: clientIp },
      });

      return updatedWithdrawal;
    });

    return { success: true, withdrawal: result };
  }

  async rejectWithdrawal(adminId: string, withdrawalId: string, clientIp: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) return { error: 'Withdrawal record not found', status: 404 };
    if (withdrawal.status !== 'PENDING') return { error: 'Only pending withdrawals can be rejected', status: 400 };

    const updatedWithdrawal = await this.prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'REJECTED' } });

    await this.prisma.securityEvent.create({
      data: { adminId, userId: withdrawal.userId, partnerId: withdrawal.partnerId, action: 'WITHDRAWAL_REJECTED', reason: `Rejected withdrawal request ${withdrawal.id}`, ipAddress: clientIp },
    });

    return { success: true, withdrawal: updatedWithdrawal };
  }

  async reverseTransaction(adminId: string, transactionGroupId: string, reason: string, clientIp: string) {
    const result = await this.prisma.$transaction(async (tx: any) => {
      return reverseTransactionGroup(tx, transactionGroupId, reason, adminId, clientIp);
    });

    await this.prisma.securityEvent.create({
      data: { adminId, action: 'TRANSACTION_REVERSED', reason: `Reversed transaction group ${transactionGroupId}. Reason: ${reason}`, ipAddress: clientIp },
    });

    return { success: true, reversalGroup: result };
  }
}
