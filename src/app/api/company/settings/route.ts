import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_FIELDS = [
  'companyName', 'tradeName', 'cnpjCpf', 'stateRegistration', 'phone', 'email',
  'street', 'number', 'district', 'city', 'state', 'zipCode', 'country',
  'logoUrl', 'logoThumbnailUrl', 'logoHeaderUrl', 'logoFaviconUrl',
  'shortName', 'region',
] as const

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const settings = await prisma.companySettings.findUnique({
    where: { userId: user.sub },
  })

  return NextResponse.json({ data: settings })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()

    // Build update/create objects from allowed fields only
    const updateData: Record<string, string | null> = {}
    const createData: Record<string, string | null> = { userId: user.sub }

    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] || null
        createData[field] = body[field] || null
      }
    }

    const settings = await prisma.companySettings.upsert({
      where: { userId: user.sub },
      update: updateData,
      create: createData as any,
    })

    return NextResponse.json({ data: settings })
  } catch (err) {
    console.error('[COMPANY SETTINGS PATCH]', err)
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
