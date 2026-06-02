import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class WalletService {
    private prisma;
    constructor(prisma: PrismaService);
    getWalletData(userId: string): Promise<{
        realizedBalance: number;
        currentEquity: number;
        availableBalance: number;
        pendingWithdrawals: number;
        totalWithdrawn: number;
        currency: string;
    }>;
    getWithdrawals(userId: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.WithdrawalStatus;
        createdAt: Date;
        updatedAt: Date;
        partnerId: string;
        userId: string;
        ledgerTransactionGroupId: string | null;
        currency: string;
        amount: Prisma.Decimal;
        withdrawalId: string;
        method: string | null;
        accountDetails: string | null;
        notes: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }[]>;
    createWithdrawal(userId: string, partnerId: string, amount: number, method: string, accountDetails: any, notes?: string): Promise<any>;
}
