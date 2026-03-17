import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filename = params.path.join('/')

  // Sanitize: only allow alphanumeric, dash, dot, underscore
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

  try {
    const buffer = await readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    const contentType =
      ext === '.png' ? 'image/png' :
      ext === '.svg' ? 'image/svg+xml' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
