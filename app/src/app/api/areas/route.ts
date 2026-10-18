import { NextResponse, connection } from "next/server";
import { areasOuPadrao } from "@/lib/areas/repositorio";

/** GET /api/areas — as áreas (escudos) da Comunidade, com o link de reunião de cada uma. */
export async function GET() {
  await connection(); // lê o banco a cada requisição (nunca pré-renderiza no build)
  return NextResponse.json(await areasOuPadrao());
}
