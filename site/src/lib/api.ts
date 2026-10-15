"use client";

import type { FeedbackIA, RelatorioIA } from "@/lib/ia/schema";
import type { DesafioPublico, Pontuacoes } from "@/lib/types";

/** Funções do front para falar com as rotas de API. */

async function chamar<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro ?? "Algo deu errado. Tente novamente.");
  return dados as T;
}

export type RespostaAvaliacao =
  | { status: "ok"; feedback: FeedbackIA; provedor: string }
  | { status: "desenvolver"; mensagem: string; provedor: string };

export const api = {
  avaliar: (corpo: {
    desafioId: string;
    resposta: string;
    opcaoEscolhida?: number;
    contexto?: { setor?: string; cargo?: string; tamanhoEquipe?: number; tipoEquipe?: string };
  }) => chamar<RespostaAvaliacao>("/api/avaliar", { method: "POST", body: JSON.stringify(corpo) }),

  sortearMissao: (pontuacoes: Pontuacoes, recentes: string[], excluir?: string) =>
    chamar<DesafioPublico>("/api/missao-do-dia", {
      method: "POST",
      body: JSON.stringify({ pontuacoes, recentes, excluir }),
    }),

  desafio: (id: string) => chamar<DesafioPublico>(`/api/desafios/${encodeURIComponent(id)}`),

  relatorio: (corpo: unknown) =>
    chamar<RelatorioIA & { provedor: string }>("/api/relatorio", { method: "POST", body: JSON.stringify(corpo) }),

  chamar,
};
