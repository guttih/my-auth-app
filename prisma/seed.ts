import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('hunter2', 12);
  await prisma.user.upsert({
    where: { email: 'admin@guttih.com' },
    update: {},
    create: {
      email: 'admin@guttih.com',
      passwordHash: hash,
    },
  });
}

main().finally(() => prisma.$disconnect());
