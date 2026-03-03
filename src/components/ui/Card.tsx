import { cn } from '@/lib/utils'

interface CardProps {
  className?: string
  children: React.ReactNode
  padding?: boolean
}

export default function Card({ className, children, padding = true }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-gray-100', padding && 'p-6', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
