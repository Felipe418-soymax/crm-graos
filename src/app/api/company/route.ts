import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const companySchema = z.object({
  companyName: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  logoUrl: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
})

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const settings = await prisma.companySettings.findUnique({
    where: { userId: authUser.id },
  })

  return NextResponse.json({ data: settings })
}

export async function PATCH(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await req.json()
    const data = companySchema.parse(body)

    const settings = await prisma.companySettings.upsert({
      where: { userId: authUser.id },
      update: {
        companyName: data.companyName ?? null,
        region: data.region ?? null,
        logoUrl: data.logoUrl || null,
      },
      create: {
        userId: authUser.id,
        companyName: data.companyName ?? null,
        region: data.region ?? null,
        logoUrl: data.logoUrl || null,
      },
    })

    return NextResponse.json({ data: settings })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 })
  }
}
