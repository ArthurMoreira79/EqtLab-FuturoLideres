import { NextResponse, type NextRequest } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { codigoSchema } from "@/lib/salas/contratos";
import { iniciarAgora } from "@/lib/salas/repositorio";
import { origemValida, respostaErro } from "@/lib/seguranca/http";
import { tratarSala } from "../../tratar";

/** POST /api/salas/:codigo/iniciar — o anfitrião não espera o fim da contagem: começa em 3 segundos. */
export function POST(req: NextRequest, ctx: RouteContext<"/api/salas/[codigo]/iniciar">) {
  return tratarSala(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para continuar.");
    const codigo = codigoSchema.safeParse((await ctx.params).codigo);
    if (!codigo.success) return respostaErro(400, "Código inválido.");
    await iniciarAgora(codigo.data, sessao.usuarioId);
    return NextResponse.json({ ok: true });
  });
}
