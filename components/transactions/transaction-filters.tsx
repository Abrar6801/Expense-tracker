'use client'

import { useEffect, useState } from 'react'
import { X, Search, Download } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { DATE_FILTER_OPTIONS } from '@/lib/constants'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TransactionFilters } from '@/types'

interface TransactionFiltersProps {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
}

export function TransactionFiltersBar({ filters, onChange }: TransactionFiltersProps) {
  const { data: accounts } = useAccounts()
  const { data: categoriesData } = useCategories()
  const categories = categoriesData?.categories ?? []

  const [searchInput, setSearchInput] = useState(filters.search ?? '')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ ...filters, search: searchInput || undefined, page: 1 })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const hasActiveFilters =
    filters.accountId ||
    filters.type ||
    filters.category ||
    filters.search ||
    (filters.dateRange && filters.dateRange !== 'all')

  function clearFilters() {
    setSearchInput('')
    onChange({ page: 1, pageSize: filters.pageSize })
  }

  function buildExportUrl() {
    const params = new URLSearchParams()
    if (filters.accountId) params.set('accountId', filters.accountId)
    if (filters.type) params.set('type', filters.type)
    if (filters.category) params.set('category', filters.category)
    if (filters.dateRange) params.set('dateRange', filters.dateRange)
    if (filters.search) params.set('search', filters.search)
    return `/api/transactions/export?${params.toString()}`
  }

  return (
    <div className="space-y-2">
      {/* Search row */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search transactions…"
          className="pl-8 h-9 text-xs bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-violet-500/40"
        />
      </div>

      {/* Filter dropdowns row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Date range */}
        <Select
          value={filters.dateRange ?? 'all'}
          onValueChange={(v) =>
            onChange({ ...filters, dateRange: v as TransactionFilters['dateRange'], page: 1 })
          }
        >
          <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-xs bg-white/[0.04] border-white/[0.08] text-white/70">
            <SelectValue placeholder="All time" />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTER_OPTIONS.map(({ label, value }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Account filter */}
        {accounts && accounts.length > 0 && (
          <Select
            value={filters.accountId ?? 'all'}
            onValueChange={(v) =>
              onChange({ ...filters, accountId: v === 'all' ? undefined : v, page: 1 })
            }
          >
            <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-xs bg-white/[0.04] border-white/[0.08] text-white/70">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: account.color ?? '#6366f1' }} />
                    {account.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Type filter */}
        <Select
          value={filters.type ?? 'all'}
          onValueChange={(v) =>
            onChange({ ...filters, type: v === 'all' ? undefined : (v as TransactionType), page: 1 })
          }
        >
          <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-xs bg-white/[0.04] border-white/[0.08] text-white/70">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
            <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={filters.category ?? 'all'}
          onValueChange={(v) =>
            onChange({ ...filters, category: v === 'all' ? undefined : v, page: 1 })
          }
        >
          <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-xs bg-white/[0.04] border-white/[0.08] text-white/70">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Export button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] px-3 border border-white/[0.08]"
          asChild
        >
          <a href={buildExportUrl()} download>
            <Download className="mr-1.5 h-3 w-3" />
            Export CSV
          </a>
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.04] px-3"
            onClick={clearFilters}
          >
            <X className="mr-1.5 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
