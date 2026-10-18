"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Aviso, TituloPagina, botao, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { COMPETENCIAS } from "@/lib/competencias";
import { useEstado } from "@/lib/estado";
import type { CompetenciaSlug, PostForum } from "@/lib/types";

const campo = "w-full rounded-xl border border-line bg-card px-4 focus:border-primary";

export default function NovaPergunta() {
  const estado = useEstado();
  const router = useRouter();
  const [tags, setTags] = useState<CompetenciaSlug[]>([]);
  const [anonimo, setAnonimo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!estado) return null;

  async function publicar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviando(true);
    setErro(null);
    try {
      const post = await api.chamar<PostForum>("/api/comunidade", {
        method: "POST",
        body: JSON.stringify({
          titulo: f.get("titulo"),
          corpo: f.get("corpo"),
          tags,
          anonimo,
          autor: estado!.perfil.nome,
          setor: estado!.perfil.setor,
        }),
      });
      router.push(`/comunidade/${post.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/comunidade" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline">
        <ArrowLeft aria-hidden className="size-4" /> Comunidade
      </Link>
      <TituloPagina descricao="Evite nomes de liderados e informações sigilosas. Se o tema for sensível, poste anonimamente.">
        Nova pergunta
      </TituloPagina>
      <form onSubmit={publicar} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Título</span>
          <input name="titulo" required minLength={8} maxLength={140} className={cx(campo, "min-h-12")} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Conte a situação</span>
          <textarea name="corpo" required minLength={20} rows={6} className={cx(campo, "py-3 leading-relaxed")} />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold">Competências (até 3)</legend>
          <div className="flex flex-wrap gap-2">
            {COMPETENCIAS.map((c) => {
              const marcado = tags.includes(c.slug);
              return (
                <label
                  key={c.slug}
                  className={cx(
                    "flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ciano",
                    marcado ? "border-primary bg-selected" : "border-line bg-card text-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={marcado}
                    disabled={!marcado && tags.length >= 3}
                    onChange={() => setTags((t) => (marcado ? t.filter((x) => x !== c.slug) : [...t, c.slug]))}
                  />
                  <span aria-hidden className="size-2 rounded-full" style={{ background: c.cor }} />
                  {c.curto}
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={anonimo}
            onChange={(e) => setAnonimo(e.target.checked)}
            className="size-5 accent-[var(--primary)]"
          />
          <span>
            <strong>Postar anonimamente</strong>
            <span className="block text-sm text-muted">Seu nome não aparece para ninguém.</span>
          </span>
        </label>
        {erro && <Aviso>{erro}</Aviso>}
        <button type="submit" disabled={enviando} className={cx(botao.primario, "sm:self-end")}>
          {enviando ? "Publicando…" : "Publicar pergunta"}
        </button>
      </form>
    </div>
  );
}
