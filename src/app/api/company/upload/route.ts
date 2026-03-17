import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { processLogo } from '@/lib/image-processing'

const ALLOWED_TYPES = ['image/png', 'image/svg+xml']

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

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

    // Upload all variants to Supabase Storage in parallel
    const uploads = await Promise.all([
      supabase.storage.from('logos').upload(`${prefix}-original.png`, variants.original, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000', // 1 year cache
      }),
      supabase.storage.from('logos').upload(`${prefix}-header.png`, variants.header, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000',
      }),
      supabase.storage.from('logos').upload(`${prefix}-thumb.png`, variants.thumbnail, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000',
      }),
      supabase.storage.from('logos').upload(`${prefix}-favicon.png`, variants.favicon, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '31536000',
      }),
    ])

    // Check for upload errors
    const failedUpload = uploads.find(u => u.error)
    if (failedUpload?.error) {
      console.error('Supabase upload error:', failedUpload.error)
      return NextResponse.json({ error: 'Erro ao fazer upload da logo' }, { status: 500 })
    }

    // Get public URLs
    const getUrl = (filename: string) =>
      supabase.storage.from('logos').getPublicUrl(filename).data.publicUrl

    const logoUrl = getUrl(`${prefix}-original.png`)
    const logoHeaderUrl = getUrl(`${prefix}-header.png`)
    const logoThumbnailUrl = getUrl(`${prefix}-thumb.png`)
    const logoFaviconUrl = getUrl(`${prefix}-favicon.png`)

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
