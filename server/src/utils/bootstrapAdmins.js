import { prisma } from '../db.js';

function parseEmails(value = '') {
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function bootstrapAdmins() {
  const emails = Array.from(
    new Set([
      ...parseEmails(process.env.ADMIN_EMAILS),
      ...parseEmails(process.env.PROMOTE_ADMIN_EMAILS),
      ...parseEmails(process.env.ADMIN_EMAIL),
    ]),
  );

  if (!emails.length) return;

  const result = await prisma.user.updateMany({
    where: { email: { in: emails } },
    data: { role: 'ADMIN' },
  });

  console.log(`Admin bootstrap checked ${emails.length} email(s), promoted ${result.count} existing user(s).`);
}
