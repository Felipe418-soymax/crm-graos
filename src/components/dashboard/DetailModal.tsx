'use client'
import { useEffect, useState } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, UNIT_LABELS, LEAD_SOURCE_LABELS, LEAD_STAGE_LABELS } from '@/lib/utils'

export type DetailType = 'revenue' | 'volume' | 'deals' | 'commission' | 'leads'

interface Filters {
  month: number
  year: number
  startDate: string
  endDate: string
  region: string
}

interface DetailModalProps {
  open: boolean
  onClose: () => void
  type: DetailType
  filters: Filters
}

const TYPE_TITLES: Record<DetailType, string> = {
  revenue: 'Dinheiro Movimentado — Detalhamento',
  volume: 'Volume Negociado — Detalhamento',
  deals: 'Operações Fechadas — Detalhamento',
  commission: 'Comissão do Mês — Detalhamento',
  leads: 'Leads Novos — Detalhamento',
}

type SortDir = 'asc' | 'desc'

export default function DetailModal({ open, onClose, type, filters }: DetailModalProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setData([])
    const p = new URLSearchParams({
      type,
      month: String(filters.month),
      year: String(filters.year),
    })
    if (filters.startDate) p.set('startDate', filters.startDate)
    if (filters.endDate) p.set('endDate', filters.endDate)
    if (filters.region) p.set('region', filters.region)
    fetch('/api/dashboard/detail?' + p)
      .then(r => r.json())
      .then(d => { setData(d.data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [open, type, JSON.stringify(filters)])

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function getSorted() {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      let av: any = a
      let bv: any = b
      for (const k of sortKey.split('.')) { av = av?.[k]; bv = bv?.[k] }
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''))
        : String(bv ?? '').localeCompare(String(av ?? ''))
    })
  }

  function Th({ label, k, align = 'left' }: { label: string; k: string; align?: string }) {
    const active = sortKey === k
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`px-4 py-3 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-800 select-none text-${align} whitespace-nowrap`}
      >
        {label}
        {active
          ? sortDir === 'asc'
            ? <ChevronUp size={11} className="inline ml-1 text-green-600" />
            : <ChevronDown size={11} className="inline ml-1 text-green-600" />
          : <span className="inline ml-1 opacity-30">↕</span>}
      </th>
    )
  }

  if (!open) return null
  const rows = getSorted()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">{TYPE_TITLES[type]}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{rows.length} registro(s) encontrado(s)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">
              Nenhum dado para o período/filtro selecionado
            </div>
          ) : type === 'leads' ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <Th label="Nome" k="name" />
                  <Th label="Cidade" k="city" />
                  <Th label="UF" k="state" />
                  <Th label="Origem" k="source" />
                  <Th label="Estágio" k="stage" />
                  <Th label="Cadastro" k="createdAt" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.city}</td>
                    <td className="px-4 py-3 text-gray-500">{r.state}</td>
                    <td className="px-4 py-3 text-gray-600">{LEAD_SOURCE_LABELS[r.source] || r.source}</td>
                    <td className="px-4 py-3 text-gray-600">{LEAD_STAGE_LABELS[r.stage] || r.stage}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <Th label="Cliente" k="client.name" />
                  <Th label="Produto" k="product" />
                  <Th label="Volume" k="volume" align="right" />
                  <Th label="Total" k="totalValue" align="right" />
                  <Th label="Comissão" k="commissionValue" align="right" />
                  <Th label="Fechamento" k="closedAt" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.client?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{r.product}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(r.volume)} {UNIT_LABELS[r.unit] || r.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(r.totalValue)}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{formatCurrency(r.commissionValue)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(r.closedAt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 sticky bottom-0">
                <tr>
                  <td className="px-4 py-3 font-bold text-gray-900" colSpan={2}>
                    Total ({rows.length} op.)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-700">
                    {Object.entries(
                      rows.reduce((acc: Record<string, number>, r: any) => {
                        acc[r.unit] = (acc[r.unit] || 0) + r.volume
                        return acc
                      }, {})
                    ).map(([u, v]) => `${formatNumber(v as number)} ${UNIT_LABELS[u] || u}`).join(' | ')}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {formatCurrency(rows.reduce((s: number, r: any) => s + r.totalValue, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    {formatCurrency(rows.reduce((s: number, r: any) => s + r.commissionValue, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
