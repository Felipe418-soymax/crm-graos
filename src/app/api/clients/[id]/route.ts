import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const updateSchema = z.object({
  type: z.enum(['producer', 'buyer']).optional(),
  name: z.string().min(2).optional(),
  farmOrCompany: z.string().optional().nullable(),
  city: z.string().min(2).optional(),
  state: z.string().length(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  mainProducts: z.array(z.string()).optional(),
  estimatedVolume: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const client = await prisma.client.findUnique({
    where: { id: params.id, userId: authUser.sub },
    include: {
      deals: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: { select: { deals: true } },
    },
  })

  if (!client) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

  return NextResponse.json({
    data: {
      ...client,
      mainProducts: JSON.parse(client.mainProducts || '[]'),
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.mainProducts) {
      updateData.mainProducts = JSON.stringify(data.mainProducts)
    }
    if (data.email === '') updateData.email = null

    const client = await prisma.client.update({
      where: { id: params.id, userId: authUser.sub },
      data: updateData,
    })

    await prisma.activityLog.create({
      data: {
        entityType: 'client',
        entityId: client.id,
        action: 'updated',
        userId: authUser.sub,
        details: JSON.stringify({ fields: Object.keys(data) }),
      },
    })

    return NextResponse.json({
      data: { ...client, mainProducts: JSON.parse(client.mainProducts || '[]') },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (authUser.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const dealsCount = await prisma.deal.count({ where: { clientId: params.id, userId: authUser.sub } })
  if (dealsCount > 0) {
    return NextResponse.json(
      { error: 'Não é possível excluir cliente com negociações' },
      { status: 400 }
    )
  }

  await prisma.client.delete({ where: { id: params.id, userId: authUser.sub } })
  return NextResponse.json({ message: 'Cliente excluído' })
}
