-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TRANSFER';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "transferPairId" TEXT;
