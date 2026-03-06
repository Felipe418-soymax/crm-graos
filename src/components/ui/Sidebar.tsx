'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserPlus, TrendingUp, BarChart3,
  FileText, Settings, LogOut, Wheat, ChevronRight, Package, X
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/negociacoes', label: 'Negociações', icon: TrendingUp },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/precos', label: 'Preços', icon: BarChart3 },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  user?: { name: string; email: string; role: string } | null
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ user, isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 flex flex-col transition-transform duration-300',
        'md:static md:w-64 md:translate-x-0 md:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wheat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">AgriValor CRM</p>
            <p className="text-gray-400 text-xs mt-0.5">Comércio de Grãos</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon
                className={cn('flex-shrink-0', isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300')}
                size={18}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-green-300" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
            <p className="text-gray-500 text-xs truncate">{user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 text-sm transition-all"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
