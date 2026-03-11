'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DEAL_STATUS_LABELS } from '@/lib/utils'

interface DealsByStatusProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8',
  proposal: '#3b82f6',
  negotiating: '#f59e0b',
  closed: '#16a34a',
  lost: '#ef4444',
}

export default function DealsByStatus({ data }: DealsByStatusProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: DEAL_STATUS_LABELS[d.status] || d.status,
    color: STATUS_COLORS[d.status] || '#94a3b8',
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, 'Negociações']}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '13px' }}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
        />
        <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={800} animationEasing="ease-out">
          {formatted.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
