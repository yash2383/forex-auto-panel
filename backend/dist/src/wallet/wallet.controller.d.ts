import { WalletService } from './wallet.service';
import type { Request } from 'express';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getWallet(req: Request): Promise<{
        realizedBalance: number;
        currentEquity: number;
        availableBalance: number;
        pendingWithdrawals: number;
        totalWithdrawn: number;
        currency: string;
    }>;
    getWithdrawals(req: Request): Promise<{
        id: string;
        withdrawalId: string;
        amount: number;
        status: import("@prisma/client").$Enums.WithdrawalStatus;
        method: string | null;
        accountDetails: string | null;
        notes: string | null;
        createdAt: Date;
        processedAt: Date | null;
    }[]>;
    createWithdrawal(req: Request, body: {
        amount: number;
        method: string;
        accountDetails: any;
        notes?: string;
    }): Promise<{
        success: boolean;
        withdrawal: any;
    }>;
}
