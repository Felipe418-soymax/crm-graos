'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Filter, ExternalLink, FileText, Search, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PendingDeal } from '@/types'

const UNIT_LABELS: Record<string, string> = { sc: 'sacas', kg: 'kg', t: 'ton' }

function ProgressBar({ shipped, total }: { shipped: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (shipped / total) * 100) : 0
  const color = pct === 0 ? 'bg-red-500' : pct < 50 ? 'bg-orange-500' : pct < 90 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>{shipped.toLocaleString('pt-BR')} entregue</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function PendenciasPage() {
  const router = useRouter()
  const [pending, setPending] = useState<PendingDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [productFilter, setProductFilter] = useState('')
  const [sideFilter, setSideFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  const fetchPending = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('client', search)
      if (productFilter) params.set('product', productFilter)
      if (sideFilter) params.set('side', sideFilter)
      if (stateFilter) params.set('state', stateFilter)
      const res = await fetch(`/api/pendencias?${params}`)
      const json = await res.json()
      setPending(json.data || [])
    } catch {
      console.error('Erro ao buscar pendências')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [productFilter, sideFilter, stateFilter])

  useEffect(() => {
    const t = setTimeout(fetchPending, 300)
    return () => clearTimeout(t)
  }, [search])

  // Get unique products and states for filters
  const products = Array.from(new Set(pending.map((d) => d.product)))
  const states = Array.from(new Set(pending.map((d) => d.clientState))).sort()

  // Summary
  const totalPendingVolume = pending.reduce((s, d) => s + d.pendingBalance, 0)
  const totalDeals = pending.length

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pendências de Carregamento</h1>
        <p className="text-sm text-gray-500 mt-1">Negócios com saldo operacional pendente de entrega</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Negócios Pendentes</p>
          <p className="text-2xl font-bold text-orange-600">{totalDeals}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Volume Pendente Total</p>
          <p className="text-2xl font-bold text-red-600">{totalPendingVolume.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500 font-medium">Produtos Distintos</p>
          <p className="text-2xl font-bold text-gray-700">{products.length}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <Filter size={16} />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Todos produtos</option>
            {products.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sideFilter} onChange={(e) => setSideFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Compra/Venda</option>
            <option value="sell">Venda</option>
            <option value="buy">Compra</option>
          </select>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">Todos estados</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => { setProductFilter(''); setSideFilter(''); setStateFilter(''); setSearch('') }}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Limpar
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package size={48} className="mx-auto text-green-300 mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma pendência encontrada</p>
          <p className="text-gray-400 text-sm mt-1">Todos os negócios fechados estão com entrega completa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((deal) => {
            const pctComplete = deal.volume > 0 ? (deal.totalShipped / deal.volume) * 100 : 0
            const urgencyColor = pctComplete === 0 ? 'border-l-red-500' : pctComplete < 50 ? 'border-l-orange-500' : 'border-l-yellow-500'

            return (
              <div key={deal.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${urgencyColor} p-4 hover:shadow-md transition-shadow`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Left info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{deal.clientName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deal.side === 'sell' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {deal.side === 'sell' ? 'Venda' : 'Compra'}
                      </span>
                      <span className="text-xs text-gray-400">{deal.clientCity}/{deal.clientState}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium">{deal.product}</span>
                      <span>Fechado: {format(new Date(deal.closedAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      <span className="text-xs text-gray-400">{deal.sellerName}</span>
                    </div>
                  </div>

                  {/* Middle: balance */}
                  <div className="w-full md:w-64 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        Negociado: <strong>{deal.volume.toLocaleString('pt-BR')}</strong> {UNIT_LABELS[deal.unit] || deal.unit}
                      </span>
                      <span className="text-red-600 font-semibold">
                        Pendente: {deal.pendingBalance.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <ProgressBar shipped={deal.totalShipped} total={deal.volume} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => router.push(`/carregamentos/${deal.id}`)}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                      title="Ver carregamentos"
                    >
                      <ExternalLink size={14} />
                      Negócio
                    </button>
                    <button
                      onClick={() => router.push(`/ordens/nova?dealId=${deal.id}`)}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                      title="Emitir ordem"
                    >
                      <FileText size={14} />
                      Emitir Ordem
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
