import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const leadSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email().optional().nullable().or(z.literal('')),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().length(2, 'UF inválida'),
  source: z.enum(['indication', 'instagram', 'call', 'other']),
  stage: z.enum(['new', 'contacted', 'qualified', 'unqualified']).default('new'),
  interestProducts: z.string().min(1, 'Informe o produto de interesse'),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const stage = searchParams.get('stage') || ''
  const source = searchParams.get('source') || ''
  const converted = searchParams.get('converted')

  const leads = await prisma.lead.findMany({
    where: {
      userId: authUser.sub,
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { city: { contains: search } },
            { interestProducts: { contains: search } },
          ],
        } : {},
        stage ? { stage } : {},
        source ? { source } : {},
        converted === 'false' ? { convertedClientId: null } : {},
        converted === 'true' ? { NOT: { convertedClientId: null } } : {},
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: leads })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = leadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: { ...data, email: data.email || null, userId: authUser.sub },
    })

    await prisma.activityLog.create({
      data: {
        entityType: 'lead',
        entityId: lead.id,
        action: 'created',
        userId: authUser.sub,
        details: JSON.stringify({ name: lead.name }),
      },
    })

    return NextResponse.json({ data: lead }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[LEADS POST]', err)
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 })
  }
}
