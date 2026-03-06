import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed AgriValor...')

  // ── Limpa tudo (ordem respeitando foreign keys) ───────────────────────────
  await prisma.activityLog.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.priceHistory.deleteMany()
  await prisma.client.deleteMany()
  await prisma.companySettings.deleteMany()
  await prisma.user.deleteMany()
  await prisma.produto.deleteMany()

  console.log('🗑️  Dados anteriores removidos')

  // ── Usuário administrador ─────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Gean123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'Gean César',
      email: 'Gean.cesar2204@gmail.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  })

  console.log('✅ Usuário admin criado:', admin.email)

  // ── Produtos ──────────────────────────────────────────────────────────────
  const [soja, milho, milheto] = await Promise.all([
    prisma.produto.create({ data: { name: 'Soja', unit: 'sc' } }),
    prisma.produto.create({ data: { name: 'Milho', unit: 'sc' } }),
    prisma.produto.create({ data: { name: 'Milheto', unit: 'sc' } }),
    prisma.produto.create({ data: { name: 'Sorgo', unit: 'sc' } }),
  ])

  console.log('✅ Produtos criados: Soja, Milho, Milheto, Sorgo')

  // ── Clientes exemplo ──────────────────────────────────────────────────────
  const produtor = await prisma.client.create({
    data: {
      type: 'producer',
      name: 'Produtor Exemplo',
      farmOrCompany: 'Fazenda Exemplo LTDA',
      city: 'Cuiabá',
      state: 'MT',
      phone: '(65) 99999-0001',
      email: 'produtor@exemplo.com',
      mainProducts: JSON.stringify(['soja', 'milho', 'milheto']),
      estimatedVolume: 10000,
      notes: 'Registro de exemplo. Substitua pelos dados do seu primeiro produtor real.',
      status: 'active',
    },
  })

  const comprador = await prisma.client.create({
    data: {
      type: 'buyer',
      name: 'Comprador Exemplo',
      farmOrCompany: 'Empresa Exemplo S.A.',
      city: 'Goiânia',
      state: 'GO',
      phone: '(62) 99999-0002',
      email: 'comprador@exemplo.com',
      mainProducts: JSON.stringify(['soja', 'milho', 'milheto']),
      estimatedVolume: 50000,
      notes: 'Registro de exemplo. Substitua pelos dados do seu primeiro comprador real.',
      status: 'active',
    },
  })

  console.log('✅ Clientes exemplo criados')

  // ── Leads exemplo (1 por etapa) ───────────────────────────────────────────
  await prisma.lead.createMany({
    data: [
      {
        name: 'Lead Novo — Exemplo',
        phone: '(65) 99001-0001',
        email: null,
        city: 'Cuiabá',
        state: 'MT',
        source: 'indication',
        stage: 'new',
        interestProducts: 'soja',
        notes: 'Lead de exemplo na etapa Novo. Indicado por um contato.',
      },
      {
        name: 'Lead Contactado — Exemplo',
        phone: '(65) 99001-0002',
        email: 'contactado@exemplo.com',
        city: 'Várzea Grande',
        state: 'MT',
        source: 'instagram',
        stage: 'contacted',
        interestProducts: 'milho',
        notes: 'Lead de exemplo na etapa Contactado. Veio pelo Instagram.',
      },
      {
        name: 'Lead Qualificado — Exemplo',
        phone: '(62) 99001-0003',
        email: 'qualificado@exemplo.com',
        city: 'Goiânia',
        state: 'GO',
        source: 'call',
        stage: 'qualified',
        interestProducts: 'soja, milho',
        notes: 'Lead de exemplo na etapa Qualificado. Ligou pedindo cotações.',
      },
      {
        name: 'Lead Desqualificado — Exemplo',
        phone: '(65) 99001-0004',
        email: null,
        city: 'Rondonópolis',
        state: 'MT',
        source: 'other',
        stage: 'unqualified',
        interestProducts: 'soja',
        notes: 'Lead de exemplo na etapa Desqualificado. Sem interesse real.',
      },
    ],
  })

  console.log('✅ Leads exemplo criados (1 por etapa)')

  // ── Negociações exemplo (1 por status) ───────────────────────────────────
  const now = new Date()

  function days(n: number) {
    const d = new Date(now)
    d.setDate(d.getDate() + n)
    return d
  }

  function makeDeal(
    clientId: string,
    product: string,
    side: string,
    volume: number,
    unitPrice: number,
    commissionPct: number,
    status: string,
    daysAgo: number,
    daysUntilClose?: number
  ) {
    const totalValue = parseFloat((volume * unitPrice).toFixed(2))
    const commissionValue = parseFloat((totalValue * commissionPct) / 100).toFixed(2)
    const createdAt = days(-daysAgo)
    return {
      clientId,
      product,
      side,
      volume,
      unit: 'sc',
      unitPrice,
      totalValue,
      commissionPct,
      commissionValue: parseFloat(commissionValue),
      status,
      closedAt: status === 'closed' ? createdAt : null,
      expectedCloseDate: daysUntilClose !== undefined ? days(daysUntilClose) : null,
      createdAt,
      notes: 'Negociação de exemplo.',
    }
  }

  await Promise.all([
    // new
    prisma.deal.create({ data: makeDeal(produtor.id, 'soja', 'sell', 1000, 108.17, 0.8, 'new', 1, 30) }),
    // proposal
    prisma.deal.create({ data: makeDeal(comprador.id, 'milho', 'buy', 2000, 55.0, 0.8, 'proposal', 3, 15) }),
    // negotiating
    prisma.deal.create({ data: makeDeal(produtor.id, 'milheto', 'sell', 500, 41.0, 0.8, 'negotiating', 5, 7) }),
    // closed
    prisma.deal.create({ data: makeDeal(comprador.id, 'soja', 'buy', 3000, 108.17, 0.8, 'closed', 10) }),
    // lost
    prisma.deal.create({ data: makeDeal(produtor.id, 'milho', 'sell', 1500, 55.0, 0.8, 'lost', 20) }),
  ])

  console.log('✅ Negociações exemplo criadas (1 por etapa)')

  // ── Histórico de preços (dados reais das screenshots) ─────────────────────
  // Datas: usamos o dia 15 de cada mês como referência
  const priceData = [
    // ── Goiânia/GO ─────────────────────────────────
    // Soja
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Goiânia/GO', date: new Date('2025-11-15'), price: 124.89, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Goiânia/GO', date: new Date('2025-12-15'), price: 127.43, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Goiânia/GO', date: new Date('2026-01-15'), price: 115.12, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Goiânia/GO', date: new Date('2026-02-15'), price: 108.17, unit: 'sc' },
    // Milho
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Goiânia/GO', date: new Date('2025-11-15'), price: 62.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Goiânia/GO', date: new Date('2025-12-15'), price: 60.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Goiânia/GO', date: new Date('2026-01-15'), price: 57.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Goiânia/GO', date: new Date('2026-02-15'), price: 55.0, unit: 'sc' },
    // Milheto
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Goiânia/GO', date: new Date('2025-11-15'), price: 44.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Goiânia/GO', date: new Date('2025-12-15'), price: 43.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Goiânia/GO', date: new Date('2026-01-15'), price: 42.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Goiânia/GO', date: new Date('2026-02-15'), price: 41.0, unit: 'sc' },

    // ── Cuiabá/MT ──────────────────────────────────
    // Soja
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-11-15'), price: 116.0, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-12-15'), price: 118.0, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-01-15'), price: 108.0, unit: 'sc' },
    { product: 'Soja', produtoId: soja.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-02-15'), price: 102.0, unit: 'sc' },
    // Milho
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-11-15'), price: 55.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-12-15'), price: 53.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-01-15'), price: 49.0, unit: 'sc' },
    { product: 'Milho', produtoId: milho.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-02-15'), price: 47.0, unit: 'sc' },
    // Milheto
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-11-15'), price: 41.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Cuiabá/MT', date: new Date('2025-12-15'), price: 40.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-01-15'), price: 39.0, unit: 'sc' },
    { product: 'Milheto', produtoId: milheto.id, regionLabel: 'Cuiabá/MT', date: new Date('2026-02-15'), price: 38.0, unit: 'sc' },
  ]

  await prisma.priceHistory.createMany({ data: priceData })
  console.log(`✅ ${priceData.length} registros de preço criados (Goiânia/GO e Cuiabá/MT)`)

  // ── Configurações da empresa ───────────────────────────────────────────────
  await prisma.companySettings.create({
    data: {
      userId: admin.id,
      companyName: 'AgriValor',
      region: 'Mato Grosso',
    },
  })

  console.log('✅ Configurações da empresa criadas')

  console.log('\n🎉 Seed AgriValor concluído com sucesso!')
  console.log('\n📋 Acesso ao sistema:')
  console.log('  Email:  Gean.cesar2204@gmail.com')
  console.log('  Senha:  Gean123')
  console.log('\n📦 Produtos cadastrados: Soja, Milho, Milheto, Sorgo')
  console.log('📊 Histórico de preços: Goiânia/GO e Cuiabá/MT (Nov/2025 a Fev/2026)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
