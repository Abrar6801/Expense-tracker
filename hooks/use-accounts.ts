'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SerializedAccount } from '@/types'
import type { CreateAccountInput, UpdateAccountInput } from '@/lib/validations'

const ACCOUNTS_KEY = ['accounts'] as const

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchAccounts(): Promise<SerializedAccount[]> {
  const res = await fetch('/api/accounts')
  if (!res.ok) throw new Error('Failed to fetch accounts')
  const data = await res.json()
  return data.accounts
}

async function createAccount(input: CreateAccountInput): Promise<SerializedAccount> {
  const res = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to create account')
  }
  const data = await res.json()
  return data.account
}

async function updateAccount({
  id,
  ...input
}: UpdateAccountInput): Promise<SerializedAccount> {
  const res = await fetch(`/api/accounts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to update account')
  }
  const data = await res.json()
  return data.account
}

async function deleteAccount(id: string): Promise<void> {
  const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to delete account')
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: fetchAccounts,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAccount,
    onSuccess: (newAccount) => {
      queryClient.setQueryData<SerializedAccount[]>(ACCOUNTS_KEY, (old) =>
        old ? [...old, newAccount] : [newAccount]
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Account "${newAccount.name}" created`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (updated) => {
      queryClient.setQueryData<SerializedAccount[]>(ACCOUNTS_KEY, (old) =>
        old?.map((a) => (a.id === updated.id ? updated : a)) ?? [updated]
      )
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(`Account "${updated.name}" updated`)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: (_, id) => {
      queryClient.setQueryData<SerializedAccount[]>(ACCOUNTS_KEY, (old) =>
        old?.filter((a) => a.id !== id) ?? []
      )
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Account deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
