'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2, Plus, CreditCard, Building2, Banknote, Loader2 } from 'lucide-react'
import { AccountType } from '@prisma/client'
import { useUIStore } from '@/store/ui-store'
import { useAccounts, useDeleteAccount } from '@/hooks/use-accounts'
import { useCreateTransfer } from '@/hooks/use-transactions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

  const color = account.color ?? '#7c3aed'

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl hover-lift group cursor-default" style={{
        background: `linear-gradient(135deg, ${color}22 0%, ${color}08 50%, rgba(255,255,255,0.02) 100%)`,
        border: `1px solid ${color}25`,
      }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full opacity-10" style={{ background: color }} />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full opacity-5" style={{ background: color }} />

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}20`, border: `1px solid ${color}30` }}
              >
                {isCreditCard ? (
                  <CreditCard className="h-5 w-5" style={{ color }} />
                ) : isCash ? (
                  <Banknote className="h-5 w-5" style={{ color }} />
                ) : (
                  <Building2 className="h-5 w-5" style={{ color }} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white/90 truncate">{account.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: `${color}20`, color }}>
                    {isCreditCard ? 'Credit' : isCash ? 'Cash' : 'Bank'}
                  </span>
                  {account.lastFour && (
                    <span className="text-[10px] text-white/30 font-mono">••{account.lastFour}</span>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 sm:h-8 sm:w-8 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 hover:bg-white/5"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass border-white/[0.08]">
                <DropdownMenuItem onClick={() => openEditAccount(account)} className="focus:bg-white/5">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAddTransaction(account.id)} className="focus:bg-white/5">
                  <Plus className="mr-2 h-4 w-4" />
                  Add transaction
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{isCreditCard ? 'Amount Owed' : 'Balance'}</p>
            <p className={`text-2xl sm:text-3xl font-bold font-mono tracking-tight ${isNegative ? 'text-rose-400' : 'text-white'}`}>
              {formatCurrency(Math.abs(balance), account.currency)}
            </p>
          </div>

          {isCreditCard && (
            <Button
              size="sm"
              className="mt-4 w-full h-10 text-sm border-0 font-semibold"
              style={{ background: `${color}25`, color }}
              onClick={() => { setPayAmount(''); setPayFromId(''); setPayFull(true); setShowPayDialog(true) }}
            >
              Make a Payment
            </Button>
          )}
        </div>
      </div>

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
