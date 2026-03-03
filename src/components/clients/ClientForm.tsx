'use client'
import { useState } from 'react'
import { Client } from '@/types'

interface ClientFormProps {
  client?: Client
  onSubmit: (data: Partial<Client>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const PRODUCTS = ['soja', 'milho', 'algodão', 'sorgo', 'trigo', 'outros']
const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function ClientForm({ client, onSubmit, onCancel, loading }: ClientFormProps) {
  const [form, setForm] = useState({
    type: client?.type || 'producer',
    name: client?.name || '',
    farmOrCompany: client?.farmOrCompany || '',
    city: client?.city || '',
    state: client?.state || 'MT',
    phone: client?.phone || '',
    email: client?.email || '',
    mainProducts: client?.mainProducts || [],
    estimatedVolume: client?.estimatedVolume?.toString() || '',
    notes: client?.notes || '',
    status: client?.status || 'active',
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleProduct(product: string) {
    setForm((f) => ({
      ...f,
      mainProducts: f.mainProducts.includes(product)
        ? f.mainProducts.filter((p) => p !== product)
        : [...f.mainProducts, product],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.mainProducts.length === 0) {
      alert('Selecione ao menos um produto')
      return
    }
    await onSubmit({
      type: form.type as Client['type'],
      name: form.name,
      farmOrCompany: form.farmOrCompany || null,
      city: form.city,
      state: form.state,
      phone: form.phone,
      email: form.email || null,
      mainProducts: form.mainProducts,
      estimatedVolume: form.estimatedVolume ? parseFloat(form.estimatedVolume) : null,
      notes: form.notes || null,
      status: form.status as Client['status'],
    })
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      {/* Type */}
      <div>
        <label className={labelClass}>Tipo de cliente *</label>
        <div className="flex gap-3">
          {[{ value: 'producer', label: 'Produtor' }, { value: 'buyer', label: 'Comprador' }].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('type', opt.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                form.type === opt.value
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Nome completo *</label>
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="João Silva / Fazenda São João" />
      </div>

      <div>
        <label className={labelClass}>Fazenda / Empresa</label>
        <input className={inputClass} value={form.farmOrCompany} onChange={(e) => set('farmOrCompany', e.target.value)} placeholder="Nome da propriedade ou empresa" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Cidade *</label>
          <input className={inputClass} value={form.city} onChange={(e) => set('city', e.target.value)} required placeholder="Sorriso" />
        </div>
        <div>
          <label className={labelClass}>Estado *</label>
          <select className={inputClass} value={form.state} onChange={(e) => set('state', e.target.value)}>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Telefone *</label>
          <input className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} required placeholder="(66) 99999-9999" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
      </div>

      {/* Products */}
      <div>
        <label className={labelClass}>Produtos principais *</label>
        <div className="flex flex-wrap gap-2">
          {PRODUCTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProduct(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition capitalize ${
                form.mainProducts.includes(p)
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>Volume estimado (sacas/ano)</label>
        <input type="number" min="0" className={inputClass} value={form.estimatedVolume}
          onChange={(e) => set('estimatedVolume', e.target.value)} placeholder="10000" />
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea className={inputClass} rows={3} value={form.notes}
          onChange={(e) => set('notes', e.target.value)} placeholder="Informações adicionais sobre o cliente..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
          {loading ? 'Salvando...' : (client ? 'Atualizar' : 'Criar Cliente')}
        </button>
      </div>
    </form>
  )
}
