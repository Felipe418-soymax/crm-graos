import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''
  const dealId = searchParams.get('dealId') || ''

  const where: Record<string, unknown> = {
    status: { not: 'cancelled' },
  }

  // Role-based: sellers only see own orders
  if (authUser.role !== 'admin') {
    where.sellerId = authUser.sub
  }

  if (status) {
    where.status = status
  }

  if (dealId) {
    where.dealId = dealId
  }

  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: 'insensitive' } },
      { product: { contains: search, mode: 'insensitive' } },
      { truckPlate: { contains: search, mode: 'insensitive' } },
      { driverName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59Z')
  }

  const orders = await prisma.loadingOrder.findMany({
    where,
    include: {
      deal: { select: { id: true, product: true, side: true, volume: true, unit: true, totalValue: true, status: true, client: { select: { id: true, name: true } } } },
      seller: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: orders })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const { dealId, shipmentId, ...fields } = body

    if (!dealId) {
      return NextResponse.json({ error: 'dealId é obrigatório' }, { status: 400 })
    }

    // Verify deal exists
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { client: true },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })
    }

    // Build snapshot data - pre-fill from deal + client
    const snapshotData: Record<string, unknown> = {
      clientId: deal.clientId,
      clientName: deal.client.name,
      clientCity: deal.client.city,
      clientState: deal.client.state,
      clientPhone: deal.client.phone,
      clientEmail: deal.client.email,
      product: deal.product,
      quantity: deal.volume,
      unit: deal.unit,
    }

    // If shipmentId provided, enrich with shipment data
    if (shipmentId) {
      const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } })
      if (shipment) {
        snapshotData.shipmentId = shipmentId
        snapshotData.driverName = shipment.driverName
        snapshotData.driverPhone = shipment.driverPhone
        snapshotData.truckPlate = shipment.truckPlate
        snapshotData.grossWeight = shipment.cargoWeightKg
        snapshotData.quantity = shipment.bagsQuantity
        snapshotData.product = shipment.loadedProduct
      }
    }

    // Generate next orderNumber manually (SQLite compat)
    const lastOrder = await prisma.loadingOrder.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    })
    const nextOrderNumber = (lastOrder?.orderNumber ?? 0) + 1

    // Override with any manually provided fields (except sellerId)
    const { sellerId: _ignoreSellerId, ...safeFields } = fields as Record<string, unknown>
    const order = await prisma.loadingOrder.create({
      data: {
        dealId,
        orderNumber: nextOrderNumber,
        status: 'draft',
        ...snapshotData,
        ...safeFields,
        sellerId: authUser.sub,
      },
      include: {
        deal: { select: { id: true, product: true, side: true, volume: true, unit: true, totalValue: true, status: true, client: { select: { id: true, name: true } } } },
        seller: { select: { id: true, name: true } },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        entityType: 'loading_order',
        entityId: order.id,
        action: 'created',
        details: JSON.stringify({ orderNumber: order.orderNumber, dealId }),
        userId: authUser.sub,
      },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('Error creating loading order:', error)
    return NextResponse.json({ error: 'Erro ao criar ordem de carregamento' }, { status: 500 })
  }
}
