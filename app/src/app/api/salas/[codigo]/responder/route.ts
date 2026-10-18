import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth/sessao";
import { mensagemDoErro } from "@/lib/cadastro";
import { codigoSchema } from "@/lib/salas/contratos";
import { responder } from "@/lib/salas/repositorio";
import { aplicarLimite, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";
import { tratarSala } from "../../tratar";

const corpoSchema = z.object({ alternativa: z.number({ error: "Escolha uma alternativa." }).int("Alternativa inválida.").min(0, "Alternativa inválida.").max(3, "Alternativa inválida.") }).strict();

/** POST /api/salas/:codigo/responder { alternativa } — uma resposta por pergunta; o tempo é medido aqui no servidor. */
export function POST(req: NextRequest, ctx: RouteContext<"/api/salas/[codigo]/responder">) {
  return tratarSala(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para responder.");
    const codigo = codigoSchema.safeParse((await ctx.params).codigo);
    if (!codigo.success) return respostaErro(400, "Código inválido.");
    const bloqueio = await aplicarLimite(`sala:responder:${sessao.usuarioId}`, 120, 10 * 60);
    if (bloqueio) return bloqueio;

    const corpo = corpoSchema.safeParse(await lerJson(req));
    if (!corpo.success) return respostaErro(400, mensagemDoErro(corpo.error));
    await responder(codigo.data, sessao.usuarioId, corpo.data.alternativa);
    return NextResponse.json({ ok: true });
  });
}
