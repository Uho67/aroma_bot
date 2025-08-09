const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create default catalog button
  await prisma.buttonSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Каталог',
      type: 'callback',
      value: 'catalog',
      order: 2
    }
  })

  // Create default start message
  await prisma.startMessageSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      text: 'Добро пожаловать! Выберите действие:',
      image: null
    }
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 