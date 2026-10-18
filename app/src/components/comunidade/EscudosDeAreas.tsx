"use client";

import { BadgeDollarSign, Handshake, HardHat, Megaphone, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/components/ui";
import type { Area } from "@/lib/areas";

const ICONE_DA_AREA: Record<string, LucideIcon> = {
  comercial: Handshake,
  vendas: BadgeDollarSign,
  marketing: Megaphone,
  operarios: HardHat,
};

/** Escudo (como as divisões do Duolingo): cada um é uma área da empresa. */
function Escudo({ area, selecionada }: { area: Area; selecionada: boolean }) {
  const Icone = ICONE_DA_AREA[area.slug] ?? Users;
  return (
    <span
      aria-hidden
      className={cx(
        "relative grid place-items-center transition-all duration-300",
        selecionada ? "size-[84px] -translate-y-2 sm:size-[116px]" : "size-[60px] sm:size-[76px] opacity-80 group-hover:-translate-y-1 group-hover:opacity-100",
      )}
      style={{
        ["--c" as string]: area.cor,
        filter: selecionada ? `drop-shadow(0 10px 14px color-mix(in srgb, ${area.cor} 45%, transparent))` : undefined,
      }}
    >
      <svg viewBox="0 0 72 82" className="absolute inset-0 size-full">
        {/* “degrau” de baixo (parte mais escura) */}
        <path
          d="M36 6 L65 16 V44 C65 62 53 76 36 82 C19 76 7 62 7 44 V16 Z"
          style={{ fill: "color-mix(in srgb, var(--c) 62%, black)" }}
        />
        <path d="M36 2 L63 12 V41 C63 58 52 71 36 77 C20 71 9 58 9 41 V12 Z" style={{ fill: "var(--c)" }} />
        {/* brilho no alto */}
        <path d="M36 2 L63 12 V30 C50 27 22 27 9 30 V12 Z" fill="#fff" opacity="0.2" />
        <path d="M36 9 L56 16.5 V40 C56 53 48 63 36 68 C24 63 16 53 16 40 V16.5 Z" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <Icone className={cx("relative text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]", selecionada ? "size-8 sm:size-11" : "size-6 sm:size-8")} strokeWidth={2.4} />
    </span>
  );
}

export function EscudosDeAreas({
  areas,
  selecionada,
  aoEscolher,
}: {
  areas: Area[];
  selecionada: string;
  aoEscolher: (slug: string) => void;
}) {
  function teclas(e: React.KeyboardEvent) {
    const i = areas.findIndex((a) => a.slug === selecionada);
    if (e.key === "ArrowRight") aoEscolher(areas[(i + 1) % areas.length].slug);
    if (e.key === "ArrowLeft") aoEscolher(areas[(i - 1 + areas.length) % areas.length].slug);
  }

  return (
    <div
      role="tablist"
      aria-label="Áreas da empresa"
      onKeyDown={teclas}
      className="flex items-end gap-2 overflow-x-auto px-1 pb-2 pt-6 sm:gap-10"
    >
      {areas.map((a) => {
        const ativa = a.slug === selecionada;
        return (
          <button
            key={a.slug}
            type="button"
            role="tab"
            aria-selected={ativa}
            tabIndex={ativa ? 0 : -1}
            onClick={() => aoEscolher(a.slug)}
            className="group flex shrink-0 flex-col items-center gap-2.5 rounded-2xl outline-offset-4 first:ml-auto last:mr-auto"
          >
            <Escudo area={a} selecionada={ativa} />
            <span className={cx("text-[11px] font-extrabold uppercase tracking-wide sm:text-sm sm:tracking-wider", ativa ? "text-heading" : "text-muted")}>{a.nome}</span>
          </button>
        );
      })}
    </div>
  );
}
