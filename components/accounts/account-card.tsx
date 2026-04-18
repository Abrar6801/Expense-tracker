'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Plus, CreditCard, Building2, Banknote, Loader2 } from 'lucide-react'
import { AccountType } from '@prisma/client'
import { useUIStore } from '@/store/ui-store'
import { useAccounts, useDeleteAccount } from '@/hooks/use-accounts'
import { useCreateTransfer } from '@/hooks/use-transactions'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import type { SerializedAccount } from '@/types'

interface AccountCardProps {
  account: SerializedAccount
}

export function AccountCard({ account }: AccountCardProps) {
  const { openEditAccount, openAddTransaction } = useUIStore()
  const deleteAccount = useDeleteAccount()
  const createTransfer = useCreateTransfer()
  const { data: allAccounts } = useAccounts()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPayDialog, setShowPayDialog] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payFromId, setPayFromId] = useState('')
  const [payFull, setPayFull] = useState(true)

  // Accounts the user can pay from (exclude this credit card)
  const payableAccounts = allAccounts?.filter(a => a.id !== account.id) ?? []

  const balance = parseFloat(account.balance)
  const isNegative = balance < 0
  const isCreditCard = account.type === AccountType.CREDIT_CARD
  const isCash = account.type === AccountType.CASH

  return (
    <>
      <Card className="relative overflow-hidden transition-all hover:shadow-md hover:border-border/80 group">
        {/* Color accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
          style={{ backgroundColor: account.color ?? '#6366f1' }}
        />

        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${account.color ?? '#6366f1'}20` }}
              >
                {isCreditCard ? (
                  <CreditCard className="h-5 w-5" style={{ color: account.color ?? '#6366f1' }} />
                ) : isCash ? (
                  <Banknote className="h-5 w-5" style={{ color: account.color ?? '#6366f1' }} />
                ) : (
                  <Building2 className="h-5 w-5" style={{ color: account.color ?? '#6366f1' }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{account.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-xs py-0 px-1.5">
                    {isCreditCard ? 'Credit Card' : isCash ? 'Cash' : 'Bank'}
                  </Badge>
                  {account.lastFour && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ••{account.lastFour}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Account options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditAccount(account)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAddTransaction(account.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add transaction
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Balance */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">{isCreditCard ? 'Amount Owed' : 'Balance'}</p>
            <p
              className={`text-2xl font-bold font-mono tracking-tight ${
                isNegative ? 'text-red-400' : 'text-foreground'
              }`}
            >
              {formatCurrency(Math.abs(balance), account.currency)}
            </p>
          </div>

          {/* Credit card pay button */}
          {isCreditCard && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full h-8 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-400"
              onClick={() => { setPayAmount(''); setPayFromId(''); setPayFull(true); setShowPayDialog(true) }}
            >
              Make a Payment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Credit card payment dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Make a Payment</DialogTitle>
            <DialogDescription>
              Pay toward <strong>{account.name}</strong>. The source account will be debited and your credit card balance updated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Pay from */}
            <div className="space-y-2">
              <Label>Pay from</Label>
              <Select value={payFromId} onValueChange={setPayFromId} disabled={createTransfer.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {payableAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color ?? '#6366f1' }} />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount options */}
            <div className="space-y-2">
              <Label>Payment amount</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayFull(true)}
                  disabled={createTransfer.isPending}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    payFull
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <p className="text-xs font-medium">Full balance</p>
                  <p className="text-sm font-bold font-mono mt-0.5">
                    {formatCurrency(Math.abs(balance), account.currency)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => { setPayFull(false); setPayAmount('') }}
                  disabled={createTransfer.isPending}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                    !payFull
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <p className="text-xs font-medium">Custom amount</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Enter manually</p>
                </button>
              </div>
              {!payFull && (
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  disabled={createTransfer.isPending}
                  autoFocus
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)} disabled={createTransfer.isPending}>
              Cancel
            </Button>
            <Button
              disabled={
                createTransfer.isPending ||
                !payFromId ||
                (!payFull && (!payAmount || parseFloat(payAmount) <= 0))
              }
              onClick={async () => {
                const amount = payFull ? Math.abs(balance) : parseFloat(payAmount)
                await createTransfer.mutateAsync({
                  fromAccountId: payFromId,
                  toAccountId: account.id,
                  amount,
                  date: new Date(),
                  description: `Credit card payment – ${account.name}`,
                })
                setShowPayDialog(false)
              }}
            >
              {createTransfer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{account.name}</strong> and all{' '}
              <strong>associated transactions</strong>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteAccount.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAccount.isPending}
              onClick={async () => {
                await deleteAccount.mutateAsync(account.id)
                setShowDeleteDialog(false)
              }}
            >
              {deleteAccount.isPending ? 'Deleting...' : 'Delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
