import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join, extname } from 'path'

const UPLOAD_DIR =
  process.env.NODE_ENV === 'production'
    ? '/var/lib/crm-graos/uploads'
    : join(process.cwd(), 'uploads')

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } },
) {
  const filename = params.filename

  // Segurança: previne path traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Inválido' }, { status: 400 })
  }

  try {
    const buffer = await readFile(join(UPLOAD_DIR, filename))
    const contentType = MIME[extname(filename).toLowerCase()] || 'application/octet-stream'
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
  }
}
