export type UserRole = 'admin' | 'seller'
export type ClientType = 'producer' | 'buyer'
export type ClientStatus = 'active' | 'inactive'
export type LeadSource = 'indication' | 'instagram' | 'call' | 'other'
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'unqualified'
export type DealProduct = string
export type DealSide = 'buy' | 'sell'
export type DealUnit = 'sc' | 'kg' | 't'
export type DealStatus = 'new' | 'proposal' | 'negotiating' | 'closed' | 'lost'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  type: ClientType
  name: string
  farmOrCompany: string | null
  city: string
  state: string
  phone: string
  email: string | null
  mainProducts: string[] // parsed from JSON
  estimatedVolume: number | null
  notes: string | null
  status: ClientStatus
  createdAt: string
  updatedAt: string
  _count?: { deals: number }
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  city: string
  state: string
  source: LeadSource
  stage: LeadStage
  interestProducts: string
  notes: string | null
  convertedClientId: string | null
  createdAt: string
  updatedAt: string
}

export interface Deal {
  id: string
  clientId: string
  client?: Pick<Client, 'id' | 'name' | 'type'>
  product: DealProduct
  side: DealSide
  volume: number
  unit: DealUnit
  unitPrice: number
  totalValue: number
  commissionPct: number
  commissionValue: number
  status: DealStatus
  expectedCloseDate: string | null
  closedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PriceHistory {
  id: string
  product: string
  regionLabel: string
  date: string
  price: number
  unit: DealUnit
  createdAt: string
}

export interface DashboardData {
  period: { month: number; year: number }
  kpis: {
    totalValue: number
    commissionValue: number
    dealsClosedCount: number
    newLeadsCount: number
    leadConversionRate: number
    volumeByUnit: Record<string, number>
  }
  pipeline: Record<DealStatus, number>
  topClients: Array<{ clientId: string; name: string; totalValue: number; dealsCount: number }>
  recentDeals: Deal[]
  dailyRevenue: Array<{ date: string; totalValue: number; count: number }>
  dealsByStatus: Array<{ status: string; count: number }>
}

export interface MonthlyReport {
  period: { month: number; year: number; label: string }
  summary: {
    totalValue: number
    commissionValue: number
    dealsCount: number
    volumeByUnit: Record<string, number>
  }
  deals: Deal[]
  topClients: Array<{ clientId: string; name: string; totalValue: number; commissionValue: number; dealsCount: number }>
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface Produto {
  id: string
  name: string
  unit: string
  active: boolean
  createdAt: string
  updatedAt: string
}
