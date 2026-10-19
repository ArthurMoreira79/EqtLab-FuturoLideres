import "server-only";
import { consultar } from "@/lib/db";

export interface ResultadoLimite {
  ok: boolean;
  /** Segundos até a janela reiniciar (use no Retry-After). */
  tentarEmSeg: number;
}

/**
 * Rate limit em janela fixa guardado no Postgres, então vale para todas as instâncias do servidor
 * (um contador em memória não funcionaria no serverless). Uma única instrução atômica por chamada.
 */
export async function limitar(chave: string, max: number, janelaSeg: number): Promise<ResultadoLimite> {
  const { rows } = await consultar<{ contagem: number; restante: number }>(
    `INSERT INTO limites_taxa (chave, contagem, janela_inicio) VALUES ($1, 1, now())
     ON CONFLICT (chave) DO UPDATE SET
       contagem = CASE WHEN limites_taxa.janela_inicio <= now() - ($2::int * interval '1 second')
                       THEN 1 ELSE limites_taxa.contagem + 1 END,
       janela_inicio = CASE WHEN limites_taxa.janela_inicio <= now() - ($2::int * interval '1 second')
                            THEN now() ELSE limites_taxa.janela_inicio END
     RETURNING contagem,
       GREATEST(1, CEIL(EXTRACT(EPOCH FROM (janela_inicio + ($2::int * interval '1 second') - now()))))::int AS restante`,
    [chave, janelaSeg],
  );
  limparAntigos();
  const { contagem, restante } = rows[0];
  return { ok: contagem <= max, tentarEmSeg: restante };
}

/** Zera um contador (ex.: login certo apaga as falhas daquela conta). */
export async function zerarLimite(chave: string): Promise<void> {
  await consultar("DELETE FROM limites_taxa WHERE chave = $1", [chave]);
}

/** Faxina oportunista: de vez em quando apaga registros vencidos, sem precisar de cron. */
function limparAntigos() {
  if (Math.random() > 0.02) return;
  void consultar(
    `WITH a AS (DELETE FROM limites_taxa WHERE janela_inicio < now() - interval '1 day'),
          b AS (DELETE FROM cadastros_rascunho WHERE expira_em < now())
     DELETE FROM sessoes WHERE expira_em < now() - interval '1 day'`,
  ).catch(() => {});
}
