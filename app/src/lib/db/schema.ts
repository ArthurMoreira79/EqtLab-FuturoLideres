import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * SCHEMA DO BANCO — fonte única de verdade.
 *
 * Fluxo para mudar o banco:
 *   1. edite este arquivo;
 *   2. `pnpm db:generate` cria a migração SQL em `drizzle/` (revise e versione no git);
 *   3. `pnpm db:migrate` aplica (o app também aplica sozinho na primeira requisição).
 *
 * Nada de criar tabela “na mão”: se não está aqui, não deveria existir no banco.
 * Este arquivo não importa nada do app (nem alias `@/`) para o drizzle-kit conseguir lê-lo.
 */

const instante = (nome: string) => timestamp(nome, { withTimezone: true });

/* ───────────────────────── Contas e sessão ───────────────────────── */

export const usuarios = pgTable("usuarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  cargo: text("cargo").notNull(),
  setor: text("setor").notNull(),
  tipoEquipe: text("tipo_equipe").notNull(),
  tamanhoEquipe: integer("tamanho_equipe").notNull(),
  mesesLideranca: integer("meses_lideranca").notNull(),
  modeloTrabalho: text("modelo_trabalho").notNull(),
  desafios: text("desafios").array().notNull().default(sql`'{}'`),
  /** scrypt$N$r$p$salt$hash — nunca a senha. */
  senhaHash: text("senha_hash").notNull(),
  criadoEm: instante("criado_em").notNull().defaultNow(),
  ultimoLoginEm: instante("ultimo_login_em"),
});

/** Cadastro em andamento: salvo a cada fase, antes de existir conta (a senha vem por último). */
export const cadastrosRascunho = pgTable("cadastros_rascunho", {
  id: uuid("id").primaryKey().defaultRandom(),
  dados: jsonb("dados").notNull().default(sql`'{}'::jsonb`),
  fase: integer("fase").notNull().default(0),
  criadoEm: instante("criado_em").notNull().defaultNow(),
  atualizadoEm: instante("atualizado_em").notNull().defaultNow(),
  expiraEm: instante("expira_em").notNull().default(sql`now() + interval '7 days'`),
});

/** O JWT carrega o id da sessão; revogar a linha aqui encerra o login de verdade. */
export const sessoes = pgTable(
  "sessoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    criadaEm: instante("criada_em").notNull().defaultNow(),
    expiraEm: instante("expira_em").notNull(),
    revogadaEm: instante("revogada_em"),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessoes_usuario_idx").on(t.usuarioId)],
);

/** Contadores do rate limit (janela fixa). Valem para todas as instâncias do servidor. */
export const limitesTaxa = pgTable("limites_taxa", {
  chave: text("chave").primaryKey(),
  contagem: integer("contagem").notNull(),
  janelaInicio: instante("janela_inicio").notNull(),
});

/* ───────────────────────── Diagnóstico ───────────────────────── */

/** Um diagnóstico respondido por uma pessoa (hoje só o “inicial”; reavaliações 30/60/90 entram aqui). */
export const diagnosticos = pgTable(
  "diagnosticos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    tipo: text("tipo", { enum: ["inicial", "reavaliacao"] })
      .notNull()
      .default("inicial"),
    /** 1 = legado; 2 = quatro situações de marcar. */
    versaoConteudo: integer("versao_conteudo").notNull().default(1),
    /** Ordem recomendada dos módulos (slugs das competências), pontos de atenção primeiro. */
    trilha: text("trilha").array().notNull(),
    criadoEm: instante("criado_em").notNull().defaultNow(),
  },
  (t) => [index("diagnosticos_usuario_idx").on(t.usuarioId, t.criadoEm)],
);

/** A alternativa marcada em cada situação (cenário) do diagnóstico. */
export const diagnosticoRespostas = pgTable(
  "diagnostico_respostas",
  {
    diagnosticoId: uuid("diagnostico_id")
      .notNull()
      .references(() => diagnosticos.id, { onDelete: "cascade" }),
    /** Id do cenário no conteúdo (ex.: "b1"). */
    cenarioId: text("cenario_id").notNull(),
    /** Índice da alternativa escolhida (0 = primeira). */
    opcao: integer("opcao").notNull(),
    /** Cópia do conteúdo apresentado para preservar o histórico. Nulo nos registros legados. */
    cenarioTexto: text("cenario_texto"),
    opcaoTexto: text("opcao_texto"),
  },
  (t) => [
    primaryKey({ columns: [t.diagnosticoId, t.cenarioId] }),
    check("diagnostico_opcao_nao_negativa", sql`${t.opcao} >= 0`),
  ],
);

/** Nota (0 a 5) por competência, ao longo do tempo: base das barras do resultado e da evolução. */
export const pontuacoesCompetencia = pgTable(
  "pontuacoes_competencia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    diagnosticoId: uuid("diagnostico_id").references(() => diagnosticos.id, { onDelete: "set null" }),
    competencia: text("competencia").notNull(),
    nota: real("nota").notNull(),
    origem: text("origem", { enum: ["diagnostico", "missao", "desafio"] }).notNull(),
    criadoEm: instante("criado_em").notNull().defaultNow(),
  },
  (t) => [
    index("pontuacoes_usuario_competencia_idx").on(t.usuarioId, t.competencia, t.criadoEm),
    uniqueIndex("pontuacoes_diagnostico_competencia_idx").on(t.diagnosticoId, t.competencia),
    check("pontuacoes_nota_intervalo", sql`${t.nota} >= 0 AND ${t.nota} <= 5`),
  ],
);
