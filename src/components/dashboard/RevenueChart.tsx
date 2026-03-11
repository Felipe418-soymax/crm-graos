'use client'

import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DataPoint {
  date: string
  totalValue: number
  count: number
}

interface RevenueChartProps {
  data: DataPoint[]
}

const toSafeDateLabel = (label: unknown) => {
  if (typeof label !== 'string') return ''
  const d = parseISO(label)
  if (!isValid(d)) return label
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

const toSafeShortLabel = (dateStr: string) => {
  const d = parseISO(dateStr)
  if (!isValid(d)) return dateStr
  return format(d, 'dd/MM', { locale: ptBR })
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const value = payload?.[0]?.value ?? 0
  const ops = payload?.[1]?.value ?? 0

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-xl">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-1">{label ? toSafeDateLabel(label) : ''}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(value)}</p>
      <p className="text-xs text-gray-500 mt-0.5">{ops} operação(ões)</p>
    </div>
  )
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-52 text-gray-400 text-sm">Sem dados no período</div>
  }

  const formatted = data.map((d) => ({
    ...d,
    label: toSafeShortLabel(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`}
          width={65}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#16a34a', strokeWidth: 1, strokeDasharray: '4 4' }} />

        <Area
          type="monotone"
          dataKey="totalValue"
          stroke="#16a34a"
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Area type="monotone" dataKey="count" stroke="transparent" fill="transparent" dot={false} activeDot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
