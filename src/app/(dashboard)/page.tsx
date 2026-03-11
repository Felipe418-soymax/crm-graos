'use client'
import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Package, BarChart2, Users, Percent, SlidersHorizontal, MapPin, Calendar, X, Truck, Weight } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, UNIT_LABELS, getCurrentMonthYear } from '@/lib/utils'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import DealsByStatus from '@/components/dashboard/DealsByStatus'
import TopClients from '@/components/dashboard/TopClients'
import Card, { CardHeader } from '@/components/ui/Card'
import { DealStatusBadge } from '@/components/ui/Badge'
import DetailModal, { DetailType } from '@/components/dashboard/DetailModal'
import { DashboardData } from '@/types'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function DashboardPage() {
  const { isAdmin } = useCurrentUser()
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  const [month,   setMonth]   = useState(currentMonth)
  const [year,    setYear]    = useState(currentYear)
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const [region,    setRegion]    = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [regions,   setRegions]   = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeDetail, setActiveDetail] = useState<DetailType | null>(null)

  const years = [currentYear - 1, currentYear, currentYear + 1]

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d.regions || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const p = new URLSearchParams({ month: String(month), year: String(year) })
    if (region)    p.set('region',    region)
    if (startDate) p.set('startDate', startDate)
    if (endDate)   p.set('endDate',   endDate)
    fetch('/api/dashboard?' + p)
      .then(r => r.json()).then(d => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year, region, startDate, endDate])

  const hasFilters = !!(region || startDate || endDate)
  function clearFilters() { setRegion(''); setStartDate(''); setEndDate('') }

  const volumeText = data
    ? Object.entries(data.kpis.volumeByUnit)
        .map(([unit, vol]) => formatNumber(vol) + ' ' + (UNIT_LABELS[unit as keyof typeof UNIT_LABELS] || unit))
        .join(' | ') || '-'
    : '-'

  const detailFilters = { month, year, startDate, endDate, region }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das operações</p>
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
        </div>
      </div>

      {/* Advanced filters panel */}
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
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600" />
          <p className="text-sm text-gray-400">Carregando dados...</p>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard title="Dinheiro Movimentado" value={formatCurrency(data.kpis.totalValue)}
              subtitle={data.kpis.dealsClosedCount + ' operações fechadas'}
              icon={DollarSign} color="green" onClick={() => setActiveDetail('revenue')} />
            <KpiCard title="Comissão do Mês" value={formatCurrency(data.kpis.commissionValue)}
              subtitle="Calculado sobre negócios fechados"
              icon={Percent} color="blue" onClick={() => setActiveDetail('commission')} />
            <KpiCard title="Volume Negociado" value={volumeText || '-'}
              subtitle="Total por unidade"
              icon={Package} color="yellow" onClick={() => setActiveDetail('volume')} />
            <KpiCard title="Ops. Fechadas" value={String(data.kpis.dealsClosedCount)}
              subtitle="Negociações encerradas no período"
              icon={BarChart2} color="purple" onClick={() => setActiveDetail('deals')} />
            <KpiCard title="Caminhões Carregados" value={String(data.kpis.trucksLoaded)}
              subtitle="Total de carregamentos realizados"
              icon={Truck} color="indigo" />
            <KpiCard title="Peso Transportado" value={formatNumber(data.kpis.totalWeightTransported, 0) + ' kg'}
              subtitle="Total em quilogramas"
              icon={Weight} color="teal" />
            <KpiCard title="Leads Novos" value={String(data.kpis.newLeadsCount)}
              subtitle="Cadastrados no período"
              icon={Users} color="orange" onClick={() => setActiveDetail('leads')} />
            <KpiCard title="Taxa de Conversão" value={data.kpis.leadConversionRate.toFixed(1) + '%'}
              subtitle="Leads convertidos em clientes"
              icon={TrendingUp} color="green" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader title="Receita por dia" subtitle={MONTHS[month - 1] + ' ' + year} />
                <RevenueChart data={data.dailyRevenue} />
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader title="Funil de negociações" />
                <DealsByStatus data={data.dealsByStatus} />
              </Card>
            </div>
          </div>

          {/* Top clients + Recent deals */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader title="Top clientes" subtitle="Por valor no mês" />
                <TopClients data={data.topClients} />
              </Card>
            </div>
            <Card padding={false} className="lg:col-span-3">
              <div className="p-6 pb-3"><CardHeader title="Últimas negociações" /></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Cliente</th>
                      <th className="text-left px-4 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Produto</th>
                      <th className="text-right px-4 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Total</th>
                      <th className="text-left px-4 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Status</th>
                      <th className="text-left px-4 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Data</th>
                      {isAdmin && <th className="text-left px-4 py-3.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">Responsável</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentDeals.map(deal => (
                      <tr key={deal.id} className="hover:bg-green-50/30 transition-colors duration-150">
                        <td className="px-6 py-3.5 font-medium text-gray-900 truncate max-w-[140px]">{deal.client?.name || '\u2014'}</td>
                        <td className="px-4 py-3.5 text-gray-600 capitalize">{deal.product}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900 tabular-nums">{formatCurrency(deal.totalValue)}</td>
                        <td className="px-4 py-3.5"><DealStatusBadge status={deal.status} /></td>
                        <td className="px-4 py-3.5 text-gray-400 whitespace-nowrap text-xs">{formatDate(deal.updatedAt)}</td>
                        {isAdmin && <td className="px-4 py-3.5 text-gray-500 text-xs">{(deal as any).seller?.name || '—'}</td>}
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

      <DetailModal open={activeDetail !== null} onClose={() => setActiveDetail(null)} type={activeDetail} filters={detailFilters} />
    </div>
  )
}
