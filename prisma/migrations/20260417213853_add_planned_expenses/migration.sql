-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'CASH';

-- CreateTable
CREATE TABLE "PlannedExpense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "category" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlannedExpense_userId_idx" ON "PlannedExpense"("userId");

-- CreateIndex
CREATE INDEX "PlannedExpense_accountId_idx" ON "PlannedExpense"("accountId");

-- AddForeignKey
ALTER TABLE "PlannedExpense" ADD CONSTRAINT "PlannedExpense_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
