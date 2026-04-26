import { NextResponse } from 'next/server'

// Mock Supabase and Prisma before importing route
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/accounts/route'

const mockSession = { user: { id: 'user-123', email: 'test@test.com' } }

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

describe('GET /api/accounts', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    const req = new Request('http://localhost/api/accounts')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns accounts for authenticated user', async () => {
    mockAuth(mockSession)
    const mockAccounts = [
      { id: 'acc-1', name: 'Checking', type: 'CHECKING', balance: '1000', currency: 'USD', color: null, lastFour: null, createdAt: new Date(), updatedAt: new Date() },
    ]
    ;(prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts)

    const req = new Request('http://localhost/api/accounts')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.accounts).toHaveLength(1)
    expect(body.accounts[0].name).toBe('Checking')
  })

  it('queries only the current user\'s accounts', async () => {
    mockAuth(mockSession)
    ;(prisma.account.findMany as jest.Mock).mockResolvedValue([])

    const req = new Request('http://localhost/api/accounts')
    await GET(req)

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-123' }) })
    )
  })
})

describe('POST /api/accounts', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth(null)
    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Savings', type: 'SAVINGS', balance: 500, currency: 'USD' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates account with valid data', async () => {
    mockAuth(mockSession)
    const created = { id: 'cltest00000000000000000001', name: 'Cash Wallet', type: 'CASH', balance: '500', currency: 'USD', color: null, lastFour: null, createdAt: new Date(), updatedAt: new Date() }
    ;(prisma.account.create as jest.Mock).mockResolvedValue(created)

    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Cash Wallet', type: 'CASH', balance: 500, currency: 'USD' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.account.name).toBe('Cash Wallet')
  })

  it('returns 400 for invalid data', async () => {
    mockAuth(mockSession)
    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: '', type: 'INVALID', balance: 'not-a-number', currency: 'US' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('always uses session userId, never a body-supplied one', async () => {
    mockAuth(mockSession)
    ;(prisma.account.create as jest.Mock).mockResolvedValue({
      id: 'cltest00000000000000000001', name: 'Test', type: 'BANK', balance: '0', currency: 'USD', color: null, lastFour: null, createdAt: new Date(), updatedAt: new Date(),
    })

    const req = new Request('http://localhost/api/accounts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', type: 'BANK', balance: 0, currency: 'USD', userId: 'attacker-id' }),
    })
    await POST(req)

    expect(prisma.account.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-123' }) })
    )
  })
})
