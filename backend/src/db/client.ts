import { PrismaClient, Prisma } from '@prisma/client';

// Single shared Prisma instance across the app (avoids exhausting DB connections in dev with hot-reload).
export const prisma = new PrismaClient();

// Repositories accept either the top-level client or a `$transaction` callback's client.
export type Db = PrismaClient | Prisma.TransactionClient;
