"use client";

import { CaminhoTrilha } from "@/components/painel/CaminhoTrilha";
import { TituloPagina } from "@/components/ui";
import { useEstado } from "@/lib/estado";

export default function Trilha() {
  const estado = useEstado();
  if (!estado) return null;

  const concluidos = Object.values(estado.progresso).filter((p) => p.concluido).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <TituloPagina
        sobre="Personalizada pelo seu diagnóstico"
        descricao={`${concluidos} de ${estado.trilha.length} módulos concluídos · cerca de 18 min por módulo`}
      >
        Sua trilha
      </TituloPagina>

      {/* Cada ponto é um passo; a Clara acompanha o caminho e pula até o ponto que você apontar. */}
      <CaminhoTrilha estado={estado} modo="completo" />
    </div>
  );
}
