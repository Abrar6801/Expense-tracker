# Aurora Finance

A full-stack personal finance tracker built with Next.js 14, Supabase, and Prisma. Manage accounts, track transactions, set savings goals, split expenses with friends, and get AI-powered financial insights — all in a glassmorphism UI that works seamlessly on desktop, tablet, and mobile.

---

## Features

### Dashboard
- Net worth across all accounts (multi-currency with live USD conversion)
- Monthly income, expenses, and net — with month-over-month percentage change
- Pending from friends (split reimbursements shown separately, excluded from net worth)
- Spending by category with % change vs last month
- 6-month income vs expense trend chart
- Recent transactions feed
- Account balances summary

### Accounts
- Bank, credit card, and cash account types
- Multi-currency support with automatic FX-to-USD conversion for net worth
- Color labels and last-four digits for cards

### Transactions
- Full create / edit / delete with atomic account balance updates
- Pagination, keyword search, and filters by type, category, account, and date range
- CSV export with formula injection protection
- Transfer between accounts (paired transaction records)

### Budget Limits
- Monthly spending caps per category
- Real-time progress bars with over-budget warnings

### Planner
- Log planned expenses and expected income sources
- Project your month-end balance before spending happens
- Track money owed to you with expected income types

### Recurring Templates
- Schedule transactions at weekly, biweekly, monthly, or yearly intervals
- One-click "post now" to create the transaction when due

### Savings Goals
- Link goals to specific accounts to track progress from the account balance
- Set target amounts and optional deadlines with a visual progress bar

### Cash Envelopes
- Digital envelope budgeting — allocate a fixed amount from an account
- Track spending per envelope; see remaining balance at a glance

### Splits
- **Groups** — Save named groups of friends (flat mates, uni friends, etc.) to reuse across splits
- **New split** — Select a saved group to pre-fill all members instantly, or add members manually
- **Split all equally** — One click divides the total amount evenly across all members
- **Mark as received** — When a friend pays back, pick which account to credit; a Reimbursement transaction is created and the balance updates atomically
- Pending amounts shown on the dashboard as "Pending from friends" — never mixed into income or net worth

### AI Financial Assistant
- Powered by Groq (`llama-3.3-70b-versatile`) with an agentic tool-call loop
- Ask natural-language questions: *"How much did I spend on dining this month?"*, *"Add a $50 grocery expense to my checking account"*, *"Transfer $200 from savings to cash"*
- Calls live database tools — no hallucinated numbers, always accurate to your real data
- Pre-computed date context (today, this week, last month, YTD) so date queries always resolve correctly
- Rate limited to 20 requests per minute per user

### PWA
- Installable on Android and desktop via "Add to Home Screen"
- Offline-capable shell with app manifest and icons

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth (SSR) |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Validation | Zod |
| UI components | Tailwind CSS + Radix UI |
| Charts | Recharts |
| AI | Groq API |
| PWA | next-pwa |
| Testing | Jest + ts-jest |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Groq](https://console.groq.com) API key (free tier)

### 1. Clone and install

```bash
git clone https://github.com/Abrar6801/Expense-tracker.git
cd Expense-tracker
npm install
```

### 2. Environment variables

Create a `.env` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Prisma — use PgBouncer URL for runtime, direct URL for migrations
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Groq AI
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Push the database schema

```bash
npx prisma db push
```

### 4. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and create an account.

---

## Scripts

```bash
npm run dev            # Start development server
npm run build          # Production build (runs prisma generate first)
npm run start          # Start production server
npm run test           # Run Jest test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run lint           # ESLint
npm run db:migrate     # Run Prisma migrations (requires direct DB connection)
npm run db:studio      # Open Prisma Studio GUI
npm run db:generate    # Regenerate Prisma client after schema changes
```

---

## Project Structure

```
├── app/
│   ├── (protected)/          # Auth-gated pages
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── planner/
│   │   ├── goals/
│   │   ├── envelopes/
│   │   └── splits/
│   ├── api/                  # REST API routes
│   │   ├── accounts/
│   │   ├── transactions/
│   │   │   └── export/       # CSV export
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── envelopes/
│   │   ├── splits/
│   │   │   └── [id]/members/[memberId]/   # Mark received
│   │   ├── split-groups/
│   │   ├── planned-expenses/
│   │   ├── recurring/
│   │   ├── transfers/
│   │   ├── dashboard/
│   │   │   └── trends/
│   │   └── chat/
│   └── auth/                 # Login / register / OAuth callback
├── components/               # Feature and shared UI components
├── hooks/                    # TanStack Query data hooks (one per feature)
├── lib/                      # prisma.ts, supabase clients, utils, validations, constants
├── prisma/                   # schema.prisma + migrations
├── store/                    # Zustand UI stores
├── types/                    # Shared TypeScript types and serializer functions
└── __tests__/
    ├── api/                  # API route integration tests
    ├── lib/                  # Unit tests for utils, validations, constants
    └── security/             # Security-focused tests
```

---

## Testing

```bash
npm test
```

```
Test Suites: 13 passed, 13 total
Tests:       210 passed, 210 total
```

| Suite | Coverage |
|---|---|
| `api/accounts` | CRUD, auth guard, IDOR protection |
| `api/transactions` | Pagination, search, atomic balance update |
| `api/budgets` | Month/year bounds, per-user scoping |
| `api/goals` | Validation, userId scoping, color regex |
| `api/envelopes` | Envelope creation, atomic spending transactions |
| `api/chat-security` | Rate limiting, input validation, auth enforcement |
| `security/csv-injection` | Formula prefix neutralization (`=`, `+`, `-`, `@`, tab, CR) |
| `security/open-redirect` | Protocol-relative and colon-bypass prevention |
| `security/rate-limit` | Per-user sliding window, reset behaviour |
| `security/input-validation` | Query parameter sanitization and bounds |
| `lib/validations` | All Zod schemas — valid and invalid inputs |
| `lib/utils` | formatCurrency, formatDate, getInitials, cn |
| `lib/constants` | PRESET_CATEGORIES, FX_TO_USD exchange rates |

---

## Security

| Control | Implementation |
|---|---|
| Authentication | Supabase session checked on every API route and protected page |
| IDOR prevention | All queries filter by `session.user.id` — users can never access each other's data |
| Input validation | Zod schemas on every POST/PATCH body; invalid input returns 400 |
| CSV injection | Export sanitises values starting with `=`, `+`, `-`, `@`, `\t`, `\r` |
| Open redirect | Auth redirects only accept relative paths; rejects `//`, `https://`, and `:` bypasses |
| Rate limiting | AI chat endpoint: 20 req/min per user (in-memory sliding window) |
| Security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` |
| userId trust | All writes use `session.user.id` — a body-supplied `userId` is always ignored |

---

## Database Schema (overview)

```
Account ──< Transaction
Account ──< CashEnvelope ──< Transaction (envelope spending)
Account ──< PlannedExpense
Account ──< RecurringTemplate
Account ──< SavingsGoal

SplitGroup ──< SplitGroupMember
SplitGroup ──< Split ──< SplitMember

TransactionType: EXPENSE | INCOME | TRANSFER | REIMBURSEMENT
```

`REIMBURSEMENT` transactions are created when a split member marks a payment as received. They are excluded from all income aggregations and net worth calculations — surfaced only as the "Pending from friends" dashboard metric.

---

## License

MIT
