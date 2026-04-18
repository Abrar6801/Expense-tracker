'use client'

import { X } from 'lucide-react'
import { TransactionType } from '@prisma/client'
import { DATE_FILTER_OPTIONS } from '@/lib/constants'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
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

  const hasActiveFilters =
    filters.accountId || filters.type || filters.category || (filters.dateRange && filters.dateRange !== 'all')

  function clearFilters() {
    onChange({ page: 1, pageSize: filters.pageSize })
  }

  return (
    <div className="flex flex-wrap gap-2">
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

      {/* Clear filters */}
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
  )
}
