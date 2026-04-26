export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: Request,
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

    await prisma.splitGroup.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/split-groups/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
