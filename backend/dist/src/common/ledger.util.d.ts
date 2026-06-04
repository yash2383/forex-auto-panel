interface LedgerEntryInput {
    userId?: string;
    partnerId?: string;
    accountType: string;
    entryType: string;
    amount: number;
    currency?: string;
}
interface TransactionGroupInput {
    type: string;
    description: string;
    idempotencyKey: string;
    entries: LedgerEntryInput[];
}
export declare function createTransactionGroup(tx: any, data: TransactionGroupInput): Promise<any>;
export declare function reverseTransactionGroup(tx: any, originalGroupId: string, reason: string, adminId: string, _clientIp: string): Promise<any>;
export {};
