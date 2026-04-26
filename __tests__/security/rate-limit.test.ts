// Tests for the in-memory rate limiting logic from the chat route

const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60_000

function createRateLimiter() {
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

  function checkRateLimit(userId: string, now = Date.now()): boolean {
    const entry = rateLimitMap.get(userId)
    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
      return true
    }
    if (entry.count >= RATE_LIMIT) return false
    entry.count++
    return true
  }

  function getCount(userId: string): number {
    return rateLimitMap.get(userId)?.count ?? 0
  }

  return { checkRateLimit, getCount }
}

describe('Rate Limiting', () => {
  it('allows first request', () => {
    const { checkRateLimit } = createRateLimiter()
    expect(checkRateLimit('user-1')).toBe(true)
  })

  it('allows up to RATE_LIMIT requests within window', () => {
    const { checkRateLimit } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < RATE_LIMIT; i++) {
      expect(checkRateLimit('user-1', now)).toBe(true)
    }
  })

  it('blocks the request after exceeding RATE_LIMIT', () => {
    const { checkRateLimit } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < RATE_LIMIT; i++) {
      checkRateLimit('user-1', now)
    }
    expect(checkRateLimit('user-1', now)).toBe(false)
  })

  it('allows requests again after window resets', () => {
    const { checkRateLimit } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < RATE_LIMIT; i++) {
      checkRateLimit('user-1', now)
    }
    // Simulate time passing beyond the window
    const afterReset = now + RATE_WINDOW_MS + 1
    expect(checkRateLimit('user-1', afterReset)).toBe(true)
  })

  it('tracks different users independently', () => {
    const { checkRateLimit } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < RATE_LIMIT; i++) {
      checkRateLimit('user-A', now)
    }
    // user-A is blocked
    expect(checkRateLimit('user-A', now)).toBe(false)
    // user-B is unaffected
    expect(checkRateLimit('user-B', now)).toBe(true)
  })

  it('increments count correctly', () => {
    const { checkRateLimit, getCount } = createRateLimiter()
    const now = Date.now()
    checkRateLimit('user-1', now)
    checkRateLimit('user-1', now)
    checkRateLimit('user-1', now)
    expect(getCount('user-1')).toBe(3)
  })

  it('resets count to 1 after window expiry', () => {
    const { checkRateLimit, getCount } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < 10; i++) checkRateLimit('user-1', now)
    const afterReset = now + RATE_WINDOW_MS + 1
    checkRateLimit('user-1', afterReset)
    expect(getCount('user-1')).toBe(1)
  })

  it('exactly at RATE_LIMIT is still allowed, one over is blocked', () => {
    const { checkRateLimit } = createRateLimiter()
    const now = Date.now()
    for (let i = 0; i < RATE_LIMIT - 1; i++) checkRateLimit('user-1', now)
    expect(checkRateLimit('user-1', now)).toBe(true)  // exactly at limit
    expect(checkRateLimit('user-1', now)).toBe(false) // over limit
  })
})
