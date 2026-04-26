'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SerializedSplit } from '@/types'
import type { CreateSplitInput } from '@/lib/validations'

async function fetchSplits(): Promise<SerializedSplit[]> {
  const res = await fetch('/api/splits')
  if (!res.ok) throw new Error('Failed to fetch splits')
  const data = await res.json()
  return data.splits
}

export function useSplits() {
  return useQuery({ queryKey: ['splits'], queryFn: fetchSplits })
}

export function useCreateSplit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSplitInput) => {
      const res = await fetch('/api/splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create split')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['splits'] }),
  })
}

export function useDeleteSplit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/splits/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete split')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['splits'] }),
  })
}

export function useMarkMemberReceived() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ splitId, memberId, accountId }: { splitId: string; memberId: string; accountId: string }) => {
      const res = await fetch(`/api/splits/${splitId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to mark received')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['splits'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
