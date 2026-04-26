export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const budget = await prisma.budgetLimit.findFirst({
      where: { id: params.id, userId: session.user.id },
    })
    if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.budgetLimit.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/budgets/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
