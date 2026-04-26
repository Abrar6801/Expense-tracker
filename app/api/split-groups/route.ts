export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createSplitGroupSchema } from '@/lib/validations'
import { serializeSplitGroup } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.splitGroup.findMany({
      where: { userId: session.user.id },
      include: { members: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ groups: groups.map(serializeSplitGroup) })
  } catch (error) {
    console.error('[GET /api/split-groups]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createSplitGroupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const group = await prisma.splitGroup.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        members: { create: parsed.data.members.map(name => ({ name })) },
      },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    })

    return NextResponse.json({ group: serializeSplitGroup(group) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split-groups]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
