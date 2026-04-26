export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { TransactionType } from '@prisma/client'
import { markReceivedSchema } from '@/lib/validations'
import { serializeSplitMember } from '@/types'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = markReceivedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { accountId } = parsed.data

    // Verify split belongs to user
    const split = await prisma.split.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!split) return NextResponse.json({ error: 'Split not found' }, { status: 404 })

    // Verify account belongs to user
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const member = await prisma.splitMember.findFirst({
      where: { id: params.memberId, splitId: params.id },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (member.received) return NextResponse.json({ error: 'Already marked received' }, { status: 409 })

    const now = new Date()

    // Atomically: create REIMBURSEMENT tx + increment balance + mark member received
    const [tx, updatedMember] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId,
          type: TransactionType.REIMBURSEMENT,
          amount: member.amount,
          category: 'Reimbursement',
          description: `${member.name} — ${split.title}`,
          date: now,
        },
      }),
      prisma.splitMember.update({
        where: { id: params.memberId },
        data: { received: true, receivedAt: now, accountId },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: member.amount } },
      }),
    ])

    await prisma.splitMember.update({
      where: { id: params.memberId },
      data: { transactionId: tx.id },
    })

    return NextResponse.json({ member: serializeSplitMember({ ...updatedMember, transactionId: tx.id }) })
  } catch (error) {
    console.error('[PATCH /api/splits/:id/members/:memberId]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
