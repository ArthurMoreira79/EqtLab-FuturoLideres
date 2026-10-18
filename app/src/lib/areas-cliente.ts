"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AREAS_PADRAO, type Area } from "@/lib/areas";

/** Áreas para a tela: começa com a lista padrão (sem piscar) e troca pela do banco quando ela chega. */
export function useAreas(): Area[] {
  const [areas, setAreas] = useState<Area[]>(AREAS_PADRAO);
  useEffect(() => {
    let ativo = true;
    api
      .chamar<{ areas: Area[] }>("/api/areas")
      .then((r) => {
        if (ativo && r.areas.length > 0) setAreas(r.areas);
      })
      .catch(() => {}); // sem rede/banco: segue com a lista padrão
    return () => {
      ativo = false;
    };
  }, []);
  return areas;
}
