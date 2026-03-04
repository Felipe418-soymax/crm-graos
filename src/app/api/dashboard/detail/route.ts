import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'revenue'
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')
  const region = searchParams.get('region')

  let periodStart: Date
  let periodEnd: Date
  if (startDateParam && endDateParam) {
    periodStart = new Date(startDateParam + 'T00:00:00')
    periodEnd = new Date(endDateParam + 'T23:59:59')
  } else {
    periodStart = startOfMonth(new Date(year, month - 1, 1))
    periodEnd = endOfMonth(new Date(year, month - 1, 1))
  }

  let cityFilter: string | undefined
  let stateFilter: string | undefined
  if (region) {
    const parts = region.split(' - ')
    cityFilter = parts[0]?.trim()
    stateFilter = parts[1]?.trim()
  }

  if (type === 'leads') {
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        ...(cityFilter && stateFilter ? { city: cityFilter, state: stateFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: leads })
  }

  const deals = await prisma.deal.findMany({
    where: {
      status: 'closed',
      closedAt: { gte: periodStart, lte: periodEnd },
      ...(cityFilter && stateFilter ? { client: { city: cityFilter, state: stateFilter } } : {}),
    },
    include: { client: { select: { id: true, name: true, city: true, state: true } } },
    orderBy: { closedAt: 'desc' },
  })

  return NextResponse.json({ data: deals })
}
