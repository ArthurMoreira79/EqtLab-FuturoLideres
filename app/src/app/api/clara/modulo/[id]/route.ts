import { access } from "node:fs/promises";
import path from "node:path";
import { connection, NextResponse } from "next/server";
import { VIDEOS_MODULO } from "@/lib/conteudo/videos-modulo";

/** Consulta o arquivo pronto; assistir à aula não chama a D-ID. Só módulos cadastrados (nada de caminho vindo da URL). */
export async function GET(_req: Request, ctx: RouteContext<"/api/clara/modulo/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!Object.hasOwn(VIDEOS_MODULO, id)) return NextResponse.json({ videoUrl: null }, { status: 404 });
  const arquivo = `/clara/modulo-${id}.mp4`;
  const existe = await access(path.join(process.cwd(), "public", arquivo)).then(() => true, () => false);
  return NextResponse.json({ videoUrl: existe ? arquivo : null }, { headers: { "Cache-Control": "no-store" } });
}
