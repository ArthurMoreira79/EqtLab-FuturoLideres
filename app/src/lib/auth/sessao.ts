import "server-only";
import { SignJWT, errors, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { consultar } from "@/lib/db";

/**
 * Sessão = JWT assinado (HS256) em cookie HttpOnly + uma linha na tabela `sessoes`.
 * O JWT sozinho já prova quem é a pessoa; a linha no banco permite REVOGAR (logout de verdade,
 * “sair de todos os dispositivos”) — coisa que um JWT puro não consegue.
 */

export const COOKIE_SESSAO = "fl_sessao";
const DURACAO_SEG = 60 * 60 * 24 * 7;
const EMISSOR = "futuro-lideres";
const AUDIENCIA = "futuro-lideres:app";

let avisouSegredo = false;

function segredo(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 32) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Defina JWT_SECRET com pelo menos 32 caracteres (ex.: `openssl rand -base64 32`).");
  }
  if (!avisouSegredo) {
    avisouSegredo = true;
    console.warn("[auth] JWT_SECRET ausente: usando um segredo FIXO de desenvolvimento. Nunca faça isso em produção.");
  }
  return new TextEncoder().encode("segredo-somente-para-desenvolvimento-local");
}

export function opcoesCookie(maxAge: number) {
  return {
    httpOnly: true, // JavaScript da página não consegue ler o cookie (protege contra XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export interface SessaoAtiva {
  usuarioId: string;
  sessaoId: string;
}

export async function criarSessao(usuarioId: string, contexto: { ip: string; userAgent: string | null }) {
  const expira = new Date(Date.now() + DURACAO_SEG * 1000);
  const { rows } = await consultar<{ id: string }>(
    `INSERT INTO sessoes (usuario_id, expira_em, ip, user_agent) VALUES ($1, $2, $3, $4) RETURNING id`,
    [usuarioId, expira, contexto.ip, contexto.userAgent?.slice(0, 300) ?? null],
  );
  const token = await new SignJWT({ sid: rows[0].id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuer(EMISSOR)
    .setAudience(AUDIENCIA)
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(segredo());
  (await cookies()).set(COOKIE_SESSAO, token, opcoesCookie(DURACAO_SEG));
}

/** Devolve a sessão válida do cookie atual, ou null (sem cookie, adulterado, expirado ou revogado). */
export async function obterSessao(): Promise<SessaoAtiva | null> {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, segredo(), {
      issuer: EMISSOR,
      audience: AUDIENCIA,
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
    const { rowCount } = await consultar(
      `SELECT 1 FROM sessoes WHERE id = $1 AND usuario_id = $2 AND revogada_em IS NULL AND expira_em > now()`,
      [payload.sid, payload.sub],
    );
    return rowCount ? { usuarioId: payload.sub, sessaoId: payload.sid } : null;
  } catch (e) {
    // Token adulterado, expirado ou de outro emissor é normal: simplesmente não há sessão.
    if (e instanceof errors.JOSEError) return null;
    throw e; // o resto (ex.: banco fora do ar) sobe para virar 503
  }
}

export async function encerrarSessao() {
  const sessao = await obterSessao();
  if (sessao) await consultar("UPDATE sessoes SET revogada_em = now() WHERE id = $1", [sessao.sessaoId]);
  (await cookies()).delete(COOKIE_SESSAO);
}
