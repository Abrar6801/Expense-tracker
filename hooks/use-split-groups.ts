'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SerializedSplitGroup } from '@/types'
import type { CreateSplitGroupInput, AddGroupMemberInput } from '@/lib/validations'

async function fetchGroups(): Promise<SerializedSplitGroup[]> {
  const res = await fetch('/api/split-groups')
  if (!res.ok) throw new Error('Failed to fetch groups')
  const data = await res.json()
  return data.groups
}

export function useSplitGroups() {
  return useQuery({ queryKey: ['split-groups'], queryFn: fetchGroups })
}

export function useCreateSplitGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSplitGroupInput) => {
      const res = await fetch('/api/split-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create group')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split-groups'] }),
  })
}

export function useDeleteSplitGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/split-groups/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete group')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split-groups'] }),
  })
}

export function useAddGroupMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string } & AddGroupMemberInput) => {
      const res = await fetch(`/api/split-groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to add member')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split-groups'] }),
  })
}

export function useRemoveGroupMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      const res = await fetch(`/api/split-groups/${groupId}/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove member')
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split-groups'] }),
  })
}
