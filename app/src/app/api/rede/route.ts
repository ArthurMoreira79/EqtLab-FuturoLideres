import { connection, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { obterSessao } from "@/lib/auth/sessao";
import { mensagemDoErro } from "@/lib/cadastro";
import { acaoRedeSchema } from "@/lib/rede/contratos";
import { buscarPessoas, contaRede, detalheGrupo, ErroRede, executarAcao, listarRede } from "@/lib/rede/repositorio";
import { aplicarLimite, comTratamento, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

async function tratar(fn: () => Promise<NextResponse>) {
  return comTratamento(async () => {
    try { return await fn(); } catch (e) {
      if (e instanceof ErroRede) return respostaErro(e.status, e.message);
      throw e;
    }
  });
}
const json = (dados: unknown) => NextResponse.json(dados, { headers: { "Cache-Control": "no-store" } });

export async function GET(req: NextRequest) {
  await connection();
  return tratar(async () => {
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para acessar sua rede.");
    const bloqueio = await aplicarLimite(`rede:leitura:${sessao.usuarioId}`, 180, 60);
    if (bloqueio) return bloqueio;
    const busca = req.nextUrl.searchParams.get("busca");
    if (busca !== null) {
      if (busca.length > 254) return respostaErro(400, "Busca muito longa.");
      return json({ pessoas: await buscarPessoas(sessao.usuarioId, busca.trim()) });
    }
    const conta = await contaRede(sessao.usuarioId);
    const equipeId = req.nextUrl.searchParams.get("equipe");
    if (equipeId) {
      if (!z.uuid().safeParse(equipeId).success) return respostaErro(400, "Grupo inválido.");
      return json(await detalheGrupo(equipeId, conta));
    }
    return json(await listarRede(conta));
  });
}

export async function POST(req: NextRequest) {
  return tratar(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para acessar sua rede.");
    const bloqueio = await aplicarLimite(`rede:escrita:${sessao.usuarioId}`, 60, 60);
    if (bloqueio) return bloqueio;
    const acao = acaoRedeSchema.safeParse(await lerJson(req));
    if (!acao.success) return respostaErro(400, mensagemDoErro(acao.error));
    return json(await executarAcao(await contaRede(sessao.usuarioId), acao.data));
  });
}
