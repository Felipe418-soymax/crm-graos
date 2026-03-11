import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const isAdmin = authUser.role === 'admin'
  const sellerFilter = !isAdmin ? { sellerId: authUser.sub } : {}

  const { searchParams } = new URL(request.url)
  const type       = searchParams.get('type') || ''
  const month      = parseInt(searchParams.get('month') || '0')
  const year       = parseInt(searchParams.get('year')  || '0')
  const startDate  = searchParams.get('startDate')
  const endDate    = searchParams.get('endDate')
  const region     = searchParams.get('region')

  let dateFrom: Date | undefined
  let dateTo:   Date | undefined
  if (startDate && endDate) {
    dateFrom = new Date(startDate + 'T00:00:00')
    dateTo   = new Date(endDate   + 'T23:59:59')
  } else if (month > 0 && year > 0) {
    dateFrom = new Date(year, month - 1, 1)
    dateTo   = new Date(year, month, 0, 23, 59, 59)
  } else if (year > 0) {
    dateFrom = new Date(year, 0, 1)
    dateTo   = new Date(year, 11, 31, 23, 59, 59)
  }

  let cityFilter:  string | undefined
  let stateFilter: string | undefined
  if (region) {
    const parts = region.split(' - ')
    cityFilter  = parts[0]?.trim()
    stateFilter = parts[1]?.trim()
  }

  try {
    if (type === 'leads') {
      const where: any = { ...sellerFilter }
      if (dateFrom && dateTo) where.createdAt = { gte: dateFrom, lte: dateTo }
      if (cityFilter)  where.city  = cityFilter
      if (stateFilter) where.state = stateFilter
      const leads = await prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } })
      return NextResponse.json({ data: leads })
    }

    const where: any = { status: 'closed', ...sellerFilter }
    if (dateFrom && dateTo) where.closedAt = { gte: dateFrom, lte: dateTo }
    if (cityFilter || stateFilter) {
      where.client = {}
      if (cityFilter)  where.client.city  = cityFilter
      if (stateFilter) where.client.state = stateFilter
    }
    const deals = await prisma.deal.findMany({
      where,
      include: { client: { select: { name: true, city: true, state: true } } },
      orderBy: { closedAt: 'desc' },
    })
    return NextResponse.json({ data: deals })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
