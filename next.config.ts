import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A better-sqlite3 natív modul, ezért nem szabad a szerveroldali csomagba
  // fordítani: futásidőben kell betöltődnie.
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
};

export default nextConfig;
