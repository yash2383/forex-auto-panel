# NestJS Backend & Frontend API Integration Specification

This document details the production-ready implementation plan for the NestJS API server, the double-entry accounting ledger transaction service, and the patterns for connecting the Next.js frontend to real REST endpoints.

---

## 1. Directory Structure (NestJS Backend)

The backend code inside the NestJS project (`src/`) is structured as follows:

```
src/
├── main.ts                     # Application bootstrapping
├── app.module.ts               # Core module loading and routing configs
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts       # Database connection initialization
├── common/
│   ├── decorators/
│   │   └── user.decorator.ts   # Custom decorator for extracting auth tokens
│   ├── guards/
│   │   ├── auth.guard.ts       # Authentication verification middleware
│   │   └── roles.guard.ts      # RBAC permission check middleware
│   └── interceptors/
│       └── audit.interceptor.ts # Intercepts admin actions to create SecurityEvent rows
└── modules/
    ├── auth/                   # JWT & OAuth handlers
    ├── user/                   # User CRUD and profile details
    ├── admin/                  # Admin actions (manual closures, approvals)
    ├── partner/                # White Label partner configurations
    ├── wallet/                 # Wallet cache reads
    ├── ledger/                 # Ledger double-entry transactions (Core logic)
    ├── payment/                # Payment checkout status flow
    ├── withdrawal/             # Withdrawal request lifecycle
    ├── trade/                  # Signal list and outcome updates
    ├── security/               # Audit logger mapping
    └── otp/                    # Security code override management
```

---

## 2. Core Ledger Service (Double-Entry Engine)

This service manages database writes to ledger entries. It enforces balanced credits/debits and executes wallet cache updates inside a single PostgreSQL transaction block.

Create this service in `src/modules/ledger/ledger.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntryType, TransactionGroupType, AccountType } from '@prisma/client';

export interface LedgerEntryInput {
  partnerId?: string;
  userId?: string;
  accountType: AccountType;
  entryType: EntryType;
  amount: number;
  currency?: string;
}

export interface TransactionGroupInput {
  type: TransactionGroupType;
  description: String;
  idempotencyKey: String;
  entries: LedgerEntryInput[];
}

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransactionGroup(data: TransactionGroupInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Enforce Balanced Ledger constraint
      const totalDebit = data.entries
        .filter((e) => e.entryType === EntryType.DEBIT)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalCredit = data.entries
        .filter((e) => e.entryType === EntryType.CREDIT)
        .reduce((sum, e) => sum + e.amount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.0001) {
        throw new BadRequestException(
          `Ledger transaction not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}`
        );
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
          accountType: e.accountType,
          entryType: e.entryType,
          amount: e.amount,
          currency: e.currency || 'INR',
        })),
      });

      // 4. Update Wallets (Optimistic Concurrency Control)
      for (const entry of data.entries) {
        if (entry.userId && entry.accountType === AccountType.USER) {
          // Retrieve wallet details for optimistic locking check
          const wallet = await tx.wallet.findUnique({
            where: { userId: entry.userId },
          });

          if (!wallet) {
            throw new BadRequestException(`Wallet for user ${entry.userId} not found`);
          }

          const multiplier = entry.entryType === EntryType.CREDIT ? 1 : -1;
          const nextBalance = Number(wallet.realizedBalance) + entry.amount * multiplier;

          if (nextBalance < 0) {
            throw new BadRequestException(`Insufficient realized funds for user ${entry.userId}`);
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
            throw new BadRequestException(
              `Concurrency conflict detected. Wallet balance update failed for user ${entry.userId}. Please retry.`
            );
          }
        }
      }

      return group;
    });
  }
}
```

---

## 3. Business Workflows & Ledger Integration

### A. Deposit Verification Flow (`src/modules/payment/payment.service.ts`)
*   **Trigger**: User pays $\to$ inputs reference hash $\to$ Admin clicks **Approve** in admin panel.
*   **Action**: Update payment status to `APPROVED`, then write balanced ledger credits to user account.
```typescript
async approvePayment(paymentId: string, adminId: string, clientIp: string) {
  return this.prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.status !== 'PENDING') {
      throw new BadRequestException('Payment request not eligible for approval');
    }

    // Generate unique idempotency key
    const idempotencyKey = `DEP_APPROVAL_${payment.id}`;

    // Post to double-entry ledger
    const ledgerGroup = await this.ledgerService.createTransactionGroup({
      type: TransactionGroupType.DEPOSIT,
      description: `Manual approval of checkout payment ${payment.id}`,
      idempotencyKey,
      entries: [
        {
          accountType: AccountType.SYSTEM,
          entryType: EntryType.DEBIT,
          amount: Number(payment.amount),
          currency: payment.currency,
        },
        {
          userId: payment.userId,
          partnerId: payment.partnerId,
          accountType: AccountType.USER,
          entryType: EntryType.CREDIT,
          amount: Number(payment.amount),
          currency: payment.currency,
        },
      ],
    });

    // Update payment record to bind ledger details
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        ledgerTransactionGroupId: ledgerGroup.id,
      },
    });

    // Log security override trace
    await tx.securityEvent.create({
      data: {
        adminId,
        userId: payment.userId,
        partnerId: payment.partnerId,
        action: 'PAYMENT_APPROVED',
        reason: `Manual approval of ${paymentId}`,
        ipAddress: clientIp,
      },
    });
  });
}
```

### B. Withdrawal Request Flow (`src/modules/withdrawal/withdrawal.service.ts`)
*   **Trigger**: User requests cash settlement $\to$ Wallet realized balance is validated $\to$ Admin clears payment.
*   **Action**: Lock funds by moving them out of user balance via balanced debits.
```typescript
async approveWithdrawal(withdrawalId: string, adminId: string, clientIp: string) {
  return this.prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal || withdrawal.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal request not eligible for approval');
    }

    const idempotencyKey = `WITHDRAWAL_APPROVAL_${withdrawal.id}`;

    // Post debit log
    const ledgerGroup = await this.ledgerService.createTransactionGroup({
      type: TransactionGroupType.WITHDRAWAL,
      description: `Manual approval of withdrawal request ${withdrawal.id}`,
      idempotencyKey,
      entries: [
        {
          userId: withdrawal.userId,
          partnerId: withdrawal.partnerId,
          accountType: AccountType.USER,
          entryType: EntryType.DEBIT,
          amount: Number(withdrawal.amount),
          currency: withdrawal.currency,
        },
        {
          accountType: AccountType.SYSTEM,
          entryType: EntryType.CREDIT,
          amount: Number(withdrawal.amount),
          currency: withdrawal.currency,
        },
      ],
    });

    await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'APPROVED',
        ledgerTransactionGroupId: ledgerGroup.id,
      },
    });

    await tx.securityEvent.create({
      data: {
        adminId,
        userId: withdrawal.userId,
        partnerId: withdrawal.partnerId,
        action: 'WITHDRAWAL_APPROVED',
        reason: `Settled withdrawal request ${withdrawalId}`,
        ipAddress: clientIp,
      },
    });
  });
}
```

### C. Trade Settlement Flow (`src/modules/trade/trade.service.ts`)
*   **Trigger**: Trade closed (profit or loss).
*   **Action**: Post outcome changes directly into double-entry ledger.
```typescript
async settleClosedTrade(tradeId: string, exitPrice: number) {
  return this.prisma.$transaction(async (tx) => {
    const trade = await tx.trade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.status !== 'ACTIVE') {
      throw new BadRequestException('Trade is already closed or inactive');
    }

    const entry = Number(trade.entryPrice);
    const pnlVal = trade.type === 'BUY' ? exitPrice - entry : entry - exitPrice;
    const isProfit = pnlVal >= 0;
    const absPnl = Math.abs(pnlVal);

    const idempotencyKey = `TRADE_SETTLE_${trade.id}`;

    const entries: LedgerEntryInput[] = [];

    if (isProfit) {
      // System debits, user credits
      entries.push(
        { accountType: AccountType.SYSTEM, entryType: EntryType.DEBIT, amount: absPnl },
        { userId: trade.userId, partnerId: trade.partnerId, accountType: AccountType.USER, entryType: EntryType.CREDIT, amount: absPnl }
      );
    } else {
      // User debits, system credits
      entries.push(
        { userId: trade.userId, partnerId: trade.partnerId, accountType: AccountType.USER, entryType: EntryType.DEBIT, amount: absPnl },
        { accountType: AccountType.SYSTEM, entryType: EntryType.CREDIT, amount: absPnl }
      );
    }

    const ledgerGroup = await this.ledgerService.createTransactionGroup({
      type: isProfit ? TransactionGroupType.TRADE_PROFIT : TransactionGroupType.TRADE_LOSS,
      description: `Settlement of ${trade.pair} trade signal ${trade.id}`,
      idempotencyKey,
      entries,
    });

    await tx.trade.update({
      where: { id: tradeId },
      data: {
        exitPrice,
        pnl: pnlVal,
        profit: pnlVal,
        status: 'CLOSED',
        closedAt: new Date(),
        ledgerTransactionGroupId: ledgerGroup.id,
      },
    });
  });
}
```

---

## 4. Frontend Next.js API Integration

To connect the React frontend to NestJS modules, replace static Zustand store calls with server data fetching logic:

### A. API Request Utility Wrapper
```javascript
export async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('tradebot-jwt-token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'API request failed');
  }
  return response.json();
}
```

### B. Dynamic Wallet Balance Hook (`app/dashboard/wallet/page.js`)
```javascript
"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../../lib/api";

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/wallet/my-balance')
      .then((data) => {
        setWallet(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading wallet balance...</p>;
  if (!wallet) return <p>Error loading balance</p>;

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6">
      <h3 className="text-sm font-semibold text-neutral-400">Available Balance</h3>
      <p className="mt-2 text-3xl font-bold text-white">
        {wallet.currency} {Number(wallet.realizedBalance).toLocaleString("en-IN")}
      </p>
    </div>
  );
}
```
