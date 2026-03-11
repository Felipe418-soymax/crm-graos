'use client'
import { useEffect, useState } from 'react'
import { FileText, SlidersHorizontal, MapPin, Calendar, X, FileDown } from 'lucide-react'
import { MonthlyReport } from '@/types'
import { formatCurrency, formatNumber, formatDate, UNIT_LABELS, getCurrentMonthYear } from '@/lib/utils'
import { DealStatusBadge } from '@/components/ui/Badge'
import Card, { CardHeader } from '@/components/ui/Card'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function RelatoriosPage() {
  const { month: cm, year: cy } = getCurrentMonthYear()
  const [month,   setMonth]   = useState(cm)
  const [year,    setYear]    = useState(cy)
  const [report,  setReport]  = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)

  const [region,      setRegion]      = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [regions,     setRegions]     = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const years = [cy - 2, cy - 1, cy, cy + 1]
  const hasFilters = !!(region || startDate || endDate)

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d.regions || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ month: String(month), year: String(year) })
    if (region)    p.set('region',    region)
    if (startDate) p.set('startDate', startDate)
    if (endDate)   p.set('endDate',   endDate)
    fetch('/api/reports/monthly?' + p)
      .then(r => r.json())
      .then(d => { setReport(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year, region, startDate, endDate])

  function clearFilters() { setRegion(''); setStartDate(''); setEndDate('') }

  const periodLabel = startDate && endDate
    ? startDate.split('-').reverse().join('/') + ' a ' + endDate.split('-').reverse().join('/')
    : MONTHS[month - 1] + ' ' + year

  function handleExportPDF() {
    if (!report) return
    const ticketMedio = report.summary.dealsCount > 0
      ? formatCurrency(report.summary.totalValue / report.summary.dealsCount)
      : 'R$ 0,00'

    const dealsRows = report.deals.map((d: any) => {
      const unitLbl = (UNIT_LABELS as Record<string,string>)[d.unit] || d.unit
      return `<tr>
        <td>${d.closedAt ? formatDate(d.closedAt) : '-'}</td>
        <td>${d.client?.name || '-'}</td>
        <td style="text-transform:capitalize">${d.product}</td>
        <td>${d.side === 'sell' ? 'Venda' : 'Compra'}</td>
        <td class="r">${d.volume.toLocaleString('pt-BR')} ${unitLbl}</td>
        <td class="r">${d.unitPrice.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
        <td class="r" style="font-weight:700">${formatCurrency(d.totalValue)}</td>
        <td class="r" style="color:#16a34a">${formatCurrency(d.commissionValue)}</td>
      </tr>`
    }).join('')

    const topRows = report.topClients.map((c: any, i: number) => `
      <tr>
        <td style="font-weight:700;color:${i===0?'#b45309':i===1?'#6b7280':'#9a3412'}">${i+1}º</td>
        <td>${c.name}</td>
        <td class="r">${c.dealsCount}</td>
        <td class="r" style="font-weight:700">${formatCurrency(c.totalValue)}</td>
        <td class="r" style="color:#16a34a;font-weight:700">${formatCurrency(c.commissionValue)}</td>
      </tr>`).join('')

    const volLines = Object.entries(report.summary.volumeByUnit)
      .map(([u, v]) => `${formatNumber(v as number)} ${(UNIT_LABELS as Record<string,string>)[u] || u}`)
      .join(' · ') || '-'

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Relatório Grãos CRM — ${periodLabel}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:28px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #16a34a}
  .brand{font-size:20px;font-weight:700;color:#16a34a}
  .sub{font-size:12px;color:#555;margin-top:4px}
  .meta{font-size:10px;color:#9ca3af;text-align:right;line-height:1.6}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:11px 13px}
  .clbl{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
  .cval{font-size:15px;font-weight:700;color:#111}
  .cval.g{color:#16a34a}
  h2{font-size:10px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.8px;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb}
  table{width:100%;border-collapse:collapse;font-size:10.5px;margin-bottom:4px}
  th{background:#f3f4f6;padding:7px 8px;text-align:left;font-size:9px;color:#6b7280;text-transform:uppercase;border-bottom:1px solid #e5e7eb}
  th.r,td.r{text-align:right}
  td{padding:6px 8px;border-bottom:1px solid #f3f4f6}
  .tot td{background:#f0fdf4;font-weight:700;border-top:2px solid #bbf7d0}
  .footer{margin-top:24px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;display:flex;justify-content:space-between}
  @media print{@page{margin:12mm}body{padding:0}}
</style>
</head><body>
<div class="hdr">
  <div>
    <div class="brand">🌾 Grãos CRM</div>
    <div class="sub">Relatório de Operações — ${periodLabel}${region ? ' &nbsp;·&nbsp; ' + region : ''}</div>
  </div>
  <div class="meta">
    Gerado em ${new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}<br>
    ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
  </div>
</div>

<div class="grid">
  <div class="card"><div class="clbl">Dinheiro Movimentado</div><div class="cval">${formatCurrency(report.summary.totalValue)}</div></div>
  <div class="card"><div class="clbl">Comissão Total</div><div class="cval g">${formatCurrency(report.summary.commissionValue)}</div></div>
  <div class="card"><div class="clbl">Operações Fechadas</div><div class="cval">${report.summary.dealsCount}</div></div>
  <div class="card"><div class="clbl">Ticket Médio</div><div class="cval">${ticketMedio}</div></div>
</div>
<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px 13px;margin-bottom:22px;font-size:11px">
  <span style="color:#6b7280;font-size:9px;text-transform:uppercase;letter-spacing:.5px">Volume Negociado</span>
  <span style="font-weight:700;margin-left:12px">${volLines}</span>
</div>

${report.topClients.length > 0 ? `<h2>Top Clientes do Período</h2>
<table>
  <thead><tr><th>#</th><th>Cliente</th><th class="r">Negociações</th><th class="r">Volume Total</th><th class="r">Comissão</th></tr></thead>
  <tbody>${topRows}</tbody>
</table>` : ''}

<h2>Operações Fechadas — ${report.deals.length} registros</h2>
<table>
  <thead><tr><th>Data</th><th>Cliente</th><th>Produto</th><th>Op.</th><th class="r">Volume</th><th class="r">Preço Unit.</th><th class="r">Total</th><th class="r">Comissão</th></tr></thead>
  <tbody>
    ${dealsRows}
    <tr class="tot">
      <td colspan="6">TOTAIS DO PERÍODO</td>
      <td class="r">${formatCurrency(report.summary.totalValue)}</td>
      <td class="r" style="color:#16a34a">${formatCurrency(report.summary.commissionValue)}</td>
    </tr>
  </tbody>
</table>

<div class="footer">
  <span>Grãos CRM — Sistema de Gestão para Corretores de Commodities</span>
  <span>crm.soymax.site</span>
</div>
<script>window.onload = function(){ window.print() }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=1000,height=750')
    if (!win) { alert('Permita pop-ups para gerar o PDF.'); return }
    win.document.open()
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-500 text-sm mt-1">Análise de desempenho por período</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setShowFilters(f => !f)}
            className={'flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors ' + (showFilters || hasFilters ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300')}>
            <SlidersHorizontal size={14} />
            Filtros
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={!report || report.deals.length === 0}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed">
            <FileDown size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <MapPin size={11} /> Região
              </label>
              <select value={region} onChange={e => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Todas as regiões</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> Data inicial
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="min-w-[150px]">
              <label className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> Data final
              </label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 transition-colors">
                <X size={14} /> Limpar
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              {[region, startDate && endDate && (startDate + ' → ' + endDate)].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600" />
        </div>
      ) : report ? (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dinheiro movimentado</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(report.summary.totalValue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Comissão total</p>
              <p className="text-2xl font-bold text-green-700 mt-2">{formatCurrency(report.summary.commissionValue)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Operações fechadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{report.summary.dealsCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Volume por unidade</p>
              <div className="mt-2 space-y-1">
                {Object.entries(report.summary.volumeByUnit).length === 0
                  ? <p className="text-lg font-bold text-gray-400">-</p>
                  : Object.entries(report.summary.volumeByUnit).map(([unit, vol]) => (
                    <p key={unit} className="text-sm font-bold text-gray-900">
                      {formatNumber(vol as number)} <span className="text-gray-500 font-normal">{(UNIT_LABELS as Record<string,string>)[unit] || unit}</span>
                    </p>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Top clientes */}
          {report.topClients.length > 0 && (
            <Card>
              <CardHeader title="Top Clientes do Período" subtitle={'Ordenado por volume financeiro — ' + periodLabel} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-medium text-gray-500">Rank</th>
                      <th className="text-left py-2 text-xs font-medium text-gray-500">Cliente</th>
                      <th className="text-right py-2 text-xs font-medium text-gray-500">Negociações</th>
                      <th className="text-right py-2 text-xs font-medium text-gray-500">Volume total</th>
                      <th className="text-right py-2 text-xs font-medium text-gray-500">Comissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {report.topClients.map((c: any, i: number) => (
                      <tr key={c.clientId} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <span className={'inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ' + (i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-700':'bg-gray-50 text-gray-500')}>
                            {i+1}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="py-3 text-right text-gray-600">{c.dealsCount}</td>
                        <td className="py-3 text-right font-bold text-gray-900">{formatCurrency(c.totalValue)}</td>
                        <td className="py-3 text-right text-green-700 font-semibold">{formatCurrency(c.commissionValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Tabela de operações */}
          <Card padding={false}>
            <div className="p-6 pb-3">
              <CardHeader title="Operações fechadas" subtitle={periodLabel + (region ? ' · ' + region : '')} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-t border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produto</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Op.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Volume</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Preço Unit.</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {report.deals.map((deal: any) => (
                    <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.closedAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{deal.client?.name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                      <td className="px-4 py-3 text-gray-500">{deal.side === 'sell' ? 'Venda' : 'Compra'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatNumber(deal.volume)} {deal.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{deal.unitPrice.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(deal.totalValue)}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatCurrency(deal.commissionValue)}</td>
                    </tr>
                  ))}
                </tbody>
                {report.deals.length > 0 && (
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td colSpan={6} className="px-6 py-3 font-semibold text-gray-700 text-sm">TOTAIS</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(report.summary.totalValue)}</td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(report.summary.commissionValue)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {report.deals.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma operação fechada em {periodLabel}</p>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <p className="text-center text-gray-400 py-12">Erro ao carregar relatório</p>
      )}
    </div>
  )
}
