'use client'
import { useEffect, useState, useCallback } from 'react'
import { DollarSign, TrendingUp, Package, BarChart2, Users, Percent, Filter, X } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, DEAL_STATUS_LABELS, UNIT_LABELS, getCurrentMonthYear } from '@/lib/utils'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import DealsByStatus from '@/components/dashboard/DealsByStatus'
import TopClients from '@/components/dashboard/TopClients'
import Card, { CardHeader } from '@/components/ui/Card'
import { DealStatusBadge } from '@/components/ui/Badge'
import DetailModal, { DetailType } from '@/components/dashboard/DetailModal'
import { DashboardData } from '@/types'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function DashboardPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [region, setRegion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [regions, setRegions] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeDetail, setActiveDetail] = useState<DetailType | null>(null)

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d.regions || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ month: String(month), year: String(year) })
    if (region) p.set('region', region)
    if (startDate) p.set('startDate', startDate)
    if (endDate) p.set('endDate', endDate)
    fetch('/api/dashboard?' + p)
      .then(r => r.json())
      .then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year, region, startDate, endDate])

  const years = [currentYear - 1, currentYear, currentYear + 1]

  const volumeText = data
    ? Object.entries(data.kpis.volumeByUnit)
        .map(([unit, vol]) => formatNumber(vol) + ' ' + (UNIT_LABELS[unit] || unit))
        .join(' | ') || '-'
    : '-'

  const hasActiveFilters = region || startDate || endDate
  const detailFilters = { month, year, startDate, endDate, region }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Visão geral das operações
            {region && <span className="ml-2 text-green-600 font-medium">· {region}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${showFilters || hasActiveFilters ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
          >
            <Filter size={15} />
            Filtros
            {hasActiveFilters && <span className="bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">ativo</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Filtros avançados</h3>
            {hasActiveFilters && (
              <button
                onClick={() => { setRegion(''); setStartDate(''); setEndDate('') }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Região</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas as regiões</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Data início</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Data fim</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Dinheiro Movimentado"
              value={formatCurrency(data.kpis.totalValue)}
              subtitle={`${data.kpis.dealsClosedCount} operações fechadas`}
              icon={DollarSign}
              color="green"
              onClick={() => setActiveDetail('revenue')}
            />
            <KpiCard
              title="Comissão do Mês"
              value={formatCurrency(data.kpis.commissionValue)}
              subtitle="Calculado sobre negócios fechados"
              icon={Percent}
              color="blue"
              onClick={() => setActiveDetail('commission')}
            />
            <KpiCard
              title="Volume Negociado"
              value={volumeText || '-'}
              subtitle="Total por unidade"
              icon={Package}
              color="yellow"
              onClick={() => setActiveDetail('volume')}
            />
            <KpiCard
              title="Ops. Fechadas"
              value={String(data.kpis.dealsClosedCount)}
              subtitle="Negociações encerradas no período"
              icon={BarChart2}
              color="purple"
              onClick={() => setActiveDetail('deals')}
            />
            <KpiCard
              title="Leads Novos"
              value={String(data.kpis.newLeadsCount)}
              subtitle="Cadastrados no período"
              icon={Users}
              color="orange"
              onClick={() => setActiveDetail('leads')}
            />
            <KpiCard
              title="Taxa de Conversão"
              value={`${data.kpis.leadConversionRate.toFixed(1)}%`}
              subtitle="Leads convertidos em clientes"
              icon={TrendingUp}
              color="green"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader title="Receita por dia" subtitle={`${MONTHS[month - 1]} ${year}`} />
              <RevenueChart data={data.dailyRevenue} />
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Funil de negociações" />
              <DealsByStatus data={data.dealsByStatus} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader title="Top clientes" subtitle="Por valor no período" />
              <TopClients data={data.topClients} />
            </Card>

            <Card padding={false} className="lg:col-span-3">
              <div className="p-6 pb-3">
                <CardHeader title="Últimas negociações" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 bg-gray-50">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Produto</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Total</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 bg-gray-50">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentDeals.map((deal) => (
                      <tr key={deal.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-3 font-medium text-gray-900 truncate max-w-[140px]">
                          {deal.client?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(deal.totalValue)}
                        </td>
                        <td className="px-4 py-3">
                          <DealStatusBadge status={deal.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDate(deal.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.recentDeals.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma negociação encontrada</p>
                )}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-400 py-12">Erro ao carregar dados</p>
      )}

      {activeDetail && (
        <DetailModal
          open={!!activeDetail}
          onClose={() => setActiveDetail(null)}
          type={activeDetail}
          filters={detailFilters}
        />
      )}
    </div>
  )
}
