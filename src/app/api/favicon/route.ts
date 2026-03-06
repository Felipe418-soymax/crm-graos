import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.companySettings.findFirst({
      where: { logoUrl: { not: null } },
      select: { logoUrl: true },
      orderBy: { createdAt: 'asc' },
    })

    if (settings?.logoUrl) {
      // Redireciona para o URL da logo que já está funcionando (/api/uploads/...)
      const absoluteUrl = new URL(settings.logoUrl, req.nextUrl.origin)
      return NextResponse.redirect(absoluteUrl, {
        headers: { 'Cache-Control': 'no-store' },
      })
    }
  } catch (err) {
    console.error('[favicon] erro:', err)
  }

  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  })
}
