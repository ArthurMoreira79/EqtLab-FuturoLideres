import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { criarPost, listarPosts, verificarDadosPessoais } from "@/lib/comunidade/repositorio";
import { competenciaSlug } from "@/lib/ia/schema";

/** GET /api/comunidade?tag=feedback&semResposta=1&q=texto */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const tag = competenciaSlug.safeParse(p.get("tag"));
  const posts = listarPosts({
    tag: tag.success ? tag.data : undefined,
    semResposta: p.get("semResposta") === "1",
    busca: p.get("q") ?? undefined,
  });
  return NextResponse.json(posts);
}

const novoPostSchema = z.object({
  titulo: z.string().trim().min(8, "Escreva um título com pelo menos 8 caracteres.").max(140),
  corpo: z.string().trim().min(20, "Conte um pouco mais sobre a situação.").max(3000),
  tags: z.array(competenciaSlug).min(1, "Escolha ao menos uma competência.").max(3),
  anonimo: z.boolean(),
  autor: z.string().trim().max(80),
  setor: z.string().trim().max(80).optional(),
});

/** POST /api/comunidade — cria um tópico. */
export async function POST(request: NextRequest) {
  const dados = novoPostSchema.safeParse(await request.json().catch(() => null));
  if (!dados.success) {
    return NextResponse.json({ erro: dados.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }
  const alerta = verificarDadosPessoais(`${dados.data.titulo} ${dados.data.corpo}`);
  if (alerta) {
    return NextResponse.json({ erro: `${alerta} Remova dados pessoais antes de publicar.` }, { status: 422 });
  }
  const post = criarPost({
    ...dados.data,
    autor: dados.data.anonimo ? "Anônimo" : dados.data.autor || "Líder",
  });
  return NextResponse.json(post, { status: 201 });
}
