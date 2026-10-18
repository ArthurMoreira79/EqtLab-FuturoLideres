import "server-only";
import { desc, eq } from "drizzle-orm";
import { CENARIOS } from "@/lib/conteudo/diagnostico";
import { obterDb, schema } from "@/lib/db";
import type { DiagnosticoSalvo, RespostasDiagnostico } from "@/lib/diagnostico";
import type { CompetenciaSlug, Pontuacoes } from "@/lib/types";

/** Grava o diagnóstico inteiro (respostas + notas por competência) numa transação: ou entra tudo, ou nada. */
export async function salvarDiagnostico(
  usuarioId: string,
  respostas: RespostasDiagnostico,
  pontuacoes: Pontuacoes,
  trilha: CompetenciaSlug[],
): Promise<DiagnosticoSalvo> {
  const db = await obterDb();
  return db.transaction(async (tx) => {
    const [d] = await tx.insert(schema.diagnosticos).values({ usuarioId, tipo: "inicial", versaoConteudo: 2, trilha }).returning();
    await tx
      .insert(schema.diagnosticoRespostas)
      .values(CENARIOS.map((cenario) => ({
        diagnosticoId: d.id,
        cenarioId: cenario.id,
        opcao: respostas[cenario.id],
        cenarioTexto: cenario.texto,
        opcaoTexto: cenario.opcoes[respostas[cenario.id]].texto,
      })));
    await tx.insert(schema.pontuacoesCompetencia).values(
      Object.entries(pontuacoes).map(([competencia, nota]) => ({
        usuarioId,
        diagnosticoId: d.id,
        competencia,
        nota,
        origem: "diagnostico" as const,
      })),
    );
    return { id: d.id, criadoEm: d.criadoEm.toISOString(), pontuacoes, trilha, respostas };
  });
}

/** O diagnóstico mais recente da pessoa (ou null se ainda não fez). */
export async function ultimoDiagnostico(usuarioId: string): Promise<DiagnosticoSalvo | null> {
  const db = await obterDb();
  const [d] = await db
    .select()
    .from(schema.diagnosticos)
    .where(eq(schema.diagnosticos.usuarioId, usuarioId))
    .orderBy(desc(schema.diagnosticos.criadoEm))
    .limit(1);
  if (!d) return null;

  const [respostas, notas] = await Promise.all([
    db.select().from(schema.diagnosticoRespostas).where(eq(schema.diagnosticoRespostas.diagnosticoId, d.id)),
    db.select().from(schema.pontuacoesCompetencia).where(eq(schema.pontuacoesCompetencia.diagnosticoId, d.id)),
  ]);

  return {
    id: d.id,
    criadoEm: d.criadoEm.toISOString(),
    trilha: d.trilha as CompetenciaSlug[],
    respostas: Object.fromEntries(respostas.map((r) => [r.cenarioId, r.opcao])),
    pontuacoes: Object.fromEntries(notas.map((n) => [n.competencia, n.nota])) as Pontuacoes,
  };
}
