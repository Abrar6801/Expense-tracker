'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedCashEnvelope } from '@/types'
import type { CreateEnvelopeInput, CreateEnvelopeTransactionInput } from '@/lib/validations'

const KEY = ['envelopes'] as const

async function fetchEnvelopes(): Promise<{ envelopes: SerializedCashEnvelope[] }> {
  const res = await fetch('/api/envelopes')
  if (!res.ok) throw new Error('Failed to fetch envelopes')
  return res.json()
}

async function createEnvelope(input: CreateEnvelopeInput): Promise<SerializedCashEnvelope> {
  const res = await fetch('/api/envelopes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create envelope')
  }
  return (await res.json()).envelope
}

async function deleteEnvelope(id: string): Promise<void> {
  const res = await fetch(`/api/envelopes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete envelope')
}

async function addEnvelopeTransaction({
  envelopeId,
  ...input
}: CreateEnvelopeTransactionInput & { envelopeId: string }) {
  const res = await fetch(`/api/envelopes/${envelopeId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to add transaction')
  }
  return (await res.json()).transaction
}

export function useEnvelopes() {
  return useQuery({ queryKey: KEY, queryFn: fetchEnvelopes })
}

export function useCreateEnvelope() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEnvelope,
    onSuccess: (envelope) => {
      qc.setQueryData<{ envelopes: SerializedCashEnvelope[] }>(KEY, (old) => ({
        envelopes: old ? [envelope, ...old.envelopes] : [envelope],
      }))
      toast.success(`Envelope "${envelope.name}" created`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteEnvelope() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteEnvelope,
    onSuccess: (_, id) => {
      qc.setQueryData<{ envelopes: SerializedCashEnvelope[] }>(KEY, (old) => ({
        envelopes: old?.envelopes.filter((e) => e.id !== id) ?? [],
      }))
      toast.success('Envelope deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useAddEnvelopeTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addEnvelopeTransaction,
    onSuccess: () => {
      // Invalidate everything that depends on account balances
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['accounts'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Expense recorded')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
