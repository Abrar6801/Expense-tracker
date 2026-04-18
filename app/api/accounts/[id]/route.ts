export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { updateAccountSchema } from '@/lib/validations'
import { serializeAccount } from '@/types'

type RouteParams = { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account: serializeAccount(account) })
  } catch (error) {
    console.error('[GET /api/accounts/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateAccountSchema.parse({ ...body, id: params.id })

    // Verify ownership before updating
    const existing = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const { id: _, ...updateData } = data

    const account = await prisma.account.update({
      where: { id: params.id },
      data: {
        ...updateData,
        lastFour: updateData.lastFour || null,
        color: updateData.color ?? undefined,
      },
    })

    return NextResponse.json({ account: serializeAccount(account) })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[PATCH /api/accounts/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership before deleting
    const existing = await prisma.account.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Cascade deletes transactions (configured in schema)
    await prisma.account.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/accounts/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
