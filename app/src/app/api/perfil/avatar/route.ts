import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { avatarSchema } from "@/lib/avatar";
import { mensagemDoErro } from "@/lib/cadastro";
import { obterSessao } from "@/lib/auth/sessao";
import { salvarAvatar } from "@/lib/auth/usuarios";
import { aplicarLimite, comTratamento, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

const corpoSchema = z.object({ avatar: avatarSchema }).strict();

/** PUT { avatar } — salva o emblema de quem está logado (valida cada peça no servidor). */
export function PUT(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para continuar.");

    const bloqueio = await aplicarLimite(`avatar:${sessao.usuarioId}`, 60, 60 * 60);
    if (bloqueio) return bloqueio;

    const corpo = corpoSchema.safeParse(await lerJson(req));
    if (!corpo.success) return respostaErro(400, mensagemDoErro(corpo.error));

    await salvarAvatar(sessao.usuarioId, corpo.data.avatar);
    return NextResponse.json({ ok: true });
  });
}
