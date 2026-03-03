import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const priceSchema = z.object({
  product: z.string().min(1, 'Produto obrigatório'),
  regionLabel: z.string().min(1, 'Região obrigatória'),
  date: z.string().min(1, 'Data obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  unit: z.enum(['sc', 'kg', 't']).default('sc'),
})

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const product = searchParams.get('product') || ''
  const region = searchParams.get('region') || ''
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const prices = await prisma.priceHistory.findMany({
    where: {
      AND: [
        product ? { product } : {},
        region ? { regionLabel: { contains: region } } : {},
        dateFrom ? { date: { gte: new Date(dateFrom) } } : {},
        dateTo ? { date: { lte: new Date(dateTo) } } : {},
      ],
    },
    orderBy: { date: 'desc' },
    take: 500,
  })

  return NextResponse.json({ data: prices })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = priceSchema.parse(body)

    const price = await prisma.priceHistory.create({
      data: { ...data, date: new Date(data.date) },
    })

    return NextResponse.json({ data: price }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao criar registro de preço' }, { status: 500 })
  }
}
