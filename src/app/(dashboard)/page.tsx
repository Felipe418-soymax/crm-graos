'use client'
import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, Package, BarChart2, Users, Percent } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate, DEAL_STATUS_LABELS, UNIT_LABELS, getCurrentMonthYear } from '@/lib/utils'
import KpiCard from '@/components/dashboard/KpiCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import DealsByStatus from '@/components/dashboard/DealsByStatus'
import TopClients from '@/components/dashboard/TopClients'
import Card, { CardHeader } from '@/components/ui/Card'
import { DealStatusBadge } from '@/components/ui/Badge'
import { DashboardData } from '@/types'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function DashboardPage() {
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear()
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dashboard?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month, year])

  const years = [currentYear - 1, currentYear, currentYear + 1]

  const volumeText = data
    ? Object.entries(data.kpis.volumeByUnit)
        .map(([unit, vol]) => `${formatNumber(vol)} ${UNIT_LABELS[unit] || unit}`)
        .join(' | ') || '-'
    : '-'

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral das operações</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Dinheiro Movimentado"
              value={formatCurrency(data.kpis.totalValue)}
              subtitle={`${data.kpis.dealsClosedCount} operações fechadas`}
              icon={DollarSign}
              color="green"
            />
            <KpiCard
              title="Comissão do Mês"
              value={formatCurrency(data.kpis.commissionValue)}
              subtitle="Calculado sobre negócios fechados"
              icon={Percent}
              color="blue"
            />
            <KpiCard
              title="Volume Negociado"
              value={volumeText || '-'}
              subtitle="Total por unidade"
              icon={Package}
              color="yellow"
            />
            <KpiCard
              title="Ops. Fechadas"
              value={String(data.kpis.dealsClosedCount)}
              subtitle="Negociações encerradas no período"
              icon={BarChart2}
              color="purple"
            />
            <KpiCard
              title="Leads Novos"
              value={String(data.kpis.newLeadsCount)}
              subtitle="Cadastrados no período"
              icon={Users}
              color="orange"
            />
            <KpiCard
              title="Taxa de Conversão"
              value={`${data.kpis.leadConversionRate.toFixed(1)}%`}
              subtitle="Leads convertidos em clientes"
              icon={TrendingUp}
              color="green"
            />
          </div>

          {/* Charts row */}
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

          {/* Top clients + Recent deals */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader title="Top clientes" subtitle="Por valor no mês" />
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
    </div>
  )
}
