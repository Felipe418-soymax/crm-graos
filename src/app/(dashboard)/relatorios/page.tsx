'use client'
import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { MonthlyReport } from '@/types'
import { formatCurrency, formatNumber, formatDate, UNIT_LABELS, getCurrentMonthYear } from '@/lib/utils'
import { DealStatusBadge } from '@/components/ui/Badge'
import Card, { CardHeader } from '@/components/ui/Card'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function RelatoriosPage() {
  const { month: cm, year: cy } = getCurrentMonthYear()
  const [month, setMonth] = useState(cm)
  const [year, setYear] = useState(cy)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports/monthly?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => { setReport(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  async function handleExportCSV() {
    const res = await fetch(`/api/reports/monthly?month=${month}&year=${year}&export=csv`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${month}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const years = [cy - 2, cy - 1, cy, cy + 1]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Mensal</h1>
          <p className="text-gray-500 text-sm mt-1">Análise de desempenho por período</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={!report || report.deals.length === 0}
            className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : report ? (
        <>
          {/* Summary cards */}
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
                {Object.entries(report.summary.volumeByUnit).length === 0 ? (
                  <p className="text-lg font-bold text-gray-400">-</p>
                ) : (
                  Object.entries(report.summary.volumeByUnit).map(([unit, vol]) => (
                    <p key={unit} className="text-sm font-bold text-gray-900">
                      {formatNumber(vol)} <span className="text-gray-500 font-normal">{UNIT_LABELS[unit] || unit}</span>
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top clients */}
          {report.topClients.length > 0 && (
            <Card>
              <CardHeader title="Top Clientes do Mês" subtitle="Ordenado por volume financeiro" />
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
                    {report.topClients.map((c, i) => (
                      <tr key={c.clientId} className="hover:bg-gray-50/50">
                        <td className="py-3">
                          <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-yellow-100 text-yellow-700' :
                            i === 1 ? 'bg-gray-100 text-gray-600' :
                            i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'
                          }`}>
                            {i + 1}
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

          {/* Deals table */}
          <Card padding={false}>
            <div className="p-6 pb-3">
              <CardHeader title="Operações fechadas" subtitle={report.period.label} />
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
                  {report.deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.closedAt)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{deal.client?.name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                      <td className="px-4 py-3 text-gray-500">{deal.side === 'sell' ? 'Venda' : 'Compra'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatNumber(deal.volume)} {deal.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {deal.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(deal.totalValue)}</td>
                      <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatCurrency(deal.commissionValue)}</td>
                    </tr>
                  ))}
                </tbody>
                {report.deals.length > 0 && (
                  <tfoot>
                    <tr className="bg-green-50 border-t-2 border-green-200">
                      <td colSpan={6} className="px-6 py-3 font-semibold text-gray-700 text-sm">TOTAIS</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(report.summary.totalValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">
                        {formatCurrency(report.summary.commissionValue)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {report.deals.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma operação fechada em {report.period.label}</p>
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
