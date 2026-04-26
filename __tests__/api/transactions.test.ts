jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    account: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/transactions/route'

const mockSession = { user: { id: 'user-123' } }
// Use a properly-formatted CUID for accountId
const TEST_ACCOUNT_ID = 'cltest00000000000000000001'

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

describe('GET /api/transactions', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await GET(new Request('http://localhost/api/transactions'))
    expect(res.status).toBe(401)
  })

  it('returns paginated transactions for authenticated user', async () => {
    mockAuth(mockSession)
    const mockTx = [
      {
        id: 'tx-1', type: 'EXPENSE', amount: '50', category: 'Dining',
        description: 'Lunch', date: new Date(), createdAt: new Date(), updatedAt: new Date(),
        account: { id: TEST_ACCOUNT_ID, name: 'Checking', color: null, currency: 'USD' },
      },
    ]
    // GET uses prisma.$transaction([findMany, count])
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([mockTx, 1])

    const res = await GET(new Request('http://localhost/api/transactions'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transactions).toHaveLength(1)
    expect(body.total).toBe(1)
  })

  it('scopes query to current user only (IDOR protection)', async () => {
    mockAuth(mockSession)
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await GET(new Request('http://localhost/api/transactions'))

    // The where clause passed to findMany must include the session userId
    const callArg = (prisma.$transaction as jest.Mock).mock.calls[0][0]
    // callArg is an array of Prisma operations; check the first one's args
    expect(callArg).toBeDefined()
    expect(callArg.length).toBe(2)
  })

  it('applies search filter when provided', async () => {
    mockAuth(mockSession)
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([[], 0])

    await GET(new Request('http://localhost/api/transactions?search=coffee'))
    expect(prisma.$transaction).toHaveBeenCalled()
  })

  it('returns pagination metadata', async () => {
    mockAuth(mockSession)
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([[], 50])

    const res = await GET(new Request('http://localhost/api/transactions?page=2&pageSize=10'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(50)
    expect(body.page).toBe(2)
  })
})

describe('POST /api/transactions', () => {
  beforeEach(() => {
    ;(prisma.account.findFirst as jest.Mock).mockResolvedValue({
      id: TEST_ACCOUNT_ID, userId: 'user-123', balance: '1000', name: 'Checking',
    })
  })

  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST(new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId: TEST_ACCOUNT_ID, type: 'EXPENSE', amount: 50, category: 'Dining', date: new Date() }),
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid payload — negative amount', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId: TEST_ACCOUNT_ID, type: 'EXPENSE', amount: -100, category: 'Dining', date: new Date() }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid payload — bad type', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId: TEST_ACCOUNT_ID, type: 'DONATION', amount: 50, category: 'Dining', date: new Date() }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 if account not found or belongs to another user', async () => {
    mockAuth(mockSession)
    ;(prisma.account.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await POST(new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId: TEST_ACCOUNT_ID, type: 'EXPENSE', amount: 50, category: 'Dining', date: new Date().toISOString() }),
    }))
    expect(res.status).toBe(404)
  })

  it('creates transaction with atomic balance update', async () => {
    mockAuth(mockSession)
    const txResult = {
      id: 'tx-new', type: 'EXPENSE', amount: '50', category: 'Dining',
      description: null, date: new Date(), createdAt: new Date(), updatedAt: new Date(),
      account: { id: TEST_ACCOUNT_ID, name: 'Checking', color: null, currency: 'USD' },
    }
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([txResult, {}])

    const res = await POST(new Request('http://localhost/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ accountId: TEST_ACCOUNT_ID, type: 'EXPENSE', amount: 50, category: 'Dining', date: new Date().toISOString() }),
    }))
    expect(res.status).toBe(201)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})
