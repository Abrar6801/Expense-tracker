export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { subDays, subMonths, startOfYear } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'

function buildDateFilter(dateRange?: string): Date | undefined {
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

function escapeCsv(value: string | null | undefined): string {
  if (!value) return ''
  // Prevent CSV formula injection (Excel/Sheets execute cells starting with = + - @ tab CR)
  let sanitized = value
  if (['+', '-', '=', '@', '\t', '\r'].includes(sanitized[0])) {
    sanitized = `'${sanitized}`
  }
  if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }
  return sanitized
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)

    // Validate accountId is a non-empty string (Prisma will reject invalid CUIDs safely)
    const accountIdParam = searchParams.get('accountId')
    const accountId = accountIdParam && /^[a-z0-9]+$/.test(accountIdParam) ? accountIdParam : undefined

    // Whitelist transaction types
    const typeParam = searchParams.get('type')
    const VALID_TYPES: string[] = ['EXPENSE', 'INCOME', 'TRANSFER']
    const type = typeParam && VALID_TYPES.includes(typeParam) ? (typeParam as TransactionType) : null

    // Limit category length
    const categoryParam = searchParams.get('category')
    const category = categoryParam ? categoryParam.slice(0, 50) : undefined

    const dateRange = searchParams.get('dateRange') ?? undefined

    // Limit search string length to prevent expensive queries
    const searchParam = searchParams.get('search')
    const search = searchParam ? searchParam.slice(0, 100) : undefined

    const dateFrom = buildDateFilter(dateRange)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        ...(accountId && { accountId }),
        ...(type && { type }),
        ...(category && { category }),
        ...(dateFrom && { date: { gte: dateFrom } }),
        ...(search && {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: { account: { select: { name: true, currency: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    const header = 'Date,Type,Amount,Currency,Category,Description,Account\n'
    const rows = transactions.map((t) => {
      const date = t.date.toISOString().split('T')[0]
      const amount = Number(t.amount).toFixed(2)
      return [
        date,
        t.type,
        amount,
        t.account.currency,
        escapeCsv(t.category),
        escapeCsv(t.description),
        escapeCsv(t.account.name),
      ].join(',')
    })

    const csv = header + rows.join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/transactions/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
