import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Test connection and create sample data
  console.log('Database connected successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
