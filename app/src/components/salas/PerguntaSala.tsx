"use client";

import { Check, Clock, Hourglass, X } from "lucide-react";
import { cx } from "@/components/ui";
import type { Cronograma, EstadoSala } from "@/lib/salas/contratos";
import { FotoPessoa, primeiroNome } from "./Pessoa";

const LETRAS = ["A", "B", "C", "D"];
const CORES = [
  { fundo: "#1b8fe6", degrau: "#1470b8" },
  { fundo: "#a455ee", degrau: "#7c3cb8" },
  { fundo: "#f59e0b", degrau: "#b86f00" },
  { fundo: "#ec4899", degrau: "#b02a6f" },
];
const CERTA = { fundo: "#22c55e", degrau: "#15803d" };
const ERRADA = { fundo: "#ef4444", degrau: "#b91c1c" };

export function PerguntaSala({
  dados,
  etapa,
  agora,
  escolhida,
  enviando,
  erro,
  aoResponder,
  euId,
}: {
  dados: EstadoSala;
  etapa: Cronograma;
  agora: number;
  /** Alternativa marcada (já com a resposta confirmada ou a caminho). */
  escolhida: number | null;
  enviando: boolean;
  erro: string | null;
  aoResponder: (alternativa: number) => void;
  euId?: string;
}) {
  const pergunta = dados.pergunta!;
  const revelacao = etapa.fase === "revelacao";
  const restanteMs = Math.max(0, etapa.fimDaFaseEm - agora);
  const restanteS = Math.ceil(restanteMs / 1000);
  const pct = revelacao ? 0 : Math.min(100, (restanteMs / (pergunta.tempoSegundos * 1000)) * 100);
  const aperto = !revelacao && restanteS <= 5;
  const ultima = etapa.indice === dados.totalPerguntas - 1;
  const total = dados.participantes.length;
  const euAcertei = dados.minhaResposta?.correta;
  const pode = !revelacao && !dados.ehAnfitriao && escolhida === null && !enviando;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-tint-cyan px-3.5 py-1.5 text-sm font-extrabold uppercase tracking-wider text-tint-cyan-ink">
          Pergunta {etapa.indice + 1} de {dados.totalPerguntas}
        </span>
        <div
          role="timer"
          aria-label={revelacao ? "Resposta revelada" : `Faltam ${restanteS} segundos`}
          className="h-4 flex-1 overflow-hidden rounded-full bg-sunken"
        >
          <div
            className={cx("h-full rounded-full transition-[width] duration-200 ease-linear", aperto ? "bg-[#ef4444]" : "bg-[linear-gradient(90deg,#1478d0,#1cb0f6)]")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span
          key={aperto ? restanteS : "ok"}
          className={cx(
            "flex min-w-16 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-lg font-extrabold tabular-nums",
            aperto ? "animate-pop bg-[#fee4e2] text-[#b42318]" : "bg-sunken text-heading",
          )}
        >
          <Clock aria-hidden className="size-4" />
          {revelacao ? "—" : restanteS}
        </span>
      </div>

      <h2 key={etapa.indice} className="animate-entrar rounded-3xl border-2 border-line bg-card p-6 text-center text-2xl font-extrabold leading-snug shadow-[0_4px_0_var(--line)] sm:p-8 sm:text-3xl">
        {pergunta.enunciado}
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {pergunta.alternativas.map((texto, i) => {
          const marcada = escolhida === i;
          const certa = revelacao && pergunta.correta === i;
          const errada = revelacao && marcada && !certa;
          const cor = certa ? CERTA : errada ? ERRADA : CORES[i];
          const apagada = revelacao ? !certa && !errada : escolhida !== null && !marcada;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={!pode}
                onClick={() => aoResponder(i)}
                aria-pressed={marcada}
                className={cx(
                  "relative flex min-h-20 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-lg font-extrabold text-white transition-[transform,box-shadow,opacity] duration-200",
                  pode ? "hover:-translate-y-0.5 active:translate-y-1 active:!shadow-none" : "cursor-default",
                  apagada && "opacity-40",
                  certa && "animate-pop",
                  errada && "animate-abanar",
                  marcada && !revelacao && "-translate-y-0.5 ring-4 ring-white/80",
                )}
                style={{ background: cor.fundo, boxShadow: `0 5px 0 ${cor.degrau}` }}
              >
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/25 text-lg">
                  {certa ? <Check className="size-6" strokeWidth={3.5} /> : errada ? <X className="size-6" strokeWidth={3.5} /> : LETRAS[i]}
                </span>
                <span className="flex-1">{texto}</span>
                {revelacao && pergunta.distribuicao && (
                  <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-extrabold" aria-label={`${pergunta.distribuicao[i]} respostas`}>
                    {pergunta.distribuicao[i]}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {erro && (
        <p role="alert" className="rounded-xl bg-[#fee4e2] px-4 py-2.5 text-center text-sm font-bold text-[#b42318]">
          {erro}
        </p>
      )}

      {!revelacao &&
        (dados.ehAnfitriao ? (
          <div className="rounded-2xl bg-sunken px-4 py-3 text-center font-bold">
            {dados.respondidos} de {total} {total === 1 ? "pessoa respondeu" : "pessoas responderam"}
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-card">
              <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: total ? `${(dados.respondidos / total) * 100}%` : 0 }} />
            </div>
          </div>
        ) : escolhida !== null ? (
          <p className="flex animate-pop items-center justify-center gap-2 rounded-2xl bg-tint-cyan px-4 py-3 text-center font-extrabold text-tint-cyan-ink">
            <Hourglass aria-hidden className="size-5 animate-girar" /> Resposta enviada! Aguarde o tempo acabar…
          </p>
        ) : null)}

      {revelacao && (
        <div className="flex flex-col gap-4">
          {!dados.ehAnfitriao && (
            <p
              className={cx(
                "animate-pop rounded-2xl px-4 py-4 text-center text-xl font-extrabold",
                euAcertei ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee4e2] text-[#b42318]",
              )}
            >
              {euAcertei ? "Acertou! Mandou bem 🎉" : dados.minhaResposta ? "Quase! Na próxima você acerta." : "O tempo acabou sem resposta."}
            </p>
          )}
          {dados.ranking && (
            <section aria-label="Placar parcial" className="rounded-3xl border-2 border-line bg-card p-4 shadow-[0_4px_0_var(--line)]">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-muted">Placar até agora</h3>
              <ol className="flex flex-col gap-2">
                {dados.ranking.slice(0, 5).map((r) => (
                  <li
                    key={r.id}
                    className={cx("flex animate-entrar items-center gap-3 rounded-2xl px-3 py-2", r.id === euId ? "bg-selected" : "bg-sunken")}
                  >
                    <span className="w-6 text-center text-lg font-extrabold text-muted">{r.posicao}</span>
                    <FotoPessoa pessoa={r} tamanho={36} />
                    <span className="flex-1 truncate font-bold">{r.id === euId ? "Você" : primeiroNome(r.nome)}</span>
                    <span className="font-extrabold">
                      {r.acertos} {r.acertos === 1 ? "acerto" : "acertos"}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <p className="text-center text-sm font-bold text-muted" role="status">
            {ultima ? "Resultado final em" : "Próxima pergunta em"} {restanteS}s…
          </p>
        </div>
      )}
    </div>
  );
}
