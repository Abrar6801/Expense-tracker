-- CreateEnum
CREATE TYPE "ExpectedIncomeType" AS ENUM ('INCOME_SOURCE', 'MONEY_OWED');

-- CreateTable
CREATE TABLE "ExpectedIncome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "type" "ExpectedIncomeType" NOT NULL,
    "from" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpectedIncome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpectedIncome_userId_idx" ON "ExpectedIncome"("userId");
