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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/crypto.util");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let UserService = class UserService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            return { error: 'User not found', status: 404 };
        }
        const latestApprovedPayment = await this.prisma.payment.findFirst({
            where: { userId, status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
        });
        let activePlan = null;
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
    async updateProfile(userId, data) {
        const updateData = {};
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
    async getPayments(userId) {
        const payments = await this.prisma.payment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return {
            payments: payments.map((p) => ({
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
    async getSubscription(userId) {
        const latestApprovedPayment = await this.prisma.payment.findFirst({
            where: { userId, status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
        });
        if (!latestApprovedPayment) {
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
    async changePassword(userId, currentPassword, newPassword, confirmPassword) {
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
        if (!(0, crypto_util_1.verifyPassword)(currentPassword, user.passwordHash)) {
            return { error: 'Current password is incorrect', status: 401 };
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: (0, crypto_util_1.hashPassword)(newPassword) },
        });
        this.notificationsService.sendToUser(userId, client_1.NotificationEvent.PASSWORD_CHANGED, {})
            .catch(err => console.error(`Failed to send PASSWORD_CHANGED notification for user ${userId}`, err));
        return { success: true, message: 'Password changed successfully' };
    }
    async getReferralStats(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { error: 'User not found', status: 404 };
        const referrals = await this.prisma.referral.findMany({
            where: { referrerId: userId }
        });
        const totalReferrals = await this.prisma.user.count({ where: { referredBy: userId } });
        const activeReferrals = await this.prisma.user.count({
            where: {
                referredBy: userId,
                payments: { some: { status: 'APPROVED' } }
            }
        });
        let totalEarnings = 0;
        let pendingEarnings = 0;
        let paidEarnings = 0;
        let approvedEarnings = 0;
        let totalDepositsGenerated = 0;
        referrals.forEach(r => {
            const amt = Number(r.commissionAmount || 0);
            const depAmt = Number(r.depositAmount || 0);
            if (['PENDING', 'PAID'].includes(r.status)) {
                totalEarnings += amt;
                totalDepositsGenerated += depAmt;
            }
            if (r.status === 'PENDING')
                pendingEarnings += amt;
            if (r.status === 'PAID')
                paidEarnings += amt;
        });
        return {
            referralCode: user.referralCode,
            stats: {
                totalReferrals,
                activeReferrals,
                totalDepositsGenerated,
                totalEarnings,
                pendingEarnings,
                approvedEarnings,
                paidEarnings
            }
        };
    }
    async getReferrals(userId) {
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
                    select: { planName: true, amount: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return {
            referrals: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                joinDate: u.createdAt,
                plan: u.payments[0]?.planName || 'None',
                depositAmount: u.payments[0] ? Number(u.payments[0].amount) : 0
            }))
        };
    }
    async getReferralEarnings(userId) {
        const earnings = await this.prisma.referral.findMany({
            where: { referrerId: userId },
            include: { referredUser: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        return {
            earnings: earnings.map(e => ({
                id: e.id,
                date: e.createdAt,
                referredUser: e.referredUser.name,
                depositAmount: Number(e.depositAmount || 0),
                commissionPct: Number(e.commissionPct || 0),
                commissionAmount: Number(e.commissionAmount || 0),
                status: e.status
            }))
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], UserService);
//# sourceMappingURL=user.service.js.map