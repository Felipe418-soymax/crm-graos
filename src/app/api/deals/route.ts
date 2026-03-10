import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const dealSchema = z.object({
  clientId: z.string().min(1, 'Cliente obrigatório'),
  product: z.string().min(1, 'Produto obrigatório'),
  side: z.enum(['buy', 'sell']),
  volume: z.number().positive('Volume deve ser positivo'),
  unit: z.enum(['sc', 'kg', 't']),
  unitPrice: z.number().positive('Preço unitário deve ser positivo'),
  commissionPct: z.number().min(0).default(1),
  status: z.enum(['new', 'proposal', 'negotiating', 'closed', 'lost']).default('new'),
  expectedCloseDate: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

function calcDeal(volume: number, unitPrice: number, commissionPct: number) {
  const totalValue = parseFloat((volume * unitPrice).toFixed(2))
  const commissionValue = parseFloat((volume * commissionPct).toFixed(2))
  return { totalValue, commissionValue }
}

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') || ''
  const product = searchParams.get('product') || ''
  const status = searchParams.get('status') || ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search') || ''

  const deals = await prisma.deal.findMany({
    where: {
      userId: authUser.sub,
      AND: [
        clientId ? { clientId } : {},
        product ? { product } : {},
        status ? { status } : {},
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo) } } : {},
        search ? { client: { name: { contains: search } } } : {},
      ],
    },
    include: {
      client: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: deals })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = dealSchema.parse(body)

    const { totalValue, commissionValue } = calcDeal(
      data.volume, data.unitPrice, data.commissionPct
    )

    const deal = await prisma.deal.create({
      data: {
        ...data,
        totalValue,
        commissionValue,
        userId: authUser.sub,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        closedAt: data.status === 'closed' ? (data.closedAt ? new Date(data.closedAt) : new Date()) : null,
      },
      include: { client: { select: { id: true, name: true, type: true } } },
    })

    await prisma.activityLog.create({
      data: {
        entityType: 'deal',
        entityId: deal.id,
        action: 'created',
        userId: authUser.sub,
        details: JSON.stringify({ product: deal.product, status: deal.status, totalValue }),
      },
    })

    return NextResponse.json({ data: deal }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[DEALS POST]', err)
    return NextResponse.json({ error: 'Erro ao criar negociação' }, { status: 500 })
  }
}
