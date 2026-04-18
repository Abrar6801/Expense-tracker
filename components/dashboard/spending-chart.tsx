'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useDashboardStats } from '@/hooks/use-dashboard'
import { CHART_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-sm">
      <p className="font-medium">{data.category}</p>
      <p className="text-muted-foreground">
        {formatCurrency(data.total)} · {data.percentage.toFixed(1)}%
      </p>
    </div>
  )
}

export function SpendingChart() {
  const { data: stats, isLoading } = useDashboardStats()

  const chartData = stats?.spendingByCategory ?? []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Spending by category</CardTitle>
        <p className="text-xs text-muted-foreground">This month</p>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-40 w-40 rounded-full" />
            <div className="w-full space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && chartData.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              No expenses this month yet.
            </p>
          </div>
        )}

        {!isLoading && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="category"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 space-y-2">
              {chartData.slice(0, 6).map((item, index) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(0)}%
                    </span>
                    <span className="font-mono font-medium text-xs">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
