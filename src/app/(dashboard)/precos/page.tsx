'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, BarChart3 } from 'lucide-react'
import { PriceHistory, Produto } from '@/types'
import Modal from '@/components/ui/Modal'
import { formatDate, UNIT_LABELS } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO, isValid } from 'date-fns'

const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

const ALL_UNITS = [
  { value: 'sc', label: 'Sacas (sc)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 't', label: 'Toneladas (t)' },
  { value: 'L', label: 'Litros (L)' },
  { value: 'mL', label: 'Mililitros (mL)' },
]

const safeISODateOnly = (value: string) => {
  if (typeof value !== 'string') return ''
  const base = value.split('T')[0]
  const d = parseISO(base)
  if (!isValid(d)) return base
  return format(d, 'yyyy-MM-dd')
}

const safeLabelDDMM = (dateStr: string) => {
  const base = typeof dateStr === 'string' ? dateStr.split('T')[0] : ''
  const d = parseISO(base)
  if (!isValid(d)) return base || ''
  return format(d, 'dd/MM')
}

const emptyForm = {
  produtoId: '',
  product: '',
  regionLabel: '',
  date: new Date().toISOString().split('T')[0],
  price: '',
  unit: 'sc',
}

export default function PrecosPage() {
  const [prices, setPrices] = useState<PriceHistory[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [productFilter, setProductFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  // Busca produtos cadastrados
  useEffect(() => {
    fetch('/api/produtos')
      .then((r) => r.json())
      .then((d) => setProdutos(d.data || []))
  }, [])

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (productFilter) params.set('product', productFilter)
    if (regionFilter) params.set('region', regionFilter)
    const res = await fetch(`/api/prices?${params}`)
    const data = await res.json()
    setPrices(data.data || [])
    setLoading(false)
  }, [productFilter, regionFilter])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Ao selecionar produto, preenche nome e unidade automaticamente
  function handleProdutoChange(produtoId: string) {
    const p = produtos.find((p) => p.id === produtoId)
    if (p) {
      setForm((f) => ({ ...f, produtoId: p.id, product: p.name, unit: p.unit }))
    } else {
      setForm((f) => ({ ...f, produtoId: '', product: '' }))
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: form.product,
        produtoId: form.produtoId || null,
        regionLabel: form.regionLabel,
        date: safeISODateOnly(form.date),
        price: parseFloat(form.price),
        unit: form.unit,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error)
      setSubmitting(false)
      return
    }

    setShowModal(false)
    await fetchPrices()
    setSubmitting(false)
    setForm(emptyForm)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro de preço?')) return
    await fetch(`/api/prices/${id}`, { method: 'DELETE' })
    fetchPrices()
  }

  const regions = useMemo(
    () => Array.from(new Set(prices.map((p) => p.regionLabel))).sort(),
    [prices]
  )

  const chartData = useMemo(() => {
    const sortedPrices = [...prices].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const dateMap: Record<string, Record<string, number>> = {}
    for (const p of sortedPrices) {
      const key = (p.date || '').split('T')[0]
      if (!key) continue
      if (!dateMap[key]) dateMap[key] = {}
      dateMap[key][p.regionLabel] = p.price
    }
    return Object.entries(dateMap)
      .map(([date, vals]) => ({ date, label: safeLabelDDMM(date), ...vals }))
      .slice(-30)
  }, [prices])

  const inputClass =
    'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Preços</h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe cotações por produto e região</p>
        </div>
        <button
          onClick={() => { setError(''); setForm(emptyForm); setShowModal(true) }}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus size={18} />
          Registrar Preço
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos os produtos</option>
          {produtos.map((p) => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>

        <input
          type="text"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          placeholder="Filtrar por região..."
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
        />
      </div>

      {/* Chart */}
      {chartData.length > 0 && regions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            Evolução de preços — {productFilter || 'todos'} (últimos 30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${v}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                formatter={(v: unknown, name: string) => {
                  const num = typeof v === 'number' ? v : Number(v)
                  if (!Number.isFinite(num)) return [`R$ 0,00`, name]
                  return [`R$ ${num.toFixed(2)}`, name]
                }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {regions.slice(0, 5).map((region, i) => (
                <Line
                  key={region}
                  type="monotone"
                  dataKey={region}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-900">Registros</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Região</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Preço (R$)</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Unidade</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {prices.map((price) => (
                  <tr key={price.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 text-gray-600">{formatDate(price.date)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{price.product}</td>
                    <td className="px-4 py-3 text-gray-600">{price.regionLabel}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      R$ {price.price.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{UNIT_LABELS[price.unit] || price.unit}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(price.id)}
                        className="text-gray-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {prices.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum registro de preço</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Preço">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Produto *</label>
              {produtos.length > 0 ? (
                <select
                  className={inputClass}
                  value={form.produtoId}
                  onChange={(e) => handleProdutoChange(e.target.value)}
                  required
                >
                  <option value="">Selecione...</option>
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  value={form.product}
                  onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))}
                  placeholder="Nome do produto"
                  required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade *</label>
              <select
                className={inputClass}
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              >
                {ALL_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Região *</label>
            <input
              className={inputClass}
              value={form.regionLabel}
              onChange={(e) => setForm((f) => ({ ...f, regionLabel: e.target.value }))}
              required
              placeholder="Ex: Sorriso/MT, Porto de Santos..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
              <input
                type="date"
                className={inputClass}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preço (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
                placeholder="128.50"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
