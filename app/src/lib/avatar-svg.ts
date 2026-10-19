import { createAvatar } from "@dicebear/core";
import * as avataaars from "@dicebear/avataaars";
import type { AvatarConfig } from "@/lib/avatar";

/** Opções do DiceBear a partir da nossa configuração (tudo fixo: nada de peça sorteada). */
function opcoes(a: AvatarConfig, tamanho: number, semFundo = false) {
  return {
    size: tamanho,
    seed: "futuro-lideres",
    top: [a.cabelo],
    hairColor: [a.corDoCabelo],
    skinColor: [a.pele],
    eyes: [a.olhos],
    eyebrows: [a.sobrancelhas],
    mouth: [a.boca],
    // Probabilidade 100/0: ou a peça aparece, ou não (o padrão do estilo é sortear).
    accessories: a.oculos === "nenhum" ? undefined : [a.oculos],
    accessoriesProbability: a.oculos === "nenhum" ? 0 : 100,
    facialHair: a.barba === "nenhuma" ? undefined : [a.barba],
    facialHairProbability: a.barba === "nenhuma" ? 0 : 100,
    facialHairColor: [a.corDoCabelo], // sem isto a cor da barba é sorteada
    clothing: [a.roupa],
    clothesColor: [a.corDaRoupa],
    backgroundColor: [semFundo ? "transparent" : a.fundo],
  } as never;
}

/** Imagem do avatar para usar em <img src>. Data URI de SVG: não executa script, não depende de rede. */
export function avatarDataUri(a: AvatarConfig, tamanho = 256, semFundo = false): string {
  return createAvatar(avataaars as never, opcoes(a, tamanho, semFundo)).toDataUri();
}

/** Baixa (ou compartilha, no celular) o avatar como PNG, para usar de foto de perfil em outros lugares. */
export async function exportarAvatarPng(a: AvatarConfig, nome: string): Promise<"compartilhado" | "baixado"> {
  const lado = 512;
  const img = new Image();
  img.src = avatarDataUri(a, lado);
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = lado;
  canvas.getContext("2d")!.drawImage(img, 0, 0, lado, lado);
  const blob: Blob = await new Promise((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error("Não foi possível gerar a imagem."))), "image/png"));
  const arquivo = new File([blob], `${nome}.png`, { type: "image/png" });

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: "Meu avatar no Conecta Líderes" });
      return "compartilhado";
    } catch {
      /* cancelou o compartilhamento: cai no download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a2 = document.createElement("a");
  a2.href = url;
  a2.download = arquivo.name;
  a2.click();
  URL.revokeObjectURL(url);
  return "baixado";
}
