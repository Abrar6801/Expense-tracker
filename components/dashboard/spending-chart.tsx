'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { CHART_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface TooltipPayload {
  name: string
  value: number
  payload: { category: string; total: number; percentage: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="glass rounded-xl px-3 py-2 shadow-xl text-sm">
      <p className="font-semibold text-white/90">{data.category}</p>
      <p className="text-white/50 text-xs mt-0.5">
        {formatCurrency(data.total)} · {data.percentage.toFixed(1)}%
      </p>
    </div>
  )
}

export function SpendingChart() {
  const { data: stats, isLoading } = useDashboardStats()
  const chartData = stats?.spendingByCategory ?? []

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Spending by Category</h3>
        <p className="text-xs text-white/35 mt-0.5">This month · vs last month</p>
      </div>

      <div className="px-4 sm:px-5 py-4">
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full bg-white/5" />
            <div className="w-full space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-2.5 w-24 bg-white/5" />
                  <Skeleton className="h-2.5 w-14 bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <BarChart3 className="h-5 w-5 text-white/20" />
            </div>
            <p className="text-sm text-white/30">No expenses this month</p>
          </div>
        )}

        {!isLoading && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="42%"
                  outerRadius="65%"
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="category"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="transparent"
                      opacity={0.9}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 space-y-2.5">
              {chartData.slice(0, 6).map((item, index) => (
                <div key={item.category} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-white/50 truncate text-xs">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.change != null && (
                      <span className={`flex items-center gap-0.5 text-[9px] font-medium ${item.change > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.change > 0
                          ? <TrendingUp className="h-2.5 w-2.5" />
                          : <TrendingDown className="h-2.5 w-2.5" />}
                        {Math.abs(item.change)}%
                      </span>
                    )}
                    <span className="text-[10px] text-white/30 tabular-nums">
                      {item.percentage.toFixed(0)}%
                    </span>
                    <span className="font-mono font-semibold text-xs text-white/80">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
