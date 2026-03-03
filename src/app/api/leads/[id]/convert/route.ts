import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const lead = await prisma.lead.findUnique({ where: { id: params.id } })
  if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })

  if (lead.convertedClientId) {
    return NextResponse.json({ error: 'Lead já foi convertido em cliente' }, { status: 400 })
  }

  // Create client from lead data
  const client = await prisma.client.create({
    data: {
      type: 'producer', // default; user can edit after
      name: lead.name,
      city: lead.city,
      state: lead.state,
      phone: lead.phone,
      email: lead.email,
      mainProducts: JSON.stringify(
        lead.interestProducts.split(',').map((p) => p.trim().toLowerCase())
      ),
      notes: lead.notes,
      status: 'active',
    },
  })

  // Mark lead as converted
  await prisma.lead.update({
    where: { id: params.id },
    data: {
      convertedClientId: client.id,
      stage: 'qualified',
    },
  })

  await prisma.activityLog.create({
    data: {
      entityType: 'lead',
      entityId: lead.id,
      action: 'status_changed',
      userId: authUser.sub,
      details: JSON.stringify({ action: 'converted_to_client', clientId: client.id }),
    },
  })

  return NextResponse.json({
    data: { client, message: 'Lead convertido em cliente com sucesso' },
  }, { status: 201 })
}
