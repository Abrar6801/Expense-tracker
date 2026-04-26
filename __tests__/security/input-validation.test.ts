// Tests for query parameter sanitization logic used in API routes

// ─── Month/year validation (from budgets route) ───────────────────────────────

function sanitizeMonthYear(monthStr: string | null, yearStr: string | null) {
  const now = new Date()
  const monthParam = parseInt(monthStr ?? String(now.getMonth() + 1))
  const yearParam = parseInt(yearStr ?? String(now.getFullYear()))
  const month = isNaN(monthParam) || monthParam < 1 || monthParam > 12
    ? now.getMonth() + 1
    : monthParam
  const year = isNaN(yearParam) || yearParam < 2000 || yearParam > 2100
    ? now.getFullYear()
    : yearParam
  return { month, year }
}

describe('Month/Year Query Param Sanitization', () => {
  it('accepts valid month and year', () => {
    const { month, year } = sanitizeMonthYear('6', '2024')
    expect(month).toBe(6)
    expect(year).toBe(2024)
  })

  it('rejects month 0, falls back to current', () => {
    const { month } = sanitizeMonthYear('0', '2024')
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })

  it('rejects month 13, falls back to current', () => {
    const { month } = sanitizeMonthYear('13', '2024')
    expect(month).toBeLessThanOrEqual(12)
  })

  it('rejects year below 2000, falls back to current', () => {
    const { year } = sanitizeMonthYear('6', '1999')
    expect(year).toBeGreaterThanOrEqual(2000)
  })

  it('rejects year above 2100, falls back to current', () => {
    const { year } = sanitizeMonthYear('6', '2101')
    expect(year).toBeLessThanOrEqual(2100)
  })

  it('handles NaN month string gracefully', () => {
    const { month } = sanitizeMonthYear('abc', '2024')
    expect(month).toBeGreaterThanOrEqual(1)
    expect(month).toBeLessThanOrEqual(12)
  })

  it('handles NaN year string gracefully', () => {
    const { year } = sanitizeMonthYear('6', 'notayear')
    const currentYear = new Date().getFullYear()
    expect(year).toBe(currentYear)
  })

  it('handles null params by using current date', () => {
    const { month, year } = sanitizeMonthYear(null, null)
    const now = new Date()
    expect(month).toBe(now.getMonth() + 1)
    expect(year).toBe(now.getFullYear())
  })

  it('accepts boundary year 2000', () => {
    const { year } = sanitizeMonthYear('1', '2000')
    expect(year).toBe(2000)
  })

  it('accepts boundary year 2100', () => {
    const { year } = sanitizeMonthYear('1', '2100')
    expect(year).toBe(2100)
  })
})

// ─── Transaction type whitelist (from export route) ───────────────────────────

function sanitizeTransactionType(typeParam: string | null): string | null {
  const VALID_TYPES = ['EXPENSE', 'INCOME', 'TRANSFER']
  return typeParam && VALID_TYPES.includes(typeParam) ? typeParam : null
}

describe('Transaction Type Whitelist', () => {
  it('accepts EXPENSE', () => {
    expect(sanitizeTransactionType('EXPENSE')).toBe('EXPENSE')
  })

  it('accepts INCOME', () => {
    expect(sanitizeTransactionType('INCOME')).toBe('INCOME')
  })

  it('accepts TRANSFER', () => {
    expect(sanitizeTransactionType('TRANSFER')).toBe('TRANSFER')
  })

  it('rejects lowercase expense', () => {
    expect(sanitizeTransactionType('expense')).toBeNull()
  })

  it('rejects arbitrary string', () => {
    expect(sanitizeTransactionType("'; DROP TABLE transactions;--")).toBeNull()
  })

  it('rejects empty string', () => {
    expect(sanitizeTransactionType('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(sanitizeTransactionType(null)).toBeNull()
  })
})

// ─── Search string length cap ──────────────────────────────────────────────────

function sanitizeSearch(raw: string | null): string | undefined {
  return raw ? raw.slice(0, 100) : undefined
}

describe('Search String Sanitization', () => {
  it('returns undefined for null', () => {
    expect(sanitizeSearch(null)).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(sanitizeSearch('')).toBeUndefined()
  })

  it('truncates search string to 100 chars', () => {
    const long = 'a'.repeat(200)
    expect(sanitizeSearch(long)!.length).toBe(100)
  })

  it('passes short search string unchanged', () => {
    expect(sanitizeSearch('groceries')).toBe('groceries')
  })
})
