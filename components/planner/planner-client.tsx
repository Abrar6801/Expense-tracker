'use client'

import { useState } from 'react'
import { Trash2, Plus, TrendingDown, TrendingUp, Wallet, Calculator, Users, Banknote } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { usePlannedExpenses, useCreatePlannedExpense, useDeletePlannedExpense } from '@/hooks/use-planned-expenses'
import { useExpectedIncome, useCreateExpectedIncome, useDeleteExpectedIncome } from '@/hooks/use-expected-income'
import { PRESET_CATEGORIES } from '@/lib/constants'
import { formatCurrency, cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

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

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')

  // Expense form
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')

  // Income form
  const [incomeName, setIncomeName] = useState('')
  const [incomeAmount, setIncomeAmount] = useState('')
  const [incomeType, setIncomeType] = useState<'INCOME_SOURCE' | 'MONEY_OWED'>('INCOME_SOURCE')
  const [incomeFrom, setIncomeFrom] = useState('')

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
      name: incomeName.trim(), amount: num, type: incomeType,
      from: incomeFrom.trim() || undefined,
    })
    setIncomeName(''); setIncomeAmount(''); setIncomeType('INCOME_SOURCE'); setIncomeFrom('')
  }

  const stats = [
    { label: 'Total Planned', value: totalPlanned, prefix: '−', icon: TrendingDown, color: '#fb7185', bg: 'rgba(244,63,94,0.12)' },
    { label: 'Expected Income', value: totalExpectedIncome, prefix: '+', icon: TrendingUp, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { label: 'Current Net Worth', value: currentNetWorth, prefix: '', icon: Wallet, color: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Projected Net Worth', value: projectedNetWorth, prefix: '', icon: Calculator,
      color: projectedNetWorth < 0 ? '#fb7185' : '#34d399',
      bg: projectedNetWorth < 0 ? 'rgba(244,63,94,0.12)' : 'rgba(52,211,153,0.12)' },
  ]

  return (
    <>
      <Header title="Budget Planner" email={email} />

      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        {/* Page header */}
        <div className="hidden md:block">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Budget Planner</h1>
          <p className="text-xs lg:text-sm text-white/40 mt-1">Plan ahead and see your projected financial position</p>
        </div>

        {/* Stats — same style as dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {stats.map(({ label, value, prefix, icon: Icon, color, bg }) => (
            <div key={label} className="glass-card rounded-2xl p-4 sm:p-5 hover-lift cursor-default">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/30">{label}</p>
                  {isLoading
                    ? <Skeleton className="h-7 sm:h-8 w-20 sm:w-28 mt-1.5 bg-white/5" />
                    : <p className="mt-1.5 text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight font-mono" style={{ color }}>
                        {prefix}{formatCurrency(Math.abs(value))}
                      </p>
                  }
                </div>
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: tabbed form */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-white/[0.06]">
              {(['expense', 'income'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all',
                    activeTab === tab
                      ? tab === 'expense'
                        ? 'text-rose-400 border-b-2 border-rose-500'
                        : 'text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  {tab === 'expense' ? 'Planned Expense' : 'Expected Income'}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {activeTab === 'expense' ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Name</Label>
                    <Input placeholder="e.g. Monthly Rent" value={name} onChange={e => setName(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.08] focus:border-rose-500/40 text-white placeholder:text-white/20 h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-white/40">Amount</Label>
                      <Input type="number" placeholder="0.00" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.08] focus:border-rose-500/40 text-white placeholder:text-white/20 h-10" />
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
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">Deduct from account</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                      <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10">
                        <SelectValue placeholder="Select account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} · {formatCurrency(parseFloat(a.balance), a.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-10 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 hover:border-rose-500/40"
                    onClick={handleAddExpense}
                    disabled={!name.trim() || !amount || !category || !accountId || createItem.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {(['INCOME_SOURCE', 'MONEY_OWED'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setIncomeType(t)}
                        className={cn(
                          'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all text-left',
                          incomeType === t
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/70'
                        )}>
                        {t === 'INCOME_SOURCE' ? <Banknote className="h-3.5 w-3.5 shrink-0" /> : <Users className="h-3.5 w-3.5 shrink-0" />}
                        {t === 'INCOME_SOURCE' ? 'Income Source' : 'Money Owed'}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-white/40">
                      {incomeType === 'INCOME_SOURCE' ? 'Source name' : 'Description'}
                    </Label>
                    <Input
                      placeholder={incomeType === 'INCOME_SOURCE' ? 'e.g. Freelance Project' : 'e.g. Dinner split'}
                      value={incomeName} onChange={e => setIncomeName(e.target.value)}
                      className="bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/40 text-white placeholder:text-white/20 h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-wider text-white/40">Amount</Label>
                      <Input type="number" placeholder="0.00" min="0" step="0.01" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)}
                        className="bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/40 text-white placeholder:text-white/20 h-10" />
                    </div>
                    {incomeType === 'MONEY_OWED' && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-wider text-white/40">From (person)</Label>
                        <Input placeholder="e.g. John" value={incomeFrom} onChange={e => setIncomeFrom(e.target.value)}
                          className="bg-white/[0.04] border-white/[0.08] focus:border-emerald-500/40 text-white placeholder:text-white/20 h-10" />
                      </div>
                    )}
                  </div>
                  <Button className="w-full h-10 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40"
                    onClick={handleAddIncome}
                    disabled={!incomeName.trim() || !incomeAmount || createIncome.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Income
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right: account projections + combined list */}
          <div className="xl:col-span-2 space-y-6">
            {/* Account projections */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">Account Projections</h3>
                <p className="text-xs text-white/35 mt-0.5">After planned expenses</p>
              </div>
              <div className="px-5 py-4">
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl bg-white/5" />)}</div>
                ) : accounts?.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-4">No accounts found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {accounts?.map(account => {
                      const current = parseFloat(account.balance)
                      const deductions = plannedByAccount[account.id] ?? 0
                      const projected = current - deductions
                      const color = account.color ?? '#7c3aed'
                      return (
                        <div key={account.id} className="flex items-center justify-between rounded-xl p-3.5"
                          style={{ background: `${color}08`, border: `1px solid ${color}18` }}>
                          <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div>
                              <p className="text-sm font-medium text-white/80">{account.name}</p>
                              {deductions > 0 && <p className="text-[10px] text-rose-400">−{formatCurrency(deductions, account.currency)}</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-white/30 font-mono">{formatCurrency(current, account.currency)}</p>
                            <p className={`text-sm font-bold font-mono ${projected < 0 ? 'text-rose-400' : 'text-white/90'}`}>
                              → {formatCurrency(projected, account.currency)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Combined items list */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h3 className="text-sm font-semibold text-white">All Planned Items</h3>
                <p className="text-xs text-white/35 mt-0.5">
                  {(items?.length ?? 0) + (incomeItems?.length ?? 0)} items total
                </p>
              </div>
              <div className="px-5 py-3">
                {isLoading ? (
                  <div className="space-y-1 py-2">{Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <Skeleton className="h-9 w-9 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3 bg-white/5" /><Skeleton className="h-2.5 w-1/4 bg-white/5" /></div>
                      <Skeleton className="h-4 w-16 bg-white/5" />
                    </div>
                  ))}</div>
                ) : (items?.length ?? 0) + (incomeItems?.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                      <Calculator className="h-5 w-5 text-white/20" />
                    </div>
                    <p className="text-sm text-white/30">No items yet — add expenses or income above</p>
                  </div>
                ) : (
                  <div>
                    {items?.map((item, idx) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-3 py-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold"
                            style={{ background: 'rgba(251,113,133,0.12)', color: '#fb7185' }}>
                            {item.category.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate">{item.name}</p>
                            <p className="text-[10px] text-white/30">{item.category} · {item.account.name}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-bold font-mono text-rose-400">
                              −{formatCurrency(parseFloat(item.amount), item.account.currency)}
                            </span>
                            <Button variant="ghost" size="icon"
                              className="h-9 w-9 sm:h-7 sm:w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                              onClick={() => deleteItem.mutate(item.id)} disabled={deleteItem.isPending}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {(idx < (items.length - 1) || (incomeItems?.length ?? 0) > 0) && <div className="h-px bg-white/[0.04]" />}
                      </div>
                    ))}
                    {incomeItems?.map((item, idx) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-3 py-3 group">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                            {item.type === 'MONEY_OWED' ? <Users className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate">{item.name}</p>
                            <p className="text-[10px] text-white/30">
                              {item.type === 'MONEY_OWED' ? 'Money Owed' : 'Income Source'}
                              {item.from ? ` · from ${item.from}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-bold font-mono text-emerald-400">
                              +{formatCurrency(parseFloat(item.amount))}
                            </span>
                            <Button variant="ghost" size="icon"
                              className="h-9 w-9 sm:h-7 sm:w-7 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                              onClick={() => deleteIncome.mutate(item.id)} disabled={deleteIncome.isPending}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        {idx < (incomeItems.length - 1) && <div className="h-px bg-white/[0.04]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
