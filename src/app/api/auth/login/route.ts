import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword, signJWT, COOKIE_NAME, JWTPayload } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

const normalizeRole = (role: unknown): JWTPayload['role'] => {
  return role === 'admin' || role === 'seller' ? role : 'seller'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const role = normalizeRole(user.role)

    const token = await signJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role,
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[AUTH LOGIN]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
1000