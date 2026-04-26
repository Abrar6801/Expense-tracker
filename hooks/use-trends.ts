'use client'

import { useQuery } from '@tanstack/react-query'
import type { TrendPoint } from '@/types'

async function fetchTrends(): Promise<{ trends: TrendPoint[] }> {
  const res = await fetch('/api/dashboard/trends')
  if (!res.ok) throw new Error('Failed to fetch trends')
  return res.json()
}

export function useTrends() {
  return useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: fetchTrends,
    staleTime: 60_000,
  })
}
