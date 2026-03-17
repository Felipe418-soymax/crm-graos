'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Printer, Edit, CheckCircle, XCircle, Truck, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { LoadingOrder, LoadingOrderStatus, CompanySettings } from '@/types'
import { buildCompanyInfoHtml } from '@/lib/pdf-branding'

interface FieldDef {
  key: string
  label: string
  type: string
}

interface SectionDef {
  title: string
  fields: FieldDef[]
}

const STATUS_LABELS: Record<LoadingOrderStatus, string> = {
  draft: 'Rascunho',
  issued: 'Emitida',
  loading: 'Em Carregamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

const STATUS_COLORS: Record<LoadingOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  issued: 'bg-blue-100 text-blue-700',
  loading: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_TRANSITIONS: Record<string, { label: string; to: string; icon: typeof Send; color: string }[]> = {
  draft: [
    { label: 'Emitir', to: 'issued', icon: Send, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { label: 'Cancelar', to: 'cancelled', icon: XCircle, color: 'bg-red-100 hover:bg-red-200 text-red-700' },
  ],
  issued: [
    { label: 'Iniciar Carregamento', to: 'loading', icon: Truck, color: 'bg-yellow-600 hover:bg-yellow-700 text-white' },
    { label: 'Cancelar', to: 'cancelled', icon: XCircle, color: 'bg-red-100 hover:bg-red-200 text-red-700' },
  ],
  loading: [
    { label: 'Concluir', to: 'completed', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700 text-white' },
    { label: 'Cancelar', to: 'cancelled', icon: XCircle, color: 'bg-red-100 hover:bg-red-200 text-red-700' },
  ],
}

// ── Layout PADRÃO ────────────────────────────────────────────────────────────
const DEFAULT_SECTIONS: SectionDef[] = [
  {
    title: 'Dados do Cliente',
    fields: [
      { key: 'clientName', label: 'Nome', type: 'text' },
      { key: 'clientCnpjCpf', label: 'CNPJ/CPF', type: 'text' },
      { key: 'clientIe', label: 'Inscrição Estadual', type: 'text' },
      { key: 'clientAddress', label: 'Endereço', type: 'text' },
      { key: 'clientCity', label: 'Município', type: 'text' },
      { key: 'clientState', label: 'Estado', type: 'text' },
      { key: 'clientCep', label: 'CEP', type: 'text' },
      { key: 'clientPhone', label: 'Telefone', type: 'text' },
      { key: 'clientEmail', label: 'E-mail', type: 'text' },
    ],
  },
  {
    title: 'Embarque / Destino',
    fields: [
      { key: 'loadingAddress', label: 'End. Embarque', type: 'text' },
      { key: 'deliveryLocation', label: 'Local Entrega', type: 'text' },
      { key: 'deliveryCityUf', label: 'Cidade/UF', type: 'text' },
    ],
  },
  {
    title: 'Transportadora / Motorista',
    fields: [
      { key: 'driverName', label: 'Motorista', type: 'text' },
      { key: 'driverCpf', label: 'CPF', type: 'text' },
      { key: 'driverPhone', label: 'Telefone', type: 'text' },
      { key: 'driverAddress', label: 'Endereço', type: 'text' },
      { key: 'driverCep', label: 'CEP', type: 'text' },
      { key: 'driverEmail', label: 'E-mail', type: 'text' },
      { key: 'carrierName', label: 'Transportadora', type: 'text' },
      { key: 'carrierCnpj', label: 'CNPJ', type: 'text' },
      { key: 'carrierPhone', label: 'Telefone', type: 'text' },
      { key: 'truckPlate', label: 'Placa', type: 'text' },
      { key: 'vehicle', label: 'Veículo', type: 'text' },
      { key: 'scaleWeight', label: 'Peso Balança', type: 'number' },
    ],
  },
  {
    title: 'Destinatário',
    fields: [
      { key: 'recipientName', label: 'Nome', type: 'text' },
      { key: 'recipientCnpjCpf', label: 'CNPJ/CPF', type: 'text' },
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
      { key: 'orderNumber', label: 'Autorização de Carregamento Nº', type: 'text' },
      { key: 'origin', label: 'Origem', type: 'text' },
      { key: 'warehouse', label: 'Armazém / Fazenda', type: 'text' },
      { key: 'clientCity', label: 'Município', type: 'text' },
      { key: 'clientState', label: 'Estado (UF)', type: 'text' },
      { key: 'authorizedCompany', label: 'Empresa autorizada', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
    ],
  },
  {
    title: 'Dados do Motorista',
    fields: [
      { key: 'driverName', label: 'Motorista', type: 'text' },
      { key: 'driverCpf', label: 'CPF', type: 'text' },
      { key: 'driverPhone', label: 'Telefone', type: 'text' },
    ],
  },
  {
    title: 'Dados do Proprietário',
    fields: [
      { key: 'ownerName', label: 'Proprietário', type: 'text' },
    ],
  },
  {
    title: 'Dados do Veículo',
    fields: [
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
      { key: 'cargoType', label: 'Tipo', type: 'text' },
      { key: 'harvest', label: 'Safra', type: 'text' },
      { key: 'commodity', label: 'Mercadoria', type: 'text' },
      { key: 'producerName', label: 'Produtor', type: 'text' },
    ],
  },
  {
    title: 'Itinerário / Destino',
    fields: [
      { key: 'recipientName', label: 'Destinatário', type: 'text' },
      { key: 'quantity', label: 'Quantidade (Kgs)', type: 'number' },
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

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 min-h-[20px]">{value || '—'}</span>
    </div>
  )
}

function getDisplayValue(order: LoadingOrder, key: string, type: string): string {
  const record = order as unknown as Record<string, unknown>
  const val = record[key]
  if (val === null || val === undefined || val === '') return '—'
  if (type === 'number' && typeof val === 'number') return val.toLocaleString('pt-BR')
  return String(val)
}

export default function OrdemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const printRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<LoadingOrder | null>(null)
  const [ready, setReady] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [companyName, setCompanyName] = useState('Grãos CRM')
  const [company, setCompany] = useState<CompanySettings | null>(null)
  const [sections, setSections] = useState<SectionDef[]>(DEFAULT_SECTIONS)

  // Carregar tudo de uma vez: usuário, empresa, ordem
  useEffect(() => {
    const init = async () => {
      // 1. Identificar usuário
      try {
        const meRes = await fetch('/api/auth/me')
        const meJson = await meRes.json()
        if (meJson.user?.email === FABRICIO_EMAIL) {
          setSections(FABRICIO_SECTIONS)
        }
      } catch { /* layout padrão */ }

      // 2. Empresa
      try {
        const compRes = await fetch('/api/company/settings')
        const compJson = await compRes.json()
        if (compJson.data) {
          setCompany(compJson.data)
          setCompanyName(compJson.data.companyName || 'Grãos CRM')
        }
      } catch { /* nome padrão */ }

      // 3. Ordem
      try {
        const orderRes = await fetch(`/api/loading-orders/${params.id}`)
        const orderJson = await orderRes.json()
        setOrder(orderJson.data || null)
        if (searchParams.get('print') === '1' && orderJson.data) {
          setTimeout(() => handlePrint(), 500)
        }
      } catch { /* ordem não encontrada */ }

      setReady(true)
    }

    init()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return
    if (newStatus === 'cancelled' && !confirm('Tem certeza que deseja cancelar esta ordem?')) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/loading-orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (res.ok) setOrder(json.data)
    } catch {
      alert('Erro ao atualizar status')
    } finally {
      setUpdating(false)
    }
  }

  const handlePrint = () => {
    if (!order) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const orderRecord = order as unknown as Record<string, unknown>

    const sectionsHtml = sections.map((section) => {
      const fieldsHtml = section.fields.map((field) => {
        const val = orderRecord[field.key]
        let displayVal = ''
        if (val !== null && val !== undefined && val !== '') {
          displayVal = field.type === 'number' && typeof val === 'number'
            ? val.toLocaleString('pt-BR')
            : String(val)
        }
        return `<div class="field"><label>${field.label}</label><span>${displayVal}</span></div>`
      }).join('\n      ')

      return `
  <div class="section">
    <div class="section-title">${section.title}</div>
    <div class="section-body"><div class="grid">
      ${fieldsHtml}
    </div></div>
  </div>`
    }).join('\n')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ordem #${String(order.orderNumber).padStart(4, '0')}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; padding: 20px; }
  .header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 15px; }
  .header h1 { font-size: 18px; margin-bottom: 4px; }
  .header .meta { font-size: 12px; color: #555; }
  .section { margin-bottom: 12px; border: 1px solid #ccc; }
  .section-title { background: #f0f0f0; padding: 5px 10px; font-weight: bold; font-size: 11px; border-bottom: 1px solid #ccc; text-transform: uppercase; }
  .section-body { padding: 8px 10px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; }
  .field label { font-size: 9px; font-weight: bold; color: #777; text-transform: uppercase; display: block; }
  .field span { font-size: 11px; display: block; min-height: 14px; border-bottom: 1px dotted #ddd; padding-bottom: 2px; }
  .obs { margin-top: 8px; white-space: pre-wrap; font-size: 11px; }
  .footer { margin-top: 30px; display: flex; justify-content: space-between; }
  .sig { width: 45%; text-align: center; border-top: 1px solid #222; padding-top: 5px; font-size: 10px; }
  @media print { body { padding: 10px; } }
</style></head><body>
  <div class="header">
    ${company?.logoUrl ? `<div style="margin-bottom:8px"><img src="${company.logoUrl}" alt="Logo" style="height:44px;max-width:180px;object-fit:contain"></div>` : ''}
    <h1>${companyName} — Ordem de Carregamento</h1>
    ${buildCompanyInfoHtml(company) ? `<div style="font-size:9px;color:#6b7280;line-height:1.6;margin-top:4px">${buildCompanyInfoHtml(company)}</div>` : ''}
    <div class="meta">Nº <strong>${String(order.orderNumber).padStart(4, '0')}</strong> | Data: ${order.issuedAt ? format(new Date(order.issuedAt), 'dd/MM/yyyy HH:mm') : format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')} | Status: ${STATUS_LABELS[order.status as LoadingOrderStatus]}</div>
  </div>

  ${sectionsHtml}

  ${order.observations ? `<div class="section"><div class="section-title">Observações</div><div class="section-body"><div class="obs">${order.observations}</div></div></div>` : ''}

  <div class="footer">
    <div class="sig">Assinatura do Responsável</div>
    <div class="sig">Assinatura do Motorista</div>
  </div>

  <div style="margin-top:20px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:8px;color:#b0b0b0;text-align:right">
    Documento gerado por <span style="font-weight:700;color:#16a34a">Grãos</span><span style="font-weight:600;color:#1a1a2e">CRM</span>
  </div>
</body></html>`

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => printWindow.print()
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Ordem não encontrada</p>
        <button onClick={() => router.push('/ordens')} className="mt-4 text-green-600 hover:underline">Voltar</button>
      </div>
    )
  }

  const transitions = STATUS_TRANSITIONS[order.status] || []

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/ordens')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Ordem #{String(order.orderNumber).padStart(4, '0')}
              </h1>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as LoadingOrderStatus]}`}>
                {STATUS_LABELS[order.status as LoadingOrderStatus]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Criada em {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              {order.seller && ` por ${order.seller.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {order.status === 'draft' && (
            <button
              onClick={() => router.push(`/ordens/nova?edit=${order.id}`)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit size={15} />
              Editar
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            <Printer size={15} />
            Imprimir
          </button>
          {transitions.map((t) => (
            <button
              key={t.to}
              onClick={() => handleStatusChange(t.to)}
              disabled={updating}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${t.color} disabled:opacity-50`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content — seções dinâmicas por perfil */}
      <div ref={printRef} className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200">
        {sections.map((section) => (
          <div key={section.title} className="p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{section.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {section.fields.map((field) => (
                <InfoRow
                  key={field.key}
                  label={field.label}
                  value={getDisplayValue(order, field.key, field.type)}
                />
              ))}
            </div>
          </div>
        ))}

        {order.observations && (
          <div className="p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Observações</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.observations}</p>
          </div>
        )}
      </div>
    </div>
  )
}
