"use client";

import Link from "next/link";
import { Check, Hammer, Lock } from "lucide-react";
import { TituloPagina, cx } from "@/components/ui";
import { competencia, forcasEAtencao } from "@/lib/competencias";
import { moduloDaCompetencia } from "@/lib/conteudo/modulos";
import { useEstado } from "@/lib/estado";
import { progressoModulo, statusModulo, type StatusModulo } from "@/lib/trilha";

const ROTULO: Record<StatusModulo, string> = {
  concluido: "Concluído",
  andamento: "Em andamento",
  disponivel: "Disponível",
  bloqueado: "Bloqueado",
  producao: "Conteúdo em produção",
};

export default function Trilha() {
  const estado = useEstado();
  if (!estado) return null;

  const fortes = forcasEAtencao(estado.diagnostico!.pontuacoes).forcas;
  const concluidos = Object.values(estado.progresso).filter((p) => p.concluido).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <TituloPagina
        sobre="Personalizada pelo seu diagnóstico"
        descricao={`${concluidos} de ${estado.trilha.length} módulos concluídos · cerca de 18 min por módulo`}
      >
        Sua trilha
      </TituloPagina>

      <ol className="flex flex-col">
        {estado.trilha.map((slug, i) => {
          const m = moduloDaCompetencia(slug);
          const st = statusModulo(estado, m);
          const p = estado.progresso[m.id];
          const { passos, feitos } = progressoModulo(estado, m);
          const aberto = st === "andamento" || st === "disponivel" || st === "concluido";
          const ultimo = i === estado.trilha.length - 1;

          return (
            <li key={slug} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cx(
                    "flex size-10 shrink-0 items-center justify-center rounded-full font-bold",
                    st === "concluido" && "bg-ciano text-noite",
                    st === "andamento" && "bg-primary text-on-primary ring-4 ring-tint-purple",
                    st === "disponivel" && "border-2 border-primary text-link",
                    (st === "bloqueado" || st === "producao") && "bg-line text-muted",
                  )}
                >
                  {st === "concluido" ? (
                    <Check aria-hidden className="size-5" strokeWidth={3} />
                  ) : st === "bloqueado" ? (
                    <Lock aria-hidden className="size-4" />
                  ) : st === "producao" ? (
                    <Hammer aria-hidden className="size-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                {!ultimo && <span aria-hidden className={cx("my-1 w-[3px] flex-1", st === "concluido" ? "bg-ciano" : "bg-line")} />}
              </div>

              <div className={cx("mb-5 flex flex-1 flex-col gap-1 pt-1.5", st === "andamento" && "rounded-2xl border-2 border-primary bg-card p-4")}>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-tint-purple-ink">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: competencia(slug).cor }} />
                  {ROTULO[st]}
                  {st === "andamento" && ` · ${Math.round((feitos / passos) * 100)}%`}
                  {st === "concluido" && p?.desafioNota !== undefined && ` · desafio ${p.desafioNota.toLocaleString("pt-BR")}`}
                </span>
                {aberto ? (
                  <Link href={`/trilha/${m.id}`} className="font-display text-xl font-bold italic text-heading hover:underline">
                    {m.titulo}
                  </Link>
                ) : (
                  <span className="font-display text-xl font-bold italic text-muted">{m.titulo}</span>
                )}
                <span className="text-sm text-muted">
                  {m.descricao}
                  {fortes.includes(slug) && " · Ponto forte, intercalado para manter o ritmo."}
                </span>
                {st === "andamento" && (
                  <Link
                    href={`/trilha/${m.id}`}
                    className="mt-2 inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-primary px-4 font-semibold text-on-primary"
                  >
                    Continuar módulo
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
