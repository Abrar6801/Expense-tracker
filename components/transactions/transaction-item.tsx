'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { useUIStore } from '@/store/ui-store'
import { useDeleteTransaction } from '@/hooks/use-transactions'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SerializedTransaction } from '@/types'

interface TransactionItemProps {
  transaction: SerializedTransaction
  showAccount?: boolean
}

export function TransactionItem({ transaction, showAccount = false }: TransactionItemProps) {
  const { openEditTransaction } = useUIStore()
  const deleteTransaction = useDeleteTransaction()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isIncome = transaction.type === TransactionType.INCOME
  const isTransfer = transaction.type === TransactionType.TRANSFER
  const isTransferOut = transaction.category === 'Transfer Out'
  const amount = parseFloat(transaction.amount)

  return (
    <>
      <div className="flex items-center gap-3 py-3 group">
        {/* Category dot */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            backgroundColor: `${transaction.account?.color ?? '#6366f1'}20`,
            color: transaction.account?.color ?? '#6366f1',
          }}
        >
          {transaction.category.slice(0, 2).toUpperCase()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{transaction.category}</span>
            <Badge
              variant={isTransfer ? 'transfer' : isIncome ? 'income' : 'expense'}
              className="text-xs"
            >
              {isTransfer ? (isTransferOut ? '→ Transfer' : '← Transfer') : isIncome ? 'Income' : 'Expense'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">
              {formatDateShort(transaction.date)}
            </span>
            {showAccount && transaction.account && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: transaction.account.color ?? '#6366f1' }}
                  />
                  {transaction.account.name}
                </span>
              </>
            )}
            {transaction.description && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {transaction.description}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-sm font-semibold font-mono ${
              isTransfer ? 'text-blue-400' : isIncome ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isTransfer ? (isTransferOut ? '−' : '+') : isIncome ? '+' : '−'}
            {formatCurrency(amount, transaction.account?.currency ?? 'USD')}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Transaction options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditTransaction(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <DialogDescription>
              This will permanently delete this transaction and reverse its effect on the account
              balance. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteTransaction.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteTransaction.isPending}
              onClick={async () => {
                await deleteTransaction.mutateAsync(transaction.id)
                setShowDeleteDialog(false)
              }}
            >
              {deleteTransaction.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
