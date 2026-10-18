"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Zap } from "lucide-react";
import { cx } from "./ui";

/* ─────────────── Abertura (tela de “carregando energia”) ─────────────── */

const DURACAO_ABERTURA_MS = 1900;
const CHAVE_ABERTURA = "fl:abertura";

/** Marca a abertura como vista: o <html> ganha o atributo (CSS esconde tela e libera a entrada do conteúdo). */
function marcarVista() {
  document.documentElement.dataset.abertura = "visto";
  try {
    sessionStorage.setItem(CHAVE_ABERTURA, "1");
  } catch {
    /* modo privado: a abertura só volta a tocar ao recarregar */
  }
}

/**
 * Toca uma vez por aba. Quem decide se aparece é o CSS (`html[data-abertura="visto"] #abertura`),
 * com o atributo posto por um script no <head> antes de qualquer pintura — por isso não há flash.
 */
export function Abertura() {
  const [pct, setPct] = useState(0);
  const [fase, setFase] = useState<"carregando" | "saindo" | "fim">("carregando");

  useEffect(() => {
    const ativa = document.documentElement.dataset.abertura !== "visto";
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ativa || reduz) {
      marcarVista();
      const t = setTimeout(() => setFase("fim"), 0);
      return () => clearTimeout(t);
    }
    const inicio = performance.now();
    let saida: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      const p = Math.min(100, ((performance.now() - inicio) / DURACAO_ABERTURA_MS) * 100);
      setPct(Math.round(p));
      if (p >= 100) {
        clearInterval(tick);
        setFase("saindo");
        marcarVista(); // libera a entrada em cascata do conteúdo enquanto a tela some
        saida = setTimeout(() => setFase("fim"), 550);
      }
    }, 40);
    return () => {
      clearInterval(tick);
      clearTimeout(saida);
    };
  }, []);

  if (fase === "fim") return null;

  return (
    <div
      id="abertura"
      role="status"
      aria-live="polite"
      onClick={() => {
        marcarVista();
        setFase("fim");
      }}
      className={cx(
        "fixed inset-0 z-[100] grid place-items-center bg-[linear-gradient(160deg,#0b0d33_0%,#1e2273_60%,#280f91_100%)] px-6 text-white",
        fase === "saindo" && "animate-sair",
      )}
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-7">
        <div className="relative grid size-32 place-items-center">
          <span aria-hidden className="absolute inset-0 animate-pulsar rounded-full bg-white/10" />
          <span aria-hidden className="absolute inset-3 rounded-full bg-gradient-to-b from-[#ffe066] to-[#ff9f1c] opacity-90" />
          <Zap aria-hidden className="relative size-16 animate-faiscar fill-white text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Image src="/eqt-lab-logo.png" alt="EQT Lab by Equatorial" width={364} height={90} priority style={{ width: 140, height: "auto" }} />
          <span className="font-display text-2xl font-extrabold italic text-ciano">Futuro Líderes</span>
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="h-4 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ciano to-[#ffd23f]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="flex justify-between text-sm font-extrabold">
            <span>Carregando energia…</span>
            <span aria-hidden>{pct}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── Revelar (entra em cena ao rolar a página) ─────────────── */

export function Revelar({
  children,
  className,
  atraso = 0,
  como = "div",
}: {
  children: React.ReactNode;
  className?: string;
  atraso?: number;
  como?: "div" | "li" | "section" | "ul" | "ol";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = como as "div"; // só muda a tag HTML; as props são as mesmas
  return (
    <Tag
      ref={ref}
      data-visivel={visivel}
      style={{ animationDelay: `${atraso}ms` }}
      className={cx("group/rev", className, visivel ? "animate-entrar" : "opacity-0")}
    >
      {children}
    </Tag>
  );
}

/* ─────────────── Raios de fundo (energia) ─────────────── */

const RAIOS_FUNDO = [
  { esq: "4%", topo: "24%", tam: 28, atraso: 0 },
  { esq: "44%", topo: "10%", tam: 20, atraso: 600 },
  { esq: "92%", topo: "34%", tam: 32, atraso: 300 },
  { esq: "56%", topo: "78%", tam: 22, atraso: 900 },
  { esq: "10%", topo: "70%", tam: 24, atraso: 1200 },
];

export function RaiosDeFundo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {RAIOS_FUNDO.map((r, i) => (
        <Zap
          key={i}
          className="absolute animate-quicar fill-[#ffd23f]/40 text-[#ffd23f]/60 dark:fill-ciano/20 dark:text-ciano/40"
          style={{ left: r.esq, top: r.topo, width: r.tam, height: r.tam, animationDelay: `${r.atraso}ms` }}
        />
      ))}
    </div>
  );
}

/* ─────────────── Poses de “IA” (só o cartão da prévia reage; a Clara fica parada) ─────────────── */

export type Pose = "acenando" | "pensando" | "raio" | "comemorando";

const ROTEIRO: { pose: Pose; ms: number }[] = [
  { pose: "acenando", ms: 3400 },
  { pose: "pensando", ms: 3200 },
  { pose: "raio", ms: 2000 },
  { pose: "comemorando", ms: 2800 },
];

/** Alterna a pose sozinho, na ordem do roteiro. */
export function usePose() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((x) => (x + 1) % ROTEIRO.length), ROTEIRO[i].ms);
    return () => clearTimeout(id);
  }, [i]);
  return ROTEIRO[i].pose;
}
