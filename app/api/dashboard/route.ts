export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'
import type { DashboardStats } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [accounts, monthlyTransactions] = await prisma.$transaction([
      prisma.account.findMany({
        where: { userId },
        select: { balance: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { type: true, amount: true, category: true },
      }),
    ])

    // Net worth = sum of all account balances
    const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

    // Monthly aggregates
    let monthlyIncome = 0
    let monthlyExpenses = 0
    const categoryTotals: Record<string, number> = {}

    for (const t of monthlyTransactions) {
      const amount = Number(t.amount)
      if (t.type === TransactionType.INCOME) {
        monthlyIncome += amount
      } else {
        monthlyExpenses += amount
        categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + amount
      }
    }

    // Spending by category with percentages
    const spendingByCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, total]) => ({
        category,
        total,
        percentage: monthlyExpenses > 0 ? (total / monthlyExpenses) * 100 : 0,
      }))

    const stats: DashboardStats = {
      netWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      spendingByCategory,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
