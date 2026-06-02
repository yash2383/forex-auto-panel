"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const fixMode = process.argv.includes("--fix");
async function runReconciliation() {
    console.log("==================================================");
    console.log(`RUNNING FINANCIAL AUDIT & RECONCILIATION ENGINE ${fixMode ? "[AUTO-FIX ACTIVE]" : ""}`);
    console.log("==================================================\n");
    let discrepanciesCount = 0;
    let criticalCount = 0;
    console.log("1. Auditing Transaction Groups (Debit vs Credit Integrity)...");
    const groups = await prisma.transactionGroup.findMany({
        include: { ledgerEntries: true },
    });
    for (const group of groups) {
        const totalDebit = group.ledgerEntries
            .filter((e) => e.entryType === "DEBIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const totalCredit = group.ledgerEntries
            .filter((e) => e.entryType === "CREDIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const difference = Math.abs(totalDebit - totalCredit);
        if (difference > 0.0001) {
            criticalCount++;
            console.log(`[CRITICAL] TransactionGroup ${group.id} (${group.type}) is unbalanced! Debits: ₹${totalDebit.toFixed(2)}, Credits: ₹${totalCredit.toFixed(2)} (Diff: ₹${difference.toFixed(2)})`);
        }
    }
    if (criticalCount === 0) {
        console.log("   [OK] All transaction groups balance properly.\n");
    }
    else {
        console.log(`   [CRITICAL] Found ${criticalCount} unbalanced transaction groups.\n`);
    }
    console.log("2. Auditing User Wallets (Ledger Sum vs Wallet Cache Balance)...");
    const users = await prisma.user.findMany({
        where: { isDeleted: false },
        include: { wallet: true },
    });
    for (const user of users) {
        if (!user.wallet) {
            console.log(`[ERROR] User ${user.name} (${user.email}) has no wallet record!`);
            discrepanciesCount++;
            continue;
        }
        const wallet = user.wallet;
        const realizedBalance = Number(wallet.realizedBalance);
        const entries = await prisma.ledgerEntry.findMany({
            where: { userId: user.id, accountType: "USER" },
        });
        const creditSum = entries
            .filter((e) => e.entryType === "CREDIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const debitSum = entries
            .filter((e) => e.entryType === "DEBIT")
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const calculatedBalance = creditSum - debitSum;
        const drift = Math.abs(calculatedBalance - realizedBalance);
        const hasDrift = drift > 0.0001;
        const isNegative = realizedBalance < 0;
        if (hasDrift || isNegative) {
            discrepanciesCount++;
            let errorMsgs = [];
            if (hasDrift) {
                errorMsgs.push(`Drift detected: Calculated ₹${calculatedBalance.toFixed(2)} vs Cache ₹${realizedBalance.toFixed(2)} (Drift: ₹${drift.toFixed(2)})`);
            }
            if (isNegative) {
                errorMsgs.push(`Negative wallet balance detected: ₹${realizedBalance.toFixed(2)}`);
            }
            console.log(`[ERROR] User: ${user.name} (${user.email}) | ${errorMsgs.join(" | ")}`);
            if (fixMode && hasDrift) {
                console.log(`   [FIX] Updating user wallet realizedBalance to calculated: ₹${calculatedBalance.toFixed(2)}`);
                await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        realizedBalance: calculatedBalance,
                        version: { increment: 1 },
                    },
                });
            }
        }
        else {
            console.log(`[OK] User ${user.name} (${user.email}) - Balanced (Balance: ₹${realizedBalance.toLocaleString("en-IN")})`);
        }
    }
    console.log("\n==================================================");
    console.log("RECONCILIATION SUMMARY");
    console.log(`- Unbalanced Groups (Critical Errors): ${criticalCount}`);
    console.log(`- Wallet Discrepancies (Drifts/Negative Balances): ${discrepanciesCount}`);
    console.log("==================================================");
    if (discrepanciesCount === 0 && criticalCount === 0) {
        console.log("✅ SYSTEM IS IN PERFECT FINANCIAL HEALTH!");
    }
    else if (fixMode) {
        console.log("🔧 AUTO-FIX COMPLETED. RE-RUN SCRIPT TO RE-VERIFY.");
    }
    else {
        console.log("🚨 DISCREPANCIES DETECTED. PLEASE REVIEW LOGS OR RUN WITH --fix FLAG.");
    }
}
runReconciliation()
    .catch((e) => {
    console.error("Reconciliation execution error:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reconcile.js.map