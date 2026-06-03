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
    return createHash('sha256').update(otp).digest('hex');
  }

  async generateOtp(partnerId: string, email: string, partnerName: string): Promise<{ success: boolean; otp: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // 1. Rate limiting check: Max 3 OTPs per email per hour
    const otpsInLastHour = await this.prisma.emailOtp.count({
      where: {
        partnerId,
        email: normalizedEmail,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (otpsInLastHour >= 3) {
      throw new BadRequestException('Rate limit exceeded. Maximum 3 verification codes per hour allowed.');
    }

    // 2. Cooldown check: Min 60 seconds between OTP requests
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
      throw new BadRequestException(`Please wait ${secondsLeft} seconds before requesting a new code.`);
    }

    // 3. Auto-expire old pending OTPs
    await this.prisma.emailOtp.updateMany({
      where: {
        partnerId,
        email: normalizedEmail,
        verified: false,
      },
      data: {
        verified: true, // Invalidate old ones
      },
    });

    // 4. Clean up any expired OTPs right now as a proactive measure
    await this.cleanupExpiredOtps();

    // 5. Generate cryptographically secure OTP
    const otp = randomInt(100000, 1000000).toString(); // Secure 6-digit number (100000 to 999999)
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes expiration

    // 6. Save to database
    await this.prisma.emailOtp.create({
      data: {
        partnerId,
        email: normalizedEmail,
        otpHash,
        expiresAt,
      },
    });

    // 7. Dispatch via Email
    const success = await this.emailService.sendOtpEmail(normalizedEmail, otp, partnerName);
    return { success, otp };
  }

  async verifyOtp(partnerId: string, email: string, code: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Find the latest pending, unverified OTP
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
      throw new BadRequestException('No verification request found. Please request a new code.');
    }

    // Check expiration
    if (activeOtp.expiresAt < now) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Check attempt lockout
    if (activeOtp.attempts >= 5) {
      throw new BadRequestException('Too many failed attempts. This code is locked. Please request a new code.');
    }

    // Check match
    const hashedInput = this.hashOtp(code);
    if (activeOtp.otpHash !== hashedInput) {
      const newAttempts = activeOtp.attempts + 1;

      if (newAttempts >= 5) {
        // Lock this OTP permanently by marking verified = true
        await this.prisma.emailOtp.update({
          where: { id: activeOtp.id },
          data: {
            attempts: newAttempts,
            verified: true,
          },
        });
        throw new BadRequestException('Too many failed attempts. This code is locked. Please request a new code.');
      } else {
        await this.prisma.emailOtp.update({
          where: { id: activeOtp.id },
          data: { attempts: newAttempts },
        });
        const attemptsLeft = 5 - newAttempts;
        throw new BadRequestException(`Invalid verification code. ${attemptsLeft} attempts remaining.`);
      }
    }

    // Success - Mark verified
    await this.prisma.emailOtp.update({
      where: { id: activeOtp.id },
      data: { verified: true },
    });

    return true;
  }

  // Periodic cleanup job (Runs every hour)
  @Cron('0 * * * *')
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
    } catch (err: any) {
      console.error('[OtpService Cleanup Error]', err.message);
    }
  }
}
