export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { serializeRecurringTemplate } from '@/types'
import { TransactionType } from '@prisma/client'

function nextDueDate(current: Date, interval: string): Date {
  switch (interval) {
    case 'weekly':    return addWeeks(current, 1)
    case 'biweekly':  return addWeeks(current, 2)
    case 'monthly':   return addMonths(current, 1)
    case 'yearly':    return addYears(current, 1)
    default:          return addMonths(current, 1)
  }
}

// PATCH with { action: 'post' } creates the transaction and advances nextDue
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const template = await prisma.recurringTemplate.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
    })
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const balanceDelta = template.type === TransactionType.INCOME
      ? Number(template.amount)
      : -Number(template.amount)

    const newNextDue = nextDueDate(template.nextDue, template.interval)

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: session.user.id,
          accountId: template.accountId,
          type: template.type,
          amount: template.amount,
          category: template.category,
          description: template.description,
          date: new Date(),
        },
      }),
      prisma.account.update({
        where: { id: template.accountId },
        data: { balance: { increment: balanceDelta } },
      }),
      prisma.recurringTemplate.update({
        where: { id: params.id },
        data: { nextDue: newNextDue },
      }),
    ])

    const updated = await prisma.recurringTemplate.findUnique({
      where: { id: params.id },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
    })

    return NextResponse.json({ template: serializeRecurringTemplate(updated!) })
  } catch (error) {
    console.error('[PATCH /api/recurring/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const template = await prisma.recurringTemplate.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.recurringTemplate.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/recurring/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
