import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const clients = await prisma.client.findMany({
    where: { status: 'active' },
    select: { city: true, state: true },
    distinct: ['city', 'state'],
    orderBy: [{ city: 'asc' }],
  })

  const regions = Array.from(new Set(clients.map(c => `${c.city} - ${c.state}`))).sort()
  return NextResponse.json({ regions })
}
