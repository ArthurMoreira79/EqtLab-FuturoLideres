"use client";
import { useState } from "react";
import { ArrowRight, Check, Lightbulb, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import { LICOES_GUIADAS } from "@/lib/conteudo/licoes-guiadas";
import type { Licao } from "@/lib/types";
import { botao, cx } from "@/components/ui";

export function LicaoInterativa({ licao, feita, aoConcluir }: { licao: Licao; feita: boolean; aoConcluir: () => void }) {
  const guia = LICOES_GUIADAS[licao.id];
  const [escolha, setEscolha] = useState<number | null>(null);
  const [corrigida, setCorrigida] = useState(false);
  const acertou = escolha === guia?.correta;
  return <article className="animate-entrar overflow-hidden rounded-3xl border-2 border-line bg-card">
    <div className="border-b border-line p-5 sm:p-7">
      <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-link"><Lightbulb aria-hidden className="size-4" /> Entenda em poucos passos</p>
      <h2 className="text-xl font-extrabold sm:text-2xl">{licao.titulo}</h2>
      <p className="mt-3 text-base leading-relaxed text-muted">{guia?.resumo ?? licao.paragrafos[0]}</p>
      {guia && <ol className="mt-5 grid gap-3 sm:grid-cols-3">{guia.passos.map((p) => <li key={p.sigla} className="rounded-2xl border border-line bg-sunken p-4">
        <span aria-hidden className="mb-3 grid size-10 place-items-center rounded-xl bg-tint-cyan text-xl font-extrabold text-tint-cyan-ink">{p.sigla}</span>
        <h3 className="font-extrabold">{p.titulo}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{p.texto}</p>
      </li>)}</ol>}
    </div>
    <div className="flex flex-col gap-5 p-5 sm:p-7">
      {guia && <>
        <div className="rounded-2xl bg-tint-purple p-4"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tint-purple-ink"><MessageCircle aria-hidden className="size-4" /> Imagine a situação</p><p className="text-sm leading-relaxed">{guia.situacao}</p></div>
        <fieldset disabled={corrigida} className="flex flex-col gap-2.5"><legend className="mb-3 font-extrabold">{guia.pergunta}</legend>{guia.opcoes.map((o, i) => <label key={o} className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-sm font-semibold leading-relaxed has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary", escolha === i ? "border-primary bg-selected" : "border-line bg-sunken", corrigida && i === guia.correta && "border-primary bg-tint-cyan")}>
          <input type="radio" name={`atividade-${licao.id}`} checked={escolha === i} onChange={() => setEscolha(i)} className="size-5 shrink-0 accent-[var(--primary)]" /><span>{o}</span>
        </label>)}</fieldset>
        {corrigida ? <div role="status" className="rounded-2xl border border-primary/40 bg-tint-cyan p-4"><p className="mb-2 flex items-center gap-2 font-extrabold text-tint-cyan-ink"><Sparkles aria-hidden className="size-4" />{acertou ? "Boa escolha!" : "Vamos olhar por outro ângulo?"}</p><p className="text-sm leading-relaxed">{guia.explicacao}</p></div> : <button type="button" disabled={escolha === null} className={cx(botao.secundario, "self-start text-sm")} onClick={() => setCorrigida(true)}>Conferir minha escolha</button>}
        {corrigida && !acertou && <button type="button" className={cx(botao.secundario, "self-start text-sm")} onClick={() => { setCorrigida(false); setEscolha(null); }}><RotateCcw aria-hidden className="size-4" /> Tentar outra opção</button>}
      </>}
      <details className="rounded-2xl border border-line px-4 py-3 text-sm"><summary className="min-h-8 cursor-pointer font-bold text-link">Ver exemplo e aprofundar</summary><div className="mt-3 space-y-3 leading-relaxed text-muted">{licao.paragrafos.map((p) => <p key={p}>{p}</p>)}<blockquote className="rounded-xl bg-sunken p-4 text-ink">{licao.exemplo}</blockquote></div></details>
      <div className="rounded-2xl border border-dashed border-line p-4"><p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-link">Leve para o seu dia</p><p className="text-sm leading-relaxed">{licao.naPratica}</p></div>
      <button type="button" className={cx(botao.primario, "w-full gap-2 sm:self-end sm:w-auto")} disabled={!feita && !!guia && !(corrigida && acertou)} onClick={aoConcluir}>
        {feita ? <Check aria-hidden className="size-5" /> : <ArrowRight aria-hidden className="size-5" />}{feita ? "Continuar" : "Concluir e continuar · +10 XP"}
      </button>
    </div>
  </article>;
}
