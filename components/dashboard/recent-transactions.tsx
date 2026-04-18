'use client'

import Link from 'next/link'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { TransactionItem } from '@/components/transactions/transaction-item'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function RecentTransactions() {
  const { data, isLoading } = useTransactions({ pageSize: 10 })
  const transactions = data?.transactions ?? []

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent transactions</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Last 10 activity</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs h-7">
            <Link href="/transactions">
              View all
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
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

        {!isLoading && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <ArrowLeftRight className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground text-center">
              No transactions yet.
            </p>
          </div>
        )}

        {!isLoading && transactions.length > 0 && (
          <div>
            {transactions.map((transaction, idx) => (
              <div key={transaction.id}>
                <TransactionItem transaction={transaction} showAccount />
                {idx < transactions.length - 1 && <Separator className="opacity-50" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
