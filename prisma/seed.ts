import { PrismaClient, AccountType, TransactionType } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { subDays, subMonths, startOfMonth, addDays } from 'date-fns'

const prisma = new PrismaClient()

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'

async function getOrCreateDemoUser(): Promise<string> {
  // Try to find existing user
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
  const existing = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL)
  if (existing) {
    console.log('✓ Demo user already exists:', existing.id)
    return existing.id
  }

  // Create new demo user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  })

  if (error || !data.user) {
    throw new Error(`Failed to create demo user: ${error?.message}`)
  }

  console.log('✓ Created demo user:', data.user.id)
  return data.user.id
}

async function seed() {
  console.log('🌱 Seeding database...')

  const userId = await getOrCreateDemoUser()

  // Clear existing data for this user
  await prisma.transaction.deleteMany({ where: { userId } })
  await prisma.account.deleteMany({ where: { userId } })
  await prisma.userPreferences.deleteMany({ where: { userId } })

  // Create user preferences with custom categories
  await prisma.userPreferences.create({
    data: {
      userId,
      customCategories: ['Side Hustle', 'Crypto', 'Vintage Shopping'],
    },
  })

  // Create accounts
  const checkingAccount = await prisma.account.create({
    data: {
      userId,
      name: 'Chase Checking',
      type: AccountType.BANK,
      balance: 4250.0,
      currency: 'USD',
      color: '#6366f1',
      lastFour: '4892',
    },
  })

  const savingsAccount = await prisma.account.create({
    data: {
      userId,
      name: 'High-Yield Savings',
      type: AccountType.BANK,
      balance: 18750.5,
      currency: 'USD',
      color: '#22c55e',
      lastFour: '7731',
    },
  })

  const creditCard = await prisma.account.create({
    data: {
      userId,
      name: 'Amex Gold',
      type: AccountType.CREDIT_CARD,
      balance: -1420.35,
      currency: 'USD',
      color: '#f59e0b',
      lastFour: '3344',
    },
  })

  console.log('✓ Created accounts')

  // Seed transactions for the past 3 months
  const today = new Date()
  const transactions: Array<{
    userId: string
    accountId: string
    type: TransactionType
    amount: number
    category: string
    description: string
    date: Date
  }> = []

  // Month -2 transactions
  const m2 = subMonths(today, 2)
  const m2Start = startOfMonth(m2)
  transactions.push(
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 5500, category: 'Salary', description: 'Monthly salary', date: addDays(m2Start, 0) },
    { userId, accountId: savingsAccount.id, type: TransactionType.INCOME, amount: 200, category: 'Interest', description: 'Savings interest', date: addDays(m2Start, 1) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 1800, category: 'Housing', description: 'Rent payment', date: addDays(m2Start, 1) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 245.8, category: 'Groceries', description: 'Whole Foods', date: addDays(m2Start, 3) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 89.99, category: 'Subscriptions', description: 'Netflix, Spotify, etc.', date: addDays(m2Start, 5) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 320, category: 'Utilities', description: 'Electric + Internet', date: addDays(m2Start, 6) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 78.5, category: 'Dining', description: 'Restaurant dinner', date: addDays(m2Start, 8) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 150, category: 'Transport', description: 'Monthly transit pass', date: addDays(m2Start, 9) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 420, category: 'Shopping', description: 'Clothing haul', date: addDays(m2Start, 12) },
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 350, category: 'Freelance', description: 'Design contract', date: addDays(m2Start, 15) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 62.4, category: 'Groceries', description: 'Trader Joe\'s', date: addDays(m2Start, 17) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 199, category: 'Health', description: 'Gym membership', date: addDays(m2Start, 18) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 55, category: 'Dining', description: 'Lunch with friends', date: addDays(m2Start, 20) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 38.99, category: 'Entertainment', description: 'Movie tickets', date: addDays(m2Start, 22) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 200, category: 'Savings', description: 'Transfer to savings', date: addDays(m2Start, 25) },
  )

  // Month -1 transactions
  const m1 = subMonths(today, 1)
  const m1Start = startOfMonth(m1)
  transactions.push(
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 5500, category: 'Salary', description: 'Monthly salary', date: addDays(m1Start, 0) },
    { userId, accountId: savingsAccount.id, type: TransactionType.INCOME, amount: 210, category: 'Interest', description: 'Savings interest', date: addDays(m1Start, 1) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 1800, category: 'Housing', description: 'Rent payment', date: addDays(m1Start, 1) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 189.3, category: 'Groceries', description: 'Whole Foods + Costco', date: addDays(m1Start, 4) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 89.99, category: 'Subscriptions', description: 'Streaming services', date: addDays(m1Start, 5) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 295, category: 'Utilities', description: 'Electric + Internet', date: addDays(m1Start, 6) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 145.6, category: 'Dining', description: 'Date night', date: addDays(m1Start, 7) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 150, category: 'Transport', description: 'Monthly transit pass', date: addDays(m1Start, 9) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 560, category: 'Shopping', description: 'Electronics', date: addDays(m1Start, 14) },
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 600, category: 'Freelance', description: 'Web project', date: addDays(m1Start, 16) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 94.5, category: 'Groceries', description: 'Weekly groceries', date: addDays(m1Start, 18) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 199, category: 'Health', description: 'Gym membership', date: addDays(m1Start, 18) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 72, category: 'Dining', description: 'Team lunch', date: addDays(m1Start, 21) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 55.99, category: 'Entertainment', description: 'Concert tickets', date: addDays(m1Start, 24) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 300, category: 'Savings', description: 'Transfer to savings', date: addDays(m1Start, 25) },
  )

  // Current month transactions
  const cStart = startOfMonth(today)
  transactions.push(
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 5500, category: 'Salary', description: 'Monthly salary', date: addDays(cStart, 0) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 1800, category: 'Housing', description: 'Rent payment', date: addDays(cStart, 1) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 156.4, category: 'Groceries', description: 'Whole Foods', date: subDays(today, 6) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 89.99, category: 'Subscriptions', description: 'Streaming services', date: subDays(today, 5) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 310, category: 'Utilities', description: 'Electric + Internet', date: subDays(today, 4) },
    { userId, accountId: creditCard.id, type: TransactionType.EXPENSE, amount: 92.0, category: 'Dining', description: 'Weekend brunch', date: subDays(today, 3) },
    { userId, accountId: checkingAccount.id, type: TransactionType.EXPENSE, amount: 150, category: 'Transport', description: 'Monthly transit pass', date: subDays(today, 2) },
    { userId, accountId: checkingAccount.id, type: TransactionType.INCOME, amount: 450, category: 'Freelance', description: 'Logo design', date: subDays(today, 1) },
  )

  await prisma.transaction.createMany({ data: transactions })
  console.log(`✓ Created ${transactions.length} transactions`)

  console.log('\n✅ Seed complete!')
  console.log(`\nDemo credentials:`)
  console.log(`  Email:    ${DEMO_EMAIL}`)
  console.log(`  Password: ${DEMO_PASSWORD}`)
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
