import { NextResponse, connection } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { buscarPorId } from "@/lib/auth/usuarios";
import { comTratamento, respostaErro } from "@/lib/seguranca/http";

/** GET /api/auth/eu — quem está logado (401 se ninguém). */
export async function GET() {
  await connection(); // fora do try: o Next usa a rejeição para abortar a pré-renderização do build
  return comTratamento(async () => {
    const sessao = await obterSessao();
    const usuario = sessao ? await buscarPorId(sessao.usuarioId) : null;
    if (!usuario) return respostaErro(401, "Faça login para continuar.");
    return NextResponse.json({ usuario });
  });
}
