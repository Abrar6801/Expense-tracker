export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { addGroupMemberSchema } from '@/lib/validations'
import { serializeSplitGroupMember } from '@/types'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.splitGroup.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const body = await req.json()
    const parsed = addGroupMemberSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.splitGroupMember.create({
      data: { groupId: params.id, name: parsed.data.name },
    })

    return NextResponse.json({ member: serializeSplitGroupMember(member) }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/split-groups/:id/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
