import { NextRequest, NextResponse } from 'next/server'
// Importa APENAS de jwt.ts (Edge-compatible). NÃO importe de auth.ts aqui.
import { verifyJWT } from '@/lib/jwt'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('crm-token')?.value

  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const user = await verifyJWT(token)

  if (!user) {
    const loginUrl = new URL('/login', req.url)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('crm-token')
    return response
  }

  // Attach user info to headers for API routes
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-user-id', user.sub)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-email', user.email)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
