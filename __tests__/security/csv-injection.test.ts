// Tests for CSV formula injection prevention (escapeCsv function logic)

function escapeCsv(value: string | null | undefined): string {
  if (!value) return ''
  let sanitized = value
  if (['+', '-', '=', '@', '\t', '\r'].includes(sanitized[0])) {
    sanitized = `'${sanitized}`
  }
  if (sanitized.includes(',') || sanitized.includes('"') || sanitized.includes('\n')) {
    return `"${sanitized.replace(/"/g, '""')}"`
  }
  return sanitized
}

describe('CSV Formula Injection Prevention', () => {
  describe('formula prefix sanitization', () => {
    it('neutralizes = prefix (Excel formula)', () => {
      const result = escapeCsv('=cmd|"/c calc"!A0')
      // Must not start with = (which would trigger Excel formula execution)
      expect(result).not.toMatch(/^=/)
      // The sanitized value starts with ' prefix before the =
      expect(result).toContain("'=")
    })

    it('neutralizes + prefix', () => {
      const result = escapeCsv('+1-2')
      expect(result).toMatch(/^'\+/)
    })

    it('neutralizes - prefix', () => {
      const result = escapeCsv('-1+2')
      expect(result).toMatch(/^'-/)
    })

    it('neutralizes @ prefix (DDE attack)', () => {
      const result = escapeCsv('@SUM(1+1)*cmd')
      expect(result).toMatch(/^'@/)
    })

    it('neutralizes tab prefix', () => {
      const result = escapeCsv('\t=malicious')
      expect(result).toMatch(/^'\t/)
    })

    it('neutralizes carriage return prefix', () => {
      const result = escapeCsv('\r=malicious')
      expect(result).toMatch(/^'\r/)
    })
  })

  describe('standard CSV escaping', () => {
    it('wraps value with commas in quotes', () => {
      const result = escapeCsv('Hello, World')
      expect(result).toBe('"Hello, World"')
    })

    it('escapes double quotes by doubling', () => {
      const result = escapeCsv('He said "hello"')
      expect(result).toBe('"He said ""hello"""')
    })

    it('wraps value with newline in quotes', () => {
      const result = escapeCsv('Line 1\nLine 2')
      expect(result).toBe('"Line 1\nLine 2"')
    })

    it('returns plain value unchanged when safe', () => {
      expect(escapeCsv('Regular transaction')).toBe('Regular transaction')
    })

    it('returns empty string for null', () => {
      expect(escapeCsv(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
      expect(escapeCsv(undefined)).toBe('')
    })

    it('returns empty string for empty string', () => {
      expect(escapeCsv('')).toBe('')
    })
  })

  describe('combined cases', () => {
    it('handles formula prefix AND comma in same value', () => {
      const result = escapeCsv('=SUM(A1,A2)')
      // Must not start with = and must contain the neutralized prefix
      expect(result).not.toMatch(/^=/)
      expect(result).toContain("'=")
    })

    it('handles normal numeric strings without modification', () => {
      expect(escapeCsv('1234.56')).toBe('1234.56')
    })

    it('handles transaction descriptions safely', () => {
      expect(escapeCsv('Lunch at Subway')).toBe('Lunch at Subway')
      expect(escapeCsv('Netflix subscription')).toBe('Netflix subscription')
    })
  })
})
