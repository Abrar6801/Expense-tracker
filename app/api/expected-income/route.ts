export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { serializeExpectedIncome } from '@/types'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive().max(9_999_999),
  type: z.enum(['INCOME_SOURCE', 'MONEY_OWED']),
  from: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const items = await prisma.expectedIncome.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ items: items.map(serializeExpectedIncome) })
  } catch (error) {
    console.error('[GET /api/expected-income]', error)
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

    const item = await prisma.expectedIncome.create({
      data: { ...data, userId: session.user.id },
    })

    return NextResponse.json({ item: serializeExpectedIncome(item) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/expected-income]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
