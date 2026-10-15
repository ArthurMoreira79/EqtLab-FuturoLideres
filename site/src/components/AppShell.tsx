"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, Route, Target, UserRound, Users } from "lucide-react";
import { nivelXP, useEstado } from "@/lib/estado";
import { LogoEQT, NomeProduto } from "./Logo";
import { TemaToggle } from "./TemaToggle";
import { Barra, Carregando, cx } from "./ui";

const ITENS = [
  { href: "/inicio", rotulo: "Home", rotuloLongo: "Home", Icone: Home },
  { href: "/trilha", rotulo: "Trilha", rotuloLongo: "Trilha", Icone: Route },
  { href: "/missao", rotulo: "Missão", rotuloLongo: "Missão do dia", Icone: Target },
  { href: "/comunidade", rotulo: "Comunidade", rotuloLongo: "Comunidade", Icone: Users },
  { href: "/perfil", rotulo: "Perfil", rotuloLongo: "Perfil e evolução", Icone: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const estado = useEstado();
  const router = useRouter();
  const caminho = usePathname();

  useEffect(() => {
    if (estado === null) router.replace("/");
    else if (estado && !estado.diagnostico) router.replace("/diagnostico");
  }, [estado, router]);

  const ativo = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  if (!estado?.diagnostico) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Carregando />
      </div>
    );
  }

  const { nivel, noNivel, paraProximo } = nivelXP(estado.xp);

  return (
    <div className="flex min-h-dvh flex-wrap">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-ciano px-4 py-2 font-semibold text-noite focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      {/* Menu lateral (desktop) */}
      <nav
        aria-label="Principal"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-8 border-r border-chrome-line bg-chrome px-5 py-7 text-white lg:flex"
      >
        <div className="flex flex-col gap-3.5">
          <LogoEQT />
          <NomeProduto className="text-[26px]" />
        </div>
        <ul className="flex flex-col gap-1">
          {ITENS.map(({ href, rotuloLongo, Icone }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo(href) ? "page" : undefined}
                className={cx(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3.5",
                  ativo(href) ? "bg-violeta font-semibold text-white" : "text-[#dcddf5] hover:bg-white/10",
                )}
              >
                <Icone aria-hidden className={cx("size-5", ativo(href) && "text-ciano")} />
                {rotuloLongo}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 rounded-xl bg-chrome-2 p-4">
            <span className="text-sm font-semibold text-lilas">Nível {nivel}</span>
            <Barra valor={noNivel / paraProximo} className="!bg-noite/60" cor="#61d6ff" />
            <span className="text-sm text-[#dcddf5]">
              {estado.xp.toLocaleString("pt-BR")} XP · faltam {paraProximo - noNivel}
            </span>
          </div>
          <TemaToggle className="self-start text-[#dcddf5] hover:bg-white/10" />
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo (celular) */}
        <header className="flex items-center justify-between bg-chrome px-4 py-3 text-white lg:hidden">
          <div className="flex items-center gap-3">
            <LogoEQT largura={84} />
            <NomeProduto className="text-base text-[#dcddf5]" />
          </div>
          <TemaToggle className="text-[#dcddf5] hover:bg-white/10" />
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>

        {/* Navegação inferior (celular) */}
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-card px-1 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 lg:hidden"
        >
          {ITENS.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
              aria-current={ativo(href) ? "page" : undefined}
              className={cx(
                "flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
                ativo(href) ? "font-bold text-link" : "font-semibold text-muted",
              )}
            >
              <Icone aria-hidden className="size-[22px]" strokeWidth={ativo(href) ? 2.4 : 2} />
              {rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
