"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { Aviso, Carregando, botao, cx } from "@/components/ui";
import { CENARIOS, calcularDiagnostico } from "@/lib/conteudo/diagnostico";
import { authApi } from "@/lib/auth/cliente";
import { acoes, proximaTela, useEstado, type Estado } from "@/lib/estado";

interface Rascunho {
  passo: number;
  escolhas: Record<string, number>;
}

// A versão e a conta isolam o rascunho do fluxo antigo e de outras pessoas neste navegador.
const chaveRascunho = (estado: Estado) => `futuro-lideres:diagnostico:v2:${estado.usuarioId ?? "demo"}`;

function lerRascunho(chave: string): Rascunho {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave) ?? "null");
    if (salvo && typeof salvo.escolhas === "object" && salvo.escolhas !== null) {
      const escolhas = Object.fromEntries(CENARIOS.flatMap((c) => {
        const opcao = salvo.escolhas[c.id];
        return Number.isInteger(opcao) && opcao >= 0 && opcao < c.opcoes.length ? [[c.id, opcao]] : [];
      }));
      const primeiraPendente = CENARIOS.findIndex((c) => escolhas[c.id] === undefined);
      const limite = primeiraPendente === -1 ? CENARIOS.length - 1 : primeiraPendente;
      const passo = Number.isInteger(salvo.passo) ? Math.max(0, Math.min(salvo.passo, limite)) : 0;
      return { passo, escolhas };
    }
  } catch {}
  return { passo: 0, escolhas: {} };
}

export default function Diagnostico() {
  const estado = useEstado();
  const router = useRouter();

  useEffect(() => {
    if (estado === null) router.replace("/cadastro");
    else if (estado && proximaTela(estado) === "/bem-vindo") router.replace("/bem-vindo");
  }, [estado, router]);

  if (!estado || proximaTela(estado) === "/bem-vindo") {
    return <Onboarding sobre="Quatro situações do dia a dia" titulo="Seu ponto de partida"><Carregando /></Onboarding>;
  }
  return <Fluxo key={chaveRascunho(estado)} estado={estado} />;
}

function Fluxo({ estado }: { estado: Estado }) {
  const router = useRouter();
  const chave = chaveRascunho(estado);
  const [r, setR] = useState<Rascunho>(() => lerRascunho(chave));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const envioEmCurso = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const cenario = CENARIOS[r.passo];
  const ultima = r.passo === CENARIOS.length - 1;

  useEffect(() => {
    try { localStorage.setItem(chave, JSON.stringify(r)); } catch {}
  }, [r, chave]);

  useEffect(() => {
    titulo.current?.focus();
    window.scrollTo({ top: 0 });
  }, [r.passo]);

  function ir(passo: number) {
    setErro(null);
    setR((atual) => ({ ...atual, passo }));
  }

  async function concluir() {
    if (envioEmCurso.current) return;
    if (CENARIOS.some((c) => r.escolhas[c.id] === undefined)) {
      setErro("Marque uma alternativa em cada uma das quatro situações.");
      return;
    }
    envioEmCurso.current = true;
    setEnviando(true);
    setErro(null);
    try {
      // Contas reais só avançam depois que o banco confirma a gravação.
      const salvo = estado.usuarioId ? await authApi.salvarDiagnostico(r.escolhas) : null;
      acoes.concluirDiagnostico(salvo?.pontuacoes ?? calcularDiagnostico(r.escolhas));
      try { localStorage.removeItem(chave); } catch {}
      router.push("/resultado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar. Tente novamente.");
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <Onboarding sobre="Quatro situações do dia a dia" titulo="Seu ponto de partida"
      progresso={(r.passo + 1) / CENARIOS.length} rotuloProgresso={`${r.passo + 1} de ${CENARIOS.length}`}>
      <div className="flex flex-col gap-6" aria-busy={enviando}>
        <p className="text-muted">São só 4 perguntas: marque o que você faria em cada situação. Sua trilha começa do básico.</p>
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-tint-purple-ink">{cenario.contexto}</span>
          <h2 ref={titulo} tabIndex={-1} className="text-lg font-semibold leading-relaxed">{cenario.texto}</h2>
        </div>
        <fieldset key={cenario.id} disabled={enviando} className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm text-muted">Escolha a reação mais próxima do que você faria</legend>
          {cenario.opcoes.map((o, i) => {
            const marcado = r.escolhas[cenario.id] === i;
            return (
              <label key={o.texto} className={cx(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ciano",
                marcado ? "border-primary bg-selected" : "border-line bg-card hover:border-primary/50",
              )}>
                <input type="radio" name={cenario.id} checked={marcado}
                  onChange={() => setR((atual) => ({ ...atual, escolhas: { ...atual.escolhas, [cenario.id]: i } }))}
                  className="size-5 shrink-0 accent-[var(--primary)]" />
                <span className="leading-snug">{o.texto}</span>
              </label>
            );
          })}
        </fieldset>
        {erro && <Aviso>{erro}</Aviso>}
        <div className="flex justify-between gap-3">
          <button type="button" className={botao.secundario} onClick={() => ir(r.passo - 1)} disabled={r.passo === 0 || enviando}>Voltar</button>
          <button type="button" className={botao.primario} onClick={() => ultima ? void concluir() : ir(r.passo + 1)}
            disabled={r.escolhas[cenario.id] === undefined || enviando}>
            {enviando ? "Salvando…" : ultima ? "Ver meu resultado" : "Continuar"}
          </button>
        </div>
      </div>
    </Onboarding>
  );
}
