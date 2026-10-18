import Image from "next/image";
import { Clara } from "./jogo";
import { TemaToggle } from "./TemaToggle";

/** Moldura do diagnóstico (sem a navegação principal): cabeçalho azul no estilo dos pôsteres do EQT Lab. */
export function Onboarding({
  sobre,
  titulo,
  progresso,
  rotuloProgresso,
  children,
}: {
  sobre: string;
  titulo: string;
  progresso?: number;
  rotuloProgresso?: string;
  children: React.ReactNode;
}) {
  const pct = progresso === undefined ? undefined : Math.round(Math.max(0, Math.min(1, progresso)) * 100);
  return (
    <div className="min-h-dvh bg-bg">
      <header className="relative isolate overflow-hidden bg-[linear-gradient(170deg,#1f66ff_0%,#0d44d6_60%,#0a2fa8_100%)] text-white">
        <span aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full border-[3px] border-[#7fd4ff]/50 shadow-[0_0_50px_#4fc3ff]" />
        <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 pb-6 pt-5">
          <div className="flex items-center justify-between">
            <Image src="/eqt-lab-logo.png" alt="EQT Lab by Equatorial" width={364} height={90} priority style={{ width: 100, height: "auto" }} />
            <TemaToggle className="text-white hover:bg-white/10" />
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col items-start gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/85">{sobre}</span>
              <h1 className="bg-[#ffd400] px-3 py-1 text-3xl font-extrabold uppercase leading-tight tracking-tight text-[#0b1f5c] sm:text-4xl">
                {titulo}
              </h1>
            </div>
            <Clara pose="tablet" busto largura={92} className="hidden sm:block" />
          </div>
          {pct !== undefined && (
            <div className="flex items-center gap-3">
              <div
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={rotuloProgresso ?? "Progresso"}
                className="h-3.5 flex-1 overflow-hidden rounded-full bg-white/25"
              >
                <div className="h-full rounded-full bg-[#ffd400] transition-[width]" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-extrabold">{rotuloProgresso}</span>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
