import { z } from "zod";

/**
 * Avatar da pessoa (o “emblema” do perfil), montado com peças do estilo avataaars do DiceBear.
 * Este arquivo só tem as regras (listas de peças + schema) para servir ao navegador e ao servidor;
 * quem desenha o SVG é `lib/avatar-svg.ts` (só no navegador).
 */

export const GENEROS = ["feminino", "masculino"] as const;
export type Genero = (typeof GENEROS)[number];

/** Cabelos disponíveis por gênero (a pessoa escolhe a base e depois personaliza). */
export const CABELOS: Record<Genero, readonly string[]> = {
  feminino: [
    "longButNotTooLong", "straight01", "straight02", "straightAndStrand", "miaWallace", "bob", "bun", "curvy",
    "curly", "frida", "bigHair", "fro", "froBand", "dreads", "hijab",
  ],
  masculino: [
    "shortFlat", "shortRound", "shortWaved", "shortCurly", "theCaesar", "theCaesarAndSidePart", "sides",
    "shavedSides", "frizzle", "shaggy", "shaggyMullet", "dreads01", "dreads02", "fro", "froBand",
  ],
};

export const BARBAS = ["nenhuma", "beardLight", "beardMedium", "beardMajestic", "moustacheFancy", "moustacheMagnum"] as const;
export const OCULOS = ["nenhum", "prescription01", "prescription02", "round", "wayfarers", "sunglasses"] as const;
export const OLHOS = ["default", "happy", "wink", "side", "squint", "surprised", "hearts"] as const;
export const SOBRANCELHAS = ["defaultNatural", "flatNatural", "raisedExcitedNatural", "upDownNatural", "angryNatural", "default"] as const;
export const BOCAS = ["smile", "default", "twinkle", "serious", "tongue", "concerned"] as const;
export const ROUPAS: Record<Genero, readonly string[]> = {
  feminino: ["shirtScoopNeck", "shirtVNeck", "shirtCrewNeck", "hoodie", "blazerAndShirt", "graphicShirt", "collarAndSweater", "overall"],
  masculino: ["shirtCrewNeck", "hoodie", "collarAndSweater", "blazerAndShirt", "blazerAndSweater", "graphicShirt", "shirtVNeck", "overall"],
};

export const CORES_PELE = ["ffdbb4", "edb98a", "fd9841", "f8d25c", "d08b5b", "ae5d29", "614335"] as const;
export const CORES_CABELO = ["2c1b18", "4a312c", "724133", "a55728", "b58143", "d6b370", "ecdcbf", "e8e1e1", "c93305", "f59797"] as const;
export const CORES_ROUPA = ["262e33", "3c4f5c", "25557c", "5199e4", "65c9ff", "b1e2ff", "a7ffc4", "ffffb1", "ffafb9", "ff488e", "ff5c5c", "929598", "e6e6e6", "ffffff"] as const;
export const CORES_FUNDO = ["d1d4f9", "b6e3f4", "c9f2c7", "fff3b0", "ffdfbf", "ffd5dc", "c0aede", "e6e6e6"] as const;

const todos = <T extends string>(l: readonly T[]) => z.enum(l as [T, ...T[]]);

const unicos = [...new Set([...CABELOS.feminino, ...CABELOS.masculino])];
const roupasUnicas = [...new Set([...ROUPAS.feminino, ...ROUPAS.masculino])];

export const avatarSchema = z
  .object({
    genero: z.enum(GENEROS),
    cabelo: todos(unicos),
    corDoCabelo: todos(CORES_CABELO),
    pele: todos(CORES_PELE),
    olhos: todos(OLHOS),
    sobrancelhas: todos(SOBRANCELHAS),
    boca: todos(BOCAS),
    oculos: todos(OCULOS),
    barba: todos(BARBAS),
    roupa: todos(roupasUnicas),
    corDaRoupa: todos(CORES_ROUPA),
    fundo: todos(CORES_FUNDO),
  })
  .strict()
  // Regras de coerência: a peça precisa existir para o gênero escolhido, e barba só no masculino.
  .refine((a) => CABELOS[a.genero].includes(a.cabelo), { message: "Esse cabelo não existe para o gênero escolhido.", path: ["cabelo"] })
  .refine((a) => ROUPAS[a.genero].includes(a.roupa), { message: "Essa roupa não existe para o gênero escolhido.", path: ["roupa"] })
  .refine((a) => a.genero === "masculino" || a.barba === "nenhuma", { message: "Barba só está disponível no avatar masculino.", path: ["barba"] });

export type AvatarConfig = z.infer<typeof avatarSchema>;

/** Ponto de partida neutro: a pessoa personaliza logo em seguida (não presumimos nada a partir do nome). */
export const AVATAR_PADRAO: AvatarConfig = {
  genero: "masculino",
  cabelo: "shortCurly",
  corDoCabelo: "2c1b18",
  pele: "edb98a",
  olhos: "default",
  sobrancelhas: "defaultNatural",
  boca: "smile",
  oculos: "nenhum",
  barba: "nenhuma",
  roupa: "shirtCrewNeck",
  corDaRoupa: "5199e4",
  fundo: "b6e3f4",
};

/** Ao trocar de gênero, troca só o que deixaria de existir (cabelo, roupa e barba); o resto é mantido. */
export function trocarGenero(a: AvatarConfig, genero: Genero): AvatarConfig {
  if (a.genero === genero) return a;
  return {
    ...a,
    genero,
    cabelo: CABELOS[genero].includes(a.cabelo) ? a.cabelo : CABELOS[genero][0],
    roupa: ROUPAS[genero].includes(a.roupa) ? a.roupa : ROUPAS[genero][0],
    barba: genero === "masculino" ? a.barba : "nenhuma",
  };
}

/** Lê um valor salvo (localStorage/banco) com segurança: se estiver inválido, devolve null. */
export function lerAvatar(valor: unknown): AvatarConfig | null {
  const r = avatarSchema.safeParse(valor);
  return r.success ? r.data : null;
}
