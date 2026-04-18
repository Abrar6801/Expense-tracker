'use client'

import { Plus } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
import { AccountList } from '@/components/accounts/account-list'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
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
          <Button size="sm" className="h-8 text-xs" onClick={openAddAccount}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Accounts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your bank accounts and credit cards
            </p>
          </div>
          <Button onClick={openAddAccount}>
            <Plus className="mr-2 h-4 w-4" />
            Add account
          </Button>
        </div>

        {/* Total balance summary */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Total net worth
                </p>
                {isLoading ? (
                  <Skeleton className="mt-1.5 h-8 w-40" />
                ) : (
                  <p
                    className={`mt-1 text-3xl font-bold font-mono tracking-tight ${
                      totalBalance < 0 ? 'text-red-400' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(totalBalance)}
                  </p>
                )}
              </div>
              {!isLoading && accounts && (
                <div className="sm:ml-auto flex gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Accounts</p>
                    <p className="text-lg font-semibold mt-0.5">{accounts.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="text-lg font-semibold mt-0.5">
                      {accounts.filter((a) => a.type === 'BANK').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Credit</p>
                    <p className="text-lg font-semibold mt-0.5">
                      {accounts.filter((a) => a.type === 'CREDIT_CARD').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cash</p>
                    <p className="text-lg font-semibold mt-0.5">
                      {accounts.filter((a) => a.type === 'CASH').length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AccountList />
      </div>
    </>
  )
}
