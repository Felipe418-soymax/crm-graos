'use client'
import { useState } from 'react'
import { Lead } from '@/types'

interface LeadFormProps {
  lead?: Lead
  onSubmit: (data: Partial<Lead>) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

export default function LeadForm({ lead, onSubmit, onCancel, loading }: LeadFormProps) {
  const [form, setForm] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    city: lead?.city || '',
    state: lead?.state || 'MT',
    source: lead?.source || 'call',
    stage: lead?.stage || 'new',
    interestProducts: lead?.interestProducts || '',
    notes: lead?.notes || '',
  })

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      city: form.city,
      state: form.state,
      source: form.source as Lead['source'],
      stage: form.stage as Lead['stage'],
      interestProducts: form.interestProducts,
      notes: form.notes || null,
    })
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div>
        <label className={labelClass}>Nome *</label>
        <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Nome do contato / empresa" />
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
          <label className={labelClass}>Origem *</label>
          <select className={inputClass} value={form.source} onChange={(e) => set('source', e.target.value)}>
            <option value="indication">Indicação</option>
            <option value="instagram">Instagram</option>
            <option value="call">Ligação</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Estágio *</label>
          <select className={inputClass} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
            <option value="new">Novo</option>
            <option value="contacted">Contatado</option>
            <option value="qualified">Qualificado</option>
            <option value="unqualified">Desqualificado</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Produtos de interesse *</label>
        <input className={inputClass} value={form.interestProducts} onChange={(e) => set('interestProducts', e.target.value)}
          required placeholder="soja, milho, algodão..." />
      </div>

      <div>
        <label className={labelClass}>Observações</label>
        <textarea className={inputClass} rows={3} value={form.notes}
          onChange={(e) => set('notes', e.target.value)} placeholder="Detalhes sobre o lead..." />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-60">
          {loading ? 'Salvando...' : (lead ? 'Atualizar' : 'Criar Lead')}
        </button>
      </div>
    </form>
  )
}
