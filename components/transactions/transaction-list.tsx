'use client'

import { useState } from 'react'
import { Plus, ArrowLeftRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { useUIStore } from '@/store/ui-store'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { TransactionFiltersBar } from '@/components/transactions/transaction-filters'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import type { TransactionFilters } from '@/types'

const DEFAULT_PAGE_SIZE = 20

export function TransactionList() {
  const { isAddTransactionOpen, openAddTransaction, closeAddTransaction } = useUIStore()
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: 'all',
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  const { data, isLoading, isError } = useTransactions(filters)

  const transactions = data?.transactions ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE)
  const page = filters.page ?? 1

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filters */}
      <TransactionFiltersBar filters={filters} onChange={setFilters} />

      {/* Content */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {isLoading && (
          <div className="p-4 sm:p-5 space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3 bg-white/5" />
                  <Skeleton className="h-2.5 w-1/4 bg-white/5" />
                </div>
                <Skeleton className="h-4 w-16 bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-sm text-rose-400">Failed to load transactions.</p>
          </div>
        )}

        {!isLoading && !isError && transactions.length === 0 && (
          <div className="p-10 sm:p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06] mx-auto mb-4">
              <ArrowLeftRight className="h-6 w-6 text-white/20" />
            </div>
            <h3 className="font-medium text-white/60 mb-1">No transactions found</h3>
            <p className="text-sm text-white/30 mb-5">
              {filters.accountId || filters.type || filters.category
                ? 'Try adjusting your filters.'
                : 'Start tracking your income and expenses.'}
            </p>
            <Button
              onClick={() => openAddTransaction()}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add transaction
            </Button>
          </div>
        )}

        {!isLoading && !isError && transactions.length > 0 && (
          <>
            <div className="px-4 sm:px-5">
              {transactions.map((transaction, idx) => (
                <div key={transaction.id}>
                  <TransactionItem transaction={transaction} showAccount />
                  {idx < transactions.length - 1 && (
                    <div className="h-px bg-white/[0.04]" />
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 sm:px-5 py-3">
                <p className="text-xs text-white/30">
                  Page {page} of {totalPages}
                  <span className="hidden sm:inline"> · {total} total</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-white/[0.08] hover:bg-white/[0.05] text-white/40 hover:text-white/70"
                    disabled={page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-white/[0.08] hover:bg-white/[0.05] text-white/40 hover:text-white/70"
                    disabled={page >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isAddTransactionOpen} onOpenChange={closeAddTransaction}>
        <TransactionForm />
      </Dialog>
    </div>
  )
}
