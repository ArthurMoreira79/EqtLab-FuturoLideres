import { NextResponse, connection, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { ETAPAS, errosPorCampo, mensagemDoErro, salvarEtapaSchema } from "@/lib/cadastro";
import {
  COOKIE_RASCUNHO,
  DURACAO_RASCUNHO_SEG,
  idValido,
  obterRascunho,
  salvarEtapa,
} from "@/lib/auth/rascunho";
import { opcoesCookie } from "@/lib/auth/sessao";
import { emailEmUsoPorConta } from "@/lib/auth/usuarios";
import { aplicarLimite, comTratamento, ipDoCliente, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

/** GET — devolve o progresso salvo deste navegador (para retomar de onde parou). */
export async function GET(req: NextRequest) {
  await connection(); // fora do try: o Next usa a rejeição para abortar a pré-renderização do build
  return comTratamento(async () => {
    const bloqueio = await aplicarLimite(`rascunho:leitura:${ipDoCliente(req)}`, 120, 600);
    if (bloqueio) return bloqueio;

    const id = idValido((await cookies()).get(COOKIE_RASCUNHO)?.value);
    const rascunho = id ? await obterRascunho(id) : null;
    return NextResponse.json({ rascunho: rascunho && { fase: rascunho.fase, dados: rascunho.dados } });
  });
}

/** PUT { etapa, dados } — valida a etapa e grava no banco. */
export function PUT(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const bloqueio = await aplicarLimite(`rascunho:escrita:${ipDoCliente(req)}`, 60, 600);
    if (bloqueio) return bloqueio;

    const corpo = salvarEtapaSchema.safeParse(await lerJson(req));
    if (!corpo.success) return respostaErro(400, "Requisição inválida.");

    const dados = ETAPAS[corpo.data.etapa].safeParse(corpo.data.dados);
    if (!dados.success) {
      return respostaErro(400, mensagemDoErro(dados.error), {
        campos: errosPorCampo(dados.error),
      });
    }

    // Aviso antecipado: melhor descobrir na fase 1 que o e-mail já tem conta do que só no final.
    if ("email" in dados.data && (await emailEmUsoPorConta(dados.data.email))) {
      return respostaErro(409, "Esse e-mail já tem conta. Entre com a sua senha.", {
        codigo: "email_em_uso",
        campos: { email: "Esse e-mail já tem conta." },
      });
    }

    const loja = await cookies();
    const atual = idValido(loja.get(COOKIE_RASCUNHO)?.value);
    const rascunho = await salvarEtapa(atual, corpo.data.etapa, dados.data);
    loja.set(COOKIE_RASCUNHO, rascunho.id, opcoesCookie(DURACAO_RASCUNHO_SEG));
    return NextResponse.json({ fase: rascunho.fase });
  });
}
