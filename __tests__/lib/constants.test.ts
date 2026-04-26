import { PRESET_CATEGORIES, ACCOUNT_COLORS, CURRENCIES, FX_TO_USD, DATE_FILTER_OPTIONS } from '@/lib/constants'

describe('PRESET_CATEGORIES', () => {
  it('contains expected core categories', () => {
    expect(PRESET_CATEGORIES).toContain('Dining')
    expect(PRESET_CATEGORIES).toContain('Transport')
    expect(PRESET_CATEGORIES).toContain('Groceries')
    expect(PRESET_CATEGORIES).toContain('Salary')
  })

  it('has no duplicate categories', () => {
    const unique = new Set(PRESET_CATEGORIES)
    expect(unique.size).toBe(PRESET_CATEGORIES.length)
  })

  it('all entries are non-empty strings', () => {
    PRESET_CATEGORIES.forEach(c => {
      expect(typeof c).toBe('string')
      expect(c.length).toBeGreaterThan(0)
    })
  })
})

describe('ACCOUNT_COLORS', () => {
  it('all colors are valid 6-digit hex values', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/
    ACCOUNT_COLORS.forEach(({ value }) => {
      expect(hexPattern.test(value)).toBe(true)
    })
  })

  it('all entries have a label and value', () => {
    ACCOUNT_COLORS.forEach(color => {
      expect(color.label).toBeTruthy()
      expect(color.value).toBeTruthy()
    })
  })

  it('has no duplicate color values', () => {
    const values = ACCOUNT_COLORS.map(c => c.value)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('CURRENCIES', () => {
  it('contains USD as first entry', () => {
    expect(CURRENCIES[0].value).toBe('USD')
  })

  it('all currency codes are exactly 3 chars', () => {
    CURRENCIES.forEach(({ value }) => {
      expect(value.length).toBe(3)
    })
  })

  it('all currency labels include the code', () => {
    CURRENCIES.forEach(({ label, value }) => {
      expect(label).toContain(value)
    })
  })
})

describe('FX_TO_USD', () => {
  it('USD rate is exactly 1', () => {
    expect(FX_TO_USD['USD']).toBe(1)
  })

  it('all rates are positive numbers', () => {
    Object.values(FX_TO_USD).forEach(rate => {
      expect(typeof rate).toBe('number')
      expect(rate).toBeGreaterThan(0)
    })
  })

  it('contains all currencies listed in CURRENCIES', () => {
    CURRENCIES.forEach(({ value }) => {
      expect(FX_TO_USD).toHaveProperty(value)
    })
  })

  it('EUR rate is greater than USD (EUR is stronger)', () => {
    expect(FX_TO_USD['EUR']).toBeGreaterThan(1)
  })

  it('JPY rate is much less than 1 (weak vs USD)', () => {
    expect(FX_TO_USD['JPY']).toBeLessThan(0.1)
  })
})

describe('DATE_FILTER_OPTIONS', () => {
  it('contains expected filter options', () => {
    const values = DATE_FILTER_OPTIONS.map(o => o.value)
    expect(values).toContain('7d')
    expect(values).toContain('30d')
    expect(values).toContain('ytd')
    expect(values).toContain('all')
  })

  it('all entries have non-empty label and value', () => {
    DATE_FILTER_OPTIONS.forEach(({ label, value }) => {
      expect(label).toBeTruthy()
      expect(value).toBeTruthy()
    })
  })
})
