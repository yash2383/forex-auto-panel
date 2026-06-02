"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionGroup = createTransactionGroup;
exports.reverseTransactionGroup = reverseTransactionGroup;
async function createTransactionGroup(tx, data) {
    const totalDebit = data.entries
        .filter((e) => e.entryType === 'DEBIT')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCredit = data.entries
        .filter((e) => e.entryType === 'CREDIT')
        .reduce((sum, e) => sum + Number(e.amount), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new Error(`Ledger transaction not balanced. Debits: ${totalDebit.toFixed(4)}, Credits: ${totalCredit.toFixed(4)}`);
    }
    const group = await tx.transactionGroup.create({
        data: {
            type: data.type,
            description: data.description,
            idempotencyKey: data.idempotencyKey,
        },
    });
    await tx.ledgerEntry.createMany({
        data: data.entries.map((e) => ({
            transactionGroupId: group.id,
            partnerId: e.partnerId || null,
            userId: e.userId || null,
            accountType: e.accountType,
            entryType: e.entryType,
            amount: Number(e.amount),
            currency: e.currency || 'INR',
        })),
    });
    for (const entry of data.entries) {
        if (entry.userId && entry.accountType === 'USER') {
            const wallet = await tx.wallet.findUnique({
                where: { userId: entry.userId },
            });
            if (!wallet) {
                throw new Error(`Wallet for user ${entry.userId} not found`);
            }
            const multiplier = entry.entryType === 'CREDIT' ? 1 : -1;
            const amountChange = Number(entry.amount) * multiplier;
            const nextBalance = Number(wallet.realizedBalance) + amountChange;
            const nextEquity = Number(wallet.currentEquity) + amountChange;
            const nextAvailable = data.type === 'WITHDRAWAL'
                ? Number(wallet.availableBalance)
                : Number(wallet.availableBalance) + amountChange;
            if (nextBalance < 0) {
                throw new Error(`Insufficient realized funds for user ${entry.userId}`);
            }
            const updated = await tx.wallet.updateMany({
                where: {
                    userId: entry.userId,
                    version: wallet.version,
                },
                data: {
                    realizedBalance: nextBalance,
                    currentEquity: nextEquity,
                    availableBalance: nextAvailable,
                    version: { increment: 1 },
                },
            });
            if (updated.count === 0) {
                throw new Error(`Concurrency conflict detected. Wallet balance update failed for user ${entry.userId}. Please retry.`);
            }
        }
    }
    return group;
}
async function reverseTransactionGroup(tx, originalGroupId, reason, adminId, _clientIp) {
    const originalGroup = await tx.transactionGroup.findUnique({
        where: { id: originalGroupId },
        include: { ledgerEntries: true },
    });
    if (!originalGroup) {
        throw new Error('Original transaction group not found');
    }
    if (originalGroup.type === 'SYSTEM_ADJUSTMENT') {
        throw new Error('Cannot reverse a system adjustment or reversal');
    }
    const idempotencyKey = `REVERSAL_${originalGroupId}`;
    const existingReversal = await tx.transactionGroup.findFirst({
        where: { idempotencyKey },
    });
    if (existingReversal) {
        throw new Error('Transaction group has already been reversed');
    }
    const reversedEntries = originalGroup.ledgerEntries.map((e) => ({
        userId: e.userId,
        partnerId: e.partnerId,
        accountType: e.accountType,
        entryType: e.entryType === 'DEBIT' ? 'CREDIT' : 'DEBIT',
        amount: Number(e.amount),
        currency: e.currency,
    }));
    const description = `REVERSAL | Reason: ${reason} | OriginalGroup: ${originalGroupId} | Admin: ${adminId}`;
    const reversalGroup = await tx.transactionGroup.create({
        data: {
            type: 'SYSTEM_ADJUSTMENT',
            description,
            idempotencyKey,
        },
    });
    await tx.ledgerEntry.createMany({
        data: reversedEntries.map((e) => ({
            transactionGroupId: reversalGroup.id,
            partnerId: e.partnerId,
            userId: e.userId,
            accountType: e.accountType,
            entryType: e.entryType,
            amount: e.amount,
            currency: e.currency,
        })),
    });
    for (const entry of reversedEntries) {
        if (entry.userId && entry.accountType === 'USER') {
            const wallet = await tx.wallet.findUnique({
                where: { userId: entry.userId },
            });
            if (!wallet) {
                throw new Error(`Wallet for user ${entry.userId} not found`);
            }
            const multiplier = entry.entryType === 'CREDIT' ? 1 : -1;
            const nextBalance = Number(wallet.realizedBalance) + entry.amount * multiplier;
            if (nextBalance < 0) {
                throw new Error(`Reversal failed. Insufficient negative realized funds for user ${entry.userId}`);
            }
            const updated = await tx.wallet.updateMany({
                where: {
                    userId: entry.userId,
                    version: wallet.version,
                },
                data: {
                    realizedBalance: nextBalance,
                    version: { increment: 1 },
                },
            });
            if (updated.count === 0) {
                throw new Error(`Concurrency conflict detected. Reversal balance update failed for user ${entry.userId}. Please retry.`);
            }
        }
    }
    return reversalGroup;
}
//# sourceMappingURL=ledger.util.js.map