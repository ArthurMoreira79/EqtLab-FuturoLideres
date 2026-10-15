"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { Aviso, botao, cx } from "@/components/ui";
import { acoes } from "@/lib/estado";
import type { Perfil } from "@/lib/types";

const TIPOS_EQUIPE = ["Técnica", "Operacional", "Comercial", "Administrativa", "Atendimento", "Mista"];
const MODELOS = ["Presencial", "Híbrido", "Remoto"];
const DESAFIOS = [
  "Dar feedback",
  "Lidar com conflitos",
  "Liderar ex-colegas",
  "Delegar",
  "Priorizar demandas",
  "Manter a equipe motivada",
  "Bater metas",
  "Controlar a ansiedade",
];

const campo =
  "min-h-12 w-full rounded-xl border border-line bg-card px-4 text-ink placeholder:text-muted focus:border-primary";

export default function Cadastro() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [desafios, setDesafios] = useState<string[]>([]);

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const perfil: Perfil = {
      nome: String(f.get("nome") ?? "").trim(),
      cargo: String(f.get("cargo") ?? "").trim(),
      setor: String(f.get("setor") ?? "").trim(),
      tipoEquipe: String(f.get("tipoEquipe") ?? ""),
      tamanhoEquipe: Number(f.get("tamanhoEquipe") ?? 0),
      mesesLideranca: Number(f.get("mesesLideranca") ?? 0),
      modeloTrabalho: String(f.get("modeloTrabalho") ?? ""),
      desafios,
    };
    if (!perfil.nome || !perfil.cargo || !perfil.setor) {
      setErro("Preencha nome, cargo e setor para continuar.");
      return;
    }
    acoes.criarConta(perfil);
    router.push("/diagnostico");
  }

  return (
    <Onboarding sobre="Passo 1 de 2" titulo="Seu perfil profissional" progresso={0.15} rotuloProgresso="Perfil">
      <form onSubmit={enviar} className="flex flex-col gap-6" noValidate>
        <p className="text-muted">
          Usamos essas informações para adaptar missões e cenários ao seu contexto. Nada disso é compartilhado com sua
          empresa.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="font-semibold">Nome</span>
            <input name="nome" autoComplete="name" required className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Cargo</span>
            <input name="cargo" placeholder="Ex.: Coordenador de Operações" required className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Setor / área</span>
            <input name="setor" placeholder="Ex.: Distribuição" required className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Há quantos meses lidera?</span>
            <input name="mesesLideranca" type="number" min={0} max={240} defaultValue={3} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Tamanho da equipe</span>
            <input name="tamanhoEquipe" type="number" min={1} max={200} defaultValue={8} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Tipo de equipe</span>
            <select name="tipoEquipe" className={campo} defaultValue="Operacional">
              {TIPOS_EQUIPE.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-semibold">Modelo de trabalho</span>
            <select name="modeloTrabalho" className={campo} defaultValue="Presencial">
              {MODELOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-semibold">Quais os seus principais desafios hoje? (opcional)</legend>
          <div className="flex flex-wrap gap-2">
            {DESAFIOS.map((d) => {
              const marcado = desafios.includes(d);
              return (
                <label
                  key={d}
                  className={cx(
                    "flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ciano",
                    marcado ? "border-primary bg-selected text-ink" : "border-line bg-card text-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={marcado}
                    onChange={() => setDesafios((x) => (marcado ? x.filter((y) => y !== d) : [...x, d]))}
                  />
                  {d}
                </label>
              );
            })}
          </div>
        </fieldset>

        {erro && <Aviso>{erro}</Aviso>}

        <button type="submit" className={cx(botao.primario, "sm:self-end")}>
          Continuar para o diagnóstico
        </button>
      </form>
    </Onboarding>
  );
}
