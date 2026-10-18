import { access } from "node:fs/promises";
import path from "node:path";
import { connection, NextResponse } from "next/server";

/** Consulta o arquivo pronto; assistir à aula não chama a D-ID. */
export async function GET() {
  await connection();
  const existe = await access(path.join(process.cwd(), "public/clara/modulo-feedback.mp4")).then(() => true, () => false);
  return NextResponse.json({ videoUrl: existe ? "/clara/modulo-feedback.mp4" : null }, { headers: { "Cache-Control": "no-store" } });
}
