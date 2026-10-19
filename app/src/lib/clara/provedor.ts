import "server-only";
import { obterProvedor, type ProvedorIA } from "@/lib/ia/provedor";
import { ErroProvedorIA, provedorCompativelOpenAI } from "@/lib/ia/compativel-openai";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const MODELO_PADRAO = "gemini-3.8-flash";
/** Se o modelo configurado estiver sobrecarregado (503) ou indisponível (404), o chat tenta estes, nesta ordem. */
const ALTERNATIVOS = ["gemini-3-flash-preview", "gemini-3.5-flash-lite"];
const LEMBRAR_MS = 5 * 60_000;

// Guarda o último modelo que respondeu, para não pagar uma tentativa falha a cada mensagem.
let preferido: { modelo: string; ate: number } | null = null;

/** A chave do chat não altera o provedor de avaliação e relatórios. */
export async function obterProvedorChat(): Promise<ProvedorIA> {
  const chave = process.env.GEMINI_API_KEY?.trim();
  if (!chave) return obterProvedor();
  const configurado = process.env.GEMINI_CHAT_MODEL?.trim() || MODELO_PADRAO;
  const modelos = [...new Set([configurado, ...ALTERNATIVOS])];
  const doModelo = (modelo: string) => provedorCompativelOpenAI({ baseUrl: BASE_URL, modelo, chave });

  const base = doModelo(configurado);
  return {
    ...base,
    async conversar(pedido) {
      const lembrado = preferido && preferido.ate > Date.now() ? preferido.modelo : null;
      const ordem = lembrado ? [lembrado, ...modelos.filter((m) => m !== lembrado)] : modelos;
      let ultimoErro: unknown;
      for (const modelo of ordem) {
        try {
          const resposta = await doModelo(modelo).conversar(pedido);
          preferido = { modelo, ate: Date.now() + LEMBRAR_MS };
          return resposta;
        } catch (e) {
          ultimoErro = e;
          // Só troca de modelo quando o problema é do modelo (demanda alta, fora do ar, não existe).
          // Chave inválida (401/403) e cota esgotada (429) não melhoram trocando de modelo.
          const doModeloProblema = e instanceof ErroProvedorIA && [404, 500, 502, 503].includes(e.status);
          if (!doModeloProblema) throw e;
          if (modelo === preferido?.modelo) preferido = null;
        }
      }
      throw ultimoErro;
    },
  };
}
