import { z } from "zod";
import type { AvatarConfig } from "@/lib/avatar";

/** Quanto tempo a resposta certa e o placar parcial ficam na tela entre uma pergunta e outra. */
export const PAUSA_REVELACAO_S = 6;
/** Tolerância (rede) para aceitar uma resposta logo depois de o tempo acabar. */
export const GRACA_MS = 700;

export const CONTAGENS_S = [
  { valor: 30, rotulo: "30 segundos" },
  { valor: 60, rotulo: "1 minuto" },
  { valor: 120, rotulo: "2 minutos" },
  { valor: 300, rotulo: "5 minutos" },
] as const;
export const TEMPOS_PERGUNTA_S = [10, 20, 30, 60] as const;
export const MAX_PERGUNTAS = 20;

export const codigoSchema = z.string().regex(/^\d{6}$/, "O código tem 6 dígitos.");

export const perguntaNovaSchema = z
  .object({
    enunciado: z.string().trim().min(5, "Escreva o enunciado da pergunta.").max(240, "O enunciado é longo demais."),
    alternativas: z
      .array(z.string().trim().min(1, "Preencha todas as alternativas.").max(120, "Uma alternativa está longa demais."))
      .min(2, "Cada pergunta precisa de pelo menos 2 alternativas.")
      .max(4),
    correta: z.number({ error: "Marque qual alternativa é a certa." }).int().min(0, "Marque qual alternativa é a certa."),
    tempoSegundos: z.number({ error: "Escolha o tempo da pergunta." }).int().min(5, "O tempo mínimo é 5 segundos.").max(120, "O tempo máximo é 120 segundos."),
  })
  .strict()
  .refine((p) => p.correta < p.alternativas.length, { message: "Marque qual alternativa é a certa.", path: ["correta"] });

export const salaNovaSchema = z
  .object({
    titulo: z.string().trim().min(3, "Dê um nome para a sala.").max(80, "O nome da sala é longo demais."),
    area: z.string().regex(/^[a-z0-9-]{2,40}$/, "Escolha a área da sala."),
    contagemSegundos: z.number({ error: "Escolha a contagem regressiva." }).int().min(10, "A contagem mínima é de 10 segundos.").max(900, "A contagem máxima é de 15 minutos."),
    perguntas: z.array(perguntaNovaSchema).min(1, "Crie ao menos uma pergunta.").max(MAX_PERGUNTAS, `No máximo ${MAX_PERGUNTAS} perguntas.`),
  })
  .strict();
export type SalaNova = z.infer<typeof salaNovaSchema>;

export type FaseSala = "lobby" | "pergunta" | "revelacao" | "encerrada";

export interface Cronograma {
  fase: FaseSala;
  /** Pergunta atual (a partir de 0); -1 no lobby. */
  indice: number;
  inicioDaFaseEm: number;
  fimDaFaseEm: number;
}

/**
 * Em que ponto a sala está, só pelo relógio (ms desde 1970). O servidor e o navegador usam a mesma conta,
 * então ninguém precisa “passar a vez”: cada pergunta dura o seu tempo e depois mostra a resposta.
 */
export function calcularFase(inicioEm: number, temposS: number[], agora: number): Cronograma {
  if (agora < inicioEm) return { fase: "lobby", indice: -1, inicioDaFaseEm: 0, fimDaFaseEm: inicioEm };
  let t = inicioEm;
  for (let i = 0; i < temposS.length; i++) {
    const fimPergunta = t + temposS[i] * 1000;
    if (agora < fimPergunta) return { fase: "pergunta", indice: i, inicioDaFaseEm: t, fimDaFaseEm: fimPergunta };
    const fimRevelacao = fimPergunta + PAUSA_REVELACAO_S * 1000;
    if (agora < fimRevelacao) return { fase: "revelacao", indice: i, inicioDaFaseEm: fimPergunta, fimDaFaseEm: fimRevelacao };
    t = fimRevelacao;
  }
  return { fase: "encerrada", indice: temposS.length - 1, inicioDaFaseEm: t, fimDaFaseEm: t };
}

export interface ParticipanteSala {
  id: string;
  nome: string;
  avatar: AvatarConfig | null;
}

export interface LinhaRanking extends ParticipanteSala {
  posicao: number;
  acertos: number;
  /** Soma do tempo das respostas certas (desempate: quem foi mais rápido fica na frente). */
  tempoMs: number;
}

/** Tudo o que a tela precisa para desenhar a sala. A resposta certa só chega depois que o tempo acaba. */
export interface EstadoSala {
  /** Relógio do servidor (ms), para o navegador corrigir o próprio relógio. */
  agora: number;
  codigo: string;
  titulo: string;
  area: { slug: string; nome: string; cor: string };
  ehAnfitriao: boolean;
  contagemSegundos: number;
  inicioEm: number;
  temposS: number[];
  totalPerguntas: number;
  fase: FaseSala;
  indice: number;
  participantes: ParticipanteSala[];
  pergunta: {
    enunciado: string;
    alternativas: string[];
    tempoSegundos: number;
    /** Só na revelação. */
    correta?: number;
    /** Quantas pessoas marcaram cada alternativa (só na revelação). */
    distribuicao?: number[];
  } | null;
  minhaResposta: { alternativa: number; correta?: boolean } | null;
  /** Quantas pessoas já responderam a pergunta atual. */
  respondidos: number;
  /** Placar: só na revelação e no fim. */
  ranking: LinhaRanking[] | null;
}
