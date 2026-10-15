"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Plus, Search, Sparkles } from "lucide-react";
import { Aviso, Carregando, TagCompetencia, TituloPagina, Vazio, botao, cx, tempoRelativo } from "@/components/ui";
import { api } from "@/lib/api";
import { COMPETENCIAS, competencia, forcasEAtencao } from "@/lib/competencias";
import { useEstado } from "@/lib/estado";
import type { CompetenciaSlug, PostForum } from "@/lib/types";

type Filtro = "todos" | "para-voce" | "sem-resposta" | CompetenciaSlug;

export default function Comunidade() {
  const estado = useEstado();
  const [filtro, setFiltro] = useState<Filtro>("para-voce");
  const [busca, setBusca] = useState("");
  const [posts, setPosts] = useState<PostForum[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const foco = estado ? forcasEAtencao(estado.pontuacoes).atencao[0] : undefined;

  useEffect(() => {
    if (!foco) return;
    const p = new URLSearchParams();
    if (filtro === "para-voce") p.set("tag", foco);
    else if (filtro === "sem-resposta") p.set("semResposta", "1");
    else if (filtro !== "todos") p.set("tag", filtro);
    if (busca.trim()) p.set("q", busca.trim());
    const t = setTimeout(() => {
      api
        .chamar<PostForum[]>(`/api/comunidade?${p}`)
        .then((r) => {
          setPosts(r);
          setErro(null);
        })
        .catch((e) => setErro(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [filtro, busca, foco]);

  if (!estado) return null;

  const chips: { id: Filtro; rotulo: string }[] = [
    { id: "para-voce", rotulo: "Para você" },
    { id: "todos", rotulo: "Todos" },
    { id: "sem-resposta", rotulo: "Sem resposta" },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TituloPagina descricao="Troque experiências com outros líderes. Temas sensíveis podem ser postados anonimamente.">
          Comunidade
        </TituloPagina>
        <Link href="/comunidade/nova" className={botao.primario}>
          <Plus aria-hidden className="size-5" /> Nova pergunta
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex min-h-12 items-center gap-2.5 rounded-xl border border-line bg-card px-4">
          <Search aria-hidden className="size-5 text-muted" />
          <span className="sr-only">Buscar tópicos</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar dúvidas de outros líderes"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filtro === c.id}
              onClick={() => setFiltro(c.id)}
              className={cx(
                "min-h-10 rounded-full border px-4 text-sm font-semibold",
                filtro === c.id ? "border-primary bg-primary text-on-primary" : "border-line bg-card text-ink",
              )}
            >
              {c.rotulo}
            </button>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">Filtrar por competência</span>
            <select
              value={COMPETENCIAS.some((c) => c.slug === filtro) ? filtro : ""}
              onChange={(e) => setFiltro((e.target.value || "todos") as Filtro)}
              className="min-h-10 rounded-full border border-line bg-card px-3 font-semibold"
            >
              <option value="">Competência…</option>
              {COMPETENCIAS.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.curto}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtro === "para-voce" && foco && (
          <p className="text-sm text-muted">Mostrando tópicos sobre {competencia(foco).nome.toLowerCase()}, seu ponto de atenção.</p>
        )}
      </div>

      {erro && <Aviso>{erro}</Aviso>}
      {!posts ? (
        <Carregando />
      ) : posts.length === 0 ? (
        <Vazio titulo="Nenhum tópico encontrado.">Que tal abrir a primeira pergunta sobre o assunto?</Vazio>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((p) => {
            const melhor = p.respostas.find((r) => r.id === p.melhorRespostaId);
            const ia = p.respostas.find((r) => r.isIA);
            return (
              <li key={p.id}>
                <Link
                  href={`/comunidade/${p.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 hover:border-primary sm:p-5"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <TagCompetencia key={t} slug={t} />
                    ))}
                    {p.anonimo && <span className="rounded-full bg-sunken px-2.5 py-1 text-xs font-semibold text-muted">Anônimo</span>}
                  </div>
                  <span className="text-lg font-bold leading-snug">{p.titulo}</span>
                  {melhor ? (
                    <div className="rounded-xl bg-tint-cyan p-3 text-sm">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-tint-cyan-ink">
                        <Check aria-hidden className="size-3.5" strokeWidth={3} /> Melhor resposta · {melhor.autor}
                        {melhor.mentor && " · Mentor(a)"}
                      </span>
                      <p className="mt-1 line-clamp-2">{melhor.corpo}</p>
                    </div>
                  ) : ia ? (
                    <div className="rounded-xl border border-dashed border-lilas p-3 text-sm">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-tint-purple-ink">
                        <Sparkles aria-hidden className="size-3.5" /> Resposta sugerida pela IA
                      </span>
                      <p className="mt-1 line-clamp-2">{ia.corpo}</p>
                    </div>
                  ) : null}
                  <span className="flex flex-wrap gap-x-4 text-sm text-muted">
                    <span>{p.autor}</span>
                    <span>{p.respostas.length ? `${p.respostas.length} respostas` : "Sem resposta"}</span>
                    <span>{tempoRelativo(p.criadoEm)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
