import type { CompetenciaSlug, Nivel, Pontuacoes } from "@/lib/types";

export interface Competencia {
  slug: CompetenciaSlug;
  nome: string;
  curto: string;
  descricao: string;
  /** Cor semântica usada em gráficos, tags e trilha. */
  cor: string;
  niveis: Record<Nivel, string>;
}

export const COMPETENCIAS: Competencia[] = [
  {
    slug: "comunicacao",
    nome: "Comunicação e escuta ativa",
    curto: "Comunicação",
    descricao: "Transmitir prioridades com clareza e ouvir de verdade antes de responder.",
    cor: "#2f80ed",
    niveis: {
      iniciante: "Comunica decisões sem contexto e interrompe para responder.",
      em_desenvolvimento: "Explica o porquê das decisões, mas nem sempre confirma o entendimento.",
      proficiente: "Adapta a mensagem ao público e faz perguntas para checar o entendimento.",
      referencia: "Cria espaços em que a equipe se sente ouvida e traz problemas cedo.",
    },
  },
  {
    slug: "feedback",
    nome: "Feedback e conversas difíceis",
    curto: "Feedback",
    descricao: "Dar e receber feedback específico, no momento certo e com respeito.",
    cor: "#a455ee",
    niveis: {
      iniciante: "Evita conversas corretivas ou as faz em público.",
      em_desenvolvimento: "Dá feedback, mas de forma genérica ou tardia.",
      proficiente: "Usa fatos e impacto, combina próximos passos e acompanha.",
      referencia: "Feedback é rotina na equipe, nos dois sentidos.",
    },
  },
  {
    slug: "delegacao",
    nome: "Delegação e autonomia da equipe",
    curto: "Delegação",
    descricao: "Distribuir responsabilidades de acordo com a maturidade de cada pessoa.",
    cor: "#00a3a3",
    niveis: {
      iniciante: "Centraliza tarefas por achar mais rápido fazer sozinho.",
      em_desenvolvimento: "Delega tarefas, mas não a autoridade para decidir.",
      proficiente: "Combina resultado esperado, prazos e pontos de checagem.",
      referencia: "A equipe resolve problemas sem depender do líder.",
    },
  },
  {
    slug: "conflitos",
    nome: "Gestão de conflitos",
    curto: "Conflitos",
    descricao: "Mediar divergências antes que virem rupturas, sem tomar partido.",
    cor: "#e8590c",
    niveis: {
      iniciante: "Ignora o conflito esperando que se resolva sozinho.",
      em_desenvolvimento: "Intervém, mas tende a impor uma solução.",
      proficiente: "Ouve os lados separadamente e conduz um acordo.",
      referencia: "Transforma divergências em decisões melhores.",
    },
  },
  {
    slug: "decisao",
    nome: "Tomada de decisão e priorização",
    curto: "Decisão",
    descricao: "Decidir com informação suficiente, priorizar e assumir as consequências.",
    cor: "#1e9e5a",
    niveis: {
      iniciante: "Adia decisões ou decide por impulso.",
      em_desenvolvimento: "Decide, mas sem critérios claros de prioridade.",
      proficiente: "Pondera impacto e urgência e comunica os critérios.",
      referencia: "Ensina a equipe a decidir com os mesmos critérios.",
    },
  },
  {
    slug: "inteligencia_emocional",
    nome: "Inteligência emocional e autogestão",
    curto: "Intel. emocional",
    descricao: "Reconhecer as próprias emoções e responder em vez de reagir.",
    cor: "#d4a106",
    niveis: {
      iniciante: "Reage no calor do momento.",
      em_desenvolvimento: "Percebe a reação depois e tenta reparar.",
      proficiente: "Faz pausas antes de responder em situações de tensão.",
      referencia: "É ponto de estabilidade para a equipe em crises.",
    },
  },
  {
    slug: "desenvolvimento",
    nome: "Desenvolvimento de pessoas",
    curto: "Desenv. pessoas",
    descricao: "Apoiar o crescimento de cada pessoa da equipe.",
    cor: "#c2185b",
    niveis: {
      iniciante: "Não conhece as metas de carreira da equipe.",
      em_desenvolvimento: "Conversa sobre carreira só na avaliação anual.",
      proficiente: "Tem 1:1 regulares e planos de desenvolvimento simples.",
      referencia: "Forma sucessores.",
    },
  },
  {
    slug: "desempenho",
    nome: "Gestão de desempenho e metas",
    curto: "Desempenho",
    descricao: "Definir metas claras, acompanhar e agir sobre os desvios.",
    cor: "#3b4bc8",
    niveis: {
      iniciante: "Metas vagas, acompanhamento só no fechamento.",
      em_desenvolvimento: "Metas definidas, acompanhamento irregular.",
      proficiente: "Rituais de acompanhamento e ação rápida sobre desvios.",
      referencia: "A equipe acompanha os próprios indicadores.",
    },
  },
];

export const SLUGS = COMPETENCIAS.map((c) => c.slug);

export function competencia(slug: CompetenciaSlug): Competencia {
  return COMPETENCIAS.find((c) => c.slug === slug)!;
}

export const NOMES_NIVEL: Record<Nivel, string> = {
  iniciante: "Iniciante",
  em_desenvolvimento: "Em desenvolvimento",
  proficiente: "Proficiente",
  referencia: "Referência",
};

export function nivelDe(pontuacao: number): Nivel {
  if (pontuacao < 2) return "iniciante";
  if (pontuacao < 3) return "em_desenvolvimento";
  if (pontuacao < 4) return "proficiente";
  return "referencia";
}

export function pontuacoesVazias(valor = 0): Pontuacoes {
  return Object.fromEntries(SLUGS.map((s) => [s, valor])) as Pontuacoes;
}

/** Duas mais fortes e duas mais fracas. */
export function forcasEAtencao(p: Pontuacoes) {
  const ordenadas = [...SLUGS].sort((a, b) => p[a] - p[b]);
  return { atencao: ordenadas.slice(0, 2), forcas: ordenadas.slice(-2).reverse() };
}

/**
 * Ordem personalizada da trilha: pontos de atenção primeiro,
 * intercalando uma força a cada dois pontos fracos para manter a motivação.
 */
export function ordenarTrilha(p: Pontuacoes): CompetenciaSlug[] {
  const fracas = [...SLUGS].sort((a, b) => p[a] - p[b]);
  const resultado: CompetenciaSlug[] = [];
  while (fracas.length) {
    resultado.push(...fracas.splice(0, 2));
    const forte = fracas.pop();
    if (forte) resultado.push(forte);
  }
  return resultado;
}
