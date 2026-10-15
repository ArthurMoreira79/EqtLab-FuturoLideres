import { NextResponse, type NextRequest } from "next/server";
import { obterProvedor } from "@/lib/ia/provedor";
import { pedidoRelatorioSchema, relatorioSchema } from "@/lib/ia/schema";

/** POST /api/relatorio — gera o relatório "Seu momento como líder". */
export async function POST(request: NextRequest) {
  const pedido = pedidoRelatorioSchema.safeParse(await request.json().catch(() => null));
  if (!pedido.success) {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }
  try {
    const provedor = await obterProvedor();
    const resultado = relatorioSchema.safeParse(await provedor.gerarRelatorio(pedido.data));
    if (!resultado.success) {
      return NextResponse.json({ erro: "O relatório voltou num formato inesperado." }, { status: 502 });
    }
    return NextResponse.json({ ...resultado.data, provedor: provedor.nome });
  } catch (erro) {
    console.error("[relatorio]", erro);
    return NextResponse.json({ erro: "Não foi possível gerar o relatório agora." }, { status: 502 });
  }
}
