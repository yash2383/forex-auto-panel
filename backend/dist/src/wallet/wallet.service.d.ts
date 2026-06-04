import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare class WalletService {
    private prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
        partnerId: string;
        status: import("@prisma/client").$Enums.WithdrawalStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        amount: Prisma.Decimal;
        currency: string;
        ledgerTransactionGroupId: string | null;
        withdrawalId: string;
        method: string | null;
        accountDetails: string | null;
        notes: string | null;
        processedAt: Date | null;
        processedBy: string | null;
    }[]>;
    createWithdrawal(userId: string, partnerId: string, amount: number, method: string, accountDetails: any, notes?: string): Promise<any>;
}
