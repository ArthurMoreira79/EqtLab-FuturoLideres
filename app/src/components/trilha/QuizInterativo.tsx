"use client";
import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Trophy } from "lucide-react";
import { botao, cx } from "@/components/ui";
import { acoes } from "@/lib/estado";
import type { Modulo } from "@/lib/types";

export function QuizInterativo({ modulo, acertosSalvos, aoAvancar }: { modulo: Modulo; acertosSalvos?: number; aoAvancar: () => void }) {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [conferida, setConferida] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const pergunta = modulo.quiz[indice];
  const escolha = respostas[indice];
  const acertos = modulo.quiz.filter((p, i) => respostas[i] === p.correta).length;

  if (finalizado) return <section className="flex animate-entrar flex-col items-center gap-4 rounded-3xl border-2 border-line bg-card p-6 text-center sm:p-9">
    <span className="grid size-20 place-items-center rounded-full bg-tint-cyan text-tint-cyan-ink"><Trophy aria-hidden className="size-10" /></span>
    <h2 className="text-2xl font-extrabold">Pronto para colocar em prática!</h2>
    <p role="status" className="text-lg font-bold">Você acertou {acertos} de {modulo.quiz.length} perguntas.</p>
    <p className="max-w-md text-sm leading-relaxed text-muted">Agora use o que aprendeu em uma conversa de liderança. Você pode rever as lições quando quiser.</p>
    <button type="button" className={botao.primario} onClick={aoAvancar}>Ir para o desafio <ArrowRight aria-hidden className="size-5" /></button>
    <button type="button" className={botao.secundario} onClick={() => { setIndice(0); setRespostas({}); setConferida(false); setFinalizado(false); }}><RotateCcw aria-hidden className="size-4" /> Refazer quiz</button>
  </section>;
  return <section className="animate-entrar rounded-3xl border-2 border-line bg-card p-5 sm:p-7">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-wider text-link">Pergunta {indice + 1} de {modulo.quiz.length}</span>{acertosSalvos !== undefined && <span className="text-xs text-muted">Melhor resultado: {acertosSalvos}/{modulo.quiz.length}</span>}</div>
    <fieldset disabled={conferida} className="flex flex-col gap-3"><legend className="mb-5 text-xl font-extrabold">{pergunta.pergunta}</legend>{pergunta.opcoes.map((o, i) => <label key={o} className={cx("flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 text-sm font-semibold leading-relaxed has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary", conferida && i === pergunta.correta ? "border-primary bg-tint-cyan" : escolha === i ? "border-primary bg-selected" : "border-line bg-sunken")}>
      <input type="radio" name={`quiz-${modulo.id}-${indice}`} checked={escolha === i} onChange={() => setRespostas((r) => ({ ...r, [indice]: i }))} className="size-5 shrink-0 accent-[var(--primary)]" /><span>{o}</span>{conferida && i === pergunta.correta && <Check aria-hidden className="ml-auto size-5 shrink-0 text-link" />}
    </label>)}</fieldset>
    {conferida && <div role="status" className="mt-5 rounded-2xl bg-tint-cyan p-4"><p className="mb-1 font-extrabold text-tint-cyan-ink">{escolha === pergunta.correta ? "Isso mesmo!" : "Veja o que faz a diferença"}</p><p className="text-sm leading-relaxed">{pergunta.explicacao}</p></div>}
    <div className="mt-6 flex justify-end">{!conferida ? <button type="button" disabled={escolha === undefined} className={botao.primario} onClick={() => setConferida(true)}>Conferir resposta</button> : <button type="button" className={botao.primario} onClick={() => {
      if (indice + 1 === modulo.quiz.length) { acoes.salvarQuiz(modulo.id, acertos); setFinalizado(true); }
      else { setIndice(indice + 1); setConferida(false); }
    }}>{indice + 1 === modulo.quiz.length ? "Ver meu resultado" : "Próxima pergunta"}<ArrowRight aria-hidden className="size-5" /></button>}</div>
  </section>;
}
