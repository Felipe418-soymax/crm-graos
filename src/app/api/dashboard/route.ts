import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const periodStart = startOfMonth(new Date(year, month - 1, 1))
  const periodEnd = endOfMonth(new Date(year, month - 1, 1))

  // Closed deals in period
  const closedDeals = await prisma.deal.findMany({
    where: {
      status: 'closed',
      closedAt: { gte: periodStart, lte: periodEnd },
    },
    include: { client: { select: { id: true, name: true } } },
    orderBy: { closedAt: 'asc' },
  })

  // KPIs
  const totalValue = closedDeals.reduce((s, d) => s + d.totalValue, 0)
  const commissionValue = closedDeals.reduce((s, d) => s + d.commissionValue, 0)

  const volumeByUnit: Record<string, number> = {}
  for (const d of closedDeals) {
    volumeByUnit[d.unit] = (volumeByUnit[d.unit] || 0) + d.volume
  }

  // New leads in period
  const newLeadsCount = await prisma.lead.count({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  })

  // Lead conversion rate
  const qualifiedLeads = await prisma.lead.count({ where: { stage: 'qualified' } })
  const convertedLeads = await prisma.lead.count({ where: { NOT: { convertedClientId: null } } })
  const totalLeads = await prisma.lead.count()
  const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

  // Pipeline counts
  const pipelineGroups = await prisma.deal.groupBy({
    by: ['status'],
    _count: { status: true },
  })
  const pipeline: Record<string, number> = {
    new: 0, proposal: 0, negotiating: 0, closed: 0, lost: 0,
  }
  for (const g of pipelineGroups) {
    pipeline[g.status] = g._count.status
  }

  // Top clients by totalValue this month
  const clientTotals: Record<string, { name: string; totalValue: number; dealsCount: number }> = {}
  for (const d of closedDeals) {
    if (!clientTotals[d.clientId]) {
      clientTotals[d.clientId] = { name: d.client.name, totalValue: 0, dealsCount: 0 }
    }
    clientTotals[d.clientId].totalValue += d.totalValue
    clientTotals[d.clientId].dealsCount += 1
  }
  const topClients = Object.entries(clientTotals)
    .map(([clientId, v]) => ({ clientId, ...v }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)

  // Daily revenue
  const dailyMap: Record<string, { totalValue: number; count: number }> = {}
  for (const d of closedDeals) {
    if (!d.closedAt) continue
    const key = format(new Date(d.closedAt), 'yyyy-MM-dd')
    if (!dailyMap[key]) dailyMap[key] = { totalValue: 0, count: 0 }
    dailyMap[key].totalValue += d.totalValue
    dailyMap[key].count += 1
  }
  const dailyRevenue = Object.entries(dailyMap)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Deals by status (for chart)
  const dealsByStatus = Object.entries(pipeline).map(([status, count]) => ({ status, count }))

  // Recent deals (last 10 across all statuses)
  const recentDeals = await prisma.deal.findMany({
    include: { client: { select: { id: true, name: true, type: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    data: {
      period: { month, year },
      kpis: {
        totalValue,
        commissionValue,
        dealsClosedCount: closedDeals.length,
        newLeadsCount,
        leadConversionRate,
        volumeByUnit,
      },
      pipeline,
      topClients,
      recentDeals,
      dailyRevenue,
      dealsByStatus,
    },
  })
}
