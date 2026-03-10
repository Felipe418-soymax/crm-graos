/**
 * migrate-userId.ts
 * Atribui todos os registros sem userId ao usuário Gean César.
 * Rodar UMA VEZ no servidor após prisma db push.
 * npx tsx prisma/migrate-userId.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Pega o Gean pelo email
  const gean = await prisma.user.findUnique({ where: { email: 'Gean.cesar2204@gmail.com' } })
  if (!gean) {
    console.error('Usuário Gean não encontrado!')
    process.exit(1)
  }

  const [clients, leads, deals] = await Promise.all([
    prisma.client.updateMany({ where: { userId: null }, data: { userId: gean.id } }),
    prisma.lead.updateMany({ where: { userId: null }, data: { userId: gean.id } }),
    prisma.deal.updateMany({ where: { userId: null }, data: { userId: gean.id } }),
  ])

  console.log(`Migração concluída:`)
  console.log(`  Clientes: ${clients.count}`)
  console.log(`  Leads: ${leads.count}`)
  console.log(`  Negociações: ${deals.count}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
