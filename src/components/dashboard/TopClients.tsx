'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface TopClientsProps {
  data: Array<{ clientId: string; name: string; totalValue: number; dealsCount: number }>
}

export default function TopClients({ data }: TopClientsProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Sem dados no período
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    shortName: d.name.length > 16 ? d.name.substring(0, 16) + '…' : d.name,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={formatted}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="shortName"
          type="category"
          tick={{ fontSize: 11, fill: '#4b5563' }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), 'Volume R$']}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="totalValue" fill="#16a34a" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
