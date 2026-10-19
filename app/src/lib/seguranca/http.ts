import "server-only";
import { NextResponse } from "next/server";
import { ErroBanco } from "@/lib/db";
import { limitar } from "./limite";

export function respostaErro(status: number, erro: string, extra?: Record<string, unknown>, headers?: HeadersInit) {
  return NextResponse.json({ erro, ...extra }, { status, headers });
}

/** IP do cliente. Atrás de proxy (Vercel etc.) vem em x-forwarded-for. */
export function ipDoCliente(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (encaminhado || req.headers.get("x-real-ip") || "local").slice(0, 64);
}

/** Defesa extra contra CSRF (além do SameSite=Lax): se há Origin, ela precisa ser deste mesmo site. */
export function origemValida(req: Request): boolean {
  const origem = req.headers.get("origin");
  if (!origem) return true;
  try {
    return new URL(origem).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** Lê o JSON do corpo com teto de tamanho. Devolve null se for inválido ou grande demais. */
export async function lerJson(req: Request, maxBytes = 8_192): Promise<unknown> {
  if (Number(req.headers.get("content-length") ?? 0) > maxBytes) return null;
  const texto = await req.text();
  if (texto.length > maxBytes) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/** Aplica um limite e, se estourou, já devolve a resposta 429 pronta. */
export async function aplicarLimite(chave: string, max: number, janelaSeg: number): Promise<NextResponse | null> {
  const r = await limitar(chave, max, janelaSeg);
  if (r.ok) return null;
  const minutos = Math.ceil(r.tentarEmSeg / 60);
  const quando = r.tentarEmSeg < 90 ? `${r.tentarEmSeg} segundos` : `${minutos} minutos`;
  return respostaErro(
    429,
    `Muitas tentativas. Tente de novo em ${quando}.`,
    { tentarEmSeg: r.tentarEmSeg },
    { "Retry-After": String(r.tentarEmSeg) },
  );
}

/** Rodeia o handler: falha de banco/config vira 503 amigável e o detalhe fica só no log do servidor. */
export async function comTratamento(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    console.error("[api]", e);
    const indisponivel = e instanceof ErroBanco || (e as { code?: string })?.code?.startsWith?.("ECONN");
    return respostaErro(
      indisponivel ? 503 : 500,
      indisponivel
        ? "Não conseguimos acessar o banco de dados agora. Tente novamente em instantes."
        : "Algo deu errado do nosso lado. Tente novamente.",
    );
  }
}
