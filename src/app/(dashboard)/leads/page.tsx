'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Phone, MapPin, ArrowRight, UserPlus } from 'lucide-react'
import { Lead } from '@/types'
import Modal from '@/components/ui/Modal'
import LeadForm from '@/components/leads/LeadForm'
import { LeadStageBadge } from '@/components/ui/Badge'
import { LEAD_SOURCE_LABELS, formatDate } from '@/lib/utils'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [converting, setConverting] = useState<string | null>(null)

  async function fetchLeads() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (stageFilter) params.set('stage', stageFilter)
    if (sourceFilter) params.set('source', sourceFilter)
    params.set('converted', 'false')
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchLeads() }, [search, stageFilter, sourceFilter])

  async function handleCreate(data: Partial<Lead>) {
    setSubmitting(true); setError('')
    const method = editLead ? 'PATCH' : 'POST'
    const url = editLead ? `/api/leads/${editLead.id}` : '/api/leads'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro'); setSubmitting(false); return }
    setShowModal(false); setEditLead(null); fetchLeads(); setSubmitting(false)
  }

  async function handleConvert(leadId: string) {
    if (!confirm('Converter este lead em cliente? Um novo cliente será criado com os dados do lead.')) return
    setConverting(leadId)
    const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) alert(json.error || 'Erro ao converter')
    else { alert('Lead convertido em cliente com sucesso!'); fetchLeads() }
    setConverting(null)
  }

  const STAGE_COLORS: Record<string, string> = {
    new: 'border-gray-200',
    contacted: 'border-blue-200',
    qualified: 'border-green-200',
    unqualified: 'border-red-200',
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">{leads.length} lead(s) ativo(s)</p>
        </div>
        <button
          onClick={() => { setError(''); setEditLead(null); setShowModal(true) }}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus size={18} />
          Novo Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar leads..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os estágios</option>
          <option value="new">Novo</option>
          <option value="contacted">Contatado</option>
          <option value="qualified">Qualificado</option>
          <option value="unqualified">Desqualificado</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todas as origens</option>
          <option value="indication">Indicação</option>
          <option value="instagram">Instagram</option>
          <option value="call">Ligação</option>
          <option value="other">Outro</option>
        </select>
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserPlus size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum lead encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <div key={lead.id} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 border border-gray-100 ${STAGE_COLORS[lead.stage]} hover:shadow-md transition`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{LEAD_SOURCE_LABELS[lead.source]}</p>
                </div>
                <LeadStageBadge stage={lead.stage} />
              </div>

              <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                  <span>{lead.city}, {lead.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </div>
                {lead.interestProducts && (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="font-medium text-gray-600">Interesse:</span> {lead.interestProducts}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                <button
                  onClick={() => { setEditLead(lead); setError(''); setShowModal(true) }}
                  className="flex-1 text-xs py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleConvert(lead.id)}
                  disabled={converting === lead.id}
                  className="flex-1 text-xs py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium disabled:opacity-60 flex items-center justify-center gap-1"
                >
                  <ArrowRight size={12} />
                  {converting === lead.id ? '...' : 'Converter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditLead(null) }}
        title={editLead ? 'Editar Lead' : 'Novo Lead'} size="lg">
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <LeadForm lead={editLead || undefined} onSubmit={handleCreate}
          onCancel={() => { setShowModal(false); setEditLead(null) }} loading={submitting} />
      </Modal>
    </div>
  )
}
