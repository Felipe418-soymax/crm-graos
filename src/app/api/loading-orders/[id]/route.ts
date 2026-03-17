import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { calculateBagsFromWeight } from '@/lib/utils'

const includeRelations = {
  deal: {
    select: {
      id: true, product: true, side: true, volume: true, unit: true,
      totalValue: true, status: true,
      client: { select: { id: true, name: true } },
    },
  },
  seller: { select: { id: true, name: true } },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const order = await prisma.loadingOrder.findUnique({
    where: { id: params.id },
    include: includeRelations,
  })

  if (!order) {
    return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
  }

  if (authUser.role !== 'admin' && order.sellerId !== authUser.sub) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  return NextResponse.json({ data: order })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const existing = await prisma.loadingOrder.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Ordem não encontrada' }, { status: 404 })
  }

  if (authUser.role !== 'admin' && existing.sellerId !== authUser.sub) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id: _id, orderNumber: _on, createdAt: _ca, ...updateData } = body

    // Set issuedAt when status changes to issued
    if (updateData.status === 'issued' && !existing.issuedAt) {
      updateData.issuedAt = new Date()
    }

    const order = await prisma.loadingOrder.update({
      where: { id: params.id },
      data: updateData,
      include: includeRelations,
    })

    // Log status changes
    if (updateData.status && updateData.status !== existing.status) {
      await prisma.activityLog.create({
        data: {
          entityType: 'loading_order',
          entityId: order.id,
          action: 'status_changed',
          details: JSON.stringify({
            orderNumber: order.orderNumber,
            from: existing.status,
            to: updateData.status,
          }),
          userId: authUser.sub,
        },
      })
    }

    // Auto-create a pending shipment when order is issued
    if (updateData.status === 'issued' && existing.status !== 'issued') {
      const weightKg = order.grossWeight || order.quantity || 0
      const bagsQuantity = weightKg > 0 ? calculateBagsFromWeight(weightKg) : 0

      const shipment = await prisma.shipment.create({
        data: {
          dealId: order.dealId,
          status: 'pending',
          truckPlate: order.truckPlate || 'A DEFINIR',
          cargoWeightKg: weightKg,
          bagsQuantity,
          loadedProduct: order.product || 'N/A',
          loadingDate: new Date(),
          cargoValue: 0,
          driverName: order.driverName || 'A definir',
          driverPhone: order.driverPhone || '',
          sellerId: authUser.sub,
        },
      })

      // Link shipment to the loading order
      await prisma.loadingOrder.update({
        where: { id: order.id },
        data: { shipmentId: shipment.id },
      })
    }

    return NextResponse.json({ data: order })
  } catch (error) {
    console.error('Error updating loading order:', error)
    return NextResponse.json({ error: 'Erro ao atualizar ordem' }, { status: 500 })
  }
}
