'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedRecurringTemplate } from '@/types'
import type { CreateRecurringInput } from '@/lib/validations'

const KEY = ['recurring'] as const

async function fetchTemplates(): Promise<{ templates: SerializedRecurringTemplate[] }> {
  const res = await fetch('/api/recurring')
  if (!res.ok) throw new Error('Failed to fetch recurring templates')
  return res.json()
}

async function createTemplate(input: CreateRecurringInput): Promise<SerializedRecurringTemplate> {
  const res = await fetch('/api/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create template')
  }
  return (await res.json()).template
}

async function postRecurring(id: string): Promise<SerializedRecurringTemplate> {
  const res = await fetch(`/api/recurring/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'post' }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to post recurring transaction')
  }
  return (await res.json()).template
}

async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete template')
}

export function useRecurringTemplates() {
  return useQuery({ queryKey: KEY, queryFn: fetchTemplates })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: (t) => {
      qc.setQueryData<{ templates: SerializedRecurringTemplate[] }>(KEY, (old) => ({
        templates: old ? [t, ...old.templates] : [t],
      }))
      toast.success(`Recurring "${t.description ?? t.category}" created`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function usePostRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: postRecurring,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction posted successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: (_, id) => {
      qc.setQueryData<{ templates: SerializedRecurringTemplate[] }>(KEY, (old) => ({
        templates: old?.templates.filter((t) => t.id !== id) ?? [],
      }))
      toast.success('Recurring template deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
