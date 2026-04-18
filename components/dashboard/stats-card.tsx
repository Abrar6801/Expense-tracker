import { type LucideIcon } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface StatsCardProps {
  title: string
  value: number
  currency?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  gradient?: string
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
  gradient,
  isLoading,
  showSign,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-3.5 sm:p-4 lg:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-2.5 w-14 sm:w-20 bg-white/5" />
            <Skeleton className="h-6 sm:h-7 lg:h-8 w-16 sm:w-24 bg-white/5" />
          </div>
          <Skeleton className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-xl bg-white/5" />
        </div>
      </div>
    )
  }

  const isNegative = value < 0
  const isPositive = showSign && value > 0

  return (
    <div className={cn(
      'relative rounded-2xl p-3.5 sm:p-4 lg:p-5 overflow-hidden hover-lift cursor-default',
      'glass-card group transition-all duration-300 hover:border-white/[0.12]'
    )}>
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{ background: gradient ? `${gradient}08` : 'rgba(139,92,246,0.04)' }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-white/30 leading-tight">
            {title}
          </p>
          <p className={cn(
            'mt-1.5 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight font-mono truncate',
            isPositive && 'gradient-text-green',
            showSign && isNegative && 'gradient-text-red',
            !showSign && 'text-white'
          )}>
            {isPositive && '+'}
            {formatCurrency(value, currency)}
          </p>
        </div>

        <div
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconBg }}
        >
          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color: iconColor, height: '1rem', width: '1rem' }} />
        </div>
      </div>
    </div>
  )
}
