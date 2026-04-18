# Expense Tracker

A full-stack expense tracking web application built with Next.js 14, Supabase, and Prisma. Track income, expenses, and net worth across multiple accounts with a clean dark-themed UI.

## Features

- **Multi-account support** — bank accounts and credit cards with color coding
- **Transaction tracking** — income & expenses with categories, dates, and notes
- **Atomic balance updates** — every transaction mutation is wrapped in a Prisma transaction
- **Custom categories** — preset categories + add your own
- **Dashboard** — net worth, monthly summary, spending donut chart, recent transactions
- **Filtering** — filter transactions by account, type, category, and date range
- **Auth** — Supabase email/password authentication with httpOnly cookies
- **Mobile-first** — fully responsive with bottom tab navigation on mobile

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| ORM | Prisma |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query v5 |
| UI state | Zustand |

---

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for it to provision (~2 minutes)

### 2. Clone and install dependencies

```bash
git clone <repo>
cd expense-tracker
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase credentials:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key |
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection Pooling (Transaction mode) |
| `DIRECT_URL` | Supabase Dashboard → Settings → Database → Connection String → URI |

**Important**: Add `?pgbouncer=true&connection_limit=1` to `DATABASE_URL` for serverless environments.

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 5. Configure Supabase Row-Level Security (recommended)

In the Supabase SQL editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserPreferences" ENABLE ROW LEVEL SECURITY;

-- Account policies
CREATE POLICY "Users can view own accounts"
  ON "Account" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own accounts"
  ON "Account" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own accounts"
  ON "Account" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own accounts"
  ON "Account" FOR DELETE
  USING (auth.uid()::text = "userId");

-- Transaction policies (same pattern)
CREATE POLICY "Users can view own transactions"
  ON "Transaction" FOR SELECT
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert own transactions"
  ON "Transaction" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can update own transactions"
  ON "Transaction" FOR UPDATE
  USING (auth.uid()::text = "userId");

CREATE POLICY "Users can delete own transactions"
  ON "Transaction" FOR DELETE
  USING (auth.uid()::text = "userId");

-- UserPreferences policies
CREATE POLICY "Users can manage own preferences"
  ON "UserPreferences" FOR ALL
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo account

After seeding, you can log in with:
- **Email**: `demo@example.com`
- **Password**: `demo1234`

---

## Project Structure

```
├── app/
│   ├── (protected)/          # Auth-gated routes
│   │   ├── dashboard/
│   │   ├── accounts/
│   │   └── transactions/
│   ├── api/                  # API route handlers
│   │   ├── accounts/
│   │   ├── transactions/
│   │   ├── categories/
│   │   └── dashboard/
│   └── auth/
│       ├── login/
│       └── register/
├── components/
│   ├── accounts/
│   ├── dashboard/
│   ├── layout/
│   ├── transactions/
│   └── ui/                   # shadcn/ui components
├── hooks/                    # React Query hooks
├── lib/                      # Prisma, Supabase, utils
├── prisma/                   # Schema + seed
├── store/                    # Zustand UI store
└── types/                    # TypeScript types
```

## Key architectural decisions

### Atomic balance updates
Every transaction create/update/delete uses `prisma.$transaction()` to update both the transaction record and the account balance in a single atomic operation. Partial updates are impossible.

### Security layers
1. **Middleware** — redirects unauthenticated requests before they hit routes
2. **API route auth** — every API handler verifies the session via Supabase
3. **Explicit userId filters** — all Prisma queries include `where: { userId }` 
4. **RLS** — database-level policy as the final backstop

### Type safety
Prisma `Decimal` types are serialized to strings for JSON transport. The `SerializedAccount` and `SerializedTransaction` types in `types/index.ts` reflect this — parse with `parseFloat()` when doing arithmetic on the client.

## Available scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Regenerate Prisma client
```
