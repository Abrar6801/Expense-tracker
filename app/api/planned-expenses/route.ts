export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { serializePlannedExpense } from '@/types'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive().max(9_999_999),
  category: z.string().min(1).max(50),
  accountId: z.string().cuid(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await prisma.plannedExpense.findMany({
      where: { userId: session.user.id },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items: items.map(serializePlannedExpense) })
  } catch (error) {
    console.error('[GET /api/planned-expenses]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createSchema.parse(body)

    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const item = await prisma.plannedExpense.create({
      data: { ...data, userId: session.user.id },
      include: { account: { select: { id: true, name: true, color: true, currency: true } } },
    })

    return NextResponse.json({ item: serializePlannedExpense(item) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/planned-expenses]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
