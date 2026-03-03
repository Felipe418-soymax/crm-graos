'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Phone, MapPin, Package } from 'lucide-react'
import { Client } from '@/types'
import Modal from '@/components/ui/Modal'
import ClientForm from '@/components/clients/ClientForm'
import { ClientTypeBadge } from '@/components/ui/Badge'
import Badge from '@/components/ui/Badge'

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchClients() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/clients?${params}`)
    const data = await res.json()
    setClients(data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [search, typeFilter, statusFilter])

  async function handleCreate(data: Partial<Client>) {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao criar cliente'); return }
      setShowModal(false)
      fetchClients()
    } catch { setError('Erro de conexão') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} cliente(s) encontrado(s)</p>
        </div>
        <button
          onClick={() => { setError(''); setShowModal(true) }}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os tipos</option>
          <option value="producer">Produtor</option>
          <option value="buyer">Comprador</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Crie seu primeiro cliente clicando em "Novo Cliente"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-100 transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition">{client.name}</p>
                  {client.farmOrCompany && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{client.farmOrCompany}</p>
                  )}
                </div>
                <ClientTypeBadge type={client.type} />
              </div>

              <div className="space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.city}, {client.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
              </div>

              {/* Products */}
              {client.mainProducts?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {client.mainProducts.slice(0, 3).map((p) => (
                    <span key={p} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full capitalize">{p}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  {client.status === 'active'
                    ? <Badge variant="success">Ativo</Badge>
                    : <Badge variant="danger">Inativo</Badge>
                  }
                </div>
                <span className="text-xs text-gray-400">{(client._count as any)?.deals || 0} negociações</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Novo Cliente" size="lg">
        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
        )}
        <ClientForm onSubmit={handleCreate} onCancel={() => setShowModal(false)} loading={submitting} />
      </Modal>
    </div>
  )
}
