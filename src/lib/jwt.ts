/**
 * jwt.ts — funções JWT usando apenas `jose` (compatível com Edge Runtime).
 * NÃO importe bcryptjs aqui: bcryptjs usa APIs Node.js e quebra o middleware.
 */
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[CRM Grãos] JWT_SECRET não definido ou muito curto. ' +
        'Defina uma chave segura com 32+ caracteres no arquivo .env de produção.'
      )
    }
    // Desenvolvimento: usa fallback (não seguro para produção)
    return new TextEncoder().encode('crm-graos-dev-secret-INSECURE-change-me')
  }

  return new TextEncoder().encode(secret)
}

export interface JWTPayload {
  sub: string    // user id
  email: string
  name: string
  role: string
  iat?: number
  exp?: number
}

export const COOKIE_NAME = 'crm-token'

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/** Obtém o usuário autenticado via cookie.
 *  - Sem argumento → usa cookies() do Next.js (Server Components / API Routes)
 *  - Com NextRequest  → usa req.cookies (Middleware)
 */
export async function getAuthUser(req?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined

  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value
  } else {
    const cookieStore = cookies()
    token = cookieStore.get(COOKIE_NAME)?.value
  }

  if (!token) return null
  return verifyJWT(token)
}
