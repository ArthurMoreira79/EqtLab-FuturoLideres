import { LogoEQT, NomeProduto } from "./Logo";
import { TemaToggle } from "./TemaToggle";
import { Barra } from "./ui";

/** Moldura das telas de cadastro e diagnóstico (sem a navegação principal). */
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
  return (
    <div className="min-h-dvh">
      <header className="bg-chrome text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pb-6 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoEQT largura={96} />
              <NomeProduto className="hidden text-base text-[#dcddf5] sm:inline" />
            </div>
            <TemaToggle className="text-[#dcddf5] hover:bg-white/10" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-ciano">{sobre}</span>
            <h1 className="font-display text-3xl font-extrabold italic">{titulo}</h1>
          </div>
          {progresso !== undefined && (
            <div className="flex items-center gap-3">
              <Barra valor={progresso} className="flex-1 !bg-white/15" cor="#61d6ff" />
              <span className="text-sm font-semibold">{rotuloProgresso}</span>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
    </div>
  );
}
