'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DEAL_STATUS_LABELS } from '@/lib/utils'

interface DealsByStatusProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_COLORS: Record<string, string> = {
  new: '#6b7280',
  proposal: '#3b82f6',
  negotiating: '#f59e0b',
  closed: '#16a34a',
  lost: '#ef4444',
}

export default function DealsByStatus({ data }: DealsByStatusProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: DEAL_STATUS_LABELS[d.status] || d.status,
    color: STATUS_COLORS[d.status] || '#6b7280',
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, 'Negociações']}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {formatted.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
