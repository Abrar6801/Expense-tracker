'use client'

import { useState } from 'react'
import { Trash2, Plus, TrendingDown, TrendingUp, Wallet, Calculator, Users, Banknote } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { usePlannedExpenses, useCreatePlannedExpense, useDeletePlannedExpense } from '@/hooks/use-planned-expenses'
import { useExpectedIncome, useCreateExpectedIncome, useDeleteExpectedIncome } from '@/hooks/use-expected-income'
import { PRESET_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Header } from '@/components/layout/header'
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
  const { data: incomeItems, isLoading: incomeLoading } = useExpectedIncome()
  const createItem = useCreatePlannedExpense()
  const deleteItem = useDeletePlannedExpense()
  const createIncome = useCreateExpectedIncome()
  const deleteIncome = useDeleteExpectedIncome()

  // Planned expense form
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')

  // Expected income form
  const [incomeName, setIncomeName] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeType, setIncomeType] = useState<'INCOME_SOURCE' | 'MONEY_OWED'>('INCOME_SOURCE')
  const [incomeFrom, setIncomeFrom] = useState('')
  const [incomeNotes, setIncomeNotes] = useState('')

  const isLoading = accountsLoading || itemsLoading || incomeLoading

  const plannedByAccount: Record<string, number> = {}
  for (const item of items ?? []) {
    plannedByAccount[item.accountId] = (plannedByAccount[item.accountId] ?? 0) + parseFloat(item.amount)
  }

  const totalPlanned = Object.values(plannedByAccount).reduce((a, b) => a + b, 0)
  const totalExpectedIncome = (incomeItems ?? []).reduce((s, i) => s + parseFloat(i.amount), 0)
  const currentNetWorth = accounts?.reduce((s, a) => s + parseFloat(a.balance), 0) ?? 0
  const projectedNetWorth = currentNetWorth - totalPlanned + totalExpectedIncome

  async function handleAddExpense() {
    if (!name.trim() || !amount || !category || !accountId) return
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return
    await createItem.mutateAsync({ name: name.trim(), amount: num, category, accountId })
    setName(''); setAmount(''); setCategory(''); setAccountId('')
  }

  async function handleAddIncome() {
    if (!incomeName.trim() || !incomeAmount) return
    const num = parseFloat(incomeAmount)
    if (isNaN(num) || num <= 0) return
    await createIncome.mutateAsync({
      name: incomeName.trim(),
      amount: num,
      type: incomeType,
      from: incomeFrom.trim() || undefined,
      notes: incomeNotes.trim() || undefined,
    })
    setIncomeName(''); setIncomeAmount(''); setIncomeType('INCOME_SOURCE'); setIncomeFrom(''); setIncomeNotes('')
  }

  return (
    <>
      <Header title="Budget Planner" email={email} />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold tracking-tight text-white">Budget Planner</h1>
          <p className="text-sm text-white/40 mt-1">Plan expenses and track expected income to project your finances</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {[
            {
              label: 'Total Planned',
              value: `-${formatCurrency(totalPlanned)}`,
              icon: TrendingDown,
              color: '#fb7185',
              bg: 'rgba(244,63,94,0.12)',
            },
            {
              label: 'Expected Income',
              value: `+${formatCurrency(totalExpectedIncome)}`,
              icon: TrendingUp,
              color: '#34d399',
              bg: 'rgba(52,211,153,0.12)',
            },
            {
              label: 'Current Net Worth',
              value: formatCurrency(currentNetWorth),
              icon: Wallet,
              color: '#a78bfa',
              bg: 'rgba(139,92,246,0.12)',
            },
            {
              label: 'Projected Net Worth',
              value: formatCurrency(projectedNetWorth),
              icon: Calculator,
              color: projectedNetWorth < 0 ? '#fb7185' : '#34d399',
              bg: projectedNetWorth < 0 ? 'rgba(244,63,94,0.12)' : 'rgba(52,211,153,0.12)',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/30 truncate">{label}</p>
                  {isLoading ? (
                    <Skeleton className="h-5 w-20 mt-0.5 bg-white/5" />
                  ) : (
                    <p className="text-base font-bold font-mono" style={{ color }}>{value}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add planned expense form */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Add Planned Expense</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Name</Label>
              <Input placeholder="e.g. Monthly Rent" value={name} onChange={e => setName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-white/40">Amount</Label>
                <Input type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-white/40">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10">
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

            <Button className="w-full bg-gradient-to-r from-rose-600/80 to-rose-500/80 hover:from-rose-500/80 hover:to-rose-400/80 border-0"
              onClick={handleAddExpense}
              disabled={!name.trim() || !amount || !category || !accountId || createItem.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>

          {/* Add expected income form */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">Add Expected Income</h3>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['INCOME_SOURCE', 'MONEY_OWED'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setIncomeType(t)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${
                      incomeType === t
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70'
                    }`}
                  >
                    {t === 'INCOME_SOURCE' ? <Banknote className="h-3.5 w-3.5 shrink-0" /> : <Users className="h-3.5 w-3.5 shrink-0" />}
                    {t === 'INCOME_SOURCE' ? 'Income Source' : 'Money Owed'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">
                {incomeType === 'INCOME_SOURCE' ? 'Source Name' : 'Description'}
              </Label>
              <Input
                placeholder={incomeType === 'INCOME_SOURCE' ? 'e.g. Freelance Project' : 'e.g. Dinner split'}
                value={incomeName} onChange={e => setIncomeName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-white/40">Amount</Label>
                <Input type="number" placeholder="0.00" min="0" step="0.01" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-white/40">
                  {incomeType === 'MONEY_OWED' ? 'From (person)' : 'Notes (optional)'}
                </Label>
                <Input
                  placeholder={incomeType === 'MONEY_OWED' ? 'e.g. John' : 'Optional'}
                  value={incomeType === 'MONEY_OWED' ? incomeFrom : incomeNotes}
                  onChange={e => incomeType === 'MONEY_OWED' ? setIncomeFrom(e.target.value) : setIncomeNotes(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
              </div>
            </div>

            <Button className="w-full bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500/80 hover:to-emerald-400/80 border-0"
              onClick={handleAddIncome}
              disabled={!incomeName.trim() || !incomeAmount || createIncome.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </div>
        </div>

        {/* Account projections */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Account Projections</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full bg-white/5" />)}
            </div>
          ) : accounts?.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-6">No accounts found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accounts?.map(account => {
                const current = parseFloat(account.balance)
                const deductions = plannedByAccount[account.id] ?? 0
                const projected = current - deductions
                const color = account.color ?? '#7c3aed'
                return (
                  <div key={account.id} className="rounded-xl p-3 hover:bg-white/[0.03] transition-colors"
                    style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <p className="text-sm font-medium text-white/80 truncate">{account.name}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-white/30">Current</p>
                        <p className="text-xs font-mono text-white/60">{formatCurrency(current, account.currency)}</p>
                        {deductions > 0 && <p className="text-[10px] text-rose-400 mt-0.5">-{formatCurrency(deductions, account.currency)}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/30">Projected</p>
                        <p className={`text-sm font-bold font-mono ${projected < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatCurrency(projected, account.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Planned expenses list */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Planned Expenses</h3>
              {items && items.length > 0 && (
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{items.length}</Badge>
              )}
            </div>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}</div>
            ) : !items || items.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No planned expenses yet</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.account.color ?? '#7c3aed' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{item.name}</p>
                        <p className="text-[10px] text-white/30">{item.category} · {item.account.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold font-mono text-rose-400">
                        -{formatCurrency(parseFloat(item.amount), item.account.currency)}
                      </p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                        onClick={() => deleteItem.mutate(item.id)} disabled={deleteItem.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expected income list */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Expected Income & Owed</h3>
              {incomeItems && incomeItems.length > 0 && (
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{incomeItems.length}</Badge>
              )}
            </div>
            {incomeLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full bg-white/5" />)}</div>
            ) : !incomeItems || incomeItems.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-8">No expected income added yet</p>
            ) : (
              <div className="space-y-2">
                {incomeItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500/10">
                        {item.type === 'MONEY_OWED'
                          ? <Users className="h-3.5 w-3.5 text-emerald-400" />
                          : <Banknote className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{item.name}</p>
                        <p className="text-[10px] text-white/30">
                          {item.type === 'MONEY_OWED' ? 'Money Owed' : 'Income Source'}
                          {item.from ? ` · from ${item.from}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold font-mono text-emerald-400">
                        +{formatCurrency(parseFloat(item.amount))}
                      </p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                        onClick={() => deleteIncome.mutate(item.id)} disabled={deleteIncome.isPending}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
