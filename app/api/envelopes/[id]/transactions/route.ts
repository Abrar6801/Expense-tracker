export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createEnvelopeTransactionSchema } from '@/lib/validations'
import { serializeTransaction } from '@/types'
import { TransactionType } from '@prisma/client'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const envelope = await prisma.cashEnvelope.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!envelope) return NextResponse.json({ error: 'Envelope not found' }, { status: 404 })

    const account = await prisma.account.findFirst({
      where: { id: envelope.accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const body = await request.json()
    const data = createEnvelopeTransactionSchema.parse(body)

    // Create transaction linked to envelope + deduct from account — all atomic
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: envelope.accountId,
          type: TransactionType.EXPENSE,
          amount: data.amount,
          category: data.category,
          description: data.description ?? null,
          date: data.date,
          envelopeId: params.id,
        },
        include: { account: { select: { id: true, name: true, color: true, currency: true } } },
      }),
      prisma.account.update({
        where: { id: envelope.accountId },
        data: { balance: { decrement: data.amount } },
      }),
    ])

    return NextResponse.json({ transaction: serializeTransaction(transaction) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/envelopes/[id]/transactions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
