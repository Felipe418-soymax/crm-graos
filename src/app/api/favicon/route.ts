import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join, extname } from 'path'

const UPLOAD_DIR =
  process.env.NODE_ENV === 'production'
    ? '/var/lib/crm-graos/uploads'
    : join(process.cwd(), 'uploads')

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst({
      where: { logoUrl: { not: null } },
      select: { logoUrl: true },
      orderBy: { createdAt: 'asc' },
    })

    if (settings?.logoUrl) {
      const filename = settings.logoUrl.split('/').pop()!
      const ext = extname(filename).toLowerCase()
      const contentType = CONTENT_TYPES[ext] ?? 'image/png'

      const file = await readFile(join(UPLOAD_DIR, filename))

      return new NextResponse(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  } catch {
    // Logo não encontrada — retorna 204 (sem conteúdo)
  }

  return new NextResponse(null, { status: 204 })
}
