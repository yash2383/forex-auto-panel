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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("./email.service");
const crypto_1 = require("crypto");
const schedule_1 = require("@nestjs/schedule");
let OtpService = class OtpService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    hashOtp(otp) {
        return (0, crypto_1.createHash)('sha256').update(otp).digest('hex');
    }
    async generateOtp(partnerId, email, partnerName) {
        const normalizedEmail = email.toLowerCase().trim();
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
        const otpsInLastHour = await this.prisma.emailOtp.count({
            where: {
                partnerId,
                email: normalizedEmail,
                createdAt: { gte: oneHourAgo },
            },
        });
        if (otpsInLastHour >= 3) {
            throw new common_1.BadRequestException('Rate limit exceeded. Maximum 3 verification codes per hour allowed.');
        }
        const lastOtp = await this.prisma.emailOtp.findFirst({
            where: {
                partnerId,
                email: normalizedEmail,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (lastOtp && lastOtp.createdAt >= oneMinuteAgo) {
            const secondsLeft = Math.ceil((lastOtp.createdAt.getTime() + 60 * 1000 - now.getTime()) / 1000);
            throw new common_1.BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code.`);
        }
        await this.prisma.emailOtp.updateMany({
            where: {
                partnerId,
                email: normalizedEmail,
                verified: false,
            },
            data: {
                verified: true,
            },
        });
        await this.cleanupExpiredOtps();
        const otp = (0, crypto_1.randomInt)(100000, 1000000).toString();
        const otpHash = this.hashOtp(otp);
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
        await this.prisma.emailOtp.create({
            data: {
                partnerId,
                email: normalizedEmail,
                otpHash,
                expiresAt,
            },
        });
        const success = await this.emailService.sendOtpEmail(normalizedEmail, otp, partnerName);
        return { success, otp };
    }
    async verifyOtp(partnerId, email, code) {
        const normalizedEmail = email.toLowerCase().trim();
        const now = new Date();
        const activeOtp = await this.prisma.emailOtp.findFirst({
            where: {
                partnerId,
                email: normalizedEmail,
                verified: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!activeOtp) {
            throw new common_1.BadRequestException('No verification request found. Please request a new code.');
        }
        if (activeOtp.expiresAt < now) {
            throw new common_1.BadRequestException('Verification code has expired. Please request a new code.');
        }
        if (activeOtp.attempts >= 5) {
            throw new common_1.BadRequestException('Too many failed attempts. This code is locked. Please request a new code.');
        }
        const hashedInput = this.hashOtp(code);
        if (activeOtp.otpHash !== hashedInput) {
            const newAttempts = activeOtp.attempts + 1;
            if (newAttempts >= 5) {
                await this.prisma.emailOtp.update({
                    where: { id: activeOtp.id },
                    data: {
                        attempts: newAttempts,
                        verified: true,
                    },
                });
                throw new common_1.BadRequestException('Too many failed attempts. This code is locked. Please request a new code.');
            }
            else {
                await this.prisma.emailOtp.update({
                    where: { id: activeOtp.id },
                    data: { attempts: newAttempts },
                });
                const attemptsLeft = 5 - newAttempts;
                throw new common_1.BadRequestException(`Invalid verification code. ${attemptsLeft} attempts remaining.`);
            }
        }
        await this.prisma.emailOtp.update({
            where: { id: activeOtp.id },
            data: { verified: true },
        });
        return true;
    }
    async cleanupExpiredOtps() {
        try {
            const result = await this.prisma.emailOtp.deleteMany({
                where: {
                    expiresAt: {
                        lt: new Date(),
                    },
                },
            });
            if (result.count > 0) {
                console.log(`[OtpService Cleanup] Deleted ${result.count} expired OTPs.`);
            }
        }
        catch (err) {
            console.error('[OtpService Cleanup Error]', err.message);
        }
    }
};
exports.OtpService = OtpService;
__decorate([
    (0, schedule_1.Cron)('0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtpService.prototype, "cleanupExpiredOtps", null);
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], OtpService);
//# sourceMappingURL=otp.service.js.map