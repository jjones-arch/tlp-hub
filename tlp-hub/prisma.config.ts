import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/setup.ts",
  },
  datasource: {
    // Keep Prisma CLI operations on the same file used by the app/runtime adapter.
    url: process.env["DATABASE_URL"] || "file:./prisma/dev.db",
  },
});
