'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard, Building2, Plus, Banknote } from 'lucide-react'
import { AccountType } from '@prisma/client'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { AccountForm } from '@/components/accounts/account-form'

export function AccountSummary() {
  const { data: accounts, isLoading } = useAccounts()
  const { isAddAccountOpen, openAddAccount, closeAddAccount } = useUIStore()

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm font-semibold text-white">Accounts</h3>
            <p className="text-xs text-white/35 mt-0.5">
              {isLoading ? '—' : `${accounts?.length ?? 0} accounts`}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
            <Link href="/accounts">
              Manage
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />
              ))}
            </div>
          )}

          {!isLoading && accounts?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              <p className="text-sm text-white/30">No accounts yet</p>
              <Button size="sm" variant="outline" onClick={openAddAccount} className="border-white/10 text-white/50 hover:text-white hover:bg-white/5 h-7 text-xs">
                <Plus className="mr-1.5 h-3 w-3" />
                Add account
              </Button>
            </div>
          )}

          {!isLoading && accounts?.map((account) => {
            const balance = parseFloat(account.balance)
            const isCreditCard = account.type === AccountType.CREDIT_CARD
            const isCash = account.type === AccountType.CASH
            const color = account.color ?? '#7c3aed'

            return (
              <div
                key={account.id}
                className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.03] transition-colors cursor-default"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${color}18`, border: `1px solid ${color}25` }}
                >
                  {isCreditCard ? (
                    <CreditCard className="h-4 w-4" style={{ color }} />
                  ) : isCash ? (
                    <Banknote className="h-4 w-4" style={{ color }} />
                  ) : (
                    <Building2 className="h-4 w-4" style={{ color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{account.name}</p>
                  {account.lastFour && (
                    <p className="text-[10px] text-white/30 font-mono">••{account.lastFour}</p>
                  )}
                </div>
                <p className={`text-sm font-bold font-mono shrink-0 ${balance < 0 ? 'text-rose-400' : 'text-white/90'}`}>
                  {formatCurrency(balance, account.currency)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isAddAccountOpen} onOpenChange={closeAddAccount}>
        <AccountForm />
      </Dialog>
    </>
  )
}
