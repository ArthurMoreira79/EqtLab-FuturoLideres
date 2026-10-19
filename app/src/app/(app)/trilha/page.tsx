"use client";

import { CaminhoTrilha } from "@/components/painel/CaminhoTrilha";
import { TituloPagina } from "@/components/ui";
import { montarUnidades } from "@/lib/trilha";
import { useEstado } from "@/lib/estado";

export default function Trilha() {
  const estado = useEstado();
  if (!estado) return null;

  const { unidades } = montarUnidades(estado);
  const concluidos = unidades.filter((u) => u.status === "concluido").length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <TituloPagina
        sobre="Personalizada pelo seu diagnóstico"
        descricao={`${concluidos} de ${unidades.length} módulos concluídos · cada módulo reúne lições, quiz e desafio`}
      >
        Sua trilha
      </TituloPagina>

      {/* Cada ponto é um passo; a Clara acompanha o caminho e pula até o ponto que você apontar. */}
      <CaminhoTrilha estado={estado} modo="completo" />
    </div>
  );
}
