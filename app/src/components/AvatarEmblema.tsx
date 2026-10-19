"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { AvatarConfig } from "@/lib/avatar";
import { avatarDataUri } from "@/lib/avatar-svg";
import { cx } from "./ui";

/** O avatar da pessoa (emblema do perfil). É uma imagem SVG gerada no navegador: não depende de rede. */
export function AvatarEmblema({
  avatar,
  tamanho = 220,
  semFundo,
  className,
}: {
  avatar: AvatarConfig;
  tamanho?: number;
  /** Fundo transparente (para pôr o avatar sobre outra cor). */
  semFundo?: boolean;
  className?: string;
}) {
  const src = useMemo(() => avatarDataUri(avatar, tamanho * 2, semFundo), [avatar, tamanho, semFundo]);
  return (
    <Image
      src={src}
      alt="Seu avatar"
      width={tamanho}
      height={tamanho}
      unoptimized
      draggable={false}
      className={cx("select-none", className)}
      style={{ width: tamanho, height: tamanho }}
    />
  );
}
