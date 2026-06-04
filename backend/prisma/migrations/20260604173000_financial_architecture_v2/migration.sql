-- Financial architecture v2
-- UserPlan history, profit distribution batches, wallet ledger, and operational audit.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DistributionStatus') THEN
    CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'COMPLETED', 'REVERSED', 'FAILED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LedgerType') THEN
    CREATE TYPE "LedgerType" AS ENUM (
      'DEPOSIT',
      'WITHDRAWAL',
      'REFERRAL_COMMISSION',
      'PROFIT_DISTRIBUTION',
      'PROFIT_REVERSAL',
      'ADJUSTMENT'
    );
  END IF;
END $$;

ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "WithdrawalStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';

ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "amount" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "pricingType" VARCHAR(20) NOT NULL DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS "weeklyProfit" DECIMAL(5,2) NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Plan"
SET "slug" = lower(regexp_replace(regexp_replace("name", '\s+plan$', '', 'i'), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "Plan" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Plan_slug_key" ON "Plan"("slug");

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "initiationId" TEXT,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

ALTER TABLE "SystemSettings"
  ADD COLUMN IF NOT EXISTS "platformProfitCut" DECIMAL(5,2) NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "referralBonusMultiplier" DECIMAL(5,2) NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "minimumEligibleDeposit" DECIMAL(18,4) NOT NULL DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS "enableBulkDistribution" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "allowDuplicateWeeklyPayouts" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "maintenanceMode" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "PaymentInitiation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "planId" TEXT,
  "amount" DECIMAL(18,4) NOT NULL,
  "paymentGateway" VARCHAR(50) DEFAULT 'usdt',
  "paymentType" VARCHAR(20),
  "status" VARCHAR(20) NOT NULL DEFAULT 'initiated',
  "source" TEXT,
  "checkoutOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingAt" TIMESTAMP(3),
  "followUpStatus" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "contactedAt" TIMESTAMP(3),
  "remarks" TEXT,
  "converted" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "PaymentInitiation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentInitiation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PaymentInitiation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_initiationId_fkey') THEN
    ALTER TABLE "Payment"
      ADD CONSTRAINT "Payment_initiationId_fkey"
      FOREIGN KEY ("initiationId") REFERENCES "PaymentInitiation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "ProfitDistributionBatch" (
  "id" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "totalProcessed" INTEGER NOT NULL,
  "successCount" INTEGER NOT NULL,
  "failedCount" INTEGER NOT NULL,
  "skippedCount" INTEGER NOT NULL,
  "dryRun" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "weekKey" TEXT,
  "totalInvestment" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "totalGrossProfit" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "totalPlatformCut" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "totalNetProfit" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "status" "DistributionStatus" NOT NULL DEFAULT 'COMPLETED',
  "reversedAt" TIMESTAMP(3),
  "reversedBy" TEXT,
  CONSTRAINT "ProfitDistributionBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProfitDistribution" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT,
  "batchId" TEXT,
  "investmentAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "grossProfit" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "platformCut" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "netProfit" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "type" TEXT NOT NULL DEFAULT 'Weekly Profit',
  "status" "DistributionStatus" NOT NULL DEFAULT 'COMPLETED',
  "note" TEXT DEFAULT '',
  "distributionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "weekKey" TEXT NOT NULL,
  "reversedAt" TIMESTAMP(3),
  "reversedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfitDistribution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProfitDistribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfitDistribution_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProfitDistributionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "UserPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WalletLedger" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "LedgerType" NOT NULL,
  "entryType" "EntryType" NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "referenceId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FinancialEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "userId" TEXT,
  "actorId" TEXT,
  "referenceId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_initiationId_key" ON "Payment"("initiationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PaymentInitiation_userId_idx" ON "PaymentInitiation"("userId");
CREATE INDEX IF NOT EXISTS "PaymentInitiation_partnerId_idx" ON "PaymentInitiation"("partnerId");
CREATE INDEX IF NOT EXISTS "PaymentInitiation_partnerId_status_idx" ON "PaymentInitiation"("partnerId", "status");
CREATE INDEX IF NOT EXISTS "PaymentInitiation_partnerId_followUpStatus_idx" ON "PaymentInitiation"("partnerId", "followUpStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "ProfitDistribution_reference_key" ON "ProfitDistribution"("reference");
CREATE UNIQUE INDEX IF NOT EXISTS "ProfitDistribution_userId_weekKey_key" ON "ProfitDistribution"("userId", "weekKey");
CREATE INDEX IF NOT EXISTS "ProfitDistribution_userId_idx" ON "ProfitDistribution"("userId");
CREATE INDEX IF NOT EXISTS "ProfitDistribution_batchId_idx" ON "ProfitDistribution"("batchId");
CREATE INDEX IF NOT EXISTS "ProfitDistribution_reference_idx" ON "ProfitDistribution"("reference");
CREATE INDEX IF NOT EXISTS "UserPlan_userId_idx" ON "UserPlan"("userId");
CREATE INDEX IF NOT EXISTS "UserPlan_userId_active_idx" ON "UserPlan"("userId", "active");
CREATE UNIQUE INDEX IF NOT EXISTS "UserPlan_one_active_per_user_key" ON "UserPlan"("userId") WHERE "active" = true;
CREATE INDEX IF NOT EXISTS "WalletLedger_userId_idx" ON "WalletLedger"("userId");
CREATE INDEX IF NOT EXISTS "WalletLedger_userId_type_idx" ON "WalletLedger"("userId", "type");
CREATE INDEX IF NOT EXISTS "WalletLedger_referenceId_idx" ON "WalletLedger"("referenceId");
CREATE INDEX IF NOT EXISTS "FinancialEvent_userId_idx" ON "FinancialEvent"("userId");
CREATE INDEX IF NOT EXISTS "FinancialEvent_eventType_idx" ON "FinancialEvent"("eventType");
CREATE INDEX IF NOT EXISTS "FinancialEvent_referenceId_idx" ON "FinancialEvent"("referenceId");
