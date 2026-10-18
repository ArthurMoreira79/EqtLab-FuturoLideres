"use client";

import Link from "next/link";
import { Flame, Shuffle, SkipForward } from "lucide-react";
import { FeedbackView } from "@/components/FeedbackView";
import { RespostaDesafio } from "@/components/RespostaDesafio";
import { Aviso, Carregando, TagCompetencia, botao, cx } from "@/components/ui";
import { acoes, trocasRestantes, useEstado, type Estado } from "@/lib/estado";
import { useMissaoDoDia } from "@/lib/missao/useMissaoDoDia";

const TIPO = { cenario: "Cenário aberto", escolha: "Escolha + justificativa", mundo_real: "Missão no mundo real" };

export default function Missao() {
  const estado = useEstado();
  if (!estado) return null;
  return <TelaMissao estado={estado} />;
}

function TelaMissao({ estado }: { estado: Estado }) {
  const { missao, erro, sortear } = useMissaoDoDia(estado);

  if (!missao) return erro ? <Aviso>{erro}</Aviso> : <Carregando mensagem="Sorteando sua missão do dia…" />;

  const { desafio } = missao;
  const feita = missao.status === "feita";
  const ultima = feita ? estado.submissoes.find((s) => s.desafioId === desafio.id && s.origem === "missao") : null;
  const trocas = trocasRestantes(estado);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-3xl bg-[linear-gradient(120deg,#1e2273_0%,#280f91_70%,#7c3cb8_100%)] p-6 text-white sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-ciano">
            Missão do dia · {TIPO[desafio.tipo]}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold">
            <Flame aria-hidden className="size-4 text-lilas" /> {estado.sequencia.dias}
            <span className="sr-only">dias seguidos</span>
          </span>
        </div>
        <h1 className="text-xl font-bold leading-snug sm:text-2xl">{desafio.enunciado}</h1>
        <p className="text-[#dcddf5]">{desafio.pergunta}</p>
        <div className="flex flex-wrap gap-2">
          {desafio.competencias.map((c) => (
            <TagCompetencia key={c} slug={c} sobreEscuro />
          ))}
        </div>
      </section>

      {missao.status === "pulada" ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-card p-6">
          <p className="font-semibold">Você pulou a missão de hoje.</p>
          <p className="text-sm text-muted">
            Sem problema: sua sequência não zera no primeiro dia perdido. Amanhã tem uma nova.
          </p>
          <button type="button" className={botao.secundario} onClick={() => acoes.definirMissao({ ...missao, status: "pendente" })}>
            Quero responder mesmo assim
          </button>
        </div>
      ) : feita && ultima ? (
        <div className="flex flex-col gap-4">
          <FeedbackView
            feedback={ultima.feedback}
            xp={40}
            contestado={ultima.contestado}
            onContestar={() => acoes.contestar(ultima.id)}
          />
          <p className="text-muted">Missão concluída! Volte amanhã para a próxima.</p>
          <Link href="/trilha" className={cx(botao.primario, "self-start")}>
            Continuar na trilha
          </Link>
        </div>
      ) : (
        <>
          <RespostaDesafio key={desafio.id} desafio={desafio} estado={estado} origem="missao" />
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => sortear(true)}
              disabled={trocas === 0}
              className={cx(botao.secundario, "min-h-11 text-sm")}
            >
              <Shuffle aria-hidden className="size-4" /> Trocar missão ({trocas} restante{trocas === 1 ? "" : "s"} hoje)
            </button>
            <button type="button" onClick={acoes.pularMissao} className={cx(botao.secundario, "min-h-11 text-sm")}>
              <SkipForward aria-hidden className="size-4" /> Pular hoje
            </button>
          </div>
        </>
      )}
    </div>
  );
}
