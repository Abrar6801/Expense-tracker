export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { startOfMonth, endOfMonth } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createBudgetLimitSchema } from '@/lib/validations'
import { serializeBudgetLimit } from '@/types'
import { TransactionType } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const now = new Date()
    const monthParam = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1))
    const yearParam = parseInt(searchParams.get('year') ?? String(now.getFullYear()))
    // Validate bounds to prevent unexpected behavior with extreme values
    const month = isNaN(monthParam) || monthParam < 1 || monthParam > 12 ? now.getMonth() + 1 : monthParam
    const year = isNaN(yearParam) || yearParam < 2000 || yearParam > 2100 ? now.getFullYear() : yearParam

    const periodStart = startOfMonth(new Date(year, month - 1, 1))
    const periodEnd = endOfMonth(new Date(year, month - 1, 1))

    const [budgets, spendingRows] = await Promise.all([
      prisma.budgetLimit.findMany({ where: { userId, month, year } }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: {
          userId,
          type: TransactionType.EXPENSE,
          date: { gte: periodStart, lte: periodEnd },
        },
        _sum: { amount: true },
      }),
    ])

    const spentByCategory: Record<string, number> = {}
    for (const row of spendingRows) {
      spentByCategory[row.category] = Number(row._sum.amount ?? 0)
    }

    const serialized = budgets.map((b) =>
      serializeBudgetLimit({ ...b, spent: spentByCategory[b.category] ?? 0 })
    )

    return NextResponse.json({ budgets: serialized, month, year })
  } catch (error) {
    console.error('[GET /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createBudgetLimitSchema.parse(body)

    const budget = await prisma.budgetLimit.upsert({
      where: {
        userId_category_month_year: {
          userId: session.user.id,
          category: data.category,
          month: data.month,
          year: data.year,
        },
      },
      create: { userId: session.user.id, ...data },
      update: { amount: data.amount },
    })

    return NextResponse.json({ budget: serializeBudgetLimit({ ...budget, spent: 0 }) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/budgets]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
