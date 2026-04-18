'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedTransaction, TransactionFilters } from '@/types'
import type { CreateTransactionInput, UpdateTransactionInput } from '@/lib/validations'

// ─── Key factory ─────────────────────────────────────────────────────────────

const transactionKeys = {
  all: ['transactions'] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchTransactions(
  filters: TransactionFilters
): Promise<{ transactions: SerializedTransaction[]; total: number }> {
  const params = new URLSearchParams()
  if (filters.accountId) params.set('accountId', filters.accountId)
  if (filters.type) params.set('type', filters.type)
  if (filters.category) params.set('category', filters.category)
  if (filters.dateRange) params.set('dateRange', filters.dateRange)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  const res = await fetch(`/api/transactions?${params.toString()}`)
  if (!res.ok) throw new Error('Failed to fetch transactions')
  return res.json()
}

async function createTransaction(
  input: CreateTransactionInput
): Promise<SerializedTransaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create transaction')
  }
  const data = await res.json()
  return data.transaction
}

async function updateTransaction({
  id,
  ...input
}: UpdateTransactionInput): Promise<SerializedTransaction> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to update transaction')
  }
  const data = await res.json()
  return data.transaction
}

async function createTransfer(input: {
  fromAccountId: string
  toAccountId: string
  amount: number
  date?: Date
  description?: string
}): Promise<SerializedTransaction> {
  const res = await fetch('/api/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create transfer')
  }
  return (await res.json()).transaction
}

async function deleteTransaction(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to delete transaction')
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: () => fetchTransactions(filters),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction added')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transfer completed')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
