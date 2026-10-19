import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { publico } from "@/lib/conteudo/desafios";
import { competenciaSlug } from "@/lib/ia/schema";
import { sortearMissao } from "@/lib/missao/sorteio";
import type { Pontuacoes } from "@/lib/types";

const pedidoSchema = z.object({
  pontuacoes: z.record(competenciaSlug, z.number().min(0).max(5)),
  recentes: z.array(z.string().max(80)).max(30).default([]),
  excluir: z.string().max(80).optional(),
});

/** POST /api/missao-do-dia — sorteia a missão com aleatoriedade ponderada. */
export async function POST(request: NextRequest) {
  const pedido = pedidoSchema.safeParse(await request.json().catch(() => null));
  if (!pedido.success) {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  const { pontuacoes, recentes, excluir } = pedido.data;
  const desafio = sortearMissao(pontuacoes as Pontuacoes, recentes, excluir);
  return NextResponse.json(publico(desafio));
}
