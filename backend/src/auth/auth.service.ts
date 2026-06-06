import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
} from '../common/crypto.util';
import { OtpService } from './otp.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEvent } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private otpService: OtpService,
    private readonly notificationsService: NotificationsService,
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

        // Trigger notification
        this.notificationsService
          .sendToAdmin(admin.id, NotificationEvent.ADMIN_LOGIN, {
            name: admin.name,
            ipAddress: clientIp,
          })
          .catch((err) =>
            console.error(
              `Failed to send ADMIN_LOGIN notification for admin ${admin.id}`,
              err,
            ),
          );

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
          generated = await this.otpService.generateOtp(
            user.partnerId,
            user.email,
            user.partner.name,
          );
        } catch (err: any) {
          return { error: err.message, status: 400 };
        }

        if (!generated.success) {
          return {
            error:
              'Failed to send login OTP via email. Please check your SMTP configuration.',
            status: 500,
          };
        }

        // Generate temporary login OTP token (expires in 5 minutes)
        const otpToken = signJwt(
          {
            email: user.email,
            partnerId: user.partnerId,
            target: 'login',
          },
          300,
        );

        return {
          otpRequired: true,
          otpToken,
          email: user.email,
          otp:
            process.env.NODE_ENV !== 'production' ? generated.otp : undefined,
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
      return {
        error: 'Invalid or expired OTP token. Please try logging in again.',
        status: 400,
      };
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

    this.notificationsService
      .sendToUser(user.id, NotificationEvent.NEW_LOGIN, {
        ipAddress: clientIp,
      })
      .catch((err) =>
        console.error(
          `Failed to send NEW_LOGIN notification for user ${user.id}`,
          err,
        ),
      );

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

  async updateOtpSettings(body: any) {
    let settings = await this.prisma.otpSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.otpSettings.create({
        data: {
          emailOtpEnabled:
            body.emailOtpEnabled !== undefined
              ? Boolean(body.emailOtpEnabled)
              : true,
          otpLength: body.otpLength ? Number(body.otpLength) : 6,
          otpExpiryMinutes: body.otpExpiryMinutes
            ? Number(body.otpExpiryMinutes)
            : 10,
          supportContact: body.supportContact || '+91 XXXXX XXXXX',
        },
      });
    } else {
      settings = await this.prisma.otpSettings.update({
        where: { id: settings.id },
        data: {
          emailOtpEnabled:
            body.emailOtpEnabled !== undefined
              ? Boolean(body.emailOtpEnabled)
              : settings.emailOtpEnabled,
          otpLength: body.otpLength
            ? Number(body.otpLength)
            : settings.otpLength,
          otpExpiryMinutes: body.otpExpiryMinutes
            ? Number(body.otpExpiryMinutes)
            : settings.otpExpiryMinutes,
          supportContact:
            body.supportContact !== undefined
              ? body.supportContact
              : settings.supportContact,
        },
      });
    }
    return { success: true, settings };
  }

  async requestManualVerification(email: string): Promise<any> {
    return { success: true };
  }

  async activateUser(userId: string) {
    return await this.prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found');
      if (user.isVerified) return user; // Already verified

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          status: 'ACTIVE',
        },
      });

      // Gives referral reward (payout mode: PAID, check if referrer gets payout)
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
            const bonusAmount = Number(refSettings.signupBonus ?? 100);
            await tx.referral.update({
              where: { id: pendingReferral.id },
              data: {
                status: 'PAID',
              },
            });

            await tx.referralReward.create({
              data: {
                referralId: pendingReferral.id,
                paymentId: null,
                planId: null,
                planName: 'Signup Bonus',
                depositAmount: null,
                platformFeePercent: null,
                platformFeeAmount: null,
                referralRate: null,
                commissionAmount: bonusAmount,
                status: 'PAID',
                approvedBy: 'SYSTEM',
                approvedAt: new Date(),
                paidAt: new Date(),
              },
            });

            // Credit referrer's wallet
            const referrerWallet = await tx.wallet.findUnique({
              where: { userId: user.referredBy },
            });

            if (referrerWallet) {
              const newRealized =
                Number(referrerWallet.realizedBalance) + bonusAmount;
              const newAvailable =
                Number(referrerWallet.availableBalance) + bonusAmount;
              const newEquity =
                Number(referrerWallet.currentEquity) + bonusAmount;

              await tx.wallet.update({
                where: { id: referrerWallet.id },
                data: {
                  realizedBalance: newRealized,
                  availableBalance: newAvailable,
                  currentEquity: newEquity,
                },
              });

              // Create transaction group & ledger entry
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

      // Send welcome email
      try {
        await this.otpService['emailService'].sendWelcomeEmail(
          user.email,
          user.name,
        );
      } catch (err: any) {
        console.error(
          `Failed to send welcome email to ${user.email}:`,
          err.message,
        );
      }

      return updated;
    });
  }

  private async handleOtpDispatch(user: any, partner: any, otpSettings: any) {
    try {
      const generated = await this.otpService.generateOtp(
        partner.id,
        user.email,
        partner.name,
      );

      if (!generated.success) {
        return {
          success: false,
          otpSent: false,
          error:
            'Failed to deliver verification code via email. Please check your SMTP configuration.',
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
    } catch (err: any) {
      return { error: err.message, status: 400 };
    }
  }

  async sendSignupOtp(
    email: string,
    partnerSlug?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
    referralCode?: string,
    campaignCode?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Resolve Partner and Campaign Code
    const slug = partnerSlug || 'alpha-traders';
    let partner = await this.prisma.partner.findUnique({
      where: { slug },
    });

    let resolvedCampaignCode: string | null = null;

    if (!partner) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { slug, isActive: true },
      });
      if (campaign) {
        partner = await this.prisma.partner.findUnique({
          where: { id: campaign.partnerId },
        });
        resolvedCampaignCode = campaign.slug;
      }
    } else {
      if (campaignCode) {
        const campaign = await this.prisma.campaign.findFirst({
          where: { slug: campaignCode, partnerId: partner.id, isActive: true },
        });
        if (campaign) {
          resolvedCampaignCode = campaign.slug;
        }
      }
    }

    if (!partner) {
      return { error: 'White-label partner not found', status: 400 };
    }

    // Get OTP mode settings
    const settingsResult = await this.getOtpSettings();
    const otpSettings = settingsResult.settings;

    // 2. Check duplicate email under this partner
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
      // If user exists but is NOT verified yet, we can reuse this user record!
      const passwordHash = password
        ? hashPassword(password)
        : existingUser.passwordHash;
      const name = password
        ? `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0]
        : existingUser.name;
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: { name, passwordHash, campaignCode: resolvedCampaignCode },
      });
      return await this.handleOtpDispatch(existingUser, partner, otpSettings);
    }

    // Resolve referrer if code is provided
    let referrerId: string | null = null;
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

    // Generate unique referral code for the new user
    const userReferralCode =
      'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const name =
      `${firstName || ''} ${lastName || ''}`.trim() || email.split('@')[0];
    const passwordHash = password
      ? hashPassword(password)
      : hashPassword('defaultPassword123');

    // Create User, Wallet, and Referral record in transaction
    const newUser = await this.prisma.$transaction(async (tx: any) => {
      const u = await tx.user.create({
        data: {
          partnerId: partner.id,
          name,
          email: normalizedEmail,
          passwordHash,
          status: 'NEW',
          referralCode: userReferralCode,
          referredBy: referrerId,
          campaignCode: resolvedCampaignCode,
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

  async signup(
    email: string,
    password?: string,
    otp?: string,
    firstName?: string,
    lastName?: string,
    partnerSlug?: string,
    referralCode?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Find the user
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, isDeleted: false },
      include: { partner: true },
    });

    if (!user) {
      return { error: 'User not found. Please sign up again.', status: 404 };
    }

    // Verify OTP code
    if (otp) {
      try {
        await this.otpService.verifyOtp(user.partnerId, normalizedEmail, otp);
      } catch (err: any) {
        return { error: err.message, status: 400 };
      }
    }

    // Activate the user
    const activatedUser = await this.activateUser(user.id);

    // Generate token
    const token = signJwt({
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
}
