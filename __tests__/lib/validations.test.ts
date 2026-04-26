import {
  createAccountSchema,
  createTransactionSchema,
  createBudgetLimitSchema,
  createRecurringSchema,
  createGoalSchema,
  createEnvelopeSchema,
  createEnvelopeTransactionSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validations'

// ─── Account schema ───────────────────────────────────────────────────────────

describe('createAccountSchema', () => {
  const valid = { name: 'Checking', type: 'BANK', balance: 1000, currency: 'USD' }

  it('accepts valid account', () => {
    expect(() => createAccountSchema.parse(valid)).not.toThrow()
  })

  it('rejects empty name', () => {
    expect(() => createAccountSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejects name over 50 chars', () => {
    expect(() => createAccountSchema.parse({ ...valid, name: 'a'.repeat(51) })).toThrow()
  })

  it('rejects invalid account type', () => {
    expect(() => createAccountSchema.parse({ ...valid, type: 'INVALID' })).toThrow()
  })

  it('accepts all valid account types', () => {
    for (const type of ['BANK', 'CREDIT_CARD', 'CASH']) {
      expect(() => createAccountSchema.parse({ ...valid, type })).not.toThrow()
    }
  })

  it('rejects balance below lower bound', () => {
    expect(() => createAccountSchema.parse({ ...valid, balance: -10_000_000 })).toThrow()
  })

  it('rejects balance above upper bound', () => {
    expect(() => createAccountSchema.parse({ ...valid, balance: 10_000_000 })).toThrow()
  })

  it('rejects currency not 3 chars', () => {
    expect(() => createAccountSchema.parse({ ...valid, currency: 'US' })).toThrow()
    expect(() => createAccountSchema.parse({ ...valid, currency: 'USDX' })).toThrow()
  })

  it('accepts valid hex color', () => {
    expect(() => createAccountSchema.parse({ ...valid, color: '#6366f1' })).not.toThrow()
  })

  it('rejects invalid hex color', () => {
    expect(() => createAccountSchema.parse({ ...valid, color: 'red' })).toThrow()
    expect(() => createAccountSchema.parse({ ...valid, color: '#GGG111' })).toThrow()
  })

  it('accepts valid lastFour', () => {
    expect(() => createAccountSchema.parse({ ...valid, lastFour: '1234' })).not.toThrow()
  })

  it('rejects lastFour that is not 4 digits', () => {
    expect(() => createAccountSchema.parse({ ...valid, lastFour: '123' })).toThrow()
    expect(() => createAccountSchema.parse({ ...valid, lastFour: 'abcd' })).toThrow()
  })

  it('rejects non-string name (XSS attempt as object)', () => {
    expect(() => createAccountSchema.parse({ ...valid, name: { toString: () => '<script>' } })).toThrow()
  })
})

// ─── Transaction schema ───────────────────────────────────────────────────────

describe('createTransactionSchema', () => {
  const valid = {
    accountId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
    type: 'EXPENSE',
    amount: 50,
    category: 'Dining',
    date: new Date(),
  }

  it('accepts valid transaction', () => {
    expect(() => createTransactionSchema.parse(valid)).not.toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(() => createTransactionSchema.parse({ ...valid, amount: 0 })).toThrow()
    expect(() => createTransactionSchema.parse({ ...valid, amount: -10 })).toThrow()
  })

  it('rejects amount above max', () => {
    expect(() => createTransactionSchema.parse({ ...valid, amount: 10_000_000 })).toThrow()
  })

  it('rejects invalid transaction type', () => {
    expect(() => createTransactionSchema.parse({ ...valid, type: 'DONATION' })).toThrow()
  })

  it('rejects empty category', () => {
    expect(() => createTransactionSchema.parse({ ...valid, category: '' })).toThrow()
  })

  it('rejects category over 50 chars', () => {
    expect(() => createTransactionSchema.parse({ ...valid, category: 'a'.repeat(51) })).toThrow()
  })

  it('rejects description over 255 chars', () => {
    expect(() =>
      createTransactionSchema.parse({ ...valid, description: 'a'.repeat(256) })
    ).toThrow()
  })

  it('accepts null description', () => {
    expect(() => createTransactionSchema.parse({ ...valid, description: null })).not.toThrow()
  })

  it('coerces date string to Date', () => {
    const result = createTransactionSchema.parse({ ...valid, date: '2024-01-15' })
    expect(result.date).toBeInstanceOf(Date)
  })
})

// ─── Budget limit schema ──────────────────────────────────────────────────────

describe('createBudgetLimitSchema', () => {
  const valid = { category: 'Dining', amount: 500, month: 3, year: 2024 }

  it('accepts valid budget', () => {
    expect(() => createBudgetLimitSchema.parse(valid)).not.toThrow()
  })

  it('rejects month 0', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, month: 0 })).toThrow()
  })

  it('rejects month 13', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, month: 13 })).toThrow()
  })

  it('accepts boundary months 1 and 12', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, month: 1 })).not.toThrow()
    expect(() => createBudgetLimitSchema.parse({ ...valid, month: 12 })).not.toThrow()
  })

  it('rejects year below 2020', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, year: 2019 })).toThrow()
  })

  it('rejects year above 2100', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, year: 2101 })).toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(() => createBudgetLimitSchema.parse({ ...valid, amount: 0 })).toThrow()
    expect(() => createBudgetLimitSchema.parse({ ...valid, amount: -100 })).toThrow()
  })
})

// ─── Recurring schema ─────────────────────────────────────────────────────────

describe('createRecurringSchema', () => {
  const valid = {
    accountId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
    type: 'EXPENSE',
    amount: 1200,
    category: 'Housing',
    interval: 'monthly',
    nextDue: new Date(),
  }

  it('accepts valid recurring template', () => {
    expect(() => createRecurringSchema.parse(valid)).not.toThrow()
  })

  it('accepts all valid intervals', () => {
    for (const interval of ['weekly', 'biweekly', 'monthly', 'yearly']) {
      expect(() => createRecurringSchema.parse({ ...valid, interval })).not.toThrow()
    }
  })

  it('rejects invalid interval', () => {
    expect(() => createRecurringSchema.parse({ ...valid, interval: 'daily' })).toThrow()
  })

  it('rejects invalid type', () => {
    expect(() => createRecurringSchema.parse({ ...valid, type: 'TRANSFER' })).toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(() => createRecurringSchema.parse({ ...valid, amount: -5 })).toThrow()
  })
})

// ─── Goal schema ──────────────────────────────────────────────────────────────

describe('createGoalSchema', () => {
  const valid = { name: 'Emergency Fund', targetAmount: 10000 }

  it('accepts valid goal', () => {
    expect(() => createGoalSchema.parse(valid)).not.toThrow()
  })

  it('rejects empty name', () => {
    expect(() => createGoalSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejects name over 100 chars', () => {
    expect(() => createGoalSchema.parse({ ...valid, name: 'a'.repeat(101) })).toThrow()
  })

  it('rejects non-positive target amount', () => {
    expect(() => createGoalSchema.parse({ ...valid, targetAmount: 0 })).toThrow()
    expect(() => createGoalSchema.parse({ ...valid, targetAmount: -500 })).toThrow()
  })

  it('accepts valid color', () => {
    expect(() => createGoalSchema.parse({ ...valid, color: '#a855f7' })).not.toThrow()
  })

  it('rejects invalid color', () => {
    expect(() => createGoalSchema.parse({ ...valid, color: 'purple' })).toThrow()
  })

  it('accepts null accountId and deadline', () => {
    expect(() =>
      createGoalSchema.parse({ ...valid, accountId: null, deadline: null })
    ).not.toThrow()
  })
})

// ─── Envelope schema ──────────────────────────────────────────────────────────

describe('createEnvelopeSchema', () => {
  const valid = {
    name: 'Groceries Budget',
    totalAmount: 400,
    accountId: 'clxxxxxxxxxxxxxxxxxxxxxxx',
  }

  it('accepts valid envelope', () => {
    expect(() => createEnvelopeSchema.parse(valid)).not.toThrow()
  })

  it('rejects empty name', () => {
    expect(() => createEnvelopeSchema.parse({ ...valid, name: '' })).toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(() => createEnvelopeSchema.parse({ ...valid, totalAmount: -1 })).toThrow()
  })
})

describe('createEnvelopeTransactionSchema', () => {
  const valid = { amount: 25, category: 'Groceries', date: new Date() }

  it('accepts valid transaction', () => {
    expect(() => createEnvelopeTransactionSchema.parse(valid)).not.toThrow()
  })

  it('rejects non-positive amount', () => {
    expect(() => createEnvelopeTransactionSchema.parse({ ...valid, amount: 0 })).toThrow()
  })

  it('rejects description over 255 chars', () => {
    expect(() =>
      createEnvelopeTransactionSchema.parse({ ...valid, description: 'x'.repeat(256) })
    ).toThrow()
  })
})

// ─── Auth schemas ─────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@example.com', password: 'secret123' })
    ).not.toThrow()
  })

  it('rejects invalid email', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: 'secret123' })
    ).toThrow()
  })

  it('rejects password shorter than 6 chars', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@example.com', password: '12345' })
    ).toThrow()
  })

  it('rejects empty email', () => {
    expect(() => loginSchema.parse({ email: '', password: 'secret123' })).toThrow()
  })
})

describe('registerSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'securepass',
    confirmPassword: 'securepass',
  }

  it('accepts matching passwords', () => {
    expect(() => registerSchema.parse(valid)).not.toThrow()
  })

  it('rejects mismatched passwords', () => {
    expect(() =>
      registerSchema.parse({ ...valid, confirmPassword: 'different' })
    ).toThrow()
  })

  it('rejects password shorter than 8 chars', () => {
    expect(() =>
      registerSchema.parse({ ...valid, password: '1234567', confirmPassword: '1234567' })
    ).toThrow()
  })

  it('rejects invalid email format', () => {
    expect(() => registerSchema.parse({ ...valid, email: 'bad-email' })).toThrow()
  })
})
