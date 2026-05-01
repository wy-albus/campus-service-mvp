import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const { ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.warn('Please configure ADMIN_EMAIL, ADMIN_USERNAME and ADMIN_PASSWORD in server/.env before seeding.');
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: { username: ADMIN_USERNAME, passwordHash, role: 'ADMIN' },
    create: {
      email: ADMIN_EMAIL.toLowerCase(),
      username: ADMIN_USERNAME,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user ready: ${ADMIN_EMAIL}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
