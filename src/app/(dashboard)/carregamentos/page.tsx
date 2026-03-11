'use client'
import { useEffect, useState } from 'react'
import { Truck, Search, ChevronRight, Package as PackageIcon } from 'lucide-react'
import { Deal } from '@/types'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface DealWithShipmentCount extends Deal {
  _count?: { shipments: number }
}

export default function CarregamentosPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<DealWithShipmentCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchClosedDeals() {
    setLoading(true)
    const params = new URLSearchParams({ status: 'closed' })
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/deals?${params}`)
      const data = await res.json()
      const closedDeals = data.data || []

      // Fetch all shipments once and count per deal
      const shipRes = await fetch('/api/shipments')
      const shipData = await shipRes.json()
      const allShipments = shipData.data || []

      const countByDeal: Record<string, number> = {}
      for (const s of allShipments) {
        countByDeal[s.dealId] = (countByDeal[s.dealId] || 0) + 1
      }

      const dealsWithCounts = closedDeals.map((deal: Deal) => ({
        ...deal,
        _count: { shipments: countByDeal[deal.id] || 0 },
      }))

      setDeals(dealsWithCounts)
    } catch {
      setDeals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClosedDeals()
  }, [search])

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carregamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            {deals.length} negócio(s) fechado(s) · Gerencie os carregamentos de caminhões
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Produto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Op.</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Volume</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Carregamentos</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fechado em</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50/50 transition cursor-pointer"
                    onClick={() => router.push(`/carregamentos/${deal.id}`)}
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-[140px] truncate">
                      {deal.client?.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{deal.product}</td>
                    <td className="px-4 py-3 text-gray-500">{deal.side === 'sell' ? 'Venda' : 'Compra'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatNumber(deal.volume)} {deal.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(deal.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        (deal._count?.shipments || 0) > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Truck size={12} />
                        {deal._count?.shipments || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(deal.closedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-gray-400 hover:text-green-600 transition p-1 rounded-lg hover:bg-green-50">
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deals.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <PackageIcon size={36} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum negócio fechado encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
