import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const isAdmin = authUser.role === 'admin'
    const sellerFilter = !isAdmin ? { sellerId: authUser.sub } : {}

    const clients = await prisma.client.findMany({
      select: { city: true, state: true },
      where:  { status: 'active', ...sellerFilter },
    })
    const seen = new Set<string>()
    const regions: string[] = []
    for (const c of clients) {
      if (c.city && c.state) {
        const key = c.city + ' - ' + c.state
        if (!seen.has(key)) { seen.add(key); regions.push(key) }
      }
    }
    regions.sort()
    return NextResponse.json({ regions })
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
