'use client'

import { TrendingUp, TrendingDown, Wallet, ArrowUpDown, Plus } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useUIStore } from '@/store/ui-store'
import { StatsCard } from '@/components/dashboard/stats-card'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AccountSummary } from '@/components/dashboard/account-summary'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/transaction-form'

interface DashboardClientProps {
  email?: string
  displayName?: string
}

export function DashboardClient({ email, displayName }: DashboardClientProps) {
  const { data: stats, isLoading } = useDashboardStats()
  const { isAddTransactionOpen, openAddTransaction, closeAddTransaction } = useUIStore()

  return (
    <>
      <Header
        title="Dashboard"
        email={email}
        action={
          <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-500 border-0" onClick={() => openAddTransaction()}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Page header */}
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good {getGreeting()},{' '}
              <span className="gradient-text">{displayName ?? getFirstName(email)}</span>
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Here&apos;s your financial overview for this month
            </p>
          </div>
          <Button
            onClick={() => openAddTransaction()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add transaction
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          <StatsCard
            title="Net worth"
            value={stats?.netWorth ?? 0}
            icon={Wallet}
            iconColor="#a78bfa"
            iconBg="rgba(139,92,246,0.15)"
            gradient="linear-gradient(135deg, #7c3aed, #6366f1)"
            isLoading={isLoading}
          />
          <StatsCard
            title="Monthly income"
            value={stats?.monthlyIncome ?? 0}
            icon={TrendingUp}
            iconColor="#34d399"
            iconBg="rgba(16,185,129,0.15)"
            gradient="linear-gradient(135deg, #10b981, #34d399)"
            isLoading={isLoading}
          />
          <StatsCard
            title="Monthly expenses"
            value={stats?.monthlyExpenses ?? 0}
            icon={TrendingDown}
            iconColor="#fb7185"
            iconBg="rgba(244,63,94,0.15)"
            gradient="linear-gradient(135deg, #f43f5e, #fb7185)"
            isLoading={isLoading}
          />
          <StatsCard
            title="Net this month"
            value={stats?.monthlyNet ?? 0}
            icon={ArrowUpDown}
            iconColor={stats && stats.monthlyNet >= 0 ? '#34d399' : '#fb7185'}
            iconBg={stats && stats.monthlyNet >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}
            isLoading={isLoading}
            showSign
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            <RecentTransactions />
          </div>
          <div className="space-y-4 lg:space-y-6">
            <SpendingChart />
            <AccountSummary />
          </div>
        </div>
      </div>

      <Dialog open={isAddTransactionOpen} onOpenChange={closeAddTransaction}>
        <TransactionForm />
      </Dialog>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getFirstName(email?: string) {
  if (!email) return 'there'
  return email.split('@')[0].split('.')[0]
}
