import { connection, NextResponse, type NextRequest } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { codigoSchema } from "@/lib/salas/contratos";
import { estadoDaSala } from "@/lib/salas/repositorio";
import { respostaErro } from "@/lib/seguranca/http";
import { tratarSala } from "../tratar";

/** GET /api/salas/:codigo — estado da sala (fase, pergunta, participantes, placar). A tela consulta a cada segundo. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/salas/[codigo]">) {
  await connection();
  return tratarSala(async () => {
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para entrar na sala.");
    const codigo = codigoSchema.safeParse((await ctx.params).codigo);
    if (!codigo.success) return respostaErro(400, "Código inválido.");
    return NextResponse.json(await estadoDaSala(codigo.data, sessao.usuarioId), { headers: { "Cache-Control": "no-store" } });
  });
}
