import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Apenas arquivos PDF são permitidos' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = randomBytes(8).toString('hex')
    const filename = `invoice-${timestamp}-${randomStr}.pdf`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoices')
    await mkdir(uploadDir, { recursive: true })

    // Save file
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return the public path
    const publicPath = `/uploads/invoices/${filename}`

    return NextResponse.json({ data: { path: publicPath } }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 })
  }
}
