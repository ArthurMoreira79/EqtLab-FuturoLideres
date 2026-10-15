"use client";

import { useState } from "react";
import { ArrowUp, Check, ChevronDown, TriangleAlert } from "lucide-react";
import { competencia, NOMES_NIVEL } from "@/lib/competencias";
import type { FeedbackIA } from "@/lib/ia/schema";
import { SeloIA, cx } from "./ui";

const CONFIANCA = { alta: "confiança alta", media: "confiança média", baixa: "confiança baixa" };

export function NotaCircular({ nota }: { nota: number }) {
  const pct = (nota / 10) * 100;
  return (
    <div
      className="flex size-20 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(#61d6ff 0 ${pct}%, rgba(255,255,255,.15) ${pct}% 100%)` }}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-chrome font-display text-2xl font-extrabold italic text-white">
        {nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
      </div>
    </div>
  );
}

/** Mostra o feedback estruturado da IA (seção 6.1). */
export function FeedbackView({
  feedback,
  xp,
  onContestar,
  contestado,
}: {
  feedback: FeedbackIA;
  xp?: number;
  onContestar?: () => void;
  contestado?: boolean;
}) {
  const [verExemplo, setVerExemplo] = useState(false);
  const titulo = feedback.nota_geral >= 8 ? "Ótima condução!" : feedback.nota_geral >= 6 ? "Bom caminho!" : "Vamos ajustar juntos";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-2xl bg-chrome p-5 text-white">
        <NotaCircular nota={feedback.nota_geral} />
        <div className="flex flex-col gap-1.5">
          <SeloIA texto={`Feedback da IA · ${CONFIANCA[feedback.confianca]}`} />
          <p className="font-display text-2xl font-extrabold italic">{titulo}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-ciano">
            {xp !== undefined && <span>+{xp} XP</span>}
            {feedback.competencias.map((c) => (
              <span key={c.competencia}>
                {competencia(c.competencia).curto} · {NOMES_NIVEL[c.nivel]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bloco titulo="Pontos fortes" Icone={Check} cor="text-tint-cyan-ink" itens={feedback.pontos_fortes} />
        <Bloco titulo="Pontos de melhoria" Icone={ArrowUp} cor="text-tint-purple-ink" itens={feedback.pontos_de_melhoria} />
      </div>

      {feedback.riscos_da_abordagem.length > 0 && (
        <div className="rounded-2xl bg-tint-risk p-4">
          <h3 className="mb-1.5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-tint-risk-ink">
            <TriangleAlert aria-hidden className="size-4" /> Riscos da abordagem
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {feedback.riscos_da_abordagem.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-lilas bg-card">
        <button
          type="button"
          aria-expanded={verExemplo}
          onClick={() => setVerExemplo((v) => !v)}
          className="flex min-h-12 w-full items-center justify-between gap-2 px-4 text-left text-sm font-bold"
        >
          Ver exemplo de resposta mais forte
          <ChevronDown aria-hidden className={cx("size-4 transition-transform", verExemplo && "rotate-180")} />
        </button>
        {verExemplo && <p className="px-4 pb-4 text-sm leading-relaxed">{feedback.exemplo_de_resposta_melhor}</p>}
      </div>

      <p className="text-sm leading-relaxed">
        <strong>Próximo passo:</strong> {feedback.proximo_passo_sugerido}
      </p>

      {onContestar && (
        <div className="text-sm">
          {contestado ? (
            <span className="text-muted">Obrigado! Registramos que você não concordou com este feedback.</span>
          ) : (
            <button type="button" onClick={onContestar} className="font-semibold text-link hover:underline">
              Não concordo com este feedback
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Bloco({
  titulo,
  Icone,
  cor,
  itens,
}: {
  titulo: string;
  Icone: typeof Check;
  cor: string;
  itens: string[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <h3 className={cx("mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider", cor)}>
        <Icone aria-hidden className="size-4" strokeWidth={2.6} /> {titulo}
      </h3>
      <ul className="space-y-2 text-sm leading-relaxed">
        {itens.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
