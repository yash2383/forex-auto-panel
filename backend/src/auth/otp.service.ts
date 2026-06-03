import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { randomInt, createHash } from 'crypto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  private hashOtp(otp: string): string {
    return otp;
  }

  async generateOtp(partnerId: string, email: string, partnerName: string): Promise<{ success: boolean; otp: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // 1. Fetch OTP settings
    const settings = await this.prisma.otpSettings.findFirst() || {
      emailOtpEnabled: true,
      otpLength: 6,
      otpExpiryMinutes: 10,
      supportContact: "+91 XXXXX XXXXX"
    };

    // 2. Generate secure code
    const length = settings.otpLength || 6;
    const otp = Array.from({ length }, () => randomInt(0, 10)).join('');
    const expiresAt = new Date(now.getTime() + (settings.otpExpiryMinutes || 10) * 60 * 1000);

    // 3. Save to User record
    const user = await this.prisma.user.findFirst({
      where: { partnerId, email: normalizedEmail, isDeleted: false }
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt
      }
    });

    // 4. Dispatch via Email (Mandatory SMTP connection)
    let emailSent = false;
    try {
      emailSent = await this.emailService.sendOtpEmail(normalizedEmail, otp, partnerName);
    } catch (err: any) {
      console.error(`SMTP Dispatch failed for user ${normalizedEmail}:`, err.message);
      emailSent = false;
    }

    return { success: emailSent, otp };
  }

  async verifyOtp(partnerId: string, email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const user = await this.prisma.user.findFirst({
      where: { partnerId, email: normalizedEmail, isDeleted: false }
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new BadRequestException('No verification request found. Please request a new code.');
    }

    if (user.otpExpiresAt < now) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    if (user.otpCode !== code) {
      throw new BadRequestException('Invalid verification code.');
    }

    // Success - Clear OTP
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiresAt: null
      }
    });

    return true;
  }
}
