export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'
import { serializeTransaction } from '@/types'

const transferSchema = z.object({
  fromAccountId: z.string().cuid(),
  toAccountId: z.string().cuid(),
  amount: z.number().positive().max(9_999_999),
  date: z.coerce.date().optional(),
  description: z.string().max(255).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = transferSchema.parse(body)

    if (data.fromAccountId === data.toAccountId) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 })
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: data.fromAccountId, userId: session.user.id } }),
      prisma.account.findFirst({ where: { id: data.toAccountId, userId: session.user.id } }),
    ])

    if (!fromAccount) return NextResponse.json({ error: 'Source account not found' }, { status: 404 })
    if (!toAccount) return NextResponse.json({ error: 'Destination account not found' }, { status: 404 })

    const transferPairId = randomUUID()
    const txDate = data.date ?? new Date()
    const userNote = data.description ? ` · ${data.description}` : ''

    const [debit] = await prisma.$transaction([
      // Debit from source account
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: data.fromAccountId,
          type: TransactionType.TRANSFER,
          amount: data.amount,
          category: 'Transfer Out',
          description: `To ${toAccount.name}${userNote}`,
          date: txDate,
          transferPairId,
        },
        include: { account: { select: { id: true, name: true, color: true, currency: true } } },
      }),
      // Credit to destination account
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: data.toAccountId,
          type: TransactionType.TRANSFER,
          amount: data.amount,
          category: 'Transfer In',
          description: `From ${fromAccount.name}${userNote}`,
          date: txDate,
          transferPairId,
        },
      }),
      // Update balances
      prisma.account.update({ where: { id: data.fromAccountId }, data: { balance: { decrement: data.amount } } }),
      prisma.account.update({ where: { id: data.toAccountId }, data: { balance: { increment: data.amount } } }),
    ])

    return NextResponse.json({ transaction: serializeTransaction(debit) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/transfers]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
