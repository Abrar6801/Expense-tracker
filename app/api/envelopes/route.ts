export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { createEnvelopeSchema } from '@/lib/validations'
import { serializeCashEnvelope } from '@/types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const envelopes = await prisma.cashEnvelope.findMany({
      where: { userId: session.user.id },
      include: {
        account: { select: { id: true, name: true, color: true, currency: true } },
        transactions: {
          include: { account: { select: { id: true, name: true, color: true, currency: true } } },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ envelopes: envelopes.map(serializeCashEnvelope) })
  } catch (error) {
    console.error('[GET /api/envelopes]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const data = createEnvelopeSchema.parse(body)

    const account = await prisma.account.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const envelope = await prisma.cashEnvelope.create({
      data: {
        userId: session.user.id,
        name: data.name,
        totalAmount: data.totalAmount,
        accountId: data.accountId,
      },
      include: {
        account: { select: { id: true, name: true, color: true, currency: true } },
        transactions: {
          include: { account: { select: { id: true, name: true, color: true, currency: true } } },
        },
      },
    })

    return NextResponse.json({ envelope: serializeCashEnvelope(envelope) }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('[POST /api/envelopes]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
