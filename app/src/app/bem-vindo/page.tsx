"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Flame, Lock, MessageSquareText, Sparkles, Target, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Clara, type PoseClara } from "@/components/jogo";
import { cx } from "@/components/ui";
import { acoes, useEstado } from "@/lib/estado";

/** Texto com trechos em destaque (amarelo), como nos pôsteres. */
type Trecho = string | { d: string };

interface Passo {
  linhas: string[];
  texto: Trecho[];
  pose: PoseClara;
  recurso: { Icone: LucideIcon; nome: string };
  Previa?: () => React.JSX.Element;
}

/* ───────────── mini-prévias de cada recurso ───────────── */

const CARTAO_PREVIA =
  "w-full max-w-sm rounded-2xl bg-white p-4 text-[#14174f] shadow-[0_5px_0_rgba(5,25,110,0.35)]";

function PreviaTrilha() {
  const nos = [
    { tipo: "ok", Icone: Check },
    { tipo: "ok", Icone: Check },
    { tipo: "atual", Icone: BookOpen },
    { tipo: "trava", Icone: Lock },
    { tipo: "trava", Icone: Lock },
  ] as const;
  return (
    <div className={cx(CARTAO_PREVIA, "flex items-end justify-between gap-2 pt-8")} aria-hidden>
      {nos.map(({ tipo, Icone }, i) => (
        <div key={i} className={cx("relative", i % 2 ? "-translate-y-3" : "translate-y-1")}>
          {tipo === "atual" && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg border-2 border-[#cfe9fb] bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#1478d0]">
              Começar
            </span>
          )}
          <span
            className={cx(
              "grid size-12 place-items-center rounded-full text-white shadow-[0_4px_0_rgba(20,23,79,0.25)]",
              tipo === "ok" && "bg-[#1b8fe6]",
              tipo === "atual" && "animate-pulsar bg-[#1cb0f6]",
              tipo === "trava" && "bg-[#dbe7f2] text-[#9bb0c2]",
            )}
          >
            <Icone className="size-5" strokeWidth={tipo === "ok" ? 3 : 2} />
          </span>
        </div>
      ))}
    </div>
  );
}

function PreviaMissao() {
  return (
    <div className={cx(CARTAO_PREVIA, "flex flex-col gap-2")} aria-hidden>
      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1478d0]">Missão do dia · 5–10 min</span>
      <p className="font-bold leading-snug">Um liderado sênior questiona sua decisão na frente da equipe. O que você faz?</p>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-[#e1f3ff] px-2.5 py-1 text-xs font-bold text-[#0b5a96]">+40 XP</span>
        <span className="rounded-xl bg-[#1478d0] px-3 py-2 text-xs font-extrabold uppercase text-white shadow-[0_3px_0_#0b4f91]">
          Resolver agora
        </span>
      </div>
    </div>
  );
}

function PreviaFeedback() {
  return (
    <div className={cx(CARTAO_PREVIA, "flex flex-col gap-2.5")} aria-hidden>
      <div className="flex items-center justify-between">
        <span className="font-extrabold">Seu feedback</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f1e8fc] px-2.5 py-1 text-xs font-bold text-[#7c3cb8]">
          <Sparkles className="size-3.5" /> Gerado por IA
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-[#e1f3ff] p-2.5">
          <b className="uppercase text-[#0b5a96]">Pontos fortes</b>
          <p className="mt-1">Você usou um exemplo concreto.</p>
        </div>
        <div className="rounded-xl bg-[#f1e8fc] p-2.5">
          <b className="uppercase text-[#7c3cb8]">Melhorar</b>
          <p className="mt-1">Combine o próximo passo.</p>
        </div>
      </div>
    </div>
  );
}

function PreviaConstancia() {
  const dias = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div className={cx(CARTAO_PREVIA, "flex flex-col gap-3")} aria-hidden>
      <div className="flex items-center gap-2 font-extrabold">
        <Flame className="size-5 text-[#ff8a00]" fill="currentColor" /> 4 de 7 dias nesta semana
      </div>
      <div className="flex justify-between">
        {dias.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 text-xs font-extrabold text-[#6b8fa8]">
            {d}
            <span
              className={cx(
                "grid size-8 place-items-center rounded-full",
                i < 4 ? "bg-[#1b8fe6] text-white" : i === 4 ? "border-[3px] border-dashed border-[#1b8fe6]" : "bg-[#e6eef5]",
              )}
            >
              {i < 4 && <Check className="size-4" strokeWidth={3} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviaComunidade() {
  return (
    <div className={cx(CARTAO_PREVIA, "flex flex-col gap-2")} aria-hidden>
      <p className="font-bold leading-snug">Dois técnicos não se falam. Intervenho ou espero?</p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-[#53688a]">Anônimo · 3 respostas</span>
        <span className="rounded-full bg-[#e1f3ff] px-2.5 py-1 font-bold text-[#0b5a96]">Melhor resposta</span>
      </div>
    </div>
  );
}

function PreviaComecar() {
  const itens = [
    { n: "1", t: "Diagnóstico rápido", x: "+50 XP" },
    { n: "2", t: "Sua trilha personalizada", x: "" },
    { n: "3", t: "Primeira missão do dia", x: "+40 XP" },
  ];
  return (
    <ol className={cx(CARTAO_PREVIA, "flex flex-col gap-2")} aria-hidden>
      {itens.map((i) => (
        <li key={i.n} className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-[#1478d0] text-xs font-extrabold text-white">{i.n}</span>
          <span className="flex-1 font-bold">{i.t}</span>
          {i.x && <span className="rounded-full bg-[#e1f3ff] px-2 py-0.5 text-xs font-bold text-[#0b5a96]">{i.x}</span>}
        </li>
      ))}
    </ol>
  );
}

const PASSOS: Passo[] = [
  {
    linhas: ["Boas-vindas", "ao Futuro", "Líderes"],
    texto: ["Eu sou a Clara, sua mentora. Em ", { d: "1 minuto" }, " você entende como o site funciona e já começa a praticar."],
    pose: "acenando",
    recurso: { Icone: Sparkles, nome: "Vamos lá!" },
  },
  {
    linhas: ["Sua trilha,", "nível a nível"],
    texto: ["Cada ponto do caminho é um passo: ", { d: "lições curtas, um quiz e um desafio prático" }, ". Conclua um para destravar o próximo."],
    pose: "apontando",
    recurso: { Icone: Trophy, nome: "Trilha" },
    Previa: PreviaTrilha,
  },
  {
    linhas: ["Missão", "do dia"],
    texto: ["Todo dia, uma situação real de liderança em ", { d: "5 a 10 minutos" }, ". Você responde com as suas palavras e ganha XP."],
    pose: "tablet",
    recurso: { Icone: Target, nome: "Missão" },
    Previa: PreviaMissao,
  },
  {
    linhas: ["Feedback", "da IA"],
    texto: ["A IA avalia a sua resposta pela rubrica e mostra ", { d: "pontos fortes, o que melhorar e um exemplo mais forte" }, ". Discordou? É só contestar."],
    pose: "positivo",
    recurso: { Icone: MessageSquareText, nome: "Feedback" },
    Previa: PreviaFeedback,
  },
  {
    linhas: ["Constância", "sem pressão"],
    texto: ["Veja em quais ", { d: "dias da semana" }, " você praticou. Perdeu um dia? A sequência ", { d: "congela" }, " em vez de zerar."],
    pose: "apontando",
    recurso: { Icone: Flame, nome: "Constância" },
    Previa: PreviaConstancia,
  },
  {
    linhas: ["Troque", "experiências"],
    texto: ["Na comunidade você conversa com outros líderes, inclusive ", { d: "de forma anônima" }, ". Quem ajuda muito ganha o selo de Mentor."],
    pose: "tablet",
    recurso: { Icone: Users, nome: "Comunidade" },
    Previa: PreviaComunidade,
  },
  {
    linhas: ["Vamos", "começar?"],
    texto: ["Primeiro, um ", { d: "diagnóstico rápido" }, " para montar a sua trilha. Leva poucos minutos e já rende XP."],
    pose: "positivo",
    recurso: { Icone: Check, nome: "Pronto!" },
    Previa: PreviaComecar,
  },
];

const BOTAO_AMARELO =
  "inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#ffd400] px-8 text-base font-extrabold uppercase tracking-wider text-[#0b1f5c] shadow-[0_4px_0_#c79a00] transition-[transform,box-shadow] hover:bg-[#ffe14d] active:translate-y-1 active:shadow-none";

export default function BemVindo() {
  const estado = useEstado();
  const router = useRouter();
  const [i, setI] = useState(0);
  const passo = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;

  useEffect(() => {
    if (estado === null) router.replace("/");
  }, [estado, router]);

  function terminar() {
    acoes.concluirTour();
    router.push(estado?.diagnostico ? "/inicio" : "/diagnostico");
  }

  // Setas do teclado
  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setI((x) => Math.min(PASSOS.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-clip bg-[linear-gradient(170deg,#1f66ff_0%,#0d44d6_55%,#0a2fa8_100%)] text-white">
      {/* anéis de luz atrás da Clara, como nos pôsteres */}
      <span aria-hidden className="absolute -bottom-40 -right-32 -z-10 size-[620px] rounded-full border-[3px] border-[#7fd4ff]/50 shadow-[0_0_60px_#4fc3ff,inset_0_0_60px_#4fc3ff44]" />
      <span aria-hidden className="absolute -bottom-10 -right-4 -z-10 size-[420px] rounded-full border-2 border-white/20" />

      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 pt-5 sm:px-8">
        <div className="flex items-center justify-between">
          <Image src="/eqt-lab-logo.png" alt="EQT Lab by Equatorial" width={364} height={90} priority style={{ width: 110, height: "auto" }} />
          <button
            type="button"
            onClick={terminar}
            className="min-h-11 px-2 text-sm font-extrabold uppercase tracking-wider text-white underline decoration-2 underline-offset-4 hover:opacity-80"
          >
            Pular
          </button>
        </div>
        <div className="flex gap-1.5" role="progressbar" aria-label="Progresso do tour" aria-valuemin={1} aria-valuemax={PASSOS.length} aria-valuenow={i + 1}>
          {PASSOS.map((_, n) => (
            <span key={n} className={cx("h-2 flex-1 rounded-full transition-colors", n <= i ? "bg-[#ffd400]" : "bg-white/25")} />
          ))}
        </div>
      </header>

      <main key={i} className="mx-auto grid w-full max-w-5xl flex-1 animate-entrar items-center gap-6 px-5 py-6 sm:px-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-5">
          <h1 className="flex flex-col items-start gap-1.5">
            {passo.linhas.map((l) => (
              <span
                key={l}
                className="bg-[#ffd400] px-3 py-1 text-3xl font-extrabold uppercase leading-tight tracking-tight text-[#0b1f5c] sm:text-4xl md:text-5xl"
              >
                {l}
              </span>
            ))}
          </h1>

          <p className="max-w-md rounded-2xl border-2 border-white/80 bg-white/5 p-4 text-lg leading-relaxed backdrop-blur-sm">
            {passo.texto.map((t, n) =>
              typeof t === "string" ? (
                t
              ) : (
                <strong key={n} className="font-extrabold text-[#ffd400]">
                  {t.d}
                </strong>
              ),
            )}
          </p>

          {passo.Previa && <passo.Previa />}
        </div>

        <div className="relative mx-auto flex w-full max-w-sm justify-center md:justify-end">
          <div className="absolute left-0 top-2 z-10 -rotate-3 md:-left-6">
            <div className="relative rounded-3xl border-4 border-white bg-[#0a39c4] px-4 py-2.5 shadow-[0_6px_0_rgba(0,0,0,0.2)]">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-white/80">Como funciona</span>
              <span className="flex items-center gap-1.5 text-xl font-extrabold leading-tight text-[#ffd400]">
                <passo.recurso.Icone aria-hidden className="size-5" /> {passo.recurso.nome}
              </span>
              <span aria-hidden className="absolute -bottom-2.5 left-6 size-4 rotate-45 border-b-4 border-r-4 border-white bg-[#0a39c4]" />
            </div>
          </div>
          <Clara pose={passo.pose} largura={230} className="mt-10 md:hidden" />
          <Clara pose={passo.pose} largura={360} className="hidden md:inline-block" />
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 pb-6 pt-3 sm:px-8">
        <button
          type="button"
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          aria-label="Passo anterior"
          className="grid size-14 place-items-center rounded-2xl border-2 border-white/60 text-white transition-opacity hover:bg-white/10 disabled:opacity-30"
        >
          <ArrowLeft aria-hidden className="size-6" />
        </button>
        <span className="text-sm font-extrabold">
          {i + 1} / {PASSOS.length}
        </span>
        {ultimo ? (
          <button type="button" onClick={terminar} className={BOTAO_AMARELO}>
            {estado?.diagnostico ? "Voltar ao painel" : "Fazer o diagnóstico"}
          </button>
        ) : (
          <button type="button" onClick={() => setI((x) => x + 1)} className={BOTAO_AMARELO}>
            Continuar <ArrowRight aria-hidden className="size-5" />
          </button>
        )}
      </footer>
    </div>
  );
}
