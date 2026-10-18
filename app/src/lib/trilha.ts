import { moduloDaCompetencia, temConteudo } from "@/lib/conteudo/modulos";
import type { Estado } from "@/lib/estado";
import type { Modulo } from "@/lib/types";

export type StatusModulo = "concluido" | "andamento" | "disponivel" | "bloqueado" | "producao";
export type SituacaoNo = "feito" | "atual" | "bloqueado";
export type TipoNo = "licao" | "quiz" | "desafio" | "producao";
export interface No { id: string; tipo: TipoNo; titulo: string; numero: number; situacao: SituacaoNo; href?: string }
export interface Unidade { modulo: Modulo; numero: number; status: StatusModulo; nos: No[] }

/** Temas com conteúdo são módulos numerados; temas em produção não criam lacunas na sequência. */
export function modulosDisponiveis(estado: Estado): Modulo[] {
  return [...new Set(estado.trilha)].map(moduloDaCompetencia).filter((m) => m && temConteudo(m));
}

/** O módulo seguinte só abre quando todos os anteriores com conteúdo foram concluídos. */
export function statusModulo(estado: Estado, m: Modulo): StatusModulo {
  const p = estado.progresso[m.id];
  if (!temConteudo(m)) return "producao";
  if (p?.concluido) return "concluido";
  const modulos = modulosDisponiveis(estado);
  const indice = modulos.findIndex((item) => item.id === m.id);
  if (indice < 0 || modulos.slice(0, indice).some((item) => !estado.progresso[item.id]?.concluido)) return "bloqueado";
  return p && (p.licoesFeitas.length > 0 || p.quizAcertos !== undefined || p.desafioNota !== undefined) ? "andamento" : "disponivel";
}

export function progressoModulo(estado: Estado, m: Modulo) {
  const p = estado.progresso[m.id];
  const passos = m.licoes.length + 2;
  const feitos = m.licoes.filter((l) => p?.licoesFeitas.includes(l.id)).length + (p?.quizAcertos !== undefined ? 1 : 0) + (p?.concluido ? 1 : 0);
  return { passos, feitos, fracao: passos ? feitos / passos : 0 };
}

/** Fonte única de etapas, numeração, links e próximo passo para painel, trilha e aula. */
export function montarUnidades(estado: Estado): { unidades: Unidade[]; proximo: No | null; emProducao: Modulo[] } {
  let proximo: No | null = null;
  const unidades = modulosDisponiveis(estado).map((m, i): Unidade => {
    const status = statusModulo(estado, m);
    const p = estado.progresso[m.id];
    const etapas: Omit<No, "situacao">[] = [
      ...m.licoes.map((l, indice) => ({ id: l.id, tipo: "licao" as const, numero: indice + 1, titulo: l.titulo, href: `/trilha/${m.id}?etapa=${l.id}#licoes` })),
      { id: `${m.id}-quiz`, tipo: "quiz", numero: m.licoes.length + 1, titulo: "Quiz rápido", href: `/trilha/${m.id}?etapa=quiz#quiz` },
      { id: `${m.id}-desafio`, tipo: "desafio", numero: m.licoes.length + 2, titulo: "Desafio prático", href: `/trilha/${m.id}?etapa=desafio#desafio` },
    ];
    let anterioresFeitos = true;
    const nos = etapas.map((etapa): No => {
      const feita = etapa.tipo === "licao" ? !!p?.licoesFeitas.includes(etapa.id) : etapa.tipo === "quiz" ? p?.quizAcertos !== undefined : !!p?.concluido;
      if (feita) return { ...etapa, situacao: "feito" };
      const atual = anterioresFeitos && !proximo && (status === "disponivel" || status === "andamento");
      anterioresFeitos = false;
      const no: No = { ...etapa, situacao: atual ? "atual" : "bloqueado" };
      if (atual) proximo = no;
      return no;
    });
    return { modulo: m, numero: i + 1, status, nos };
  });
  const emProducao = [...new Set(estado.trilha)].map(moduloDaCompetencia).filter((m) => m && !temConteudo(m));
  return { unidades, proximo, emProducao };
}
