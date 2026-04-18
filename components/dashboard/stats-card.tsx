import { type LucideIcon } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardProps {
  title: string
  value: number
  currency?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
  isLoading?: boolean
  showSign?: boolean
}

export function StatsCard({
  title,
  value,
  currency = 'USD',
  icon: Icon,
  iconColor,
  iconBg,
  isLoading,
  showSign,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-20 sm:h-3.5 sm:w-24" />
              <Skeleton className="h-6 w-24 sm:h-7 sm:w-32" />
            </div>
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const isNegative = value < 0

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide truncate">
              {title}
            </p>
            <p
              className={cn(
                'mt-1 text-lg sm:text-2xl font-bold font-mono tracking-tight',
                showSign && value > 0 && 'text-green-400',
                showSign && isNegative && 'text-red-400'
              )}
            >
              {showSign && value > 0 && '+'}
              {formatCurrency(value, currency)}
            </p>
          </div>
          <div
            className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: iconBg }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: iconColor }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
