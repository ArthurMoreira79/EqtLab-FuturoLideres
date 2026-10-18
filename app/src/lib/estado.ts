"use client";

import { useSyncExternalStore } from "react";
import type { AvatarConfig } from "@/lib/avatar";
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
 * Perfil e diagnóstico são persistidos no PostgreSQL; os demais dados de progresso
 * ainda usam este estado local (veja README).
 */
export interface Estado {
  /** Id da conta no servidor (ausente no modo demonstração). */
  usuarioId?: string;
  /** A pessoa já viu o tour “como funciona”. */
  tourVisto?: boolean;
  /** Emblema do perfil (só aparece no perfil); sincronizado com a conta quando há login. */
  avatar?: AvatarConfig;
  /** Datas (AAAA-MM-DD) em que houve atividade; alimenta o medidor de constância. */
  diasAtivos?: string[];
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

/** Leitura pontual (fora de componentes React), ex.: decidir para onde ir depois do login. */
export function lerEstadoAtual(): Estado | null {
  return ler();
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

export const XP = { missao: 40, desafio: 60, licao: 10, quiz: 20, diagnostico: 50 } as const;

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

/** Registra o dia de hoje na sequência e no histórico de dias ativos. */
function comDiaAtivo(e: Estado): Pick<Estado, "sequencia" | "diasAtivos"> {
  const dia = hoje();
  const dias = e.diasAtivos ?? [];
  return { sequencia: registrarDiaAtivo(e), diasAtivos: dias.includes(dia) ? dias : [...dias, dia].slice(-120) };
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
  criarConta(perfil: Perfil, usuarioId?: string) {
    const zerado = Object.fromEntries(SLUGS.map((s) => [s, 0])) as Pontuacoes;
    gravar({
      usuarioId,
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

  /**
   * Login: se este navegador já tem o progresso dessa mesma conta, mantém e só atualiza o perfil;
   * senão (outra conta, ou modo demonstração) começa um estado novo a partir do perfil do servidor.
   */
  entrar(
    perfil: Perfil,
    usuarioId: string,
    diagnostico?: { pontuacoes: Pontuacoes; data: string } | null,
    avatar?: AvatarConfig | null,
  ) {
    const atual = ler();
    if (atual?.usuarioId === usuarioId && (atual.diagnostico || !diagnostico)) {
      // O servidor é a fonte do avatar da conta; se a conta ainda não tem, mantém o que está aqui.
      gravar({ ...atual, perfil, avatar: avatar ?? atual.avatar });
      return;
    }
    acoes.criarConta(perfil, usuarioId);
    if (avatar) atualizar((e) => ({ ...e, avatar }));
    // Já fez o diagnóstico em outro dispositivo: traz do servidor e pula o tour e o diagnóstico.
    if (diagnostico) {
      atualizar((e) => ({
        ...e,
        tourVisto: true,
        diagnostico,
        pontuacoes: diagnostico.pontuacoes,
        historico: [{ data: diagnostico.data, pontuacoes: diagnostico.pontuacoes }],
        trilha: ordenarTrilha(diagnostico.pontuacoes),
        xp: e.xp + XP.diagnostico,
      }));
    }
  },

  salvarAvatar(avatar: AvatarConfig) {
    atualizar((e) => ({ ...e, avatar }));
  },

  concluirTour() {
    atualizar((e) => (e.tourVisto ? e : { ...e, tourVisto: true }));
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
      ...comDiaAtivo(e),
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
        ...comDiaAtivo(e),
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
        ...comDiaAtivo(e),
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
        ...comDiaAtivo(e),
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

/**
 * Para onde levar a pessoa depois de entrar ou criar a conta: contas novas veem o tour primeiro
 * (o modo demonstração, sem conta, pula direto), depois o diagnóstico e só então o painel.
 */
export function proximaTela(e: Estado | null | undefined): string {
  if (!e) return "/";
  if (e.usuarioId && !e.tourVisto) return "/bem-vindo";
  return e.diagnostico ? "/inicio" : "/diagnostico";
}
