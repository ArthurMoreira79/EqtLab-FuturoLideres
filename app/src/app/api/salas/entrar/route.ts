import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth/sessao";
import { mensagemDoErro } from "@/lib/cadastro";
import { codigoSchema } from "@/lib/salas/contratos";
import { entrarNaSala } from "@/lib/salas/repositorio";
import { aplicarLimite, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";
import { tratarSala } from "../tratar";

const corpoSchema = z.object({ codigo: codigoSchema }).strict();

/** POST /api/salas/entrar { codigo } — entra na sala pelo código (ou pelo QR code, que leva ao mesmo lugar). */
export function POST(req: NextRequest) {
  return tratarSala(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para entrar na sala.");
    // Código de 6 dígitos é curto: limita as tentativas para ninguém sair “adivinhando” salas.
    const bloqueio = await aplicarLimite(`sala:entrar:${sessao.usuarioId}`, 30, 10 * 60);
    if (bloqueio) return bloqueio;

    const corpo = corpoSchema.safeParse(await lerJson(req));
    if (!corpo.success) return respostaErro(400, mensagemDoErro(corpo.error));
    return NextResponse.json(await entrarNaSala(corpo.data.codigo, sessao.usuarioId));
  });
}
