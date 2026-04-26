export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'
import { FX_TO_USD } from '@/lib/constants'
import type { DashboardStats } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const [accounts, monthlyTransactions, lastMonthTransactions, pendingSplitMembers] = await prisma.$transaction([
      prisma.account.findMany({ where: { userId }, select: { balance: true, currency: true } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: monthStart, lte: monthEnd } },
        select: { type: true, amount: true, category: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
        select: { type: true, amount: true, category: true },
      }),
      prisma.splitMember.findMany({
        where: { received: false, split: { userId } },
        select: { amount: true },
      }),
    ])

    // Multi-currency net worth
    const netWorthByCurrency: Record<string, number> = {}
    for (const a of accounts) {
      netWorthByCurrency[a.currency] = (netWorthByCurrency[a.currency] ?? 0) + Number(a.balance)
    }
    const currencies = Object.keys(netWorthByCurrency)
    const hasMixedCurrencies = currencies.length > 1
    const netWorthUSD = currencies.reduce(
      (sum, cur) => sum + netWorthByCurrency[cur] * (FX_TO_USD[cur] ?? 1),
      0
    )
    const netWorth = hasMixedCurrencies ? netWorthUSD : (netWorthByCurrency[currencies[0]] ?? 0)

    // This month aggregates (REIMBURSEMENT excluded from income)
    let monthlyIncome = 0
    let monthlyExpenses = 0
    const categoryTotals: Record<string, number> = {}
    for (const t of monthlyTransactions) {
      const amt = Number(t.amount)
      if (t.type === TransactionType.INCOME) monthlyIncome += amt
      else if (t.type === TransactionType.EXPENSE) {
        monthlyExpenses += amt
        categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + amt
      }
    }

    // Last month aggregates (REIMBURSEMENT excluded from income)
    let lastMonthIncome = 0
    let lastMonthExpenses = 0
    const lastMonthCategoryTotals: Record<string, number> = {}
    for (const t of lastMonthTransactions) {
      const amt = Number(t.amount)
      if (t.type === TransactionType.INCOME) lastMonthIncome += amt
      else if (t.type === TransactionType.EXPENSE) {
        lastMonthExpenses += amt
        lastMonthCategoryTotals[t.category] = (lastMonthCategoryTotals[t.category] ?? 0) + amt
      }
    }

    const pendingFromFriends = pendingSplitMembers.reduce((s, m) => s + Number(m.amount), 0)

    // Spending by category with % change vs last month
    const spendingByCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => {
        const last = lastMonthCategoryTotals[category]
        const change = last ? Math.round(((total - last) / last) * 100) : null
        return {
          category,
          total,
          percentage: monthlyExpenses > 0 ? (total / monthlyExpenses) * 100 : 0,
          change,
        }
      })

    const stats: DashboardStats = {
      netWorth,
      netWorthByCurrency,
      netWorthUSD,
      hasMixedCurrencies,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      lastMonthIncome,
      lastMonthExpenses,
      spendingByCategory,
      pendingFromFriends,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
