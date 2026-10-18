"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Lock } from "lucide-react";
import { RespostaDesafio } from "@/components/RespostaDesafio";
import { Aviso, Barra, Card, Carregando, TituloPagina, botao, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { obterModulo, temConteudo } from "@/lib/conteudo/modulos";
import { acoes, NOTA_MINIMA, useEstado, type Estado } from "@/lib/estado";
import { progressoModulo, statusModulo } from "@/lib/trilha";
import type { DesafioPublico, Modulo, PerguntaQuiz } from "@/lib/types";

export default function PaginaModulo() {
  const { modulo: id } = useParams<{ modulo: string }>();
  const estado = useEstado();
  if (!estado) return null;
  const m = obterModulo(id);

  if (!m) return <Aviso>Módulo não encontrado.</Aviso>;
  const st = statusModulo(estado, m);
  if (st === "producao" || st === "bloqueado" || !temConteudo(m)) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <TituloPagina sobre="Trilha">{m.titulo}</TituloPagina>
        <Aviso tipo="info">
          {st === "bloqueado"
            ? "Conclua os módulos anteriores da sua trilha para liberar este."
            : "O conteúdo deste módulo está em produção e entra numa próxima versão."}
        </Aviso>
        <Link href="/trilha" className={cx(botao.secundario, "self-start")}>
          Voltar para a trilha
        </Link>
      </div>
    );
  }
  return <ConteudoModulo estado={estado} modulo={m} />;
}

function ConteudoModulo({ estado, modulo }: { estado: Estado; modulo: Modulo }) {
  const prog = estado.progresso[modulo.id];
  const { fracao } = progressoModulo(estado, modulo);
  const licoesOk = modulo.licoes.every((l) => prog?.licoesFeitas.includes(l.id));
  const quizOk = prog?.quizAcertos !== undefined;
  const [aberta, setAberta] = useState<string | null>(
    modulo.licoes.find((l) => !prog?.licoesFeitas.includes(l.id))?.id ?? null,
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/trilha" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Trilha
      </Link>
      <TituloPagina sobre={prog?.concluido ? "Módulo concluído" : "Módulo"} descricao={modulo.descricao}>
        {modulo.titulo}
      </TituloPagina>
      <div className="flex items-center gap-3">
        <Barra valor={fracao} className="flex-1" />
        <span className="font-bold">{Math.round(fracao * 100)}%</span>
      </div>

      <section aria-labelledby="licoes" className="flex flex-col gap-3">
        <h2 id="licoes" className="text-lg font-bold">
          Lições
        </h2>
        {modulo.licoes.map((l, i) => {
          const feita = prog?.licoesFeitas.includes(l.id);
          const expandida = aberta === l.id;
          return (
            <article key={l.id} className="rounded-2xl border border-line bg-card">
              <h3>
                <button
                  type="button"
                  aria-expanded={expandida}
                  onClick={() => setAberta(expandida ? null : l.id)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
                >
                  <span
                    className={cx(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      feita ? "bg-ciano text-noite" : "bg-sunken text-muted",
                    )}
                  >
                    {feita ? <Check aria-hidden className="size-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="flex-1 font-semibold">{l.titulo}</span>
                  <span className="text-sm text-muted">{l.minutos} min</span>
                  <ChevronDown aria-hidden className={cx("size-4 transition-transform", expandida && "rotate-180")} />
                </button>
              </h3>
              {expandida && (
                <div className="flex flex-col gap-3 px-4 pb-5 leading-relaxed">
                  {l.paragrafos.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  <div className="rounded-xl bg-sunken p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-tint-purple-ink">Exemplo</span>
                    <p className="mt-1">{l.exemplo}</p>
                  </div>
                  <div className="rounded-xl bg-tint-cyan p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-tint-cyan-ink">Na prática</span>
                    <p className="mt-1">{l.naPratica}</p>
                  </div>
                  {!feita && (
                    <button
                      type="button"
                      className={cx(botao.primario, "self-start")}
                      onClick={() => {
                        acoes.marcarLicao(modulo.id, l.id);
                        setAberta(modulo.licoes[i + 1]?.id ?? null);
                      }}
                    >
                      Concluir lição · +10 XP
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      <Quiz modulo={modulo} perguntas={modulo.quiz} acertosSalvos={prog?.quizAcertos} />

      <section aria-labelledby="desafio" className="flex flex-col gap-3">
        <h2 id="desafio" className="text-lg font-bold">
          Desafio prático
        </h2>
        {licoesOk && quizOk && modulo.desafioId ? (
          <Desafio estado={estado} modulo={modulo} desafioId={modulo.desafioId} />
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line p-5 text-muted">
            <Lock aria-hidden className="size-5 shrink-0" />
            Conclua as lições e o quiz para liberar o desafio. Ele é avaliado pela IA e conclui o módulo com nota{" "}
            {NOTA_MINIMA} ou mais.
          </div>
        )}
      </section>
    </div>
  );
}

function Quiz({ modulo, perguntas, acertosSalvos }: { modulo: Modulo; perguntas: PerguntaQuiz[]; acertosSalvos?: number }) {
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [corrigido, setCorrigido] = useState(false);
  const acertos = perguntas.filter((p, i) => respostas[i] === p.correta).length;

  return (
    <Card as="section" aria-labelledby="quiz" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id="quiz" className="text-lg font-bold">
          Quiz rápido
        </h2>
        {acertosSalvos !== undefined && (
          <span className="text-sm text-muted">
            Melhor resultado: {acertosSalvos}/{perguntas.length}
          </span>
        )}
      </div>
      {perguntas.map((p, i) => (
        <fieldset key={p.pergunta} className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">
            {i + 1}. {p.pergunta}
          </legend>
          {p.opcoes.map((o, j) => {
            const marcado = respostas[i] === j;
            const certo = corrigido && j === p.correta;
            const errado = corrigido && marcado && j !== p.correta;
            return (
              <label
                key={o}
                className={cx(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-3.5 py-2.5",
                  certo ? "border-ciano bg-tint-cyan" : errado ? "border-tint-risk-ink bg-tint-risk" : marcado ? "border-primary bg-selected" : "border-line",
                )}
              >
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={marcado}
                  disabled={corrigido}
                  onChange={() => setRespostas((r) => ({ ...r, [i]: j }))}
                  className="size-5 accent-[var(--primary)]"
                />
                <span>{o}</span>
              </label>
            );
          })}
          {corrigido && <p className="text-sm text-muted">{p.explicacao}</p>}
        </fieldset>
      ))}
      {corrigido ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold" role="status">
            Você acertou {acertos} de {perguntas.length}.
          </span>
          <button
            type="button"
            className={botao.secundario}
            onClick={() => {
              setRespostas({});
              setCorrigido(false);
            }}
          >
            Refazer
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={Object.keys(respostas).length < perguntas.length}
          className={cx(botao.primario, "self-start")}
          onClick={() => {
            setCorrigido(true);
            acoes.salvarQuiz(modulo.id, acertos);
          }}
        >
          Corrigir
        </button>
      )}
    </Card>
  );
}

function Desafio({ estado, modulo, desafioId }: { estado: Estado; modulo: Modulo; desafioId: string }) {
  const [desafio, setDesafio] = useState<DesafioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const nota = estado.progresso[modulo.id]?.desafioNota;

  useEffect(() => {
    api.desafio(desafioId).then(setDesafio).catch((e) => setErro(e.message));
  }, [desafioId]);

  if (erro) return <Aviso>{erro}</Aviso>;
  if (!desafio) return <Carregando />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-chrome p-5 text-white">
        <p className="text-lg leading-relaxed">{desafio.enunciado}</p>
        <p className="font-semibold text-ciano">{desafio.pergunta}</p>
      </div>
      {nota !== undefined && (
        <Aviso tipo="info">
          Sua melhor nota até agora: {nota.toLocaleString("pt-BR")}.{" "}
          {nota >= NOTA_MINIMA ? "Módulo concluído!" : `Leia o feedback e tente de novo: o módulo conclui com ${NOTA_MINIMA}.`}
        </Aviso>
      )}
      <RespostaDesafio
        desafio={desafio}
        estado={estado}
        origem="desafio"
        moduloId={modulo.id}
        extras={
          <Link href="/trilha" className={cx(botao.primario, "self-start")}>
            Voltar para a trilha
          </Link>
        }
      />
    </div>
  );
}
