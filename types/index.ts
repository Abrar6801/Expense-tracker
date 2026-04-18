import type { Account, Transaction, UserPreferences, PlannedExpense, ExpectedIncome, AccountType, TransactionType, ExpectedIncomeType } from '@prisma/client'

// ─── Re-exports from Prisma ───────────────────────────────────────────────────
export type { AccountType, TransactionType, ExpectedIncomeType }

// ─── Serialized types (Decimal → string, Date → string for JSON) ──────────────

export type SerializedAccount = Omit<Account, 'balance' | 'createdAt' | 'updatedAt'> & {
  balance: string
  createdAt: string
  updatedAt: string
}

export type SerializedTransaction = Omit<
  Transaction,
  'amount' | 'date' | 'createdAt' | 'updatedAt'
> & {
  amount: string
  date: string
  createdAt: string
  updatedAt: string
  account?: {
    id: string
    name: string
    color: string | null
    currency: string
  }
}

export type SerializedUserPreferences = Omit<
  UserPreferences,
  'createdAt' | 'updatedAt'
> & {
  createdAt: string
  updatedAt: string
}

export type SerializedPlannedExpense = Omit<PlannedExpense, 'amount' | 'createdAt' | 'updatedAt'> & {
  amount: string
  createdAt: string
  updatedAt: string
  account: {
    id: string
    name: string
    color: string | null
    currency: string
  }
}

export function serializePlannedExpense(
  item: PlannedExpense & { account: Pick<Account, 'id' | 'name' | 'color' | 'currency'> }
): SerializedPlannedExpense {
  return {
    ...item,
    amount: item.amount.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export type SerializedExpectedIncome = Omit<ExpectedIncome, 'amount' | 'createdAt' | 'updatedAt'> & {
  amount: string
  createdAt: string
  updatedAt: string
}

export function serializeExpectedIncome(item: ExpectedIncome): SerializedExpectedIncome {
  return {
    ...item,
    amount: item.amount.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

// ─── API Response types ───────────────────────────────────────────────────────

export type ApiError = {
  error: string
  details?: unknown
}

export type AccountsResponse = {
  accounts: SerializedAccount[]
}

export type TransactionsResponse = {
  transactions: SerializedTransaction[]
  total: number
  page: number
  pageSize: number
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export type CategorySpending = {
  category: string
  total: number
  percentage: number
}

export type DashboardStats = {
  netWorth: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  spendingByCategory: CategorySpending[]
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type TransactionFilters = {
  accountId?: string
  type?: TransactionType
  category?: string
  dateRange?: '7d' | '30d' | '3m' | '6m' | 'ytd' | 'all'
  page?: number
  pageSize?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function serializeAccount(account: Account): SerializedAccount {
  return {
    ...account,
    balance: account.balance.toString(),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }
}

export function serializeTransaction(
  transaction: Transaction & {
    account?: Pick<Account, 'id' | 'name' | 'color' | 'currency'>
  }
): SerializedTransaction {
  return {
    ...transaction,
    amount: transaction.amount.toString(),
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    account: transaction.account
      ? {
          id: transaction.account.id,
          name: transaction.account.name,
          color: transaction.account.color,
          currency: transaction.account.currency,
        }
      : undefined,
  }
}
