# Forex Auto Panel Database Architecture & Schema Specification

This document details the production-grade PostgreSQL database schema designed for the Forex Auto Panel fintech platform, utilizing Prisma ORM.

---

## 1. Complete Prisma Schema File

Save this schema configuration in your NestJS/Node.js project as `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==========================================
// STRICT STATUS ENUMS
// ==========================================

enum AdminRole {
  SUPER_ADMIN
  MANAGER
  VIEWER
}

enum AdminStatus {
  ACTIVE
  SUSPENDED
}

enum PartnerStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
}

enum UserStatus {
  NEW
  ACTIVE
  VIP
  BLOCKED
  EXPIRED
}

enum AccountType {
  USER
  TENANT
  SYSTEM
}

enum EntryType {
  DEBIT
  CREDIT
}

enum TradeType {
  BUY
  SELL
}

enum TradeStatus {
  ACTIVE
  CLOSED
  CANCELLED
}

enum PaymentType {
  USDT
  UPI
  BANK
}

enum PaymentStatus {
  PENDING
  VERIFIED
  APPROVED
  REJECTED
  FAILED
}

enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
  FAILED
}

enum ReferralStatus {
  PENDING
  PAID
  CANCELLED
}

enum OtpStatus {
  PENDING
  VERIFIED
  EXPIRED
}

enum TransactionGroupType {
  DEPOSIT
  TRADE_PROFIT
  TRADE_LOSS
  WITHDRAWAL
  PLATFORM_FEE
  REFERRAL_PAYOUT
  SYSTEM_ADJUSTMENT
}

// ==========================================
// IDENTITY LAYER MODELS
// ==========================================

model Admin {
  id              String           @id @default(uuid())
  name            String
  email           String           @unique
  passwordHash    String
  role            AdminRole        @default(VIEWER)
  status          AdminStatus      @default(ACTIVE)
  permissions     Json             // structured json e.g. { "users": ["read", "write"] }
  createdBy       String?          // UUID of super admin creator
  lastLoginAt     DateTime?
  lastLoginIP     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  securityEvents  SecurityEvent[]

  @@index([email])
}

model Partner {
  id                String         @id @default(uuid())
  slug              String         @unique // e.g. "alpha-traders"
  name              String
  companyName       String
  email             String         @unique
  passwordHash      String
  profitSharePct    Decimal        @db.Decimal(5, 2) // Commission percentage e.g. 30.00%
  maxAllowedPct     Decimal        @db.Decimal(5, 2)
  domain            String         @unique
  logo              String?        // logo URL or brand initials
  status            PartnerStatus  @default(ACTIVE)
  lastLoginAt       DateTime?
  lastLoginIP       String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  
  // Relations
  users             User[]
  ledgerEntries     LedgerEntry[]

  @@index([domain])
}

model User {
  id             String           @id @default(uuid())
  partnerId      String
  name           String
  email          String
  passwordHash   String
  status         UserStatus       @default(NEW)
  isDeleted      Boolean          @default(false)
  lastLoginAt    DateTime?
  lastLoginIP    String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  // Relations
  partner        Partner          @relation(fields: [partnerId], references: [id])
  wallet         Wallet?
  payments       Payment[]
  withdrawals    Withdrawal[]
  trades         Trade[]
  ledgerEntries  LedgerEntry[]
  securityEvents SecurityEvent[]
  otpRequests    OtpRequest[]

  // Uniqueness and tenant isolation indexes
  @@unique([partnerId, email])
  
  @@index([partnerId])
  @@index([partnerId, id])
  @@index([partnerId, email])
  @@index([partnerId, createdAt])
}

// ==========================================
// DOUBLE-ENTRY LEDGER & CACHED WALLETS
// ==========================================

model Wallet {
  id                 String     @id @default(uuid())
  userId             String     @unique
  realizedBalance    Decimal    @default(0.0000) @db.Decimal(18, 4) // Cash available for withdrawal
  unrealizedBalance  Decimal    @default(0.0000) @db.Decimal(18, 4) // Escrow/floating trades margin
  currency           String     @default("INR")
  version            Int        @default(1) // Version field for optimistic concurrency locking
  updatedAt          DateTime   @updatedAt

  // Relations
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId])
}

model TransactionGroup {
  id             String               @id @default(uuid())
  type           TransactionGroupType
  description    String
  idempotencyKey String               @unique // Prevents duplicate ledger posting
  createdAt      DateTime             @default(now())

  // Relations
  ledgerEntries  LedgerEntry[]
}

model LedgerEntry {
  id                 String           @id @default(uuid())
  transactionGroupId String
  partnerId          String?          // Null for system-level accounts
  userId             String?          // Null for partner or system-level accounts
  accountType        AccountType
  entryType          EntryType
  amount             Decimal          @db.Decimal(18, 4) // Always positive magnitude
  currency           String           @default("INR")
  createdAt          DateTime         @default(now())

  // Relations
  group              TransactionGroup @relation(fields: [transactionGroupId], references: [id], onDelete: Cascade)
  partner            Partner?         @relation(fields: [partnerId], references: [id])
  user               User?            @relation(fields: [userId], references: [id])

  // Isolation and auditing indexes
  @@index([transactionGroupId])
  @@index([userId, createdAt])
  @@index([partnerId, createdAt])
  @@index([transactionGroupId, entryType])
}

// ==========================================
// BUSINESS TELEMETRY (TRADES & CHECKOUTS)
// ==========================================

model Trade {
  id                       String      @id @default(uuid())
  userId                   String
  partnerId                String      // Tenant isolation anchor
  pair                     String      // e.g. "BTC/USDT"
  type                     TradeType
  entryPrice               Decimal     @db.Decimal(30, 10) // High precision for trading/crypto
  exitPrice                Decimal     @default(0.0) @db.Decimal(30, 10)
  stopLoss                 Decimal     @db.Decimal(30, 10)
  target                   Decimal     @db.Decimal(30, 10)
  profit                   Decimal     @default(0.0) @db.Decimal(30, 10)
  pnl                      Decimal     @default(0.0) @db.Decimal(30, 10)
  status                   TradeStatus @default(ACTIVE)
  ledgerTransactionGroupId String?     @unique // Links to Ledger after trade close (for profit/loss credits)
  createdAt                DateTime    @default(now())
  closedAt                 DateTime?

  // Relations
  user                     User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Tenant isolation & query index strategies
  @@index([userId])
  @@index([partnerId])
  @@index([partnerId, userId])
  @@index([partnerId, status])
  @@index([partnerId, createdAt])
}

model Payment {
  id                       String        @id @default(uuid())
  userId                   String
  partnerId                String        // Tenant isolation anchor
  planName                 String
  amount                   Decimal       @db.Decimal(18, 4)
  currency                 String        @default("INR")
  paymentType              PaymentType   @default(USDT)
  network                  String?       // e.g. "TRC20"
  txnHash                  String?       // USDT Transaction hash
  utr                      String?       // UPI transaction reference
  screenshot               String?       // URL/Path to receipt image
  remark                   String?
  status                   PaymentStatus @default(PENDING)
  ledgerTransactionGroupId String?       @unique // Links to Ledger ONLY after APPROVAL status
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt

  // Relations
  user                     User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes for tenant verification tables
  @@index([userId])
  @@index([partnerId])
  @@index([partnerId, userId])
  @@index([partnerId, status])
}

model Withdrawal {
  id                       String           @id @default(uuid())
  userId                   String
  partnerId                String           // Tenant isolation anchor
  amount                   Decimal          @db.Decimal(18, 4)
  currency                 String           @default("INR")
  status                   WithdrawalStatus @default(PENDING)
  ledgerTransactionGroupId String?          @unique // Links to Ledger after APPROVAL status
  createdAt                DateTime         @default(now())
  updatedAt                DateTime         @updatedAt

  // Relations
  user                     User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([userId])
  @@index([partnerId])
  @@index([partnerId, status])
}

// ==========================================
// SECURITY, CONFIG & MARKETING
// ==========================================

model SecurityEvent {
  id          String    @id @default(uuid())
  adminId     String?   // Operator responsible
  userId      String?   // Target client
  partnerId   String?   // Tenant scope
  action      String    // e.g. "OTP_OVERRIDE", "USER_BLOCKED"
  reason      String
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())

  // Relations
  admin       Admin?    @relation(fields: [adminId], references: [id])
  user        User?     @relation(fields: [userId], references: [id])

  // Auditing indexes
  @@index([partnerId, createdAt])
  @@index([userId, createdAt])
  @@index([adminId, createdAt])
}

model OtpRequest {
  id          String    @id @default(uuid())
  userId      String
  partnerId   String
  adminId     String?   // Populated if manually generated by moderator
  code        String
  status      OtpStatus @default(PENDING)
  createdAt   DateTime  @default(now())
  expiresAt   DateTime

  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([partnerId])
  @@index([userId, status])
}

model Referral {
  id           String         @id @default(uuid())
  partnerId    String
  referrerId   String         // User sharing link
  referredId   String         @unique // Target registered user
  rewardAmount Decimal        @db.Decimal(18, 4)
  status       ReferralStatus @default(PENDING)
  createdAt    DateTime       @default(now())

  // Indexes
  @@index([partnerId])
  @@index([referrerId])
}

model Campaign {
  id          String   @id @default(uuid())
  partnerId   String
  name        String
  slug        String   // e.g. "SUMMER2025" for routing path /register?campaign=SUMMER2025
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([partnerId, slug])
  @@index([partnerId])
}

model SystemSettings {
  id             String   @id @default(uuid())
  partnerId      String?  @unique // Null for global settings, populated for tenant overrides
  upiId          String?
  usdtAddress    String?
  usdtNetwork    String   @default("TRC20")
  referralFeePct Decimal  @default(10.00) @db.Decimal(5, 2)
  platformFeePct Decimal  @default(30.00) @db.Decimal(5, 2)
  maintenance    Boolean  @default(false)
  updatedAt      DateTime @updatedAt
}
```

---

## 2. Indexing Strategy Details

To ensure absolute multi-tenant data isolation and high-frequency analytical capabilities, the following indexes are defined:

1.  **Composite Tenant-Email Unique Constraint (`@@unique([partnerId, email])`)**:
    Allows users to register on separate tenant portals under identical email addresses while preventing duplicate user credentials within a single tenant brand.
2.  **Composite Tenant-User Indexes (`@@index([partnerId, userId])` / `@@index([partnerId, id])`)**:
    Enforces that database query filters for users, signals, and payouts execute query-level tenant isolation, removing the risk of cross-tenant data leaks.
3.  **Audit Logs Sorting Index (`@@index([partnerId, createdAt])` / `@@index([userId, createdAt])`)**:
    Enables extremely fast loading of sorted timeline lists in dashboard panels without full-table scanning.

---

## 3. Production Rules & Application-Level Enforcement

To maintain financial logic correctness, the application service layer must enforce the following invariants:

1.  **Ledger Balanced Transaction Constraint**:
    For every written `TransactionGroup`, the system must validate that the sum of debit lines exactly matches the sum of credit lines:
    $$\sum \text{Debit Amount} = \sum \text{Credit Amount}$$
    Prisma operations doing ledger commits must wrap entries in transaction statements (`prisma.$transaction`) and enforce this check before committing.
2.  **Optimistic Locking**:
    Every wallet credit/debit must use the `version` field. Queries executing updates must specify:
    ```typescript
    prisma.wallet.update({
      where: { id: walletId, version: currentVersion },
      data: { realizedBalance: nextBalance, version: currentVersion + 1 }
    })
    ```
    This prevents race conditions under high concurrent trading distribution cycles.
3.  **Payment and Withdrawal States**:
    `LedgerEntry` logs must only be posted *after* a `Payment` or `Withdrawal` has transitioned to `APPROVED`. Once approved, status changes are immutable, and the `ledgerTransactionGroupId` points permanently to the transaction record group.

---

## 4. Decision Log

Throughout the database brainstorming phase, the following architectural trade-offs were resolved:

*   **Database Engine: PostgreSQL + Prisma**
    *   *Alternatives considered*: MongoDB or DynamoDB.
    *   *Decision rationale*: Financial ledger operations and white-label distributions require absolute ACID compliance. Foreign key constraints and multi-row transaction commits are best handled by a relational database system.
*   **Logical Isolation vs. Database-per-Tenant**
    *   *Alternatives considered*: Physical schema-per-tenant, separate database instances.
    *   *Decision rationale*: To support an MVP with rapid scaling, a single PostgreSQL instance with logical segregation (`partnerId`) keeps infrastructure costs minimal, migrations effortless, and global admin statistics queries very fast.
*   **Balance Caching + Ledger Source of Truth (Approach A)**
    *   *Alternatives considered*: Summing ledger rows dynamically on every request.
    *   *Decision rationale*: Reading balance from a cached column is extremely fast (`O(1)` query complexity). Placing balance updates inside database transactions alongside ledger commits keeps wallet caches synchronized, while enabling a background reconciliation script to recalculate derived balances if necessary.
*   **Balanced Multi-Entry Ledger**
    *   *Alternatives considered*: Simple debit/credit strings.
    *   *Decision rationale*: Profit distributions debit a system wallet, then split credits among users, white-label tenants, and super admin accounts. The schema groups these lines under `TransactionGroup` with matching sums, establishing absolute financial correctness.
