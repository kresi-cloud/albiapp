import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Fejlesztés közben a Next.js újratölti a modulokat, ezért a klienst a globális
// objektumon tartjuk, különben minden mentésnél új kapcsolat nyílna.
const globalis = globalThis as unknown as { prisma?: PrismaClient };

function ujKliens(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Korábban volt alapértelmezés (`file:./dev.db`), és az SQLite-nál ártalmatlan
    // volt: legfeljebb üres fájl keletkezett. Postgresnél a hiányzó cím néma
    // kapcsolódási hiba lenne futásidőben, kérésenként, ezért inkább itt állunk meg.
    throw new Error("DATABASE_URL hiányzik");
  }
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

export const prisma = globalis.prisma ?? ujKliens();

if (process.env.NODE_ENV !== "production") globalis.prisma = prisma;
