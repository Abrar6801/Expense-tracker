jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    budgetLimit: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    transaction: { groupBy: jest.fn() },
  },
}))

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/budgets/route'

const mockSession = { user: { id: 'user-123' } }

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

describe('GET /api/budgets', () => {
  beforeEach(() => {
    ;(prisma.transaction.groupBy as jest.Mock).mockResolvedValue([])
  })

  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await GET(new Request('http://localhost/api/budgets'))
    expect(res.status).toBe(401)
  })

  it('returns budgets for current month by default', async () => {
    mockAuth(mockSession)
    ;(prisma.budgetLimit.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/budgets'))
    expect(res.status).toBe(200)
    const body = await res.json()
    const now = new Date()
    expect(body.month).toBe(now.getMonth() + 1)
    expect(body.year).toBe(now.getFullYear())
  })

  it('accepts valid month and year query params', async () => {
    mockAuth(mockSession)
    ;(prisma.budgetLimit.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/budgets?month=6&year=2024'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.month).toBe(6)
    expect(body.year).toBe(2024)
  })

  it('ignores out-of-range month param (falls back to current)', async () => {
    mockAuth(mockSession)
    ;(prisma.budgetLimit.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/budgets?month=99&year=2024'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.month).toBeGreaterThanOrEqual(1)
    expect(body.month).toBeLessThanOrEqual(12)
  })

  it('ignores extreme year param (falls back to current)', async () => {
    mockAuth(mockSession)
    ;(prisma.budgetLimit.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/budgets?month=1&year=9999'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.year).toBeLessThanOrEqual(2100)
  })
})

describe('POST /api/budgets', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST(new Request('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category: 'Dining', amount: 300, month: 6, year: 2024 }),
    }))
    expect(res.status).toBe(401)
  })

  it('creates or updates budget with valid data', async () => {
    mockAuth(mockSession)
    const budget = { id: 'bgt-1', userId: 'user-123', category: 'Dining', amount: '300', month: 6, year: 2024, createdAt: new Date(), updatedAt: new Date() }
    ;(prisma.budgetLimit.upsert as jest.Mock).mockResolvedValue(budget)

    const res = await POST(new Request('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category: 'Dining', amount: 300, month: 6, year: 2024 }),
    }))
    expect(res.status).toBe(201)
    expect(prisma.budgetLimit.upsert).toHaveBeenCalled()
  })

  it('returns 400 for invalid month', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category: 'Dining', amount: 300, month: 13, year: 2024 }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative amount', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category: 'Dining', amount: -100, month: 6, year: 2024 }),
    }))
    expect(res.status).toBe(400)
  })
})
