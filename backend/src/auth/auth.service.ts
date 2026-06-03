import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../common/crypto.util';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
  ) {}

  async login(email: string, password: string, clientIp: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try finding in Admin table
    const admin = await this.prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (admin) {
      if (verifyPassword(password, admin.passwordHash)) {
        if (admin.status !== 'ACTIVE') {
          return { error: 'Account is suspended', status: 403 };
        }

        const token = signJwt({
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        });

        // Log login event
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

    // 2. Try finding in User table
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
      include: { partner: true },
    });

    if (user) {
      if (verifyPassword(password, user.passwordHash)) {
        if (user.status === 'BLOCKED') {
          return { error: 'Account is blocked', status: 403 };
        }

        // Generate and send OTP
        let generated;
        try {
          generated = await this.otpService.generateOtp(user.partnerId, user.email, user.partner.name);
        } catch (err: any) {
          return { error: err.message, status: 400 };
        }

        // Generate temporary login OTP token (expires in 5 minutes)
        const otpToken = signJwt({
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

    // 3. Try finding in Partner table
    const partner = await this.prisma.partner.findUnique({
      where: { email: normalizedEmail },
    });

    if (partner) {
      if (verifyPassword(password, partner.passwordHash)) {
        if (partner.status !== 'ACTIVE') {
          return { error: 'Partner account is inactive', status: 403 };
        }

        const token = signJwt({
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

  async verifyLoginOtp(otpToken: string, otp: string, clientIp: string) {
    const payload = verifyJwt(otpToken);
    if (!payload || payload.target !== 'login') {
      return { error: 'Invalid or expired OTP token. Please try logging in again.', status: 400 };
    }

    const { email, partnerId } = payload;

    try {
      await this.otpService.verifyOtp(partnerId, email, otp);
    } catch (err: any) {
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

    const token = signJwt({
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

  async sendSignupOtp(email: string, partnerSlug?: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Resolve Partner
    const slug = partnerSlug || 'alpha-traders';
    const partner = await this.prisma.partner.findUnique({
      where: { slug },
    });

    if (!partner) {
      return { error: 'White-label partner not found', status: 400 };
    }

    // 2. Check duplicate email under this partner
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

    // 3. Generate and send OTP
    try {
      const generated = await this.otpService.generateOtp(partner.id, normalizedEmail, partner.name);
      return {
        success: true,
        message: 'Verification code sent successfully.',
        otp: process.env.NODE_ENV !== 'production' ? generated.otp : undefined,
      };
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async signup(
    email: string,
    password: string,
    otp: string,
    firstName?: string,
    lastName?: string,
    partnerSlug?: string,
    referralCode?: string,
  ) {
    const name = `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Resolve Partner
    const slug = partnerSlug || 'alpha-traders';
    const partner = await this.prisma.partner.findUnique({
      where: { slug },
    });

    if (!partner) {
      return { error: 'White-label partner not found', status: 400 };
    }

    // Verify OTP code
    try {
      await this.otpService.verifyOtp(partner.id, normalizedEmail, otp);
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }

    // 2. Check duplicate email under this partner
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

    // Resolve referrer if code is provided
    let referrerId: string | null = null;
    if (referralCode) {
      const referrerUser = await this.prisma.user.findUnique({
        where: { referralCode: referralCode.trim().toUpperCase() },
      });
      if (!referrerUser) {
        return { error: 'Invalid referral code. Please check and try again.', status: 400 };
      }
      referrerId = referrerUser.id;
    }

    // Generate unique referral code for the new user
    const userReferralCode = "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // 3. Create User, Wallet, and Referral record in transaction
    const newUser = await this.prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          partnerId: partner.id,
          name,
          email: normalizedEmail,
          passwordHash: hashPassword(password),
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

    // 4. Generate token
    const token = signJwt({
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
}
