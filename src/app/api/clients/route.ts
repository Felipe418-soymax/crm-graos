import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const clientSchema = z.object({
  type: z.enum(['producer', 'buyer']),
  name: z.string().min(2, 'Nome muito curto'),
  farmOrCompany: z.string().optional().nullable(),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF inválida'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  mainProducts: z.array(z.string()).min(1, 'Informe ao menos um produto'),
  estimatedVolume: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const state = searchParams.get('state') || ''

  const clients = await prisma.client.findMany({
    where: {
      userId: authUser.sub,
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { city: { contains: search } },
            { farmOrCompany: { contains: search } },
          ],
        } : {},
        type ? { type } : {},
        status ? { status } : {},
        state ? { state } : {},
      ],
    },
    include: {
      _count: { select: { deals: true } },
    },
    orderBy: { name: 'asc' },
  })

  const parsed = clients.map((c) => ({
    ...c,
    mainProducts: JSON.parse(c.mainProducts || '[]'),
  }))

  return NextResponse.json({ data: parsed })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = clientSchema.parse(body)

    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null,
        mainProducts: JSON.stringify(data.mainProducts),
        userId: authUser.sub,
      },
    })

    await prisma.activityLog.create({
      data: {
        entityType: 'client',
        entityId: client.id,
        action: 'created',
        userId: authUser.sub,
        details: JSON.stringify({ name: client.name }),
      },
    })

    return NextResponse.json({
      data: { ...client, mainProducts: data.mainProducts },
    }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[CLIENTS POST]', err)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
