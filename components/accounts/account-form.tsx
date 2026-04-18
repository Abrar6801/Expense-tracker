'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { AccountType } from '@prisma/client'
import { createAccountSchema, type CreateAccountInput } from '@/lib/validations'
import { ACCOUNT_COLORS, CURRENCIES } from '@/lib/constants'
import { useCreateAccount, useUpdateAccount } from '@/hooks/use-accounts'
import { useUIStore } from '@/store/ui-store'
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function AccountForm() {
  const { editingAccount, isAddAccountOpen, closeAddAccount, closeEditAccount } = useUIStore()
  const isEditing = !!editingAccount

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const isPending = createAccount.isPending || updateAccount.isPending

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      type: AccountType.BANK,
      currency: 'USD',
      balance: 0,
      color: ACCOUNT_COLORS[0].value,
    },
  })

  const selectedColor = watch('color')
  const selectedType = watch('type')

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: parseFloat(editingAccount.balance),
        currency: editingAccount.currency,
        color: editingAccount.color ?? undefined,
        lastFour: editingAccount.lastFour ?? undefined,
      })
    } else {
      reset({
        type: AccountType.BANK,
        currency: 'USD',
        balance: 0,
        color: ACCOUNT_COLORS[0].value,
      })
    }
  }, [editingAccount, isAddAccountOpen, reset])

  function onClose() {
    isEditing ? closeEditAccount() : closeAddAccount()
  }

  async function onSubmit(data: CreateAccountInput) {
    // Credit card balances represent debt — store as negative if user entered positive
    if (data.type === AccountType.CREDIT_CARD && data.balance > 0) {
      data = { ...data, balance: -data.balance }
    }
    if (isEditing) {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...data })
    } else {
      await createAccount.mutateAsync(data)
    }
    onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit account' : 'Add account'}</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Update your account details.' : 'Add a bank account or credit card.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Account name</Label>
          <Input
            id="name"
            placeholder="e.g. Chase Checking"
            disabled={isPending}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label>Account type</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { type: AccountType.BANK, label: 'Bank' },
                { type: AccountType.CREDIT_CARD, label: 'Credit Card' },
                { type: AccountType.CASH, label: 'Cash' },
              ] as const
            ).map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('type', type)}
                disabled={isPending}
                className={cn(
                  'flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                  selectedType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <Label htmlFor="balance">
            {selectedType === AccountType.CREDIT_CARD ? 'Amount owed' : 'Current balance'}
          </Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            disabled={isPending}
            {...register('balance', { valueAsNumber: true })}
          />
          {selectedType === AccountType.CREDIT_CARD && (
            <p className="text-xs text-muted-foreground">Enter how much you owe — it will be stored as a negative balance.</p>
          )}
          {errors.balance && <p className="text-xs text-destructive">{errors.balance.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={watch('currency') ?? 'USD'}
              onValueChange={(v) => setValue('currency', v)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(({ label, value }) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Last four digits */}
          <div className="space-y-2">
            <Label htmlFor="lastFour">Last 4 digits (optional)</Label>
            <Input
              id="lastFour"
              placeholder="1234"
              maxLength={4}
              disabled={isPending}
              {...register('lastFour')}
            />
            {errors.lastFour && (
              <p className="text-xs text-destructive">{errors.lastFour.message}</p>
            )}
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                title={label}
                onClick={() => setValue('color', value)}
                disabled={isPending}
                className={cn(
                  'h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-all',
                  selectedColor === value
                    ? 'ring-2 ring-white scale-110'
                    : 'hover:scale-105 opacity-80'
                )}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save changes' : 'Add account'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
