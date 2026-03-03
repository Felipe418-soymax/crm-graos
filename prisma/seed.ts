import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.activityLog.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  // ── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const sellerHash = await bcrypt.hash('seller123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Carlos Admin',
      email: 'admin@crmgraos.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  })

  const seller = await prisma.user.create({
    data: {
      name: 'Marcos Vendedor',
      email: 'vendedor@crmgraos.com',
      passwordHash: sellerHash,
      role: 'seller',
    },
  })

  console.log('✅ Users created')

  // ── Clients ───────────────────────────────────────────────────────────────
  const clientsData = [
    {
      type: 'producer',
      name: 'Fazenda São João',
      farmOrCompany: 'Fazenda São João LTDA',
      city: 'Sorriso',
      state: 'MT',
      phone: '(66) 99812-3456',
      email: 'contato@fazendas joao.com',
      mainProducts: JSON.stringify(['soja', 'milho']),
      estimatedVolume: 50000,
      notes: 'Grande produtor da região norte do MT. Vende soja em março/abril.',
      status: 'active',
    },
    {
      type: 'producer',
      name: 'Agropecuária Cerrado Verde',
      farmOrCompany: 'Cerrado Verde Agro S.A.',
      city: 'Lucas do Rio Verde',
      state: 'MT',
      phone: '(65) 99234-5678',
      email: 'financeiro@cerradoverde.com',
      mainProducts: JSON.stringify(['soja', 'algodão']),
      estimatedVolume: 80000,
      notes: 'Cliente preferencial. Fecha safra toda em setembro.',
      status: 'active',
    },
    {
      type: 'producer',
      name: 'Sítio Boa Esperança',
      farmOrCompany: null,
      city: 'Querência',
      state: 'MT',
      phone: '(66) 98765-4321',
      email: null,
      mainProducts: JSON.stringify(['milho', 'soja']),
      estimatedVolume: 15000,
      notes: 'Pequeno produtor, prefere negociar por telefone.',
      status: 'active',
    },
    {
      type: 'buyer',
      name: 'Bunge Alimentos',
      farmOrCompany: 'Bunge Alimentos S.A.',
      city: 'Rondonópolis',
      state: 'MT',
      phone: '(66) 3401-1234',
      email: 'compras.mt@bunge.com',
      mainProducts: JSON.stringify(['soja']),
      estimatedVolume: 500000,
      notes: 'Comprador institucional. Paga à vista. Exige qualidade certificada.',
      status: 'active',
    },
    {
      type: 'buyer',
      name: 'Cargill Agricultural',
      farmOrCompany: 'Cargill Agricultural Supply LTDA',
      city: 'Cuiabá',
      state: 'MT',
      phone: '(65) 3644-9000',
      email: 'operacoes@cargill.com',
      mainProducts: JSON.stringify(['soja', 'milho']),
      estimatedVolume: 300000,
      notes: 'Compra grãos para exportação. Excelente histórico de pagamentos.',
      status: 'active',
    },
    {
      type: 'producer',
      name: 'Agro Santa Maria',
      farmOrCompany: 'Agro Santa Maria EIRELI',
      city: 'Nova Mutum',
      state: 'MT',
      phone: '(65) 99111-2233',
      email: 'admin@agrosantamaria.com',
      mainProducts: JSON.stringify(['soja']),
      estimatedVolume: 25000,
      notes: 'Produtor médio. Vende parcelado ao longo do ano.',
      status: 'active',
    },
    {
      type: 'buyer',
      name: 'Granol Indústria',
      farmOrCompany: 'Granol Indústria Comércio S.A.',
      city: 'Anápolis',
      state: 'GO',
      phone: '(62) 3324-5555',
      email: 'compras@granol.com.br',
      mainProducts: JSON.stringify(['soja', 'milho']),
      estimatedVolume: 150000,
      notes: 'Esmagadora de soja. Compra durante todo o ano.',
      status: 'active',
    },
    {
      type: 'producer',
      name: 'Fazenda Primavera',
      farmOrCompany: 'Primavera Agrícola LTDA',
      city: 'Campo Novo do Parecis',
      state: 'MT',
      phone: '(65) 98444-7777',
      email: 'fazenda@primaveraagro.com',
      mainProducts: JSON.stringify(['milho', 'soja', 'algodão']),
      estimatedVolume: 40000,
      notes: 'Produtor diversificado. Prefere contratos futuros.',
      status: 'active',
    },
    {
      type: 'producer',
      name: 'João Ferreira da Silva',
      farmOrCompany: 'Sítio Bela Vista',
      city: 'Diamantino',
      state: 'MT',
      phone: '(65) 99555-8888',
      email: null,
      mainProducts: JSON.stringify(['milho']),
      estimatedVolume: 8000,
      notes: 'Produtor local. Vende toda produção na colheita (fev/mar).',
      status: 'inactive',
    },
    {
      type: 'buyer',
      name: 'Exportadora Norte MT',
      farmOrCompany: 'Norte MT Exportadora S.A.',
      city: 'Sinop',
      state: 'MT',
      phone: '(66) 3531-9090',
      email: 'negocios@nortemtexport.com',
      mainProducts: JSON.stringify(['soja', 'milho']),
      estimatedVolume: 200000,
      notes: 'Exportadora regional. Boa taxa de comissão negociada.',
      status: 'active',
    },
  ]

  const clients = await Promise.all(
    clientsData.map((c) => prisma.client.create({ data: c }))
  )
  console.log(`✅ ${clients.length} clients created`)

  // ── Leads ─────────────────────────────────────────────────────────────────
  const leadsData = [
    { name: 'Paulo Oliveira', phone: '(66) 99123-0001', email: 'paulo@email.com', city: 'Alta Floresta', state: 'MT', source: 'indication', stage: 'new', interestProducts: 'soja', notes: 'Indicado pelo João. Tem 10.000sc para vender.' },
    { name: 'Rosana Campos', phone: '(65) 98765-0002', email: null, city: 'Sinop', state: 'MT', source: 'instagram', stage: 'contacted', interestProducts: 'milho', notes: 'Viu publicação no Instagram. Interessada em preços de milho.' },
    { name: 'Armazém Nortão LTDA', phone: '(66) 3202-0003', email: 'armazem@nortao.com', city: 'Peixoto de Azevedo', state: 'MT', source: 'call', stage: 'qualified', interestProducts: 'soja, milho', notes: 'Ligou perguntando cotações. Armazém com capacidade para 50.000t.' },
    { name: 'Benedito Ramos', phone: '(65) 99999-0004', email: null, city: 'Juara', state: 'MT', source: 'indication', stage: 'new', interestProducts: 'soja', notes: null },
    { name: 'Cooperativa Agronorte', phone: '(66) 3500-0005', email: 'coop@agronorte.coop', city: 'Guarantã do Norte', state: 'MT', source: 'call', stage: 'contacted', interestProducts: 'soja, algodão', notes: 'Cooperativa com 300 associados. Potencial enorme.' },
    { name: 'Empresa Exporta Grãos', phone: '(65) 3344-0006', email: 'compras@exporta.com', city: 'Cuiabá', state: 'MT', source: 'other', stage: 'unqualified', interestProducts: 'soja', notes: 'Empresa nova no mercado, sem histórico.' },
    { name: 'Altair Gonçalves', phone: '(66) 98111-0007', email: null, city: 'Colniza', state: 'MT', source: 'indication', stage: 'new', interestProducts: 'milho', notes: 'Pequeno produtor, começa agora.' },
    { name: 'Frigorífico Central MT', phone: '(65) 3232-0008', email: 'compras@frigocentral.com', city: 'Rondonópolis', state: 'MT', source: 'call', stage: 'qualified', interestProducts: 'milho', notes: 'Compra milho para ração animal. Volume mensal de 5000t.' },
    { name: 'Maria de Lourdes Faria', phone: '(65) 99888-0009', email: 'mlourdes@email.com', city: 'Campo Verde', state: 'MT', source: 'instagram', stage: 'contacted', interestProducts: 'soja', notes: 'Produtora familiar, 3000sc de soja.' },
    { name: 'Agro Invest LTDA', phone: '(66) 3100-0010', email: 'contato@agroinvest.com', city: 'Sorriso', state: 'MT', source: 'other', stage: 'new', interestProducts: 'soja, milho, outros', notes: 'Fundo de investimento em commodities.' },
    { name: 'Roberto Meirelles', phone: '(65) 99300-0011', email: null, city: 'Nova Ubiratã', state: 'MT', source: 'indication', stage: 'contacted', interestProducts: 'soja', notes: 'Indicado pela Fazenda São João.' },
    { name: 'Cerealista Pantanal', phone: '(65) 3411-0012', email: 'pantanal@cerealista.com', city: 'Cáceres', state: 'MT', source: 'call', stage: 'qualified', interestProducts: 'milho, soja', notes: 'Cerealista com terminal portuário. Alto potencial.' },
    { name: 'Silvano Brunetti', phone: '(66) 99777-0013', email: 'silvano@email.com', city: 'Querência', state: 'MT', source: 'indication', stage: 'new', interestProducts: 'soja', notes: 'Italiano. Produz soja orgânica.' },
    { name: 'Grão Verde Distribuidora', phone: '(62) 3300-0014', email: 'distribuidora@graoverde.com', city: 'Goiânia', state: 'GO', source: 'call', stage: 'contacted', interestProducts: 'soja, milho', notes: 'Distribuidora para supermercados do Centro-Oeste.' },
    { name: 'Antônio Pereira Luz', phone: '(65) 98222-0015', email: null, city: 'Tapurah', state: 'MT', source: 'instagram', stage: 'new', interestProducts: 'milho', notes: null },
    { name: 'Nutrição Animal Sul', phone: '(51) 3200-0016', email: 'compras@nutrisul.com', city: 'Passo Fundo', state: 'RS', source: 'other', stage: 'qualified', interestProducts: 'milho, soja', notes: 'Fábrica de rações do RS. Busca fornecedores em MT.' },
    { name: 'Fazenda Dois Irmãos', phone: '(65) 99100-0017', email: null, city: 'Primavera do Leste', state: 'MT', source: 'indication', stage: 'contacted', interestProducts: 'soja', notes: 'Dois irmãos donos. Volume estimado: 30000sc.' },
    { name: 'Agromilho Central', phone: '(64) 3300-0018', email: 'central@agromilho.com', city: 'Rio Verde', state: 'GO', source: 'call', stage: 'new', interestProducts: 'milho', notes: 'Maior comprador de milho do GO.' },
    { name: 'Edna Correia Santos', phone: '(66) 98500-0019', email: 'edna@email.com', city: 'Alta Floresta', state: 'MT', source: 'instagram', stage: 'unqualified', interestProducts: 'soja', notes: 'Apenas consultou cotação. Sem intenção de fechar.' },
    { name: 'Coopercampo MT', phone: '(66) 3422-0020', email: 'operacoes@coopercampo.coop', city: 'Campo Novo do Parecis', state: 'MT', source: 'indication', stage: 'qualified', interestProducts: 'soja, milho, algodão', notes: 'Cooperativa regional sólida. Em negociação avançada.' },
  ]

  const leads = await Promise.all(
    leadsData.map((l) => prisma.lead.create({ data: l }))
  )
  console.log(`✅ ${leads.length} leads created`)

  // ── Deals ─────────────────────────────────────────────────────────────────
  const now = new Date()

  // Helper inline: calculates totalValue and commissionValue
  function buildDeal(
    ci: number, p: string, s: string, v: number, u: string,
    up: number, cp: number, st: string, da: number, ed?: number
  ) {
    const totalValue = parseFloat((v * up).toFixed(2))
    const commissionValue = parseFloat((totalValue * cp / 100).toFixed(2))
    const createdAt = subDays(now, da)
    return {
      clientId: clients[ci].id,
      product: p,
      side: s,
      volume: v,
      unit: u,
      unitPrice: up,
      totalValue,
      commissionPct: cp,
      commissionValue,
      status: st,
      closedAt: st === 'closed' ? createdAt : null,
      expectedCloseDate: ed !== undefined ? addDays(now, ed) : null,
      createdAt,
      notes: null as string | null,
    }
  }

  const dealsData = [
    // ── Fechados este mês ───────────────────────────────────────────
    buildDeal(0, 'soja',  'sell', 5000,  'sc', 128.5, 0.8, 'closed', 2),
    buildDeal(1, 'soja',  'sell', 8000,  'sc', 130.0, 1.0, 'closed', 5),
    buildDeal(3, 'soja',  'buy',  10000, 'sc', 129.0, 0.8, 'closed', 7),
    buildDeal(2, 'milho', 'sell', 3000,  'sc', 58.0,  0.8, 'closed', 10),
    buildDeal(4, 'soja',  'buy',  15000, 'sc', 127.5, 0.7, 'closed', 12),
    buildDeal(6, 'milho', 'buy',  20000, 'sc', 59.5,  0.9, 'closed', 14),
    buildDeal(5, 'soja',  'sell', 4000,  'sc', 131.0, 0.8, 'closed', 16),
    buildDeal(1, 'soja',  'sell', 2500,  'sc', 130.5, 0.8, 'closed', 1),
    buildDeal(3, 'milho', 'buy',  7000,  'sc', 59.0,  0.8, 'closed', 3),
    buildDeal(9, 'soja',  'buy',  5500,  'sc', 128.0, 0.9, 'closed', 6),
    buildDeal(4, 'soja',  'buy',  3000,  'sc', 129.5, 0.7, 'closed', 8),
    buildDeal(6, 'soja',  'buy',  11000, 'sc', 127.0, 0.8, 'closed', 9),
    buildDeal(5, 'milho', 'sell', 6000,  'sc', 60.5,  0.9, 'closed', 11),
    // ── Fechados mês anterior ───────────────────────────────────────
    buildDeal(0, 'soja',  'sell', 6000,  'sc', 125.0, 0.8, 'closed', 35),
    buildDeal(1, 'milho', 'sell', 5000,  'sc', 57.5,  0.8, 'closed', 40),
    buildDeal(3, 'soja',  'buy',  12000, 'sc', 124.0, 0.7, 'closed', 45),
    buildDeal(7, 'soja',  'sell', 9000,  'sc', 126.0, 1.0, 'closed', 48),
    buildDeal(4, 'milho', 'buy',  8000,  'sc', 56.0,  0.8, 'closed', 50),
    // ── Fechados há 2 meses ─────────────────────────────────────────
    buildDeal(0, 'soja',  'sell', 7000,  'sc', 120.0, 0.8, 'closed', 65),
    buildDeal(6, 'soja',  'buy',  5000,  'sc', 118.5, 0.8, 'closed', 70),
    buildDeal(2, 'milho', 'sell', 4000,  'sc', 54.0,  0.9, 'closed', 72),
    // ── Em andamento ────────────────────────────────────────────────
    buildDeal(1, 'soja',  'sell', 10000, 'sc', 132.0, 1.0, 'negotiating', 3,  15),
    buildDeal(4, 'milho', 'buy',  25000, 'sc', 60.0,  0.8, 'proposal',    5,  20),
    buildDeal(5, 'soja',  'sell', 3000,  'sc', 129.5, 0.8, 'new',         1,  30),
    buildDeal(7, 'soja',  'sell', 6000,  'sc', 133.0, 1.0, 'proposal',    4,  10),
    buildDeal(9, 'milho', 'buy',  15000, 'sc', 61.0,  0.8, 'negotiating', 6,  7),
    buildDeal(8, 'milho', 'sell', 2000,  'sc', 57.0,  0.8, 'new',         2,  45),
    buildDeal(0, 'soja',  'sell', 4000,  'sc', 131.5, 0.8, 'negotiating', 8,  5),
    // ── Perdidos ────────────────────────────────────────────────────
    buildDeal(3, 'soja',  'buy',  20000, 'sc', 126.0, 0.7, 'lost', 20),
    buildDeal(6, 'milho', 'buy',  8000,  'sc', 55.0,  0.8, 'lost', 25),
  ]

  const deals = await Promise.all(
    dealsData.map((d) => prisma.deal.create({ data: d }))
  )
  console.log(`✅ ${deals.length} deals created`)

  // ── Price History ──────────────────────────────────────────────────────────
  const regions = [
    'Sorriso/MT', 'Porto de Santos', 'MT Norte', 'Campo Verde/MT', 'Rio Verde/GO',
  ]
  const products = ['soja', 'milho']
  const priceBase: Record<string, Record<string, number>> = {
    soja: { 'Sorriso/MT': 128, 'Porto de Santos': 140, 'MT Norte': 126, 'Campo Verde/MT': 127, 'Rio Verde/GO': 129 },
    milho: { 'Sorriso/MT': 58, 'Porto de Santos': 66, 'MT Norte': 57, 'Campo Verde/MT': 58, 'Rio Verde/GO': 59 },
  }

  const priceHistoryData: {
    product: string
    regionLabel: string
    date: Date
    price: number
    unit: string
  }[] = []

  for (let daysBack = 60; daysBack >= 0; daysBack -= 3) {
    for (const product of products) {
      for (const region of regions) {
        const base = priceBase[product][region]
        const variation = (Math.random() - 0.5) * 4
        const trend = (60 - daysBack) * 0.05
        const price = parseFloat((base + variation + trend).toFixed(2))
        priceHistoryData.push({
          product,
          regionLabel: region,
          date: subDays(now, daysBack),
          price,
          unit: 'sc',
        })
      }
    }
  }

  await prisma.priceHistory.createMany({ data: priceHistoryData })
  console.log(`✅ ${priceHistoryData.length} price records created`)

  // ── Activity Logs ─────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        entityType: 'client', entityId: clients[0].id,
        action: 'created', userId: admin.id,
        details: JSON.stringify({ message: 'Cliente criado via seed' }),
      },
      {
        entityType: 'deal', entityId: deals[0].id,
        action: 'status_changed', userId: seller.id,
        details: JSON.stringify({ from: 'proposal', to: 'closed' }),
      },
    ],
  })

  console.log('✅ Activity logs created')
  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin:   admin@crmgraos.com   / admin123')
  console.log('  Seller:  vendedor@crmgraos.com / seller123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
