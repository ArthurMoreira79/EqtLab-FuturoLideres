import "server-only";
import { z } from "zod";
import { consultar } from "@/lib/db";

/**
 * Cadastro em andamento. O navegador guarda só o id (cookie HttpOnly, uuid aleatório de 122 bits,
 * impossível de adivinhar); os dados ficam no banco e são acumulados a cada fase concluída.
 */

export const COOKIE_RASCUNHO = "fl_rascunho";
export const DURACAO_RASCUNHO_SEG = 60 * 60 * 24 * 7;

const idSchema = z.uuid();

export interface Rascunho {
  id: string;
  fase: number;
  dados: Record<string, unknown>;
}

/** Só aceita ids bem formados — o valor do cookie nunca vai cru para uma consulta. */
export function idValido(valor: string | undefined): string | null {
  const r = idSchema.safeParse(valor);
  return r.success ? r.data : null;
}

export async function obterRascunho(id: string): Promise<Rascunho | null> {
  const { rows } = await consultar<Rascunho>(
    `SELECT id, fase, dados FROM cadastros_rascunho WHERE id = $1 AND expira_em > now()`,
    [id],
  );
  return rows[0] ?? null;
}

/** Junta os dados da etapa ao rascunho (cria um novo se o id não existir mais). */
export async function salvarEtapa(id: string | null, etapa: number, dados: Record<string, unknown>): Promise<Rascunho> {
  if (id) {
    const { rows } = await consultar<Rascunho>(
      `UPDATE cadastros_rascunho
         SET dados = dados || $2::jsonb,
             fase = GREATEST(fase, $3::int),
             atualizado_em = now(),
             expira_em = now() + interval '7 days'
       WHERE id = $1 AND expira_em > now()
       RETURNING id, fase, dados`,
      [id, JSON.stringify(dados), etapa + 1],
    );
    if (rows[0]) return rows[0];
  }
  const { rows } = await consultar<Rascunho>(
    `INSERT INTO cadastros_rascunho (dados, fase) VALUES ($1::jsonb, $2::int) RETURNING id, fase, dados`,
    [JSON.stringify(dados), etapa + 1],
  );
  return rows[0];
}

export async function apagarRascunho(id: string) {
  await consultar("DELETE FROM cadastros_rascunho WHERE id = $1", [id]);
}
