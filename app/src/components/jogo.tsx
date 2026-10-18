import Image from "next/image";
import { cx } from "./ui";

/** Botão grande com “degrau” embaixo (estilo jogo). Use junto com `buttonVariants` do HeroUI. */
export const BOTAO_3D =
  "relative isolate inline-flex h-14 min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl px-8 text-center text-base font-extrabold uppercase leading-none tracking-wider bg-[#1b8fe6] text-white shadow-[0_4px_0_#1470b8] transition-[transform,box-shadow,background-color] hover:bg-[#2a9cf0] active:translate-y-1 active:shadow-none disabled:shadow-none before:absolute before:inset-y-0 before:left-0 before:-z-10 before:w-1/4 before:animate-deslizar before:bg-white/30 before:content-[''] dark:bg-ciano dark:text-noite dark:shadow-[0_4px_0_#2fa6d4] dark:hover:bg-[#8ee3ff] dark:before:bg-white/50 sm:w-auto";

/** Variante clara (ação secundária de peso). */
export const BOTAO_3D_CLARO =
  "h-14 min-h-14 w-full rounded-2xl border-2 border-[#cfe9fb] bg-white px-8 text-base font-extrabold uppercase tracking-wider text-[#1b8fe6] shadow-[0_4px_0_#cfe9fb] transition-[transform,box-shadow] hover:bg-[#f1faff] active:translate-y-1 active:shadow-none dark:border-line dark:bg-card dark:text-ciano dark:shadow-[0_4px_0_#2a2f7a] sm:w-auto";

/** Link de texto em caixa-alta (“Agora não”, “Explorar demonstração”). */
export const LINK_TEXTO =
  "cursor-pointer text-sm font-extrabold uppercase tracking-wider text-[#1b8fe6] underline decoration-2 underline-offset-4 hover:opacity-80 dark:text-ciano";

/** Cartão branco com borda azul-clara e “degrau”, usado nos blocos da jornada. */
export const CARTAO_JOGO =
  "rounded-3xl border-2 border-[#cfe9fb] bg-white shadow-[0_4px_0_#cfe9fb] dark:border-line dark:bg-card dark:shadow-[0_4px_0_#2a2f7a]";

export function Clara({
  largura = 260,
  className,
  prioridade,
}: {
  largura?: number;
  className?: string;
  prioridade?: boolean;
}) {
  return (
    <Image
      src="/clara.png"
      alt="Clara, mascote do EQT Lab, sorrindo e segurando um celular"
      width={400}
      height={604}
      priority={prioridade}
      sizes={`${largura}px`}
      style={{ width: largura, height: "auto" }}
      className={cx("select-none drop-shadow-[0_14px_16px_rgba(20,23,79,0.18)]", className)}
    />
  );
}

/** Balão de fala. `cauda` indica para onde o balão “aponta”. */
export function Balao({
  children,
  className,
  cauda = "baixo",
}: {
  children: React.ReactNode;
  className?: string;
  cauda?: "baixo" | "esquerda";
}) {
  return (
    <div
      className={cx(
        "relative rounded-2xl border-2 border-[#cfe9fb] bg-white px-4 py-3 text-base font-bold leading-snug text-[#14174f] shadow-[0_3px_0_#cfe9fb] dark:border-line dark:bg-card dark:text-ink dark:shadow-none",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className={cx(
          "absolute size-4 rotate-45 border-[#cfe9fb] bg-white dark:border-line dark:bg-card",
          cauda === "baixo" ? "-bottom-[9px] right-12 border-b-2 border-r-2" : "-left-[9px] top-6 border-b-2 border-l-2",
        )}
      />
    </div>
  );
}

/** Logo da EQT Lab. O arquivo é branco: no tema claro vira navy por máscara, no escuro fica como está. */
export function LogoMarca({ largura = 120 }: { largura?: number }) {
  const altura = Math.round((largura * 90) / 364);
  const mascara = {
    width: largura,
    height: altura,
    maskImage: "url(/eqt-lab-logo.png)",
    WebkitMaskImage: "url(/eqt-lab-logo.png)",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "left center",
    WebkitMaskPosition: "left center",
  } as const;
  return (
    <>
      <span role="img" aria-label="EQT Lab by Equatorial" className="block bg-navy dark:hidden" style={mascara} />
      <Image
        src="/eqt-lab-logo.png"
        alt="EQT Lab by Equatorial"
        width={364}
        height={90}
        priority
        style={{ width: largura, height: "auto" }}
        className="hidden dark:block"
      />
    </>
  );
}

/** Nuvens decorativas no pé de uma cena (o mascote “sai” delas). */
export function Nuvens({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cx("pointer-events-none absolute inset-x-0 bottom-0", className)}>
      <div className="absolute -left-10 bottom-0 h-28 w-48 rounded-full bg-white shadow-[0_-8px_24px_rgba(120,190,240,0.25)] dark:bg-bg dark:shadow-none" />
      <div className="absolute -right-12 bottom-0 h-32 w-56 rounded-full bg-white shadow-[0_-8px_24px_rgba(120,190,240,0.25)] dark:bg-bg dark:shadow-none" />
      <div className="absolute inset-x-6 bottom-0 h-24 rounded-t-[3rem] bg-white shadow-[0_-8px_24px_rgba(120,190,240,0.25)] dark:bg-bg dark:shadow-none" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-white dark:bg-bg" />
    </div>
  );
}
