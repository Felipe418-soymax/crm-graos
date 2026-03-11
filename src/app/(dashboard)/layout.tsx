import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyJWT } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/ui/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = cookieStore.get('crm-token')?.value

  if (!token) redirect('/login')

  const payload = await verifyJWT(token)
  if (!payload) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { name: true, email: true, role: true },
  })

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
