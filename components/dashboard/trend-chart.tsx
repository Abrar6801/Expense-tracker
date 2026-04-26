'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useTrends } from '@/hooks/use-trends'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2.5 shadow-xl text-xs space-y-1">
      <p className="font-semibold text-white/80 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/50 capitalize">{p.name}</span>
          <span className="ml-auto font-mono font-semibold text-white/90">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="flex items-center gap-2 pt-1 border-t border-white/[0.08] mt-1">
          <span className="text-white/40">Net</span>
          <span className={`ml-auto font-mono font-semibold ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(payload[0].value - payload[1].value, 'USD', true)}
          </span>
        </div>
      )}
    </div>
  )
}

export function TrendChart() {
  const { data, isLoading } = useTrends()
  const trends = data?.trends ?? []

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Income vs Expenses</h3>
        <p className="text-xs text-white/35 mt-0.5">Last 6 months</p>
      </div>

      <div className="px-4 sm:px-5 py-4">
        {isLoading && (
          <div className="flex items-end gap-2 h-32">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col gap-1 items-center">
                <Skeleton className="w-full bg-white/5" style={{ height: `${40 + i * 10}px` }} />
                <Skeleton className="h-2 w-6 bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && trends.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trends} barGap={3} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.4)' }}>{value}</span>}
              />
              <Bar dataKey="income" name="Income" fill="#34d399" radius={[3, 3, 0, 0]} opacity={0.85} />
              <Bar dataKey="expenses" name="Expenses" fill="#fb7185" radius={[3, 3, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {!isLoading && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
              <TrendingUp className="h-4 w-4 text-white/20" />
            </div>
            <p className="text-sm text-white/30">No data yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
