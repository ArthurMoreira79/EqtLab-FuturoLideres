"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Check, Hammer, Lock, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Clara, type PoseClara } from "@/components/jogo";
import { cx } from "@/components/ui";
import { forcasEAtencao } from "@/lib/competencias";
import type { Estado } from "@/lib/estado";
import { montarUnidades, progressoModulo, type No, type Unidade, type TipoNo } from "@/lib/trilha";

/**
 * Trilha em “caminho” (como o aprender do Duolingo, só que azul): cada passo de um módulo
 * (lição, quiz, desafio) é um ponto. O ponto atual pulsa; os seguintes ficam travados.
 * A Clara acompanha o caminho: fica no ponto atual, pula até o ponto que você aponta e comenta.
 */

export { montarUnidades } from "@/lib/trilha";

const ICONE: Record<Exclude<TipoNo, "desafio">, LucideIcon> = { licao: BookOpen, quiz: Target, producao: Hammer };
const ROTULO: Record<TipoNo, string> = { licao: "Lição", quiz: "Quiz", desafio: "Desafio", producao: "Em produção" };
const XP_DO_PASSO: Record<TipoNo, number> = { licao: 10, quiz: 20, desafio: 60, producao: 0 };

/** Deslocamento horizontal de cada ponto: desenha o zigue-zague do caminho. */
const ONDA = [0, 26, 44, 26, 0, -26, -44, -26];

/* ───────────── baú (desafio prático) ───────────── */

function Bau({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className} strokeLinejoin="round" strokeLinecap="round">
      <path d="M6 25V20C6 12 14 7 24 7s18 5 18 13v5z" fill="#ffc531" stroke="#a86b00" strokeWidth="2" />
      <rect x="6" y="24" width="36" height="18" rx="3" fill="#e8a317" stroke="#a86b00" strokeWidth="2" />
      <rect x="6" y="22" width="36" height="5" fill="#c98a00" stroke="#a86b00" strokeWidth="2" />
      <rect x="20" y="23" width="8" height="10" rx="2" fill="#6b4300" />
      <circle cx="24" cy="27.5" r="1.6" fill="#ffd23f" />
    </svg>
  );
}

/* ───────────── ponto do caminho ───────────── */

function Ponto({
  no,
  deslocamento,
  unidade,
  aoApontar,
  aoTocarTravado,
}: {
  no: No;
  deslocamento: number;
  unidade: Unidade;
  aoApontar: (no: No | null) => void;
  aoTocarTravado: (no: No) => void;
}) {
  const bloqueado = no.situacao === "bloqueado";
  const ehBau = no.tipo === "desafio";
  const rotulo = `Etapa ${no.numero} de ${unidade.nos.length} · ${ROTULO[no.tipo]}: ${no.titulo}${no.situacao === "feito" ? " (concluído)" : bloqueado ? " (bloqueado)" : ""}`;
  const Icone = no.situacao === "feito" ? Check : bloqueado && no.tipo !== "producao" ? Lock : ICONE[no.tipo === "desafio" ? "licao" : no.tipo];

  const visual = ehBau ? (
    <span
      className={cx(
        "relative grid size-[84px] place-items-center rounded-full transition-transform",
        no.situacao === "atual" && "animate-pulsar bg-[#fff3c4]/70 ring-[6px] ring-[#ffe28a] hover:scale-105 dark:bg-[#3a3200]/60 dark:ring-[#6b5a00]",
        bloqueado && "grayscale",
      )}
    >
      <Bau className={cx("size-[68px] drop-shadow-[0_5px_0_rgba(168,107,0,0.35)]", bloqueado && "opacity-50")} />
      {no.situacao === "feito" && (
        <span className="absolute -right-0.5 -top-0.5 grid size-7 place-items-center rounded-full bg-[#1b8fe6] text-white shadow-[0_3px_0_#0f66b4]">
          <Check aria-hidden className="size-4" strokeWidth={4} />
        </span>
      )}
      {bloqueado && <Lock aria-hidden className="absolute bottom-1 right-1 size-5 text-[#9bb0c2] dark:text-muted" />}
    </span>
  ) : (
    <span
      className={cx(
        "relative grid size-[76px] place-items-center rounded-full text-white transition-transform",
        no.situacao === "feito" && "bg-[#1b8fe6] shadow-[0_6px_0_#0f66b4]",
        no.situacao === "atual" && "animate-pulsar bg-[#1cb0f6] shadow-[0_6px_0_#0f8fcf] ring-[6px] ring-[#bfe8ff] hover:scale-105 dark:ring-[#2a5f8f]",
        bloqueado && "bg-[#dbe7f2] text-[#9bb0c2] shadow-[0_6px_0_#c3d4e4] dark:bg-line dark:text-muted dark:shadow-[0_6px_0_#161a52]",
      )}
    >
      <Icone aria-hidden className="size-8" strokeWidth={no.situacao === "feito" ? 3.5 : 2.4} />
    </span>
  );

  const eventos = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && aoApontar(no),
    onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && aoApontar(null),
    onFocus: () => aoApontar(no),
    onBlur: () => aoApontar(null),
  };

  return (
    <li className="flex min-w-0 flex-col items-center">
      {/* âncora do tamanho do círculo: o avatar mede a posição a partir dele */}
      <div className="relative" style={{ transform: `translateX(calc(${deslocamento}px - var(--recuo-etapa)))` }} data-no={no.id}>
        {no.situacao === "atual" && (
          <span className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 animate-quicar whitespace-nowrap rounded-xl border-2 border-[#cfe9fb] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1478d0] shadow-[0_3px_0_#cfe9fb] dark:border-line dark:bg-card dark:text-ciano dark:shadow-none">
            Começar
            <span aria-hidden className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#cfe9fb] bg-white dark:border-line dark:bg-card" />
          </span>
        )}
        {no.href && !bloqueado ? (
          <Link href={no.href} aria-label={rotulo} title={no.titulo} className="block rounded-full outline-offset-4" {...eventos}>
            {visual}
          </Link>
        ) : (
          <button
            type="button"
            aria-label={rotulo}
            aria-disabled="true"
            title={no.titulo}
            onClick={() => aoTocarTravado(no)}
            className="block cursor-not-allowed rounded-full outline-offset-4"
            {...eventos}
          >
            {visual}
          </button>
        )}
      </div>

      {no.situacao === "atual" && no.href && <CartaoDoPasso no={no} unidade={unidade}  />}
    </li>
  );
}

/** “Lição 3 de 6 · COMEÇAR +10 XP”, como o cartão que abre no ponto atual do Duolingo. */
function CartaoDoPasso({ no, unidade }: { no: No; unidade: Unidade }) {
  const indice = unidade.nos.filter((n) => n.tipo === "licao").findIndex((n) => n.id === no.id);
  const sobre =
    no.tipo === "licao" ? `Lição ${indice + 1} de ${unidade.modulo.licoes.length}` : no.tipo === "quiz" ? "Quiz rápido" : "Desafio prático";
  return (
    <div
      className="relative mt-16 w-[min(280px,calc(100vw-3rem))] sm:mt-36 animate-pop rounded-2xl bg-[linear-gradient(120deg,#1478d0,#1cb0f6)] p-4 text-white shadow-[0_4px_0_#0b4f91]"
    >
      <span aria-hidden className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-sm bg-[#1478d0]" />
      <p className="font-extrabold leading-tight">{no.titulo}</p>
      <p className="text-sm font-semibold text-white/85">Etapa {no.numero} de {unidade.nos.length} · {sobre}</p>
      <Link
        href={no.href!}
        className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-white text-sm font-extrabold uppercase tracking-wider text-[#1478d0] shadow-[0_4px_0_#9fd6f7] transition-[transform,box-shadow] active:translate-y-1 active:shadow-none"
      >
        Começar +{XP_DO_PASSO[no.tipo]} XP
      </Link>
    </div>
  );
}

/* ───────────── cabeçalho de cada módulo ───────────── */

function CabecalhoUnidade({ u, total, estado, forte }: { u: Unidade; total: number; estado: Estado; forte: boolean }) {
  const emProducao = u.status === "producao";
  const { fracao } = progressoModulo(estado, u.modulo);
  const emCurso = u.status === "andamento" || u.status === "disponivel";
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 rounded-2xl p-4 text-white",
        emProducao || u.status === "bloqueado"
          ? "bg-[#9db3c9] shadow-[0_4px_0_#7f97ae] dark:bg-line dark:shadow-none"
          : "bg-[linear-gradient(110deg,#1478d0,#1cb0f6)] shadow-[0_4px_0_#0b4f91]",
      )}
    >
      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 text-xs font-extrabold uppercase tracking-wider text-white/85">
          Módulo {u.numero} de {total}
          {emProducao && " · em produção"}
          {u.status === "concluido" && " · concluído"}
          {emCurso && fracao > 0 && ` · ${Math.round(fracao * 100)}%`}
          {forte && !emProducao && <span className="rounded-full bg-white/20 px-2 py-0.5 normal-case tracking-normal">Ponto forte</span>}
        </span>
        <p className="truncate text-lg font-extrabold leading-tight sm:text-xl">{u.modulo.titulo}</p>
      </div>
      {!emProducao && u.status !== "bloqueado" && (
        <Link
          href={`/trilha/${u.modulo.id}`}
          aria-label={`Abrir o módulo ${u.modulo.titulo}`}
          className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-white/80 bg-white/15 transition-colors hover:bg-white/25"
        >
          <BookOpen aria-hidden className="size-5" />
        </Link>
      )}
    </div>
  );
}

/* ───────────── avatar ───────────── */

const POSES_OCIOSAS: PoseClara[] = ["apontando", "acenando", "positivo", "tablet"];

interface PosicaoAvatar {
  x: number;
  y: number;
  /** Lado do ponto em que ela fica: "d" = à direita (aponta para a esquerda), "e" = à esquerda (espelhada). */
  lado: "d" | "e";
  /** Canto do avatar em que o balão de fala se prende, para ele nunca sair da tela. */
  balao: "esquerda" | "direita";
}

const LARGURA_BALAO = 170;

function falaPara(no: No, ehAtual: boolean): string {
  if (ehAtual) return "Esse é o seu próximo passo. Bora?";
  if (no.situacao === "feito") return "Esse você já concluiu. Boa!";
  if (no.tipo === "producao") return "Esse módulo chega em breve.";
  return "Ainda travado: conclua os passos anteriores.";
}

/* ───────────── trilha ───────────── */

export function CaminhoTrilha({ estado, modo = "painel" }: { estado: Estado; modo?: "painel" | "completo" }) {
  const { unidades, proximo, emProducao } = montarUnidades(estado);
  const total = unidades.length;
  const concluidas = unidades.filter((u) => u.status === "concluido").length;
  const fortes = estado.diagnostico ? forcasEAtencao(estado.diagnostico.pontuacoes).forcas : [];

  const visiveis = unidades;
  const todosPontosFeitos = !proximo;

  const raizRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const alvoRef = useRef<string | null>(proximo?.id ?? null);
  const falaTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [pos, setPos] = useState<PosicaoAvatar | null>(null);
  const [alvoId, setAlvoId] = useState<string | null>(proximo?.id ?? null);
  const [fala, setFala] = useState<{ texto: string; id: string } | null>(null);
  const [abanando, setAbanando] = useState(0);
  const [poseOciosa, setPoseOciosa] = useState(0);

  const medir = useCallback((id: string | null): PosicaoAvatar | null => {
    const raiz = raizRef.current;
    if (!raiz || !id) return null;
    const ancora = raiz.querySelector<HTMLElement>(`[data-no="${id}"]`);
    if (!ancora) return null;
    const r = raiz.getBoundingClientRect();
    const c = ancora.getBoundingClientRect();
    // O caminho reserva uma faixa à direita: a Clara nunca troca para a esquerda do botão.
    const x = c.right - r.left + 12;
    const balao = x + LARGURA_BALAO <= r.width ? "esquerda" : "direita";
    // Alinha o rosto abaixo do início do ponto; o balão fica abaixo do cabeçalho do módulo.
    return { x, y: c.top - r.top + 12, lado: "d", balao };

  }, []);

  const irPara = useCallback(
    (id: string | null) => {
      alvoRef.current = id;
      setAlvoId(id);
      const p = medir(id);
      if (p) setPos(p);
    },
    [medir],
  );

  // Posiciona o avatar no ponto atual e o acompanha quando a página muda de tamanho.
  useEffect(() => {
    const raiz = raizRef.current;
    if (!raiz) return;
    const obs = new ResizeObserver(() => {
      const p = medir(alvoRef.current);
      if (p) setPos(p);
    });
    obs.observe(raiz);
    return () => obs.disconnect();
  }, [medir]);

  // A Clara acompanha o próximo passo quando o progresso muda, inclusive ao trocar de módulo.
  const proximoId = proximo?.id ?? null;
  useEffect(() => {
    const frame = requestAnimationFrame(() => { irPara(proximoId); setFala(null); });
    return () => cancelAnimationFrame(frame);
  }, [proximoId, irPara]);

  // Na página da trilha, leva a tela até o ponto atual.
  useEffect(() => {
    if (modo !== "completo" || !proximo) return;
    const id = requestAnimationFrame(() => {
      raizRef.current?.querySelector(`[data-no="${proximo.id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
    // só na primeira abertura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parada no ponto atual, a Clara alterna de pose de tempos em tempos.
  useEffect(() => {
    const t = setInterval(() => setPoseOciosa((i) => (i + 1) % POSES_OCIOSAS.length), 3600);
    return () => {
      clearInterval(t);
      clearTimeout(falaTimer.current);
    };
  }, []);

  const nosPorId = new Map(unidades.flatMap((u) => u.nos).map((n) => [n.id, n]));

  function apontar(no: No | null) {
    clearTimeout(falaTimer.current);
    if (no) {
      irPara(no.id);
      setFala({ texto: falaPara(no, no.id === proximo?.id), id: no.id });
    } else {
      irPara(proximo?.id ?? null);
      setFala(null);
    }
  }

  function tocarTravado(no: No) {
    irPara(no.id);
    setFala({ texto: falaPara(no, false), id: no.id });
    setAbanando((n) => n + 1);
    clearTimeout(falaTimer.current);
    falaTimer.current = setTimeout(() => {
      irPara(proximo?.id ?? null);
      setFala(null);
    }, 2600);
  }

  const noAlvo = alvoId ? nosPorId.get(alvoId) : undefined;
  const noAtual = !!proximo && alvoId === proximo.id;
  const falando = fala ?? (noAlvo && noAtual ? { texto: falaPara(noAlvo, true), id: noAlvo.id } : null);
  const pose: PoseClara = !noAtual || fala ? "apontando" : POSES_OCIOSAS[poseOciosa];

  let contador = 0;

  return (
    <section aria-label="Sua trilha" className="flex flex-col gap-6">
      {concluidas > 0 && (
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-[#ddf4ff] px-3.5 py-1.5 text-sm font-extrabold text-[#1478d0] dark:bg-selected dark:text-ciano">
          <Check aria-hidden className="size-4" strokeWidth={3} />
          {concluidas} {concluidas === 1 ? "módulo concluído" : "módulos concluídos"}
        </p>
      )}

      <div ref={raizRef} className="relative flex flex-col gap-6 [--recuo-etapa:50px] sm:[--recuo-etapa:80px]">
        {visiveis.map((u) => {
          const nos = u.nos;
          return (
            <div key={u.modulo.id} className="flex flex-col gap-8">
              <CabecalhoUnidade u={u} total={total} estado={estado} forte={fortes.includes(u.modulo.competencia)} />
              <ol className="flex flex-col gap-7 pb-2 pt-10" aria-label={`Passos de ${u.modulo.titulo}`}>
                {nos.map((n) => (
                  <Ponto
                    key={n.id}
                    no={n}
                    unidade={u}
                    deslocamento={ONDA[contador++ % ONDA.length]}
                    aoApontar={apontar}
                    aoTocarTravado={tocarTravado}
                  />
                ))}
              </ol>
            </div>
          );
        })}

        {/* Avatar: decorativo (os pontos já têm nome acessível) */}
        {pos && (
          <div
            ref={avatarRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20 w-[88px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.4,0.64,1)] sm:w-[140px]"
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          >
            {falando && (
              <div
                key={falando.id + falando.texto}
                className={cx(
                  "absolute -top-14 z-10 w-max max-w-[170px] animate-pop rounded-2xl border-2 border-[#cfe9fb] bg-white px-3 py-2 text-xs font-extrabold leading-snug text-[#14174f] shadow-[0_3px_0_#cfe9fb] dark:border-line dark:bg-card dark:text-ink dark:shadow-none",
                  pos.balao === "esquerda" ? "left-0" : "right-0",
                )}
              >
                {falando.texto}
                <span
                  className={cx(
                    "absolute -bottom-[7px] size-3 rotate-45 border-b-2 border-r-2 border-[#cfe9fb] bg-white dark:border-line dark:bg-card",
                    pos.balao === "esquerda" ? "left-6" : "right-6",
                  )}
                />
              </div>
            )}
            {/* pulo ao chegar num ponto novo; balançar de cabeça num ponto travado; flutuar suave parada */}
            <div key={`pulo-${alvoId}`} className="origin-bottom animate-saltar">
              <div key={`nao-${abanando}`} className={cx("origin-bottom", abanando > 0 && "animate-abanar")}>
                <div className={cx("animate-flutuar", pos.lado === "e" && "-scale-x-100")}>
                  <span key={pose} className="block animate-pop">
                    <Clara pose={pose} largura={140} className="w-full [&_img]:!w-full" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {emProducao.length > 0 && <details className="rounded-2xl border border-line bg-card p-4">
        <summary className="min-h-10 cursor-pointer text-sm font-bold text-muted">Em produção · próximos temas</summary>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{emProducao.map((m) => <li key={m.id} className="flex items-center gap-2 rounded-xl bg-sunken p-3 text-sm text-muted"><Hammer aria-hidden className="size-4 shrink-0" />{m.titulo}</li>)}</ul>
      </details>}
      {todosPontosFeitos && (
        <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-center">
          <Trophy aria-hidden className="size-10 text-[#f5b301]" />
          <p className="font-extrabold">Você concluiu todos os módulos disponíveis!</p>
          <p className="text-sm text-muted">Novos módulos chegam em breve. Enquanto isso, mantenha a constância nas missões diárias.</p>
        </div>
      )}
    </section>
  );
}
