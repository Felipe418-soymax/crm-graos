import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
  success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  gray: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function DealStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    new: { label: 'Novo', variant: 'gray' },
    proposal: { label: 'Proposta', variant: 'info' },
    negotiating: { label: 'Negociando', variant: 'warning' },
    closed: { label: 'Fechado', variant: 'success' },
    lost: { label: 'Perdido', variant: 'danger' },
  }
  const { label, variant } = map[status] || { label: status, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}

export function LeadStageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    new: { label: 'Novo', variant: 'gray' },
    contacted: { label: 'Contatado', variant: 'info' },
    qualified: { label: 'Qualificado', variant: 'success' },
    unqualified: { label: 'Desqualificado', variant: 'danger' },
  }
  const { label, variant } = map[stage] || { label: stage, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}

export function ClientTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={type === 'producer' ? 'success' : 'info'}>
      {type === 'producer' ? 'Produtor' : 'Comprador'}
    </Badge>
  )
}
