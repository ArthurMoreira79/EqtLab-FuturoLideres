import { z } from "zod";
import type { AvatarConfig } from "@/lib/avatar";

export interface PessoaRede { id: string; nome: string; email: string; cargo: string; avatar: AvatarConfig | null }
export interface MembroRede {
  id: string; usuarioId: string | null; nome: string; email: string; funcao: string;
  avatar: AvatarConfig | null; status: "pendente" | "ativo"; ultimo1on1: string | null;
}
export interface GrupoRede { id: string; nome: string; donoId: string; lider: PessoaRede }
export interface ResumoRede { minhaEquipe: GrupoRede | null; grupos: GrupoRede[]; convites: GrupoRede[] }
export interface MensagemRede { id: string; autor: PessoaRede; texto: string; criadoEm: string }
export interface DetalheRede extends GrupoRede { membros: MembroRede[]; mensagens: MensagemRede[] }

const id = z.uuid();
const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Informe um e-mail válido."));
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Informe uma data válida.");
export const acaoRedeSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("criar-equipe"), nome: z.string().trim().min(2).max(100) }).strict(),
  z.object({ acao: z.literal("adicionar-membro"), email, nome: z.string().trim().max(80).optional(), funcao: z.string().trim().max(80).default(""), ultimo1on1: data.nullable().optional() }).strict(),
  z.object({ acao: z.literal("remover-membro"), equipeId: id, membroId: id }).strict(),
  z.object({ acao: z.literal("atualizar-membro"), equipeId: id, membroId: id, funcao: z.string().trim().max(80), ultimo1on1: data.nullable() }).strict(),
  z.object({ acao: z.literal("aceitar-convite"), equipeId: id }).strict(),
  z.object({ acao: z.literal("recusar-convite"), equipeId: id }).strict(),
  z.object({ acao: z.literal("enviar-mensagem"), equipeId: id, texto: z.string().trim().min(1).max(2000) }).strict(),
]);
export type AcaoRede = z.infer<typeof acaoRedeSchema>;
