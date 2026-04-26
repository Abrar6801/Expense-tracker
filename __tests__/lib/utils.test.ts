import { formatCurrency, formatDate, formatDateShort, getInitials, cn } from '@/lib/utils'

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts without sign by default', () => {
    expect(formatCurrency(-500)).toBe('-$500.00')
  })

  it('formats negative amounts with showSign', () => {
    expect(formatCurrency(-500, 'USD', true)).toBe('-$500.00')
  })

  it('formats positive amounts with showSign prefix', () => {
    expect(formatCurrency(500, 'USD', true)).toBe('+$500.00')
  })

  it('formats string input', () => {
    expect(formatCurrency('250.00')).toBe('$250.00')
  })

  it('formats EUR', () => {
    const result = formatCurrency(100, 'EUR')
    expect(result).toContain('100.00')
  })

  it('always shows 2 decimal places', () => {
    expect(formatCurrency(100)).toBe('$100.00')
    expect(formatCurrency(100.1)).toBe('$100.10')
  })

  it('handles large numbers with comma separators', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
  })

  it('showSign does not add prefix to zero', () => {
    expect(formatCurrency(0, 'USD', true)).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date('2024-03-15T00:00:00.000Z')
    const result = formatDate(date)
    expect(result).toMatch(/Mar/)
    expect(result).toMatch(/2024/)
  })

  it('formats a date string', () => {
    // Use noon UTC to avoid timezone-crossing when parsed as local time
    const result = formatDate(new Date('2024-01-15T12:00:00.000Z'))
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })

  it('returns a non-empty string', () => {
    expect(formatDate(new Date())).toBeTruthy()
  })
})

describe('formatDateShort', () => {
  it('excludes year from output', () => {
    const result = formatDateShort(new Date('2024-06-15T12:00:00.000Z'))
    expect(result).toMatch(/Jun/)
    expect(result).not.toMatch(/2024/)
  })

  it('includes month abbreviation', () => {
    const result = formatDateShort(new Date('2024-06-15T12:00:00.000Z'))
    expect(result).toMatch(/Jun/)
  })
})

describe('getInitials', () => {
  it('gets initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('gets single initial for one word', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('uppercases initials', () => {
    expect(getInitials('john doe')).toBe('JD')
  })

  it('limits to 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('handles empty string gracefully', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'extra')).toBe('base extra')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})
