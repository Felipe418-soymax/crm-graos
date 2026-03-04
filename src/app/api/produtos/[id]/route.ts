import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { name, unit } = body

  try {
    const produto = await prisma.produto.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(unit !== undefined ? { unit } : {}),
      },
    })
    return NextResponse.json({ data: produto })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Nome já existe' }, { status: 409 })
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  await prisma.produto.update({
    where: { id: params.id },
    data: { active: false },
  })
  return NextResponse.json({ message: 'Produto removido' })
}
