'use client'

import { Plus, CreditCard } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
import { AccountCard } from '@/components/accounts/account-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { AccountForm } from '@/components/accounts/account-form'

export function AccountList() {
  const { data: accounts, isLoading, isError } = useAccounts()
  const { isAddAccountOpen, openAddAccount, closeAddAccount } = useUIStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your accounts</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? '—' : `${accounts?.length ?? 0} account${accounts?.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={openAddAccount} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add account
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">Failed to load accounts. Please refresh.</p>
        </div>
      )}

      {!isLoading && !isError && accounts?.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-4">
            <CreditCard className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No accounts yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your bank accounts and credit cards to get started.
          </p>
          <Button onClick={openAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first account
          </Button>
        </div>
      )}

      {!isLoading && !isError && accounts && accounts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}

      <Dialog open={isAddAccountOpen} onOpenChange={closeAddAccount}>
        <AccountForm />
      </Dialog>
    </div>
  )
}
