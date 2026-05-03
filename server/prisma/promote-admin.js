import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || process.env.PROMOTE_ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email) {
    console.error('Please provide an email: npm run prisma:promote-admin -- user@example.com');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, username: true, email: true, role: true },
  });

  console.log(`Promoted user to ${updated.role}: ${updated.username} <${updated.email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
