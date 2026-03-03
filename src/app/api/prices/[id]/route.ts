import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const updateSchema = z.object({
  product: z.string().optional(),
  regionLabel: z.string().optional(),
  date: z.string().optional(),
  price: z.number().positive().optional(),
  unit: z.enum(['sc', 'kg', 't']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const price = await prisma.priceHistory.update({
      where: { id: params.id },
      data: { ...data, date: data.date ? new Date(data.date) : undefined },
    })

    return NextResponse.json({ data: price })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar preço' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await prisma.priceHistory.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Registro excluído' })
}
