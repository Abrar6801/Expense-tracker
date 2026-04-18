'use client'

import { useQuery } from '@tanstack/react-query'
import type { DashboardStats } from '@/types'

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('Failed to fetch dashboard stats')
  return res.json()
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
    staleTime: 60_000, // 1 minute
  })
}
