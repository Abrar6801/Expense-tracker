-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'REIMBURSEMENT';

-- CreateTable
CREATE TABLE "Split" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmount" DECIMAL(19,4) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Split_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitMember" (
    "id" TEXT NOT NULL,
    "splitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "receivedAt" TIMESTAMP(3),
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Split_userId_idx" ON "Split"("userId");

-- CreateIndex
CREATE INDEX "Split_accountId_idx" ON "Split"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "SplitMember_transactionId_key" ON "SplitMember"("transactionId");

-- CreateIndex
CREATE INDEX "SplitMember_splitId_idx" ON "SplitMember"("splitId");

-- AddForeignKey
ALTER TABLE "Split" ADD CONSTRAINT "Split_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitMember" ADD CONSTRAINT "SplitMember_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "Split"("id") ON DELETE CASCADE ON UPDATE CASCADE;
