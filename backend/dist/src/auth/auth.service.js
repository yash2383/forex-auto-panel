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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/crypto.util");
const otp_service_1 = require("./otp.service");
const notifications_service_1 = require("../notifications/notifications.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    prisma;
    otpService;
    notificationsService;
    constructor(prisma, otpService, notificationsService) {
        this.prisma = prisma;
        this.otpService = otpService;
        this.notificationsService = notificationsService;
    }
    async login(email, password, clientIp) {
        const normalizedEmail = email.toLowerCase().trim();
        const admin = await this.prisma.admin.findUnique({
            where: { email: normalizedEmail },
        });
        if (admin) {
            if ((0, crypto_util_1.verifyPassword)(password, admin.passwordHash)) {
                if (admin.status !== 'ACTIVE') {
                    return { error: 'Account is suspended', status: 403 };
                }
                const token = (0, crypto_util_1.signJwt)({
                    id: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: admin.role,
                });
                await this.prisma.securityEvent.create({
                    data: {
                        adminId: admin.id,
                        action: 'ADMIN_LOGIN',
                        reason: 'Admin logged in successfully',
                        ipAddress: clientIp,
                    },
                });
                this.notificationsService
                    .sendToAdmin(admin.id, client_1.NotificationEvent.ADMIN_LOGIN, {
                    name: admin.name,
                    ipAddress: clientIp,
                })
                    .catch((err) => console.error(`Failed to send ADMIN_LOGIN notification for admin ${admin.id}`, err));
                return {
                    token,
                    user: {
                        id: admin.id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        status: admin.status,
                    },
                };
            }
        }
        const user = await this.prisma.user.findFirst({
            where: { email: normalizedEmail, isDeleted: false },
            include: { partner: true },
        });
        if (user) {
            if ((0, crypto_util_1.verifyPassword)(password, user.passwordHash)) {
                if (user.status === 'BLOCKED') {
                    return { error: 'Account is blocked', status: 403 };
                }
                let generated;
                try {
                    generated = await this.otpService.generateOtp(user.partnerId, user.email, user.partner.name);
                }
                catch (err) {
                    return { error: err.message, status: 400 };
                }
                if (!generated.success) {
                    return {
                        error: 'Failed to send login OTP via email. Please check your SMTP configuration.',
                        status: 500,
                    };
                }
                const otpToken = (0, crypto_util_1.signJwt)({
                    email: user.email,
                    partnerId: user.partnerId,
                    target: 'login',
                }, 300);
                return {
                    otpRequired: true,
                    otpToken,
                    email: user.email,
                    otp: process.env.NODE_ENV !== 'production' ? generated.otp : undefined,
                };
            }
        }
        const partner = await this.prisma.partner.findUnique({
            where: { email: normalizedEmail },
        });
        if (partner) {
            if ((0, crypto_util_1.verifyPassword)(password, partner.passwordHash)) {
                if (partner.status !== 'ACTIVE') {
                    return { error: 'Partner account is inactive', status: 403 };
                }
                const token = (0, crypto_util_1.signJwt)({
                    id: partner.id,
                    email: partner.email,
                    name: partner.name,
                    role: 'PARTNER',
                    partnerId: partner.id,
                });
                return {
                    token,
                    user: {
                        id: partner.id,
                        name: partner.name,
                        email: partner.email,
                        role: 'PARTNER',
                        partnerId: partner.id,
                        status: partner.status,
                    },
                };
            }
        }
        return { error: 'Invalid email or password', status: 401 };
    }
    async verifyLoginOtp(otpToken, otp, clientIp) {
        const payload = (0, crypto_util_1.verifyJwt)(otpToken);
        if (!payload || payload.target !== 'login') {
            return {
                error: 'Invalid or expired OTP token. Please try logging in again.',
                status: 400,
            };
        }
        const { email, partnerId } = payload;
        try {
            await this.otpService.verifyOtp(partnerId, email, otp);
        }
        catch (err) {
            return { error: err.message, status: 400 };
        }
        const user = await this.prisma.user.findFirst({
            where: { email: email.toLowerCase().trim(), partnerId, isDeleted: false },
            include: { partner: true },
        });
        if (!user) {
            return { error: 'User not found', status: 404 };
        }
        if (user.status === 'BLOCKED') {
            return { error: 'Account is blocked', status: 403 };
        }
        const token = (0, crypto_util_1.signJwt)({
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'USER',
            partnerId: user.partnerId,
            partnerSlug: user.partner.slug,
        });
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIP: clientIp,
            },
        });
        this.notificationsService
            .sendToUser(user.id, client_1.NotificationEvent.NEW_LOGIN, {
            ipAddress: clientIp,
        })
            .catch((err) => console.error(`Failed to send NEW_LOGIN notification for user ${user.id}`, err));
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'USER',
                partnerId: user.partnerId,
                partnerSlug: user.partner.slug,
                status: user.status,
            },
        };
    }
    async getOtpSettings() {
        let settings = await this.prisma.otpSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.otpSettings.create({
                data: {
                    emailOtpEnabled: true,
                    otpLength: 6,
                    otpExpiryMinutes: 10,
                    supportContact: '+91 XXXXX XXXXX',
                },
            });
        }
        return { success: true, settings };
    }
    async updateOtpSettings(body) {
        let settings = await this.prisma.otpSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.otpSettings.create({
                data: {
                    emailOtpEnabled: body.emailOtpEnabled !== undefined
                        ? Boolean(body.emailOtpEnabled)
                        : true,
                    otpLength: body.otpLength ? Number(body.otpLength) : 6,
                    otpExpiryMinutes: body.otpExpiryMinutes
                        ? Number(body.otpExpiryMinutes)
                        : 10,
                    supportContact: body.supportContact || '+91 XXXXX XXXXX',
                },
            });
        }
        else {
            settings = await this.prisma.otpSettings.update({
                where: { id: settings.id },
                data: {
                    emailOtpEnabled: body.emailOtpEnabled !== undefined
                        ? Boolean(body.emailOtpEnabled)
                        : settings.emailOtpEnabled,
                    otpLength: body.otpLength
                        ? Number(body.otpLength)
                        : settings.otpLength,
                    otpExpiryMinutes: body.otpExpiryMinutes
                        ? Number(body.otpExpiryMinutes)
                        : settings.otpExpiryMinutes,
                    supportContact: body.supportContact !== undefined
                        ? body.supportContact
                        : settings.supportContact,
                },
            });
        }
        return { success: true, settings };
    }
    async requestManualVerification(email) {
        return { success: true };
    }
    async activateUser(userId) {
        return await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });
            if (!user)
                throw new Error('User not found');
            if (user.isVerified)
                return user;
            const updated = await tx.user.update({
                where: { id: userId },
                data: {
                    isVerified: true,
                    status: 'ACTIVE',
                },
            });
            if (user.referredBy) {
                const refSettings = await tx.referralSettings.findFirst();
                if (refSettings && refSettings.enabled) {
                    const pendingReferral = await tx.referral.findFirst({
                        where: {
                            referredId: userId,
                            referrerId: user.referredBy,
                            status: 'PENDING',
                        },
                    });
                    if (pendingReferral) {
                        const bonusAmount = 100;
                        await tx.referral.update({
                            where: { id: pendingReferral.id },
                            data: {
                                status: 'PAID',
                                commissionAmount: bonusAmount,
                            },
                        });
                        const referrerWallet = await tx.wallet.findUnique({
                            where: { userId: user.referredBy },
                        });
                        if (referrerWallet) {
                            const newRealized = Number(referrerWallet.realizedBalance) + bonusAmount;
                            const newAvailable = Number(referrerWallet.availableBalance) + bonusAmount;
                            const newEquity = Number(referrerWallet.currentEquity) + bonusAmount;
                            await tx.wallet.update({
                                where: { id: referrerWallet.id },
                                data: {
                                    realizedBalance: newRealized,
                                    availableBalance: newAvailable,
                                    currentEquity: newEquity,
                                },
                            });
                            const group = await tx.transactionGroup.create({
                                data: {
                                    type: 'REFERRAL_PAYOUT',
                                    description: `Referral signup bonus for inviting ${user.email}`,
                                    idempotencyKey: `REF_SIGNUP_BONUS_${user.id}`,
                                },
                            });
                            await tx.ledgerEntry.create({
                                data: {
                                    transactionGroupId: group.id,
                                    userId: user.referredBy,
                                    partnerId: user.partnerId,
                                    accountType: 'USER',
                                    entryType: 'CREDIT',
                                    amount: bonusAmount,
                                    currency: 'INR',
                                },
                            });
                        }
                    }
                }
            }
            try {
                await this.otpService['emailService'].sendWelcomeEmail(user.email, user.name);
            }
            catch (err) {
                console.error(`Failed to send welcome email to ${user.email}:`, err.message);
            }
            return updated;
        });
    }
    async handleOtpDispatch(user, partner, otpSettings) {
        try {
            const generated = await this.otpService.generateOtp(partner.id, user.email, partner.name);
            if (!generated.success) {
                return {
                    success: false,
                    otpSent: false,
                    error: 'Failed to deliver verification code via email. Please check your SMTP configuration.',
                    status: 500,
                };
            }
            return {
                success: true,
                otpSent: true,
                message: 'Verification code sent successfully.',
                userId: user.id,
                otp: process.env.NODE_ENV !== 'production' ? generated.otp : undefined,
            };
        }
        catch (err) {
            return { error: err.message, status: 400 };
        }
    }
    async sendSignupOtp(email, partnerSlug, password, firstName, lastName, referralCode) {
        const normalizedEmail = email.toLowerCase().trim();
        const slug = partnerSlug || 'alpha-traders';
        const partner = await this.prisma.partner.findUnique({
            where: { slug },
        });
        if (!partner) {
            return { error: 'White-label partner not found', status: 400 };
        }
        const settingsResult = await this.getOtpSettings();
        const otpSettings = settingsResult.settings;
        const existingUser = await this.prisma.user.findFirst({
            where: {
                partnerId: partner.id,
                email: normalizedEmail,
                isDeleted: false,
            },
        });
        if (existingUser) {
            if (existingUser.isVerified) {
                return {
                    error: 'Email is already registered under this platform',
                    status: 400,
                };
            }
            const passwordHash = password
                ? (0, crypto_util_1.hashPassword)(password)
                : existingUser.passwordHash;
            const name = password
                ? `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0]
                : existingUser.name;
            await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { name, passwordHash },
            });
            return await this.handleOtpDispatch(existingUser, partner, otpSettings);
        }
        let referrerId = null;
        if (referralCode) {
            const referrerUser = await this.prisma.user.findUnique({
                where: { referralCode: referralCode.trim().toUpperCase() },
            });
            if (!referrerUser) {
                return {
                    error: 'Invalid referral code. Please check and try again.',
                    status: 400,
                };
            }
            referrerId = referrerUser.id;
        }
        const userReferralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const name = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
        const passwordHash = password
            ? (0, crypto_util_1.hashPassword)(password)
            : (0, crypto_util_1.hashPassword)('defaultPassword123');
        const newUser = await this.prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
                data: {
                    partnerId: partner.id,
                    name,
                    email: normalizedEmail,
                    passwordHash,
                    status: 'NEW',
                    referralCode: userReferralCode,
                    referredBy: referrerId,
                    isVerified: false,
                },
            });
            await tx.wallet.create({
                data: {
                    userId: u.id,
                    realizedBalance: 0,
                    unrealizedBalance: 0,
                    currentEquity: 0,
                    availableBalance: 0,
                    pendingWithdrawals: 0,
                    totalWithdrawn: 0,
                    currency: 'INR',
                },
            });
            if (referrerId) {
                await tx.referral.create({
                    data: {
                        partnerId: partner.id,
                        referrerId,
                        referredId: u.id,
                        status: 'PENDING',
                    },
                });
            }
            return u;
        });
        return await this.handleOtpDispatch(newUser, partner, otpSettings);
    }
    async signup(email, password, otp, firstName, lastName, partnerSlug, referralCode) {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await this.prisma.user.findFirst({
            where: { email: normalizedEmail, isDeleted: false },
            include: { partner: true },
        });
        if (!user) {
            return { error: 'User not found. Please sign up again.', status: 404 };
        }
        if (otp) {
            try {
                await this.otpService.verifyOtp(user.partnerId, normalizedEmail, otp);
            }
            catch (err) {
                return { error: err.message, status: 400 };
            }
        }
        const activatedUser = await this.activateUser(user.id);
        const token = (0, crypto_util_1.signJwt)({
            id: activatedUser.id,
            email: activatedUser.email,
            name: activatedUser.name,
            role: 'USER',
            partnerId: user.partnerId,
            partnerSlug: user.partner.slug,
        });
        return {
            token,
            user: {
                id: activatedUser.id,
                name: activatedUser.name,
                email: activatedUser.email,
                role: 'USER',
                partnerId: user.partnerId,
                partnerSlug: user.partner.slug,
                status: activatedUser.status,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        otp_service_1.OtpService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map