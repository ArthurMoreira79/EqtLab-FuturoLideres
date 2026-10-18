import { competencia, SLUGS } from "@/lib/competencias";
import type { Pontuacoes } from "@/lib/types";

const CX = 180;
const CY = 160;
const R = 105;

function ponto(i: number, valor: number) {
  const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / SLUGS.length;
  const r = (R * valor) / 5;
  return [CX + r * Math.cos(angulo), CY + r * Math.sin(angulo)] as const;
}

const poligono = (valores: number[]) => valores.map((v, i) => ponto(i, v).map((n) => n.toFixed(1)).join(",")).join(" ");

/** Radar de competências (0 a 5). `antes` opcional desenha a linha tracejada do diagnóstico. */
export function Radar({ atual, antes, rotulo }: { atual: Pontuacoes; antes?: Pontuacoes; rotulo: string }) {
  return (
    <figure className="m-0">
      <svg viewBox="-75 12 510 300" role="img" aria-label={rotulo} className="h-auto w-full">
        <g fill="none" stroke="var(--radar-grid)" strokeWidth={1}>
          {[1, 2, 3, 4, 5].map((n) => (
            <polygon key={n} points={poligono(SLUGS.map(() => n))} />
          ))}
          {SLUGS.map((_, i) => {
            const [x, y] = ponto(i, 5);
            return <line key={i} x1={CX} y1={CY} x2={x} y2={y} />;
          })}
        </g>
        {antes && (
          <polygon
            points={poligono(SLUGS.map((s) => antes[s]))}
            fill="none"
            stroke="var(--radar-before)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}
        <polygon
          points={poligono(SLUGS.map((s) => atual[s]))}
          fill="#61d6ff"
          fillOpacity={0.25}
          stroke="var(--radar-now)"
          strokeWidth={2.5}
        />
        {SLUGS.map((s, i) => {
          const [x, y] = ponto(i, 6.1);
          const ancora = Math.abs(x - CX) < 5 ? "middle" : x > CX ? "start" : "end";
          return (
            <text
              key={s}
              x={x}
              y={y + 4}
              textAnchor={ancora}
              fontSize={13}
              fontWeight={600}
              fill="currentColor"
            >
              {competencia(s).curto}
            </text>
          );
        })}
      </svg>
      {antes && (
        <figcaption className="mt-1 flex gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[var(--radar-before)]" />
            Diagnóstico
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-0.5 w-4 bg-[var(--radar-now)]" />
            Atual
          </span>
        </figcaption>
      )}
    </figure>
  );
}
