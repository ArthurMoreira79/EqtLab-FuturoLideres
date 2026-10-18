import { moduloDaCompetencia, temConteudo } from "@/lib/conteudo/modulos";
import type { Estado } from "@/lib/estado";
import type { Modulo } from "@/lib/types";

export type StatusModulo = "concluido" | "andamento" | "disponivel" | "bloqueado" | "producao";

/** Um módulo libera quando há no máximo um módulo com conteúdo ainda pendente antes dele. */
export function statusModulo(estado: Estado, m: Modulo): StatusModulo {
  const p = estado.progresso[m.id];
  if (p?.concluido) return "concluido";
  if (!temConteudo(m)) return "producao";
  if (p && (p.licoesFeitas.length > 0 || p.quizAcertos !== undefined || p.desafioNota !== undefined)) return "andamento";
  const indice = estado.trilha.indexOf(m.competencia);
  const pendentesAntes = estado.trilha
    .slice(0, indice)
    .map(moduloDaCompetencia)
    .filter((x) => temConteudo(x) && !estado.progresso[x.id]?.concluido).length;
  return pendentesAntes < 2 ? "disponivel" : "bloqueado";
}

export function progressoModulo(estado: Estado, m: Modulo) {
  const p = estado.progresso[m.id];
  const passos = m.licoes.length + 2;
  const feitos = (p?.licoesFeitas.length ?? 0) + (p?.quizAcertos !== undefined ? 1 : 0) + (p?.concluido ? 1 : 0);
  return { passos, feitos, fracao: passos ? feitos / passos : 0 };
}
