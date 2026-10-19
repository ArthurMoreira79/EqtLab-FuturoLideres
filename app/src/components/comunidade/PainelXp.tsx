"use client";

import { Flame, Zap } from "lucide-react";
import { ChipNivel } from "@/components/painel/AvatarMini";
import { Card, TituloSecao, cx } from "@/components/ui";
import { useGanhoXp } from "@/lib/ganho-xp";
import { XP, nivelXP, type Estado } from "@/lib/estado";

const FORMAS_DE_GANHAR: { rotulo: string; xp: number }[] = [
  { rotulo: "Resolver a missão do dia", xp: XP.missao },
  { rotulo: "Desafio prático do módulo", xp: XP.desafio },
  { rotulo: "Quiz rápido", xp: XP.quiz },
  { rotulo: "Concluir uma lição", xp: XP.licao },
];

/** Coluna ao lado da Comunidade: o XP de quem está logado (no lugar do “status” do Duolingo). */
export function PainelXp({ estado }: { estado: Estado }) {
  const ganho = useGanhoXp();
  const { nivel, noNivel, paraProximo } = nivelXP(estado.xp);
  const pct = Math.round((noNivel / paraProximo) * 100);
  const base = "inline-flex items-center gap-2 rounded-2xl border-2 border-line bg-card px-3.5 py-2 text-sm font-extrabold shadow-[0_3px_0_var(--line)]";

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap items-center gap-2.5" aria-label="Seus números">
        <li className={base}>
          <Flame aria-hidden className="size-5 origin-bottom animate-chama text-[#ff8a00]" fill="currentColor" />
          {estado.sequencia.dias} {estado.sequencia.dias === 1 ? "dia" : "dias"}
        </li>
        <li key={ganho?.id ?? 0} className={cx(base, ganho && "motion-safe:animate-pop border-[#f5b301]")}>
          <Zap aria-hidden className="size-5 text-[#f5b301]" fill="currentColor" />
          {estado.xp.toLocaleString("pt-BR")} XP
        </li>
        <li>
          <ChipNivel estado={estado} />
        </li>
      </ul>

      <Card className="flex flex-col gap-4">
        <TituloSecao>Seu XP</TituloSecao>
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#fff8dc] text-[#f5b301] dark:bg-tint-purple">
            <Zap aria-hidden className="size-8" fill="currentColor" />
          </span>
          <div>
            <p className="text-3xl font-extrabold leading-none">{estado.xp.toLocaleString("pt-BR")}</p>
            <p className="text-sm text-muted">XP acumulado</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm font-extrabold">
            <span>Nível {nivel}</span>
            <span className="text-muted">
              {noNivel} / {paraProximo}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Progresso para o nível ${nivel + 1}`}
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-4 overflow-hidden rounded-full bg-sunken"
          >
            <div className="h-full animate-encher rounded-full bg-[linear-gradient(90deg,#1478d0,#1cb0f6)]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-sm text-muted">
            Faltam {paraProximo - noNivel} XP para o nível {nivel + 1}.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t-2 border-line pt-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Como ganhar XP</p>
          <ul className="flex flex-col gap-2">
            {FORMAS_DE_GANHAR.map((f) => (
              <li key={f.rotulo} className="flex items-center justify-between gap-3 text-sm">
                <span>{f.rotulo}</span>
                <span className="rounded-full bg-tint-cyan px-2.5 py-0.5 text-xs font-extrabold text-tint-cyan-ink">+{f.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
