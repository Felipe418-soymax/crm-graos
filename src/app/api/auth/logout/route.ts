import { NextResponse } from 'next/server'
import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ message: 'Logout realizado' })
  response.cookies.delete(COOKIE_NAME)
  return response
}
