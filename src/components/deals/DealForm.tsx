'use client'
import { useState, useEffect } from 'react'
import { Deal, Client } from '@/types'

interface DealFormProps {
  deal?: Deal
  onSubmit: (data: Partial<Deal>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const PRODUCTS = [
  { value: 'soja', label: 'Soja' },
  { value: 'milho', label: 'Milho' },
  { value: 'outros', label: 'Outros' },
]
const UNITS = [
  { value: 'sc', label: 'Sacas (sc)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 't', label: 'Toneladas (t)' },
]
const STATUSES = [
  { value: 'new', label: 'Novo' },
  { value: 'proposal', label: 'Proposta' },
  { value: 'negotiating', label: 'Negociando' },
  { value: 'closed', label: 'Fechado' },
  { value: 'lost', label: 'Perdido' },
]

export default function DealForm({ deal, onSubmit, onCancel, loading }: DealFormProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    clientId: deal?.clientId || '',
    product: deal?.product || 'soja',
    side: deal?.side || 'sell',
    volume: deal?.volume?.toString() || '',
    unit: deal?.unit || 'sc',
    unitPrice: deal?.unitPrice?.toString() || '',
    commissionPct: deal?.commissionPct?.toString() || '0.8',
    status: deal?.status || 'new',
    expectedCloseDate: deal?.expectedCloseDate
      ? new Date(deal.expectedCloseDate).toISOString().split('T')[0]
      : '',
    closedAt: deal?.closedAt
      ? new Date(deal.closedAt).toISOString().split('T')[0]
      : '',
    notes: deal?.notes || '',
  })

  const totalValue = parseFloat(form.volume || '0') * parseFloat(form.unitPrice || '0')
  const commissionValue = totalValue * parseFloat(form.commissionPct || '0') / 100

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((d) => setClients(d.data || []))
  }, [])

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      clientId: form.clientId,
      product: form.product as Deal['product'],
      side: form.side as Deal['side'],
      volume: parseFloat(form.volume),
      unit: form.unit as Deal['unit'],
      unitPrice: parseFloat(form.unitPrice),
      commissionPct: parseFloat(form.commissionPct),
      status: form.status as Deal['status'],
      expectedCloseDate: form.expectedCloseDate || null,
      closedAt: form.status === 'closed' ? (form.closedAt || new Date().toISOString().split('T')[0]) : null,
      notes: form.notes || null,
    })
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Client */}
      <div>
        <label className={labelClass}>Cliente *</label>
        <select className={inputClass} value={form.clientId} onChange={(e) => set('clientId', e.target.value)} required>
          <option value="">Selecione um cliente</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.type === 'producer' ? 'Produtor' : 'Comprador'})</option>
          ))}
        </select>
      </div>

      {/* Product + Side */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Produto *</label>
          <select className={inputClass} value={form.product} onChange={(e) => set('product', e.target.value)}>
            {PRODUCTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Operação *</label>
          <select className={inputClass} value={form.side} onChange={(e) => set('side', e.target.value)}>
            <option value="sell">Venda</option>
            <option value="buy">Compra</option>
          </select>
        </div>
      </div>

      {/* Volume + Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Volume *</label>
          <input type="number" step="0.01" min="0" className={inputClass} value={form.volume}
            onChange={(e) => set('volume', e.target.value)} required placeholder="5000" />
        </div>
        <div>
          <label className={labelClass}>Unidade *</label>
          <select className={inputClass} value={form.unit} onChange={(e) => set('unit', e.target.value)}>
            {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Price + Commission */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Preço Unitário (R$) *</label>
          <input type="number" step="0.01" min="0" className={inputClass} value={form.unitPrice}
            onChange={(e) => set('unitPrice', e.target.value)} required placeholder="128.50" />
        </div>
        <div>
          <label className={labelClass}>Comissão (%)</label>
          <input type="number" step="0.01" min="0" max="100" className={inputClass} value={form.commissionPct}
            onChange={(e) => set('commissionPct', e.target.value)} placeholder="0.8" />
        </div>
      </div>

      {/* Calculated values */}
      {totalValue > 0 && (
        <div className="bg-green-50 rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-green-600 font-medium">Total calculado</p>
            <p className="text-lg font-bold text-green-800">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">Comissão</p>
            <p className="text-lg font-bold text-green-800">
              {commissionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>
      )}

      {/* Status + Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Status *</label>
          <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Previsão de fechamento</label>
          <input type="date" className={inputClass} value={form.expectedCloseDate}
            onChange={(e) => set('expectedCloseDate', e.target.value)} />
        </div>
      </div>

      {form.status === 'closed' && (
        <div>
          <label className={labelClass}>Data de fechamento</label>
          <input type="date" className={inputClass} value={form.closedAt}
            onChange={(e) => set('closedAt', e.target.value)} />
        </div>
      )}

      {/* Notes */}
      <div>
        <label className={labelClass}>Observações</label>
        <textarea className={inputClass} rows={3} value={form.notes}
          onChange={(e) => set('notes', e.target.value)} placeholder="Detalhes da negociação..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
          {loading ? 'Salvando...' : (deal ? 'Atualizar' : 'Criar Negociação')}
        </button>
      </div>
    </form>
  )
}
