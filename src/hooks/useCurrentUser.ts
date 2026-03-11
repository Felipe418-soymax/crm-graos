'use client'
import { useEffect, useState } from 'react'

interface CurrentUser {
  id: string
  name: string
  email: string
  role: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user || null))
      .catch(() => {})
  }, [])

  return { user, isAdmin: user?.role === 'admin' }
}
