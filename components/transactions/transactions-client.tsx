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
          <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-500 border-0" onClick={() => openAddTransaction()}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        }
      />

      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        {/* Page header — visible at md+ */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Transactions</h1>
            <p className="text-xs lg:text-sm text-white/40 mt-1">All your income and expenses in one place</p>
          </div>
          <Button
            onClick={() => openAddTransaction()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add transaction
          </Button>
        </div>

        <TransactionList />
      </div>
    </>
  )
}
