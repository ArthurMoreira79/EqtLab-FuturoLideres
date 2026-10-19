import { NextResponse, type NextRequest } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { pedidoChatSchema, respostaChatSchema } from "@/lib/clara/chat";
import { obterProvedorChat } from "@/lib/clara/provedor";
import { ErroProvedorIA } from "@/lib/ia/compativel-openai";
import { aplicarLimite, comTratamento, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

export async function POST(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const sessao = await obterSessao();
    if (!sessao) return respostaErro(401, "Faça login para conversar com a Clara.");
    const bloqueio = await aplicarLimite(`clara:chat:${sessao.usuarioId}`, 30, 60);
    if (bloqueio) return bloqueio;
    const pedido = pedidoChatSchema.safeParse(await lerJson(req));
    if (!pedido.success) return respostaErro(400, "Envie uma pergunta de até 800 caracteres.");
    const provedor = await obterProvedorChat();
    let resposta;
    try {
      resposta = await provedor.conversar(pedido.data);
    } catch (e) {
      if (e instanceof ErroProvedorIA) {
        if (e.status === 429) return respostaErro(429, "A cota de uso da IA foi atingida. Aguarde e tente novamente; nenhuma cobrança foi ativada pelo aplicativo.");
        if (e.status === 401 || e.status === 403) return respostaErro(503, "A chave da IA está inválida ou sem acesso. Confira a configuração no servidor.");
        if (e.status === 503) return respostaErro(503, "A IA está com muita procura agora. Tente novamente em instantes.");
        return respostaErro(502, "O serviço de IA está indisponível agora. Tente novamente em instantes.");
      }
      if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return respostaErro(504, "A IA demorou para responder. Tente novamente.");
      throw e;
    }
    const resultado = respostaChatSchema.safeParse(resposta);
    if (!resultado.success) return respostaErro(502, "A Clara não conseguiu responder agora. Tente novamente.");
    return NextResponse.json({ ...resultado.data, modo: provedor.nome === "simulado" ? "guiado" : "ia" });
  });
}

/** Expõe somente o modo; nunca configuração, chave ou dados da conta. */
export async function GET() {
  return comTratamento(async () => {
    if (!await obterSessao()) return respostaErro(401, "Faça login para conversar com a Clara.");
    const provedor = await obterProvedorChat();
    return NextResponse.json({ modo: provedor.nome === "simulado" ? "guiado" : "ia" }, { headers: { "Cache-Control": "no-store" } });
  });
}
