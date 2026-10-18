"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CircleHelp, Home, Route, Target, UserRound, Users } from "lucide-react";
import { nivelXP, proximaTela, useEstado } from "@/lib/estado";
import { BotaoSair } from "./BotaoSair";
import { BOTAO_3D_PEQUENO, LogoMarca } from "./jogo";
import { NomeProduto } from "./Logo";
import { TemaToggle } from "./TemaToggle";
import { Barra, Carregando, cx } from "./ui";

const ITENS = [
  { href: "/inicio", rotulo: "Painel", rotuloLongo: "Painel", Icone: Home },
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
    // Quem chega pelo QR code de uma sala sem estar logado entra e volta para a sala.
    if (estado === null) router.replace(/^\/comunidade\/sala\/\d{6}$/.test(caminho) ? `/entrar?proximo=${caminho}` : "/");
    else if (estado && !estado.diagnostico) router.replace(proximaTela(estado));
  }, [estado, router, caminho]);

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
    <div className="flex min-h-dvh flex-wrap bg-bg">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-ciano px-4 py-2 font-semibold text-noite focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      {/* Menu lateral (desktop) */}
      <nav
        aria-label="Principal"
        className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r-2 border-line bg-card px-4 py-6 lg:flex"
      >
        <Link href="/inicio" className="flex flex-col gap-2 px-2" aria-label="Futuro Líderes · início">
          <LogoMarca largura={120} />
          <NomeProduto className="text-[24px] text-[#1478d0] dark:text-ciano" />
        </Link>

        <ul className="flex flex-col gap-1.5">
          {ITENS.map(({ href, rotuloLongo, Icone }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo(href) ? "page" : undefined}
                className={cx(
                  "flex min-h-12 items-center gap-3.5 rounded-2xl border-2 px-3.5 text-[13px] font-extrabold uppercase tracking-wider transition-colors",
                  ativo(href)
                    ? "border-[#84d8ff] bg-[#ddf4ff] text-[#1478d0] dark:border-ciano dark:bg-selected dark:text-ciano"
                    : "border-transparent text-muted hover:bg-sunken",
                )}
              >
                <Icone aria-hidden className="size-6" strokeWidth={ativo(href) ? 2.6 : 2.2} />
                {rotuloLongo}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1.5 rounded-2xl border-2 border-line bg-sunken p-4">
            <span className="text-sm font-extrabold text-link">Nível {nivel}</span>
            <Barra valor={noNivel / paraProximo} className="!bg-line" />
            <span className="text-sm text-muted">
              {estado.xp.toLocaleString("pt-BR")} XP · faltam {paraProximo - noNivel}
            </span>
          </div>
          <Link
            href="/bem-vindo"
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-bold text-muted hover:bg-sunken"
          >
            <CircleHelp aria-hidden className="size-5" /> Como funciona
          </Link>
          <div className="flex items-center justify-between gap-3">
            <BotaoSair className={cx(BOTAO_3D_PEQUENO, "h-11 min-h-11 flex-1 text-sm")} />
            <TemaToggle className="text-muted hover:bg-sunken" />
          </div>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo (celular) */}
        <header className="flex items-center justify-between gap-2 border-b-2 border-line bg-card px-4 py-3 lg:hidden">
          <Link href="/inicio" aria-label="Futuro Líderes · início" className="flex items-center gap-3">
            <LogoMarca largura={84} />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/bem-vindo"
              aria-label="Como funciona"
              className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-sunken"
            >
              <CircleHelp aria-hidden className="size-5" />
            </Link>
            <BotaoSair className={BOTAO_3D_PEQUENO} />
            <TemaToggle className="text-muted hover:bg-sunken" />
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>

        {/* Navegação inferior (celular) */}
        <nav
          aria-label="Principal"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t-2 border-line bg-card px-1 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 lg:hidden"
        >
          {ITENS.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
              aria-current={ativo(href) ? "page" : undefined}
              className={cx(
                "flex min-h-13 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px]",
                ativo(href) ? "bg-[#ddf4ff] font-extrabold text-[#1478d0] dark:bg-selected dark:text-ciano" : "font-semibold text-muted",
              )}
            >
              <Icone aria-hidden className="size-[22px]" strokeWidth={ativo(href) ? 2.6 : 2} />
              {rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
