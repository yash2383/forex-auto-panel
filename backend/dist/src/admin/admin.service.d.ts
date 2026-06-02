import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getData(): Promise<{
        stats: {
            totalUsers: string;
            activeUsers: string;
            totalRevenue: string;
            totalUserWalletBalance: string;
        };
        users: {
            id: string;
            name: string;
            email: string;
            deposit: string;
            rawDeposit: number;
            plan: string;
            status: string;
            partnerId: string;
            partnerName: string;
        }[];
        payments: {
            id: any;
            user: any;
            email: any;
            initials: any;
            plan: any;
            amount: string;
            rawAmount: number;
            utr: any;
            txnHash: any;
            network: any;
            screenshot: any;
            date: any;
            time: any;
            dot: string;
            status: string;
            paymentType: any;
            remark: any;
        }[];
        trades: {
            id: any;
            pair: any;
            side: any;
            entryPrice: number;
            exitPrice: number;
            tradeDate: any;
            result: any;
            profitLoss: number;
            notes: any;
            status: any;
        }[];
        logs: {
            id: string;
            actor: string;
            action: string;
            module: string;
            targetId: string;
            time: string;
            status: string;
            ipAddress: string;
        }[];
        partners: {
            id: any;
            rawId: any;
            name: any;
            companyName: any;
            email: any;
            profitShare: number;
            maxAllowedShare: number;
            domain: any;
            logo: any;
            usersCount: number;
            revenue: number;
            withdrawn: number;
            status: string;
        }[];
        campaigns: {
            id: string;
            name: string;
            trackingLink: string;
            users: number;
            revenue: string;
            status: string;
        }[];
        referrals: {
            id: string;
            referrer: string;
            user: string;
            deposit: string;
            reward: string;
            status: string;
        }[];
        admins: {
            id: string;
            name: string;
            email: string;
            role: string;
            status: string;
            permissions: any;
        }[];
        transactions: {
            id: any;
            userId: any;
            userName: any;
            userEmail: any;
            type: string;
            amount: number;
            rawAmount: number;
            method: any;
            status: string;
            date: any;
            time: any;
        }[];
        settings: {
            upiId: string;
            usdt: {
                network: string;
                walletAddress: string;
            };
            financials: {
                platformFee: number;
                referralFee: number;
            };
            system: {
                maintenanceMode: boolean;
            };
            paymentModes: {
                upi: boolean;
                bank: boolean;
                usdt: boolean;
            };
        };
        profitDistributions: {
            id: any;
            reference: any;
            userId: any;
            userName: any;
            userEmail: any;
            amount: any;
            type: any;
            status: any;
            note: any;
            distributionDate: any;
            createdAt: any;
        }[];
        withdrawals: {
            id: any;
            withdrawalId: any;
            userId: any;
            userName: any;
            userEmail: any;
            amount: number;
            rawAmount: number;
            method: any;
            accountDetails: any;
            notes: any;
            status: string;
            currentEquity: number;
            availableBalance: number;
            pendingWithdrawals: number;
            requestedAt: any;
            processedAt: any;
            date: any;
            time: any;
        }[];
        plans: {
            id: any;
            name: any;
            subtitle: any;
            capitalLabel: any;
            desc: any;
            features: any;
            btnText: any;
            status: any;
            isPopular: any;
        }[];
        referralSettings: {
            id: string;
            partnerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            enabled: boolean;
            commissionRate: Prisma.Decimal;
            minimumDeposit: Prisma.Decimal;
            autoApprove: boolean;
            allowMultipleDeposits: boolean;
            commissionPayoutMode: string;
            maxReferralCommission: Prisma.Decimal | null;
        } | null;
    }>;
    createUser(adminId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: any;
        error?: undefined;
        status?: undefined;
    }>;
    updateUser(adminId: string, userId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        user: {
            id: string;
            partnerId: string;
            name: string;
            email: string;
            passwordHash: string;
            status: import("@prisma/client").$Enums.UserStatus;
            isDeleted: boolean;
            lastLoginAt: Date | null;
            lastLoginIP: string | null;
            createdAt: Date;
            updatedAt: Date;
            referralCode: string;
            referredBy: string | null;
            autoTrading: boolean;
            riskSetting: string;
        };
        error?: undefined;
        status?: undefined;
    }>;
    deleteUser(adminId: string, userId: string, clientIp: string): Promise<{
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
    createPartner(adminId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        partner?: undefined;
    } | {
        success: boolean;
        partner: {
            id: string;
            name: string;
            email: string;
            passwordHash: string;
            status: import("@prisma/client").$Enums.PartnerStatus;
            lastLoginAt: Date | null;
            lastLoginIP: string | null;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            companyName: string;
            profitSharePct: Prisma.Decimal;
            maxAllowedPct: Prisma.Decimal;
            domain: string;
            logo: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    createPlan(adminId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        plan?: undefined;
    } | {
        success: boolean;
        plan: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
        };
        error?: undefined;
        status?: undefined;
    }>;
    updatePlan(adminId: string, planId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        plan?: undefined;
    } | {
        success: boolean;
        plan: {
            id: string;
            name: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            desc: string;
            subtitle: string;
            capitalLabel: string;
            features: string[];
            btnText: string;
            isPopular: boolean;
        };
        error?: undefined;
        status?: undefined;
    }>;
    deletePlan(adminId: string, planId: string, clientIp: string): Promise<{
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
    getSettings(): Promise<{
        success: boolean;
        settings: {
            id: string;
            partnerId: string | null;
            updatedAt: Date;
            upiId: string | null;
            usdtAddress: string | null;
            usdtNetwork: string;
            referralFeePct: Prisma.Decimal;
            platformFeePct: Prisma.Decimal;
            maintenance: boolean;
        } | null;
    }>;
    updateSettings(adminId: string, body: any, clientIp: string): Promise<{
        success: boolean;
        settings: {
            id: string;
            partnerId: string | null;
            updatedAt: Date;
            upiId: string | null;
            usdtAddress: string | null;
            usdtNetwork: string;
            referralFeePct: Prisma.Decimal;
            platformFeePct: Prisma.Decimal;
            maintenance: boolean;
        };
    }>;
    getReferralSettings(): Promise<{
        success: boolean;
        settings: {
            id: string;
            partnerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            enabled: boolean;
            commissionRate: Prisma.Decimal;
            minimumDeposit: Prisma.Decimal;
            autoApprove: boolean;
            allowMultipleDeposits: boolean;
            commissionPayoutMode: string;
            maxReferralCommission: Prisma.Decimal | null;
        };
    }>;
    updateReferralSettings(adminId: string, body: any, clientIp: string): Promise<{
        success: boolean;
        settings: {
            id: string;
            partnerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            enabled: boolean;
            commissionRate: Prisma.Decimal;
            minimumDeposit: Prisma.Decimal;
            autoApprove: boolean;
            allowMultipleDeposits: boolean;
            commissionPayoutMode: string;
            maxReferralCommission: Prisma.Decimal | null;
        };
    }>;
    getReferrals(): Promise<{
        success: boolean;
        referrals: ({
            referrer: {
                name: string;
                email: string;
            };
            referredUser: {
                name: string;
                email: string;
            };
        } & {
            id: string;
            partnerId: string;
            status: import("@prisma/client").$Enums.ReferralStatus;
            createdAt: Date;
            updatedAt: Date;
            referrerId: string;
            referredId: string;
            depositAmount: Prisma.Decimal | null;
            commissionPct: Prisma.Decimal | null;
            commissionAmount: Prisma.Decimal | null;
            paymentId: string | null;
        })[];
    }>;
    updateReferralStatus(adminId: string, referralId: string, status: string, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        referral?: undefined;
    } | {
        success: boolean;
        referral: {
            id: string;
            partnerId: string;
            status: import("@prisma/client").$Enums.ReferralStatus;
            createdAt: Date;
            updatedAt: Date;
            referrerId: string;
            referredId: string;
            depositAmount: Prisma.Decimal | null;
            commissionPct: Prisma.Decimal | null;
            commissionAmount: Prisma.Decimal | null;
            paymentId: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    createTrade(adminId: string, body: any, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        trade?: undefined;
    } | {
        success: boolean;
        trade: {
            id: string;
            partnerId: string;
            status: import("@prisma/client").$Enums.TradeStatus;
            createdAt: Date;
            userId: string;
            ledgerTransactionGroupId: string | null;
            pair: string;
            entryPrice: Prisma.Decimal;
            exitPrice: Prisma.Decimal;
            type: import("@prisma/client").$Enums.TradeType;
            currentPrice: Prisma.Decimal;
            quantity: Prisma.Decimal;
            stopLoss: Prisma.Decimal;
            target: Prisma.Decimal;
            profit: Prisma.Decimal;
            pnl: Prisma.Decimal;
            closedAt: Date | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    closeTrade(adminId: string, tradeId: string, exitPrice: number | undefined, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
        status?: undefined;
    }>;
    listTradeRecords(): Promise<{
        result: string;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        pair: string;
        side: string;
        entryPrice: number;
        exitPrice: number;
        profitLoss: number;
        tradeDate: Date;
        notes: string | null;
    }[]>;
    createTradeRecord(body: any): Promise<{
        error: string;
        status: number;
        success?: undefined;
        tradeRecord?: undefined;
    } | {
        success: boolean;
        tradeRecord: {
            result: string;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            pair: string;
            side: string;
            entryPrice: number;
            exitPrice: number;
            profitLoss: number;
            tradeDate: Date;
            notes: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    updateTradeRecord(id: string, body: any): Promise<{
        error: string;
        status: number;
        success?: undefined;
        tradeRecord?: undefined;
    } | {
        success: boolean;
        tradeRecord: {
            result: string;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            pair: string;
            side: string;
            entryPrice: number;
            exitPrice: number;
            profitLoss: number;
            tradeDate: Date;
            notes: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    deleteTradeRecord(id: string): Promise<{
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
    setTradeRecordStatus(id: string, status: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        tradeRecord?: undefined;
    } | {
        success: boolean;
        tradeRecord: {
            result: string;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            pair: string;
            side: string;
            entryPrice: number;
            exitPrice: number;
            profitLoss: number;
            tradeDate: Date;
            notes: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    approvePayment(adminId: string, paymentId: string, clientIp: string): Promise<{
        success: boolean;
        payment: any;
    }>;
    rejectPayment(adminId: string, paymentId: string, remark: string, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        payment?: undefined;
    } | {
        success: boolean;
        payment: {
            id: string;
            partnerId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            planName: string;
            amount: Prisma.Decimal;
            currency: string;
            paymentType: import("@prisma/client").$Enums.PaymentType;
            network: string | null;
            txnHash: string | null;
            utr: string | null;
            screenshot: string | null;
            remark: string | null;
            ledgerTransactionGroupId: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    verifyPayment(adminId: string, paymentId: string, clientIp: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        payment?: undefined;
    } | {
        success: boolean;
        payment: {
            id: string;
            partnerId: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            planName: string;
            amount: Prisma.Decimal;
            currency: string;
            paymentType: import("@prisma/client").$Enums.PaymentType;
            network: string | null;
            txnHash: string | null;
            utr: string | null;
            screenshot: string | null;
            remark: string | null;
            ledgerTransactionGroupId: string | null;
        };
        error?: undefined;
        status?: undefined;
    }>;
    approveWithdrawal(adminId: string, withdrawalId: string, clientIp: string): Promise<{
        success: boolean;
        withdrawal: any;
        error?: undefined;
        status?: undefined;
    } | {
        error: any;
        status: number;
        success?: undefined;
        withdrawal?: undefined;
    }>;
    rejectWithdrawal(adminId: string, withdrawalId: string, clientIp: string): Promise<{
        success: boolean;
        withdrawal: any;
        error?: undefined;
        status?: undefined;
    } | {
        error: any;
        status: number;
        success?: undefined;
        withdrawal?: undefined;
    }>;
    reverseTransaction(adminId: string, transactionGroupId: string, reason: string, clientIp: string): Promise<{
        success: boolean;
        reversalGroup: any;
    }>;
    generateProfitDistributionReference(date: Date): Promise<string>;
    createProfitDistribution(body: any): Promise<{
        error: string;
        status: number;
        success?: undefined;
        profitDistribution?: undefined;
    } | {
        success: boolean;
        profitDistribution: {
            user: {
                id: string;
                partnerId: string;
                name: string;
                email: string;
                passwordHash: string;
                status: import("@prisma/client").$Enums.UserStatus;
                isDeleted: boolean;
                lastLoginAt: Date | null;
                lastLoginIP: string | null;
                createdAt: Date;
                updatedAt: Date;
                referralCode: string;
                referredBy: string | null;
                autoTrading: boolean;
                riskSetting: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: number;
            reference: string;
            type: string;
            note: string | null;
            distributionDate: Date;
        };
        error?: undefined;
        status?: undefined;
    }>;
    updateProfitDistribution(id: string, body: any): Promise<{
        success: boolean;
        profitDistribution: {
            user: {
                id: string;
                partnerId: string;
                name: string;
                email: string;
                passwordHash: string;
                status: import("@prisma/client").$Enums.UserStatus;
                isDeleted: boolean;
                lastLoginAt: Date | null;
                lastLoginIP: string | null;
                createdAt: Date;
                updatedAt: Date;
                referralCode: string;
                referredBy: string | null;
                autoTrading: boolean;
                riskSetting: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            amount: number;
            reference: string;
            type: string;
            note: string | null;
            distributionDate: Date;
        };
    }>;
    deleteProfitDistribution(id: string): Promise<{
        success: boolean;
    }>;
    getUserDetail(adminId: string, userId: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
        profile?: undefined;
        subscription?: undefined;
        wallet?: undefined;
        trading?: undefined;
        payments?: undefined;
        trades?: undefined;
        reports?: undefined;
        security?: undefined;
    } | {
        success: boolean;
        profile: {
            id: string;
            name: string;
            email: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            lastLoginAt: Date | null;
            lastLoginIP: string | null;
            partnerName: string;
        };
        subscription: any;
        wallet: {
            balance: number;
            unrealizedBalance: number;
            equity: number;
            totalDeposits: number;
            totalWithdrawals: number;
        };
        trading: {
            totalTrades: number;
            winningTrades: number;
            losingTrades: number;
            winRate: number;
        };
        payments: {
            id: string;
            planName: string;
            amount: number;
            currency: string;
            paymentType: import("@prisma/client").$Enums.PaymentType;
            txnHash: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
        }[];
        trades: {
            id: string;
            pair: string;
            type: import("@prisma/client").$Enums.TradeType;
            entryPrice: number;
            currentPrice: number;
            quantity: number;
            exitPrice: number;
            stopLoss: number;
            target: number;
            profit: number;
            pnl: number;
            status: import("@prisma/client").$Enums.TradeStatus;
            createdAt: Date;
            closedAt: Date | null;
        }[];
        reports: {
            id: string;
            fileName: string;
            reportType: string;
            fileUrl: string;
            createdAt: Date;
        }[];
        security: {
            lastLoginAt: Date | null;
            lastLoginIP: string | null;
            emailVerified: boolean;
            twoFactorEnabled: boolean;
            events: {
                id: string;
                action: string;
                reason: string;
                ipAddress: string | null;
                createdAt: Date;
            }[];
        };
        error?: undefined;
        status?: undefined;
    }>;
    listWithdrawals(): Promise<{
        id: any;
        withdrawalId: any;
        userId: any;
        userName: any;
        userEmail: any;
        amount: number;
        status: string;
        method: any;
        accountDetails: any;
        notes: any;
        currentEquity: number;
        availableBalance: number;
        pendingWithdrawals: number;
        requestedAt: any;
        processedAt: any;
        date: any;
    }[]>;
    getWithdrawalDetail(id: string): Promise<{
        id: string;
        withdrawalId: string;
        userId: string;
        userName: string;
        userEmail: string;
        amount: number;
        status: string;
        method: string;
        accountDetails: string;
        notes: string;
        currentEquity: number;
        availableBalance: number;
        pendingWithdrawals: number;
        requestedAt: Date;
        processedAt: Date | null;
        date: string;
    }>;
    getPnlReports(): Promise<{
        overview: {
            totalTrades: number;
            winningTrades: number;
            losingTrades: number;
            breakevenTrades: number;
            winRate: number;
            lossRate: number;
            breakevenRate: number;
            totalPnl: number;
            averageWin: number;
            averageLoss: number;
            profitFactor: string;
            grossProfit: number;
            grossLoss: number;
        };
        profitDistribution: {
            winningTrades: number;
            losingTrades: number;
            breakevenTrades: number;
            winRate: number;
            lossRate: number;
            breakevenRate: number;
        };
        monthlyPnl: {
            month: string;
            pnl: number;
        }[];
        rows: string[][];
    }>;
}
