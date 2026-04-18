'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { useUIStore } from '@/store/ui-store'
import { useDeleteTransaction } from '@/hooks/use-transactions'
import { formatCurrency, formatDateShort } from '@/lib/utils'
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

  const amountColor = isTransfer ? '#60a5fa' : isIncome ? '#34d399' : '#fb7185'
  const amountPrefix = isTransfer ? (isTransferOut ? '−' : '+') : isIncome ? '+' : '−'

  const dotColor = isTransfer ? 'rgba(96,165,250,0.15)' : isIncome ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)'
  const dotTextColor = isTransfer ? '#60a5fa' : isIncome ? '#34d399' : '#fb7185'

  return (
    <>
      <div className="flex items-center gap-3 py-3 group">
        {/* Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold"
          style={{ background: dotColor, color: dotTextColor }}
        >
          {transaction.category.slice(0, 2).toUpperCase()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{transaction.category}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] text-white/30">{formatDateShort(transaction.date)}</span>
            {showAccount && transaction.account && (
              <>
                <span className="text-[10px] text-white/20">·</span>
                <span className="flex items-center gap-1 text-[10px] text-white/30">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: transaction.account.color ?? '#7c3aed' }}
                  />
                  {transaction.account.name}
                </span>
              </>
            )}
            {transaction.description && (
              <>
                <span className="text-[10px] text-white/20">·</span>
                <span className="text-[10px] text-white/30 truncate max-w-[100px]">
                  {transaction.description}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className="text-sm font-bold font-mono"
            style={{ color: amountColor }}
          >
            {amountPrefix}{formatCurrency(amount, transaction.account?.currency ?? 'USD')}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 hover:bg-white/5"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass border-white/[0.08]">
              <DropdownMenuItem onClick={() => openEditTransaction(transaction)} className="focus:bg-white/5">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm glass border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>Delete transaction</DialogTitle>
            <DialogDescription className="text-white/40">
              This will permanently delete this transaction and reverse its effect on the account balance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleteTransaction.isPending} className="border-white/10 hover:bg-white/5">
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
