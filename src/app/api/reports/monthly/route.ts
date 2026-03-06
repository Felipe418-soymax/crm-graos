import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, startOfDay, endOfDay, format } from 'date-fns'
import { generateCSV } from '@/lib/utils'

function getPeriodRange(params: URLSearchParams): { periodStart: Date; periodEnd: Date; label: string } {
  const periodType = params.get('periodType') || 'monthly'
  const startDate = params.get('startDate')
  const endDate = params.get('endDate')
  const month = parseInt(params.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(params.get('year') || String(new Date().getFullYear()))

  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  if (periodType === 'custom' && startDate && endDate) {
    const s = new Date(startDate + 'T00:00:00')
    const e = new Date(endDate + 'T23:59:59')
    return { periodStart: s, periodEnd: e, label: `${format(s, 'dd/MM/yyyy')} – ${format(e, 'dd/MM/yyyy')}` }
  }

  if (periodType === 'daily') {
    const base = startDate ? new Date(startDate + 'T00:00:00') : new Date()
    return { periodStart: startOfDay(base), periodEnd: endOfDay(base), label: format(base, 'dd/MM/yyyy') }
  }

  if (periodType === 'weekly') {
    const base = startDate ? new Date(startDate + 'T00:00:00') : new Date()
    const s = startOfWeek(base, { weekStartsOn: 1 })
    const e = endOfWeek(base, { weekStartsOn: 1 })
    return { periodStart: s, periodEnd: e, label: `Semana de ${format(s, 'dd/MM')} a ${format(e, 'dd/MM/yyyy')}` }
  }

  if (periodType === 'yearly') {
    const s = startOfYear(new Date(year, 0, 1))
    const e = endOfYear(new Date(year, 0, 1))
    return { periodStart: s, periodEnd: e, label: `Ano ${year}` }
  }

  // default: monthly
  const s = startOfMonth(new Date(year, month - 1, 1))
  const e = endOfMonth(new Date(year, month - 1, 1))
  return { periodStart: s, periodEnd: e, label: `${MONTHS[month - 1]} ${year}` }
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const exportCsv = searchParams.get('export') === 'csv'
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))

  const { periodStart, periodEnd, label } = getPeriodRange(searchParams)

  const deals = await prisma.deal.findMany({
    where: {
      status: 'closed',
      closedAt: { gte: periodStart, lte: periodEnd },
    },
    include: { client: { select: { id: true, name: true, type: true } } },
    orderBy: { closedAt: 'asc' },
  })

  const totalValue = deals.reduce((s, d) => s + d.totalValue, 0)
  const commissionValue = deals.reduce((s, d) => s + d.commissionValue, 0)

  const volumeByUnit: Record<string, number> = {}
  for (const d of deals) {
    volumeByUnit[d.unit] = (volumeByUnit[d.unit] || 0) + d.volume
  }

  const clientMap: Record<string, { name: string; totalValue: number; commissionValue: number; dealsCount: number }> = {}
  for (const d of deals) {
    if (!clientMap[d.clientId]) {
      clientMap[d.clientId] = { name: d.client.name, totalValue: 0, commissionValue: 0, dealsCount: 0 }
    }
    clientMap[d.clientId].totalValue += d.totalValue
    clientMap[d.clientId].commissionValue += d.commissionValue
    clientMap[d.clientId].dealsCount += 1
  }
  const topClients = Object.entries(clientMap)
    .map(([clientId, v]) => ({ clientId, ...v }))
    .sort((a, b) => b.totalValue - a.totalValue)

  if (exportCsv) {
    const headers = ['Data', 'Cliente', 'Produto', 'Op.', 'Volume', 'Unidade', 'Preço Unit. (R$)', 'Total (R$)', 'Comissão %', 'Comissão (R$)']
    const rows = deals.map((d) => [
      d.closedAt ? format(new Date(d.closedAt), 'dd/MM/yyyy') : '-',
      d.client.name,
      d.product,
      d.side === 'buy' ? 'Compra' : 'Venda',
      String(d.volume),
      d.unit,
      d.unitPrice.toFixed(2).replace('.', ','),
      d.totalValue.toFixed(2).replace('.', ','),
      `${d.commissionPct}%`,
      d.commissionValue.toFixed(2).replace('.', ','),
    ])
    const csv = generateCSV(headers, rows)
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-${label.replace(/\s/g, '-')}.csv"`,
      },
    })
  }

  return NextResponse.json({
    data: {
      period: { month, year, label },
      summary: { totalValue, commissionValue, dealsCount: deals.length, volumeByUnit },
      deals,
      topClients,
    },
  })
}
