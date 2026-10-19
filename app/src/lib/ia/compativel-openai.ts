import "server-only";
import { contextoClara, protegerMensagens } from "@/lib/clara/contexto";
import type { ProvedorIA } from "./provedor";
import { promptAvaliacao, promptRelatorio, SISTEMA_AVALIACAO, SISTEMA_RELATORIO } from "./prompts";

/**
 * Provedor para qualquer API no formato "chat completions" da OpenAI
 * (OpenAI, Azure OpenAI, OpenRouter, Groq, Ollama, LM Studio e vários outros).
 *
 * Variáveis: IA_BASE_URL (ex.: https://api.openai.com/v1), IA_API_KEY, IA_MODELO.
 */
export function provedorCompativelOpenAI(config?: { baseUrl: string; modelo: string; chave: string }): ProvedorIA {
  const baseUrl = (config?.baseUrl ?? process.env.IA_BASE_URL)?.replace(/\/$/, "");
  const modelo = config?.modelo ?? process.env.IA_MODELO;
  const chave = config?.chave ?? process.env.IA_API_KEY;
  if (!baseUrl || !modelo) {
    throw new Error("Configure IA_BASE_URL e IA_MODELO para usar o provedor compativel-openai.");
  }

  async function chamar(sistema: string, usuario: string): Promise<unknown> {
    const resposta = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(chave ? { Authorization: `Bearer ${chave}` } : {}),
      },
      body: JSON.stringify({
        model: modelo,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: usuario },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resposta.ok) {
      throw new ErroProvedorIA(resposta.status);
    }
    const dados = await resposta.json();
    const texto: string = dados?.choices?.[0]?.message?.content ?? "";
    // Alguns modelos ainda envolvem o JSON em ```json ... ```
    return JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, ""));
  }

  return {
    nome: `compativel-openai:${modelo}`,
    conversar: (pedido) => {
      return chamar(contextoClara(pedido.moduloId), JSON.stringify(protegerMensagens(pedido.mensagens)));
    },
    avaliar: (e) => chamar(SISTEMA_AVALIACAO, promptAvaliacao(e)),
    gerarRelatorio: (p) => chamar(SISTEMA_RELATORIO, promptRelatorio(p)),
  };
}

/** Não carrega corpo da resposta externa nem credenciais para logs ou mensagens. */
export class ErroProvedorIA extends Error {
  constructor(public readonly status: number) {
    super(`Provedor de IA respondeu ${status}`);
  }
}
