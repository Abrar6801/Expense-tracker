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
}

export function DashboardClient({ email }: DashboardClientProps) {
  const { data: stats, isLoading } = useDashboardStats()
  const { isAddTransactionOpen, openAddTransaction, closeAddTransaction } = useUIStore()

  return (
    <>
      <Header
        title="Dashboard"
        email={email}
        action={
          <Button size="sm" className="h-8 text-xs" onClick={() => openAddTransaction()}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Page title — desktop only */}
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your financial overview for this month
            </p>
          </div>
          <Button onClick={() => openAddTransaction()}>
            <Plus className="mr-2 h-4 w-4" />
            Add transaction
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
          <StatsCard
            title="Net worth"
            value={stats?.netWorth ?? 0}
            icon={Wallet}
            iconColor="#6366f1"
            iconBg="#6366f120"
            isLoading={isLoading}
          />
          <StatsCard
            title="Monthly income"
            value={stats?.monthlyIncome ?? 0}
            icon={TrendingUp}
            iconColor="#22c55e"
            iconBg="#22c55e20"
            isLoading={isLoading}
          />
          <StatsCard
            title="Monthly expenses"
            value={stats?.monthlyExpenses ?? 0}
            icon={TrendingDown}
            iconColor="#ef4444"
            iconBg="#ef444420"
            isLoading={isLoading}
          />
          <StatsCard
            title="Net this month"
            value={stats?.monthlyNet ?? 0}
            icon={ArrowUpDown}
            iconColor={stats && stats.monthlyNet >= 0 ? '#22c55e' : '#ef4444'}
            iconBg={stats && stats.monthlyNet >= 0 ? '#22c55e20' : '#ef444420'}
            isLoading={isLoading}
            showSign
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
          {/* Left column */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            <RecentTransactions />
          </div>

          {/* Right column */}
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
