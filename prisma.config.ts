import { defineConfig, env } from "prisma/config";

/**
 * Prisma v7 configuration file.
 *
 * This replaces the `url` field that was previously inside schema.prisma.
 * The connection string is read from DATABASE_URL in .env.local.
 *
 * Next.js automatically loads .env.local — but this file runs via the
 * Prisma CLI (outside Next.js), so we read process.env directly.
 * The `env()` helper from prisma/config handles this correctly.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
