'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedExpectedIncome } from '@/types'

const KEY = ['expected-income'] as const

async function fetchItems(): Promise<SerializedExpectedIncome[]> {
  const res = await fetch('/api/expected-income')
  if (!res.ok) throw new Error('Failed to fetch expected income')
  return (await res.json()).items
}

async function createItem(input: {
  name: string
  amount: number
  type: 'INCOME_SOURCE' | 'MONEY_OWED'
  from?: string
  notes?: string
}): Promise<SerializedExpectedIncome> {
  const res = await fetch('/api/expected-income', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to add')
  }
  return (await res.json()).item
}

async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/expected-income/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete')
}

export function useExpectedIncome() {
  return useQuery({ queryKey: KEY, queryFn: fetchItems })
}

export function useCreateExpectedIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: (item) => {
      qc.setQueryData<SerializedExpectedIncome[]>(KEY, (old) =>
        old ? [item, ...old] : [item]
      )
      toast.success(`"${item.name}" added`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteExpectedIncome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, id) => {
      qc.setQueryData<SerializedExpectedIncome[]>(KEY, (old) =>
        old?.filter((i) => i.id !== id) ?? []
      )
      toast.success('Removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
