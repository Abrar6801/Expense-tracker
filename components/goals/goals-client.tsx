'use client'

import { useState } from 'react'
import { Target, Trash2, Plus, Calendar } from 'lucide-react'
import { useGoals, useCreateGoal, useDeleteGoal } from '@/hooks/use-goals'
import { useAccounts } from '@/hooks/use-accounts'
import { ACCOUNT_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'

interface GoalsClientProps { email?: string }

export function GoalsClient({ email }: GoalsClientProps) {
  const { data, isLoading } = useGoals()
  const goals = data?.goals ?? []
  const { data: accountsData } = useAccounts()
  const accounts = accountsData ?? []
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [deadline, setDeadline] = useState<Date | undefined>()
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0].value)

  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.targetAmount), 0)
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)
  const achieved = goals.filter(g => g.currentAmount >= parseFloat(g.targetAmount)).length

  async function handleCreate() {
    const num = parseFloat(targetAmount)
    if (!name.trim() || isNaN(num) || num <= 0) return
    await createGoal.mutateAsync({
      name: name.trim(),
      targetAmount: num,
      accountId: accountId || undefined,
      deadline: deadline || undefined,
      color,
    })
    setName(''); setTargetAmount(''); setAccountId(''); setDeadline(undefined)
  }

  return (
    <>
      <Header title="Savings Goals" email={email} />
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        <div className="hidden md:block">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Savings Goals</h1>
          <p className="text-xs lg:text-sm text-white/40 mt-1">Track your saving milestones</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          {[
            { label: 'Active Goals', value: goals.length, format: (v: number) => String(v), color: '#a78bfa' },
            { label: 'Total Target', value: totalTarget, format: (v: number) => formatCurrency(v), color: '#34d399' },
            { label: 'Achieved', value: achieved, format: (v: number) => String(v), color: '#f59e0b' },
          ].map(({ label, value, format, color: c }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
              {isLoading
                ? <Skeleton className="h-7 w-16 mt-1.5 bg-white/5" />
                : <p className="mt-1.5 text-2xl font-bold font-mono" style={{ color: c }}>{format(value)}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <div className="glass-card rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-semibold text-white">New Goal</h3>
              <p className="text-xs text-white/35 mt-0.5">Set a savings milestone</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Goal Name</Label>
              <Input placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Target Amount</Label>
              <Input type="number" placeholder="0.00" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Track via account (optional)</Label>
              <Select value={accountId || 'none'} onValueChange={v => setAccountId(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {accountId && <p className="text-[10px] text-white/30">Progress will reflect the account&apos;s balance</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Deadline (optional)</Label>
              <DatePicker value={deadline} onChange={setDeadline} allowFuture />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Color</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map(c => (
                  <button key={c.value} onClick={() => setColor(c.value)}
                    className={cn(
                      'h-6 w-6 rounded-full transition-all',
                      color === c.value && 'ring-2 ring-white/40 ring-offset-2 ring-offset-black/50'
                    )}
                    style={{ backgroundColor: c.value }} />
                ))}
              </div>
            </div>

            <Button className="w-full h-10 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20"
              onClick={handleCreate} disabled={!name.trim() || !targetAmount || createGoal.isPending}>
              <Plus className="h-4 w-4 mr-2" />Create Goal
            </Button>
          </div>

          {/* Goals grid */}
          <div className="lg:col-span-2">
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-2xl bg-white/5" />
                ))}
              </div>
            )}
            {!isLoading && goals.length === 0 && (
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <Target className="h-6 w-6 text-white/20" />
                </div>
                <h3 className="font-medium text-white/60">No goals yet</h3>
                <p className="text-sm text-white/30">Create your first savings goal</p>
              </div>
            )}
            {!isLoading && goals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const target = parseFloat(goal.targetAmount)
                  const current = goal.currentAmount
                  const pct = Math.min(Math.round((current / target) * 100), 100)
                  const achieved = current >= target
                  const goalColor = goal.color ?? '#7c3aed'
                  const daysLeft = goal.deadline
                    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
                    : null

                  return (
                    <div key={goal.id} className="glass-card rounded-2xl p-5 group relative overflow-hidden">
                      <div className="absolute inset-0 opacity-5 rounded-2xl"
                        style={{ background: `radial-gradient(circle at top right, ${goalColor}, transparent 70%)` }} />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                              style={{ background: `${goalColor}20` }}>
                              <Target className="h-4 w-4" style={{ color: goalColor }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white/90 leading-tight">{goal.name}</p>
                              {goal.account && (
                                <p className="text-[10px] text-white/35">{goal.account.name}</p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={() => deleteGoal.mutate(goal.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-2xl font-bold font-mono" style={{ color: achieved ? '#34d399' : goalColor }}>
                              {formatCurrency(current)}
                            </span>
                            <span className="text-xs text-white/35">of {formatCurrency(target)}</span>
                          </div>

                          <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: achieved ? '#34d399' : goalColor }} />
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-white/30">{pct}%</span>
                            {!achieved && (
                              <span className="text-[10px] text-white/30">
                                {formatCurrency(target - current)} to go
                              </span>
                            )}
                            {achieved && (
                              <span className="text-[10px] text-emerald-400 font-semibold">Achieved!</span>
                            )}
                          </div>
                        </div>

                        {daysLeft !== null && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <Calendar className="h-3 w-3 text-white/30" />
                            <span className={daysLeft < 30 ? 'text-amber-400' : 'text-white/30'}>
                              {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Past deadline'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
