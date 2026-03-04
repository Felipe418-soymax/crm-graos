import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const produtos = await prisma.produto.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: produtos })
}

export async function POST(req: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { name, unit } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  try {
    const produto = await prisma.produto.create({
      data: { name: name.trim(), unit: unit || 'sc' },
    })
    return NextResponse.json({ data: produto }, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Produto já existe' }, { status: 409 })
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}
