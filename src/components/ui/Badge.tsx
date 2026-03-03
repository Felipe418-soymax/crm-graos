import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
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
