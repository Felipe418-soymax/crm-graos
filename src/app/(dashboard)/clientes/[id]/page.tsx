'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, MapPin, Edit, Plus, Package } from 'lucide-react'
import { Client, Deal } from '@/types'
import Modal from '@/components/ui/Modal'
import ClientForm from '@/components/clients/ClientForm'
import DealForm from '@/components/deals/DealForm'
import { DealStatusBadge, ClientTypeBadge } from '@/components/ui/Badge'
import Badge from '@/components/ui/Badge'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client & { deals?: Deal[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState(false)
  const [dealModal, setDealModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchClient() {
    const res = await fetch(`/api/clients/${id}`)
    const data = await res.json()
    if (res.ok) setClient(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchClient() }, [id])

  async function handleUpdate(data: Partial<Client>) {
    setSubmitting(true); setError('')
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSubmitting(false); return }
    setEditModal(false); fetchClient(); setSubmitting(false)
  }

  async function handleCreateDeal(data: Partial<Deal>) {
    setSubmitting(true); setError('')
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, clientId: id }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setSubmitting(false); return }
    setDealModal(false); fetchClient(); setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  )

  if (!client) return (
    <div className="p-8 text-center text-gray-500">
      <p>Cliente não encontrado.</p>
      <Link href="/clientes" className="text-green-600 hover:underline mt-2 block">← Voltar</Link>
    </div>
  )

  const closedDeals = (client.deals || []).filter((d) => d.status === 'closed')
  const totalVolume = closedDeals.reduce((s, d) => s + d.totalValue, 0)
  const totalCommission = closedDeals.reduce((s, d) => s + d.commissionValue, 0)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/clientes" className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ClientTypeBadge type={client.type} />
              {client.status === 'active'
                ? <Badge variant="success">Ativo</Badge>
                : <Badge variant="danger">Inativo</Badge>
              }
            </div>
          </div>
        </div>
        <button
          onClick={() => { setError(''); setEditModal(true) }}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">Informações</h3>

          {client.farmOrCompany && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Fazenda / Empresa</p>
              <p className="text-sm text-gray-700 font-medium">{client.farmOrCompany}</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            {client.city}, {client.state}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Phone size={16} className="text-gray-400" />
            {client.phone}
          </div>

          {client.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail size={16} className="text-gray-400" />
              {client.email}
            </div>
          )}

          {client.mainProducts?.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Produtos</p>
              <div className="flex flex-wrap gap-1.5">
                {client.mainProducts.map((p) => (
                  <span key={p} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full capitalize">{p}</span>
                ))}
              </div>
            </div>
          )}

          {client.estimatedVolume && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Volume estimado</p>
              <p className="text-sm font-medium text-gray-700">{formatNumber(client.estimatedVolume)} sacas/ano</p>
            </div>
          )}

          {client.notes && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Observações</p>
              <p className="text-sm text-gray-600 leading-relaxed">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-2xl font-bold text-gray-900">{(client.deals || []).length}</p>
              <p className="text-xs text-gray-500 mt-1">Negociações</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalVolume)}</p>
              <p className="text-xs text-gray-500 mt-1">Volume total</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totalCommission)}</p>
              <p className="text-xs text-gray-500 mt-1">Comissão total</p>
            </div>
          </div>

          {/* Deals table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Negociações</h3>
              <button
                onClick={() => { setError(''); setDealModal(true) }}
                className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                <Plus size={14} />
                Nova negociação
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Produto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Volume</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(client.deals || []).map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-3 font-medium text-gray-900 capitalize">{deal.product}</td>
                      <td className="px-4 py-3 text-gray-600">{formatNumber(deal.volume)} {deal.unit}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(deal.totalValue)}</td>
                      <td className="px-4 py-3"><DealStatusBadge status={deal.status} /></td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(deal.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(client.deals || []).length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma negociação ainda</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Cliente" size="lg">
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <ClientForm client={client} onSubmit={handleUpdate} onCancel={() => setEditModal(false)} loading={submitting} />
      </Modal>

      {/* Deal modal */}
      <Modal open={dealModal} onClose={() => setDealModal(false)} title="Nova Negociação" size="lg">
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <DealForm onSubmit={handleCreateDeal} onCancel={() => setDealModal(false)} loading={submitting} />
      </Modal>
    </div>
  )
}
