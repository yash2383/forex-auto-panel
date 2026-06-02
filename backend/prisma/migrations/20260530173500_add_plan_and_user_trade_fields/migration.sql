-- AlterTable
ALTER TABLE "Trade" ADD COLUMN "currentPrice" DECIMAL(30,10) NOT NULL DEFAULT 0.0,
ADD COLUMN "quantity" DECIMAL(30,10) NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "autoTrading" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "riskSetting" TEXT NOT NULL DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "capitalLabel" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "features" TEXT[],
    "btnText" TEXT NOT NULL DEFAULT 'Get Started',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
