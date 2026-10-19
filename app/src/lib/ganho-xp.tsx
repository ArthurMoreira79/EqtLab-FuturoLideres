"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { nivelXP } from "@/lib/estado";

/** Um ganho de XP que acabou de acontecer (some sozinho depois de alguns segundos). */
export interface Ganho {
  /** Muda a cada ganho: serve de `key` para reiniciar as animações. */
  id: number;
  delta: number;
  nivel: number;
  subiuNivel: boolean;
}

const GanhoContext = createContext<Ganho | null>(null);
export const GanhoXpProvider = GanhoContext.Provider;
/** Telas e botões usam isto para reagir quando a pessoa ganha XP (avatar pula, número estoura). */
export const useGanhoXp = () => useContext(GanhoContext);

/**
 * Detecta quando o XP sobe. Fica no AppShell (uma vez só) e distribui pelo contexto.
 * A primeira leitura e a troca de conta só assumem o valor: ninguém comemora ao entrar.
 */
export function useCalcularGanho(xp: number | undefined, conta: string | undefined): Ganho | null {
  const [visto, setVisto] = useState<{ conta?: string; xp?: number }>({ conta, xp });
  const [ganho, setGanho] = useState<Ganho | null>(null);

  if (conta !== visto.conta || (visto.xp === undefined && xp !== undefined)) {
    setVisto({ conta, xp });
  } else if (xp !== undefined && visto.xp !== undefined && xp !== visto.xp) {
    const antes = visto.xp;
    setVisto({ conta, xp });
    if (xp > antes) {
      const nivel = nivelXP(xp).nivel;
      setGanho((g) => ({ id: (g?.id ?? 0) + 1, delta: xp - antes, nivel, subiuNivel: nivel > nivelXP(antes).nivel }));
    }
  }

  useEffect(() => {
    if (!ganho) return;
    const t = setTimeout(() => setGanho(null), ganho.subiuNivel ? 5000 : 2400);
    return () => clearTimeout(t);
  }, [ganho]);

  return ganho;
}
