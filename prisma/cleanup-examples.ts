import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Removendo dados de exemplo...')

  await prisma.activityLog.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.client.deleteMany()

  console.log('✅ Clientes removidos')
  console.log('✅ Leads removidos')
  console.log('✅ Negociações removidas')
  console.log('✅ Logs removidos')
  console.log('')
  console.log('🎉 Pronto! Sistema limpo e pronto para uso.')
  console.log('   Produtos, preços e configurações foram mantidos.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
