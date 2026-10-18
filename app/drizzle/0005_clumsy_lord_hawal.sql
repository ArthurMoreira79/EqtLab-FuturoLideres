CREATE TABLE "sala_participantes" (
	"sala_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"entrou_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sala_participantes_sala_id_usuario_id_pk" PRIMARY KEY("sala_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE "sala_perguntas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sala_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"enunciado" text NOT NULL,
	"alternativas" text[] NOT NULL,
	"correta" integer NOT NULL,
	"tempo_segundos" integer NOT NULL,
	CONSTRAINT "sala_perguntas_alternativas" CHECK (cardinality("sala_perguntas"."alternativas") BETWEEN 2 AND 4),
	CONSTRAINT "sala_perguntas_correta" CHECK ("sala_perguntas"."correta" >= 0 AND "sala_perguntas"."correta" < cardinality("sala_perguntas"."alternativas")),
	CONSTRAINT "sala_perguntas_tempo" CHECK ("sala_perguntas"."tempo_segundos" BETWEEN 5 AND 120)
);
--> statement-breakpoint
CREATE TABLE "sala_respostas" (
	"pergunta_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"sala_id" uuid NOT NULL,
	"alternativa" integer NOT NULL,
	"correta" boolean NOT NULL,
	"tempo_ms" integer NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sala_respostas_pergunta_id_usuario_id_pk" PRIMARY KEY("pergunta_id","usuario_id"),
	CONSTRAINT "sala_respostas_alternativa" CHECK ("sala_respostas"."alternativa" BETWEEN 0 AND 3)
);
--> statement-breakpoint
CREATE TABLE "salas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"area_id" uuid NOT NULL,
	"criador_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"contagem_segundos" integer NOT NULL,
	"inicio_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "salas_codigo_6_digitos" CHECK ("salas"."codigo" ~ '^[0-9]{6}$'),
	CONSTRAINT "salas_contagem_faixa" CHECK ("salas"."contagem_segundos" BETWEEN 10 AND 900)
);
--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "papel" text DEFAULT 'membro' NOT NULL;--> statement-breakpoint
ALTER TABLE "sala_participantes" ADD CONSTRAINT "sala_participantes_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala_participantes" ADD CONSTRAINT "sala_participantes_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala_perguntas" ADD CONSTRAINT "sala_perguntas_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala_respostas" ADD CONSTRAINT "sala_respostas_pergunta_id_sala_perguntas_id_fk" FOREIGN KEY ("pergunta_id") REFERENCES "public"."sala_perguntas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala_respostas" ADD CONSTRAINT "sala_respostas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sala_respostas" ADD CONSTRAINT "sala_respostas_sala_id_salas_id_fk" FOREIGN KEY ("sala_id") REFERENCES "public"."salas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "salas_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salas" ADD CONSTRAINT "salas_criador_id_usuarios_id_fk" FOREIGN KEY ("criador_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sala_perguntas_ordem_unique" ON "sala_perguntas" USING btree ("sala_id","ordem");--> statement-breakpoint
CREATE INDEX "sala_respostas_sala_idx" ON "sala_respostas" USING btree ("sala_id");--> statement-breakpoint
CREATE UNIQUE INDEX "salas_codigo_unique" ON "salas" USING btree ("codigo");--> statement-breakpoint
CREATE INDEX "salas_criador_idx" ON "salas" USING btree ("criador_id","criado_em");--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_papel_valido" CHECK ("usuarios"."papel" IN ('membro', 'admin'));