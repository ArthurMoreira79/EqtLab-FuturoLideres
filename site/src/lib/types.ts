import type { FeedbackIA, RelatorioIA } from "@/lib/ia/schema";

export type CompetenciaSlug =
  | "comunicacao"
  | "feedback"
  | "delegacao"
  | "conflitos"
  | "decisao"
  | "inteligencia_emocional"
  | "desenvolvimento"
  | "desempenho";

/** Pontuação de 0 a 5 por competência. */
export type Pontuacoes = Record<CompetenciaSlug, number>;

export type Nivel = "iniciante" | "em_desenvolvimento" | "proficiente" | "referencia";

export interface Perfil {
  nome: string;
  cargo: string;
  setor: string;
  tipoEquipe: string;
  tamanhoEquipe: number;
  mesesLideranca: number;
  modeloTrabalho: string;
  desafios: string[];
}

export interface CriterioRubrica {
  id: string;
  competencia: CompetenciaSlug;
  /** Palavras/expressões que indicam que o critério foi atendido (usadas pelo avaliador simulado). */
  sinais: string[];
  /** Texto usado quando o critério aparece na resposta. */
  forte: string;
  /** Texto usado quando o critério não aparece. */
  melhoria: string;
  /** Risco de não atender o critério. */
  risco?: string;
}

export type TipoDesafio = "cenario" | "escolha" | "mundo_real";

export interface Desafio {
  id: string;
  tipo: TipoDesafio;
  titulo: string;
  enunciado: string;
  pergunta: string;
  competencias: CompetenciaSlug[];
  rubrica: CriterioRubrica[];
  exemploResposta: string;
  dificuldade: 1 | 2 | 3;
  moduloId?: string;
  opcoes?: string[];
  /** Índice da alternativa mais alinhada à rubrica (desafios de escolha). */
  opcaoRecomendada?: number;
  /** Desafios fora do sorteio de missões (diagnóstico, desafios de módulo). */
  foraDoSorteio?: boolean;
}

/** Versão do desafio enviada ao navegador (sem rubrica). */
export type DesafioPublico = Omit<Desafio, "rubrica" | "exemploResposta" | "opcaoRecomendada">;

export interface Licao {
  id: string;
  titulo: string;
  minutos: number;
  paragrafos: string[];
  exemplo: string;
  naPratica: string;
}

export interface PerguntaQuiz {
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

export interface Modulo {
  id: string;
  competencia: CompetenciaSlug;
  titulo: string;
  descricao: string;
  licoes: Licao[];
  quiz: PerguntaQuiz[];
  desafioId?: string;
}

export interface ProgressoModulo {
  licoesFeitas: string[];
  quizAcertos?: number;
  desafioNota?: number;
  concluido: boolean;
}

export interface MembroEquipe {
  id: string;
  nome: string;
  funcao: string;
  notas: string;
  ultimo1on1: string;
}

export interface Submissao {
  id: string;
  desafioId: string;
  titulo: string;
  origem: "missao" | "desafio" | "diagnostico";
  resposta: string;
  feedback: FeedbackIA;
  data: string;
  contestado?: boolean;
}

export interface MissaoDoDia {
  data: string;
  desafio: DesafioPublico;
  status: "pendente" | "feita" | "pulada";
}

export interface Relatorio extends RelatorioIA {
  geradoEm: string;
}

export interface RespostaForum {
  id: string;
  autor: string;
  mentor?: boolean;
  isIA?: boolean;
  corpo: string;
  uteis: number;
  criadoEm: string;
}

export interface PostForum {
  id: string;
  titulo: string;
  corpo: string;
  tags: CompetenciaSlug[];
  anonimo: boolean;
  autor: string;
  setor?: string;
  criadoEm: string;
  melhorRespostaId?: string;
  respostas: RespostaForum[];
}
