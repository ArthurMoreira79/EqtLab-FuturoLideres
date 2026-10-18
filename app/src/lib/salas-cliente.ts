"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ErroApi, authApi } from "@/lib/auth/cliente";
import type { EstadoSala, SalaNova } from "@/lib/salas/contratos";
import { calcularFase } from "@/lib/salas/contratos";

async function chamar<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique a internet.", 0);
  }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroApi(dados.erro ?? "Algo deu errado. Tente novamente.", r.status);
  return dados as T;
}

export const salasApi = {
  criar: (sala: SalaNova) => chamar<{ codigo: string }>("/api/salas", { method: "POST", body: JSON.stringify(sala) }),
  entrar: (codigo: string) => chamar<{ codigo: string }>("/api/salas/entrar", { method: "POST", body: JSON.stringify({ codigo }) }),
  estado: (codigo: string) => chamar<EstadoSala>(`/api/salas/${codigo}`),
  responder: (codigo: string, alternativa: number) =>
    chamar<{ ok: true }>(`/api/salas/${codigo}/responder`, { method: "POST", body: JSON.stringify({ alternativa }) }),
  iniciar: (codigo: string) => chamar<{ ok: true }>(`/api/salas/${codigo}/iniciar`, { method: "POST" }),
};

/** O papel da conta (só “admin” cria sala). `null` enquanto carrega ou sem login. */
export function usePapel(): "membro" | "admin" | null {
  const [papel, setPapel] = useState<"membro" | "admin" | null>(null);
  useEffect(() => {
    let ativo = true;
    authApi
      .eu()
      .then((u) => ativo && setPapel(u.papel))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);
  return papel;
}

export interface SalaAoVivo {
  /** Último estado vindo do servidor (null até o primeiro). */
  dados: EstadoSala | null;
  erro: { mensagem: string; fatal: boolean } | null;
  /** Relógio do servidor, atualizado várias vezes por segundo. */
  agora: number;
  /** Fase e pergunta pela conta do relógio (já na virada, sem esperar o próximo estado). */
  etapa: ReturnType<typeof calcularFase> | null;
  /** O estado recebido ainda é da fase anterior (a virada acabou de acontecer). */
  desatualizado: boolean;
  atualizar: () => Promise<void>;
}

/**
 * Acompanha a sala: consulta o estado a cada segundo (mais rápido na virada de fase), corrige o relógio
 * do navegador pelo do servidor e devolve a fase calculada localmente para as contagens ficarem lisas.
 */
export function useSalaAoVivo(codigo: string, ativo: boolean): SalaAoVivo {
  const [dados, setDados] = useState<EstadoSala | null>(null);
  const [erro, setErro] = useState<SalaAoVivo["erro"]>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const desvio = useRef(0);
  const ultimo = useRef<EstadoSala | null>(null);
  const fatal = useRef(false);

  const atualizar = useCallback(async () => {
    const t0 = Date.now();
    try {
      const novo = await salasApi.estado(codigo);
      const t1 = Date.now();
      desvio.current = novo.agora - (t0 + t1) / 2;
      ultimo.current = novo;
      setDados(novo);
      setErro(null);
    } catch (e) {
      const status = e instanceof ErroApi ? e.status : 0;
      // 401/403/404: não adianta insistir. Queda de rede ou 5xx: segue tentando.
      if (status === 401 || status === 403 || status === 404 || status === 400) fatal.current = true;
      setErro({ mensagem: e instanceof Error ? e.message : "Falha ao atualizar a sala.", fatal: fatal.current });
    }
  }, [codigo]);

  useEffect(() => {
    if (!ativo) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;
    async function ciclo() {
      await atualizar();
      if (cancelado || fatal.current) return;
      const d = ultimo.current;
      const etapa = d && calcularFase(d.inicioEm, d.temposS, Date.now() + desvio.current);
      const virou = !!d && !!etapa && (etapa.fase !== d.fase || etapa.indice !== d.indice);
      timer = setTimeout(ciclo, virou ? 350 : 1000);
    }
    ciclo();
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [ativo, atualizar]);

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => setAgora(Date.now() + desvio.current), 200);
    return () => clearInterval(id);
  }, [ativo]);

  const etapa = dados ? calcularFase(dados.inicioEm, dados.temposS, agora) : null;
  const desatualizado = !!dados && !!etapa && (etapa.fase !== dados.fase || etapa.indice !== dados.indice);
  return { dados, erro, agora, etapa, desatualizado, atualizar };
}
