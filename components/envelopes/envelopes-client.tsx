'use client'

import { useState } from 'react'
import { Wallet, Trash2, Plus, ChevronDown, ChevronUp, Receipt } from 'lucide-react'
import { useEnvelopes, useCreateEnvelope, useDeleteEnvelope, useAddEnvelopeTransaction } from '@/hooks/use-envelopes'
import { useAccounts } from '@/hooks/use-accounts'
import { PRESET_CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import type { SerializedCashEnvelope } from '@/types'

interface EnvelopesClientProps { email?: string }

export function EnvelopesClient({ email }: EnvelopesClientProps) {
  const { data, isLoading } = useEnvelopes()
  const envelopes = data?.envelopes ?? []
  const { data: accountsData } = useAccounts()
  const accounts = accountsData ?? []
  const createEnvelope = useCreateEnvelope()
  const deleteEnvelope = useDeleteEnvelope()

  const [name, setName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addTxEnvelope, setAddTxEnvelope] = useState<SerializedCashEnvelope | null>(null)

  const totalAllocated = envelopes.reduce((s, e) => s + parseFloat(e.totalAmount), 0)
  const totalSpent = envelopes.reduce((s, e) => s + e.spent, 0)
  const totalRemaining = envelopes.reduce((s, e) => s + e.remaining, 0)

  async function handleCreate() {
    const num = parseFloat(totalAmount)
    if (!name.trim() || isNaN(num) || num <= 0 || !accountId) return
    await createEnvelope.mutateAsync({ name: name.trim(), totalAmount: num, accountId })
    setName(''); setTotalAmount(''); setAccountId('')
  }

  return (
    <>
      <Header title="Cash Envelopes" email={email} />
      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        <div className="hidden md:block">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white">Cash Envelopes</h1>
          <p className="text-xs lg:text-sm text-white/40 mt-1">
            Allocate a budget per purpose and track spending from it
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 lg:gap-4">
          {[
            { label: 'Allocated', value: totalAllocated, color: '#a78bfa' },
            { label: 'Spent', value: totalSpent, color: '#fb7185' },
            { label: 'Remaining', value: totalRemaining, color: totalRemaining >= 0 ? '#34d399' : '#fb7185' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card rounded-2xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
              {isLoading
                ? <Skeleton className="h-7 w-20 mt-1.5 bg-white/5" />
                : <p className="mt-1.5 text-2xl font-bold font-mono" style={{ color }}>{formatCurrency(value)}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create form */}
          <div className="glass-card rounded-2xl p-5 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-semibold text-white">New Envelope</h3>
              <p className="text-xs text-white/35 mt-0.5">Set aside an amount for a specific purpose</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Envelope Name</Label>
              <Input placeholder="e.g. Groceries Budget" value={name} onChange={e => setName(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Total Amount</Label>
              <Input type="number" placeholder="0.00" min="0" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Deduct from account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10">
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {formatCurrency(parseFloat(a.balance), a.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-white/25">
                Each transaction you record will deduct from this account's balance
              </p>
            </div>

            <Button className="w-full h-10 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/20"
              onClick={handleCreate} disabled={!name.trim() || !totalAmount || !accountId || createEnvelope.isPending}>
              <Plus className="h-4 w-4 mr-2" />Create Envelope
            </Button>
          </div>

          {/* Envelopes list */}
          <div className="lg:col-span-2 space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
            ))}

            {!isLoading && envelopes.length === 0 && (
              <div className="glass-card rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                  <Wallet className="h-6 w-6 text-white/20" />
                </div>
                <h3 className="font-medium text-white/60">No envelopes yet</h3>
                <p className="text-sm text-white/30">Create an envelope to start tracking spending</p>
              </div>
            )}

            {!isLoading && envelopes.map(envelope => {
              const total = parseFloat(envelope.totalAmount)
              const pct = total > 0 ? Math.min(Math.round((envelope.spent / total) * 100), 100) : 0
              const over = envelope.spent > total
              const barColor = over ? '#fb7185' : pct > 80 ? '#f59e0b' : '#34d399'
              const isExpanded = expandedId === envelope.id
              const color = envelope.account.color ?? '#7c3aed'

              return (
                <div key={envelope.id} className="glass-card rounded-2xl overflow-hidden">
                  {/* Header row */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                          <Wallet className="h-4 w-4" style={{ color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white/90 truncate">{envelope.name}</p>
                          <p className="text-[10px] text-white/35">
                            from {envelope.account.name} · {envelope.transactions.length} transactions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm"
                          className="h-7 text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/20 px-2.5"
                          onClick={() => setAddTxEnvelope(envelope)}>
                          <Plus className="h-3 w-3 mr-1" />Add
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-white/20 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => deleteEnvelope.mutate(envelope.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-7 w-7 text-white/30 hover:text-white/70"
                          onClick={() => setExpandedId(isExpanded ? null : envelope.id)}>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Amount row */}
                    <div className="flex items-center justify-between mb-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-rose-400 font-mono font-semibold">−{formatCurrency(envelope.spent, envelope.account.currency)}</span>
                        <span className="text-white/25">spent of</span>
                        <span className="text-white/50 font-mono">{formatCurrency(total, envelope.account.currency)}</span>
                      </div>
                      <span className={cn('font-mono font-bold text-sm', over ? 'text-rose-400' : 'text-emerald-400')}>
                        {over ? '−' : ''}{formatCurrency(Math.abs(envelope.remaining), envelope.account.currency)} {over ? 'over' : 'left'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <p className="text-[10px] text-white/25 mt-1">{pct}% used</p>
                  </div>

                  {/* Expanded transactions */}
                  {isExpanded && envelope.transactions.length > 0 && (
                    <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                      {envelope.transactions.slice(0, 10).map(tx => (
                        <div key={tx.id} className="flex items-center gap-3 px-4 sm:px-5 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-[9px] font-bold text-rose-400">
                            {tx.category.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white/70 truncate">{tx.description || tx.category}</p>
                            <p className="text-[10px] text-white/30">{formatDate(tx.date)}</p>
                          </div>
                          <span className="text-xs font-mono font-semibold text-rose-400 shrink-0">
                            −{formatCurrency(parseFloat(tx.amount), envelope.account.currency)}
                          </span>
                        </div>
                      ))}
                      {envelope.transactions.length > 10 && (
                        <p className="px-5 py-3 text-xs text-white/30 text-center">
                          +{envelope.transactions.length - 10} more transactions
                        </p>
                      )}
                    </div>
                  )}
                  {isExpanded && envelope.transactions.length === 0 && (
                    <div className="border-t border-white/[0.06] flex items-center gap-2 px-5 py-4 text-white/30">
                      <Receipt className="h-4 w-4" />
                      <span className="text-xs">No transactions yet — tap Add to record spending</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add transaction dialog */}
      {addTxEnvelope && (
        <AddTransactionDialog
          envelope={addTxEnvelope}
          onClose={() => setAddTxEnvelope(null)}
        />
      )}
    </>
  )
}

// ─── Add transaction dialog ───────────────────────────────────────────────────

function AddTransactionDialog({
  envelope,
  onClose,
}: {
  envelope: SerializedCashEnvelope
  onClose: () => void
}) {
  const addTransaction = useAddEnvelopeTransaction()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())

  async function handleSubmit() {
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0 || !category || !date) return
    await addTransaction.mutateAsync({
      envelopeId: envelope.id,
      amount: num,
      description: description || undefined,
      category,
      date,
    })
    onClose()
  }

  const remaining = envelope.remaining
  const color = envelope.account.color ?? '#7c3aed'

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense to &ldquo;{envelope.name}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="mt-1 mb-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
          <div className="text-xs text-white/50">
            <p>From <span className="text-white/80 font-medium">{envelope.account.name}</span></p>
            <p className="mt-0.5">Remaining in envelope: <span className={remaining < 0 ? 'text-rose-400' : 'text-emerald-400'} style={remaining >= 0 ? { color } : undefined}>
              {formatCurrency(remaining, envelope.account.currency)}
            </span></p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Amount</Label>
              <Input
                type="number" placeholder="0.00" min="0" step="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider text-white/40">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{PRESET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-white/40">Description (optional)</Label>
            <Input
              placeholder="e.g. Weekly groceries"
              value={description} onChange={e => setDescription(e.target.value)}
              className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-wider text-white/40">Date</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1 h-10 border border-white/[0.08] text-white/50 hover:text-white/70"
              onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20"
              onClick={handleSubmit}
              disabled={!amount || !category || !date || addTransaction.isPending}>
              Record Expense
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
