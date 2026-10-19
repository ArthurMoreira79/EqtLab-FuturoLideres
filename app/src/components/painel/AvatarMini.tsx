"use client";

import Link from "next/link";
import { AvatarEmblema } from "@/components/AvatarEmblema";
import { cx } from "@/components/ui";
import { useGanhoXp } from "@/lib/ganho-xp";
import { nivelXP, type Estado } from "@/lib/estado";

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** O boneco da pessoa em formato de bolinha. Pula quando ela ganha XP e balança ao passar o mouse. */
export function AvatarMini({ estado, tamanho = 36, className }: { estado: Estado; tamanho?: number; className?: string }) {
  const ganho = useGanhoXp();
  return (
    <span
      key={ganho?.id ?? 0}
      aria-hidden
      className={cx(
        "grid shrink-0 origin-bottom place-items-center overflow-hidden rounded-full bg-[#ddf4ff] font-extrabold text-[#1478d0] ring-2 ring-[#84d8ff] dark:bg-selected dark:text-ciano dark:ring-ciano/60",
        ganho && "motion-safe:animate-saltar",
        className,
      )}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
    >
      {estado.avatar ? <AvatarEmblema avatar={estado.avatar} tamanho={tamanho} semFundo /> : iniciais(estado.perfil.nome)}
    </span>
  );
}

/** “Nível N” com o avatar: leva ao perfil. O número estoura quando o nível sobe. */
export function ChipNivel({ estado }: { estado: Estado }) {
  const ganho = useGanhoXp();
  const { nivel } = nivelXP(estado.xp);
  return (
    <Link
      href="/perfil"
      aria-label={`Seu perfil. Nível ${nivel}`}
      className="group inline-flex items-center gap-2 rounded-2xl border-2 border-line bg-card py-1 pl-1 pr-3.5 text-sm font-extrabold shadow-[0_3px_0_var(--line)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--line)] active:translate-y-0.5 active:shadow-none"
    >
      <span className="motion-safe:group-hover:animate-abanar">
        <AvatarMini estado={estado} tamanho={36} />
      </span>
      <span key={ganho?.subiuNivel ? ganho.id : 0} className={cx(ganho?.subiuNivel && "motion-safe:animate-pop text-[#1478d0] dark:text-ciano")}>
        Nível {nivel}
      </span>
    </Link>
  );
}
