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
  if (!isValid(d)) return label // se não for ISO, não quebra: mostra o texto cru
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
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{label ? toSafeDateLabel(label) : ''}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(value)}</p>
      <p className="text-xs text-gray-500">{ops} operação(ões)</p>
    </div>
  )
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sem dados no período</div>
  }

  const formatted = data.map((d) => ({
    ...d,
    label: toSafeShortLabel(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(Number(v) / 1000).toFixed(0)}k`}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="totalValue"
          stroke="#16a34a"
          strokeWidth={2.5}
          fill="url(#colorRevenue)"
          dot={false}
          activeDot={{ r: 5, fill: '#16a34a' }}
        />
        {/* Segundo "dataKey" só pra alimentar o tooltip com o count (operações) */}
        <Area type="monotone" dataKey="count" stroke="transparent" fill="transparent" dot={false} activeDot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
1000
