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
let OtpService = class OtpService {
    prisma;
    emailService;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    hashOtp(otp) {
        return otp;
    }
    async generateOtp(partnerId, email, partnerName) {
        const normalizedEmail = email.toLowerCase().trim();
        const now = new Date();
        const settings = (await this.prisma.otpSettings.findFirst()) || {
            emailOtpEnabled: true,
            otpLength: 6,
            otpExpiryMinutes: 10,
            supportContact: '+91 XXXXX XXXXX',
        };
        const length = settings.otpLength || 6;
        const otp = Array.from({ length }, () => (0, crypto_1.randomInt)(0, 10)).join('');
        const expiresAt = new Date(now.getTime() + (settings.otpExpiryMinutes || 10) * 60 * 1000);
        const user = await this.prisma.user.findFirst({
            where: { partnerId, email: normalizedEmail, isDeleted: false },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: otp,
                otpExpiresAt: expiresAt,
            },
        });
        let emailSent = false;
        try {
            emailSent = await this.emailService.sendOtpEmail(normalizedEmail, otp, partnerName);
        }
        catch (err) {
            console.error(`SMTP Dispatch failed for user ${normalizedEmail}:`, err.message);
            emailSent = false;
        }
        return { success: emailSent, otp };
    }
    async verifyOtp(partnerId, email, code) {
        const normalizedEmail = email.toLowerCase().trim();
        const now = new Date();
        const user = await this.prisma.user.findFirst({
            where: { partnerId, email: normalizedEmail, isDeleted: false },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found.');
        }
        if (!user.otpCode || !user.otpExpiresAt) {
            throw new common_1.BadRequestException('No verification request found. Please request a new code.');
        }
        if (user.otpExpiresAt < now) {
            throw new common_1.BadRequestException('Verification code has expired. Please request a new code.');
        }
        if (user.otpCode !== code) {
            throw new common_1.BadRequestException('Invalid verification code.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiresAt: null,
            },
        });
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], OtpService);
//# sourceMappingURL=otp.service.js.map