import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getData(userId: string): Promise<{
        error: string;
        status: number;
        stats?: undefined;
        wallet?: undefined;
        trades?: undefined;
        payments?: undefined;
        withdrawals?: undefined;
        profitDistributions?: undefined;
        profitSummary?: undefined;
        user?: undefined;
    } | {
        stats: {
            totalProfit: number;
            realizedPnL: number;
            unrealizedPnL: number;
            winRate: number;
            activeTradesCount: number;
        };
        wallet: {
            id: string;
            updatedAt: Date;
            realizedBalance: import("@prisma/client/runtime/library").Decimal;
            unrealizedBalance: import("@prisma/client/runtime/library").Decimal;
            currentEquity: import("@prisma/client/runtime/library").Decimal;
            availableBalance: import("@prisma/client/runtime/library").Decimal;
            pendingWithdrawals: import("@prisma/client/runtime/library").Decimal;
            totalWithdrawn: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            version: number;
            userId: string;
        } | null;
        trades: {
            id: any;
            symbol: any;
            side: any;
            entry: number;
            exit: number;
            target: number;
            stopLoss: number;
            breakeven: number;
            pnl: string;
            rawPnl: number;
            points: string;
            qty: string;
            date: any;
            result: string;
            status: string;
        }[];
        payments: {
            id: any;
            plan: any;
            amount: string;
            txnHash: any;
            utr: any;
            network: any;
            date: any;
            time: any;
            status: string;
        }[];
        withdrawals: {
            id: any;
            amount: string;
            date: any;
            status: string;
        }[];
        profitDistributions: {
            id: any;
            reference: any;
            amount: any;
            type: any;
            status: any;
            note: any;
            distributionDate: any;
            createdAt: any;
        }[];
        profitSummary: {
            totalProfit: any;
            pendingProfit: any;
            monthlyProfit: any;
            lastDistribution: Date | null;
        };
        user: {
            id: string;
            name: string;
            email: string;
            status: import("@prisma/client").$Enums.UserStatus;
            autoTrading: boolean;
            riskSetting: string;
        };
        error?: undefined;
        status?: undefined;
    }>;
    deposit(userId: string, partnerId: string, body: any): Promise<{
        error: string;
        status: number;
        success?: undefined;
        payment?: undefined;
    } | {
        success: boolean;
        payment: {
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            partnerId: string;
            currency: string;
            userId: string;
            planName: string;
            amount: import("@prisma/client/runtime/library").Decimal;
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
    withdraw(userId: string, partnerId: string, amount: number): Promise<{
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
    updateSettings(userId: string, body: {
        autoTrading?: boolean;
        riskSetting?: string;
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
            autoTrading: boolean;
            riskSetting: string;
        };
        error?: undefined;
        status?: undefined;
    }>;
    getMyPaymentStatus(userId: string): Promise<{
        found: boolean;
        status: null;
        planName?: undefined;
        amount?: undefined;
        remark?: undefined;
        adminNote?: undefined;
        createdAt?: undefined;
        updatedAt?: undefined;
    } | {
        found: boolean;
        status: import("@prisma/client").$Enums.PaymentStatus;
        planName: string;
        amount: number;
        remark: string | null;
        adminNote: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
