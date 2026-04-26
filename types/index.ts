import type {
  Account, Transaction, UserPreferences, PlannedExpense, ExpectedIncome,
  AccountType, TransactionType, ExpectedIncomeType,
  BudgetLimit, RecurringTemplate, SavingsGoal, CashEnvelope,
  Split, SplitMember, SplitGroup, SplitGroupMember,
} from '@prisma/client'

export type { AccountType, TransactionType, ExpectedIncomeType }

// ─── Serialized models ────────────────────────────────────────────────────────

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

export type SerializedUserPreferences = Omit<UserPreferences, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export type SerializedPlannedExpense = Omit<PlannedExpense, 'amount' | 'createdAt' | 'updatedAt'> & {
  amount: string
  createdAt: string
  updatedAt: string
  account: { id: string; name: string; color: string | null; currency: string }
}

export type SerializedExpectedIncome = Omit<ExpectedIncome, 'amount' | 'createdAt' | 'updatedAt'> & {
  amount: string
  createdAt: string
  updatedAt: string
}

export type SerializedBudgetLimit = Omit<BudgetLimit, 'amount' | 'createdAt' | 'updatedAt'> & {
  amount: string
  createdAt: string
  updatedAt: string
  spent: number
  percentage: number
}

export type SerializedRecurringTemplate = Omit<
  RecurringTemplate,
  'amount' | 'nextDue' | 'createdAt' | 'updatedAt'
> & {
  amount: string
  nextDue: string
  createdAt: string
  updatedAt: string
  account: { id: string; name: string; color: string | null; currency: string }
}

export type SerializedSavingsGoal = Omit<SavingsGoal, 'targetAmount' | 'deadline' | 'createdAt' | 'updatedAt'> & {
  targetAmount: string
  deadline: string | null
  createdAt: string
  updatedAt: string
  currentAmount: number
  account: { id: string; name: string; color: string | null; currency: string } | null
}

export type SerializedCashEnvelope = Omit<CashEnvelope, 'totalAmount' | 'createdAt' | 'updatedAt'> & {
  totalAmount: string
  createdAt: string
  updatedAt: string
  spent: number
  remaining: number
  account: { id: string; name: string; color: string | null; currency: string }
  transactions: SerializedTransaction[]
}

export type SerializedSplitMember = Omit<SplitMember, 'amount' | 'receivedAt' | 'createdAt' | 'updatedAt'> & {
  amount: string
  receivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SerializedSplit = Omit<Split, 'totalAmount' | 'date' | 'createdAt' | 'updatedAt'> & {
  totalAmount: string
  date: string
  createdAt: string
  updatedAt: string
  pendingAmount: number
  receivedAmount: number
  members: SerializedSplitMember[]
}

export type SerializedSplitGroupMember = Omit<SplitGroupMember, 'createdAt'> & {
  createdAt: string
}

export type SerializedSplitGroup = Omit<SplitGroup, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  members: SerializedSplitGroupMember[]
}

// ─── API response types ───────────────────────────────────────────────────────

export type ApiError = { error: string; details?: unknown }
export type AccountsResponse = { accounts: SerializedAccount[] }
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
  change?: number | null
}

export type DashboardStats = {
  netWorth: number
  netWorthByCurrency: Record<string, number>
  netWorthUSD: number
  hasMixedCurrencies: boolean
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNet: number
  lastMonthIncome: number
  lastMonthExpenses: number
  spendingByCategory: CategorySpending[]
  pendingFromFriends: number
}

export type TrendPoint = {
  month: string
  income: number
  expenses: number
  net: number
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export type TransactionFilters = {
  accountId?: string
  type?: TransactionType
  category?: string
  dateRange?: '7d' | '30d' | '3m' | '6m' | 'ytd' | 'all'
  search?: string
  page?: number
  pageSize?: number
}

// ─── Serializers ──────────────────────────────────────────────────────────────

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

export function serializeExpectedIncome(item: ExpectedIncome): SerializedExpectedIncome {
  return {
    ...item,
    amount: item.amount.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function serializeBudgetLimit(
  item: BudgetLimit & { spent: number }
): SerializedBudgetLimit {
  const budgeted = Number(item.amount)
  const pct = budgeted > 0 ? Math.round((item.spent / budgeted) * 100) : 0
  return {
    ...item,
    amount: item.amount.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    spent: item.spent,
    percentage: pct,
  }
}

export function serializeRecurringTemplate(
  item: RecurringTemplate & { account: Pick<Account, 'id' | 'name' | 'color' | 'currency'> }
): SerializedRecurringTemplate {
  return {
    ...item,
    amount: item.amount.toString(),
    nextDue: item.nextDue.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function serializeSavingsGoal(
  item: SavingsGoal & {
    account: Pick<Account, 'id' | 'name' | 'color' | 'currency' | 'balance'> | null
  }
): SerializedSavingsGoal {
  return {
    ...item,
    targetAmount: item.targetAmount.toString(),
    deadline: item.deadline ? item.deadline.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    currentAmount: item.account ? Number(item.account.balance) : 0,
    account: item.account
      ? {
          id: item.account.id,
          name: item.account.name,
          color: item.account.color,
          currency: item.account.currency,
        }
      : null,
  }
}

export function serializeCashEnvelope(
  item: CashEnvelope & {
    account: Pick<Account, 'id' | 'name' | 'color' | 'currency'>
    transactions: Array<Transaction & { account?: Pick<Account, 'id' | 'name' | 'color' | 'currency'> }>
  }
): SerializedCashEnvelope {
  const spent = item.transactions.reduce((s, t) => s + Number(t.amount), 0)
  const remaining = Number(item.totalAmount) - spent
  return {
    ...item,
    totalAmount: item.totalAmount.toString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    spent,
    remaining,
    transactions: item.transactions.map(serializeTransaction),
  }
}

export function serializeSplitMember(member: SplitMember): SerializedSplitMember {
  return {
    ...member,
    amount: member.amount.toString(),
    receivedAt: member.receivedAt ? member.receivedAt.toISOString() : null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  }
}

export function serializeSplit(
  item: Split & { members: SplitMember[] }
): SerializedSplit {
  const pendingAmount = item.members
    .filter(m => !m.received)
    .reduce((s, m) => s + Number(m.amount), 0)
  const receivedAmount = item.members
    .filter(m => m.received)
    .reduce((s, m) => s + Number(m.amount), 0)
  return {
    ...item,
    totalAmount: item.totalAmount.toString(),
    date: item.date.toISOString(),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    pendingAmount,
    receivedAmount,
    members: item.members.map(serializeSplitMember),
  }
}

export function serializeSplitGroupMember(m: SplitGroupMember): SerializedSplitGroupMember {
  return { ...m, createdAt: m.createdAt.toISOString() }
}

export function serializeSplitGroup(
  item: SplitGroup & { members: SplitGroupMember[] }
): SerializedSplitGroup {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    members: item.members.map(serializeSplitGroupMember),
  }
}
