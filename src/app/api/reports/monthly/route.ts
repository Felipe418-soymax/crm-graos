import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { generateCSV } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const exportCsv = searchParams.get('export') === 'csv'

  const periodStart = startOfMonth(new Date(year, month - 1, 1))
  const periodEnd = endOfMonth(new Date(year, month - 1, 1))

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

  // Top clients
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

  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const label = `${MONTHS[month - 1]} ${year}`

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
        'Content-Disposition': `attachment; filename="relatorio-${month}-${year}.csv"`,
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
