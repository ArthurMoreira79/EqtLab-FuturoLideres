"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { acoes, hoje, type Estado } from "@/lib/estado";

/** Garante que existe uma missão para hoje, sorteando no servidor quando necessário. */
export function useMissaoDoDia(estado: Estado) {
  const [erro, setErro] = useState<string | null>(null);
  const pedindo = useRef(false);
  const precisa = !estado.missao || estado.missao.data !== hoje();
  const { pontuacoes, submissoes, missao } = estado;

  function pedir(troca: boolean) {
    if (pedindo.current) return;
    pedindo.current = true;
    const recentes = submissoes.slice(0, 8).map((s) => s.desafioId);
    api
      .sortearMissao(pontuacoes, recentes, troca ? missao?.desafio.id : undefined)
      .then((desafio) => {
        setErro(null);
        acoes.definirMissao({ data: hoje(), desafio, status: "pendente" }, troca);
      })
      .catch((e: Error) => setErro(e.message))
      .finally(() => {
        pedindo.current = false;
      });
  }

  useEffect(() => {
    if (!precisa || pedindo.current) return;
    pedindo.current = true;
    api
      .sortearMissao(pontuacoes, submissoes.slice(0, 8).map((s) => s.desafioId))
      .then((desafio) => acoes.definirMissao({ data: hoje(), desafio, status: "pendente" }))
      .catch((e: Error) => setErro(e.message))
      .finally(() => {
        pedindo.current = false;
      });
  }, [precisa, pontuacoes, submissoes]);

  return { missao: precisa ? null : missao, erro, sortear: (troca = false) => pedir(troca) };
}
