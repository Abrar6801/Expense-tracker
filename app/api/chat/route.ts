import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MAX_ITERATIONS = 8

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toStartOfDay(dateStr: string): Date {
  const d = new Date(dateStr)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function toEndOfDay(dateStr: string): Date {
  const d = new Date(dateStr)
  d.setUTCHours(23, 59, 59, 999)
  return d
}

function fmt(d: Date) {
  return d.toISOString().split('T')[0]
}

function buildDateContext() {
  const now = new Date()
  const today = fmt(now)

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekStart)
  lastWeekEnd.setDate(weekStart.getDate() - 1)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  const yearStart = new Date(now.getFullYear(), 0, 1)

  return {
    today,
    yesterday: fmt(yesterday),
    thisWeek: { from: fmt(weekStart), to: today },
    lastWeek: { from: fmt(lastWeekStart), to: fmt(lastWeekEnd) },
    thisMonth: { from: fmt(monthStart), to: fmt(monthEnd) },
    lastMonth: { from: fmt(lastMonthStart), to: fmt(lastMonthEnd) },
    thisYear: { from: fmt(yearStart), to: today },
  }
}

function buildSystemPrompt() {
  const d = buildDateContext()
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })

  return `You are an intelligent personal finance assistant. Today is ${d.today} (${dayName}).

PRE-COMPUTED DATE RANGES (use these exact values — do NOT calculate dates yourself):
- "today"        → dateFrom: "${d.today}"        dateTo: "${d.today}"
- "yesterday"    → dateFrom: "${d.yesterday}"    dateTo: "${d.yesterday}"
- "this week"    → dateFrom: "${d.thisWeek.from}"  dateTo: "${d.thisWeek.to}"
- "last week"    → dateFrom: "${d.lastWeek.from}"  dateTo: "${d.lastWeek.to}"
- "this month"   → dateFrom: "${d.thisMonth.from}" dateTo: "${d.thisMonth.to}"
- "last month"   → dateFrom: "${d.lastMonth.from}" dateTo: "${d.lastMonth.to}"
- "this year"    → dateFrom: "${d.thisYear.from}"  dateTo: "${d.thisYear.to}"
- Specific date like "April 15" → dateFrom: "${new Date().getFullYear()}-04-15" dateTo: "${new Date().getFullYear()}-04-15"

TOOL SELECTION GUIDE:
- "overview" / "how am I doing" / "summary" / "net worth" → get_financial_overview (one call, most efficient)
- "how much did I spend on/in X" / "total spending" → get_spending_summary with type=EXPENSE (transfers excluded automatically)
- "how much did I earn/make on/in X" / "total income" → get_spending_summary with type=INCOME (transfers excluded automatically)
- "show my transactions" / "what did I buy" / "when did I spend on X" → query_transactions (for listing only, NOT for totals)
- "add expense/income" / "I spent X" / "I earned X" → get_accounts first, then create_transaction
- "transfer X from A to B" / "move money between accounts" → get_accounts first, then create_transfer
- "can I afford X" → get_financial_overview to check balances

CATEGORY INFERENCE (auto-detect, never ask):
food/coffee/restaurant/lunch/dinner/breakfast/cafe/bar → Dining
uber/lyft/taxi/bus/train/metro/petrol/fuel/gas/parking → Transport
supermarket/grocery/costco/walmart/whole foods/market → Groceries
amazon/clothes/mall/fashion/shoes/electronics/gadget → Shopping
rent/mortgage/electricity/water/internet/gas bill/utility → Housing
gym/doctor/hospital/pharmacy/medicine/health/dentist → Health
netflix/spotify/apple/subscription/streaming/software → Subscriptions
salary/paycheck/wage/payroll → Salary
freelance/contract/client/consulting/side hustle → Freelance
interest/dividend/investment return → Interest
hotel/flight/airbnb/vacation/travel → Travel
Other → Other

RULES:
1. For create_transaction: ALWAYS call get_accounts first to get the account ID
2. If user has multiple accounts and doesn't specify, ask which one BEFORE calling get_accounts
3. Default date is "${d.today}" unless user specifies
4. CRITICAL — TRANSFERS ARE NOT INCOME OR EXPENSES: Moving money between accounts is NOT spending and NOT earning. NEVER count transfer amounts in spend/earn totals. get_spending_summary automatically excludes transfers. query_transactions also excludes transfers but must NOT be used to compute totals.
5. For ANY "how much did I spend" question → ALWAYS use get_spending_summary with type=EXPENSE
6. For ANY "how much did I earn/make" question → ALWAYS use get_spending_summary with type=INCOME
7. NEVER sum up amounts from query_transactions to answer spend/earn total questions — use get_spending_summary instead
8. Never make up transaction data — only report what's in the database
9. If no data found for a query, say so clearly and suggest a broader date range

RESPONSE STYLE:
- Be conversational, precise, and helpful
- Use bullet points for lists, bold for totals
- For spending queries always show: total → by account → by category
- For transaction lists: show date, description/category, amount, account
- For "can I afford X": state the relevant account balance and give a clear recommendation
- Add a brief insight when relevant (e.g. "That's your highest spending category this month")
- Keep responses concise — no unnecessary filler`
}

// ─── Tool execution ────────────────────────────────────────────────────────────

type ToolInput = Record<string, unknown>

async function executeTool(name: string, input: ToolInput, userId: string) {
  switch (name) {

    case 'get_accounts': {
      const accounts = await prisma.account.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      })
      return accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        currency: a.currency,
      }))
    }

    case 'get_financial_overview': {
      const d = buildDateContext()
      const [accounts, currentTx, lastTx] = await Promise.all([
        prisma.account.findMany({ where: { userId } }),
        prisma.transaction.findMany({
          where: { userId, date: { gte: toStartOfDay(d.thisMonth.from), lte: toEndOfDay(d.thisMonth.to) } },
          include: { account: { select: { name: true } } },
        }),
        prisma.transaction.findMany({
          where: { userId, date: { gte: toStartOfDay(d.lastMonth.from), lte: toEndOfDay(d.lastMonth.to) } },
          select: { type: true, amount: true },
        }),
      ])

      const netWorth = accounts.reduce((s, a) => s + Number(a.balance), 0)

      let currentIncome = 0, currentExpenses = 0, currentTransfers = 0
      const categoryTotals: Record<string, number> = {}
      for (const t of currentTx) {
        const amt = Number(t.amount)
        if (t.type === TransactionType.INCOME) currentIncome += amt
        else if (t.type === TransactionType.EXPENSE) { currentExpenses += amt; categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + amt }
        else if (t.type === TransactionType.TRANSFER && t.category === 'Transfer Out') currentTransfers += amt
      }

      let lastIncome = 0, lastExpenses = 0
      for (const t of lastTx) {
        if (t.type === TransactionType.INCOME) lastIncome += Number(t.amount)
        else if (t.type === TransactionType.EXPENSE) lastExpenses += Number(t.amount)
      }

      const topCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, total]) => ({ category, total }))

      return {
        netWorth,
        accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: Number(a.balance), currency: a.currency })),
        thisMonth: {
          income: currentIncome,
          expenses: currentExpenses,
          net: currentIncome - currentExpenses,
          transfers: currentTransfers,
          topCategories,
        },
        lastMonth: {
          income: lastIncome,
          expenses: lastExpenses,
          net: lastIncome - lastExpenses,
        },
        vsLastMonth: {
          expenseChange: lastExpenses > 0 ? Math.round(((currentExpenses - lastExpenses) / lastExpenses) * 100) : null,
          incomeChange: lastIncome > 0 ? Math.round(((currentIncome - lastIncome) / lastIncome) * 100) : null,
        },
      }
    }

    case 'create_transfer': {
      const { fromAccountId, toAccountId, amount, date, description } = input as {
        fromAccountId: string; toAccountId: string; amount: number; date?: string; description?: string
      }
      const [fromAccount, toAccount] = await Promise.all([
        prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
        prisma.account.findFirst({ where: { id: toAccountId, userId } }),
      ])
      if (!fromAccount) return { error: 'Source account not found' }
      if (!toAccount) return { error: 'Destination account not found' }
      if (fromAccountId === toAccountId) return { error: 'Cannot transfer to the same account' }

      const { randomUUID } = await import('crypto')
      const transferPairId = randomUUID()
      const txDate = date ? new Date(date) : new Date()

      await prisma.$transaction([
        prisma.transaction.create({ data: { userId, accountId: fromAccountId, type: TransactionType.TRANSFER, amount, category: 'Transfer Out', description: `To ${toAccount.name}${description ? ` · ${description}` : ''}`, date: txDate, transferPairId } }),
        prisma.transaction.create({ data: { userId, accountId: toAccountId, type: TransactionType.TRANSFER, amount, category: 'Transfer In', description: `From ${fromAccount.name}${description ? ` · ${description}` : ''}`, date: txDate, transferPairId } }),
        prisma.account.update({ where: { id: fromAccountId }, data: { balance: { decrement: amount } } }),
        prisma.account.update({ where: { id: toAccountId }, data: { balance: { increment: amount } } }),
      ])

      return {
        success: true,
        from: fromAccount.name,
        to: toAccount.name,
        amount,
        newFromBalance: Number(fromAccount.balance) - amount,
        newToBalance: Number(toAccount.balance) + amount,
      }
    }

    case 'create_transaction': {
      const { accountId, type, amount, category, description, date } = input as {
        accountId: string; type: 'EXPENSE' | 'INCOME'; amount: number
        category: string; description?: string; date?: string
      }

      const account = await prisma.account.findFirst({ where: { id: accountId, userId } })
      if (!account) return { error: 'Account not found' }

      const txDate = date ? new Date(date) : new Date()
      const balanceDelta = type === 'INCOME' ? amount : -amount

      const [transaction] = await prisma.$transaction([
        prisma.transaction.create({
          data: { userId, accountId, type: type as TransactionType, amount, category, description: description ?? null, date: txDate },
        }),
        prisma.account.update({ where: { id: accountId }, data: { balance: { increment: balanceDelta } } }),
      ])

      const newBalance = Number(account.balance) + balanceDelta
      return {
        success: true,
        transaction: {
          type: transaction.type,
          amount: Number(transaction.amount),
          category: transaction.category,
          description: transaction.description,
          date: transaction.date.toISOString().split('T')[0],
          accountName: account.name,
          newAccountBalance: newBalance,
        },
      }
    }

    case 'query_transactions': {
      const { accountId, type, category, dateFrom, dateTo, limit = 20 } = input as {
        accountId?: string; type?: 'EXPENSE' | 'INCOME'; category?: string
        dateFrom?: string; dateTo?: string; limit?: number
      }

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          ...(accountId && { accountId }),
          // Always exclude TRANSFER unless a specific type is requested
          type: type ? (type as TransactionType) : { not: TransactionType.TRANSFER },
          ...(category && { category: { contains: category, mode: 'insensitive' } }),
          ...((dateFrom || dateTo) && {
            date: {
              ...(dateFrom && { gte: toStartOfDay(dateFrom) }),
              ...(dateTo && { lte: toEndOfDay(dateTo) }),
            },
          }),
        },
        include: { account: { select: { name: true, currency: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(Number(limit), 50),
      })

      if (transactions.length === 0) return { found: 0, transactions: [] }

      return {
        found: transactions.length,
        transactions: transactions.map(t => ({
          type: t.type,
          amount: Number(t.amount),
          category: t.category,
          description: t.description,
          date: t.date.toISOString().split('T')[0],
          account: t.account.name,
          currency: t.account.currency,
        })),
      }
    }

    case 'get_spending_summary': {
      const { dateFrom, dateTo, accountId, type = 'EXPENSE' } = input as {
        dateFrom?: string; dateTo?: string; accountId?: string; type?: 'EXPENSE' | 'INCOME'
      }

      const txType = type === 'INCOME' ? TransactionType.INCOME : TransactionType.EXPENSE

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: txType,
          ...(accountId && { accountId }),
          ...((dateFrom || dateTo) && {
            date: {
              ...(dateFrom && { gte: toStartOfDay(dateFrom) }),
              ...(dateTo && { lte: toEndOfDay(dateTo) }),
            },
          }),
        },
        include: { account: { select: { name: true, currency: true } } },
      })

      const isIncome = txType === TransactionType.INCOME

      if (transactions.length === 0) {
        return isIncome
          ? { found: 0, totalIncome: 0, byCategory: [], byAccount: [] }
          : { found: 0, totalExpenses: 0, byCategory: [], byAccount: [] }
      }

      const byCategory: Record<string, number> = {}
      const byAccount: Record<string, { name: string; total: number; currency: string }> = {}
      let grandTotal = 0

      for (const t of transactions) {
        const amt = Number(t.amount)
        byCategory[t.category] = (byCategory[t.category] ?? 0) + amt
        if (!byAccount[t.accountId]) {
          byAccount[t.accountId] = { name: t.account.name, total: 0, currency: t.account.currency }
        }
        byAccount[t.accountId].total += amt
        grandTotal += amt
      }

      return {
        found: transactions.length,
        ...(isIncome ? { totalIncome: grandTotal } : { totalExpenses: grandTotal }),
        byCategory: Object.entries(byCategory)
          .sort(([, a], [, b]) => b - a)
          .map(([category, total]) => ({
            category, total,
            percentage: Math.round((total / grandTotal) * 100),
          })),
        byAccount: Object.values(byAccount).sort((a, b) => b.total - a.total),
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ─── Tool definitions ──────────────────────────────────────────────────────────

const tools: Groq.Chat.CompletionCreateParams.Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_accounts',
      description: 'Get all accounts with IDs and balances. Required before create_transaction.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_overview',
      description: 'Get a complete financial snapshot: net worth, all account balances, this month vs last month income/expenses/net, and top spending categories. Use for general questions like "how am I doing", "give me a summary", "what is my net worth".',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_transfer',
      description: 'Transfer money between two of the user\'s accounts. Both sides are tagged as TRANSFER and excluded from income/expense reports.',
      parameters: {
        type: 'object',
        properties: {
          fromAccountId: { type: 'string', description: 'Source account ID (money leaves here)' },
          toAccountId: { type: 'string', description: 'Destination account ID (money arrives here)' },
          amount: { type: 'number', description: 'Positive amount to transfer' },
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
          description: { type: 'string', description: 'Optional note' },
        },
        required: ['fromAccountId', 'toAccountId', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_transaction',
      description: 'Add a new expense or income transaction. Must call get_accounts first.',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string', description: 'Account ID from get_accounts' },
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
          amount: { type: 'number', description: 'Positive number' },
          category: { type: 'string', description: 'Dining, Transport, Groceries, Shopping, Housing, Health, Entertainment, Salary, Freelance, Subscriptions, Travel, Utilities, Savings, Interest, Other' },
          description: { type: 'string', description: 'Short note e.g. "Lunch at Subway"' },
          date: { type: 'string', description: 'YYYY-MM-DD, defaults to today' },
        },
        required: ['accountId', 'type', 'amount', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_transactions',
      description: 'List individual transactions for browsing or details only. NEVER use this to compute totals or answer "how much did I spend/earn" — use get_spending_summary for that. Transfers are automatically excluded. Use for: "show my transactions", "what did I buy", "when did I spend on X".',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
          category: { type: 'string', description: 'Partial match on category name' },
          dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
          dateTo: { type: 'string', description: 'YYYY-MM-DD' },
          limit: { type: 'number', description: 'Max results, default 20' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_spending_summary',
      description: 'Get totals aggregated by category and account for a date range. Transfers are NEVER included. Use for "how much did I spend" (type=EXPENSE) or "how much did I earn" (type=INCOME). Never use for transfer amounts.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['EXPENSE', 'INCOME'], description: 'EXPENSE for spending queries, INCOME for earnings queries. Defaults to EXPENSE.' },
          dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
          dateTo: { type: 'string', description: 'YYYY-MM-DD' },
          accountId: { type: 'string', description: 'Optional: filter by account' },
        },
        required: [],
      },
    },
  },
]

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages } = (await request.json()) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: buildSystemPrompt() },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ]

    let dataChanged = false
    let iterations = 0

    while (iterations < MAX_ITERATIONS) {
      iterations++

      const response = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.1,
        messages: groqMessages,
        tools,
        tool_choice: 'auto',
      })

      const message = response.choices[0].message

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({ message: message.content ?? '', dataChanged })
      }

      groqMessages.push(message)

      for (const toolCall of message.tool_calls) {
        let input: ToolInput = {}
        try { input = JSON.parse(toolCall.function.arguments) as ToolInput } catch { input = {} }

        const result = await executeTool(toolCall.function.name, input, session.user.id)
        if (['create_transaction', 'create_transfer'].includes(toolCall.function.name)) dataChanged = true

        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }
    }

    return NextResponse.json({ message: 'Request took too long. Please try again.', dataChanged: false })
  } catch (error) {
    console.error('[POST /api/chat]', error)
    const msg = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
