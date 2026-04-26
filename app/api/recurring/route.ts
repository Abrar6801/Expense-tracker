export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createRecurringSchema } from '@/lib/validations'
import { serializeRecurringTemplate } from '@/types'
import { TransactionType } from '@prisma/client'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const templates = await prisma.recurringTemplate.findMany({
      where: { userId: session.user.id, isActive: true },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
      orderBy: { nextDue: 'asc' },
    })

    return NextResponse.json({ templates: templates.map(serializeRecurringTemplate) })
  } catch (error) {
    console.error('[GET /api/recurring]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createRecurringSchema.parse(body)

    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const template = await prisma.recurringTemplate.create({
      data: {
        userId: session.user.id,
        accountId: data.accountId,
        type: data.type as TransactionType,
        amount: data.amount,
        category: data.category,
        description: data.description ?? null,
        interval: data.interval,
        nextDue: data.nextDue,
      },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
    })

    return NextResponse.json({ template: serializeRecurringTemplate(template) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/recurring]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
