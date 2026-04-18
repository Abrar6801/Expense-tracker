'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PRESET_CATEGORIES } from '@/lib/constants'

async function fetchCategories(): Promise<{
  categories: string[]
  custom: string[]
}> {
  const res = await fetch('/api/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

async function addCategory(name: string): Promise<{ categories: string[] }> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to add category')
  }
  return res.json()
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    placeholderData: { categories: [...PRESET_CATEGORIES].sort(), custom: [] },
  })
}

export function useAddCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category added')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
