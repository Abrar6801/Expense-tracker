jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    savingsGoal: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    account: { findFirst: jest.fn() },
  },
}))

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/goals/route'

const mockSession = { user: { id: 'user-123' } }

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

const mockGoal = {
  id: 'goal-1', userId: 'user-123', name: 'Emergency Fund',
  targetAmount: '10000', color: '#6366f1', deadline: null,
  accountId: null, account: null, createdAt: new Date(), updatedAt: new Date(),
}

describe('GET /api/goals', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await GET(new Request('http://localhost/api/goals'))
    expect(res.status).toBe(401)
  })

  it('returns goals for authenticated user', async () => {
    mockAuth(mockSession)
    ;(prisma.savingsGoal.findMany as jest.Mock).mockResolvedValue([mockGoal])
    const res = await GET(new Request('http://localhost/api/goals'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.goals).toHaveLength(1)
    expect(body.goals[0].name).toBe('Emergency Fund')
  })

  it('scopes query to current user (IDOR protection)', async () => {
    mockAuth(mockSession)
    ;(prisma.savingsGoal.findMany as jest.Mock).mockResolvedValue([])
    await GET(new Request('http://localhost/api/goals'))
    expect(prisma.savingsGoal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }) })
    )
  })
})

describe('POST /api/goals', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Car', targetAmount: 5000 }),
    }))
    expect(res.status).toBe(401)
  })

  it('creates goal with valid data', async () => {
    mockAuth(mockSession)
    ;(prisma.savingsGoal.create as jest.Mock).mockResolvedValue(mockGoal)
    const res = await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Emergency Fund', targetAmount: 10000 }),
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.goal.name).toBe('Emergency Fund')
  })

  it('returns 400 for empty name', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: '', targetAmount: 5000 }),
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for negative target amount', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Car', targetAmount: -100 }),
    }))
    expect(res.status).toBe(400)
  })

  it('rejects invalid color value', async () => {
    mockAuth(mockSession)
    const res = await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Car', targetAmount: 5000, color: 'not-a-color' }),
    }))
    expect(res.status).toBe(400)
  })

  it('always uses session userId, never body-supplied', async () => {
    mockAuth(mockSession)
    ;(prisma.savingsGoal.create as jest.Mock).mockResolvedValue(mockGoal)
    await POST(new Request('http://localhost/api/goals', {
      method: 'POST',
      body: JSON.stringify({ name: 'Fund', targetAmount: 1000, userId: 'attacker-id' }),
    }))
    expect(prisma.savingsGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-123' }) })
    )
  })
})
