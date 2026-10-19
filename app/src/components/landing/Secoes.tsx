"use client";

import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Gamepad2,
  MessageCircleHeart,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Users,
  UsersRound,
  Video,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Revelar } from "@/components/animacoes";
import { CARTAO_JOGO } from "@/components/jogo";
import { cx } from "@/components/ui";

const atraso = (ms: number) => ({ animationDelay: `${ms}ms` });

/* ───────────── Barra de progresso da rolagem ───────────── */

export function BarraDeRolagem() {
  const barra = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let quadro = 0;
    const atualizar = () => {
      quadro = 0;
      const total = document.documentElement.scrollHeight - innerHeight;
      const p = total > 0 ? Math.min(1, scrollY / total) : 0;
      if (barra.current) barra.current.style.transform = `scaleX(${p})`;
    };
    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };
    atualizar();
    addEventListener("scroll", aoRolar, { passive: true });
    addEventListener("resize", aoRolar);
    return () => {
      removeEventListener("scroll", aoRolar);
      removeEventListener("resize", aoRolar);
      cancelAnimationFrame(quadro);
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-1.5">
      <div ref={barra} className="h-full origin-left scale-x-0 bg-gradient-to-r from-[#1cb0f6] via-[#5fd0ff] to-[#ffd23f]" />
    </div>
  );
}

/* ───────────── Faixa que rola ───────────── */

const RECURSOS: { Icone: LucideIcon; texto: string }[] = [
  { Icone: Sparkles, texto: "IA integrada" },
  { Icone: MessageCircleHeart, texto: "Chat com a Clara" },
  { Icone: Target, texto: "Missões diárias" },
  { Icone: Video, texto: "Reunião da área" },
  { Icone: Users, texto: "Comunidade" },
  { Icone: UsersRound, texto: "Rede de equipes" },
  { Icone: Gamepad2, texto: "Sala de jogos" },
  { Icone: UserRound, texto: "Avatar personalizado" },
  { Icone: Flame, texto: "Sequência diária" },
  { Icone: Trophy, texto: "XP e níveis" },
];

export function FaixaDeRecursos() {
  const lista = [...RECURSOS, ...RECURSOS];
  return (
    <section aria-label="Recursos da plataforma" className="relative z-10 -mt-1 overflow-hidden border-y-4 border-[#0b4f91] bg-[#1b8fe6] py-4 dark:border-[#2fa6d4] dark:bg-[#1478d0]">
      <ul className="flex w-max animate-marquee gap-4 motion-reduce:animate-none hover:[animation-play-state:paused]">
        {lista.map(({ Icone, texto }, i) => (
          <li
            key={i}
            aria-hidden={i >= RECURSOS.length}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 font-extrabold text-[#1478d0] shadow-[0_4px_0_#9fd6f7]"
          >
            <Icone aria-hidden className="size-5" /> {texto}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────── Frase de destaque ───────────── */

function Palavras({ texto, inicio, destaque }: { texto: string; inicio: number; destaque?: string }) {
  return (
    <>
      {texto.split(" ").map((palavra, i) => (
        <span key={i}>
          <span
            style={atraso(inicio + i * 110)}
            className={cx("inline-block opacity-0 group-data-[visivel=true]/rev:animate-pop", destaque && palavra === destaque && "text-[#ffd23f]")}
          >
            {palavra}
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export function FraseDestaque() {
  const flutuantes = [
    { Icone: Zap, cls: "left-[6%] top-[18%]", cor: "#ffd23f" },
    { Icone: Flame, cls: "right-[8%] top-[14%]", cor: "#ff9f1c" },
    { Icone: Trophy, cls: "left-[12%] bottom-[14%]", cor: "#ffe27a" },
    { Icone: Gamepad2, cls: "right-[10%] bottom-[18%]", cor: "#ffffff" },
  ];
  return (
    <Revelar como="section" className="relative isolate overflow-hidden bg-[linear-gradient(130deg,#1478d0_0%,#1b8fe6_55%,#1cb0f6_100%)] px-5 py-20 text-center text-white sm:px-8 sm:py-28">
      <span aria-hidden className="absolute -left-24 -top-24 -z-10 size-80 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-32 -right-16 -z-10 size-96 rounded-full bg-white/10" />
      {flutuantes.map(({ Icone, cls, cor }, i) => (
        <Icone
          key={i}
          aria-hidden
          className={cx("absolute -z-10 hidden size-12 animate-flutuar sm:block", cls)}
          style={{ color: cor, animationDelay: `${-i * 900}ms`, opacity: 0.85 }}
          fill="currentColor"
        />
      ))}
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
        <span className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.2em]">A nossa ideia</span>
        <p className="font-display text-4xl font-extrabold italic leading-tight sm:text-6xl">
          <span className="block">
            <Palavras texto="Não treinamos apenas líderes." inicio={200} />
          </span>
          <span className="relative mt-2 block">
            <Palavras texto="Mostramos a rotina de liderança." inicio={900} destaque="rotina" />
            <span
              aria-hidden
              style={{ transitionDelay: "2000ms" }}
              className="absolute -bottom-1 left-0 h-2 w-full origin-left scale-x-0 rounded-full bg-[#ffd23f] transition-transform duration-700 group-data-[visivel=true]/rev:scale-x-100"
            />
          </span>
        </p>
        <p style={atraso(1600)} className="max-w-2xl text-lg leading-relaxed text-white/90 opacity-0 group-data-[visivel=true]/rev:animate-entrar">
          Cada recurso daqui nasceu de algo que você vive na segunda-feira de manhã: dar um feedback difícil, entrar numa reunião,
          pedir ajuda, treinar com a equipe.
        </p>
      </div>
    </Revelar>
  );
}

/* ───────────── Rotina do líder (linha do tempo) ───────────── */

const ROTINA: { hora: string; Icone: LucideIcon; cor: string; titulo: string; texto: string }[] = [
  { hora: "08:30", Icone: Target, cor: "#1b8fe6", titulo: "Missão do dia", texto: "Uma situação real, em 5 a 10 minutos. Você responde e a IA devolve o feedback na hora." },
  { hora: "10:00", Icone: MessageCircleHeart, cor: "#a455ee", titulo: "Pergunte à Clara", texto: "Travou numa conversa difícil? Escreva ou fale com a mentora com IA." },
  { hora: "11:30", Icone: Video, cor: "#00a3a3", titulo: "Reunião da área", texto: "Entre na sala do seu time no Meet ou no Teams direto da comunidade." },
  { hora: "14:00", Icone: Users, cor: "#16a34a", titulo: "Comunidade", texto: "Peça ajuda a outros líderes, inclusive de forma anônima." },
  { hora: "15:30", Icone: UsersRound, cor: "#ec4899", titulo: "Sua equipe", texto: "Cuide da rede: convites, grupo e o registro do último 1:1." },
  { hora: "17:00", Icone: Gamepad2, cor: "#f59e0b", titulo: "Sala de jogos", texto: "Quiz ao vivo com código ou QR code. No fim, o ranking da turma." },
  { hora: "18:00", Icone: Trophy, cor: "#1478d0", titulo: "Evolução", texto: "XP, sequência e nível sobem. Seu avatar comemora com você." },
];

export function RotinaDoLider() {
  return (
    <section aria-labelledby="titulo-rotina" className="flex flex-col items-center gap-10">
      <Revelar className="flex max-w-2xl flex-col gap-2 text-center">
        <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#1b8fe6] dark:text-ciano">Um dia de quem lidera</span>
        <h2 id="titulo-rotina" className="text-3xl font-extrabold sm:text-4xl">
          A rotina de liderança, dentro do jogo
        </h2>
        <p className="text-lg text-muted">Do café da manhã ao fim do expediente, o Conecta Líderes acompanha o que você realmente faz.</p>
      </Revelar>

      <ol className="relative w-full max-w-4xl">
        <span aria-hidden className="absolute bottom-2 left-7 top-2 w-1.5 rounded-full bg-[#e6eef5] md:left-1/2 md:-translate-x-1/2 dark:bg-line" />
        {/* A linha colorida “desenha” até o fim conforme a lista aparece na tela. */}
        <Revelar className="absolute bottom-2 left-7 top-2 w-1.5 md:left-1/2 md:-translate-x-1/2">
          <span
            aria-hidden
            style={{ transitionDelay: "200ms" }}
            className="block size-full origin-top scale-y-0 rounded-full bg-gradient-to-b from-[#1cb0f6] to-[#ffd23f] transition-transform duration-[2600ms] ease-out group-data-[visivel=true]/rev:scale-y-100"
          />
        </Revelar>
        {ROTINA.map(({ hora, Icone, cor, titulo, texto }, i) => {
          const direita = i % 2 === 1;
          return (
            <Revelar key={hora} como="li" atraso={80} className="relative grid grid-cols-[3.75rem_1fr] items-center gap-4 py-3 md:grid-cols-[1fr_5rem_1fr] md:gap-0">
              <span
                className={cx(
                  "z-10 grid size-14 place-items-center rounded-full text-white shadow-[0_5px_0_rgba(0,0,0,0.2)] transition-transform hover:scale-110 md:col-start-2 md:row-start-1 md:mx-auto",
                  "opacity-0 group-data-[visivel=true]/rev:animate-pop",
                )}
                style={{ background: cor, animationDelay: "150ms" }}
              >
                <Icone aria-hidden className="size-6" />
              </span>
              <div
                className={cx(
                  CARTAO_JOGO,
                  "flex flex-col gap-1 p-4 transition-transform hover:-translate-y-1 md:row-start-1",
                  direita ? "md:col-start-3 md:ml-4" : "md:col-start-1 md:mr-4 md:text-right",
                )}
              >
                <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: cor }}>
                  {hora} · {titulo}
                </span>
                <p className="leading-relaxed text-muted">{texto}</p>
              </div>
            </Revelar>
          );
        })}
      </ol>
    </section>
  );
}

/* ───────────── Números ───────────── */

function Contador({ alvo, sufixo = "" }: { alvo: number; sufixo?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [valor, setValor] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let quadro = 0;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const inicio = performance.now();
        const passo = (agora: number) => {
          const t = reduz ? 1 : Math.min(1, (agora - inicio) / 1400);
          setValor(Math.round(alvo * (1 - Math.pow(1 - t, 3))));
          if (t < 1) quadro = requestAnimationFrame(passo);
        };
        quadro = requestAnimationFrame(passo);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(quadro);
    };
  }, [alvo]);

  return (
    <span ref={ref} aria-label={`${alvo}${sufixo}`}>
      <span aria-hidden>
        {valor}
        {sufixo}
      </span>
    </span>
  );
}

const NUMEROS = [
  { alvo: 8, sufixo: "", rotulo: "competências de liderança", Icone: Sparkles, cor: "#a455ee" },
  { alvo: 4, sufixo: "", rotulo: "áreas, cada uma com fórum e reunião", Icone: Users, cor: "#00a3a3" },
  { alvo: 6, sufixo: "", rotulo: "etapas em cada módulo", Icone: Target, cor: "#1b8fe6" },
  { alvo: 10, sufixo: " min", rotulo: "por missão, no máximo", Icone: Zap, cor: "#f59e0b" },
];

export function Numeros() {
  return (
    <section aria-label="A plataforma em números" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {NUMEROS.map(({ alvo, sufixo, rotulo, Icone, cor }, i) => (
        <Revelar key={rotulo} atraso={i * 120} className="flex">
          <div className={cx(CARTAO_JOGO, "flex w-full flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-1")}>
            <span className="grid size-12 place-items-center rounded-2xl text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]" style={{ background: cor }}>
              <Icone aria-hidden className="size-6" />
            </span>
            <p className="font-display text-5xl font-extrabold italic tabular-nums" style={{ color: cor }}>
              <Contador alvo={alvo} sufixo={sufixo} />
            </p>
            <p className="text-sm font-bold text-muted">{rotulo}</p>
          </div>
        </Revelar>
      ))}
    </section>
  );
}
