export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { updateTransactionSchema } from '@/lib/validations'
import { serializeTransaction } from '@/types'
import { TransactionType } from '@prisma/client'

type RouteParams = { params: { id: string } }

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateTransactionSchema.parse({ ...body, id: params.id })

    // Get the existing transaction (also verifies ownership)
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Calculate the balance delta to apply:
    // oldEffect = what the old transaction did to the balance
    // newEffect = what the new transaction will do
    // delta = newEffect - oldEffect
    const oldEffect =
      existing.type === TransactionType.INCOME
        ? Number(existing.amount)
        : -Number(existing.amount)

    const newType = data.type ?? existing.type
    const newAmount = data.amount ?? Number(existing.amount)
    const newEffect =
      newType === TransactionType.INCOME ? newAmount : -newAmount

    const balanceDelta = newEffect - oldEffect
    const targetAccountId = data.accountId ?? existing.accountId

    const { id: _, ...updateData } = data

    // If account changed, we need to:
    // 1. Reverse the effect on the old account
    // 2. Apply the new effect on the new account
    if (targetAccountId !== existing.accountId) {
      // Verify the new account belongs to this user
      const newAccount = await prisma.account.findFirst({
        where: { id: targetAccountId, userId: session.user.id },
      })
      if (!newAccount) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 })
      }

      const [transaction] = await prisma.$transaction([
        prisma.transaction.update({
          where: { id: params.id },
          data: {
            ...updateData,
            description: updateData.description ?? null,
          },
          include: {
            account: { select: { id: true, name: true, color: true, currency: true } },
          },
        }),
        // Reverse effect on old account
        prisma.account.update({
          where: { id: existing.accountId },
          data: { balance: { increment: -oldEffect } },
        }),
        // Apply new effect on new account
        prisma.account.update({
          where: { id: targetAccountId },
          data: { balance: { increment: newEffect } },
        }),
      ])

      return NextResponse.json({ transaction: serializeTransaction(transaction) })
    }

    // Same account — just apply the delta
    const [transaction] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: params.id },
        data: {
          ...updateData,
          description: updateData.description ?? null,
        },
        include: {
          account: { select: { id: true, name: true, color: true, currency: true } },
        },
      }),
      prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
    ])

    return NextResponse.json({ transaction: serializeTransaction(transaction) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[PATCH /api/transactions/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // If this is a transfer, delete both sides atomically
    if (existing.type === TransactionType.TRANSFER && existing.transferPairId) {
      const pair = await prisma.transaction.findFirst({
        where: { transferPairId: existing.transferPairId, id: { not: existing.id }, userId: session.user.id },
      })

      const debitTx = existing.category === 'Transfer Out' ? existing : pair
      const creditTx = existing.category === 'Transfer In' ? existing : pair

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ops: any[] = [
        prisma.transaction.deleteMany({ where: { transferPairId: existing.transferPairId, userId: session.user.id } }),
      ]
      if (debitTx) ops.push(prisma.account.update({ where: { id: debitTx.accountId }, data: { balance: { increment: Number(debitTx.amount) } } }))
      if (creditTx) ops.push(prisma.account.update({ where: { id: creditTx.accountId }, data: { balance: { decrement: Number(creditTx.amount) } } }))

      await prisma.$transaction(ops)
      return NextResponse.json({ success: true })
    }

    // Reverse the balance effect atomically
    const reversal =
      existing.type === TransactionType.INCOME
        ? -Number(existing.amount)
        : Number(existing.amount)

    await prisma.$transaction([
      prisma.transaction.delete({ where: { id: params.id } }),
      prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reversal } },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/transactions/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
