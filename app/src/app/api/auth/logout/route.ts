import { NextResponse, type NextRequest } from "next/server";
import { encerrarSessao } from "@/lib/auth/sessao";
import { comTratamento, origemValida, respostaErro } from "@/lib/seguranca/http";

/** POST /api/auth/logout — revoga a sessão no banco e apaga o cookie. */
export function POST(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    await encerrarSessao();
    return NextResponse.json({ ok: true });
  });
}
