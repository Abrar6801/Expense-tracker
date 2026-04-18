'use client'

import { Plus } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { TransactionList } from '@/components/transactions/transaction-list'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'

interface TransactionsClientProps {
  email?: string
}

export function TransactionsClient({ email }: TransactionsClientProps) {
  const { openAddTransaction } = useUIStore()

  return (
    <>
      <Header
        title="Transactions"
        email={email}
        action={
          <Button size="sm" className="h-8 text-xs" onClick={() => openAddTransaction()}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All your income and expenses in one place
            </p>
          </div>
          <Button onClick={() => openAddTransaction()}>
            <Plus className="mr-2 h-4 w-4" />
            Add transaction
          </Button>
        </div>

        <TransactionList />
      </div>
    </>
  )
}
