import { z } from "zod";
import type { AvatarConfig } from "@/lib/avatar";

/**
 * Regras do cadastro e do login. Este arquivo é usado pelo navegador (mensagens ao digitar)
 * e pelo servidor (validação de verdade) — por isso não importa nada de "server-only".
 */

export const TIPOS_EQUIPE = ["Técnica", "Operacional", "Comercial", "Administrativa", "Atendimento", "Mista"] as const;
export const MODELOS = ["Presencial", "Híbrido", "Remoto"] as const;
export const DESAFIOS = [
  "Dar feedback",
  "Lidar com conflitos",
  "Liderar ex-colegas",
  "Delegar",
  "Priorizar demandas",
  "Manter a equipe motivada",
  "Bater metas",
  "Controlar a ansiedade",
] as const;

const texto = (quem: string) =>
  z
    .string({ error: `Informe ${quem}.` })
    .trim()
    .min(2, `Informe ${quem}.`)
    .max(80, "Use no máximo 80 caracteres.");

export const emailSchema = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .max(254, "Esse e-mail é longo demais.")
  .pipe(z.email("Informe um e-mail válido."));

/** Regras de uma senha nova (cadastro). No login só exigimos que não esteja vazia. */
export const senhaNovaSchema = z
  .string({ error: "Crie uma senha." })
  .min(8, "Use pelo menos 8 caracteres.")
  .max(128, "Use no máximo 128 caracteres.")
  .regex(/[A-Za-z]/, "Inclua pelo menos uma letra.")
  .regex(/\d/, "Inclua pelo menos um número.");

export const loginSchema = z
  .object({
    email: emailSchema,
    senha: z.string({ error: "Informe a senha." }).min(1, "Informe a senha.").max(128, "Senha inválida."),
  })
  .strict();

/* ---- Etapas do cadastro (cada uma é salva no banco ao avançar) ---- */

export const etapa0 = z
  .object({ nome: texto("o seu nome"), email: emailSchema, cargo: texto("o seu cargo"), setor: texto("o seu setor") })
  .strict();

export const etapa1 = z
  .object({
    mesesLideranca: z.number({ error: "Informe há quanto tempo lidera." }).int().min(0).max(240),
    tamanhoEquipe: z.number({ error: "Informe o tamanho da equipe." }).int().min(1).max(200),
    tipoEquipe: z.enum(TIPOS_EQUIPE, { error: "Escolha o tipo de equipe." }),
    modeloTrabalho: z.enum(MODELOS, { error: "Escolha o modelo de trabalho." }),
  })
  .strict();

export const etapa2 = z
  .object({
    desafios: z
      .array(z.enum(DESAFIOS))
      .max(DESAFIOS.length)
      .refine((l) => new Set(l).size === l.length, "Desafios repetidos."),
  })
  .strict();

export const ETAPAS = [etapa0, etapa1, etapa2] as const;

export const cadastroCompletoSchema = z.object({ ...etapa0.shape, ...etapa1.shape, ...etapa2.shape }).strict();

export type DadosCadastro = z.infer<typeof cadastroCompletoSchema>;

/** Corpo do PUT /api/cadastro/rascunho: qual etapa está sendo salva e os dados dela. */
export const salvarEtapaSchema = z
  .object({ etapa: z.number().int().min(0).max(ETAPAS.length - 1), dados: z.unknown() })
  .strict();

/** Mensagem amigável para o usuário; corpo malformado ou com chaves desconhecidas vira um erro genérico (sem jargão do Zod). */
export function mensagemDoErro(erro: z.ZodError): string {
  const corpoMalFormado = erro.issues.some(
    (i) => i.code === "unrecognized_keys" || (i.code === "invalid_type" && i.path.length === 0),
  );
  if (corpoMalFormado) return "Requisição inválida.";
  // Valor fora de uma lista fechada (ex.: peça de avatar que não existe): sem despejar a lista em inglês.
  if (erro.issues.some((i) => i.code === "invalid_value")) return "Uma das opções escolhidas não existe.";
  return erro.issues[0]?.message ?? "Dados inválidos.";
}

/** Primeira mensagem de erro por campo — usada para marcar os inputs. */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const saida: Record<string, string> = {};
  for (const i of erro.issues) {
    if (i.code === "unrecognized_keys") continue;
    saida[String(i.path[0] ?? "_")] ??= i.message;
  }
  return saida;
}

/** Usuário como o navegador enxerga (nunca inclui hash de senha). */
export interface UsuarioPublico extends DadosCadastro {
  id: string;
  /** Quando a conta foi criada (ISO 8601). */
  criadoEm: string;
  /** Emblema do perfil; null enquanto a pessoa não criou o dela. */
  avatar: AvatarConfig | null;
  /** "admin" pode criar salas de jogo na Comunidade. */
  papel: "membro" | "admin";
}
