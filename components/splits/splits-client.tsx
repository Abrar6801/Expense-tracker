'use client'

import { useState } from 'react'
import {
  Users, Trash2, Plus, ChevronDown, ChevronUp,
  CheckCircle2, Clock, UserPlus, Layers,
} from 'lucide-react'
import { useSplits, useCreateSplit, useDeleteSplit, useMarkMemberReceived } from '@/hooks/use-splits'
import { useSplitGroups, useCreateSplitGroup, useDeleteSplitGroup, useAddGroupMember, useRemoveGroupMember } from '@/hooks/use-split-groups'
import { useAccounts } from '@/hooks/use-accounts'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import type { SerializedSplit, SerializedSplitGroup } from '@/types'

interface SplitsClientProps { email?: string }

export function SplitsClient({ email }: SplitsClientProps) {
  const [tab, setTab] = useState<'splits' | 'groups'>('splits')
  const { data: splits = [], isLoading: splitsLoading } = useSplits()
  const totalPending = splits.reduce((s, sp) => s + sp.pendingAmount, 0)

  return (
    <>
      <Header
        title="Splits"
        email={email}
        action={
          tab === 'splits'
            ? <NewSplitButton />
            : <NewGroupButton />
        }
      />

      <div className="p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-6">
        {/* Tab switcher */}
        <div className="flex gap-1 p-1 glass-card rounded-xl w-fit">
          {(['splits', 'groups'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize',
                tab === t
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'splits' ? (
          <SplitsView splits={splits} isLoading={splitsLoading} totalPending={totalPending} />
        ) : (
          <GroupsView />
        )}
      </div>
    </>
  )
}

// ─── Splits view ──────────────────────────────────────────────────────────────

function NewSplitButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-500 border-0" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        New split
      </Button>
      <CreateSplitDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function SplitsView({
  splits,
  isLoading,
  totalPending,
}: {
  splits: SerializedSplit[]
  isLoading: boolean
  totalPending: number
}) {
  const deleteSplit = useDeleteSplit()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [receiveState, setReceiveState] = useState<{
    splitId: string; memberId: string; memberName: string; amount: number
  } | null>(null)

  return (
    <>
      {/* Pending banner */}
      {totalPending > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 shrink-0">
            <Clock className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/40 uppercase tracking-widest">Pending from friends</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          </div>
          <p className="text-xs text-white/25 hidden sm:block">Not included in net worth</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : splits.length === 0 ? (
        <EmptySplits />
      ) : (
        <div className="space-y-3">
          {splits.map(split => (
            <SplitCard
              key={split.id}
              split={split}
              expanded={expandedId === split.id}
              onToggle={() => setExpandedId(expandedId === split.id ? null : split.id)}
              onDelete={() => deleteSplit.mutate(split.id)}
              onMarkReceived={(memberId, memberName, amount) =>
                setReceiveState({ splitId: split.id, memberId, memberName, amount })
              }
            />
          ))}
        </div>
      )}

      {/* Mark-received dialog */}
      <MarkReceivedDialog
        open={receiveState !== null}
        memberName={receiveState?.memberName ?? ''}
        amount={receiveState?.amount ?? 0}
        onClose={() => setReceiveState(null)}
        onConfirm={accountId => {
          if (!receiveState) return
          setReceiveState(null)
          return { ...receiveState, accountId }
        }}
        splitId={receiveState?.splitId}
        memberId={receiveState?.memberId}
      />
    </>
  )
}

function EmptySplits() {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
      <p className="text-white/40 text-sm">No splits yet</p>
      <p className="text-white/25 text-xs mt-1">Track what friends owe you after group expenses</p>
      <Button className="mt-4 bg-violet-600 hover:bg-violet-500 border-0" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New split
      </Button>
      <CreateSplitDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function SplitCard({
  split,
  expanded,
  onToggle,
  onDelete,
  onMarkReceived,
}: {
  split: SerializedSplit
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onMarkReceived: (memberId: string, memberName: string, amount: number) => void
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 shrink-0">
          <Users className="h-5 w-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{split.title}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {formatDate(split.date)} · {split.members.length} {split.members.length === 1 ? 'person' : 'people'}
          </p>
        </div>
        <div className="text-right shrink-0">
          {split.pendingAmount > 0 ? (
            <p className="text-sm font-semibold text-amber-400">{formatCurrency(split.pendingAmount)} pending</p>
          ) : (
            <p className="text-sm font-semibold text-emerald-400">All received</p>
          )}
          {split.receivedAmount > 0 && split.pendingAmount > 0 && (
            <p className="text-xs text-white/30">{formatCurrency(split.receivedAmount)} received</p>
          )}
        </div>
        <div className="text-white/30 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 space-y-2 pt-3">
          {split.members.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full shrink-0',
                member.received ? 'bg-emerald-500/20' : 'bg-amber-500/15'
              )}>
                {member.received
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  : <Clock className="h-3.5 w-3.5 text-amber-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{member.name}</p>
                {member.received && member.receivedAt && (
                  <p className="text-xs text-white/30">Received {formatDate(member.receivedAt)}</p>
                )}
              </div>
              <p className={cn('text-sm font-medium shrink-0', member.received ? 'text-white/40 line-through' : 'text-white/80')}>
                {formatCurrency(Number(member.amount))}
              </p>
              {!member.received && (
                <Button
                  size="sm"
                  className="h-7 text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border-0 shrink-0"
                  onClick={() => onMarkReceived(member.id, member.name, Number(member.amount))}
                >
                  Mark received
                </Button>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-xs h-7"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete split
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Mark-received dialog ─────────────────────────────────────────────────────

function MarkReceivedDialog({
  open,
  memberName,
  amount,
  onClose,
  splitId,
  memberId,
}: {
  open: boolean
  memberName: string
  amount: number
  onClose: () => void
  onConfirm: (accountId: string) => unknown
  splitId?: string
  memberId?: string
}) {
  const { data: accountsData } = useAccounts()
  const accounts = accountsData ?? []
  const [accountId, setAccountId] = useState('')
  const markReceived = useMarkMemberReceived()

  async function handleConfirm() {
    if (!accountId || !splitId || !memberId) return
    await markReceived.mutateAsync({ splitId, memberId, accountId })
    setAccountId('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setAccountId(''); onClose() } }}>
      <DialogContent className="glass-card border border-white/[0.08] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Mark payment received</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-white/60">
            <span className="text-white font-medium">{memberName}</span> paid you back{' '}
            <span className="text-emerald-400 font-semibold">{formatCurrency(amount)}</span>.
            Which account did you receive it in?
          </p>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Deposit account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="glass-input text-white">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent className="glass-card border border-white/[0.08] text-white">
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              className="flex-1 text-white/60 hover:text-white"
              onClick={() => { setAccountId(''); onClose() }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-0"
              onClick={handleConfirm}
              disabled={!accountId || markReceived.isPending}
            >
              {markReceived.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create split dialog ──────────────────────────────────────────────────────

function CreateSplitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: groups = [] } = useSplitGroups()
  const createSplit = useCreateSplit()

  const [title, setTitle] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [groupId, setGroupId] = useState('none')
  const [members, setMembers] = useState<{ name: string; amount: string }[]>([{ name: '', amount: '' }])

  function reset() {
    setTitle(''); setTotalAmount(''); setDate(new Date()); setGroupId('none')
    setMembers([{ name: '', amount: '' }])
  }

  function handleGroupChange(gId: string) {
    setGroupId(gId)
    if (gId !== 'none') {
      const group = groups.find(g => g.id === gId)
      if (group) setMembers(group.members.map(m => ({ name: m.name, amount: '' })))
    } else {
      setMembers([{ name: '', amount: '' }])
    }
  }

  // Divide total equally among all members
  function splitAll() {
    const total = parseFloat(totalAmount)
    if (isNaN(total) || total <= 0 || members.length === 0) return
    const each = Math.floor((total / members.length) * 100) / 100
    const remainder = Math.round((total - each * members.length) * 100) / 100
    setMembers(prev => prev.map((m, i) => ({
      ...m,
      amount: i === 0 ? String(Math.round((each + remainder) * 100) / 100) : String(each),
    })))
  }

  function addRow() { setMembers(prev => [...prev, { name: '', amount: '' }]) }
  function removeRow(i: number) { setMembers(prev => prev.filter((_, idx) => idx !== i)) }
  function updateMember(i: number, field: 'name' | 'amount', v: string) {
    setMembers(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: v } : m))
  }

  async function handleCreate() {
    if (!title.trim() || !date) return
    const validMembers = members.filter(m => m.name.trim() && m.amount)
    if (validMembers.length === 0) return
    const total = parseFloat(totalAmount) || validMembers.reduce((s, m) => s + parseFloat(m.amount), 0)

    await createSplit.mutateAsync({
      title: title.trim(),
      totalAmount: total,
      groupId: groupId !== 'none' ? groupId : null,
      date,
      members: validMembers.map(m => ({ name: m.name.trim(), amount: parseFloat(m.amount) })),
    })
    reset()
    onClose()
  }

  const selectedGroup = groups.find(g => g.id === groupId)
  const canSplitAll = parseFloat(totalAmount) > 0 && members.filter(m => m.name.trim()).length > 0

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="glass-card border border-white/[0.08] text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">New split</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Title</Label>
            <Input
              placeholder="e.g. Dinner at restaurant"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="glass-input text-white"
            />
          </div>

          {/* Total + date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Total amount</Label>
              <Input
                type="number"
                min="0"
                placeholder="0.00"
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                className="glass-input text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Date</Label>
              <DatePicker value={date} onChange={setDate} />
            </div>
          </div>

          {/* Group selector */}
          {groups.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Group (optional)</Label>
              <Select value={groupId} onValueChange={handleGroupChange}>
                <SelectTrigger className="glass-input text-white">
                  <SelectValue placeholder="No group — add members manually" />
                </SelectTrigger>
                <SelectContent className="glass-card border border-white/[0.08] text-white">
                  <SelectItem value="none">No group</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.members.length} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white/60 text-xs">
                {selectedGroup ? `Members from "${selectedGroup.name}"` : 'Members'}
              </Label>
              {canSplitAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 px-2"
                  onClick={splitAll}
                  type="button"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  Split all equally
                </Button>
              )}
            </div>

            {members.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder="Name"
                  value={m.name}
                  onChange={e => updateMember(i, 'name', e.target.value)}
                  readOnly={!!selectedGroup}
                  className={cn('glass-input text-white flex-1', selectedGroup && 'opacity-70')}
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={m.amount}
                  onChange={e => updateMember(i, 'amount', e.target.value)}
                  className="glass-input text-white w-28"
                />
                {!selectedGroup && members.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}

            {!selectedGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70 text-xs"
                onClick={addRow}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add member
              </Button>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              className="flex-1 text-white/60 hover:text-white"
              onClick={() => { reset(); onClose() }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-500 border-0"
              onClick={handleCreate}
              disabled={createSplit.isPending || !title.trim()}
            >
              {createSplit.isPending ? 'Creating…' : 'Create split'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Groups view ──────────────────────────────────────────────────────────────

function NewGroupButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-500 border-0" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        New group
      </Button>
      <CreateGroupDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function GroupsView() {
  const { data: groups = [], isLoading } = useSplitGroups()
  const deleteGroup = useDeleteSplitGroup()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <EmptyGroups />
      ) : (
        <div className="space-y-3">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              expanded={expandedId === group.id}
              onToggle={() => setExpandedId(expandedId === group.id ? null : group.id)}
              onDelete={() => deleteGroup.mutate(group.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function EmptyGroups() {
  const [open, setOpen] = useState(false)
  return (
    <div className="glass-card rounded-2xl p-10 text-center">
      <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
      <p className="text-white/40 text-sm">No groups yet</p>
      <p className="text-white/25 text-xs mt-1">Save your friend groups to reuse them across splits</p>
      <Button className="mt-4 bg-violet-600 hover:bg-violet-500 border-0" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New group
      </Button>
      <CreateGroupDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function GroupCard({
  group,
  expanded,
  onToggle,
  onDelete,
}: {
  group: SerializedSplitGroup
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const addMember = useAddGroupMember()
  const removeMember = useRemoveGroupMember()
  const [newMemberName, setNewMemberName] = useState('')

  async function handleAddMember() {
    if (!newMemberName.trim()) return
    await addMember.mutateAsync({ groupId: group.id, name: newMemberName.trim() })
    setNewMemberName('')
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 shrink-0">
          <Users className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{group.name}</p>
          <p className="text-xs text-white/40 mt-0.5">
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="text-white/30 shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 space-y-3">
          {/* Member list */}
          <div className="space-y-1.5">
            {group.members.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-xs text-indigo-300 font-bold shrink-0">
                  {m.name[0].toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-white/80">{m.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white/20 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => removeMember.mutate({ groupId: group.id, memberId: m.id })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add member */}
          <div className="flex gap-2">
            <Input
              placeholder="Add member name"
              value={newMemberName}
              onChange={e => setNewMemberName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMember()}
              className="glass-input text-white text-sm h-8"
            />
            <Button
              size="sm"
              className="h-8 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-300 border-0 shrink-0"
              onClick={handleAddMember}
              disabled={!newMemberName.trim() || addMember.isPending}
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Delete group */}
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10 text-xs h-7"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete group
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Create group dialog ──────────────────────────────────────────────────────

function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createGroup = useCreateSplitGroup()
  const [name, setName] = useState('')
  const [memberNames, setMemberNames] = useState(['', ''])

  function reset() { setName(''); setMemberNames(['', '']) }

  function updateMemberName(i: number, v: string) {
    setMemberNames(prev => prev.map((m, idx) => idx === i ? v : m))
  }

  function addRow() { setMemberNames(prev => [...prev, '']) }
  function removeRow(i: number) { setMemberNames(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleCreate() {
    if (!name.trim()) return
    const validMembers = memberNames.filter(m => m.trim())
    if (validMembers.length === 0) return

    await createGroup.mutateAsync({ name: name.trim(), members: validMembers.map(m => m.trim()) })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="glass-card border border-white/[0.08] text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">New group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Group name</Label>
            <Input
              placeholder="e.g. Uni friends, Flat mates…"
              value={name}
              onChange={e => setName(e.target.value)}
              className="glass-input text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white/60 text-xs">Members</Label>
            {memberNames.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Member ${i + 1}`}
                  value={m}
                  onChange={e => updateMemberName(i, e.target.value)}
                  className="glass-input text-white flex-1"
                />
                {memberNames.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    onClick={() => removeRow(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white/70 text-xs"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add member
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="ghost"
              className="flex-1 text-white/60 hover:text-white"
              onClick={() => { reset(); onClose() }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-500 border-0"
              onClick={handleCreate}
              disabled={createGroup.isPending || !name.trim()}
            >
              {createGroup.isPending ? 'Creating…' : 'Create group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
