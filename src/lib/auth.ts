/**
 * auth.ts — funções de autenticação Node.js (bcrypt + JWT).
 *
 * IMPORTANTE: Este arquivo importa bcryptjs (Node.js only).
 * NÃO o importe no Middleware (Edge Runtime).
 * O Middleware deve importar de @/lib/jwt diretamente.
 */
import bcrypt from 'bcryptjs'

// Re-exporta tudo do jwt.ts para uso conveniente em API Routes e Server Components
export {
  signJWT,
  verifyJWT,
  getAuthUser,
  COOKIE_NAME,
} from './jwt'
export type { JWTPayload } from './jwt'

// ── Funções Node.js-only (bcrypt) ─────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
