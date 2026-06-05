import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UserService {
    private prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getProfile(userId: string): Promise<{
        error: string;
        status: number;
        id?: undefined;
        name?: undefined;
        email?: undefined;
        role?: undefined;
        createdAt?: undefined;
        lastLoginAt?: undefined;
        walletBalance?: undefined;
        activePlan?: undefined;
    } | {
        id: string;
        name: string;
        email: string;
        role: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        lastLoginAt: Date | null;
        walletBalance: number;
        activePlan: any;
        error?: undefined;
    }>;
    updateProfile(userId: string, data: {
        name?: string;
    }): Promise<{
        error: string;
        status: number;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: {
            id: string;
            name: string;
            email: string;
        };
        error?: undefined;
        status?: undefined;
    }>;
    getPayments(userId: string): Promise<{
        payments: {
            id: any;
            planName: any;
            amount: number;
            currency: any;
            paymentType: any;
            network: any;
            txnHash: any;
            utr: any;
            remark: any;
            status: any;
            createdAt: any;
            updatedAt: any;
        }[];
    }>;
    getSubscription(userId: string): Promise<{
        hasSubscription: boolean;
        subscription: {
            planName: string;
            status: string;
            startedAt: string;
            approvedAt: string;
            expiresAt: string | null;
            daysRemaining: number | null;
            amount: number;
            currency: string;
            totalDays: number;
        };
        pendingCheckout: any;
    } | {
        hasSubscription: boolean;
        subscription: null;
        pendingCheckout: {
            planName: string;
            amount: number;
            status: import("@prisma/client").$Enums.PaymentStatus;
        };
    } | {
        hasSubscription: boolean;
        subscription: null;
        pendingCheckout: null;
    }>;
    getReferralStats(userId: string): Promise<{
        error: string;
        status: number;
        referralCode?: undefined;
        stats?: undefined;
    } | {
        referralCode: string;
        stats: {
            totalReferrals: number;
            activeReferrals: number;
            totalEarnings: number;
            pendingEarnings: number;
            rewardsEarned: number;
            pendingRewards: number;
        };
        error?: undefined;
        status?: undefined;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
        status?: undefined;
    }>;
    getReferrals(userId: string): Promise<{
        referrals: {
            id: string;
            name: string;
            email: string;
            joinDate: Date;
            plan: string;
            depositAmount: number;
        }[];
    }>;
    getReferralEarnings(userId: string): Promise<{
        earnings: {
            id: string;
            date: Date;
            referredUser: string;
            depositAmount: number;
            commissionPct: number;
            commissionAmount: number;
            status: import("@prisma/client").$Enums.ReferralStatus;
        }[];
    }>;
}
