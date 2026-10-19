"use client";

import { useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { AvatarMini } from "@/components/painel/AvatarMini";
import { Confete } from "@/components/salas/PodioSala";
import { XP, type Estado } from "@/lib/estado";
import type { Ganho } from "@/lib/ganho-xp";

/** Diz, em palavras, de onde veio o XP (o valor de cada ação é fixo). */
function motivo(delta: number) {
  switch (delta) {
    case XP.licao:
      return "Lição concluída!";
    case XP.quiz:
      return "Quiz concluído!";
    case XP.missao:
      return "Missão do dia feita!";
    case XP.desafio:
      return "Desafio vencido!";
    case XP.diagnostico:
      return "Diagnóstico feito!";
    default:
      return "Mandou bem!";
  }
}

/**
 * Comemorações ao ganhar XP, em qualquer tela: um “+XP” que sobe pelo topo e, se o nível subir,
 * uma tela de festa com confete. Fica no AppShell.
 */
export function FestaDeXp({ ganho, estado }: { ganho: Ganho | null; estado: Estado }) {
  // Quem fecha a festa na mão a dispensa só para aquele ganho.
  const [fechadoId, setFechadoId] = useState(0);
  if (!ganho) return null;

  if (ganho.subiuNivel && fechadoId !== ganho.id) {
    return (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0b0d33]/70 p-4 backdrop-blur-sm" onClick={() => setFechadoId(ganho.id)}>
        <div className="motion-reduce:hidden">
          <Confete />
        </div>
        <div
          role="dialog"
          aria-label={`Você subiu para o nível ${ganho.nivel}`}
          className="flex w-full max-w-sm animate-pop flex-col items-center gap-4 rounded-[2rem] border-2 border-line bg-card p-8 text-center shadow-[0_8px_0_var(--line)]"
        >
          <div className="motion-safe:animate-brilhar">
            <AvatarMini estado={estado} tamanho={132} className="ring-4" />
          </div>
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-muted">
            <Sparkles aria-hidden className="size-4 text-[#f5b301]" /> Você subiu de nível
          </p>
          <p className="font-display text-6xl font-extrabold italic text-[#1478d0] dark:text-ciano">Nível {ganho.nivel}</p>
          <p className="text-muted">{motivo(ganho.delta)} +{ganho.delta} XP. Continue assim!</p>
          <button
            type="button"
            autoFocus
            onClick={() => setFechadoId(ganho.id)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-extrabold uppercase tracking-wider text-on-primary shadow-[0_4px_0_#0b4f91] active:translate-y-1 active:shadow-none dark:shadow-[0_4px_0_#2fa6d4]"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
      <div
        key={ganho.id}
        className="flex animate-xp-subir items-center gap-2.5 rounded-2xl bg-[#fff8dc] px-4 py-2.5 text-[#8a6100] shadow-[0_5px_0_#e8c35a,0_10px_24px_rgb(0_0_0/0.25)]"
      >
        <Zap aria-hidden className="size-6 text-[#f5b301]" fill="currentColor" />
        <span className="text-lg font-extrabold">+{ganho.delta} XP</span>
        <span className="text-sm font-bold">{motivo(ganho.delta)}</span>
      </div>
    </div>
  );
}
