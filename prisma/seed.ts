
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcrypt';

async function main() {
  const hash = await bcrypt.hash('hunter2', 12);

  await prisma.user.upsert({
    where: { username: 'guttih' },
    update: {},
    create: {
      username: 'guttih',
      email: 'gudjonholm@gmail.com',
      passwordHash: hash,
      authProvider: 'LOCAL',
    },
  });
}

main().finally(() => prisma.$disconnect());
