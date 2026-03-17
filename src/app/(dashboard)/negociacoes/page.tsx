'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, Search, ChevronRight, TrendingUp, User as UserIcon, Calendar, Filter } from 'lucide-react'
import { Deal } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Modal from '@/components/ui/Modal'
import DealForm from '@/components/deals/DealForm'
import { DealStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber, DEAL_STATUS_LABELS, formatDate } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'

const STATUSES = ['new', 'proposal', 'negotiating', 'closed', 'lost'] as const
const STATUS_COLUMN_COLORS: Record<string, string> = {
  new: 'bg-gray-50 border-gray-200',
  proposal: 'bg-blue-50 border-blue-200',
  negotiating: 'bg-yellow-50 border-yellow-200',
  closed: 'bg-green-50 border-green-200',
  lost: 'bg-red-50 border-red-200',
}

type DealStatus = typeof STATUSES[number]
type DealWithSeller = Deal & { seller?: { id: string; name: string } }

const DATE_PRESETS = [
  { label: 'Hoje', getRange: () => { const d = new Date(); return { from: format(d, 'yyyy-MM-dd'), to: format(d, 'yyyy-MM-dd') } } },
  { label: 'Últimos 7 dias', getRange: () => ({ from: format(subDays(new Date(), 7), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Este mês', getRange: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'), to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Mês passado', getRange: () => ({ from: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd') }) },
  { label: 'Tudo', getRange: () => ({ from: '', to: '' }) },
]

// Draggable card component
function DraggableCard({ deal, onEdit, isAdmin }: { deal: DealWithSeller; onEdit: (d: Deal) => void; isAdmin: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  })
  const clickTimerRef = useRef<number>(0)
  const movedRef = useRef(false)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition select-none ${isDragging ? 'opacity-40' : ''}`}
      onPointerDown={() => { clickTimerRef.current = Date.now(); movedRef.current = false }}
      onPointerMove={() => { movedRef.current = true }}
      onPointerUp={(e) => {
        const elapsed = Date.now() - clickTimerRef.current
        // Only treat as click if < 200ms and minimal movement
        if (elapsed < 200 && !movedRef.current) {
          e.preventDefault()
          onEdit(deal)
        }
      }}
    >
      <p className="font-semibold text-gray-900 text-sm truncate">{deal.client?.name}</p>
      <p className="text-xs text-gray-500 capitalize mt-0.5">
        {deal.product} · {deal.side === 'sell' ? 'Venda' : 'Compra'}
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-sm font-bold text-gray-900">{formatCurrency(deal.totalValue)}</span>
        <span className="text-xs text-gray-400">{formatNumber(deal.volume)} {deal.unit}</span>
      </div>
      {isAdmin && deal.seller && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <UserIcon size={11} className="text-gray-400" />
          <span>{deal.seller.name}</span>
        </div>
      )}
    </div>
  )
}

// Droppable column component
function DroppableColumn({ status, deals, onEdit, isAdmin }: {
  status: DealStatus; deals: DealWithSeller[]; onEdit: (d: Deal) => void; isAdmin: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const total = deals.reduce((s, d) => s + d.totalValue, 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 rounded-2xl border-2 ${STATUS_COLUMN_COLORS[status]} p-4 transition-all ${isOver ? 'ring-2 ring-green-400 border-green-300 scale-[1.01]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DealStatusBadge status={status} />
          <span className="text-xs text-gray-500 font-medium">({deals.length})</span>
        </div>
        <span className="text-xs font-semibold text-gray-600">{formatCurrency(total)}</span>
      </div>
      <div className="space-y-3 min-h-[80px]">
        {deals.map((deal) => (
          <DraggableCard key={deal.id} deal={deal} onEdit={onEdit} isAdmin={isAdmin} />
        ))}
        {deals.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-6">Nenhuma negociação</p>
        )}
      </div>
    </div>
  )
}

export default function NegociacoesPage() {
  const { isAdmin } = useCurrentUser()
  const [deals, setDeals] = useState<DealWithSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeDeal, setActiveDeal] = useState<DealWithSeller | null>(null)

  // Date filter - default to current month
  const [dateFrom, setDateFrom] = useState(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(() => format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [datePreset, setDatePreset] = useState('Este mês')

  // States for region filter
  const [stateOptions, setStateOptions] = useState<string[]>([])

  // DnD sensor with activation distance to distinguish click from drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Must move 8px before drag activates
      },
    })
  )

  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then((d) => {
        const prods = (d.data || []).map((p: { name: string }) => ({
          value: p.name.toLowerCase(),
          label: p.name,
        }))
        setProductOptions(prods)
      })
      .catch(() => {})
  }, [])

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (productFilter) params.set('product', productFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    const res = await fetch(`/api/deals?${params}`)
    const data = await res.json()
    const allDeals: DealWithSeller[] = data.data || []
    setDeals(allDeals)

    // Extract unique states for region filter
    const statesSet = new Set<string>()
    allDeals.forEach((d) => {
      const client = d.client as Record<string, unknown> | undefined
      const state = client?.state as string | undefined
      if (state) statesSet.add(state)
    })
    setStateOptions(Array.from(statesSet).sort())

    setLoading(false)
  }, [search, productFilter, dateFrom, dateTo])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const applyDatePreset = (label: string) => {
    const preset = DATE_PRESETS.find((p) => p.label === label)
    if (preset) {
      const { from, to } = preset.getRange()
      setDateFrom(from)
      setDateTo(to)
      setDatePreset(label)
    }
  }

  // Filter by state (client's state)
  const filteredDeals = stateFilter
    ? deals.filter((d) => {
        const client = d.client as Record<string, unknown> | undefined
        return client?.state === stateFilter
      })
    : deals

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

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    const deal = event.active.data.current?.deal as DealWithSeller
    setActiveDeal(deal || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null)
    const { active, over } = event
    if (!over) return

    const dealId = active.id as string
    const newStatus = over.id as string

    // Find the deal
    const deal = deals.find((d) => d.id === dealId)
    if (!deal || deal.status === newStatus) return

    // Optimistic update
    const previousDeals = [...deals]
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, status: newStatus as any } : d
      )
    )

    // Persist
    const closedAt = newStatus === 'closed' ? new Date().toISOString() : undefined
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...(closedAt ? { closedAt } : {}) }),
      })
      if (!res.ok) throw new Error('Failed')
    } catch {
      // Rollback on error
      setDeals(previousDeals)
    }
  }

  const dealsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = filteredDeals.filter((d) => d.status === status)
    return acc
  }, {} as Record<DealStatus, DealWithSeller[]>)

  const openEdit = (deal: Deal) => {
    setEditDeal(deal)
    setError('')
    setShowModal(true)
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Negociações</h1>
          <p className="text-gray-500 text-sm mt-1">{filteredDeals.length} negociação(ões)</p>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Calendar size={15} className="text-gray-400" />
        {DATE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyDatePreset(p.label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${datePreset === p.label ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-2">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDatePreset('') }}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs" />
          <span className="text-gray-400 text-xs">a</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDatePreset('') }}
            className="px-2 py-1 border border-gray-200 rounded-lg text-xs" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-52" />
        </div>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os produtos</option>
          {productOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todas regiões</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : view === 'kanban' ? (
        /* Kanban view with drag-and-drop */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
            {STATUSES.map((status) => (
              <DroppableColumn
                key={status}
                status={status}
                deals={dealsByStatus[status]}
                onEdit={openEdit}
                isAdmin={isAdmin}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal && (
              <div className="bg-white rounded-xl p-4 shadow-xl border-2 border-green-400 w-72 opacity-90 rotate-2">
                <p className="font-semibold text-gray-900 text-sm truncate">{activeDeal.client?.name}</p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">{activeDeal.product}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(activeDeal.totalValue)}</span>
                  <span className="text-xs text-gray-400">{formatNumber(activeDeal.volume)} {activeDeal.unit}</span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
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
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Responsável</th>}
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-[140px] truncate">{deal.client?.name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                    <td className="px-4 py-3 text-gray-500">{deal.side === 'sell' ? 'Venda' : 'Compra'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatNumber(deal.volume)} {deal.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(deal.totalValue)}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{formatCurrency(deal.commissionValue)}</td>
                    <td className="px-4 py-3"><DealStatusBadge status={deal.status} /></td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.createdAt)}</td>
                    {isAdmin && <td className="px-4 py-3 text-gray-500 text-xs">{deal.seller?.name || '—'}</td>}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(deal)}
                        className="text-gray-400 hover:text-green-600 transition p-1 rounded-lg hover:bg-green-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDeals.length === 0 && (
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
