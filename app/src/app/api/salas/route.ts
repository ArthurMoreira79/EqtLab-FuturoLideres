import { NextResponse, type NextRequest } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { mensagemDoErro } from "@/lib/cadastro";
import { salaNovaSchema } from "@/lib/salas/contratos";
import { criarSala } from "@/lib/salas/repositorio";
import { aplicarLimite, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";
import { tratarSala } from "./tratar";

/** POST /api/salas — o admin cria a sala (com as perguntas) e recebe o código de 6 dígitos. */
export function POST(req: NextRequest) {
  return tratarSala(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para continuar.");
    const bloqueio = await aplicarLimite(`sala:criar:${sessao.usuarioId}`, 30, 60 * 60);
    if (bloqueio) return bloqueio;

    const corpo = salaNovaSchema.safeParse(await lerJson(req, 64_000));
    if (!corpo.success) return respostaErro(400, mensagemDoErro(corpo.error));
    return NextResponse.json(await criarSala(sessao.usuarioId, corpo.data), { status: 201 });
  });
}
