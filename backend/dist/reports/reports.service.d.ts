import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    prisma: PrismaService;
    constructor(prisma: PrismaService);
    getReportSummary(userId: string): Promise<{
        totalTrades: number;
        winRate: number;
        totalProfit: number;
        totalDistributions: number;
        totalDeposits: number;
        totalWithdrawals: number;
        walletBalance: number;
    }>;
    getTradingReport(): Promise<{
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        breakEven: number;
        winRate: number;
        totalPnL: number;
        bestTrade: {
            pair: string;
            side: string;
            profitLoss: number;
            date: Date;
        } | null;
        worstTrade: {
            pair: string;
            side: string;
            profitLoss: number;
            date: Date;
        } | null;
        records: {
            pair: string;
            side: string;
            entryPrice: number;
            exitPrice: number;
            result: string;
            profitLoss: number;
            tradeDate: string;
            notes: string;
        }[];
    }>;
    getPnlDistribution(): Promise<{
        totalTrades: number;
        winningTrades: number;
        losingTrades: number;
        breakevenTrades: number;
        winRate: number;
        lossRate: number;
        breakevenRate: number;
        grossProfit: number;
        grossLoss: number;
        netProfit: number;
        averageWin: number;
        averageLoss: number;
        profitFactor: number;
        riskRewardRatio: number;
    }>;
    getMonthlyPnl(): Promise<{
        month: string;
        pnl: number;
    }[]>;
    getProfitReport(userId: string): Promise<{
        totalDistributed: number;
        pendingAmount: number;
        lastDistribution: Date | null;
        paidCount: number;
        pendingCount: number;
        records: {
            reference: string;
            amount: number;
            type: string;
            status: string;
            distributionDate: string;
            note: string;
        }[];
    }>;
    getWalletStatement(userId: string): Promise<{
        openingBalance: number;
        totalDeposits: number;
        totalWithdrawals: number;
        profitCredits: number;
        closingBalance: number;
        deposits: {
            date: string;
            plan: string;
            amount: number;
            type: import("@prisma/client").$Enums.PaymentType;
        }[];
        withdrawals: {
            date: string;
            amount: number;
            status: import("@prisma/client").$Enums.WithdrawalStatus;
        }[];
        profitEntries: {
            date: string;
            reference: string;
            amount: number;
            type: string;
        }[];
    }>;
    getTaxSummary(userId: string): Promise<{
        tradingPnL: number;
        distributionIncome: number;
        totalRealizedGains: number;
        taxRate: number;
        estimatedTax: number;
        netReturn: number;
    }>;
    getReportHistory(userId: string): Promise<{
        id: string;
        fileName: string;
        reportType: string;
        fileUrl: string;
        createdAt: Date;
    }[]>;
    saveReportRecord(userId: string, fileName: string, reportType: string, fileUrl: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        fileName: string;
        reportType: string;
        fileUrl: string;
    } | null>;
    generateCsvBuffer(userId: string, type: string): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    generatePdfBuffer(userId: string, type: string, userName: string): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
}
