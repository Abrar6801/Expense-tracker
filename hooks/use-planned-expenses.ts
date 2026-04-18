'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedPlannedExpense } from '@/types'

const KEY = ['planned-expenses'] as const

async function fetchItems(): Promise<SerializedPlannedExpense[]> {
  const res = await fetch('/api/planned-expenses')
  if (!res.ok) throw new Error('Failed to fetch planned expenses')
  return (await res.json()).items
}

async function createItem(input: {
  name: string
  amount: number
  category: string
  accountId: string
}): Promise<SerializedPlannedExpense> {
  const res = await fetch('/api/planned-expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to add planned expense')
  }
  return (await res.json()).item
}

async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/planned-expenses/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

export function usePlannedExpenses() {
  return useQuery({ queryKey: KEY, queryFn: fetchItems })
}

export function useCreatePlannedExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      qc.setQueryData<SerializedPlannedExpense[]>(KEY, (old) =>
        old ? [item, ...old] : [item]
      )
      toast.success(`"${item.name}" added to planner`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePlannedExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, id) => {
      qc.setQueryData<SerializedPlannedExpense[]>(KEY, (old) =>
        old?.filter((i) => i.id !== id) ?? []
      )
      toast.success('Removed from planner')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
