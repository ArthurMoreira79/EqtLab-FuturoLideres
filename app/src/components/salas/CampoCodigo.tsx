"use client";

import { useRef } from "react";
import { cx } from "@/components/ui";

const TAMANHO = 6;

/** Seis caixinhas, uma por dígito (como o código do e-mail): avança sozinho, volta no Backspace e aceita colar. */
export function CampoCodigo({
  valor,
  aoMudar,
  aoCompletar,
  invalido,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  aoCompletar?: (v: string) => void;
  invalido?: boolean;
}) {
  const caixas = useRef<(HTMLInputElement | null)[]>([]);

  function definir(novo: string, foco: number) {
    const limpo = novo.replace(/\D/g, "").slice(0, TAMANHO);
    aoMudar(limpo);
    caixas.current[Math.min(foco, TAMANHO - 1)]?.focus();
    if (limpo.length === TAMANHO) aoCompletar?.(limpo);
  }

  return (
    <div role="group" aria-label="Código da sala, 6 dígitos" className="flex justify-center gap-2 sm:gap-3">
      {Array.from({ length: TAMANHO }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            caixas.current[i] = el;
          }}
          value={valor[i] ?? ""}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Dígito ${i + 1}`}
          aria-invalid={invalido || undefined}
          autoFocus={i === 0}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const digito = e.target.value.replace(/\D/g, "").slice(-1);
            if (!digito) return;
            definir(valor.slice(0, i) + digito + valor.slice(i + 1), i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (valor[i]) definir(valor.slice(0, i) + valor.slice(i + 1), i);
              else if (i > 0) definir(valor.slice(0, i - 1) + valor.slice(i), i - 1);
            } else if (e.key === "ArrowLeft" && i > 0) caixas.current[i - 1]?.focus();
            else if (e.key === "ArrowRight" && i < TAMANHO - 1) caixas.current[i + 1]?.focus();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const colado = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, TAMANHO);
            if (colado) definir(colado, colado.length);
          }}
          className={cx(
            "h-16 w-11 rounded-2xl border-2 bg-sunken text-center text-3xl font-extrabold text-heading caret-transparent outline-none transition-[border-color,transform] sm:w-14",
            invalido ? "border-[#d92d20]" : "border-transparent focus:scale-105 focus:border-primary",
          )}
        />
      ))}
    </div>
  );
}
