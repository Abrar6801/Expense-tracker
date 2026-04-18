export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createAccountSchema } from '@/lib/validations'
import { serializeAccount } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ accounts: accounts.map(serializeAccount) })
  } catch (error) {
    console.error('[GET /api/accounts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAccountSchema.parse(body)

    const account = await prisma.account.create({
      data: {
        userId: session.user.id,
        name: data.name,
        type: data.type,
        balance: data.balance,
        currency: data.currency,
        color: data.color ?? null,
        lastFour: data.lastFour || null,
      },
    })

    return NextResponse.json({ account: serializeAccount(account) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('[POST /api/accounts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
