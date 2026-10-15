"use client";

import { useSyncExternalStore } from "react";
import { ordenarTrilha, SLUGS } from "@/lib/competencias";
import type { FeedbackIA } from "@/lib/ia/schema";
import type {
  CompetenciaSlug,
  MembroEquipe,
  MissaoDoDia,
  Perfil,
  ProgressoModulo,
  Pontuacoes,
  Relatorio,
  Submissao,
} from "@/lib/types";

/**
 * Estado do usuário guardado no navegador (localStorage).
 * É a "fonte de dados" do front enquanto o back-end com Supabase não existe:
 * cada ação aqui corresponde a uma futura chamada de API/tabela (veja README).
 */
export interface Estado {
  perfil: Perfil;
  diagnostico: { pontuacoes: Pontuacoes; data: string } | null;
  pontuacoes: Pontuacoes;
  historico: { data: string; pontuacoes: Pontuacoes }[];
  trilha: CompetenciaSlug[];
  progresso: Record<string, ProgressoModulo>;
  xp: number;
  sequencia: { dias: number; ultimoDia: string | null; congelada: boolean };
  trocasHoje: { data: string; usadas: number };
  missao: MissaoDoDia | null;
  submissoes: Submissao[];
  equipe: MembroEquipe[];
  relatorio: Relatorio | null;
}

const CHAVE = "futuro-lideres:v1";
const ouvintes = new Set<() => void>();
let cache: Estado | null | undefined;

function ler(): Estado | null {
  if (cache === undefined) {
    try {
      const texto = localStorage.getItem(CHAVE);
      cache = texto ? (JSON.parse(texto) as Estado) : null;
    } catch {
      cache = null;
    }
  }
  return cache;
}

function gravar(novo: Estado | null) {
  cache = novo;
  try {
    if (novo) localStorage.setItem(CHAVE, JSON.stringify(novo));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* modo privado ou armazenamento cheio: segue só em memória */
  }
  ouvintes.forEach((f) => f());
}

function assinar(f: () => void) {
  ouvintes.add(f);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key === CHAVE) {
      cache = undefined;
      f();
    }
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(f);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

/** `undefined` enquanto carrega (servidor/hidratação), `null` se não há usuário. */
export function useEstado(): Estado | null | undefined {
  return useSyncExternalStore(assinar, ler, () => undefined);
}

function atualizar(fn: (e: Estado) => Estado) {
  const atual = ler();
  if (atual) gravar(fn(atual));
}

/* ---------------- utilidades de data ---------------- */

export function hoje(d = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function diasEntre(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

/** Dias corridos entre uma data (AAAA-MM-DD) e hoje. */
export function diasDesde(data: string) {
  return diasEntre(data, hoje());
}

const XP = { missao: 40, desafio: 60, licao: 10, quiz: 20, diagnostico: 50 } as const;

function registrarDiaAtivo(e: Estado): Estado["sequencia"] {
  const dia = hoje();
  const { ultimoDia, dias, congelada } = e.sequencia;
  if (ultimoDia === dia) return e.sequencia;
  if (!ultimoDia) return { dias: 1, ultimoDia: dia, congelada: false };
  const gap = diasEntre(ultimoDia, dia);
  if (gap === 1) return { dias: dias + 1, ultimoDia: dia, congelada: false };
  // Sem punição no primeiro dia perdido: a sequência "congela" em vez de zerar.
  if (gap === 2 && !congelada) return { dias: dias + 1, ultimoDia: dia, congelada: true };
  return { dias: 1, ultimoDia: dia, congelada: false };
}

function aplicarNotas(p: Pontuacoes, competencias: FeedbackIA["competencias"]): Pontuacoes {
  const novo = { ...p };
  for (const c of competencias) {
    novo[c.competencia] = Math.round((p[c.competencia] * 0.8 + (c.nota / 2) * 0.2) * 100) / 100;
  }
  return novo;
}

function comHistorico(e: Estado, pontuacoes: Pontuacoes): Estado["historico"] {
  const dia = hoje();
  return [...e.historico.filter((h) => h.data !== dia), { data: dia, pontuacoes }];
}

/* ---------------- ações ---------------- */

export const acoes = {
  criarConta(perfil: Perfil) {
    const zerado = Object.fromEntries(SLUGS.map((s) => [s, 0])) as Pontuacoes;
    gravar({
      perfil,
      diagnostico: null,
      pontuacoes: zerado,
      historico: [],
      trilha: [],
      progresso: {},
      xp: 0,
      sequencia: { dias: 0, ultimoDia: null, congelada: false },
      trocasHoje: { data: hoje(), usadas: 0 },
      missao: null,
      submissoes: [],
      equipe: [],
      relatorio: null,
    });
  },

  carregarDemo(estado: Estado) {
    gravar(estado);
  },

  sair() {
    gravar(null);
  },

  atualizarPerfil(perfil: Perfil) {
    atualizar((e) => ({ ...e, perfil }));
  },

  concluirDiagnostico(pontuacoes: Pontuacoes, submissao?: Submissao) {
    atualizar((e) => ({
      ...e,
      diagnostico: { pontuacoes, data: hoje() },
      pontuacoes,
      historico: [{ data: hoje(), pontuacoes }],
      trilha: ordenarTrilha(pontuacoes),
      xp: e.xp + XP.diagnostico,
      submissoes: submissao ? [submissao, ...e.submissoes] : e.submissoes,
      sequencia: registrarDiaAtivo(e),
    }));
  },

  registrarSubmissao(s: Submissao, moduloId?: string) {
    atualizar((e) => {
      const pontuacoes = aplicarNotas(e.pontuacoes, s.feedback.competencias);
      const progresso = { ...e.progresso };
      if (moduloId) {
        const p = progresso[moduloId] ?? { licoesFeitas: [], concluido: false };
        const nota = Math.max(p.desafioNota ?? 0, s.feedback.nota_geral);
        progresso[moduloId] = { ...p, desafioNota: nota, concluido: nota >= NOTA_MINIMA };
      }
      const missao =
        s.origem === "missao" && e.missao?.desafio.id === s.desafioId ? { ...e.missao, status: "feita" as const } : e.missao;
      return {
        ...e,
        pontuacoes,
        historico: comHistorico(e, pontuacoes),
        progresso,
        missao,
        xp: e.xp + (s.origem === "missao" ? XP.missao : XP.desafio),
        submissoes: [s, ...e.submissoes],
        sequencia: registrarDiaAtivo(e),
      };
    });
  },

  contestar(submissaoId: string) {
    atualizar((e) => ({
      ...e,
      submissoes: e.submissoes.map((s) => (s.id === submissaoId ? { ...s, contestado: true } : s)),
    }));
  },

  marcarLicao(moduloId: string, licaoId: string) {
    atualizar((e) => {
      const p = e.progresso[moduloId] ?? { licoesFeitas: [], concluido: false };
      if (p.licoesFeitas.includes(licaoId)) return e;
      return {
        ...e,
        xp: e.xp + XP.licao,
        progresso: { ...e.progresso, [moduloId]: { ...p, licoesFeitas: [...p.licoesFeitas, licaoId] } },
        sequencia: registrarDiaAtivo(e),
      };
    });
  },

  salvarQuiz(moduloId: string, acertos: number) {
    atualizar((e) => {
      const p = e.progresso[moduloId] ?? { licoesFeitas: [], concluido: false };
      const primeiraVez = p.quizAcertos === undefined;
      return {
        ...e,
        xp: e.xp + (primeiraVez ? XP.quiz : 0),
        progresso: { ...e.progresso, [moduloId]: { ...p, quizAcertos: Math.max(acertos, p.quizAcertos ?? 0) } },
      };
    });
  },

  definirMissao(missao: MissaoDoDia, troca = false) {
    atualizar((e) => {
      const trocas = e.trocasHoje.data === hoje() ? e.trocasHoje : { data: hoje(), usadas: 0 };
      return { ...e, missao, trocasHoje: troca ? { ...trocas, usadas: trocas.usadas + 1 } : trocas };
    });
  },

  pularMissao() {
    atualizar((e) => (e.missao ? { ...e, missao: { ...e.missao, status: "pulada" } } : e));
  },

  salvarRelatorio(relatorio: Relatorio) {
    atualizar((e) => ({ ...e, relatorio }));
  },

  adicionarMembro(m: Omit<MembroEquipe, "id">) {
    atualizar((e) => ({ ...e, equipe: [...e.equipe, { ...m, id: crypto.randomUUID() }] }));
  },

  atualizarMembro(m: MembroEquipe) {
    atualizar((e) => ({ ...e, equipe: e.equipe.map((x) => (x.id === m.id ? m : x)) }));
  },

  removerMembro(id: string) {
    atualizar((e) => ({ ...e, equipe: e.equipe.filter((x) => x.id !== id) }));
  },
};

export const NOTA_MINIMA = 7;

/* ---------------- derivados ---------------- */

export function trocasRestantes(e: Estado) {
  return e.trocasHoje.data === hoje() ? Math.max(0, 1 - e.trocasHoje.usadas) : 1;
}

export function nivelXP(xp: number) {
  const nivel = Math.floor(xp / 500) + 1;
  return { nivel, noNivel: xp % 500, paraProximo: 500 };
}
