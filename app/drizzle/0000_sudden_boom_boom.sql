-- Migração inicial (baseline) — IDEMPOTENTE de propósito.
-- Antes do Drizzle, 4 destas tabelas (usuarios, cadastros_rascunho, sessoes, limites_taxa) eram criadas por um DDL manual.
-- Com IF NOT EXISTS, bancos antigos são adotados sem perder dados e bancos novos são criados do zero.
-- Migrações seguintes (0001+) são geradas normalmente por `pnpm db:generate` e NÃO precisam disso.

CREATE TABLE IF NOT EXISTS "cadastros_rascunho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dados" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fase" integer DEFAULT 0 NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone DEFAULT now() + interval '7 days' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnostico_respostas" (
	"diagnostico_id" uuid NOT NULL,
	"cenario_id" text NOT NULL,
	"opcao" integer NOT NULL,
	CONSTRAINT "diagnostico_respostas_diagnostico_id_cenario_id_pk" PRIMARY KEY("diagnostico_id","cenario_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnosticos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" text DEFAULT 'inicial' NOT NULL,
	"trilha" text[] NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "limites_taxa" (
	"chave" text PRIMARY KEY NOT NULL,
	"contagem" integer NOT NULL,
	"janela_inicio" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pontuacoes_competencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"diagnostico_id" uuid,
	"competencia" text NOT NULL,
	"nota" real NOT NULL,
	"origem" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"criada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"revogada_em" timestamp with time zone,
	"ip" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"cargo" text NOT NULL,
	"setor" text NOT NULL,
	"tipo_equipe" text NOT NULL,
	"tamanho_equipe" integer NOT NULL,
	"meses_lideranca" integer NOT NULL,
	"modelo_trabalho" text NOT NULL,
	"desafios" text[] DEFAULT '{}' NOT NULL,
	"senha_hash" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_login_em" timestamp with time zone,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "diagnostico_respostas" ADD CONSTRAINT "diagnostico_respostas_diagnostico_id_diagnosticos_id_fk" FOREIGN KEY ("diagnostico_id") REFERENCES "public"."diagnosticos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "diagnosticos" ADD CONSTRAINT "diagnosticos_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pontuacoes_competencia" ADD CONSTRAINT "pontuacoes_competencia_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "pontuacoes_competencia" ADD CONSTRAINT "pontuacoes_competencia_diagnostico_id_diagnosticos_id_fk" FOREIGN KEY ("diagnostico_id") REFERENCES "public"."diagnosticos"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diagnosticos_usuario_idx" ON "diagnosticos" USING btree ("usuario_id","criado_em");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pontuacoes_usuario_competencia_idx" ON "pontuacoes_competencia" USING btree ("usuario_id","competencia","criado_em");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessoes_usuario_idx" ON "sessoes" USING btree ("usuario_id");