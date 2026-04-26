export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createGoalSchema } from '@/lib/validations'
import { serializeSavingsGoal } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      include: { account: { select: { id: true, name: true, color: true, currency: true, balance: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ goals: goals.map(serializeSavingsGoal) })
  } catch (error) {
    console.error('[GET /api/goals]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createGoalSchema.parse(body)

    if (data.accountId) {
      const account = await prisma.account.findFirst({
        where: { id: data.accountId, userId: session.user.id },
      })
      if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: session.user.id,
        name: data.name,
        targetAmount: data.targetAmount,
        accountId: data.accountId ?? null,
        deadline: data.deadline ?? null,
        color: data.color ?? null,
      },
      include: { account: { select: { id: true, name: true, color: true, currency: true, balance: true } } },
    })

    return NextResponse.json({ goal: serializeSavingsGoal(goal) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/goals]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
