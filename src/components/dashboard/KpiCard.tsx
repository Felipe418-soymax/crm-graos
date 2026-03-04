import { LucideIcon, ChevronRight } from 'lucide-react'

type Color = 'green' | 'blue' | 'yellow' | 'purple' | 'orange'

const COLOR_MAP: Record<Color, { bg: string; icon: string; badge: string }> = {
  green: { bg: 'bg-green-50', icon: 'text-green-600 bg-green-100', badge: 'bg-green-600' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600 bg-blue-100', badge: 'bg-blue-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600 bg-yellow-100', badge: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600 bg-purple-100', badge: 'bg-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600 bg-orange-100', badge: 'bg-orange-500' },
}

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: Color
  onClick?: () => void
}

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'green', onClick }: KpiCardProps) {
  const c = COLOR_MAP[color]
  return (
    <div
      onClick={onClick}
      className={`${c.bg} rounded-2xl p-5 border ${onClick ? 'border-transparent cursor-pointer hover:shadow-md hover:border-green-200 active:scale-[0.98]' : 'border-transparent'} transition-all duration-150`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl ${c.icon}`}>
          <Icon size={20} />
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-400 mt-1" />}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
