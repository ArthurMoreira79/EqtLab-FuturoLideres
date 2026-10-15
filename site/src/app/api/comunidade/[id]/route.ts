import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { z } from "zod";
import {
  marcarMelhor,
  marcarUtil,
  obterPost,
  responder,
  verificarDadosPessoais,
} from "@/lib/comunidade/repositorio";

/** GET /api/comunidade/:id */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/comunidade/[id]">) {
  await connection();
  const post = obterPost((await ctx.params).id);
  return post
    ? NextResponse.json(post)
    : NextResponse.json({ erro: "Tópico não encontrado." }, { status: 404 });
}

const acaoSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("responder"), autor: z.string().trim().max(80), corpo: z.string().trim().min(5).max(3000) }),
  z.object({ acao: z.literal("util"), respostaId: z.string().max(80) }),
  z.object({ acao: z.literal("melhor"), respostaId: z.string().max(80) }),
]);

/** POST /api/comunidade/:id — responder, marcar como útil ou como melhor resposta. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/comunidade/[id]">) {
  const { id } = await ctx.params;
  const dados = acaoSchema.safeParse(await request.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json({ erro: "Escreva uma resposta com pelo menos 5 caracteres." }, { status: 400 });
  }
  const d = dados.data;
  if (d.acao === "responder") {
    const alerta = verificarDadosPessoais(d.corpo);
    if (alerta) return NextResponse.json({ erro: `${alerta} Remova dados pessoais antes de publicar.` }, { status: 422 });
    if (!responder(id, { autor: d.autor || "Líder", corpo: d.corpo })) {
      return NextResponse.json({ erro: "Tópico não encontrado." }, { status: 404 });
    }
  } else if (d.acao === "util") {
    if (!marcarUtil(id, d.respostaId)) return NextResponse.json({ erro: "Resposta não encontrada." }, { status: 404 });
  } else if (!marcarMelhor(id, d.respostaId)) {
    return NextResponse.json({ erro: "Resposta não encontrada." }, { status: 404 });
  }
  return NextResponse.json(obterPost(id));
}
