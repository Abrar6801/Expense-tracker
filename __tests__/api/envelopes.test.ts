jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    cashEnvelope: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    account: { findFirst: jest.fn(), update: jest.fn() },
    transaction: { create: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/envelopes/route'
import { POST as POST_TX } from '@/app/api/envelopes/[id]/transactions/route'

const mockSession = { user: { id: 'user-123' } }
const TEST_ACCOUNT_ID = 'cltest00000000000000000001'
const TEST_ENVELOPE_ID = 'cltest00000000000000000002'

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

const mockAccount = { id: TEST_ACCOUNT_ID, name: 'Checking', color: null, currency: 'USD' }

describe('GET /api/envelopes', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await GET(new Request('http://localhost/api/envelopes'))
    expect(res.status).toBe(401)
  })

  it('returns envelopes for authenticated user', async () => {
    mockAuth(mockSession)
    ;(prisma.cashEnvelope.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/envelopes'))
    expect(res.status).toBe(200)
  })

  it('only fetches envelopes belonging to the current user', async () => {
    mockAuth(mockSession)
    ;(prisma.cashEnvelope.findMany as jest.Mock).mockResolvedValue([])
    await GET(new Request('http://localhost/api/envelopes'))
    expect(prisma.cashEnvelope.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }) })
    )
  })
})

describe('POST /api/envelopes', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST(new Request('http://localhost/api/envelopes', {
      method: 'POST',
      body: JSON.stringify({ name: 'Groceries', totalAmount: 400, accountId: TEST_ACCOUNT_ID }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing required fields', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/envelopes', {
      method: 'POST',
      body: JSON.stringify({ name: '', totalAmount: -1 }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when account not found or belongs to another user', async () => {
    mockAuth(mockSession)
    ;(prisma.account.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await POST(new Request('http://localhost/api/envelopes', {
      method: 'POST',
      body: JSON.stringify({ name: 'Groceries', totalAmount: 400, accountId: TEST_ACCOUNT_ID }),
    }))
    expect(res.status).toBe(404)
  })

  it('creates envelope with valid data', async () => {
    mockAuth(mockSession)
    ;(prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: TEST_ACCOUNT_ID, userId: 'user-123' })
    const envelope = {
      id: TEST_ENVELOPE_ID, userId: 'user-123', name: 'Groceries', totalAmount: '400',
      accountId: TEST_ACCOUNT_ID, account: mockAccount, transactions: [],
      createdAt: new Date(), updatedAt: new Date(),
    }
    ;(prisma.cashEnvelope.create as jest.Mock).mockResolvedValue(envelope)

    const res = await POST(new Request('http://localhost/api/envelopes', {
      method: 'POST',
      body: JSON.stringify({ name: 'Groceries', totalAmount: 400, accountId: TEST_ACCOUNT_ID }),
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.envelope.name).toBe('Groceries')
  })
})

describe('POST /api/envelopes/:id/transactions', () => {
  const mockParams = { params: { id: TEST_ENVELOPE_ID } }

  beforeEach(() => {
    ;(prisma.cashEnvelope.findFirst as jest.Mock).mockResolvedValue({
      id: TEST_ENVELOPE_ID, userId: 'user-123', accountId: TEST_ACCOUNT_ID, name: 'Groceries',
    })
    ;(prisma.account.findFirst as jest.Mock).mockResolvedValue({
      id: TEST_ACCOUNT_ID, userId: 'user-123', balance: '500', name: 'Checking',
    })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST_TX(
      new Request('http://localhost/api/envelopes/env-1/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: 25, category: 'Groceries', date: new Date() }),
      }),
      mockParams
    )
    expect(res.status).toBe(401)
  })

  it('returns 404 if envelope not found or belongs to another user', async () => {
    mockAuth(mockSession)
    ;(prisma.cashEnvelope.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await POST_TX(
      new Request('http://localhost/api/envelopes/env-999/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: 25, category: 'Groceries', date: new Date() }),
      }),
      { params: { id: 'env-999' } }
    )
    expect(res.status).toBe(404)
  })

  it('creates transaction and decrements account balance atomically', async () => {
    mockAuth(mockSession)
    const txResult = {
      id: 'tx-new', type: 'EXPENSE', amount: '25', category: 'Groceries',
      description: null, date: new Date(), createdAt: new Date(), updatedAt: new Date(),
      account: { id: TEST_ACCOUNT_ID, name: 'Checking', color: null, currency: 'USD' },
    }
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([txResult, {}])

    const res = await POST_TX(
      new Request('http://localhost/api/envelopes/env-1/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: 25, category: 'Groceries', date: new Date().toISOString() }),
      }),
      mockParams
    )
    expect(res.status).toBe(201)
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('returns 400 for invalid transaction data — negative amount', async () => {
    mockAuth(mockSession)
    const res = await POST_TX(
      new Request('http://localhost/api/envelopes/env-1/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: -50, category: 'Groceries', date: new Date() }),
      }),
      mockParams
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing category', async () => {
    mockAuth(mockSession)
    const res = await POST_TX(
      new Request('http://localhost/api/envelopes/env-1/transactions', {
        method: 'POST',
        body: JSON.stringify({ amount: 25, category: '', date: new Date() }),
      }),
      mockParams
    )
    expect(res.status).toBe(400)
  })
})
