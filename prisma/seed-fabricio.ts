/**
 * Seed script para criar o usuário Fabrício com layout personalizado
 * de Ordem de Carregamento.
 *
 * Uso: npx tsx prisma/seed-fabricio.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Layout personalizado do Fabrício — somente estes campos aparecem na tela de Ordem de Carregamento
const fabricioLayout = [
  {
    title: 'Identificação do Documento',
    fields: [
      { key: 'orderNumber', label: 'Autorização de Carregamento Nº', type: 'text' },
      { key: 'origin', label: 'Origem', type: 'text' },
      { key: 'warehouse', label: 'Armazém / Fazenda', type: 'text' },
      { key: 'clientCity', label: 'Município', type: 'text' },
      { key: 'clientState', label: 'Estado (UF)', type: 'text' },
      { key: 'authorizedCompany', label: 'Empresa autorizada', type: 'text' },
      { key: 'company', label: 'Empresa', type: 'text' },
    ],
  },
  {
    title: 'Dados do Motorista',
    fields: [
      { key: 'driverName', label: 'Motorista', type: 'text' },
      { key: 'driverCpf', label: 'CPF', type: 'text' },
      { key: 'driverPhone', label: 'Telefone', type: 'text' },
    ],
  },
  {
    title: 'Dados do Proprietário',
    fields: [
      { key: 'ownerName', label: 'Proprietário', type: 'text' },
    ],
  },
  {
    title: 'Dados do Veículo',
    fields: [
      { key: 'truckPlate', label: 'Veículo / Placa', type: 'text' },
      { key: 'vehicleCity', label: 'Cidade do veículo', type: 'text' },
      { key: 'vehicleState', label: 'UF do veículo', type: 'text' },
      { key: 'antt', label: 'ANTT', type: 'text' },
      { key: 'weightKg', label: 'Peso (Kgs)', type: 'number' },
    ],
  },
  {
    title: 'Dados da Carga',
    fields: [
      { key: 'cargoType', label: 'Tipo', type: 'text' },
      { key: 'harvest', label: 'Safra', type: 'text' },
      { key: 'commodity', label: 'Mercadoria', type: 'text' },
      { key: 'producerName', label: 'Produtor', type: 'text' },
    ],
  },
  {
    title: 'Itinerário / Destino',
    fields: [
      { key: 'recipientName', label: 'Destinatário', type: 'text' },
      { key: 'quantity', label: 'Quantidade (Kgs)', type: 'number' },
    ],
  },
  {
    title: 'Informações Adicionais',
    fields: [
      { key: 'issuedAt', label: 'Data', type: 'text' },
      { key: 'responsibleName', label: 'Responsável', type: 'text' },
    ],
  },
]

async function main() {
  const email = 'fabricio@crmgraos.com'
  const password = 'Fabricio123'
  const passwordHash = await bcrypt.hash(password, 10)

  // Upsert: create or update if already exists
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Fabrício',
      passwordHash,
      role: 'seller',
      loadingOrderLayout: JSON.stringify(fabricioLayout),
    },
    create: {
      name: 'Fabrício',
      email,
      passwordHash,
      role: 'seller',
      loadingOrderLayout: JSON.stringify(fabricioLayout),
    },
  })

  console.log('✅ Usuário Fabrício criado/atualizado com sucesso!')
  console.log(`   ID:    ${user.id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Senha: ${password}`)
  console.log(`   Role:  ${user.role}`)
  console.log(`   Layout personalizado: Ordem de Carregamento (${fabricioLayout.length} seções)`)
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuário Fabrício:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
