'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard, Building2, Plus } from 'lucide-react'
import { AccountType } from '@prisma/client'
import { useAccounts } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { AccountForm } from '@/components/accounts/account-form'

export function AccountSummary() {
  const { data: accounts, isLoading } = useAccounts()
  const { isAddAccountOpen, openAddAccount, closeAddAccount } = useUIStore()

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Accounts</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoading ? '—' : `${accounts?.length ?? 0} accounts`}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs h-7">
              <Link href="/accounts">
                Manage
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          )}

          {!isLoading && accounts?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-20 gap-2">
              <p className="text-sm text-muted-foreground">No accounts yet</p>
              <Button size="sm" variant="outline" onClick={openAddAccount}>
                <Plus className="mr-1.5 h-3 w-3" />
                Add account
              </Button>
            </div>
          )}

          {!isLoading &&
            accounts?.map((account) => {
              const balance = parseFloat(account.balance)
              const isCreditCard = account.type === AccountType.CREDIT_CARD
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-3 rounded-lg p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${account.color ?? '#6366f1'}20` }}
                  >
                    {isCreditCard ? (
                      <CreditCard
                        className="h-4 w-4"
                        style={{ color: account.color ?? '#6366f1' }}
                      />
                    ) : (
                      <Building2
                        className="h-4 w-4"
                        style={{ color: account.color ?? '#6366f1' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    {account.lastFour && (
                      <p className="text-xs text-muted-foreground font-mono">
                        ••{account.lastFour}
                      </p>
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold font-mono shrink-0 ${
                      balance < 0 ? 'text-red-400' : 'text-foreground'
                    }`}
                  >
                    {formatCurrency(balance, account.currency)}
                  </p>
                </div>
              )
            })}
        </CardContent>
      </Card>

      <Dialog open={isAddAccountOpen} onOpenChange={closeAddAccount}>
        <AccountForm />
      </Dialog>
    </>
  )
}
