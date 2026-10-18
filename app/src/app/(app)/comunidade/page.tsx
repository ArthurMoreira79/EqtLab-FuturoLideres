"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Gamepad2, Plus, Search, Sparkles } from "lucide-react";
import { Aviso, Carregando, TagCompetencia, TituloPagina, Vazio, botao, cx, tempoRelativo } from "@/components/ui";
import { EscudosDeAreas } from "@/components/comunidade/EscudosDeAreas";
import { PainelXp } from "@/components/comunidade/PainelXp";
import { EntrarComCodigo } from "@/components/salas/EntrarComCodigo";
import { ReuniaoDaArea } from "@/components/comunidade/ReuniaoDaArea";
import { GruposComunidade } from "@/components/rede/GruposComunidade";
import { api } from "@/lib/api";
import { AREA_INICIAL } from "@/lib/areas";
import { useAreas } from "@/lib/areas-cliente";
import { usePapel } from "@/lib/salas-cliente";
import { COMPETENCIAS, competencia, forcasEAtencao } from "@/lib/competencias";
import { useEstado } from "@/lib/estado";
import type { CompetenciaSlug, PostForum } from "@/lib/types";

type Filtro = "todos" | "para-voce" | "sem-resposta" | CompetenciaSlug;
type Aba = "forum" | "equipe";

export default function Comunidade() {
  const estado = useEstado();
  const areas = useAreas();
  const papel = usePapel();
  const [codigoAberto, setCodigoAberto] = useState(false);
  const [areaSlug, setAreaSlug] = useState(AREA_INICIAL);
  const [aba, setAba] = useState<Aba>("forum");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [posts, setPosts] = useState<PostForum[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const foco = estado ? forcasEAtencao(estado.pontuacoes).atencao[0] : undefined;

  useEffect(() => {
    if (aba !== "forum") return;
    const p = new URLSearchParams({ area: areaSlug });
    if (filtro === "para-voce" && foco) p.set("tag", foco);
    else if (filtro === "sem-resposta") p.set("semResposta", "1");
    else if (filtro !== "todos" && filtro !== "para-voce") p.set("tag", filtro);
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
  }, [aba, areaSlug, filtro, busca, foco]);

  if (!estado) return null;

  const area = areas.find((a) => a.slug === areaSlug) ?? areas[0];

  function escolherArea(slug: string) {
    if (slug === areaSlug) return;
    setPosts(null); // evita mostrar por um instante os tópicos da área anterior
    setAreaSlug(slug);
  }

  const chips: { id: Filtro; rotulo: string }[] = [
    { id: "todos", rotulo: "Todos" },
    { id: "para-voce", rotulo: "Para você" },
    { id: "sem-resposta", rotulo: "Sem resposta" },
  ];

  const abas: { id: Aba; rotulo: string }[] = [
    { id: "forum", rotulo: "Fórum da área" },
    { id: "equipe", rotulo: "Minha equipe" },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <EscudosDeAreas areas={areas} selecionada={area.slug} aoEscolher={escolherArea} />

        <div className="flex flex-wrap items-end justify-between gap-4">
          <TituloPagina descricao={area.descricao || "Troque experiências com outros líderes. Temas sensíveis podem ser postados anonimamente."}>
            {area.nome}
          </TituloPagina>
          <div className="flex flex-wrap gap-3">
            {papel === "admin" && (
              <Link href={`/comunidade/sala/nova?area=${area.slug}`} className={botao.primario}>
                <Plus aria-hidden className="size-5" /> Criar sala
              </Link>
            )}
            <button type="button" onClick={() => setCodigoAberto(true)} className={botao.sala}>
              <Gamepad2 aria-hidden className="size-5" /> Entrar em uma sala
            </button>
          </div>
        </div>

        <ReuniaoDaArea area={area} />

        <div role="tablist" aria-label="Seções da comunidade" className="flex gap-2 border-b-2 border-line">
          {abas.map((a) => (
            <button
              key={a.id}
              type="button"
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={cx(
                "-mb-0.5 min-h-11 border-b-4 px-4 text-sm font-extrabold uppercase tracking-wider",
                aba === a.id ? "border-primary text-primary" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {a.rotulo}
            </button>
          ))}
        </div>

        {aba === "equipe" ? (
          <GruposComunidade usuarioId={estado.usuarioId} />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-3">
              <label className="flex min-h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-card px-4">
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
              <Link href={`/comunidade/nova?area=${area.slug}`} className={botao.primario}>
                <Plus aria-hidden className="size-5" /> Nova pergunta
              </Link>
            </div>
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
              <Vazio titulo={`Nenhum tópico em ${area.nome} ainda.`}>Que tal abrir a primeira pergunta sobre o assunto?</Vazio>
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
          </>
        )}
      </div>

      <EntrarComCodigo aberto={codigoAberto} aoMudar={setCodigoAberto} />

      <aside aria-label="Seu progresso" className="lg:sticky lg:top-6 lg:self-start">
        <PainelXp estado={estado} />
      </aside>
    </div>
  );
}
