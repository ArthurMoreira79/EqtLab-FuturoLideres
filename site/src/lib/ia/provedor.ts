import "server-only";
import type { Desafio } from "@/lib/types";
import type { PedidoRelatorio } from "./schema";

export interface EntradaAvaliacao {
  desafio: Desafio;
  resposta: string;
  opcaoEscolhida?: number;
  contexto?: { setor?: string; cargo?: string; tamanhoEquipe?: number; tipoEquipe?: string };
}

/**
 * Contrato que qualquer IA precisa cumprir.
 * Os métodos devolvem `unknown`: a rota de API valida tudo com Zod antes de responder,
 * então um provedor que devolva JSON fora do formato vira erro amigável, nunca dado quebrado na tela.
 */
export interface ProvedorIA {
  nome: string;
  avaliar(entrada: EntradaAvaliacao): Promise<unknown>;
  gerarRelatorio(pedido: PedidoRelatorio): Promise<unknown>;
}

/**
 * Escolhe o provedor pela variável IA_PROVEDOR (veja .env.example).
 * Para adicionar outra IA: crie um arquivo nesta pasta que implemente ProvedorIA
 * e acrescente um `case` aqui.
 */
export async function obterProvedor(): Promise<ProvedorIA> {
  switch (process.env.IA_PROVEDOR) {
    case "compativel-openai": {
      const { provedorCompativelOpenAI } = await import("./compativel-openai");
      return provedorCompativelOpenAI();
    }
    case "simulado":
    case undefined:
    case "": {
      const { provedorSimulado } = await import("./simulado");
      return provedorSimulado;
    }
    default:
      throw new Error(`IA_PROVEDOR desconhecido: ${process.env.IA_PROVEDOR}`);
  }
}
