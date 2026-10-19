import "server-only";
import { DESAFIOS } from "@/lib/conteudo/desafios";
import type { Desafio, Pontuacoes } from "@/lib/types";

/**
 * Aleatoriedade ponderada (seção 5.5): prioriza competências fracas e evita repetir cenários recentes.
 * Peso = (5,5 − média das competências do desafio)², dividido por 5 se o cenário foi visto recentemente.
 */
export function sortearMissao(pontuacoes: Pontuacoes, recentes: string[], excluir?: string): Desafio {
  const candidatos = DESAFIOS.filter((d) => !d.foraDoSorteio && d.id !== excluir);
  const pesos = candidatos.map((d) => {
    const media = d.competencias.reduce((s, c) => s + (pontuacoes[c] ?? 2.5), 0) / d.competencias.length;
    const base = Math.pow(5.5 - Math.min(5, media), 2);
    return recentes.includes(d.id) ? base / 5 : base;
  });
  const total = pesos.reduce((a, b) => a + b, 0);
  let sorteio = Math.random() * total;
  for (let i = 0; i < candidatos.length; i++) {
    sorteio -= pesos[i];
    if (sorteio <= 0) return candidatos[i];
  }
  return candidatos[candidatos.length - 1];
}
