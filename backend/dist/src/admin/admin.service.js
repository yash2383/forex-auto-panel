"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/crypto.util");
const ledger_util_1 = require("../common/ledger.util");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getData() {
        const [dbUsers, dbPayments, dbTrades, dbLogs, dbPartners, dbSettings, dbCampaigns, dbReferrals, dbAdmins, dbWithdrawals, dbPlans, dbProfitDistributions, dbReferralSettings] = await Promise.all([
            this.prisma.user.findMany({ where: { isDeleted: false }, include: { wallet: true, partner: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.tradeRecord.findMany({ orderBy: { tradeDate: 'desc' } }),
            this.prisma.securityEvent.findMany({ include: { admin: true, user: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
            this.prisma.partner.findMany({ orderBy: { createdAt: 'desc' } }),
            this.prisma.systemSettings.findFirst(),
            this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
            this.prisma.referral.findMany({ orderBy: { createdAt: 'desc' } }),
            this.prisma.admin.findMany({ orderBy: { createdAt: 'desc' } }),
            this.prisma.withdrawal.findMany({ include: { user: { include: { wallet: true } } }, orderBy: { createdAt: 'desc' } }),
            this.prisma.plan.findMany({ orderBy: { createdAt: 'asc' } }),
            this.prisma.profitDistribution.findMany({ include: { user: true }, orderBy: { distributionDate: 'desc' } }),
            this.prisma.referralSettings.findFirst(),
        ]);
        const users = dbUsers.map((u) => {
            let plan = 'None';
            if (u.status === 'ACTIVE')
                plan = 'Basic';
            else if (u.status === 'VIP')
                plan = 'Premium';
            else if (u.status === 'EXPIRED')
                plan = 'Basic';
            let statusLabel = 'New';
            if (u.status === 'ACTIVE')
                statusLabel = 'Active';
            else if (u.status === 'VIP')
                statusLabel = 'VIP';
            else if (u.status === 'EXPIRED')
                statusLabel = 'Expired';
            else if (u.status === 'BLOCKED')
                statusLabel = 'Blocked';
            const balance = u.wallet ? Number(u.wallet.realizedBalance) : 0;
            return {
                id: u.id, name: u.name, email: u.email,
                deposit: `₹${balance.toLocaleString('en-IN')}`, rawDeposit: balance,
                plan, status: statusLabel, partnerId: u.partnerId,
                partnerName: u.partner?.name || 'N/A',
            };
        });
        const payments = dbPayments.map((p) => {
            let statusLabel = 'Pending';
            let dotColor = 'bg-yellow-400';
            if (p.status === 'APPROVED') {
                statusLabel = 'Approved';
                dotColor = 'bg-green-400';
            }
            else if (p.status === 'REJECTED') {
                statusLabel = 'Rejected';
                dotColor = 'bg-red-400';
            }
            else if (p.status === 'VERIFIED') {
                statusLabel = 'Verified';
                dotColor = 'bg-blue-400';
            }
            return {
                id: p.id,
                user: p.user?.name || 'Unknown User',
                email: p.user?.email || '',
                initials: (p.user?.name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
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
        const trades = dbTrades.map((t) => ({
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
            id: l.id, actor: l.admin?.name || l.user?.name || 'System',
            action: l.action, module: l.action.split('_')[0] || 'System',
            targetId: l.userId || l.adminId || '',
            time: l.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' - ' + l.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            status: 'Success', ipAddress: l.ipAddress || '127.0.0.1',
        }));
        const partners = dbPartners.map((p) => ({
            id: p.slug, rawId: p.id, name: p.name, companyName: p.companyName,
            email: p.email, profitShare: Number(p.profitSharePct), maxAllowedShare: Number(p.maxAllowedPct),
            domain: p.domain, logo: p.logo || p.name.slice(0, 2).toUpperCase(),
            usersCount: dbUsers.filter((u) => u.partnerId === p.id).length,
            revenue: Number(dbPayments.filter((pay) => pay.partnerId === p.id && pay.status === 'APPROVED').reduce((sum, pay) => sum + Number(pay.amount), 0)),
            withdrawn: Number(dbWithdrawals.filter((w) => w.partnerId === p.id && w.status === 'APPROVED').reduce((sum, w) => sum + Number(w.amount), 0)),
            status: p.status === 'ACTIVE' ? 'Active' : 'Suspended',
        }));
        const campaigns = dbCampaigns.map((c) => ({
            id: c.id, name: c.name, trackingLink: `/register?campaign=${c.slug}`,
            users: dbUsers.filter((u) => u.partnerId === c.partnerId).length,
            revenue: `₹${Number(dbPayments.filter((p) => p.partnerId === c.partnerId && p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString('en-IN')}`,
            status: c.isActive ? 'Active' : 'Inactive',
        }));
        const referrals = dbReferrals.map((r) => {
            const referrerUser = dbUsers.find((u) => u.id === r.referrerId);
            const referredUser = dbUsers.find((u) => u.id === r.referredId);
            return {
                id: r.id, referrer: referrerUser?.name || 'Unknown', user: referredUser?.name || 'Unknown',
                deposit: r.depositAmount ? `₹${Number(r.depositAmount).toLocaleString('en-IN')}` : (referredUser?.wallet ? `₹${Number(referredUser.wallet.realizedBalance).toLocaleString('en-IN')}` : '₹0'),
                reward: `₹${Number(r.commissionAmount || 0).toLocaleString('en-IN')}`,
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
            ...dbWithdrawals.filter((w) => w.status === 'APPROVED').map((w) => ({
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
                currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
                availableBalance: w.user?.wallet ? Number(w.user.wallet.availableBalance) : 0,
                pendingWithdrawals: w.user?.wallet ? Number(w.user.wallet.pendingWithdrawals) : 0,
                requestedAt: w.createdAt,
                processedAt: w.processedAt,
                date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: w.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            })),
            ...dbPayments.filter((p) => p.status === 'APPROVED').map((p) => ({
                id: p.id,
                userId: p.userId,
                userName: p.user?.name || 'Unknown User',
                userEmail: p.user?.email || 'N/A',
                type: 'Deposit',
                amount: Number(p.amount),
                rawAmount: Number(p.amount),
                method: p.paymentType,
                status: 'Approved',
                date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                time: p.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalUsers = dbUsers.length;
        const activeUsers = dbUsers.filter((u) => u.status === 'ACTIVE' || u.status === 'VIP').length;
        const totalRevenue = dbPayments.filter((p) => p.status === 'APPROVED').reduce((sum, p) => sum + Number(p.amount), 0);
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
        const profitDistributions = dbProfitDistributions.map((pd) => ({
            id: pd.id,
            reference: pd.reference,
            userId: pd.userId,
            userName: pd.user?.name || 'Unknown',
            userEmail: pd.user?.email || '',
            amount: pd.amount,
            type: pd.type,
            status: pd.status,
            note: pd.note || '',
            distributionDate: pd.distributionDate,
            createdAt: pd.createdAt,
        }));
        const withdrawals = dbWithdrawals.map((w) => ({
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
            status: w.status === 'PENDING' ? 'Pending' : w.status === 'APPROVED' ? 'Approved' : 'Rejected',
            currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
            availableBalance: w.user?.wallet ? Number(w.user.wallet.availableBalance) : 0,
            pendingWithdrawals: w.user?.wallet ? Number(w.user.wallet.pendingWithdrawals) : 0,
            requestedAt: w.createdAt,
            processedAt: w.processedAt,
            date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: w.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        }));
        return {
            stats: platformStats, users, payments, trades, logs, partners, campaigns,
            referrals, admins, transactions, settings, profitDistributions, withdrawals,
            plans: dbPlans.map((p) => ({
                id: p.id, name: p.name, subtitle: p.subtitle, capitalLabel: p.capitalLabel,
                desc: p.desc, features: p.features, btnText: p.btnText, status: p.status, isPopular: p.isPopular,
            })),
            referralSettings: dbReferralSettings,
        };
    }
    async createUser(adminId, body, clientIp) {
        const { name, email, password, partnerId, plan, deposit } = body;
        if (!name || !email || !password)
            return { error: 'Name, email and password are required', status: 400 };
        let targetPartnerId = partnerId;
        if (!targetPartnerId) {
            const partner = await this.prisma.partner.findFirst();
            if (!partner)
                return { error: 'No white-label partners exist. Create a partner first.', status: 400 };
            targetPartnerId = partner.id;
        }
        const existing = await this.prisma.user.findFirst({
            where: { partnerId: targetPartnerId, email: email.toLowerCase().trim(), isDeleted: false },
        });
        if (existing)
            return { error: 'User email already exists under this partner', status: 400 };
        let userStatus = 'NEW';
        if (plan === 'Basic')
            userStatus = 'ACTIVE';
        else if (plan === 'Premium')
            userStatus = 'VIP';
        else if (plan === 'Pro')
            userStatus = 'ACTIVE';
        else if (plan === 'VIP')
            userStatus = 'VIP';
        const cleanDeposit = deposit ? Number(String(deposit).replace(/[^\d.-]/g, '')) : 0;
        const user = await this.prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
                data: { partnerId: targetPartnerId, name, email: email.toLowerCase().trim(), passwordHash: (0, crypto_util_1.hashPassword)(password), status: userStatus },
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
                    currency: 'INR',
                },
            });
            return u;
        });
        await this.prisma.securityEvent.create({
            data: { adminId, userId: user.id, partnerId: targetPartnerId, action: 'USER_CREATE', reason: `Manually created user ${user.email}`, ipAddress: clientIp },
        });
        return { success: true, user };
    }
    async updateUser(adminId, userId, body, clientIp) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { error: 'User not found', status: 404 };
        const { name, email, plan, deposit, status } = body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email.toLowerCase().trim();
        if (status !== undefined) {
            if (status === 'Active')
                updateData.status = 'ACTIVE';
            else if (status === 'Blocked')
                updateData.status = 'BLOCKED';
            else if (status === 'VIP')
                updateData.status = 'VIP';
            else if (status === 'New')
                updateData.status = 'NEW';
            else if (status === 'Expired')
                updateData.status = 'EXPIRED';
        }
        else if (plan !== undefined) {
            if (plan === 'Basic')
                updateData.status = 'ACTIVE';
            else if (plan === 'Premium')
                updateData.status = 'VIP';
            else if (plan === 'None')
                updateData.status = 'NEW';
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
    async deleteUser(adminId, userId, clientIp) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { error: 'User not found', status: 404 };
        await this.prisma.user.update({ where: { id: userId }, data: { isDeleted: true } });
        await this.prisma.securityEvent.create({
            data: { adminId, userId, partnerId: user.partnerId, action: 'USER_DELETE', reason: `Soft deleted user ${user.email}`, ipAddress: clientIp },
        });
        return { success: true, message: 'User soft deleted successfully' };
    }
    async createPartner(adminId, body, clientIp) {
        const { name, companyName, email, password, profitShare, maxAllowedShare, domain, logo } = body;
        if (!name || !companyName || !email || !password || !domain)
            return { error: 'Missing required partner fields', status: 400 };
        const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
        const normalizedEmail = email.toLowerCase().trim();
        const normalizedDomain = domain.toLowerCase().trim();
        const existing = await this.prisma.partner.findFirst({
            where: { OR: [{ slug }, { email: normalizedEmail }, { domain: normalizedDomain }] },
        });
        if (existing)
            return { error: 'Partner with similar name, email, or domain already exists', status: 400 };
        const partner = await this.prisma.partner.create({
            data: {
                slug, name, companyName, email: normalizedEmail, passwordHash: (0, crypto_util_1.hashPassword)(password),
                profitSharePct: Number(profitShare || 30.00), maxAllowedPct: Number(maxAllowedShare || 40.00),
                domain: normalizedDomain, logo: logo || name.slice(0, 2).toUpperCase(), status: 'ACTIVE',
            },
        });
        await this.prisma.securityEvent.create({
            data: { adminId, action: 'PARTNER_CREATE', reason: `Created white-label partner ${name} (${slug})`, ipAddress: clientIp },
        });
        return { success: true, partner };
    }
    async createPlan(adminId, body, clientIp) {
        const { name, subtitle, capitalLabel, desc, features, btnText, status, isPopular } = body;
        if (!name || !subtitle || !capitalLabel || !desc)
            return { error: 'Name, subtitle, capital label, and description are required', status: 400 };
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
    async updatePlan(adminId, planId, body, clientIp) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            return { error: 'Plan not found', status: 404 };
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
    async deletePlan(adminId, planId, clientIp) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            return { error: 'Plan not found', status: 404 };
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
    async updateSettings(adminId, body, clientIp) {
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
        }
        else {
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
    async getReferralSettings() {
        let settings = await this.prisma.referralSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.referralSettings.create({
                data: {}
            });
        }
        return { success: true, settings };
    }
    async updateReferralSettings(adminId, body, clientIp) {
        const { enabled, commissionRate, minimumDeposit, autoApprove, allowMultipleDeposits, commissionPayoutMode, maxReferralCommission } = body;
        let existing = await this.prisma.referralSettings.findFirst();
        let settings;
        if (existing) {
            settings = await this.prisma.referralSettings.update({
                where: { id: existing.id },
                data: {
                    enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
                    commissionRate: commissionRate !== undefined ? Number(commissionRate) : existing.commissionRate,
                    minimumDeposit: minimumDeposit !== undefined ? Number(minimumDeposit) : existing.minimumDeposit,
                    autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : existing.autoApprove,
                    allowMultipleDeposits: allowMultipleDeposits !== undefined ? Boolean(allowMultipleDeposits) : existing.allowMultipleDeposits,
                    commissionPayoutMode: commissionPayoutMode !== undefined ? String(commissionPayoutMode) : existing.commissionPayoutMode,
                    maxReferralCommission: maxReferralCommission !== undefined ? (maxReferralCommission ? Number(maxReferralCommission) : null) : existing.maxReferralCommission,
                },
            });
        }
        else {
            settings = await this.prisma.referralSettings.create({
                data: {
                    enabled: enabled !== undefined ? Boolean(enabled) : false,
                    commissionRate: commissionRate !== undefined ? Number(commissionRate) : 10.00,
                    minimumDeposit: minimumDeposit !== undefined ? Number(minimumDeposit) : 1000.00,
                    autoApprove: autoApprove !== undefined ? Boolean(autoApprove) : false,
                    allowMultipleDeposits: allowMultipleDeposits !== undefined ? Boolean(allowMultipleDeposits) : false,
                    commissionPayoutMode: commissionPayoutMode !== undefined ? String(commissionPayoutMode) : 'PENDING',
                    maxReferralCommission: maxReferralCommission ? Number(maxReferralCommission) : null,
                },
            });
        }
        await this.prisma.securityEvent.create({
            data: { adminId, action: 'SETTINGS_UPDATE', reason: 'Updated Referral Program settings', ipAddress: clientIp },
        });
        return { success: true, settings };
    }
    async getReferrals() {
        const referrals = await this.prisma.referral.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                referrer: { select: { name: true, email: true } },
                referredUser: { select: { name: true, email: true } },
            }
        });
        return { success: true, referrals };
    }
    async updateReferralStatus(adminId, referralId, status, clientIp) {
        const referral = await this.prisma.referral.findUnique({ where: { id: referralId } });
        if (!referral)
            return { error: 'Referral not found', status: 404 };
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];
        if (!validStatuses.includes(status))
            return { error: 'Invalid status', status: 400 };
        const updated = await this.prisma.referral.update({
            where: { id: referralId },
            data: { status: status },
        });
        await this.prisma.securityEvent.create({
            data: { adminId, action: 'REFERRAL_UPDATE', reason: `Updated referral ${referralId} status to ${status}`, ipAddress: clientIp },
        });
        return { success: true, referral: updated };
    }
    async createTrade(adminId, body, clientIp) {
        const { userId, pair, type, entry, stopLoss, target } = body;
        if (!userId || !pair || !type || !entry || !stopLoss || !target)
            return { error: 'Missing required trade signal fields', status: 400 };
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { error: 'Target user not found', status: 404 };
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
    async closeTrade(adminId, tradeId, exitPrice, clientIp) {
        const trade = await this.prisma.trade.findUnique({
            where: { id: tradeId },
            include: { user: { include: { wallet: true } } },
        });
        if (!trade)
            return { error: 'Trade not found', status: 404 };
        if (trade.status !== 'ACTIVE')
            return { error: 'Trade is not active', status: 400 };
        if (!exitPrice || Number(exitPrice) <= 0)
            return { error: 'A valid exit price is required', status: 400 };
        const entryPrice = trade.entryPrice;
        const settlementPrice = new client_1.Prisma.Decimal(exitPrice);
        const quantity = trade.quantity;
        const isBuy = trade.type === 'BUY';
        let pnl = settlementPrice.minus(entryPrice).mul(quantity);
        if (!isBuy)
            pnl = entryPrice.minus(settlementPrice).mul(quantity);
        await this.prisma.$transaction(async (tx) => {
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
    async listTradeRecords() {
        return this.prisma.tradeRecord.findMany({ orderBy: { tradeDate: 'desc' } });
    }
    async createTradeRecord(body) {
        const { pair, side, entryPrice, exitPrice, tradeDate, profitLoss, result, notes, status } = body;
        if (!pair || !side || entryPrice === undefined || exitPrice === undefined || !tradeDate || profitLoss === undefined || !result) {
            return { error: 'Missing required fields for trade record', status: 400 };
        }
        const tradeRecord = await this.prisma.tradeRecord.create({
            data: {
                pair,
                side,
                entryPrice: Number(entryPrice),
                exitPrice: Number(exitPrice),
                tradeDate: new Date(tradeDate),
                profitLoss: Number(profitLoss),
                result,
                notes: notes || '',
                status: status || 'published',
            },
        });
        return { success: true, tradeRecord };
    }
    async updateTradeRecord(id, body) {
        const { pair, side, entryPrice, exitPrice, tradeDate, profitLoss, result, notes, status } = body;
        const existing = await this.prisma.tradeRecord.findUnique({ where: { id } });
        if (!existing)
            return { error: 'Trade record not found', status: 404 };
        const updated = await this.prisma.tradeRecord.update({
            where: { id },
            data: {
                pair: pair ?? existing.pair,
                side: side ?? existing.side,
                entryPrice: entryPrice !== undefined ? Number(entryPrice) : existing.entryPrice,
                exitPrice: exitPrice !== undefined ? Number(exitPrice) : existing.exitPrice,
                tradeDate: tradeDate ? new Date(tradeDate) : existing.tradeDate,
                profitLoss: profitLoss !== undefined ? Number(profitLoss) : existing.profitLoss,
                result: result ?? existing.result,
                notes: notes !== undefined ? notes : existing.notes,
                status: status ?? existing.status,
            },
        });
        return { success: true, tradeRecord: updated };
    }
    async deleteTradeRecord(id) {
        const existing = await this.prisma.tradeRecord.findUnique({ where: { id } });
        if (!existing)
            return { error: 'Trade record not found', status: 404 };
        await this.prisma.tradeRecord.delete({ where: { id } });
        return { success: true, message: 'Trade record deleted successfully' };
    }
    async setTradeRecordStatus(id, status) {
        const existing = await this.prisma.tradeRecord.findUnique({ where: { id } });
        if (!existing)
            return { error: 'Trade record not found', status: 404 };
        const updated = await this.prisma.tradeRecord.update({
            where: { id },
            data: { status },
        });
        return { success: true, tradeRecord: updated };
    }
    async approvePayment(adminId, paymentId, clientIp) {
        const result = await this.prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { user: true } });
            if (!payment)
                throw new Error('Payment record not found');
            if (payment.status === 'APPROVED')
                throw new Error('Payment has already been approved');
            const amountVal = Number(payment.amount);
            const idempotencyKey = `DEP_APPROVAL_${payment.id}`;
            const ledgerGroup = await (0, ledger_util_1.createTransactionGroup)(tx, {
                type: 'DEPOSIT', description: `Manual approval of checkout payment ${payment.id}`, idempotencyKey,
                entries: [
                    { accountType: 'SYSTEM', entryType: 'DEBIT', amount: amountVal, currency: payment.currency },
                    { userId: payment.userId, partnerId: payment.partnerId, accountType: 'USER', entryType: 'CREDIT', amount: amountVal, currency: payment.currency },
                ],
            });
            let nextStatus = 'ACTIVE';
            const planName = payment.planName.toLowerCase();
            if (planName.includes('premium') || planName.includes('vip'))
                nextStatus = 'VIP';
            await tx.user.update({ where: { id: payment.userId }, data: { status: nextStatus } });
            const updatedPayment = await tx.payment.update({ where: { id: paymentId }, data: { status: 'APPROVED', ledgerTransactionGroupId: ledgerGroup.id } });
            if (payment.user.referredBy) {
                const refSettings = await tx.referralSettings.findFirst();
                if (refSettings && refSettings.enabled) {
                    const eligible = amountVal >= Number(refSettings.minimumDeposit);
                    if (eligible) {
                        const previousCommissions = await tx.referral.count({
                            where: { referredId: payment.userId }
                        });
                        if (refSettings.allowMultipleDeposits || previousCommissions === 0) {
                            const commissionRate = Number(refSettings.commissionRate);
                            let commissionAmount = (amountVal * commissionRate) / 100;
                            if (refSettings.maxReferralCommission) {
                                const max = Number(refSettings.maxReferralCommission);
                                if (commissionAmount > max)
                                    commissionAmount = max;
                            }
                            const status = refSettings.autoApprove ? 'APPROVED' : 'PENDING';
                            await tx.referral.create({
                                data: {
                                    partnerId: payment.partnerId,
                                    referrerId: payment.user.referredBy,
                                    referredId: payment.userId,
                                    depositAmount: amountVal,
                                    commissionPct: commissionRate,
                                    commissionAmount: commissionAmount,
                                    paymentId: payment.id,
                                    status: status
                                }
                            });
                        }
                    }
                }
            }
            await tx.securityEvent.create({
                data: { adminId, userId: payment.userId, partnerId: payment.partnerId, action: 'PAYMENT_APPROVED', reason: `Approved payment ${payment.id} for amount ${amountVal}`, ipAddress: clientIp },
            });
            return updatedPayment;
        });
        return { success: true, payment: result };
    }
    async rejectPayment(adminId, paymentId, remark, clientIp) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            return { error: 'Payment record not found', status: 404 };
        if (payment.status === 'APPROVED')
            return { error: 'Approved payments cannot be rejected', status: 400 };
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
    async verifyPayment(adminId, paymentId, clientIp) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment)
            return { error: 'Payment record not found', status: 404 };
        if (payment.status !== 'PENDING')
            return { error: 'Only pending payments can be verified', status: 400 };
        const updatedPayment = await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'VERIFIED' } });
        await this.prisma.securityEvent.create({
            data: { adminId, userId: payment.userId, partnerId: payment.partnerId, action: 'PAYMENT_VERIFIED', reason: `Verified details for payment ${payment.id}`, ipAddress: clientIp },
        });
        return { success: true, payment: updatedPayment };
    }
    async approveWithdrawal(adminId, withdrawalId, clientIp) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
                if (!withdrawal)
                    throw new Error('Withdrawal record not found');
                if (withdrawal.status !== 'PENDING')
                    throw new Error('Withdrawal has already been processed');
                const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
                if (!wallet)
                    throw new Error('Wallet not found');
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
                const ledgerGroup = await (0, ledger_util_1.createTransactionGroup)(tx, {
                    type: 'WITHDRAWAL', description: `Manual approval of withdrawal request ${withdrawal.id}`, idempotencyKey,
                    entries: [
                        { userId: withdrawal.userId, partnerId: withdrawal.partnerId, accountType: 'USER', entryType: 'DEBIT', amount: amountVal, currency: withdrawal.currency },
                        { accountType: 'SYSTEM', entryType: 'CREDIT', amount: amountVal, currency: withdrawal.currency },
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
                    data: { adminId, userId: withdrawal.userId, partnerId: withdrawal.partnerId, action: 'WITHDRAWAL_APPROVED', reason: `Approved withdrawal ${withdrawal.id} for amount ${amountVal}`, ipAddress: clientIp },
                });
                return updatedWithdrawal;
            });
            return { success: true, withdrawal: result };
        }
        catch (e) {
            return { error: e.message || 'Approval failed', status: 400 };
        }
    }
    async rejectWithdrawal(adminId, withdrawalId, clientIp) {
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
                if (!withdrawal)
                    throw new Error('Withdrawal record not found');
                if (withdrawal.status !== 'PENDING')
                    throw new Error('Only pending withdrawals can be rejected');
                const wallet = await tx.wallet.findUnique({ where: { userId: withdrawal.userId } });
                if (!wallet)
                    throw new Error('Wallet not found');
                const amountVal = Number(withdrawal.amount);
                const nextAvailable = Number(wallet.availableBalance) + amountVal;
                const nextPending = Math.max(0, Number(wallet.pendingWithdrawals) - amountVal);
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
                    data: { adminId, userId: withdrawal.userId, partnerId: withdrawal.partnerId, action: 'WITHDRAWAL_REJECTED', reason: `Rejected withdrawal request ${withdrawal.id}`, ipAddress: clientIp },
                });
                return updatedWithdrawal;
            });
            return { success: true, withdrawal: result };
        }
        catch (e) {
            return { error: e.message || 'Rejection failed', status: 400 };
        }
    }
    async reverseTransaction(adminId, transactionGroupId, reason, clientIp) {
        const result = await this.prisma.$transaction(async (tx) => {
            return (0, ledger_util_1.reverseTransactionGroup)(tx, transactionGroupId, reason, adminId, clientIp);
        });
        await this.prisma.securityEvent.create({
            data: { adminId, action: 'TRANSACTION_REVERSED', reason: `Reversed transaction group ${transactionGroupId}. Reason: ${reason}`, ipAddress: clientIp },
        });
        return { success: true, reversalGroup: result };
    }
    async generateProfitDistributionReference(date) {
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
    async createProfitDistribution(body) {
        const { userId, amount, type, status, note, distributionDate } = body;
        if (!userId || amount === undefined || !type || !distributionDate) {
            return { error: 'userId, amount, type, and distributionDate are required', status: 400 };
        }
        const distDate = new Date(distributionDate);
        const reference = await this.generateProfitDistributionReference(distDate);
        const profitDist = await this.prisma.profitDistribution.create({
            data: {
                reference,
                userId,
                amount: Number(amount),
                type,
                status: status || 'PAID',
                note: note || '',
                distributionDate: distDate,
            },
            include: {
                user: true,
            },
        });
        return { success: true, profitDistribution: profitDist };
    }
    async updateProfitDistribution(id, body) {
        const { amount, type, status, note, distributionDate } = body;
        const dataToUpdate = {};
        if (amount !== undefined)
            dataToUpdate.amount = Number(amount);
        if (type !== undefined)
            dataToUpdate.type = type;
        if (status !== undefined)
            dataToUpdate.status = status;
        if (note !== undefined)
            dataToUpdate.note = note;
        if (distributionDate !== undefined) {
            dataToUpdate.distributionDate = new Date(distributionDate);
        }
        const updated = await this.prisma.profitDistribution.update({
            where: { id },
            data: dataToUpdate,
            include: {
                user: true,
            },
        });
        return { success: true, profitDistribution: updated };
    }
    async deleteProfitDistribution(id) {
        await this.prisma.profitDistribution.delete({
            where: { id },
        });
        return { success: true };
    }
    async getUserDetail(adminId, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId, isDeleted: false },
            include: {
                wallet: true,
                payments: { orderBy: { createdAt: 'desc' } },
                withdrawals: { orderBy: { createdAt: 'desc' } },
                trades: { orderBy: { createdAt: 'desc' } },
                securityEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
                generatedReports: { orderBy: { createdAt: 'desc' } },
                partner: true,
            },
        });
        if (!user) {
            return { error: 'User not found', status: 404 };
        }
        const walletBalance = user.wallet ? Number(user.wallet.realizedBalance) : 0;
        const unrealizedBalance = user.wallet ? Number(user.wallet.unrealizedBalance) : 0;
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
        const latestApprovedPayment = user.payments.find((p) => p.status === 'APPROVED');
        let subscription = null;
        if (latestApprovedPayment) {
            const approvedDate = new Date(latestApprovedPayment.createdAt);
            const expiresAt = new Date(approvedDate);
            expiresAt.setDate(expiresAt.getDate() + 365);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const isActive = daysRemaining > 0;
            subscription = {
                planName: latestApprovedPayment.planName,
                status: isActive ? 'Active' : 'Expired',
                paidAt: latestApprovedPayment.createdAt,
                expiresAt: expiresAt.toISOString(),
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
        return list.map((w) => ({
            id: w.id,
            withdrawalId: w.withdrawalId,
            userId: w.userId,
            userName: w.user?.name || 'Unknown User',
            userEmail: w.user?.email || 'N/A',
            amount: Number(w.amount),
            status: w.status === 'PENDING' ? 'Pending' : w.status === 'APPROVED' ? 'Approved' : 'Rejected',
            method: w.method || 'Bank Transfer',
            accountDetails: w.accountDetails || '',
            notes: w.notes || '',
            currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
            availableBalance: w.user?.wallet ? Number(w.user.wallet.availableBalance) : 0,
            pendingWithdrawals: w.user?.wallet ? Number(w.user.wallet.pendingWithdrawals) : 0,
            requestedAt: w.createdAt,
            processedAt: w.processedAt,
            date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }));
    }
    async getWithdrawalDetail(id) {
        const w = await this.prisma.withdrawal.findFirst({
            where: {
                OR: [
                    { id },
                    { withdrawalId: id }
                ]
            },
            include: { user: { include: { wallet: true } } },
        });
        if (!w)
            throw new Error('Withdrawal request not found');
        return {
            id: w.id,
            withdrawalId: w.withdrawalId,
            userId: w.userId,
            userName: w.user?.name || 'Unknown User',
            userEmail: w.user?.email || 'N/A',
            amount: Number(w.amount),
            status: w.status === 'PENDING' ? 'Pending' : w.status === 'APPROVED' ? 'Approved' : 'Rejected',
            method: w.method || 'Bank Transfer',
            accountDetails: w.accountDetails || '',
            notes: w.notes || '',
            currentEquity: w.user?.wallet ? Number(w.user.wallet.currentEquity) : 0,
            availableBalance: w.user?.wallet ? Number(w.user.wallet.availableBalance) : 0,
            pendingWithdrawals: w.user?.wallet ? Number(w.user.wallet.pendingWithdrawals) : 0,
            requestedAt: w.createdAt,
            processedAt: w.processedAt,
            date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        };
    }
    async getPnlReports() {
        const trades = await this.prisma.tradeRecord.findMany({
            orderBy: { tradeDate: 'desc' }
        });
        const totalTrades = trades.length;
        let winningTrades = 0;
        let losingTrades = 0;
        let breakevenTrades = 0;
        let totalPnl = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        const monthlyPnlMap = {};
        trades.forEach(t => {
            const pnl = Number(t.profitLoss);
            totalPnl += pnl;
            if (pnl > 0) {
                winningTrades++;
                grossProfit += pnl;
            }
            else if (pnl < 0) {
                losingTrades++;
                grossLoss += Math.abs(pnl);
            }
            else {
                breakevenTrades++;
            }
            const date = new Date(t.tradeDate);
            const month = date.toLocaleString('default', { month: 'short' });
            monthlyPnlMap[month] = (monthlyPnlMap[month] || 0) + pnl;
        });
        const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(2) : '0.00';
        const lossRate = totalTrades > 0 ? ((losingTrades / totalTrades) * 100).toFixed(2) : '0.00';
        const breakevenRate = totalTrades > 0 ? ((breakevenTrades / totalTrades) * 100).toFixed(2) : '0.00';
        const averageWin = winningTrades > 0 ? (grossProfit / winningTrades).toFixed(2) : '0.00';
        const averageLoss = losingTrades > 0 ? (grossLoss / losingTrades).toFixed(2) : '0.00';
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 'Infinite' : '0.00');
        const monthlyPnl = Object.keys(monthlyPnlMap).map(month => ({
            month,
            pnl: monthlyPnlMap[month]
        }));
        const rows = [
            ["All Users", `$${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, "-", `${winRate}%`]
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
                grossLoss
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
            rows
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map