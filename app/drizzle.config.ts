import { defineConfig } from "drizzle-kit";

// O drizzle-kit não carrega o .env.local sozinho (o Next carrega só quando roda o app).
try {
  process.loadEnvFile(".env.local");
} catch {
  /* sem .env.local: usa o que já estiver no ambiente */
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://futuro:futuro_dev@localhost:5434/futuro_lideres" },
  strict: true,
  verbose: true,
});
