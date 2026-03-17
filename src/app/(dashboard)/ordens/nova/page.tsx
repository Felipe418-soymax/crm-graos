'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Send } from 'lucide-react'
import type { LoadingOrder } from '@/types'

interface DealWithClient {
  id: string
  product: string
  side: string
  volume: number
  unit: string
  totalValue: number
  status: string
  client?: { id: string; name: string; city: string; state: string; phone: string; email: string | null; farmOrCompany: string | null }
  seller?: { id: string; name: string }
}

interface FieldDef {
  key: string
  label: string
  type: string
}

interface SectionDef {
  title: string
  fields: FieldDef[]
}

// ── Layout PADRÃO (todos os usuários) ────────────────────────────────────────
const DEFAULT_SECTIONS: SectionDef[] = [
  {
    title: 'Dados do Cliente',
    fields: [
      { key: 'clientName', label: 'Nome do Cliente', type: 'text' },
      { key: 'clientCnpjCpf', label: 'CNPJ ou CPF', type: 'text' },
      { key: 'clientAddress', label: 'Endereço', type: 'text' },
      { key: 'clientCity', label: 'Município', type: 'text' },
      { key: 'clientState', label: 'Estado', type: 'text' },
      { key: 'clientCep', label: 'CEP', type: 'text' },
      { key: 'clientIe', label: 'Inscrição Estadual', type: 'text' },
      { key: 'clientEmail', label: 'E-mail', type: 'email' },
      { key: 'clientPhone', label: 'Telefone', type: 'text' },
    ],
  },
  {
    title: 'Embarque / Destino',
    fields: [
      { key: 'loadingAddress', label: 'End. de Embarque', type: 'text' },
      { key: 'deliveryLocation', label: 'Local de Entrega', type: 'text' },
      { key: 'deliveryCityUf', label: 'Cidade/UF Entrega', type: 'text' },
    ],
  },
  {
    title: 'Dados da Transportadora',
    fields: [
      { key: 'carrierName', label: 'Transportadora', type: 'text' },
      { key: 'carrierCnpj', label: 'CNPJ', type: 'text' },
      { key: 'carrierPhone', label: 'Telefone', type: 'text' },
      { key: 'truckPlate', label: 'Placa', type: 'text' },
      { key: 'vehicle', label: 'Veículo', type: 'text' },
      { key: 'scaleWeight', label: 'Peso de Balança (kg)', type: 'number' },
    ],
  },
  {
    title: 'Dados do Motorista',
    fields: [
      { key: 'driverName', label: 'Nome do Motorista', type: 'text' },
      { key: 'driverCpf', label: 'CPF', type: 'text' },
      { key: 'driverPhone', label: 'Telefone', type: 'text' },
      { key: 'driverAddress', label: 'Endereço', type: 'text' },
      { key: 'driverCep', label: 'CEP', type: 'text' },
      { key: 'driverEmail', label: 'E-mail', type: 'email' },
    ],
  },
  {
    title: 'Destinatário / Recebedor',
    fields: [
      { key: 'recipientName', label: 'Nome', type: 'text' },
      { key: 'recipientCnpjCpf', label: 'CNPJ ou CPF', type: 'text' },
      { key: 'recipientPhone', label: 'Telefone', type: 'text' },
      { key: 'recipientAddress', label: 'Endereço', type: 'text' },
      { key: 'recipientCep', label: 'CEP', type: 'text' },
      { key: 'recipientIe', label: 'Inscrição Estadual', type: 'text' },
    ],
  },
  {
    title: 'Produto',
    fields: [
      { key: 'product', label: 'Produto', type: 'text' },
      { key: 'quantity', label: 'Quantidade', type: 'number' },
      { key: 'unit', label: 'Unidade', type: 'text' },
      { key: 'description', label: 'Descrição', type: 'text' },
      { key: 'tare', label: 'Tara (kg)', type: 'number' },
      { key: 'grossWeight', label: 'Peso Bruto (kg)', type: 'number' },
    ],
  },
]

// ── Layout EXCLUSIVO do Fabrício ─────────────────────────────────────────────
const FABRICIO_SECTIONS: SectionDef[] = [
  {
    title: 'Identificação do Documento',
    fields: [
      { key: 'orderNumber', label: 'Autorização de Carregamento Nº', type: 'readonly' },
      { key: 'origin', label: 'Origem', type: 'text' },
      { key: 'warehouse', label: 'Armazém / Fazenda', type: 'text' },
      { key: 'clientCity', label: 'Município', type: 'text' },
      { key: 'clientState', label: 'Estado (UF)', type: 'text' },
      { key: 'authorizedCompany', label: 'Empresa autorizada', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
    ],
  },
  {
    title: 'Dados Gerais do Transporte',
    fields: [
      { key: 'driverName', label: 'Motorista', type: 'text' },
      { key: 'driverCpf', label: 'CPF', type: 'text' },
      { key: 'driverPhone', label: 'Telefone', type: 'text' },
      { key: 'ownerName', label: 'Proprietário', type: 'text' },
      { key: 'truckPlate', label: 'Veículo / Placa', type: 'text' },
      { key: 'vehicleCity', label: 'Cidade do veículo', type: 'text' },
      { key: 'vehicleState', label: 'UF do veículo', type: 'text' },
      { key: 'antt', label: 'ANTT', type: 'text' },
      { key: 'weightKg', label: 'Peso (Kgs)', type: 'number' },
    ],
  },
  {
    title: 'Dados da Carga',
    fields: [
      { key: 'product', label: 'Produto', type: 'text' },
      { key: 'harvest', label: 'Safra', type: 'text' },
      { key: 'producerName', label: 'Produtor', type: 'text' },
    ],
  },
  {
    title: 'Itinerário / Destino',
    fields: [
      { key: 'loadingAddress', label: 'Itinerário', type: 'text' },
      { key: 'deliveryLocation', label: 'Destino', type: 'text' },
    ],
  },
  {
    title: 'Informações Adicionais',
    fields: [
      { key: 'issuedAt', label: 'Data', type: 'date' },
      { key: 'responsibleName', label: 'Responsável', type: 'text' },
    ],
  },
]

const FABRICIO_EMAIL = 'fabricio@crmgraos.com'

export default function NovaOrdemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')
  const shipmentId = searchParams.get('shipmentId')
  const orderId = searchParams.get('edit')

  const [formData, setFormData] = useState<Record<string, string | number | null>>({})
  const [deals, setDeals] = useState<DealWithClient[]>([])
  const [selectedDealId, setSelectedDealId] = useState(dealId || '')
  const [observations, setObservations] = useState('')
  const [saving, setSaving] = useState(false)
  const [ready, setReady] = useState(false)
  const [sections, setSections] = useState<SectionDef[]>(DEFAULT_SECTIONS)
  const [isFabricio, setIsFabricio] = useState(false)

  // 1. Identificar o usuário e definir layout ANTES de tudo
  useEffect(() => {
    let userEmail = ''

    const init = async () => {
      // Buscar quem é o usuário logado
      try {
        const meRes = await fetch('/api/auth/me')
        const meJson = await meRes.json()
        userEmail = meJson.user?.email || ''

        // Se for Fabrício, usar layout exclusivo
        if (userEmail === FABRICIO_EMAIL) {
          setSections(FABRICIO_SECTIONS)
          setIsFabricio(true)

          // Auto-gerar número sequencial para Fabrício (se não editando)
          if (!orderId) {
            try {
              const ordersRes = await fetch('/api/loading-orders')
              const ordersJson = await ordersRes.json()
              const orders = ordersJson.data || []
              const nextNum = String(orders.length + 1).padStart(3, '0')
              setFormData(prev => ({ ...prev, orderNumber: nextNum }))
            } catch { /* fallback */ }
          }
        }
      } catch {
        // fallback: layout padrão
      }

      // Buscar deals fechados
      try {
        const dealsRes = await fetch('/api/deals?status=closed')
        const dealsJson = await dealsRes.json()
        setDeals(dealsJson.data || [])
      } catch {
        // sem deals
      }

      // Se editando, carregar ordem existente
      if (orderId) {
        try {
          const orderRes = await fetch(`/api/loading-orders/${orderId}`)
          const orderJson = await orderRes.json()
          if (orderJson.data) {
            const order = orderJson.data as LoadingOrder
            setSelectedDealId(order.dealId)
            setObservations(order.observations || '')
            const fields: Record<string, string | number | null> = {}
            const orderRecord = order as unknown as Record<string, string | number | null>
            const activeSections = userEmail === FABRICIO_EMAIL ? FABRICIO_SECTIONS : DEFAULT_SECTIONS
            activeSections.forEach((section) => {
              section.fields.forEach((f) => {
                fields[f.key] = orderRecord[f.key] ?? null
              })
            })
            setFormData(fields)
          }
        } catch {
          // erro ao carregar ordem
        }
      }

      setReady(true)
    }

    init()
  }, [orderId])

  // Pre-fill from deal when selected
  useEffect(() => {
    if (!selectedDealId || orderId || !ready) return
    const deal = deals.find((d) => d.id === selectedDealId)
    if (!deal) return

    setFormData((prev) => ({
      ...prev,
      clientName: deal.client?.name || null,
      clientCity: deal.client?.city || null,
      clientState: deal.client?.state || null,
      clientPhone: deal.client?.phone || null,
      clientEmail: deal.client?.email || null,
      product: deal.product,
      quantity: deal.volume,
      unit: deal.unit,
    }))
  }, [selectedDealId, deals, ready])

  // Pre-fill from shipment
  useEffect(() => {
    if (!shipmentId) return
    fetch(`/api/shipments/${shipmentId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const s = json.data
          setFormData((prev) => ({
            ...prev,
            driverName: s.driverName || null,
            driverPhone: s.driverPhone || null,
            truckPlate: s.truckPlate || null,
            grossWeight: s.cargoWeightKg || null,
            product: s.loadedProduct || prev.product || null,
            quantity: s.bagsQuantity || prev.quantity || null,
          }))
        }
      })
  }, [shipmentId])

  const handleField = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value === '' ? null : value,
    }))
  }

  const handleSave = async (issueNow: boolean) => {
    if (!selectedDealId) {
      alert('Selecione um negócio')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...formData, observations }
      const numericFields = ['quantity', 'tare', 'grossWeight', 'scaleWeight', 'weightKg']
      numericFields.forEach((key) => {
        if (payload[key] !== null && payload[key] !== undefined && payload[key] !== '') {
          payload[key] = parseFloat(String(payload[key]))
        } else {
          payload[key] = null
        }
      })

      if (issueNow) {
        payload.status = 'issued'
        payload.issuedAt = new Date().toISOString()
      }

      let res
      if (orderId) {
        res = await fetch(`/api/loading-orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/loading-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dealId: selectedDealId,
            shipmentId: shipmentId || undefined,
            ...payload,
          }),
        })
      }

      const json = await res.json()
      if (res.ok) {
        router.push(`/ordens/${json.data.id}`)
      } else {
        alert(json.error || 'Erro ao salvar')
      }
    } catch {
      alert('Erro ao salvar ordem')
    } finally {
      setSaving(false)
    }
  }

  // Aguardar tudo carregar
  if (!ready) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {orderId ? 'Editar Ordem de Carregamento' : 'Nova Ordem de Carregamento'}
          </h1>
          <p className="text-sm text-gray-500">Preencha os dados e salve como rascunho ou emita a ordem</p>
        </div>
      </div>

      {/* Deal selection */}
      {!orderId && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Negócio vinculado *</label>
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="">Selecione um negócio fechado...</option>
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.client?.name || 'Sem cliente'} — {d.product} ({d.side === 'sell' ? 'Venda' : 'Compra'}) — {d.volume.toLocaleString('pt-BR')} {d.unit}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Form sections — renderiza os campos de acordo com o perfil */}
      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
            {section.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                {field.type === 'readonly' ? (
                  <input
                    type="text"
                    value={formData[field.key] ?? ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] ?? ''}
                    onChange={(e) => handleField(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Observations */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Observações</h2>
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="Observações gerais sobre a ordem de carregamento..."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Send size={18} />
          {saving ? 'Emitindo...' : 'Emitir Ordem'}
        </button>
      </div>
    </div>
  )
}
