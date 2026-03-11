import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { calculateBagsFromWeight } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = params

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      deal: {
        include: {
          client: { select: { id: true, name: true, type: true } },
        },
      },
    },
  })

  if (!shipment) return NextResponse.json({ error: 'Carregamento não encontrado' }, { status: 404 })

  return NextResponse.json({ data: shipment })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = params

  try {
    const shipment = await prisma.shipment.findUnique({ where: { id } })
    if (!shipment) return NextResponse.json({ error: 'Carregamento não encontrado' }, { status: 404 })

    const body = await req.json()
    const {
      truckPlate,
      cargoWeightKg,
      loadedProduct,
      loadingDate,
      cargoValue,
      driverName,
      driverPhone,
      invoicePdfPath,
    } = body

    // Recalculate bags if weight changed
    const bagsQuantity = cargoWeightKg ? calculateBagsFromWeight(parseFloat(cargoWeightKg)) : undefined

    const updated = await prisma.shipment.update({
      where: { id },
      data: {
        ...(truckPlate !== undefined && { truckPlate }),
        ...(cargoWeightKg !== undefined && { cargoWeightKg: parseFloat(cargoWeightKg), bagsQuantity }),
        ...(loadedProduct !== undefined && { loadedProduct }),
        ...(loadingDate !== undefined && { loadingDate: new Date(loadingDate) }),
        ...(cargoValue !== undefined && { cargoValue: parseFloat(cargoValue) }),
        ...(driverName !== undefined && { driverName }),
        ...(driverPhone !== undefined && { driverPhone }),
        ...(invoicePdfPath !== undefined && { invoicePdfPath }),
      },
      include: {
        deal: {
          include: {
            client: { select: { id: true, name: true, type: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Error updating shipment:', error)
    return NextResponse.json({ error: 'Erro ao atualizar carregamento' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id } = params

  try {
    const shipment = await prisma.shipment.findUnique({ where: { id } })
    if (!shipment) return NextResponse.json({ error: 'Carregamento não encontrado' }, { status: 404 })

    await prisma.shipment.delete({ where: { id } })

    return NextResponse.json({ message: 'Carregamento removido com sucesso' })
  } catch (error) {
    console.error('Error deleting shipment:', error)
    return NextResponse.json({ error: 'Erro ao remover carregamento' }, { status: 500 })
  }
}
