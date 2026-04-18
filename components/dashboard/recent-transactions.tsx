'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

export function RecentTransactions() {
  const { data, isLoading } = useTransactions({ pageSize: 10 })
  const transactions = data?.transactions ?? []

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
          <p className="text-xs text-white/35 mt-0.5">Last 10 activity</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs h-7 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10">
          <Link href="/transactions">
            View all
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="px-5 py-2">
        {isLoading && (
          <div className="space-y-1 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Skeleton className="h-9 w-9 rounded-xl bg-white/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3 bg-white/5" />
                  <Skeleton className="h-2.5 w-1/4 bg-white/5" />
                </div>
                <Skeleton className="h-4 w-16 bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-36 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <ArrowLeftRight className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/30">No transactions yet</p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div>
            {transactions.map((transaction, idx) => (
              <div key={transaction.id}>
                <TransactionItem transaction={transaction} showAccount />
                {idx < transactions.length - 1 && (
                  <div className="h-px bg-white/[0.04] mx-1" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
