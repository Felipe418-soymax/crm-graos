import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: number
  color?: 'green' | 'blue' | 'yellow' | 'purple' | 'orange'
}

const colorMap = {
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', title: 'text-green-700' },
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', title: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', title: 'text-yellow-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', title: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', title: 'text-orange-700' },
}

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'green' }: KpiCardProps) {
  const colors = colorMap[color]
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  )
}
