'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Truck, Package, DollarSign, Weight, FileText, Trash2, Edit, Calendar, FileDown, CheckCircle2, AlertCircle } from 'lucide-react'
import { Deal, Shipment, CompanySettings } from '@/types'
import { formatCurrency, formatNumber, formatDate, calculateBagsFromWeight } from '@/lib/utils'
import { pdfHeader, pdfFooter, PDF_BASE_CSS } from '@/lib/pdf-branding'
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
  const [company, setCompany] = useState<CompanySettings | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const [dealRes, shipRes, compRes] = await Promise.all([
        fetch(`/api/deals/${dealId}`),
        fetch(`/api/shipments?dealId=${dealId}`),
        fetch('/api/company/settings'),
      ])
      const dealData = await dealRes.json()
      const shipData = await shipRes.json()
      setDeal(dealData.data)
      setShipments(shipData.data || [])
      if (compRes.ok) {
        const compData = await compRes.json()
        if (compData.data) {
          setCompany(compData.data)
        }
      }
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

  async function handleConfirmShipment(id: string) {
    const res = await fetch(`/api/shipments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    if (res.ok) {
      fetchData()
    }
  }

  const brandLabel = company?.tradeName || company?.companyName || 'Grãos CRM'

  function openReportWindow(html: string) {
    const win = window.open('', '_blank', 'width=1000,height=750')
    if (!win) { alert('Permita pop-ups para gerar o relatório.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  // ── Relatório individual de um carregamento ──────────────────────────────
  function handleExportShipment(ship: Shipment) {
    if (!deal) return

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Comprovante — ${ship.truckPlate} — ${deal.client?.name}</title>
<style>${PDF_BASE_CSS}</style>
</head><body>
${pdfHeader(company, 'Comprovante de Carregamento', deal.client?.name || '')}

<h2>Dados do Negócio</h2>
<div class="info-row">
  <div class="item"><div class="lbl">Cliente</div><div class="val">${deal.client?.name || '-'}</div></div>
  <div class="item"><div class="lbl">Produto (Negócio)</div><div class="val">${deal.product}</div></div>
  <div class="item"><div class="lbl">Operação</div><div class="val">${deal.side === 'sell' ? 'Venda' : 'Compra'}</div></div>
  <div class="item"><div class="lbl">Fechado em</div><div class="val">${formatDate(deal.closedAt)}</div></div>
</div>

<h2>Dados do Carregamento</h2>
<div class="grid2">
  <div class="card"><div class="clbl">Data de Carregamento</div><div class="cval">${formatDate(ship.loadingDate)}</div></div>
  <div class="card"><div class="clbl">Placa do Caminhão</div><div class="cval plate">${ship.truckPlate}</div></div>
  <div class="card"><div class="clbl">Produto Carregado</div><div class="cval" style="text-transform:capitalize">${ship.loadedProduct}</div></div>
  <div class="card"><div class="clbl">Peso da Carga</div><div class="cval">${formatNumber(ship.cargoWeightKg, 0)} kg</div></div>
  <div class="card"><div class="clbl">Quantidade de Sacas</div><div class="cval">${formatNumber(ship.bagsQuantity, 2)}</div></div>
  <div class="card"><div class="clbl">Valor da Carga</div><div class="cval g">${formatCurrency(ship.cargoValue)}</div></div>
  <div class="card"><div class="clbl">Motorista</div><div class="cval">${ship.driverName}</div></div>
  <div class="card"><div class="clbl">Telefone do Motorista</div><div class="cval">${ship.driverPhone}</div></div>
</div>

${ship.invoicePdfPath ? '<p style="font-size:10px;color:#6b7280;margin-top:8px">📎 Nota fiscal anexada ao sistema</p>' : ''}

${pdfFooter(company)}
</body></html>`

    openReportWindow(html)
  }

  // ── Relatório completo do negócio ────────────────────────────────────────
  function handleExportDeal() {
    if (!deal || shipments.length === 0) return

    const shipmentsRows = [...shipments]
      .sort((a, b) => new Date(a.loadingDate).getTime() - new Date(b.loadingDate).getTime())
      .map(s => `<tr>
        <td>${formatDate(s.loadingDate)}</td>
        <td style="font-family:monospace;font-weight:600">${s.truckPlate}</td>
        <td style="text-transform:capitalize">${s.loadedProduct}</td>
        <td class="r">${formatNumber(s.cargoWeightKg, 0)}</td>
        <td class="r">${formatNumber(s.bagsQuantity, 2)}</td>
        <td class="r" style="font-weight:700">${formatCurrency(s.cargoValue)}</td>
        <td>${s.driverName}</td>
      </tr>`).join('')

    const _totalWeight = shipments.reduce((sum, s) => sum + s.cargoWeightKg, 0)
    const _totalBags = shipments.reduce((sum, s) => sum + s.bagsQuantity, 0)
    const _totalValue = shipments.reduce((sum, s) => sum + s.cargoValue, 0)
    const _avgTicket = shipments.length > 0 ? _totalValue / shipments.length : 0
    const _products = Array.from(new Set(shipments.map(s => s.loadedProduct))).join(', ')
    const _sorted = [...shipments].sort((a, b) => new Date(a.loadingDate).getTime() - new Date(b.loadingDate).getTime())
    const _first = _sorted[0]?.loadingDate || null
    const _last = _sorted[_sorted.length - 1]?.loadingDate || null

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Relatório de Carregamentos — ${deal.client?.name}</title>
<style>${PDF_BASE_CSS}</style>
</head><body>
${pdfHeader(company, 'Relatório de Carregamentos', deal.client?.name || '')}

<h2>Dados do Negócio</h2>
<div class="info-row">
  <div class="item"><div class="lbl">Cliente</div><div class="val">${deal.client?.name || '-'}</div></div>
  <div class="item"><div class="lbl">Produto</div><div class="val">${deal.product}</div></div>
  <div class="item"><div class="lbl">Operação</div><div class="val">${deal.side === 'sell' ? 'Venda' : 'Compra'}</div></div>
  <div class="item"><div class="lbl">Volume Contratado</div><div class="val">${formatNumber(deal.volume)} ${deal.unit}</div></div>
</div>
<div class="info-row" style="grid-template-columns:repeat(3,1fr)">
  <div class="item"><div class="lbl">Valor Total do Negócio</div><div class="val" style="color:#16a34a">${formatCurrency(deal.totalValue)}</div></div>
  <div class="item"><div class="lbl">Comissão (${deal.commissionPct}%)</div><div class="val">${formatCurrency(deal.commissionValue)}</div></div>
  <div class="item"><div class="lbl">Fechado em</div><div class="val">${formatDate(deal.closedAt)}</div></div>
</div>

<h2>Resumo dos Carregamentos</h2>
<div class="grid">
  <div class="card"><div class="clbl">Total de Caminhões</div><div class="cval">${shipments.length}</div></div>
  <div class="card"><div class="clbl">Peso Total</div><div class="cval">${formatNumber(_totalWeight, 0)} kg</div></div>
  <div class="card"><div class="clbl">Total de Sacas</div><div class="cval">${formatNumber(_totalBags, 2)}</div></div>
  <div class="card"><div class="clbl">Valor Total Carregado</div><div class="cval g">${formatCurrency(_totalValue)}</div></div>
</div>
<div class="info-row">
  <div class="item"><div class="lbl">Produto(s)</div><div class="val">${_products}</div></div>
  <div class="item"><div class="lbl">Ticket Médio</div><div class="val">${formatCurrency(_avgTicket)}</div></div>
  <div class="item"><div class="lbl">Primeiro Carregamento</div><div class="val">${formatDate(_first)}</div></div>
  <div class="item"><div class="lbl">Último Carregamento</div><div class="val">${formatDate(_last)}</div></div>
</div>

<h2>Detalhamento — ${shipments.length} carregamento(s)</h2>
<table>
  <thead><tr>
    <th>Data</th><th>Placa</th><th>Produto</th><th class="r">Peso (kg)</th><th class="r">Sacas</th><th class="r">Valor</th><th>Motorista</th>
  </tr></thead>
  <tbody>
    ${shipmentsRows}
    <tr class="tot">
      <td colspan="3">TOTAIS</td>
      <td class="r">${formatNumber(_totalWeight, 0)}</td>
      <td class="r">${formatNumber(_totalBags, 2)}</td>
      <td class="r">${formatCurrency(_totalValue)}</td>
      <td></td>
    </tr>
  </tbody>
</table>

${pdfFooter(company)}
</body></html>`

    openReportWindow(html)
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDeal}
              disabled={shipments.length === 0}
              className="inline-flex items-center gap-2 border border-green-600 text-green-700 hover:bg-green-50 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileDown size={16} />
              Exportar
            </button>
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
            <button
              onClick={() => router.push(`/ordens/nova?dealId=${dealId}`)}
              className="inline-flex items-center gap-2 border border-green-600 text-green-700 hover:bg-green-50 px-5 py-2.5 rounded-xl text-sm font-medium transition"
            >
              <FileText size={18} />
              Emitir Ordem
            </button>
          </div>
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
          <p className="text-sm text-gray-500 mt-1">
            {totalShipments} carregamento(s)
            {shipments.filter(s => s.status === 'pending').length > 0 && (
              <span className="text-amber-600 font-medium ml-1">
                ({shipments.filter(s => s.status === 'pending').length} pendente(s) de registro)
              </span>
            )}
          </p>
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Data</th>
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
                {shipments.map((ship) => {
                  const isPending = ship.status === 'pending'
                  return (
                  <tr key={ship.id} className={`hover:bg-gray-50/50 transition ${isPending ? 'bg-amber-50/60' : ''}`}>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {isPending ? (
                        <button
                          onClick={() => handleConfirmShipment(ship.id)}
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm animate-pulse hover:animate-none"
                          title="Confirmar que o carregamento foi realizado"
                        >
                          <AlertCircle size={14} />
                          Registrar Carga
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 size={14} />
                          Confirmado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{formatDate(ship.loadingDate)}</td>
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
                        {isPending ? (
                          <button
                            onClick={() => {
                              setEditShipment(ship)
                              setError('')
                              setShowModal(true)
                            }}
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Completar dados"
                          >
                            <Edit size={14} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleExportShipment(ship)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Exportar"
                            >
                              <FileDown size={14} />
                            </button>
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
                          </>
                        )}
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
                  )
                })}
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
