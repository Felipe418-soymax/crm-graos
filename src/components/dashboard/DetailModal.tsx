'use client'
import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { formatCurrency, formatDate, UNIT_LABELS } from '@/lib/utils'
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DetailType = 'revenue' | 'volume' | 'deals' | 'leads' | 'commission'

interface Filters {
  month:     number
  year:      number
  startDate: string
  endDate:   string
  region:    string
}

interface DetailModalProps {
  open:    boolean
  onClose: () => void
  type:    DetailType | null
  filters: Filters
}

interface SortState { col: string; dir: 'asc' | 'desc' }

const TITLES: Record<DetailType, string> = {
  revenue:    'Dinheiro Movimentado — Detalhamento',
  volume:     'Volume Negociado — Detalhamento',
  deals:      'Operações Fechadas — Detalhamento',
  leads:      'Leads Novos — Detalhamento',
  commission: 'Comissão do Mês — Detalhamento',
}

const STAGE: Record<string, string> = {
  new: 'Novo', contacted: 'Contatado', qualified: 'Qualificado', unqualified: 'Desqualificado',
}

export default function DetailModal({ open, onClose, type, filters }: DetailModalProps) {
  const [data,    setData]    = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sort,    setSort]    = useState<SortState | null>(null)

  useEffect(() => {
    if (!open || !type) return
    setLoading(true); setSort(null); setData([])
    const p = new URLSearchParams({ type })
    if (filters.startDate && filters.endDate) {
      p.set('startDate', filters.startDate); p.set('endDate', filters.endDate)
    } else {
      p.set('month', String(filters.month)); p.set('year', String(filters.year))
    }
    if (filters.region) p.set('region', filters.region)
    fetch('/api/dashboard/detail?' + p)
      .then(r => r.json()).then(d => setData(d.data || []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [open, type, filters.month, filters.year, filters.startDate, filters.endDate, filters.region])

  function toggleSort(col: string) {
    setSort(s => {
      if (!s || s.col !== col) return { col, dir: 'desc' }
      if (s.dir === 'desc')   return { col, dir: 'asc' }
      return null
    })
  }

  const rows = sort
    ? [...data].sort((a, b) => {
        let av: any = a[sort.col] ?? ''
        let bv: any = b[sort.col] ?? ''
        if (sort.col === 'clientName') { av = a.client?.name ?? ''; bv = b.client?.name ?? '' }
        if (sort.col === 'region') {
          av = a.client ? (a.client.city + '-' + a.client.state) : ''
          bv = b.client ? (b.client.city + '-' + b.client.state) : ''
        }
        if (typeof av === 'string') av = av.toLowerCase()
        if (typeof bv === 'string') bv = bv.toLowerCase()
        if (av < bv) return sort.dir === 'asc' ? -1 : 1
        if (av > bv) return sort.dir === 'asc' ?  1 : -1
        return 0
      })
    : data

  function SortIcon({ col }: { col: string }) {
    if (!sort || sort.col !== col) return <ArrowUpDown size={12} className="text-gray-300 ml-1" />
    if (sort.dir === 'desc')       return <ArrowDown   size={12} className="text-green-600 ml-1" />
    return <ArrowUp size={12} className="text-green-600 ml-1" />
  }

  function Th({ col, label, right }: { col: string; label: string; right?: boolean }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        className={cn('px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50 cursor-pointer select-none whitespace-nowrap', right ? 'text-right' : 'text-left')}
      >
        <span className={cn('inline-flex items-center gap-0.5', right && 'flex-row-reverse')}>
          {label}<SortIcon col={col} />
        </span>
      </th>
    )
  }

  if (!type) return null

  const totalValue = rows.reduce((s: number, r: any) => s + (r.totalValue      || 0), 0)
  const totalComm  = rows.reduce((s: number, r: any) => s + (r.commissionValue || 0), 0)

  const content = () => {
    if (loading) return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-green-600" />
      </div>
    )
    if (rows.length === 0) return (
      <p className="text-center text-gray-400 py-12 text-sm">Nenhum dado encontrado para o período selecionado.</p>
    )

    if (type === 'leads') return (
      <>
        <table className="w-full text-sm">
          <thead><tr>
            <Th col="name"      label="Nome"       />
            <Th col="city"      label="Cidade"     />
            <Th col="state"     label="Estado"     />
            <Th col="stage"     label="Status"     />
            <Th col="source"    label="Origem"     />
            <Th col="createdAt" label="Cadastro"   />
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                <td className="px-4 py-3 text-gray-600">{r.city  || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{r.state || '—'}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                    {STAGE[r.stage] || r.stage}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 capitalize">{r.source || '—'}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 text-sm text-gray-500">
          Total: <strong className="text-gray-900">{rows.length} leads</strong>
        </div>
      </>
    )

    return (
      <>
        <table className="w-full text-sm">
          <thead><tr>
            <Th col="clientName"     label="Cliente"   />
            <Th col="region"         label="Região"    />
            <Th col="product"        label="Produto"   />
            <Th col="volume"         label="Volume"    right />
            {(type === 'revenue' || type === 'deals')  && <Th col="totalValue"      label="Valor"     right />}
            {type === 'commission'                     && <Th col="commissionValue" label="Comissão"  right />}
            {type === 'commission'                     && <Th col="commissionPct"   label="%"         right />}
            <Th col="closedAt" label="Data" />
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r: any) => {
              const nm  = r.client?.name  || '—'
              const cty = r.client?.city  || ''
              const st  = r.client?.state || ''
              const reg = cty && st ? (cty + ' - ' + st) : (cty || st || '—')
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px]"><span className="block truncate">{nm}</span></td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{reg}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{r.product}</td>
                  <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                    {r.volume?.toLocaleString('pt-BR')} {UNIT_LABELS[r.unit as keyof typeof UNIT_LABELS] || r.unit}
                  </td>
                  {(type === 'revenue' || type === 'deals') && (
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(r.totalValue)}</td>
                  )}
                  {type === 'commission' && (
                    <td className="px-4 py-3 text-right font-semibold text-green-700 whitespace-nowrap">{formatCurrency(r.commissionValue)}</td>
                  )}
                  {type === 'commission' && (
                    <td className="px-4 py-3 text-right text-gray-500">{r.commissionPct}%</td>
                  )}
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.closedAt ? formatDate(r.closedAt) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex flex-wrap gap-6 text-sm">
          <span className="text-gray-500">Operações: <strong className="text-gray-900">{rows.length}</strong></span>
          {(type === 'revenue' || type === 'deals') && (
            <span className="text-gray-500">Total: <strong className="text-gray-900">{formatCurrency(totalValue)}</strong></span>
          )}
          {type === 'commission' && (
            <span className="text-gray-500">Comissão total: <strong className="text-green-700">{formatCurrency(totalComm)}</strong></span>
          )}
        </div>
      </>
    )
  }

  return (
    <Modal open={open} onClose={onClose} title={TITLES[type]} size="xl">
      <div className="overflow-x-auto">{content()}</div>
    </Modal>
  )
}
