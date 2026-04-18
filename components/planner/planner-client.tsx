'use client'

import { useState } from 'react'
import { Trash2, Plus, TrendingDown, Wallet, Calculator } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { usePlannedExpenses, useCreatePlannedExpense, useDeletePlannedExpense } from '@/hooks/use-planned-expenses'
import { PRESET_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface PlannerClientProps {
  email?: string
}

export function PlannerClient({ email }: PlannerClientProps) {
  const { data: accounts, isLoading: accountsLoading } = useAccounts()
  const { data: items, isLoading: itemsLoading } = usePlannedExpenses()
  const createItem = useCreatePlannedExpense()
  const deleteItem = useDeletePlannedExpense()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')

  const isLoading = accountsLoading || itemsLoading

  // Projections: group planned expenses by account
  const plannedByAccount: Record<string, number> = {}
  for (const item of items ?? []) {
    plannedByAccount[item.accountId] = (plannedByAccount[item.accountId] ?? 0) + parseFloat(item.amount)
  }

  const totalPlanned = Object.values(plannedByAccount).reduce((a, b) => a + b, 0)
  const currentNetWorth = accounts?.reduce((s, a) => s + parseFloat(a.balance), 0) ?? 0
  const projectedNetWorth = currentNetWorth - totalPlanned

  async function handleAdd() {
    if (!name.trim() || !amount || !category || !accountId) return
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    await createItem.mutateAsync({ name: name.trim(), amount: num, category, accountId })
    setName('')
    setAmount('')
    setCategory('')
    setAccountId('')
  }

  return (
    <>
      <Header title="Budget Planner" email={email} />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-xl font-semibold">Budget Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add potential expenses to see your projected balances
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Planned</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-0.5" />
                  ) : (
                    <p className="text-xl font-bold font-mono text-red-400">
                      -{formatCurrency(totalPlanned)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Net Worth</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-0.5" />
                  ) : (
                    <p className="text-xl font-bold font-mono">{formatCurrency(currentNetWorth)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                    projectedNetWorth < 0 ? 'bg-red-500/10' : 'bg-green-500/10'
                  }`}
                >
                  <Calculator
                    className={`h-4 w-4 ${projectedNetWorth < 0 ? 'text-red-400' : 'text-green-400'}`}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projected Net Worth</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-0.5" />
                  ) : (
                    <p
                      className={`text-xl font-bold font-mono ${
                        projectedNetWorth < 0 ? 'text-red-400' : 'text-green-400'
                      }`}
                    >
                      {formatCurrency(projectedNetWorth)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add form */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Add Planned Expense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="e.g. Monthly Rent"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({formatCurrency(parseFloat(a.balance), a.currency)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleAdd}
                disabled={!name.trim() || !amount || !category || !accountId || createItem.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Planner
              </Button>
            </CardContent>
          </Card>

          {/* Account projections */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Account Projections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : accounts?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No accounts found</p>
              ) : (
                accounts?.map(account => {
                  const current = parseFloat(account.balance)
                  const deductions = plannedByAccount[account.id] ?? 0
                  const projected = current - deductions

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: account.color ?? '#6366f1' }}
                        />
                        <div>
                          <p className="text-sm font-medium">{account.name}</p>
                          {deductions > 0 && (
                            <p className="text-xs text-red-400">-{formatCurrency(deductions, account.currency)}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatCurrency(current, account.currency)}
                        </p>
                        <p
                          className={`text-sm font-bold font-mono ${
                            projected < 0 ? 'text-red-400' : 'text-foreground'
                          }`}
                        >
                          → {formatCurrency(projected, account.currency)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Planned expenses list */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              Planned Expenses
              {items && items.length > 0 && (
                <Badge variant="outline" className="ml-2 font-normal">{items.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !items || items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No planned expenses yet. Add one above to see projections.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.account.color ?? '#6366f1' }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category} · {item.account.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="text-sm font-bold font-mono text-red-400">
                        -{formatCurrency(parseFloat(item.amount), item.account.currency)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteItem.mutate(item.id)}
                        disabled={deleteItem.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
