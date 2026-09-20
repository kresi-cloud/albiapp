import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Fejlesztés közben a Next.js újratölti a modulokat, ezért a klienst a globális
// objektumon tartjuk, különben minden mentésnél új kapcsolat nyílna.
const globalis = globalThis as unknown as { prisma?: PrismaClient };

function ujKliens(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const adapter = new PrismaBetterSqlite3({ url: url.replace(/^file:/, "") });
  return new PrismaClient({ adapter });
}

export const prisma = globalis.prisma ?? ujKliens();

if (process.env.NODE_ENV !== "production") globalis.prisma = prisma;
