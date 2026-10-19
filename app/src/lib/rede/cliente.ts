"use client";
import { api } from "@/lib/api";
import type { AcaoRede, DetalheRede, PessoaRede, ResumoRede } from "./contratos";
export const redeApi = {
  resumo: () => api.chamar<ResumoRede>("/api/rede", { cache: "no-store" }),
  grupo: (id: string) => api.chamar<DetalheRede>(`/api/rede?equipe=${encodeURIComponent(id)}`, { cache: "no-store" }),
  buscar: (email: string, signal: AbortSignal) => api.chamar<{ pessoas: PessoaRede[] }>(`/api/rede?busca=${encodeURIComponent(email)}`, { signal }).then((r) => r.pessoas),
  agir: (acao: AcaoRede) => api.chamar<{ equipeId?: string }>("/api/rede", { method: "POST", body: JSON.stringify(acao) }),
};
