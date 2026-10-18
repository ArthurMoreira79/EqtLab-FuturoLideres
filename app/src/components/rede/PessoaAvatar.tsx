import { AvatarEmblema } from "@/components/AvatarEmblema";
import type { AvatarConfig } from "@/lib/avatar";

export function PessoaAvatar({ nome, avatar }: { nome: string; avatar?: AvatarConfig | null }) {
  return (
    <span aria-hidden className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-tint-cyan text-sm font-extrabold text-tint-cyan-ink">
      {avatar ? <AvatarEmblema avatar={avatar} tamanho={40} /> : nome.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
    </span>
  );
}
