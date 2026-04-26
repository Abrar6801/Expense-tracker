// Tests for the open redirect validation logic used in auth callback and login

function isSafeRedirect(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//') && !url.includes(':')
}

function sanitizeRedirect(raw: string, fallback = '/dashboard'): string {
  return isSafeRedirect(raw) ? raw : fallback
}

describe('Open Redirect Protection', () => {
  describe('safe relative paths', () => {
    it('allows root path', () => {
      expect(isSafeRedirect('/')).toBe(true)
    })

    it('allows /dashboard', () => {
      expect(isSafeRedirect('/dashboard')).toBe(true)
    })

    it('allows /transactions?filter=30d', () => {
      expect(isSafeRedirect('/transactions?filter=30d')).toBe(true)
    })

    it('allows /accounts/123', () => {
      expect(isSafeRedirect('/accounts/123')).toBe(true)
    })
  })

  describe('rejects absolute URLs', () => {
    it('rejects https:// URL', () => {
      expect(isSafeRedirect('https://evil.com')).toBe(false)
    })

    it('rejects http:// URL', () => {
      expect(isSafeRedirect('http://evil.com')).toBe(false)
    })

    it('rejects //evil.com (protocol-relative)', () => {
      expect(isSafeRedirect('//evil.com')).toBe(false)
    })

    it('rejects javascript: URI', () => {
      expect(isSafeRedirect('javascript:alert(1)')).toBe(false)
    })

    it('rejects data: URI', () => {
      expect(isSafeRedirect('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('rejects URL with embedded colon (bypass attempt)', () => {
      expect(isSafeRedirect('/path:with:colons')).toBe(false)
    })
  })

  describe('sanitizeRedirect fallback', () => {
    it('returns the safe path when valid', () => {
      expect(sanitizeRedirect('/dashboard')).toBe('/dashboard')
    })

    it('returns fallback for external URL', () => {
      expect(sanitizeRedirect('https://evil.com')).toBe('/dashboard')
    })

    it('returns fallback for protocol-relative URL', () => {
      expect(sanitizeRedirect('//evil.com')).toBe('/dashboard')
    })

    it('uses custom fallback', () => {
      expect(sanitizeRedirect('https://evil.com', '/login')).toBe('/login')
    })

    it('returns fallback for empty string', () => {
      expect(sanitizeRedirect('', '/dashboard')).toBe('/dashboard')
    })
  })
})
