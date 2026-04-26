'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedSavingsGoal } from '@/types'
import type { CreateGoalInput } from '@/lib/validations'

const KEY = ['goals'] as const

async function fetchGoals(): Promise<{ goals: SerializedSavingsGoal[] }> {
  const res = await fetch('/api/goals')
  if (!res.ok) throw new Error('Failed to fetch goals')
  return res.json()
}

async function createGoal(input: CreateGoalInput): Promise<SerializedSavingsGoal> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create goal')
  }
  return (await res.json()).goal
}

async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete goal')
}

export function useGoals() {
  return useQuery({ queryKey: KEY, queryFn: fetchGoals })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createGoal,
    onSuccess: (goal) => {
      qc.setQueryData<{ goals: SerializedSavingsGoal[] }>(KEY, (old) => ({
        goals: old ? [...old.goals, goal] : [goal],
      }))
      toast.success(`Goal "${goal.name}" created`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: (_, id) => {
      qc.setQueryData<{ goals: SerializedSavingsGoal[] }>(KEY, (old) => ({
        goals: old?.goals.filter((g) => g.id !== id) ?? [],
      }))
      toast.success('Goal deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
