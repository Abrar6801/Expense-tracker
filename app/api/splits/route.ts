export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createSplitSchema } from '@/lib/validations'
import { serializeSplit } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const splits = await prisma.split.findMany({
      where: { userId: session.user.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ splits: splits.map(serializeSplit) })
  } catch (error) {
    console.error('[GET /api/splits]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createSplitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { title, totalAmount, groupId, date, members } = parsed.data

    // If groupId provided, verify it belongs to this user
    if (groupId) {
      const group = await prisma.splitGroup.findFirst({ where: { id: groupId, userId: session.user.id } })
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const split = await prisma.split.create({
      data: {
        userId: session.user.id,
        title,
        totalAmount,
        groupId: groupId ?? null,
        date,
        members: { create: members.map(m => ({ name: m.name, amount: m.amount })) },
      },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json({ split: serializeSplit(split) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/splits]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
