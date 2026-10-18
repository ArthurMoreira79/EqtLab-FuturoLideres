import { NextResponse, type NextRequest } from "next/server";
import { connection } from "next/server";
import { obterDesafio, publico } from "@/lib/conteudo/desafios";

/** GET /api/desafios/:id — versão pública do desafio (sem rubrica nem exemplo). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/desafios/[id]">) {
  await connection();
  const { id } = await ctx.params;
  const desafio = obterDesafio(id);
  if (!desafio) {
    return NextResponse.json({ erro: "Desafio não encontrado." }, { status: 404 });
  }
  return NextResponse.json(publico(desafio));
}
