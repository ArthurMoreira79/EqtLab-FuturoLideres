import { AvatarEmblema } from "@/components/AvatarEmblema";
import { cx } from "@/components/ui";
import type { ParticipanteSala } from "@/lib/salas/contratos";

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;

/** Foto redonda da pessoa: o avatar do perfil ou, se ainda não criou, as iniciais. */
export function FotoPessoa({
  pessoa,
  tamanho,
  className,
}: {
  pessoa: Pick<ParticipanteSala, "nome" | "avatar">;
  tamanho: number;
  className?: string;
}) {
  const iniciais = pessoa.nome
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center overflow-hidden rounded-full bg-tint-cyan font-extrabold text-tint-cyan-ink", className)}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
    >
      {pessoa.avatar ? <AvatarEmblema avatar={pessoa.avatar} tamanho={tamanho} /> : iniciais}
    </span>
  );
}
