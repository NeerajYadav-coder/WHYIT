/**
 * Prisma Client Singleton — Prisma v7 with driver adapter
 *
 * Prisma v7 requires a driver adapter. We use @prisma/adapter-pg
 * with the standard `pg` Pool for PostgreSQL.
 *
 * The connection string comes from DATABASE_URL in .env.local.
 * Next.js automatically loads .env.local into process.env.
 *
 * Dev hot-reload pattern: re-use the existing instance across
 * module hot-reloads to avoid exhausting the connection pool,
 * but ensure newly generated models are initialized.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local:\n" +
      "DATABASE_URL=postgresql://user:password@localhost:5432/whyit?schema=public"
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

function getPrisma(): PrismaClient {
  if (
    !globalForPrisma.prisma ||
    !("knowledgeSource" in globalForPrisma.prisma) ||
    !("curiosity" in globalForPrisma.prisma) ||
    !("learningAxiom" in globalForPrisma.prisma)
  ) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = getPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
