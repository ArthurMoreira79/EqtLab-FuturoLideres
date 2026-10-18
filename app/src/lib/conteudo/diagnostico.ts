import { SLUGS } from "@/lib/competencias";
import type { CompetenciaSlug, Pontuacoes } from "@/lib/types";

export interface CenarioJulgamento {
  id: string;
  contexto: string;
  texto: string;
  /** Cada opção vale de 1 a 5 nas competências indicadas. */
  opcoes: { texto: string; pesos: Partial<Record<CompetenciaSlug, number>> }[];
}

/** Parte B — julgamento situacional (versão curta do MVP). */
export const CENARIOS: CenarioJulgamento[] = [
  {
    id: "b1",
    contexto: "Operações de campo",
    texto:
      "Faltam dois dias para o fechamento das metas. Um técnico experiente entrega um relatório com erros pela terceira vez no mês. Qual a sua primeira reação?",
    opcoes: [
      { texto: "Corrijo o relatório eu mesmo para não atrasar a entrega.", pesos: { feedback: 1, delegacao: 1 } },
      { texto: "Aponto os erros na reunião de equipe para ninguém repetir.", pesos: { feedback: 1, conflitos: 2 } },
      { texto: "Converso em particular, mostro os erros e entendo o que está acontecendo.", pesos: { feedback: 5, desenvolvimento: 4 } },
      { texto: "Repasso a tarefa para outra pessoa da equipe.", pesos: { feedback: 2, delegacao: 2 } },
    ],
  },
  {
    id: "b2",
    contexto: "Escala e plantões",
    texto: "Dois liderados discutem em voz alta sobre a troca de um plantão, na frente de outras pessoas.",
    opcoes: [
      { texto: "Peço calma, separo os dois e converso com cada um depois.", pesos: { conflitos: 5, inteligencia_emocional: 4 } },
      { texto: "Decido a troca na hora para encerrar a discussão.", pesos: { conflitos: 2, decisao: 3 } },
      { texto: "Deixo que resolvam entre eles, são adultos.", pesos: { conflitos: 1 } },
      { texto: "Repreendo os dois ali mesmo pela falta de profissionalismo.", pesos: { conflitos: 1, inteligencia_emocional: 1 } },
    ],
  },
  {
    id: "b3",
    contexto: "Prioridades",
    texto: "Sua gestora pede um relatório urgente no mesmo dia em que você tinha 1:1 marcados com toda a equipe.",
    opcoes: [
      { texto: "Cancelo todos os 1:1 sem explicar, o relatório é prioridade.", pesos: { decisao: 2, comunicacao: 1, desenvolvimento: 1 } },
      { texto: "Mantenho os 1:1 mais críticos, remarco os outros explicando o motivo e negocio prazo do relatório.", pesos: { decisao: 5, comunicacao: 4, desenvolvimento: 4 } },
      { texto: "Faço tudo, nem que precise ficar até tarde.", pesos: { decisao: 2, inteligencia_emocional: 2 } },
      { texto: "Peço para alguém da equipe fazer o relatório sozinho.", pesos: { delegacao: 2, decisao: 2 } },
    ],
  },
  {
    id: "b4",
    contexto: "Metas",
    texto: "No meio do mês a equipe está bem abaixo da meta e ninguém comenta o assunto.",
    opcoes: [
      { texto: "Espero o fechamento: talvez recupere no fim do mês.", pesos: { desempenho: 1 } },
      { texto: "Mostro o número para a equipe, pergunto o que está travando e criamos um acompanhamento semanal.", pesos: { desempenho: 5, comunicacao: 4 } },
      { texto: "Cobro mais ritmo de cada pessoa individualmente.", pesos: { desempenho: 2, comunicacao: 2 } },
      { texto: "Assumo pessoalmente as tarefas mais atrasadas.", pesos: { desempenho: 2, delegacao: 1 } },
    ],
  },
];

/**
 * Combina autoavaliação (parte A, peso 40%) e julgamento situacional (parte B, peso 60%).
 * Competências sem cenário usam só a autoavaliação.
 */
export function calcularDiagnostico(autoavaliacao: Pontuacoes, escolhas: Record<string, number>): Pontuacoes {
  const somas = Object.fromEntries(SLUGS.map((s) => [s, [] as number[]])) as Record<CompetenciaSlug, number[]>;
  for (const cenario of CENARIOS) {
    const i = escolhas[cenario.id];
    if (i === undefined) continue;
    for (const [slug, peso] of Object.entries(cenario.opcoes[i].pesos)) {
      somas[slug as CompetenciaSlug].push(peso);
    }
  }
  return Object.fromEntries(
    SLUGS.map((s) => {
      const b = somas[s];
      const valor = b.length ? 0.4 * autoavaliacao[s] + 0.6 * (b.reduce((x, y) => x + y, 0) / b.length) : autoavaliacao[s];
      return [s, Math.round(valor * 10) / 10];
    }),
  ) as Pontuacoes;
}
