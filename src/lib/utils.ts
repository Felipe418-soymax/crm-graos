import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt, { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatMonthYear(month: number, year: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return `${months[month - 1]} ${year}`
}

export const DEAL_STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  proposal: 'Proposta',
  negotiating: 'Negociando',
  closed: 'Fechado',
  lost: 'Perdido',
}

export const DEAL_STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  proposal: 'bg-blue-100 text-blue-700',
  negotiating: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
}

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  producer: 'Produtor',
  buyer: 'Comprador',
}

export const LEAD_STAGE_LABELS: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  unqualified: 'Desqualificado',
}

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  indication: 'Indicação',
  instagram: 'Instagram',
  call: 'Ligação',
  other: 'Outro',
}

export const PRODUCT_LABELS: Record<string, string> = {
  soja: 'Soja',
  milho: 'Milho',
  outros: 'Outros',
}

export const UNIT_LABELS: Record<string, string> = {
  sc: 'Sacas',
  kg: 'Kg',
  t: 'Toneladas',
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(';')
  const dataLines = rows.map((row) =>
    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';')
  )
  return [headerLine, ...dataLines].join('\n')
}

export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}
