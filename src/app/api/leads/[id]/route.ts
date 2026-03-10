import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  city: z.string().min(2).optional(),
  state: z.string().length(2).optional(),
  source: z.enum(['indication', 'instagram', 'call', 'other']).optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'unqualified']).optional(),
  interestProducts: z.string().optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const lead = await prisma.lead.findUnique({ where: { id: params.id, userId: authUser.sub } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  return NextResponse.json({ data: lead })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)
    const prevLead = await prisma.lead.findUnique({ where: { id: params.id, userId: authUser.sub } })

    const lead = await prisma.lead.update({
      where: { id: params.id, userId: authUser.sub },
      data: { ...data, email: data.email === '' ? null : data.email },
    })

    if (data.stage && prevLead && prevLead.stage !== data.stage) {
      await prisma.activityLog.create({
        data: {
          entityType: 'lead',
          entityId: lead.id,
          action: 'status_changed',
          userId: authUser.sub,
          details: JSON.stringify({ from: prevLead.stage, to: data.stage }),
        },
      })
    }

    return NextResponse.json({ data: lead })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await prisma.lead.delete({ where: { id: params.id, userId: authUser.sub } })
  return NextResponse.json({ message: 'Lead excluído' })
}
