'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, ChevronRight, TrendingUp } from 'lucide-react'
import { Deal, Produto } from '@/types'
import Modal from '@/components/ui/Modal'
import DealForm from '@/components/deals/DealForm'
import { DealStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber, DEAL_STATUS_LABELS, formatDate } from '@/lib/utils'

const STATUSES = ['new', 'proposal', 'negotiating', 'closed', 'lost'] as const
const STATUS_COLUMN_COLORS: Record<string, string> = {
  new: 'bg-gray-50 border-gray-200',
  proposal: 'bg-blue-50 border-blue-200',
  negotiating: 'bg-yellow-50 border-yellow-200',
  closed: 'bg-green-50 border-green-200',
  lost: 'bg-red-50 border-red-200',
}

type DealStatus = typeof STATUSES[number]

export default function NegociacoesPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [products, setProducts] = useState<Array<{value: string, label: string}>>([{value:'soja',label:'Soja'},{value:'milho',label:'Milho'},{value:'outros',label:'Outros'}])

  async function fetchDeals() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (productFilter) params.set('product', productFilter)
    const res = await fetch(`/api/deals?${params}`)
    const data = await res.json()
    setDeals(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDeals() }, [search, productFilter])

  useEffect(() => {
    fetch('/api/produtos').then(r=>r.json()).then(d=>{ if(d.data?.length>0) setProducts(d.data.map((p:Produto)=>({value:p.name.toLowerCase(),label:p.name}))) })
  }, [])

  async function handleSubmit(data: Partial<Deal>) {
    setSubmitting(true); setError('')
    const method = editDeal ? 'PATCH' : 'POST'
    const url = editDeal ? `/api/deals/${editDeal.id}` : '/api/deals'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro'); setSubmitting(false); return }
    setShowModal(false); setEditDeal(null); fetchDeals(); setSubmitting(false)
  }

  async function moveStatus(dealId: string, newStatus: string) {
    const closedAt = newStatus === 'closed' ? new Date().toISOString() : undefined
    await fetch(`/api/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, ...(closedAt ? { closedAt } : {}) }),
    })
    fetchDeals()
  }

  const dealsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = deals.filter((d) => d.status === status)
    return acc
  }, {} as Record<DealStatus, Deal[]>)

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negociações</h1>
          <p className="text-gray-500 text-sm mt-1">{deals.length} negociação(ões)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Kanban
            </button>
            <button onClick={() => setView('table')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              Tabela
            </button>
          </div>
          <button
            onClick={() => { setError(''); setEditDeal(null); setShowModal(true) }}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={18} />
            Nova Negociação
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-52" />
        </div>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os produtos</option>
          {products.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban view */
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STATUSES.map((status) => (
            <div key={status} className={`flex-shrink-0 w-72 rounded-2xl border ${STATUS_COLUMN_COLORS[status]} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DealStatusBadge status={status} />
                  <span className="text-xs text-gray-500 font-medium">({dealsByStatus[status].length})</span>
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  {formatCurrency(dealsByStatus[status].reduce((s, d) => s + d.totalValue, 0))}
                </span>
              </div>

              <div className="space-y-3">
                {dealsByStatus[status].map((deal) => (
                  <div key={deal.id}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition"
                    onClick={() => { setEditDeal(deal); setError(''); setShowModal(true) }}
                  >
                    <p className="font-semibold text-gray-900 text-sm truncate">{deal.client?.name}</p>
                    <p className="text-xs text-gray-500 capitalize mt-0.5">
                      {deal.product} · {deal.side === 'sell' ? 'Venda' : 'Compra'}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(deal.totalValue)}</span>
                      <span className="text-xs text-gray-400">{formatNumber(deal.volume)} {deal.unit}</span>
                    </div>
                    {/* Move buttons */}
                    <div className="flex gap-1 mt-3 pt-2 border-t border-gray-50">
                      {STATUSES.filter((s) => s !== status).slice(0, 3).map((s) => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); moveStatus(deal.id, s) }}
                          className="flex-1 text-[10px] py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition truncate px-1"
                          title={`Mover para ${DEAL_STATUS_LABELS[s]}`}
                        >
                          → {DEAL_STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {dealsByStatus[status].length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">Nenhuma negociação</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Op.</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Volume</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Comissão</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-[140px] truncate">{deal.client?.name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                    <td className="px-4 py-3 text-gray-500">{deal.side === 'sell' ? 'Venda' : 'Compra'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(deal.volume)} {deal.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(deal.totalValue)}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{formatCurrency(deal.commissionValue)}</td>
                    <td className="px-4 py-3"><DealStatusBadge status={deal.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditDeal(deal); setError(''); setShowModal(true) }}
                        className="text-gray-400 hover:text-green-600 transition p-1 rounded-lg hover:bg-green-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deals.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <TrendingUp size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhuma negociação encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditDeal(null) }}
        title={editDeal ? 'Editar Negociação' : 'Nova Negociação'} size="lg">
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <DealForm deal={editDeal || undefined} onSubmit={handleSubmit}
          onCancel={() => { setShowModal(false); setEditDeal(null) }} loading={submitting} />
      </Modal>
    </div>
  )
}
