import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthUser, hashPassword } from '@/lib/auth'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'seller']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (authUser.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password)
      delete updateData.password
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
    })

    return NextResponse.json({ data: user })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = await getAuthUser()
  if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  if (authUser.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  if (authUser.sub === params.id) {
    return NextResponse.json({ error: 'Não é possível excluir seu próprio usuário' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Usuário excluído' })
}
