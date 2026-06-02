import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private prisma;
    constructor(prisma: PrismaService);
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
        pendingCheckout: {
            status: import("@prisma/client").$Enums.PaymentStatus;
            planName: string;
            amount: number;
            submittedAt: Date;
        };
        subscription?: undefined;
    } | {
        hasSubscription: boolean;
        pendingCheckout: null;
        subscription?: undefined;
    } | {
        hasSubscription: boolean;
        subscription: {
            planName: string;
            amount: number;
            currency: string;
            status: string;
            approvedAt: Date;
            expiresAt: string;
            daysRemaining: number;
            totalDays: number;
        };
        pendingCheckout: null;
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
            totalDepositsGenerated: number;
            totalEarnings: number;
            pendingEarnings: number;
            approvedEarnings: number;
            paidEarnings: number;
        };
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
