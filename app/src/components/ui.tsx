import Link from "next/link";
import { Sparkles } from "lucide-react";
import { competencia } from "@/lib/competencias";
import type { CompetenciaSlug } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const BASE_BOTAO =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-extrabold uppercase tracking-wide transition-[transform,box-shadow,background-color] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

/** Botões no estilo “jogo”: degrau embaixo que afunda ao clicar. */
export const botao = {
  primario: `${BASE_BOTAO} bg-primary text-on-primary shadow-[0_4px_0_#0b4f91] hover:bg-primary-hover dark:shadow-[0_4px_0_#2fa6d4]`,
  secundario: `${BASE_BOTAO} border-2 border-line bg-card text-link shadow-[0_4px_0_var(--line)] hover:bg-sunken`,
  /** Entrar em uma sala de jogo: verde, para se destacar dos botões azuis. */
  sala: `${BASE_BOTAO} bg-[#16a34a] text-white shadow-[0_4px_0_#15803d] hover:bg-[#1fb957]`,
  destaque: `${BASE_BOTAO} bg-ciano text-noite shadow-[0_4px_0_#2fa6d4] hover:bg-[#8ee3ff]`,
  fantasma: `${BASE_BOTAO} border-2 border-lilas text-white hover:bg-white/10`,
};

export function Card({
  children,
  className,
  as: Tag = "section",
  ...rest
}: { children: React.ReactNode; className?: string; as?: "section" | "div" | "article" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cx("rounded-3xl border-2 border-line bg-card p-5 shadow-[0_3px_0_var(--line)] sm:p-6", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function TituloSecao({ children, acao }: { children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold">{children}</h2>
      {acao}
    </div>
  );
}

export function LinkAcao({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold text-link hover:underline">
      {children}
    </Link>
  );
}

export function TagCompetencia({ slug, sobreEscuro }: { slug: CompetenciaSlug; sobreEscuro?: boolean }) {
  const c = competencia(slug);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        sobreEscuro ? "bg-white/20 text-white" : "bg-sunken text-ink",
      )}
    >
      <span aria-hidden className="size-2 rounded-full" style={{ background: c.cor }} />
      {c.curto}
    </span>
  );
}

export function SeloIA({ texto = "Gerado por IA" }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-purple px-2.5 py-1 text-xs font-bold text-tint-purple-ink">
      <Sparkles aria-hidden className="size-3.5" />
      {texto}
    </span>
  );
}

export function Barra({ valor, className, cor }: { valor: number; className?: string; cor?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, valor)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx("h-2.5 overflow-hidden rounded-full bg-line", className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

export function TituloPagina({ sobre, children, descricao }: { sobre?: string; children: React.ReactNode; descricao?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-1.5">
      {sobre && <span className="text-xs font-bold uppercase tracking-[0.12em] text-tint-purple-ink">{sobre}</span>}
      <h1 className="font-display text-3xl font-extrabold italic text-heading sm:text-4xl">{children}</h1>
      {descricao && <p className="text-muted">{descricao}</p>}
    </header>
  );
}

export function Carregando({ mensagem = "Carregando…" }: { mensagem?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <div className="h-6 w-2/3 animate-pulse rounded-lg bg-line" />
      <div className="h-4 w-full animate-pulse rounded-lg bg-line" />
      <div className="h-4 w-5/6 animate-pulse rounded-lg bg-line" />
      <span className="text-sm text-muted">{mensagem}</span>
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-line p-6">
      <p className="font-semibold">{titulo}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Aviso({ children, tipo = "erro" }: { children: React.ReactNode; tipo?: "erro" | "info" }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cx(
        "rounded-xl px-4 py-3 text-sm",
        tipo === "erro" ? "bg-tint-risk text-tint-risk-ink" : "bg-tint-cyan text-tint-cyan-ink",
      )}
    >
      {children}
    </p>
  );
}

export function formatarData(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function tempoRelativo(iso: string) {
  const h = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  if (h < 1) return "agora";
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
