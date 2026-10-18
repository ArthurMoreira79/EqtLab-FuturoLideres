"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Onboarding } from "@/components/Onboarding";
import { BarrasCompetencias } from "@/components/BarrasCompetencias";
import { Carregando, botao, cx } from "@/components/ui";
import { competencia, forcasEAtencao, NOMES_NIVEL, nivelDe } from "@/lib/competencias";
import { useEstado } from "@/lib/estado";

export default function Resultado() {
  const estado = useEstado();
  const router = useRouter();

  useEffect(() => {
    if (estado === null) router.replace("/");
    else if (estado && !estado.diagnostico) router.replace("/diagnostico");
  }, [estado, router]);

  if (!estado?.diagnostico) {
    return (
      <Onboarding sobre="Relatório de perfil" titulo="Seu ponto de partida">
        <Carregando />
      </Onboarding>
    );
  }

  const p = estado.diagnostico.pontuacoes;
  const { forcas, atencao } = forcasEAtencao(p);

  return (
    <Onboarding sobre="Relatório de perfil" titulo={`Seu ponto de partida, ${estado.perfil.nome.split(" ")[0]}`}>
      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <BarrasCompetencias pontuacoes={p} />
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">O que suas escolhas mostram</h2>
          <p className="leading-relaxed">
            Suas respostas mostram sinais positivos em <strong>{competencia(forcas[0]).nome.toLowerCase()}</strong> e{" "}
            <strong>{competencia(forcas[1]).curto.toLowerCase()}</strong>. Os pontos de atenção estão em{" "}
            <strong>{competencia(atencao[0]).nome.toLowerCase()}</strong> e{" "}
            <strong>{competencia(atencao[1]).curto.toLowerCase()}</strong>. Você vai aprender desde o básico, com esses temas em destaque na trilha.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-tint-cyan p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-tint-cyan-ink">Pontos fortes</span>
              {forcas.map((s) => (
                <p key={s} className="text-sm">{competencia(s).curto}</p>
              ))}
            </div>
            <div className="rounded-xl bg-tint-purple p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-tint-purple-ink">Atenção</span>
              {atencao.map((s) => (
                <p key={s} className="text-sm">{competencia(s).curto}</p>
              ))}
            </div>
          </div>

        </div>
      </div>

      <section className="mt-8 flex flex-col gap-3">
        <h2 className="text-lg font-bold">Sua trilha recomendada</h2>
        <ol className="flex flex-wrap gap-2">
          {estado.trilha.map((s, i) => (
            <li
              key={s}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-semibold",
                i < 2 ? "bg-primary text-on-primary" : "border border-line bg-card",
              )}
            >
              {i + 1}. {competencia(s).curto}
              <span className="sr-only"> — nível {NOMES_NIVEL[nivelDe(p[s])]}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex justify-end">
        <Link href="/inicio" className={botao.primario}>
          Começar minha trilha <ArrowRight aria-hidden className="size-5" />
        </Link>
      </div>
    </Onboarding>
  );
}
