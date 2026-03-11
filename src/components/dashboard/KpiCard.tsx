'use client'
import { cn } from '@/lib/utils'
import { LucideIcon, ChevronRight } from 'lucide-react'

interface KpiCardProps {
  title:     string
  value:     string
  subtitle?: string
  icon:      LucideIcon
  trend?:    number
  color?:    'green' | 'blue' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'teal'
  onClick?:  () => void
}

const colorMap = {
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',   border: 'hover:border-green-200' },
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',     border: 'hover:border-blue-200'  },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-amber-100 text-amber-600',   border: 'hover:border-amber-200' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', border: 'hover:border-purple-200'},
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', border: 'hover:border-orange-200'},
  indigo: { bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', border: 'hover:border-indigo-200'},
  teal:   { bg: 'bg-teal-50',   icon: 'bg-teal-100 text-teal-600',     border: 'hover:border-teal-200'  },
}

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'green', onClick }: KpiCardProps) {
  const colors = colorMap[color]
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 group',
        onClick && `cursor-pointer hover:shadow-lg ${colors.border} transition-all duration-200 active:scale-[0.98]`
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200',
        colors.icon,
        onClick && 'group-hover:scale-110'
      )}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 leading-none">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
      </div>
      {onClick && <ChevronRight size={16} className="text-gray-300 mt-1 flex-shrink-0 group-hover:text-gray-500 transition-colors" />}
    </div>
  )
}
