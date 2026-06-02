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
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
    async signup(email, password, firstName, lastName, partnerSlug, referralCode) {
        const name = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
        const normalizedEmail = email.toLowerCase().trim();
        const slug = partnerSlug || 'alpha-traders';
        const partner = await this.prisma.partner.findUnique({
            where: { slug },
        });
        if (!partner) {
            return { error: 'White-label partner not found', status: 400 };
        }
        const existingUser = await this.prisma.user.findUnique({
            where: {
                partnerId_email: {
                    partnerId: partner.id,
                    email: normalizedEmail,
                },
            },
        });
        if (existingUser && !existingUser.isDeleted) {
            return { error: 'Email is already registered under this platform', status: 400 };
        }
        let referrerId = null;
        if (referralCode) {
            const referrerUser = await this.prisma.user.findUnique({
                where: { referralCode: referralCode.trim().toUpperCase() },
            });
            if (!referrerUser) {
                return { error: 'Invalid referral code. Please check and try again.', status: 400 };
            }
            referrerId = referrerUser.id;
        }
        const userReferralCode = "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const newUser = await this.prisma.$transaction(async (tx) => {
            const u = await tx.user.create({
                data: {
                    partnerId: partner.id,
                    name,
                    email: normalizedEmail,
                    passwordHash: (0, crypto_util_1.hashPassword)(password),
                    status: 'NEW',
                    referralCode: userReferralCode,
                    referredBy: referrerId,
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
        const token = (0, crypto_util_1.signJwt)({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: 'USER',
            partnerId: partner.id,
            partnerSlug: partner.slug,
        });
        return {
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: 'USER',
                partnerId: partner.id,
                partnerSlug: partner.slug,
                status: newUser.status,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map