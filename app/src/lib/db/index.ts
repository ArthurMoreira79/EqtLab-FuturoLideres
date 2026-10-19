import "server-only";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool, type QueryResult, type QueryResultRow } from "pg";
import * as schema from "./schema";

/** Erro de configuração/infra: vira 503 amigável nas rotas, sem vazar detalhes. */
export class ErroBanco extends Error {}

const TRAVA_MIGRACAO = 7_240_001;

const g = globalThis as unknown as {
  __flPool?: Pool;
  __flDb?: ReturnType<typeof criarDb>;
  __flMigracao?: Promise<void>;
};

function pool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new ErroBanco("DATABASE_URL não configurada.");
  // Reaproveita o pool entre recarregamentos do modo dev.
  g.__flPool ??= new Pool({ connectionString: url, max: 10, connectionTimeoutMillis: 5_000, idleTimeoutMillis: 30_000 });
  return g.__flPool;
}

function criarDb() {
  return drizzle(pool(), { schema });
}

/** Cliente Drizzle (tipado pelo schema). Chame `await garantirSchema()` antes na primeira vez — `obterDb()` já faz isso. */
export async function obterDb() {
  await garantirSchema();
  return (g.__flDb ??= criarDb());
}

async function aplicarMigracoes() {
  const cliente = await pool().connect();
  try {
    // Trava para duas requisições simultâneas não migrarem ao mesmo tempo.
    await cliente.query("SELECT pg_advisory_lock($1)", [TRAVA_MIGRACAO]);
    await migrate(drizzle(cliente), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } finally {
    await cliente.query("SELECT pg_advisory_unlock($1)", [TRAVA_MIGRACAO]).catch(() => {});
    cliente.release();
  }
}

/** Aplica as migrações pendentes (pasta `drizzle/`) uma vez por processo. O mesmo que `pnpm db:migrate`. */
export function garantirSchema(): Promise<void> {
  g.__flMigracao ??= aplicarMigracoes().catch((e) => {
    g.__flMigracao = undefined; // tenta de novo na próxima requisição
    throw e;
  });
  return g.__flMigracao;
}

/** SQL direto (usado pelos módulos de autenticação e rate limit). Para o resto, prefira `obterDb()`. */
export async function consultar<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  await garantirSchema();
  return pool().query<T>(sql, params);
}

export { schema };
