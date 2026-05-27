'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, Copy } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { useBulkCreateTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories, useAddCategory } from '@/hooks/use-categories'
import { useUIStore } from '@/store/ui-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { SerializedAccount } from '@/types'

type TransactionRow = {
  id: string
  type: 'EXPENSE' | 'INCOME'
  amount: string
  accountId: string
  category: string
  description: string
  date: Date
}

type RowErrors = {
  amount?: string
  accountId?: string
  category?: string
}

type FormErrors = {
  globalAccountId?: string
  rows: Record<number, RowErrors>
}

let rowCounter = 0
function createRow(): TransactionRow {
  return {
    id: `row-${++rowCounter}`,
    type: 'EXPENSE',
    amount: '',
    accountId: '',
    category: '',
    description: '',
    date: new Date(),
  }
}

function AccountSelectField({
  value,
  onChange,
  error,
  accounts,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
  accounts: SerializedAccount[]
  disabled: boolean
}) {
  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={onChange} disabled={disabled || accounts.length === 0}>
        <SelectTrigger
          className={cn(
            'h-9 bg-white/[0.04] border-white/[0.08] text-sm',
            error && 'border-rose-500/50'
          )}
        >
          <SelectValue placeholder={accounts.length === 0 ? 'No accounts' : 'Account'} />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: a.color ?? '#6366f1' }}
                />
                {a.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export function BulkTransactionForm() {
  const { closeAddBulkTransaction } = useUIStore()
  const bulkCreate = useBulkCreateTransactions()
  const { data: accountsData } = useAccounts()
  const { data: categoriesData } = useCategories()
  const addCategory = useAddCategory()

  const accounts = accountsData ?? []
  const categories = categoriesData?.categories ?? []

  const [rows, setRows] = useState<TransactionRow[]>([createRow()])
  const [accountMode, setAccountMode] = useState<'global' | 'per-row'>('per-row')
  const [globalAccountId, setGlobalAccountId] = useState('')
  const [errors, setErrors] = useState<FormErrors>({ rows: {} })

  const [showNewCategoryFor, setShowNewCategoryFor] = useState<string | null>(null)
  const [newCategoryValue, setNewCategoryValue] = useState('')

  const isPending = bulkCreate.isPending

  function updateRow(id: string, patch: Partial<TransactionRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    if (rows.length >= 100) return
    setRows((prev) => [...prev, createRow()])
  }

  function duplicateRow(row: TransactionRow) {
    if (rows.length >= 100) return
    const newRow: TransactionRow = { ...row, id: `row-${++rowCounter}`, amount: '' }
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id)
      const next = [...prev]
      next.splice(idx + 1, 0, newRow)
      return next
    })
  }

  function removeRow(id: string) {
    if (rows.length === 1) return
    setRows((prev) => prev.filter((r) => r.id !== id))
    setErrors((prev) => {
      const removedIdx = rows.findIndex((r) => r.id === id)
      const remapped: Record<number, RowErrors> = {}
      Object.entries(prev.rows).forEach(([key, val]) => {
        const k = Number(key)
        if (k < removedIdx) remapped[k] = val
        else if (k > removedIdx) remapped[k - 1] = val
        // k === removedIdx is dropped
      })
      return { ...prev, rows: remapped }
    })
  }

  async function handleAddCategory(rowId: string) {
    if (!newCategoryValue.trim()) return
    try {
      await addCategory.mutateAsync(newCategoryValue.trim())
      updateRow(rowId, { category: newCategoryValue.trim() })
    } finally {
      setNewCategoryValue('')
      setShowNewCategoryFor(null)
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = { rows: {} }
    let valid = true

    if (accountMode === 'global' && !globalAccountId) {
      newErrors.globalAccountId = 'Select an account to apply to all'
      valid = false
    }

    rows.forEach((row, i) => {
      const rowErrors: RowErrors = {}
      const amount = parseFloat(row.amount)
      if (!row.amount || isNaN(amount) || amount <= 0) {
        rowErrors.amount = 'Enter a valid amount'
        valid = false
      } else if (amount > 9_999_999) {
        rowErrors.amount = 'Amount too large'
        valid = false
      }
      if (accountMode === 'per-row' && !row.accountId) {
        rowErrors.accountId = 'Select an account'
        valid = false
      }
      if (!row.category) {
        rowErrors.category = 'Select a category'
        valid = false
      }
      if (Object.keys(rowErrors).length > 0) {
        newErrors.rows[i] = rowErrors
      }
    })

    setErrors(newErrors)
    return valid
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const transactions = rows.map((row) => ({
      accountId: accountMode === 'global' ? globalAccountId : row.accountId,
      type: row.type as TransactionType,
      amount: parseFloat(row.amount),
      category: row.category,
      description: row.description || undefined,
      date: row.date,
    }))

    try {
      await bulkCreate.mutateAsync({ transactions })
      closeAddBulkTransaction()
    } catch {
      // onError in useBulkCreateTransactions shows the toast; dialog stays open for retry
    }
  }

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
      <DialogHeader className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <DialogTitle>Add multiple transactions</DialogTitle>
        <DialogDescription>Add up to 100 transactions at once.</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Account mode selector */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">Account</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAccountMode('per-row')
                setErrors((prev) => ({ ...prev, globalAccountId: undefined }))
              }}
              disabled={isPending}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left',
                accountMode === 'per-row'
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-white/[0.08] bg-transparent text-white/40 hover:text-white/60'
              )}
            >
              <span className="block text-xs font-semibold mb-0.5">Per transaction</span>
              <span className="text-xs opacity-70">Each row picks its own account</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountMode('global')}
              disabled={isPending}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-all text-left',
                accountMode === 'global'
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-white/[0.08] bg-transparent text-white/40 hover:text-white/60'
              )}
            >
              <span className="block text-xs font-semibold mb-0.5">One for all</span>
              <span className="text-xs opacity-70">Same account for every row</span>
            </button>
          </div>

          {accountMode === 'global' && (
            <div className="mt-3">
              <AccountSelectField
                value={globalAccountId}
                onChange={(v) => {
                  setGlobalAccountId(v)
                  setErrors((prev) => ({ ...prev, globalAccountId: undefined }))
                }}
                error={errors.globalAccountId}
                accounts={accounts}
                disabled={isPending}
              />
            </div>
          )}
        </div>

        {/* Transaction rows */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-3 p-5">
            {rows.map((row, idx) => {
              const rowErr = errors.rows[idx]
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 space-y-3"
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
                      Transaction {idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateRow(row)}
                        disabled={rows.length >= 100 || isPending}
                        title="Duplicate row"
                        className="text-white/20 hover:text-white/50 transition-colors disabled:opacity-30 p-1 rounded"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1 || isPending}
                        title="Remove row"
                        className="text-white/20 hover:text-rose-400 transition-colors disabled:opacity-30 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Type + Amount */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid grid-cols-2 gap-1">
                      {(['EXPENSE', 'INCOME'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateRow(row.id, { type: t })}
                          disabled={isPending}
                          className={cn(
                            'rounded-lg border px-2 py-1.5 text-xs font-medium transition-all',
                            row.type === t && t === 'EXPENSE'
                              ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                              : row.type === t && t === 'INCOME'
                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                                : 'border-white/[0.08] bg-transparent text-white/30 hover:text-white/50'
                          )}
                        >
                          {t === 'EXPENSE' ? 'Expense' : 'Income'}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={(e) => {
                          updateRow(row.id, { amount: e.target.value })
                          if (rowErr?.amount)
                            setErrors((prev) => ({
                              ...prev,
                              rows: { ...prev.rows, [idx]: { ...rowErr, amount: undefined } },
                            }))
                        }}
                        disabled={isPending}
                        className={cn(
                          'h-9 bg-white/[0.04] border-white/[0.08] text-sm',
                          rowErr?.amount && 'border-rose-500/50'
                        )}
                      />
                      {rowErr?.amount && <p className="text-xs text-rose-400">{rowErr.amount}</p>}
                    </div>
                  </div>

                  {/* Account (per-row mode) + Category */}
                  <div className={cn('gap-2', accountMode === 'per-row' ? 'grid grid-cols-2' : 'block')}>
                    {accountMode === 'per-row' && (
                      <AccountSelectField
                        value={row.accountId}
                        onChange={(v) => {
                          updateRow(row.id, { accountId: v })
                          if (rowErr?.accountId)
                            setErrors((prev) => ({
                              ...prev,
                              rows: { ...prev.rows, [idx]: { ...rowErr, accountId: undefined } },
                            }))
                        }}
                        error={rowErr?.accountId}
                        accounts={accounts}
                        disabled={isPending}
                      />
                    )}

                    <div className="space-y-1">
                      {showNewCategoryFor === row.id ? (
                        <div className="flex gap-1">
                          <Input
                            placeholder="New category"
                            value={newCategoryValue}
                            onChange={(e) => setNewCategoryValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddCategory(row.id)
                              }
                              if (e.key === 'Escape') {
                                setShowNewCategoryFor(null)
                                setNewCategoryValue('')
                              }
                            }}
                            className="h-9 bg-white/[0.04] border-white/[0.08] text-sm"
                            autoFocus
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 shrink-0 border-white/[0.08]"
                            onClick={() => handleAddCategory(row.id)}
                            disabled={addCategory.isPending || !newCategoryValue.trim()}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={row.category}
                          onValueChange={(v) => {
                            if (v === '__new__') {
                              setShowNewCategoryFor(row.id)
                              setNewCategoryValue('')
                              return
                            }
                            updateRow(row.id, { category: v })
                            if (rowErr?.category)
                              setErrors((prev) => ({
                                ...prev,
                                rows: { ...prev.rows, [idx]: { ...rowErr, category: undefined } },
                              }))
                          }}
                          disabled={isPending}
                        >
                          <SelectTrigger
                            className={cn(
                              'h-9 bg-white/[0.04] border-white/[0.08] text-sm',
                              rowErr?.category && 'border-rose-500/50'
                            )}
                          >
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                            <SelectItem value="__new__" className="text-violet-400">
                              + New category
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {rowErr?.category && <p className="text-xs text-rose-400">{rowErr.category}</p>}
                    </div>
                  </div>

                  {/* Date + Note */}
                  <div className="grid grid-cols-2 gap-2">
                    <DatePicker
                      value={row.date}
                      onChange={(d) => d && updateRow(row.id, { date: d })}
                      disabled={isPending}
                    />
                    <Input
                      placeholder="Note (optional)"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      disabled={isPending}
                      className="h-9 bg-white/[0.04] border-white/[0.08] text-sm"
                    />
                  </div>
                </div>
              )
            })}

            {rows.length < 100 && (
              <button
                type="button"
                onClick={addRow}
                disabled={isPending}
                className="w-full rounded-xl border border-dashed border-white/[0.12] py-3 text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add another transaction
                <span className="text-white/20">({rows.length}/100)</span>
              </button>
            )}
          </div>
        </div>

        <DialogFooter className="px-5 py-4 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="outline"
            onClick={closeAddBulkTransaction}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending || accounts.length === 0}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {rows.length} transaction{rows.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
