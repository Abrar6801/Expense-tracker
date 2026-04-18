import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { subDays, subMonths, startOfYear } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createTransactionSchema } from '@/lib/validations'
import { serializeTransaction } from '@/types'
import { TransactionType } from '@prisma/client'
import type { TransactionFilters } from '@/types'

function buildDateFilter(dateRange?: TransactionFilters['dateRange']): Date | undefined {
  const now = new Date()
  switch (dateRange) {
    case '7d':  return subDays(now, 7)
    case '30d': return subDays(now, 30)
    case '3m':  return subMonths(now, 3)
    case '6m':  return subMonths(now, 6)
    case 'ytd': return startOfYear(now)
    default:    return undefined
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId') ?? undefined
    const type = searchParams.get('type') as TransactionType | null
    const category = searchParams.get('category') ?? undefined
    const dateRange = (searchParams.get('dateRange') ?? 'all') as TransactionFilters['dateRange']
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))

    const dateFrom = buildDateFilter(dateRange)

    const where = {
      userId: session.user.id,
      ...(accountId && { accountId }),
      ...(type && { type }),
      ...(category && { category }),
      ...(dateFrom && { date: { gte: dateFrom } }),
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { id: true, name: true, color: true, currency: true } },
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({
      transactions: transactions.map(serializeTransaction),
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('[GET /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTransactionSchema.parse(body)

    // Verify account belongs to this user
    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Atomic: create transaction + update balance in one DB transaction
    const balanceDelta =
      data.type === TransactionType.INCOME ? data.amount : -data.amount

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: data.accountId,
          type: data.type,
          amount: data.amount,
          category: data.category,
          description: data.description ?? null,
          date: data.date,
        },
        include: {
          account: { select: { id: true, name: true, color: true, currency: true } },
        },
      }),
      prisma.account.update({
        where: { id: data.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
    ])

    return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[POST /api/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
