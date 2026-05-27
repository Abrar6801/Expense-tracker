export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { bulkCreateTransactionSchema } from '@/lib/validations'
import { serializeTransaction } from '@/types'
import { TransactionType } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { transactions } = bulkCreateTransactionSchema.parse(body)

    // Verify all referenced accounts belong to this user
    const accountIds = [...new Set(transactions.map((t) => t.accountId))]
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds }, userId: session.user.id },
    })
    if (accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'One or more accounts not found' }, { status: 404 })
    }

    // Aggregate balance deltas per account so we do one update per account
    const balanceDeltas: Record<string, number> = {}
    for (const t of transactions) {
      const delta = t.type === TransactionType.INCOME ? t.amount : -t.amount
      balanceDeltas[t.accountId] = (balanceDeltas[t.accountId] ?? 0) + delta
    }

    // All inserts + balance updates in a single atomic transaction
    const created = await prisma.$transaction(async (tx) => {
      const rows = await Promise.all(
        transactions.map((t) =>
          tx.transaction.create({
            data: {
              userId: session.user.id,
              accountId: t.accountId,
              type: t.type,
              amount: t.amount,
              category: t.category,
              description: t.description ?? null,
              date: t.date,
            },
            include: { account: { select: { id: true, name: true, color: true, currency: true } } },
          })
        )
      )

      await Promise.all(
        Object.entries(balanceDeltas).map(([accountId, delta]) =>
          tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: delta } },
          })
        )
      )

      return rows
    })

    return NextResponse.json(
      { transactions: created.map(serializeTransaction), count: created.length },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/transactions/bulk]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
