export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const group = await prisma.splitGroup.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    const member = await prisma.splitGroupMember.findFirst({
      where: { id: params.memberId, groupId: params.id },
    })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    await prisma.splitGroupMember.delete({ where: { id: params.memberId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/split-groups/:id/members/:memberId]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
