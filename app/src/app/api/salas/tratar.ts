import type { NextResponse } from "next/server";
import { ErroSala } from "@/lib/salas/repositorio";
import { comTratamento, respostaErro } from "@/lib/seguranca/http";

/** Erros esperados da sala (código errado, sala já começou…) viram resposta amigável; o resto cai no tratamento comum. */
export function tratarSala(fn: () => Promise<NextResponse>) {
  return comTratamento(async () => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ErroSala) return respostaErro(e.status, e.message);
      throw e;
    }
  });
}
