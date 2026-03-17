'use client'
import { useState, useEffect } from 'react'
import { Menu, Wheat } from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'

interface DashboardShellProps {
  user: { name: string; email: string; role: string } | null
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [brandName, setBrandName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/company/settings')
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setLogoUrl(d.data.logoUrl || null)
          setBrandName(d.data.tradeName || d.data.companyName || null)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 max-w-[100px] object-contain" />
            ) : (
              <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                <Wheat className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="font-bold text-gray-900 text-base truncate">
              {brandName || 'Grãos CRM'}
            </span>
          </div>
          {/* Grãos CRM branding - subtle */}
          <img src="/graos-crm-logo-light.svg" alt="Grãos CRM" className="h-4 opacity-40 flex-shrink-0" />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
