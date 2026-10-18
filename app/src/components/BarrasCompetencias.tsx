import { COMPETENCIAS } from "@/lib/competencias";
import type { Pontuacoes } from "@/lib/types";

/** Indicadores das respostas, na escala de 0 a 5; a animação termina no valor salvo. */
export function BarrasCompetencias({ pontuacoes }: { pontuacoes: Pontuacoes }) {
  return (
    <section aria-labelledby="competencias-titulo" className="rounded-2xl border border-line bg-card p-5">
      <h2 id="competencias-titulo" className="text-lg font-bold">Suas competências</h2>
      <p className="mb-5 mt-1 text-sm text-muted">Um retrato das suas escolhas, na escala de 0 a 5.</p>
      <ul className="flex flex-col gap-4">
        {COMPETENCIAS.map((c, i) => {
          const nota = Math.max(0, Math.min(5, pontuacoes[c.slug]));
          return (
            <li key={c.slug}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{c.nome}</span>
                <span className="shrink-0 font-bold tabular-nums">{nota.toLocaleString("pt-BR")}<span className="font-normal text-muted"> / 5</span></span>
              </div>
              <div role="meter" aria-label={c.nome} aria-valuemin={0} aria-valuemax={5} aria-valuenow={nota}
                className="h-3 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full" style={{ width: `${nota * 20}%`, backgroundColor: c.cor,
                  animation: `encher 900ms cubic-bezier(0.2, 0.8, 0.2, 1) ${i * 65}ms both` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-xs leading-relaxed text-muted">Quando as respostas não trazem evidência sobre uma competência, usamos o ponto neutro de 2,5.</p>
    </section>
  );
}
