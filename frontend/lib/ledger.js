/**
 * Core Ledger Double-Entry Engine & Wallet Cache Sync
 */

/**
 * Enforces double-entry ledger entries and updates wallet cache.
 * MUST be run within an existing Prisma transaction block ($transaction).
 * 
 * @param {object} tx - Prisma transaction client instance
 * @param {object} data - Transaction details
 * @param {string} data.type - TransactionGroupType (e.g. DEPOSIT, WITHDRAWAL)
 * @param {string} data.description - Audit explanation
 * @param {string} data.idempotencyKey - Prevents double postings
 * @param {Array} data.entries - Debits and credits
 * @returns {Promise<object>} Created transaction group
 */
export async function createTransactionGroup(tx, data) {
  // 1. Enforce Balanced Ledger constraint
  const totalDebit = data.entries
    .filter((e) => e.entryType === "DEBIT")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalCredit = data.entries
    .filter((e) => e.entryType === "CREDIT")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Floating point check up to 4 decimal places
  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    throw new Error(`Ledger transaction not balanced. Debits: ${totalDebit.toFixed(4)}, Credits: ${totalCredit.toFixed(4)}`);
  }

  // 2. Create the Transaction Group (Audit Journal Header)
  const group = await tx.transactionGroup.create({
    data: {
      type: data.type,
      description: data.description,
      idempotencyKey: data.idempotencyKey,
    },
  });

  // 3. Insert Ledger Entries
  await tx.ledgerEntry.createMany({
    data: data.entries.map((e) => ({
      transactionGroupId: group.id,
      partnerId: e.partnerId || null,
      userId: e.userId || null,
      accountType: e.accountType, // USER, TENANT, SYSTEM
      entryType: e.entryType,     // DEBIT, CREDIT
      amount: Number(e.amount),
      currency: e.currency || "INR",
    })),
  });

  // 4. Update Wallets (Optimistic Concurrency Control)
  for (const entry of data.entries) {
    if (entry.userId && entry.accountType === "USER") {
      // Retrieve wallet details for optimistic locking check
      const wallet = await tx.wallet.findUnique({
        where: { userId: entry.userId },
      });

      if (!wallet) {
        throw new Error(`Wallet for user ${entry.userId} not found`);
      }

      const multiplier = entry.entryType === "CREDIT" ? 1 : -1;
      const nextBalance = Number(wallet.realizedBalance) + Number(entry.amount) * multiplier;

      if (nextBalance < 0) {
        throw new Error(`Insufficient realized funds for user ${entry.userId}`);
      }

      // Execute optimistic lock update
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
        throw new Error(
          `Concurrency conflict detected. Wallet balance update failed for user ${entry.userId}. Please retry.`
        );
      }
    }
  }

  return group;
}

/**
 * Reverses an existing Transaction Group.
 * MUST be run within an existing Prisma transaction block ($transaction).
 * 
 * @param {object} tx - Prisma transaction client
 * @param {string} originalGroupId - ID of the transaction group to undo
 * @param {string} reason - Reversal explanation
 * @param {string} adminId - Admin performing the reversal
 * @param {string} clientIp - Client IP
 * @returns {Promise<object>} Created reversal transaction group
 */
export async function reverseTransactionGroup(tx, originalGroupId, reason, adminId, clientIp) {
  // 1. Fetch original group and entries
  const originalGroup = await tx.transactionGroup.findUnique({
    where: { id: originalGroupId },
    include: { ledgerEntries: true },
  });

  if (!originalGroup) {
    throw new Error("Original transaction group not found");
  }

  // 2. Prevent reversing a reversal/system adjustment
  if (originalGroup.type === "SYSTEM_ADJUSTMENT") {
    throw new Error("Cannot reverse a system adjustment or reversal");
  }

  // 3. Check if already reversed (idempotency key constraint)
  const idempotencyKey = `REVERSAL_${originalGroupId}`;
  const existingReversal = await tx.transactionGroup.findFirst({
    where: { idempotencyKey },
  });

  if (existingReversal) {
    throw new Error("Transaction group has already been reversed");
  }

  // 4. Invert entries (DEBIT <-> CREDIT) while keeping all other fields identical
  const reversedEntries = originalGroup.ledgerEntries.map((e) => ({
    userId: e.userId,
    partnerId: e.partnerId,
    accountType: e.accountType,
    entryType: e.entryType === "DEBIT" ? "CREDIT" : "DEBIT",
    amount: Number(e.amount),
    currency: e.currency,
  }));

  // Upgrade description format for production-grade audit
  const description = `REVERSAL | Reason: ${reason} | OriginalGroup: ${originalGroupId} | Admin: ${adminId}`;

  // 5. Create the reversal group (SYSTEM_ADJUSTMENT type)
  const reversalGroup = await tx.transactionGroup.create({
    data: {
      type: "SYSTEM_ADJUSTMENT",
      description,
      idempotencyKey,
    },
  });

  // 6. Insert reversed entries
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

  // 7. Update User Wallets (Optimistic Concurrency Control)
  for (const entry of reversedEntries) {
    if (entry.userId && entry.accountType === "USER") {
      const wallet = await tx.wallet.findUnique({
        where: { userId: entry.userId },
      });

      if (!wallet) {
        throw new Error(`Wallet for user ${entry.userId} not found`);
      }

      const multiplier = entry.entryType === "CREDIT" ? 1 : -1;
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
        throw new Error(
          `Concurrency conflict detected. Reversal balance update failed for user ${entry.userId}. Please retry.`
        );
      }
    }
  }

  return reversalGroup;
}
