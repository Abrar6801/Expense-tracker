export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'
import type { TrendPoint } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const now = new Date()

    // Build 6-month windows (oldest first)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return {
        label: format(d, 'MMM'),
        start: startOfMonth(d),
        end: endOfMonth(d),
      }
    })

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] },
        date: { gte: months[0].start, lte: months[months.length - 1].end },
      },
      select: { type: true, amount: true, date: true },
    })

    const totals: Record<string, { income: number; expenses: number }> = {}
    for (const m of months) totals[m.label] = { income: 0, expenses: 0 }

    for (const t of transactions) {
      const label = format(t.date, 'MMM')
      if (!totals[label]) continue
      const amt = Number(t.amount)
      if (t.type === TransactionType.INCOME) totals[label].income += amt
      else totals[label].expenses += amt
    }

    const trends: TrendPoint[] = months.map(({ label }) => ({
      month: label,
      income: totals[label].income,
      expenses: totals[label].expenses,
      net: totals[label].income - totals[label].expenses,
    }))

    return NextResponse.json({ trends })
  } catch (error) {
    console.error('[GET /api/dashboard/trends]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
