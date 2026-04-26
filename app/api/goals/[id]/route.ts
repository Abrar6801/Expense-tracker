export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { updateGoalSchema } from '@/lib/validations'
import { serializeSavingsGoal } from '@/types'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const data = updateGoalSchema.parse({ ...body, id: params.id })

    const updated = await prisma.savingsGoal.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
        ...(data.accountId !== undefined && { accountId: data.accountId ?? null }),
        ...(data.deadline !== undefined && { deadline: data.deadline ?? null }),
        ...(data.color !== undefined && { color: data.color ?? null }),
      },
      include: { account: { select: { id: true, name: true, color: true, currency: true, balance: true } } },
    })

    return NextResponse.json({ goal: serializeSavingsGoal(updated) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[PATCH /api/goals/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.savingsGoal.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/goals/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
