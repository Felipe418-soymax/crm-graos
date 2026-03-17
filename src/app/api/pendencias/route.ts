import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientFilter = searchParams.get('client') || ''
  const productFilter = searchParams.get('product') || ''
  const sideFilter = searchParams.get('side') || ''
  const stateFilter = searchParams.get('state') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  // Fetch closed deals with their shipments
  const where: Record<string, unknown> = {
    status: 'closed',
  }

  if (authUser.role !== 'admin') {
    where.sellerId = authUser.sub
  }

  if (productFilter) where.product = productFilter
  if (sideFilter) where.side = sideFilter

  if (dateFrom || dateTo) {
    where.closedAt = {}
    if (dateFrom) (where.closedAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.closedAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59Z')
  }

  if (clientFilter || stateFilter) {
    where.client = {}
    if (clientFilter) (where.client as Record<string, unknown>).name = { contains: clientFilter, mode: 'insensitive' }
    if (stateFilter) (where.client as Record<string, unknown>).state = stateFilter
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, city: true, state: true } },
      seller: { select: { id: true, name: true } },
      shipments: {
        select: { id: true, bagsQuantity: true, cargoWeightKg: true },
      },
    },
    orderBy: { closedAt: 'desc' },
  })

  // Calculate pending balance per deal
  const pendingDeals = deals
    .map((deal) => {
      // Sum shipments based on deal unit
      let totalShipped = 0
      if (deal.unit === 'sc') {
        totalShipped = deal.shipments.reduce((sum, s) => sum + s.bagsQuantity, 0)
      } else if (deal.unit === 'kg') {
        totalShipped = deal.shipments.reduce((sum, s) => sum + s.cargoWeightKg, 0)
      } else if (deal.unit === 't') {
        totalShipped = deal.shipments.reduce((sum, s) => sum + s.cargoWeightKg / 1000, 0)
      } else {
        totalShipped = deal.shipments.reduce((sum, s) => sum + s.bagsQuantity, 0)
      }

      const pendingBalance = Math.max(0, deal.volume - totalShipped)

      return {
        id: deal.id,
        clientName: deal.client.name,
        clientCity: deal.client.city,
        clientState: deal.client.state,
        product: deal.product,
        side: deal.side,
        unit: deal.unit,
        volume: deal.volume,
        totalValue: deal.totalValue,
        closedAt: deal.closedAt?.toISOString() || deal.createdAt.toISOString(),
        sellerId: deal.sellerId,
        sellerName: deal.seller?.name || '',
        totalShipped: Math.round(totalShipped * 100) / 100,
        pendingBalance: Math.round(pendingBalance * 100) / 100,
        shipmentsCount: deal.shipments.length,
      }
    })
    .filter((d) => d.pendingBalance > 0) // Only show with pending balance

  return NextResponse.json({ data: pendingDeals })
}
