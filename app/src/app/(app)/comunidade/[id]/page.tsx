"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Award, Check, Sparkles, ThumbsUp } from "lucide-react";
import { Aviso, Carregando, TagCompetencia, botao, cx, tempoRelativo } from "@/components/ui";
import { api } from "@/lib/api";
import { useEstado } from "@/lib/estado";
import type { PostForum } from "@/lib/types";

export default function Topico() {
  const { id } = useParams<{ id: string }>();
  const estado = useEstado();
  const [post, setPost] = useState<PostForum | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [uteis, setUteis] = useState<string[]>([]);

  useEffect(() => {
    api.chamar<PostForum>(`/api/comunidade/${id}`).then(setPost).catch((e) => setErro(e.message));
  }, [id]);

  async function acao(corpo: object) {
    setErro(null);
    try {
      setPost(await api.chamar<PostForum>(`/api/comunidade/${id}`, { method: "POST", body: JSON.stringify(corpo) }));
      return true;
    } catch (e) {
      setErro((e as Error).message);
      return false;
    }
  }

  async function responder(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    if (await acao({ acao: "responder", autor: estado?.perfil.nome ?? "Líder", corpo: texto })) setTexto("");
    setEnviando(false);
  }

  if (!post) {
    return erro ? <Aviso>{erro}</Aviso> : <Carregando />;
  }

  const autorDoPost = !post.anonimo && estado?.perfil.nome === post.autor;
  const respostas = [...post.respostas].sort(
    (a, b) => Number(b.id === post.melhorRespostaId) - Number(a.id === post.melhorRespostaId),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/comunidade" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Comunidade
      </Link>

      <article className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <TagCompetencia key={t} slug={t} />
          ))}
        </div>
        <h1 className="font-display text-3xl font-extrabold italic text-heading">{post.titulo}</h1>
        <p className="text-sm text-muted">
          {post.autor}
          {post.setor && ` · ${post.setor}`} · {tempoRelativo(post.criadoEm)}
        </p>
        <p className="whitespace-pre-line text-lg leading-relaxed">{post.corpo}</p>
      </article>

      <section aria-labelledby="respostas" className="flex flex-col gap-3">
        <h2 id="respostas" className="text-lg font-bold">
          {post.respostas.length ? `${post.respostas.length} respostas` : "Ainda sem respostas"}
        </h2>
        {respostas.map((r) => {
          const melhor = r.id === post.melhorRespostaId;
          const marcouUtil = uteis.includes(r.id);
          return (
            <div
              key={r.id}
              className={cx(
                "flex flex-col gap-2 rounded-2xl p-4",
                melhor ? "border-2 border-ciano bg-tint-cyan" : r.isIA ? "border border-dashed border-lilas bg-card" : "border border-line bg-card",
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {r.isIA ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-tint-purple-ink">
                    <Sparkles aria-hidden className="size-4" /> Resposta sugerida pela IA
                  </span>
                ) : (
                  <span className="font-bold">{r.autor}</span>
                )}
                {r.mentor && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-tint-purple px-2 py-0.5 text-xs font-bold text-tint-purple-ink">
                    <Award aria-hidden className="size-3.5" /> Mentor(a)
                  </span>
                )}
                {melhor && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-tint-cyan-ink">
                    <Check aria-hidden className="size-3.5" strokeWidth={3} /> Melhor resposta
                  </span>
                )}
                <span className="text-muted">· {tempoRelativo(r.criadoEm)}</span>
              </div>
              <p className="leading-relaxed">{r.corpo}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={marcouUtil}
                  aria-pressed={marcouUtil}
                  onClick={async () => {
                    if (await acao({ acao: "util", respostaId: r.id })) setUteis((u) => [...u, r.id]);
                  }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-semibold disabled:opacity-70"
                >
                  <ThumbsUp aria-hidden className="size-4" /> Útil · {r.uteis}
                </button>
                {autorDoPost && !melhor && !r.isIA && (
                  <button
                    type="button"
                    onClick={() => acao({ acao: "melhor", respostaId: r.id })}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-sm font-semibold"
                  >
                    <Check aria-hidden className="size-4" /> Marcar como melhor
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <form onSubmit={responder} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
        <label className="flex flex-col gap-2">
          <span className="font-bold">Sua resposta</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            className="rounded-xl border border-line bg-bg p-3 leading-relaxed focus:border-primary"
            placeholder="Compartilhe o que funcionou para você. Evite nomes e dados pessoais."
          />
        </label>
        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={enviando || texto.trim().length < 5} className={cx(botao.primario, "self-end")}>
          {enviando ? "Enviando…" : "Responder"}
        </button>
      </form>
    </div>
  );
}
