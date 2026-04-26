'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedBudgetLimit } from '@/types'
import type { CreateBudgetLimitInput } from '@/lib/validations'

const KEY = (month: number, year: number) => ['budgets', month, year] as const

async function fetchBudgets(month: number, year: number): Promise<{ budgets: SerializedBudgetLimit[]; month: number; year: number }> {
  const res = await fetch(`/api/budgets?month=${month}&year=${year}`)
  if (!res.ok) throw new Error('Failed to fetch budgets')
  return res.json()
}

async function createBudget(input: CreateBudgetLimitInput): Promise<SerializedBudgetLimit> {
  const res = await fetch('/api/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to save budget')
  }
  return (await res.json()).budget
}

async function deleteBudget(id: string): Promise<void> {
  const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete budget')
}

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: KEY(month, year),
    queryFn: () => fetchBudgets(month, year),
  })
}

export function useCreateBudget(month: number, year: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(month, year) })
      toast.success('Budget saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteBudget(month: number, year: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY(month, year) })
      toast.success('Budget removed')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
