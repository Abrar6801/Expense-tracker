'use client'

import { Plus } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
import { AccountList } from '@/components/accounts/account-list'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface AccountsClientProps {
  email?: string
}

export function AccountsClient({ email }: AccountsClientProps) {
  const { data: accounts, isLoading } = useAccounts()
  const { openAddAccount } = useUIStore()

  const totalBalance = accounts?.reduce((sum, a) => sum + parseFloat(a.balance), 0) ?? 0

  return (
    <>
      <Header
        title="Accounts"
        email={email}
        action={
          <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-500 border-0" onClick={openAddAccount}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        {/* Page header — visible at md+ */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Accounts</h1>
            <p className="text-xs lg:text-sm text-white/40 mt-1">Manage your bank accounts and credit cards</p>
          </div>
          <Button
            onClick={openAddAccount}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
        </div>

        {/* Net worth summary card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Total Net Worth</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-8 w-36 bg-white/5" />
              ) : (
                <p className={`mt-1.5 text-2xl sm:text-3xl font-bold font-mono tracking-tight ${totalBalance < 0 ? 'text-rose-400' : 'gradient-text'}`}>
                  {formatCurrency(totalBalance)}
                </p>
              )}
            </div>

            {!isLoading && accounts && accounts.length > 0 && (
              <div className="flex gap-4 sm:gap-6 sm:ml-auto">
                {[
                  { label: 'Total', value: accounts.length },
                  { label: 'Bank', value: accounts.filter(a => a.type === 'BANK').length },
                  { label: 'Credit', value: accounts.filter(a => a.type === 'CREDIT_CARD').length },
                  { label: 'Cash', value: accounts.filter(a => a.type === 'CASH').length },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-white/30">{label}</p>
                    <p className="text-lg font-bold text-white/80 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AccountList />
      </div>
    </>
  )
}
