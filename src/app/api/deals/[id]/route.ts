import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const updateSchema = z.object({
  clientId: z.string().optional(),
  product: z.string().min(1).optional(),
  side: z.enum(['buy', 'sell']).optional(),
  volume: z.number().positive().optional(),
  unit: z.enum(['sc', 'kg', 't']).optional(),
  unitPrice: z.number().positive().optional(),
  commissionPct: z.number().min(0).optional(),
  status: z.enum(['new', 'proposal', 'negotiating', 'closed', 'lost']).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  closedAt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const deal = await prisma.deal.findUnique({
    where: { id: params.id, userId: authUser.sub },
    include: { client: { select: { id: true, name: true, type: true } } },
  })
  if (!deal) return NextResponse.json({ error: 'Negociação não encontrada' }, { status: 404 })
  return NextResponse.json({ data: deal })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const prevDeal = await prisma.deal.findUnique({ where: { id: params.id, userId: authUser.sub } })
    if (!prevDeal) return NextResponse.json({ error: 'Negociação não encontrada' }, { status: 404 })

    // Recalculate totals if financial fields changed
    const volume = data.volume ?? prevDeal.volume
    const unitPrice = data.unitPrice ?? prevDeal.unitPrice
    const commissionPct = data.commissionPct ?? prevDeal.commissionPct
    const totalValue = parseFloat((volume * unitPrice).toFixed(2))
    const commissionValue = parseFloat((volume * commissionPct).toFixed(2))

    // Auto-set closedAt when status changes to closed
    let closedAt = prevDeal.closedAt
    if (data.status === 'closed' && prevDeal.status !== 'closed') {
      closedAt = data.closedAt ? new Date(data.closedAt) : new Date()
    } else if (data.status && data.status !== 'closed') {
      closedAt = null
    } else if (data.closedAt) {
      closedAt = new Date(data.closedAt)
    }

    const deal = await prisma.deal.update({
      where: { id: params.id, userId: authUser.sub },
      data: {
        ...data,
        totalValue,
        commissionValue,
        closedAt,
        expectedCloseDate: data.expectedCloseDate !== undefined
          ? (data.expectedCloseDate ? new Date(data.expectedCloseDate) : null)
          : prevDeal.expectedCloseDate,
      },
      include: { client: { select: { id: true, name: true, type: true } } },
    })

    if (data.status && prevDeal.status !== data.status) {
      await prisma.activityLog.create({
        data: {
          entityType: 'deal',
          entityId: deal.id,
          action: 'status_changed',
          userId: authUser.sub,
          details: JSON.stringify({ from: prevDeal.status, to: data.status }),
        },
      })
    }

    return NextResponse.json({ data: deal })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[DEALS PATCH]', err)
    return NextResponse.json({ error: 'Erro ao atualizar negociação' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (authUser.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  await prisma.deal.delete({ where: { id: params.id, userId: authUser.sub } })
  return NextResponse.json({ message: 'Negociação excluída' })
}
