import { hoje, type Estado } from "@/lib/estado";

/** Medidor de constância: em quais dias da semana a pessoa praticou. Tudo calculado a partir de datas AAAA-MM-DD. */

const LETRAS = ["S", "T", "Q", "Q", "S", "S", "D"]; // semana começa na segunda
const NOMES = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];

const somar = (base: Date, dias: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);
const indiceSemana = (d: Date) => (d.getDay() + 6) % 7; // segunda = 0

/** Todas as datas em que há sinal de atividade (registro explícito, missões feitas e a sequência atual). */
export function diasAtivosDe(e: Estado): Set<string> {
  const ativos = new Set<string>(e.diasAtivos ?? []);
  for (const s of e.submissoes) ativos.add(s.data.slice(0, 10));
  // Estados antigos não têm o registro: reconstrói a sequência atual (dias corridos até o último dia ativo).
  if (e.sequencia.ultimoDia && !e.diasAtivos) {
    const fim = new Date(`${e.sequencia.ultimoDia}T12:00:00`);
    for (let i = 0; i < e.sequencia.dias; i++) ativos.add(hoje(somar(fim, -i)));
  }
  return ativos;
}

export interface DiaDaSemana {
  data: string;
  letra: string;
  nome: string;
  ativo: boolean;
  hoje: boolean;
  futuro: boolean;
}

export interface Constancia {
  /** Segunda a domingo da semana atual. */
  semana: DiaDaSemana[];
  ativosNaSemana: number;
  /** Últimas 4 semanas (a mais antiga primeiro; a última linha é a semana atual). */
  semanas: DiaDaSemana[][];
  ativosEm4Semanas: number;
  diasConsiderados: number;
  /** 0 a 1, considerando só os dias que já passaram. */
  taxa: number;
  /** Dia da semana em que a pessoa mais pratica (null se ainda não há dados). */
  diaForte: string | null;
}

export function calcularConstancia(e: Estado, agora = new Date()): Constancia {
  const ativos = diasAtivosDe(e);
  const hojeIso = hoje(agora);
  const segunda = somar(agora, -indiceSemana(agora));

  const montar = (inicio: Date): DiaDaSemana[] =>
    LETRAS.map((letra, i) => {
      const d = somar(inicio, i);
      const data = hoje(d);
      return { data, letra, nome: NOMES[i], ativo: ativos.has(data), hoje: data === hojeIso, futuro: data > hojeIso };
    });

  const semanas = [3, 2, 1, 0].map((atras) => montar(somar(segunda, -7 * atras)));
  const semana = semanas[3];
  const passados = semanas.flat().filter((d) => !d.futuro);
  const ativosEm4 = passados.filter((d) => d.ativo).length;

  const porDia = Array<number>(7).fill(0);
  for (const sem of semanas) sem.forEach((d, i) => d.ativo && porDia[i]++);
  const melhor = Math.max(...porDia);

  return {
    semana,
    ativosNaSemana: semana.filter((d) => d.ativo).length,
    semanas,
    ativosEm4Semanas: ativosEm4,
    diasConsiderados: passados.length,
    taxa: passados.length ? ativosEm4 / passados.length : 0,
    diaForte: melhor >= 2 ? NOMES[porDia.indexOf(melhor)] : null,
  };
}
