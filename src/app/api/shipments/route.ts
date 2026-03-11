import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { calculateBagsFromWeight } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dealId = searchParams.get('dealId')

  const where = dealId ? { dealId } : {}

  const shipments = await prisma.shipment.findMany({
    where,
    include: {
      deal: {
        include: {
          client: { select: { id: true, name: true, type: true } },
        },
      },
    },
    orderBy: { loadingDate: 'desc' },
  })

  return NextResponse.json({ data: shipments })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      dealId,
      truckPlate,
      cargoWeightKg,
      loadedProduct,
      loadingDate,
      cargoValue,
      driverName,
      driverPhone,
      invoicePdfPath,
    } = body

    // Validations
    if (!dealId) return NextResponse.json({ error: 'Negócio é obrigatório' }, { status: 400 })
    if (!truckPlate) return NextResponse.json({ error: 'Placa do caminhão é obrigatória' }, { status: 400 })
    if (!cargoWeightKg || cargoWeightKg <= 0)
      return NextResponse.json({ error: 'Peso da carga deve ser maior que zero' }, { status: 400 })
    if (!loadedProduct) return NextResponse.json({ error: 'Produto é obrigatório' }, { status: 400 })
    if (!loadingDate) return NextResponse.json({ error: 'Data de carregamento é obrigatória' }, { status: 400 })
    if (cargoValue === undefined || cargoValue === null || cargoValue < 0)
      return NextResponse.json({ error: 'Valor da carga é obrigatório e não pode ser negativo' }, { status: 400 })
    if (!driverName) return NextResponse.json({ error: 'Nome do motorista é obrigatório' }, { status: 400 })
    if (!driverPhone) return NextResponse.json({ error: 'Telefone do motorista é obrigatório' }, { status: 400 })

    // Check if deal exists and is closed
    const deal = await prisma.deal.findUnique({ where: { id: dealId } })

    if (!deal) return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 })

    if (deal.status !== 'closed') {
      return NextResponse.json({ error: 'Apenas negócios fechados podem ter carregamentos' }, { status: 400 })
    }

    // Calculate bags using the centralized business rule
    const bagsQuantity = calculateBagsFromWeight(parseFloat(cargoWeightKg))

    const shipment = await prisma.shipment.create({
      data: {
        dealId,
        truckPlate,
        cargoWeightKg: parseFloat(cargoWeightKg),
        bagsQuantity,
        loadedProduct,
        loadingDate: new Date(loadingDate),
        cargoValue: parseFloat(cargoValue),
        driverName,
        driverPhone,
        invoicePdfPath: invoicePdfPath || null,
        sellerId: authUser.sub,
      },
      include: {
        deal: {
          include: {
            client: { select: { id: true, name: true, type: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: shipment }, { status: 201 })
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json({ error: 'Erro ao criar carregamento' }, { status: 500 })
  }
}
