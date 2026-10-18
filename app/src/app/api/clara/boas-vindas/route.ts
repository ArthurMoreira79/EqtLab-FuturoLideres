import { access } from "node:fs/promises";
import path from "node:path";
import { connection, NextResponse } from "next/server";

/** Só consulta o vídeo já gerado. Abrir o painel nunca gera uma cobrança na D-ID. */
export async function GET() {
  await connection();
  const arquivos = ["boas-vindas-cenario.mp4", "boas-vindas.mp4"];
  let videoUrl: string | null = null;
  for (const arquivo of arquivos) {
    const existe = await access(path.join(process.cwd(), "public/clara", arquivo)).then(() => true, () => false);
    if (existe) { videoUrl = `/clara/${arquivo}`; break; }
  }
  return NextResponse.json({ videoUrl }, { headers: { "Cache-Control": "no-store" } });
}
