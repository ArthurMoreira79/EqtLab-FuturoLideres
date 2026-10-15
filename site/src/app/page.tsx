"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquareText, Route, Target } from "lucide-react";
import { LogoEQT, NomeProduto } from "@/components/Logo";
import { TemaToggle } from "@/components/TemaToggle";
import { botao } from "@/components/ui";
import { estadoDemo } from "@/lib/demo";
import { acoes, useEstado } from "@/lib/estado";

const PILARES = [
  { Icone: Target, titulo: "Missões diárias", texto: "Situações reais do seu dia a dia, em 5 a 10 minutos." },
  { Icone: MessageSquareText, titulo: "Feedback da IA", texto: "Pontos fortes, melhorias e um exemplo de resposta mais forte." },
  { Icone: Route, titulo: "Trilha personalizada", texto: "Módulos curtos na ordem que o seu diagnóstico pede." },
];

export default function Boasvindas() {
  const estado = useEstado();
  const router = useRouter();

  function explorarDemo() {
    acoes.carregarDemo(estadoDemo());
    router.push("/inicio");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(115deg,#1e2273_0%,#280f91_60%,#7c3cb8_100%)] text-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <LogoEQT largura={120} />
        <TemaToggle className="text-white hover:bg-white/10" />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-10 px-5 pb-16 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-5">
          <span className="text-sm font-bold uppercase tracking-[0.14em] text-ciano">Desafio 6 · Hackathon Equatorial</span>
          <h1>
            <NomeProduto className="text-5xl sm:text-7xl" />
          </h1>
          <p className="text-lg leading-relaxed text-[#dcddf5] sm:text-xl">
            Você foi promovido por ser bom no que faz. Agora, a prática diária para se tornar um líder que a equipe
            confia — com feedback imediato e evolução que dá para ver.
          </p>
          <div className="flex flex-wrap gap-3">
            {estado ? (
              <Link href={estado.diagnostico ? "/inicio" : "/diagnostico"} className={botao.destaque}>
                Continuar como {estado.perfil.nome.split(" ")[0]} <ArrowRight aria-hidden className="size-5" />
              </Link>
            ) : (
              <Link href="/cadastro" className={botao.destaque}>
                Criar meu perfil <ArrowRight aria-hidden className="size-5" />
              </Link>
            )}
            <button type="button" onClick={explorarDemo} className={botao.fantasma}>
              Explorar com dados de demonstração
            </button>
          </div>
        </div>

        <ul className="grid gap-4 sm:grid-cols-3">
          {PILARES.map(({ Icone, titulo, texto }) => (
            <li key={titulo} className="flex flex-col gap-2 rounded-2xl bg-white/10 p-5">
              <Icone aria-hidden className="size-6 text-ciano" />
              <span className="font-bold">{titulo}</span>
              <span className="text-sm leading-relaxed text-[#dcddf5]">{texto}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
