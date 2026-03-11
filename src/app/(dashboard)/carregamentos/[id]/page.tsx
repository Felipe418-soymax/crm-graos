'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Truck, Package, DollarSign, Weight, FileText, Trash2, Edit, Calendar } from 'lucide-react'
import { Deal, Shipment } from '@/types'
import { formatCurrency, formatNumber, formatDate, calculateBagsFromWeight } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import ShipmentForm from '@/components/shipments/ShipmentForm'
import Card from '@/components/ui/Card'

export default function DealShipmentsPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string

  const [deal, setDeal] = useState<Deal | null>(null)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editShipment, setEditShipment] = useState<Shipment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      const [dealRes, shipRes] = await Promise.all([
        fetch(`/api/deals/${dealId}`),
        fetch(`/api/shipments?dealId=${dealId}`),
      ])
      const dealData = await dealRes.json()
      const shipData = await shipRes.json()
      setDeal(dealData.data)
      setShipments(shipData.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dealId])

  async function handleSubmit(data: Partial<Shipment>) {
    setSubmitting(true)
    setError('')

    const method = editShipment ? 'PATCH' : 'POST'
    const url = editShipment ? `/api/shipments/${editShipment.id}` : '/api/shipments'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Erro ao salvar')
      setSubmitting(false)
      return
    }

    setShowModal(false)
    setEditShipment(null)
    fetchData()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente remover este carregamento?')) return

    const res = await fetch(`/api/shipments/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchData()
    }
  }

  // Calculate consolidated report
  const totalShipments = shipments.length
  const totalWeight = shipments.reduce((sum, s) => sum + s.cargoWeightKg, 0)
  const totalBags = shipments.reduce((sum, s) => sum + s.bagsQuantity, 0)
  const totalValue = shipments.reduce((sum, s) => sum + s.cargoValue, 0)
  const avgTicket = totalShipments > 0 ? totalValue / totalShipments : 0
  const loadedProducts = Array.from(new Set(shipments.map((s) => s.loadedProduct))).join(', ')
  const sortedByDate = [...shipments].sort(
    (a, b) => new Date(a.loadingDate).getTime() - new Date(b.loadingDate).getTime()
  )
  const firstShipmentDate = sortedByDate[0]?.loadingDate || null
  const lastShipmentDate = sortedByDate[sortedByDate.length - 1]?.loadingDate || null

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-gray-500">Negócio não encontrado</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/carregamentos')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition"
        >
          <ArrowLeft size={16} />
          Voltar para Carregamentos
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.client?.name}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {deal.product} · {deal.side === 'sell' ? 'Venda' : 'Compra'} · {formatNumber(deal.volume)} {deal.unit} ·{' '}
              {formatCurrency(deal.totalValue)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Fechado em {formatDate(deal.closedAt)}</p>
          </div>
          <button
            onClick={() => {
              setError('')
              setEditShipment(null)
              setShowModal(true)
            }}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
          >
            <Plus size={18} />
            Novo Carregamento
          </button>
        </div>
      </div>

      {/* Consolidated Report */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total de Caminhões</p>
              <p className="text-xl font-bold text-gray-900">{totalShipments}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Weight className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Peso Total</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalWeight, 0)} kg</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Package className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total de Sacas</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(totalBags, 2)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Valor Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Extra report info */}
      {totalShipments > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-medium">Produto(s)</p>
              <p className="text-gray-900 font-medium capitalize mt-0.5">{loadedProducts}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Ticket Médio</p>
              <p className="text-gray-900 font-medium mt-0.5">{formatCurrency(avgTicket)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Primeiro Carregamento</p>
              <p className="text-gray-900 font-medium mt-0.5">{formatDate(firstShipmentDate)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Último Carregamento</p>
              <p className="text-gray-900 font-medium mt-0.5">{formatDate(lastShipmentDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Histórico de Carregamentos</h2>
          <p className="text-sm text-gray-500 mt-1">{totalShipments} carregamento(s) registrado(s)</p>
        </div>

        {shipments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Truck size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum carregamento registrado</p>
            <p className="text-xs mt-1">Clique em &quot;Novo Carregamento&quot; para começar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Placa</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produto</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Peso (kg)</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Sacas</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Motorista</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">NF</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shipments.map((ship) => (
                  <tr key={ship.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-3 text-gray-900 whitespace-nowrap">{formatDate(ship.loadingDate)}</td>
                    <td className="px-4 py-3 font-mono text-gray-900 font-semibold">{ship.truckPlate}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{ship.loadedProduct}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatNumber(ship.cargoWeightKg, 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatNumber(ship.bagsQuantity, 2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {formatCurrency(ship.cargoValue)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="text-sm">{ship.driverName}</div>
                      <div className="text-xs text-gray-400">{ship.driverPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ship.invoicePdfPath ? (
                        <a
                          href={ship.invoicePdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium"
                        >
                          <FileText size={14} />
                          Ver
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditShipment(ship)
                            setError('')
                            setShowModal(true)
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(ship.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditShipment(null)
        }}
        title={editShipment ? 'Editar Carregamento' : 'Novo Carregamento'}
        size="lg"
      >
        {error && <div className="mx-6 mt-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        <ShipmentForm
          shipment={editShipment || undefined}
          dealId={dealId}
          productSuggestion={deal.product}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false)
            setEditShipment(null)
          }}
          loading={submitting}
        />
      </Modal>
    </div>
  )
}
