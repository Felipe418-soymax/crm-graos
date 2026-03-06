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

  const [user, companySettings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.sub },
      select: { name: true, email: true, role: true },
    }),
    prisma.companySettings.findUnique({
      where: { userId: payload.sub },
      select: { logoUrl: true },
    }),
  ])

  return (
    <DashboardShell user={user} logoUrl={companySettings?.logoUrl}>
      {children}
    </DashboardShell>
  )
}
