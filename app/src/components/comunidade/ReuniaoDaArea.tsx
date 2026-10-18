import { ExternalLink, Video, Users } from "lucide-react";
import { cx } from "@/components/ui";
import { ROTULO_PROVEDOR, urlSegura, type Area } from "@/lib/areas";

/** Faixa no topo do fórum com o link da reunião da área (abre no Meet ou no Teams, em outra aba). */
export function ReuniaoDaArea({ area }: { area: Area }) {
  const reuniao = area.reuniao;
  const url = urlSegura(reuniao?.url);

  if (!reuniao || !url) {
    return (
      <p className="rounded-2xl border-2 border-dashed border-line px-4 py-3.5 text-sm text-muted">
        {area.nome} ainda não tem uma reunião fixa. Quando tiver, o link aparece aqui.
      </p>
    );
  }

  const Icone = reuniao.provedor === "meet" ? Video : Users;
  return (
    <section
      aria-label={`Reunião da área ${area.nome}`}
      className="flex flex-wrap items-center gap-4 rounded-2xl border-2 bg-card p-4 shadow-[0_3px_0_var(--line)]"
      style={{ borderColor: `color-mix(in srgb, ${area.cor} 55%, var(--line))` }}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]" style={{ background: area.cor }}>
        <Icone aria-hidden className="size-6" />
      </span>
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
          Reunião da área · {ROTULO_PROVEDOR[reuniao.provedor]}
        </p>
        <p className="text-lg font-extrabold leading-tight">{reuniao.titulo}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl sm:w-auto bg-primary px-5 text-sm font-extrabold uppercase tracking-wide text-on-primary",
          "shadow-[0_4px_0_#0b4f91] transition-[transform,box-shadow] hover:bg-primary-hover active:translate-y-1 active:shadow-none dark:shadow-[0_4px_0_#2fa6d4]",
        )}
      >
        Entrar na reunião <ExternalLink aria-hidden className="size-4" />
        <span className="sr-only">(abre em uma nova aba)</span>
      </a>
    </section>
  );
}
