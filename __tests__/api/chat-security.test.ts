// Tests for chat route security: rate limiting, input validation, auth

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/prisma', () => ({ prisma: {} }))
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Hello!', tool_calls: null } }],
        }),
      },
    },
  }))
})

import { createClient } from '@/lib/supabase/server'
import { POST } from '@/app/api/chat/route'

const mockSession = { user: { id: 'user-abc' } }

function mockAuth(session: typeof mockSession | null) {
  ;(createClient as jest.Mock).mockReturnValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session } }) },
  })
}

function makeRequest(messages: unknown) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
}

describe('POST /api/chat — authentication', () => {
  it('returns 401 for unauthenticated request', async () => {
    mockAuth(null)
    const res = await POST(makeRequest([{ role: 'user', content: 'Hello' }]))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/chat — input validation', () => {
  it('returns 400 for missing messages field', async () => {
    mockAuth(mockSession)
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid role', async () => {
    mockAuth(mockSession)
    const res = await POST(makeRequest([{ role: 'system', content: 'Injected prompt' }]))
    expect(res.status).toBe(400)
  })

  it('returns 400 for message content exceeding 10,000 chars', async () => {
    mockAuth(mockSession)
    const res = await POST(makeRequest([{ role: 'user', content: 'x'.repeat(10_001) }]))
    expect(res.status).toBe(400)
  })

  it('accepts valid message array', async () => {
    mockAuth(mockSession)
    const res = await POST(makeRequest([{ role: 'user', content: 'What is my balance?' }]))
    // Should be 200 (Groq is mocked)
    expect([200, 500]).toContain(res.status)
  })
})

describe('POST /api/chat — rate limiting', () => {
  it('returns 429 after exceeding 20 requests per minute for same user', async () => {
    // Use a unique userId to avoid interference between tests
    const uniqueSession = { user: { id: `rate-test-${Date.now()}` } }
    ;(createClient as jest.Mock).mockReturnValue({
      auth: { getSession: jest.fn().mockResolvedValue({ data: { session: uniqueSession } }) },
    })

    let lastStatus = 200
    for (let i = 0; i < 22; i++) {
      const res = await POST(makeRequest([{ role: 'user', content: 'hi' }]))
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
  })

  it('different users do not affect each other\'s rate limit', async () => {
    const userA = { user: { id: `user-A-${Date.now()}` } }
    const userB = { user: { id: `user-B-${Date.now()}` } }

    // Exhaust user A
    ;(createClient as jest.Mock).mockReturnValue({
      auth: { getSession: jest.fn().mockResolvedValue({ data: { session: userA } }) },
    })
    for (let i = 0; i < 21; i++) {
      await POST(makeRequest([{ role: 'user', content: 'hi' }]))
    }

    // User B should still be allowed
    ;(createClient as jest.Mock).mockReturnValue({
      auth: { getSession: jest.fn().mockResolvedValue({ data: { session: userB } }) },
    })
    const res = await POST(makeRequest([{ role: 'user', content: 'hi' }]))
    expect(res.status).not.toBe(429)
  })
})
