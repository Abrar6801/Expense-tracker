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
import { Separator } from '@/components/ui/separator'
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Transactions</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? '—' : `${total} transaction${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={() => openAddTransaction()} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Add transaction
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersBar filters={filters} onChange={setFilters} />

      {/* Content */}
      <div className="rounded-xl border border-border bg-card">
        {isLoading && (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">Failed to load transactions.</p>
          </div>
        )}

        {!isLoading && !isError && transactions.length === 0 && (
          <div className="p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-4">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No transactions found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.accountId || filters.type || filters.category
                ? 'Try adjusting your filters.'
                : 'Start tracking your income and expenses.'}
            </p>
            <Button onClick={() => openAddTransaction()}>
              <Plus className="mr-2 h-4 w-4" />
              Add transaction
            </Button>
          </div>
        )}

        {!isLoading && !isError && transactions.length > 0 && (
          <>
            <div className="px-4">
              {transactions.map((transaction, idx) => (
                <div key={transaction.id}>
                  <TransactionItem transaction={transaction} showAccount />
                  {idx < transactions.length - 1 && <Separator className="opacity-50" />}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
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
