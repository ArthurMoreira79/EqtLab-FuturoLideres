import "server-only";
import { asc, eq } from "drizzle-orm";
import { AREAS_PADRAO, urlSegura, type Area } from "@/lib/areas";
import { obterDb, schema } from "@/lib/db";

/** Áreas ativas, na ordem dos escudos. Lê do banco (tabela `areas`). */
export async function listarAreas(): Promise<Area[]> {
  const db = await obterDb();
  const linhas = await db.select().from(schema.areas).where(eq(schema.areas.ativa, true)).orderBy(asc(schema.areas.ordem));
  return linhas.map((l): Area => {
    const url = urlSegura(l.reuniaoUrl);
    return {
      slug: l.slug,
      nome: l.nome,
      descricao: l.descricao,
      cor: l.cor,
      ordem: l.ordem,
      // Só entra se tiver provedor e um link https válido.
      reuniao: l.reuniaoProvedor && url ? { provedor: l.reuniaoProvedor, titulo: l.reuniaoTitulo ?? "Reunião da área", url } : null,
    };
  });
}

/** Lista as áreas; se o banco não responder, usa a lista padrão para a Comunidade não ficar fora do ar. */
export async function areasOuPadrao(): Promise<{ areas: Area[]; fonte: "banco" | "padrao" }> {
  try {
    const areas = await listarAreas();
    if (areas.length > 0) return { areas, fonte: "banco" };
  } catch (e) {
    console.error("[areas] usando a lista padrão:", (e as Error).message);
  }
  return { areas: AREAS_PADRAO, fonte: "padrao" };
}

export async function areaExiste(slug: string): Promise<boolean> {
  return (await areasOuPadrao()).areas.some((a) => a.slug === slug);
}
