import { z } from "zod";
import { CENARIOS } from "@/lib/conteudo/diagnostico";
import type { CompetenciaSlug, Pontuacoes } from "@/lib/types";

/** Respostas do diagnóstico: uma alternativa (índice) por cenário, e nada além dos cenários que existem. */
export const respostasDiagnosticoSchema = z
  .object(
    Object.fromEntries(
      CENARIOS.map((c) => [
        c.id,
        z
          .number({ error: "Responda todas as situações." })
          .int()
          .min(0)
          .max(c.opcoes.length - 1),
      ]),
    ),
  )
  .strict();

export const corpoDiagnosticoSchema = z.object({ respostas: respostasDiagnosticoSchema }).strict();

export type RespostasDiagnostico = Record<string, number>;

/** Diagnóstico como o navegador recebe do servidor. */
export interface DiagnosticoSalvo {
  id: string;
  /** ISO 8601. */
  criadoEm: string;
  pontuacoes: Pontuacoes;
  trilha: CompetenciaSlug[];
  respostas: RespostasDiagnostico;
}
