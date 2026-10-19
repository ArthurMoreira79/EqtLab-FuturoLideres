import { z } from "zod";

export const competenciaSlug = z.enum([
  "comunicacao",
  "feedback",
  "delegacao",
  "conflitos",
  "decisao",
  "inteligencia_emocional",
  "desenvolvimento",
  "desempenho",
]);

export const nivel = z.enum(["iniciante", "em_desenvolvimento", "proficiente", "referencia"]);

/** Formato obrigatório do feedback de qualquer provedor de IA (seção 6.1 da especificação). */
export const feedbackSchema = z.object({
  nota_geral: z.number().min(0).max(10),
  competencias: z
    .array(z.object({ competencia: competenciaSlug, nota: z.number().min(0).max(10), nivel }))
    .min(1),
  pontos_fortes: z.array(z.string()),
  pontos_de_melhoria: z.array(z.string()),
  riscos_da_abordagem: z.array(z.string()),
  exemplo_de_resposta_melhor: z.string(),
  dificuldades_identificadas: z.array(z.string()),
  proximo_passo_sugerido: z.string(),
  confianca: z.enum(["alta", "media", "baixa"]),
});

export type FeedbackIA = z.infer<typeof feedbackSchema>;

/** O provedor pode recusar a nota quando a resposta é curta ou fora do tema. */
export const avaliacaoSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), feedback: feedbackSchema }),
  z.object({ status: z.literal("desenvolver"), mensagem: z.string() }),
]);

export type ResultadoAvaliacao = z.infer<typeof avaliacaoSchema>;

/** Relatório "Seu momento como líder" (seção 6.2). */
export const relatorioSchema = z.object({
  resumo: z.string().max(700),
  forcas: z.array(z.string()).min(1).max(3),
  pontos_de_atencao: z.array(z.string()).min(1).max(3),
  padroes_observados: z.array(z.string()),
  recomendacao_da_semana: z.string(),
  base_atividades: z.array(z.string()),
});

export type RelatorioIA = z.infer<typeof relatorioSchema>;

const pontuacoesSchema = z.record(competenciaSlug, z.number().min(0).max(5));

export const contextoSchema = z.object({
  setor: z.string().max(80).optional(),
  cargo: z.string().max(80).optional(),
  tamanhoEquipe: z.number().int().min(0).max(500).optional(),
  tipoEquipe: z.string().max(80).optional(),
});

export const pedidoAvaliacaoSchema = z.object({
  desafioId: z.string().min(1).max(80),
  resposta: z.string().max(4000),
  /** Para desafios de escolha. */
  opcaoEscolhida: z.number().int().min(0).max(10).optional(),
  contexto: contextoSchema.optional(),
});

export const pedidoRelatorioSchema = z.object({
  nome: z.string().max(80).optional(),
  inicial: pontuacoesSchema,
  atual: pontuacoesSchema,
  atividades: z
    .array(
      z.object({
        titulo: z.string().max(200),
        data: z.string().max(40),
        nota: z.number().min(0).max(10),
        dificuldades: z.array(z.string().max(200)).max(10),
      }),
    )
    .max(30),
});

export type PedidoRelatorio = z.infer<typeof pedidoRelatorioSchema>;
