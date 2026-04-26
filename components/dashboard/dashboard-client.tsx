'use client'

import { TrendingUp, TrendingDown, Wallet, ArrowUpDown, Plus, Globe, Users } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { useUIStore } from '@/store/ui-store'
import { StatsCard } from '@/components/dashboard/stats-card'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { TrendChart } from '@/components/dashboard/trend-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AccountSummary } from '@/components/dashboard/account-summary'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { formatCurrency } from '@/lib/utils'

interface DashboardClientProps {
  email?: string
  displayName?: string
}

export function DashboardClient({ email, displayName }: DashboardClientProps) {
  const { data: stats, isLoading } = useDashboardStats()
  const { isAddTransactionOpen, openAddTransaction, closeAddTransaction } = useUIStore()

  const incomeChange = stats && stats.lastMonthIncome > 0
    ? Math.round(((stats.monthlyIncome - stats.lastMonthIncome) / stats.lastMonthIncome) * 100)
    : null
  const expenseChange = stats && stats.lastMonthExpenses > 0
    ? Math.round(((stats.monthlyExpenses - stats.lastMonthExpenses) / stats.lastMonthExpenses) * 100)
    : null

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

      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
              Good {getGreeting()},{' '}
              <span className="gradient-text">{displayName ?? getFirstName(email)}</span>
            </h1>
            <p className="text-xs lg:text-sm text-white/40 mt-1">
              Here&apos;s your financial overview for this month
              {stats?.hasMixedCurrencies && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-400/70">
                  <Globe className="h-3 w-3" />
                  Net worth est. in USD
                </span>
              )}
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
            title={stats?.hasMixedCurrencies ? 'Net worth (est. USD)' : 'Net worth'}
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
            badge={incomeChange != null ? { value: incomeChange, label: 'vs last mo' } : undefined}
          />
          <StatsCard
            title="Monthly expenses"
            value={stats?.monthlyExpenses ?? 0}
            icon={TrendingDown}
            iconColor="#fb7185"
            iconBg="rgba(244,63,94,0.15)"
            gradient="linear-gradient(135deg, #f43f5e, #fb7185)"
            isLoading={isLoading}
            badge={expenseChange != null ? { value: expenseChange, label: 'vs last mo', invertColor: true } : undefined}
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

        {/* Pending from friends banner */}
        {(isLoading || (stats?.pendingFromFriends ?? 0) > 0) && (
          <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 shrink-0">
              <Users className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/40 uppercase tracking-widest">Pending from friends</p>
              {isLoading
                ? <div className="h-5 w-24 bg-white/10 rounded animate-pulse mt-0.5" />
                : <p className="text-lg font-bold text-amber-400">{formatCurrency(stats!.pendingFromFriends)}</p>
              }
            </div>
            <p className="text-xs text-white/30 hidden sm:block">Not included in net worth</p>
          </div>
        )}

        {/* Multi-currency breakdown if relevant */}
        {stats?.hasMixedCurrencies && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.netWorthByCurrency).map(([currency, amount]) => (
              <div key={currency} className="glass-card rounded-xl px-3 py-1.5 text-xs">
                <span className="text-white/40 mr-1.5">{currency}</span>
                <span className="font-mono font-semibold text-white/80">{formatCurrency(amount, currency)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <TrendChart />
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
