'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { createTransactionSchema, type CreateTransactionInput } from '@/lib/validations'
import { useCreateTransaction, useUpdateTransaction, useCreateTransfer } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories, useAddCategory } from '@/hooks/use-categories'
import { useUIStore } from '@/store/ui-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function TransactionForm() {
  const { editingTransaction, closeAddTransaction, closeEditTransaction, defaultAccountId } =
    useUIStore()
  const isEditing = !!editingTransaction
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const createTransfer = useCreateTransfer()
  const addCategory = useAddCategory()
  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useCategories()
  const isPending = createTransaction.isPending || updateTransaction.isPending || createTransfer.isPending

  // Transfer-specific state
  const [transferFromId, setTransferFromId] = useState('')
  const [transferToId, setTransferToId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDate, setTransferDate] = useState<Date>(new Date())
  const [transferNote, setTransferNote] = useState('')

  const accounts = accountsData ?? []
  const categories = categoriesData?.categories ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: TransactionType.EXPENSE,
      date: new Date(),
      accountId: defaultAccountId ?? accounts[0]?.id,
    },
  })

  const selectedType = watch('type')
  const selectedDate = watch('date')
  const selectedAccount = watch('accountId')

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        accountId: editingTransaction.accountId,
        amount: parseFloat(editingTransaction.amount),
        category: editingTransaction.category,
        description: editingTransaction.description ?? '',
        date: new Date(editingTransaction.date),
      })
    } else {
      reset({
        type: TransactionType.EXPENSE,
        date: new Date(),
        accountId: defaultAccountId ?? accounts[0]?.id,
      })
    }
  }, [editingTransaction, accounts, defaultAccountId, reset])

  function onClose() {
    isEditing ? closeEditTransaction() : closeAddTransaction()
  }

  async function onSubmit(data: CreateTransactionInput) {
    if (isEditing) {
      await updateTransaction.mutateAsync({ id: editingTransaction.id, ...data })
    } else {
      await createTransaction.mutateAsync(data)
    }
    onClose()
  }

  async function onSubmitTransfer() {
    const amt = parseFloat(transferAmount)
    if (!transferFromId || !transferToId || isNaN(amt) || amt <= 0) return
    await createTransfer.mutateAsync({
      fromAccountId: transferFromId,
      toAccountId: transferToId,
      amount: amt,
      date: transferDate,
      description: transferNote || undefined,
    })
    onClose()
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return
    await addCategory.mutateAsync(newCategory.trim())
    setValue('category', newCategory.trim())
    setNewCategory('')
    setShowNewCategory(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update the transaction details.' : 'Record an income or expense.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={selectedType === TransactionType.TRANSFER ? (e) => { e.preventDefault(); onSubmitTransfer() } : handleSubmit(onSubmit)} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-3 gap-2">
          {[TransactionType.EXPENSE, TransactionType.INCOME, TransactionType.TRANSFER].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              disabled={isPending || isEditing}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                selectedType === type && type === TransactionType.EXPENSE
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : selectedType === type && type === TransactionType.INCOME
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : selectedType === type && type === TransactionType.TRANSFER
                      ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                      : 'border-border bg-background text-muted-foreground hover:border-border/80'
              )}
            >
              {type === TransactionType.EXPENSE ? 'Expense' : type === TransactionType.INCOME ? 'Income' : 'Transfer'}
            </button>
          ))}
        </div>

        {/* Transfer fields */}
        {selectedType === TransactionType.TRANSFER && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>From account</Label>
              <Select value={transferFromId} onValueChange={setTransferFromId} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.id !== transferToId).map(a => (
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
            <div className="space-y-2">
              <Label>To account</Label>
              <Select value={transferToId} onValueChange={setTransferToId} disabled={isPending}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {accounts.filter(a => a.id !== transferFromId).map(a => (
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
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker value={transferDate} onChange={d => d && setTransferDate(d)} disabled={isPending} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Input placeholder="Add a note..." value={transferNote} onChange={e => setTransferNote(e.target.value)} disabled={isPending} />
            </div>
          </div>
        )}

        {selectedType !== TransactionType.TRANSFER && (
          <>
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                disabled={isPending}
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Account */}
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={selectedAccount}
                onValueChange={(v) => setValue('accountId', v)}
                disabled={isPending || accounts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={accounts.length === 0 ? 'No accounts yet' : 'Select account'} />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: account.color ?? '#6366f1' }}
                        />
                        {account.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountId && (
                <p className="text-xs text-destructive">{errors.accountId.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-xs text-primary hover:underline"
                >
                  {showNewCategory ? 'Cancel' : '+ New category'}
                </button>
              </div>

              {showNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleAddCategory}
                    disabled={addCategory.isPending || !newCategory.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={watch('category') ?? ''}
                  onValueChange={(v) => setValue('category', v, { shouldValidate: true })}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={selectedDate instanceof Date ? selectedDate : new Date(selectedDate)}
                onChange={(date) => date && setValue('date', date)}
                disabled={isPending}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Note (optional)</Label>
              <Input
                id="description"
                placeholder="Add a note..."
                disabled={isPending}
                {...register('description')}
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isPending ||
              (selectedType === TransactionType.TRANSFER
                ? !transferFromId || !transferToId || !transferAmount
                : accounts.length === 0)
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save changes' : selectedType === TransactionType.TRANSFER ? 'Transfer' : 'Add transaction'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
