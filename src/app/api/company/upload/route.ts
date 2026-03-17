import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { processLogo } from '@/lib/image-processing'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/png', 'image/svg+xml']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

const hasSupabase = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY))

/** Save file locally to public/uploads/ and return its public URL */
async function saveLocal(filename: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return `/uploads/${filename}`
}

/** Upload to Supabase Storage and return public URL */
async function saveSupabase(filename: string, buffer: Buffer): Promise<string> {
  const { supabase } = await import('@/lib/supabase')
  const { error } = await supabase.storage.from('logos').upload(filename, buffer, {
    contentType: 'image/png',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
  return supabase.storage.from('logos').getPublicUrl(filename).data.publicUrl
}

const save = hasSupabase ? saveSupabase : saveLocal

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use PNG ou SVG.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 50MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process: compress + generate variants
    const variants = await processLogo(buffer, file.type)

    const timestamp = Date.now()
    const randomStr = randomBytes(8).toString('hex')
    const prefix = `logo-${timestamp}-${randomStr}`

    // Upload all variants in parallel
    const [logoUrl, logoHeaderUrl, logoThumbnailUrl, logoFaviconUrl] = await Promise.all([
      save(`${prefix}-original.png`, variants.original),
      save(`${prefix}-header.png`, variants.header),
      save(`${prefix}-thumb.png`, variants.thumbnail),
      save(`${prefix}-favicon.png`, variants.favicon),
    ])

    // Auto-save all variant URLs to company settings
    await prisma.companySettings.upsert({
      where: { userId: authUser.sub },
      update: { logoUrl, logoHeaderUrl, logoThumbnailUrl, logoFaviconUrl },
      create: { userId: authUser.sub, logoUrl, logoHeaderUrl, logoThumbnailUrl, logoFaviconUrl },
    })

    return NextResponse.json({
      url: logoUrl,
      variants: { logoUrl, logoHeaderUrl, logoThumbnailUrl, logoFaviconUrl },
    }, { status: 200 })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload da logo' }, { status: 500 })
  }
}
