CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"cor" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	"reuniao_provedor" text,
	"reuniao_titulo" text,
	"reuniao_url" text,
	"ativa" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug"),
	CONSTRAINT "areas_cor_hex" CHECK ("areas"."cor" ~ '^#[0-9a-fA-F]{6}$'),
	CONSTRAINT "areas_reuniao_https" CHECK ("areas"."reuniao_url" IS NULL OR "areas"."reuniao_url" LIKE 'https://%')
);
--> statement-breakpoint
CREATE INDEX "areas_ordem_idx" ON "areas" USING btree ("ordem");
--> statement-breakpoint
-- Semente das 4 áreas (idempotente). Troque os links de reunião pelos reais, ex.:
--   UPDATE "areas" SET "reuniao_url" = 'https://meet.google.com/abc-defg-hij' WHERE "slug" = 'comercial';
INSERT INTO "areas" ("slug", "nome", "descricao", "cor", "ordem", "reuniao_provedor", "reuniao_titulo", "reuniao_url") VALUES
	('comercial', 'Comercial', 'Relacionamento com clientes e parcerias.', '#1b8fe6', 1, 'meet', 'Daily do Comercial', 'https://meet.google.com/new'),
	('vendas', 'Vendas', 'Metas, funil e negociação.', '#16a34a', 2, 'teams', 'Reunião de Vendas', 'https://teams.microsoft.com/'),
	('marketing', 'Marketing', 'Marca, campanhas e comunicação.', '#c026d3', 3, 'meet', 'Alinhamento de Marketing', 'https://meet.google.com/new'),
	('operarios', 'Operários', 'Campo, manutenção e operações.', '#ea580c', 4, 'teams', 'Passagem de turno', 'https://teams.microsoft.com/')
ON CONFLICT ("slug") DO NOTHING;
