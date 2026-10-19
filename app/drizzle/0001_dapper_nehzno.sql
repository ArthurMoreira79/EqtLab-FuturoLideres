ALTER TABLE "diagnostico_respostas" ADD COLUMN "cenario_texto" text;--> statement-breakpoint
ALTER TABLE "diagnostico_respostas" ADD COLUMN "opcao_texto" text;--> statement-breakpoint
ALTER TABLE "diagnosticos" ADD COLUMN "versao_conteudo" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "pontuacoes_diagnostico_competencia_idx" ON "pontuacoes_competencia" USING btree ("diagnostico_id","competencia");--> statement-breakpoint
ALTER TABLE "diagnostico_respostas" ADD CONSTRAINT "diagnostico_opcao_nao_negativa" CHECK ("diagnostico_respostas"."opcao" >= 0);--> statement-breakpoint
ALTER TABLE "pontuacoes_competencia" ADD CONSTRAINT "pontuacoes_nota_intervalo" CHECK ("pontuacoes_competencia"."nota" >= 0 AND "pontuacoes_competencia"."nota" <= 5);