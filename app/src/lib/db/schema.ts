import { sql } from "drizzle-orm";
import {
  boolean,
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

export const usuarios = pgTable(
  "usuarios",
  {
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
    /** Avatar (emblema do perfil): configuração das peças, validada por `avatarSchema` (lib/avatar.ts). Nulo = ainda não criou. */
    avatar: jsonb("avatar"),
    /** "admin" cria salas de jogo na Comunidade. Quem vira admin é decidido direto no banco (veja o README). */
    papel: text("papel", { enum: ["membro", "admin"] }).notNull().default("membro"),
    criadoEm: instante("criado_em").notNull().defaultNow(),
    ultimoLoginEm: instante("ultimo_login_em"),
  },
  (t) => [check("usuarios_papel_valido", sql`${t.papel} IN ('membro', 'admin')`)],
);

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

/* ───────────────────────── Rede de equipes ───────────────────────── */

/** Cada líder mantém uma equipe; o mesmo usuário pode participar de outras equipes. */
export const equipes = pgTable("equipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  donoId: uuid("dono_id").notNull().unique().references(() => usuarios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  criadoEm: instante("criado_em").notNull().defaultNow(),
});

/** O e-mail permite vincular uma conta existente ou aceitar o convite depois de se cadastrar. */
export const equipeMembros = pgTable("equipe_membros", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipeId: uuid("equipe_id").notNull().references(() => equipes.id, { onDelete: "cascade" }),
  usuarioId: uuid("usuario_id").references(() => usuarios.id, { onDelete: "set null" }),
  email: text("email").notNull(),
  nome: text("nome").notNull(),
  funcao: text("funcao").notNull().default(""),
  /** Data do último 1:1, visível só para quem gerencia a equipe. */
  ultimo1on1: text("ultimo_1on1"),
  status: text("status", { enum: ["pendente", "ativo"] }).notNull().default("pendente"),
  criadoEm: instante("criado_em").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("equipe_membros_email_unico").on(t.equipeId, t.email),
  index("equipe_membros_usuario_idx").on(t.usuarioId),
  index("equipe_membros_email_idx").on(t.email),
  check("equipe_membros_status_valido", sql`${t.status} IN ('pendente', 'ativo')`),
]);

/** Conversa privada do grupo: só o líder e membros que aceitaram o convite têm acesso. */
export const equipeMensagens = pgTable("equipe_mensagens", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipeId: uuid("equipe_id").notNull().references(() => equipes.id, { onDelete: "cascade" }),
  autorId: uuid("autor_id").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  criadoEm: instante("criado_em").notNull().defaultNow(),
}, (t) => [index("equipe_mensagens_equipe_data_idx").on(t.equipeId, t.criadoEm)]);

/* ───────────────────────── Comunidade: áreas da empresa ───────────────────────── */

/**
 * Áreas da empresa (Comercial, Vendas, Marketing, Operários…). Cada uma é um “escudo” na Comunidade,
 * com o fórum e a reunião (Meet/Teams) próprios. Novas áreas e as futuras salas de jogo entram a partir daqui.
 */
export const areas = pgTable(
  "areas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Identificador estável usado nas URLs e nos tópicos (ex.: "vendas"). */
    slug: text("slug").notNull().unique(),
    nome: text("nome").notNull(),
    descricao: text("descricao").notNull().default(""),
    /** Cor do escudo, #rrggbb. */
    cor: text("cor").notNull(),
    ordem: integer("ordem").notNull().default(0),
    reuniaoProvedor: text("reuniao_provedor", { enum: ["meet", "teams"] }),
    reuniaoTitulo: text("reuniao_titulo"),
    /** Link da reunião. Só https: o app abre esse link para o usuário. */
    reuniaoUrl: text("reuniao_url"),
    ativa: boolean("ativa").notNull().default(true),
    criadoEm: instante("criado_em").notNull().defaultNow(),
  },
  (t) => [
    check("areas_cor_hex", sql`${t.cor} ~ '^#[0-9a-fA-F]{6}$'`),
    check("areas_reuniao_https", sql`${t.reuniaoUrl} IS NULL OR ${t.reuniaoUrl} LIKE 'https://%'`),
    index("areas_ordem_idx").on(t.ordem),
  ],
);

/* ───────────────────────── Salas de jogo (perguntas e respostas ao vivo) ───────────────────────── */

/**
 * Sala criada por um admin dentro de uma área. Quem entra usa o código de 6 dígitos (ou o QR code).
 * O andamento não é gravado: sai do relógio. `inicio_em` é quando a 1ª pergunta começa (fim da contagem
 * regressiva); cada pergunta dura `tempo_segundos` e depois mostra a resposta por alguns segundos.
 */
export const salas = pgTable(
  "salas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 6 dígitos, único. */
    codigo: text("codigo").notNull(),
    areaId: uuid("area_id")
      .notNull()
      .references(() => areas.id),
    criadorId: uuid("criador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    titulo: text("titulo").notNull(),
    /** Contagem regressiva configurada pelo admin ao criar a sala. */
    contagemSegundos: integer("contagem_segundos").notNull(),
    inicioEm: instante("inicio_em").notNull(),
    criadoEm: instante("criado_em").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("salas_codigo_unique").on(t.codigo),
    check("salas_codigo_6_digitos", sql`${t.codigo} ~ '^[0-9]{6}$'`),
    check("salas_contagem_faixa", sql`${t.contagemSegundos} BETWEEN 10 AND 900`),
    index("salas_criador_idx").on(t.criadorId, t.criadoEm),
  ],
);

export const salaPerguntas = pgTable(
  "sala_perguntas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    ordem: integer("ordem").notNull(),
    enunciado: text("enunciado").notNull(),
    /** De 2 a 4 alternativas. */
    alternativas: text("alternativas").array().notNull(),
    /** Índice (a partir de 0) da alternativa certa. */
    correta: integer("correta").notNull(),
    tempoSegundos: integer("tempo_segundos").notNull(),
  },
  (t) => [
    uniqueIndex("sala_perguntas_ordem_unique").on(t.salaId, t.ordem),
    check("sala_perguntas_alternativas", sql`cardinality(${t.alternativas}) BETWEEN 2 AND 4`),
    check("sala_perguntas_correta", sql`${t.correta} >= 0 AND ${t.correta} < cardinality(${t.alternativas})`),
    check("sala_perguntas_tempo", sql`${t.tempoSegundos} BETWEEN 5 AND 120`),
  ],
);

export const salaParticipantes = pgTable(
  "sala_participantes",
  {
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    entrouEm: instante("entrou_em").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.salaId, t.usuarioId] })],
);

export const salaRespostas = pgTable(
  "sala_respostas",
  {
    perguntaId: uuid("pergunta_id")
      .notNull()
      .references(() => salaPerguntas.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    alternativa: integer("alternativa").notNull(),
    correta: boolean("correta").notNull(),
    /** Tempo até responder, medido pelo servidor (desempate no ranking). */
    tempoMs: integer("tempo_ms").notNull(),
    criadoEm: instante("criado_em").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.perguntaId, t.usuarioId] }),
    index("sala_respostas_sala_idx").on(t.salaId),
    check("sala_respostas_alternativa", sql`${t.alternativa} BETWEEN 0 AND 3`),
  ],
);
