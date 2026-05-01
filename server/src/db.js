import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
process.chdir(resolve(currentDir, '../prisma'));

const { PrismaClient } = await import('@prisma/client');

export const prisma = new PrismaClient();
