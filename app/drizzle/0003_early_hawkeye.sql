CREATE TABLE "equipe_membros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"usuario_id" uuid,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"funcao" text DEFAULT '' NOT NULL,
	"ultimo_1on1" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipe_membros_status_valido" CHECK ("equipe_membros"."status" IN ('pendente', 'ativo'))
);
--> statement-breakpoint
CREATE TABLE "equipe_mensagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipe_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dono_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "equipes_dono_id_unique" UNIQUE("dono_id")
);
--> statement-breakpoint
ALTER TABLE "equipe_membros" ADD CONSTRAINT "equipe_membros_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_membros" ADD CONSTRAINT "equipe_membros_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_mensagens" ADD CONSTRAINT "equipe_mensagens_equipe_id_equipes_id_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipe_mensagens" ADD CONSTRAINT "equipe_mensagens_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipes" ADD CONSTRAINT "equipes_dono_id_usuarios_id_fk" FOREIGN KEY ("dono_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equipe_membros_email_unico" ON "equipe_membros" USING btree ("equipe_id","email");--> statement-breakpoint
CREATE INDEX "equipe_membros_usuario_idx" ON "equipe_membros" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "equipe_membros_email_idx" ON "equipe_membros" USING btree ("email");--> statement-breakpoint
CREATE INDEX "equipe_mensagens_equipe_data_idx" ON "equipe_mensagens" USING btree ("equipe_id","criado_em");