"use client";

import { Check, Flame } from "lucide-react";
import { Card, cx } from "@/components/ui";
import { calcularConstancia } from "@/lib/constancia";
import type { Estado } from "@/lib/estado";

/** Constância: em quais dias da semana a pessoa praticou, mais um retrato das últimas 4 semanas. */
export function Constancia({ estado }: { estado: Estado }) {
  const c = calcularConstancia(estado);
  const pct = Math.round(c.taxa * 100);

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff3e0] text-[#ff8a00] dark:bg-tint-risk">
          <Flame aria-hidden className="size-6 origin-bottom animate-chama" fill="currentColor" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight">Constância</h2>
          <p className="text-sm text-muted">
            {c.ativosNaSemana} de 7 dias nesta semana
            {estado.sequencia.congelada && " · 1 dia congelado"}
          </p>
        </div>
      </div>

      {/* Dias da semana atual */}
      <ul className="flex justify-between gap-1" aria-label="Dias da semana atual">
        {c.semana.map((d) => (
          <li key={d.data} className="flex flex-col items-center gap-1.5 text-xs font-extrabold text-[#6b8fa8] dark:text-muted">
            <span aria-hidden>{d.letra}</span>
            <span
              role="img"
              aria-label={`${d.nome}: ${d.ativo ? "praticou" : d.futuro ? "ainda não chegou" : d.hoje ? "hoje, ainda sem prática" : "sem prática"}`}
              className={cx(
                "grid size-9 place-items-center rounded-full",
                d.ativo && "bg-[#1b8fe6] text-white shadow-[0_3px_0_#0f66b4] dark:bg-ciano dark:text-noite dark:shadow-[0_3px_0_#2fa6d4]",
                !d.ativo && d.hoje && "animate-brilho border-[3px] border-dashed border-[#1b8fe6] dark:border-ciano",
                !d.ativo && !d.hoje && !d.futuro && "bg-[#e6eef5] dark:bg-line",
                d.futuro && "border-2 border-dashed border-line",
              )}
            >
              {d.ativo && <Check aria-hidden className="size-4" strokeWidth={3.5} />}
            </span>
          </li>
        ))}
      </ul>

      {/* Últimas 4 semanas */}
      <div className="flex items-center gap-4 rounded-2xl bg-sunken p-3.5">
        <div
          role="img"
          aria-label={`Constância de ${pct}% nas últimas 4 semanas`}
          className="grid size-20 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#1b8fe6 ${pct * 3.6}deg, var(--line) 0)` }}
        >
          <span className="grid size-[62px] place-items-center rounded-full bg-card text-lg font-extrabold">{pct}%</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm font-bold leading-tight">
            Últimas 4 semanas
            <span className="block text-xs font-semibold text-muted">
              {c.ativosEm4Semanas} de {c.diasConsiderados} dias
            </span>
          </span>
          <div className="flex flex-col gap-1" aria-hidden>
            {c.semanas.map((sem, i) => (
              <div key={i} className="flex gap-1">
                {sem.map((d) => (
                  <span
                    key={d.data}
                    className={cx(
                      "h-2.5 flex-1 rounded-full",
                      d.ativo ? "bg-[#1b8fe6] dark:bg-ciano" : d.futuro ? "border border-dashed border-line" : "bg-[#d3e6f6] dark:bg-line",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted">
        {c.diaForte ? (
          <>
            Seu dia mais constante é <strong className="text-ink">{c.diaForte}</strong>. Que tal usar esse hábito para puxar os outros dias?
          </>
        ) : (
          "Pratique alguns dias para descobrir em quais dias da semana você é mais constante."
        )}
      </p>
    </Card>
  );
}
