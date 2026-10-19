import { NextResponse, connection, type NextRequest } from "next/server";
import { mensagemDoErro } from "@/lib/cadastro";
import { obterSessao } from "@/lib/auth/sessao";
import { calcularDiagnostico } from "@/lib/conteudo/diagnostico";
import { ordenarTrilha } from "@/lib/competencias";
import { corpoDiagnosticoSchema } from "@/lib/diagnostico";
import { salvarDiagnostico, ultimoDiagnostico } from "@/lib/diagnostico/repositorio";
import { aplicarLimite, comTratamento, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

/** GET — o diagnóstico mais recente de quem está logado (diagnostico: null se ainda não fez). */
export async function GET() {
  await connection(); // fora do try: o Next usa a rejeição para abortar a pré-renderização do build
  return comTratamento(async () => {
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para continuar.");
    return NextResponse.json({ diagnostico: await ultimoDiagnostico(sessao.usuarioId) });
  });
}

/** POST { respostas: { b1: 2, b2: 0, ... } } — o servidor calcula as notas e a ordem da trilha e grava tudo. */
export function POST(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para continuar.");

    const bloqueio = await aplicarLimite(`diagnostico:${sessao.usuarioId}`, 20, 60 * 60);
    if (bloqueio) return bloqueio;

    const corpo = corpoDiagnosticoSchema.safeParse(await lerJson(req));
    if (!corpo.success) return respostaErro(400, mensagemDoErro(corpo.error));

    // As notas nunca vêm do navegador: só as alternativas marcadas.
    const pontuacoes = calcularDiagnostico(corpo.data.respostas);
    const diagnostico = await salvarDiagnostico(sessao.usuarioId, corpo.data.respostas, pontuacoes, ordenarTrilha(pontuacoes));
    return NextResponse.json({ diagnostico }, { status: 201 });
  });
}
