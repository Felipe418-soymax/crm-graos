export type UserRole = 'admin' | 'seller'
export type ClientType = 'producer' | 'buyer'
export type ClientStatus = 'active' | 'inactive'
export type LeadSource = 'indication' | 'instagram' | 'call' | 'other'
export type LeadStage = 'new' | 'contacted' | 'qualified' | 'unqualified'
export type DealProduct = string
export type DealSide = 'buy' | 'sell'
export type DealUnit = 'sc' | 'kg' | 't'
export type DealStatus = 'new' | 'proposal' | 'negotiating' | 'closed' | 'lost'
export type LoadingOrderStatus = 'draft' | 'issued' | 'loading' | 'completed' | 'cancelled'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  loadingOrderLayout: string | null
  createdAt: string
  updatedAt: string
}

export interface FieldConfig {
  key: string
  label: string
  type: string
}

export interface FieldSection {
  title: string
  fields: FieldConfig[]
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
  produtoId: string | null
  regionLabel: string
  date: string
  price: number
  unit: DealUnit
  createdAt: string
}

export interface Produto {
  id: string
  name: string
  unit: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CompanySettings {
  id: string
  // Dados da Empresa
  companyName: string | null
  tradeName: string | null
  cnpjCpf: string | null
  stateRegistration: string | null
  phone: string | null
  email: string | null
  // Endereço
  street: string | null
  number: string | null
  district: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  // Branding
  logoUrl: string | null
  logoThumbnailUrl: string | null
  logoHeaderUrl: string | null
  logoFaviconUrl: string | null
  shortName: string | null
  // Legacy
  region: string | null
  // Meta
  userId: string
  createdAt: string
  updatedAt: string
}

export type ShipmentStatus = 'pending' | 'confirmed'

export interface Shipment {
  id: string
  dealId: string
  deal?: Pick<Deal, 'id' | 'product' | 'status' | 'client'>
  status: ShipmentStatus
  truckPlate: string
  cargoWeightKg: number
  bagsQuantity: number
  loadedProduct: string
  loadingDate: string
  cargoValue: number
  driverName: string
  driverPhone: string
  invoicePdfPath: string | null
  sellerId: string
  seller?: Pick<User, 'id' | 'name'>
  createdAt: string
  updatedAt: string
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
    trucksLoaded: number
    totalWeightTransported: number
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

export interface LoadingOrder {
  id: string
  orderNumber: number
  status: LoadingOrderStatus
  dealId: string
  deal?: Pick<Deal, 'id' | 'product' | 'side' | 'volume' | 'unit' | 'totalValue' | 'status'> & { client?: Pick<Client, 'id' | 'name'> }
  shipmentId: string | null
  clientId: string | null
  client?: Pick<Client, 'id' | 'name'> | null
  sellerId: string
  seller?: Pick<User, 'id' | 'name'>
  // Snapshot: Cliente
  clientName: string | null
  clientAddress: string | null
  clientCnpjCpf: string | null
  clientCity: string | null
  clientState: string | null
  clientCep: string | null
  clientIe: string | null
  clientEmail: string | null
  clientPhone: string | null
  // Snapshot: Embarque/Destino
  loadingAddress: string | null
  deliveryLocation: string | null
  deliveryCityUf: string | null
  // Snapshot: Motorista
  driverName: string | null
  driverCpf: string | null
  driverPhone: string | null
  driverAddress: string | null
  driverCep: string | null
  driverEmail: string | null
  // Snapshot: Transportadora
  carrierName: string | null
  carrierCnpj: string | null
  carrierPhone: string | null
  truckPlate: string | null
  vehicle: string | null
  scaleWeight: number | null
  // Snapshot: Destinatário
  recipientName: string | null
  recipientCnpjCpf: string | null
  recipientPhone: string | null
  recipientAddress: string | null
  recipientCep: string | null
  recipientIe: string | null
  // Produto
  product: string | null
  quantity: number | null
  unit: string | null
  description: string | null
  tare: number | null
  grossWeight: number | null
  // Campos extras (perfis personalizados)
  origin: string | null
  warehouse: string | null
  authorizedCompany: string | null
  company: string | null
  ownerName: string | null
  vehicleCity: string | null
  vehicleState: string | null
  antt: string | null
  weightKg: number | null
  cargoType: string | null
  harvest: string | null
  commodity: string | null
  producerName: string | null
  responsibleName: string | null
  // Meta
  observations: string | null
  issuedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PendingDeal {
  id: string
  clientName: string
  clientCity: string
  clientState: string
  product: string
  side: DealSide
  unit: DealUnit
  volume: number
  totalValue: number
  closedAt: string
  sellerId: string
  sellerName: string
  totalShipped: number
  pendingBalance: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
