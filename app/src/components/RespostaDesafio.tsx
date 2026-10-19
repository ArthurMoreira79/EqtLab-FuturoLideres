"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { MIN_PALAVRAS_RESPOSTA } from "@/lib/ia/limites";
import { api } from "@/lib/api";
import { acoes, hoje, type Estado } from "@/lib/estado";
import type { DesafioPublico, Submissao } from "@/lib/types";
import { FeedbackView } from "./FeedbackView";
import { Aviso, Carregando, botao, cx } from "./ui";

/**
 * Formulário de resposta a um desafio (missão ou desafio de módulo) + feedback da IA.
 * Suporta os formatos: cenário aberto, escolha + justificativa e missão no mundo real.
 */
export function RespostaDesafio({
  desafio,
  estado,
  origem,
  moduloId,
  extras,
}: {
  desafio: DesafioPublico;
  estado: Estado;
  origem: "missao" | "desafio";
  moduloId?: string;
  extras?: React.ReactNode;
}) {
  const [texto, setTexto] = useState("");
  const [opcao, setOpcao] = useState<number | undefined>();
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultadoId, setResultadoId] = useState<string | null>(null);

  const resultado = resultadoId ? estado.submissoes.find((s) => s.id === resultadoId) : null;
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  const ehEscolha = desafio.tipo === "escolha" && desafio.opcoes;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando || palavras < MIN_PALAVRAS_RESPOSTA || (ehEscolha && opcao === undefined)) return;
    setEnviando(true);
    setAviso(null);
    try {
      const res = await api.avaliar({
        desafioId: desafio.id,
        resposta: texto,
        opcaoEscolhida: opcao,
        contexto: {
          setor: estado.perfil.setor,
          cargo: estado.perfil.cargo,
          tamanhoEquipe: estado.perfil.tamanhoEquipe,
          tipoEquipe: estado.perfil.tipoEquipe,
        },
      });
      if (res.status === "desenvolver") {
        setAviso(res.mensagem);
        return;
      }
      const resposta = ehEscolha && opcao !== undefined ? `Alternativa: ${desafio.opcoes![opcao]}\n\n${texto}` : texto;
      const s: Submissao = {
        id: crypto.randomUUID(),
        desafioId: desafio.id,
        titulo: desafio.titulo,
        origem,
        resposta,
        feedback: res.feedback,
        data: hoje(),
      };
      acoes.registrarSubmissao(s, moduloId);
      setResultadoId(s.id);
    } catch (erro) {
      setAviso((erro as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <div className="flex flex-col gap-4">
        <FeedbackView
          feedback={resultado.feedback}
          xp={origem === "missao" ? 40 : 60}
          contestado={resultado.contestado}
          onContestar={() => acoes.contestar(resultado.id)}
        />
        {extras}
        <button type="button" onClick={() => setResultadoId(null)} className={cx(botao.secundario, "self-start")}>
          Responder de novo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      {ehEscolha && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 font-bold">Escolha uma alternativa</legend>
          {desafio.opcoes!.map((o, i) => (
            <label
              key={o}
              className={cx(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-card px-4 py-3",
                opcao === i ? "border-primary bg-selected" : "border-line",
              )}
            >
              <input
                type="radio"
                name="opcao"
                checked={opcao === i}
                onChange={() => setOpcao(i)}
                className="size-5 accent-[var(--primary)]"
              />
              <span className="leading-snug">{o}</span>
            </label>
          ))}
        </fieldset>
      )}

      <label className="flex flex-col gap-2">
        <span className="font-bold">
          {ehEscolha ? "Justifique sua escolha" : desafio.tipo === "mundo_real" ? "Registre como foi" : "Sua resposta"}
        </span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={8}
          disabled={enviando}
          className="rounded-xl border-2 border-line bg-card p-4 leading-relaxed focus:border-primary"
          placeholder="Escreva como você realmente agiria: o que faz primeiro, o que diz e como acompanha depois."
        />
        <span className="flex justify-between text-sm text-muted">
          <span>Não existe resposta única certa.</span>
          <span>{palavras} palavras · mínimo {MIN_PALAVRAS_RESPOSTA}</span>
        </span>
      </label>

      {enviando && <Carregando mensagem="Analisando sua resposta…" />}
      {aviso && <Aviso>{aviso}</Aviso>}

      <button
        type="submit"
        disabled={enviando || palavras < MIN_PALAVRAS_RESPOSTA || (ehEscolha ? opcao === undefined : false)}
        className={cx(botao.primario, "sm:self-end")}
      >
        Enviar para análise <Sparkles aria-hidden className="size-4" />
      </button>
    </form>
  );
}
