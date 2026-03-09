import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Lenise123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'Leniseadmngcb@outlook.com' },
    update: { name: 'Lenise Knirsch', passwordHash: hash, role: 'admin' },
    create: {
      name: 'Lenise Knirsch',
      email: 'Leniseadmngcb@outlook.com',
      passwordHash: hash,
      role: 'admin',
    },
  })

  console.log('✅ Usuário criado/atualizado:', user.email)
  console.log('   Nome:  Lenise Knirsch')
  console.log('   Email: Leniseadmngcb@outlook.com')
  console.log('   Senha: Lenise123')
  console.log('   Perfil: Administradora')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
