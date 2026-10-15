import { NextResponse, type NextRequest } from "next/server";
import { obterDesafio } from "@/lib/conteudo/desafios";
import { obterProvedor } from "@/lib/ia/provedor";
import { avaliacaoSchema, pedidoAvaliacaoSchema } from "@/lib/ia/schema";

/** POST /api/avaliar — avalia a resposta de uma missão, desafio de módulo ou diagnóstico. */
export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null);
  const pedido = pedidoAvaliacaoSchema.safeParse(corpo);
  if (!pedido.success) {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  const desafio = obterDesafio(pedido.data.desafioId);
  if (!desafio) {
    return NextResponse.json({ erro: "Desafio não encontrado." }, { status: 404 });
  }

  try {
    const provedor = await obterProvedor();
    const bruto = await provedor.avaliar({ desafio, ...pedido.data });
    const resultado = avaliacaoSchema.safeParse(bruto);
    if (!resultado.success) {
      console.error("[avaliar] resposta fora do formato", provedor.nome, resultado.error.issues);
      return NextResponse.json(
        { erro: "A análise voltou num formato inesperado. Tente novamente." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ...resultado.data, provedor: provedor.nome });
  } catch (erro) {
    console.error("[avaliar]", erro);
    return NextResponse.json(
      { erro: "Não conseguimos analisar sua resposta agora. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
