"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Onboarding } from "@/components/Onboarding";
import { Aviso, Carregando, botao, cx } from "@/components/ui";
import { COMPETENCIAS, pontuacoesVazias } from "@/lib/competencias";
import { CENARIOS, calcularDiagnostico } from "@/lib/conteudo/diagnostico";
import { api } from "@/lib/api";
import { acoes, hoje, useEstado, type Estado } from "@/lib/estado";
import type { DesafioPublico, Pontuacoes, Submissao } from "@/lib/types";

const RASCUNHO = "futuro-lideres:diagnostico";
const ESCALA = ["Raramente", "Às vezes", "Com frequência", "Quase sempre", "Sempre"];

interface Rascunho {
  passo: number;
  auto: Pontuacoes;
  escolhas: Record<string, number>;
  aberta: string;
}

export default function Diagnostico() {
  const estado = useEstado();
  const router = useRouter();

  useEffect(() => {
    if (estado === null) router.replace("/cadastro");
  }, [estado, router]);

  if (!estado) {
    return (
      <Onboarding sobre="Passo 2 de 2" titulo="Diagnóstico inicial">
        <Carregando />
      </Onboarding>
    );
  }
  return <Fluxo estado={estado} />;
}

function lerRascunho(): Rascunho {
  try {
    const t = localStorage.getItem(RASCUNHO);
    if (t) return JSON.parse(t);
  } catch {}
  return { passo: 0, auto: pontuacoesVazias(0), escolhas: {}, aberta: "" };
}

function Fluxo({ estado }: { estado: Estado }) {
  const router = useRouter();
  const [r, setR] = useState<Rascunho>(lerRascunho);
  const [desafio, setDesafio] = useState<DesafioPublico | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const total = 2 + CENARIOS.length + 1; // intro, parte A, cenários, parte C
  const ultimo = total - 1;

  useEffect(() => {
    try {
      localStorage.setItem(RASCUNHO, JSON.stringify(r));
    } catch {}
  }, [r]);

  useEffect(() => {
    if (r.passo === ultimo && !desafio) {
      api.desafio("diag-aberto").then(setDesafio).catch((e) => setErro(e.message));
    }
  }, [r.passo, ultimo, desafio]);

  const ir = (passo: number) => {
    setErro(null);
    setR((x) => ({ ...x, passo }));
    window.scrollTo({ top: 0 });
  };

  async function concluir(pularAberta: boolean) {
    let pontuacoes = calcularDiagnostico(r.auto, r.escolhas);
    let submissao: Submissao | undefined;

    if (!pularAberta) {
      setEnviando(true);
      setErro(null);
      try {
        const res = await api.avaliar({
          desafioId: "diag-aberto",
          resposta: r.aberta,
          contexto: { setor: estado.perfil.setor, cargo: estado.perfil.cargo, tamanhoEquipe: estado.perfil.tamanhoEquipe, tipoEquipe: estado.perfil.tipoEquipe },
        });
        if (res.status === "desenvolver") {
          setErro(res.mensagem);
          setEnviando(false);
          return;
        }
        pontuacoes = { ...pontuacoes };
        for (const c of res.feedback.competencias) {
          pontuacoes[c.competencia] = Math.round((pontuacoes[c.competencia] * 0.7 + (c.nota / 2) * 0.3) * 10) / 10;
        }
        submissao = {
          id: crypto.randomUUID(),
          desafioId: "diag-aberto",
          titulo: "Diagnóstico inicial · resposta aberta",
          origem: "diagnostico",
          resposta: r.aberta,
          feedback: res.feedback,
          data: hoje(),
        };
      } catch (e) {
        setErro((e as Error).message);
        setEnviando(false);
        return;
      }
    }
    acoes.concluirDiagnostico(pontuacoes, submissao);
    try {
      localStorage.removeItem(RASCUNHO);
    } catch {}
    router.push("/resultado");
  }

  const parteA = r.passo === 1;
  const cenario = r.passo >= 2 && r.passo < ultimo ? CENARIOS[r.passo - 2] : null;
  const autoCompleta = COMPETENCIAS.every((c) => r.auto[c.slug] > 0);

  const sobre =
    r.passo === 0
      ? "Passo 2 de 2"
      : parteA
        ? "Parte A · Autoavaliação"
        : cenario
          ? "Parte B · Julgamento situacional"
          : "Parte C · Resposta aberta";

  return (
    <Onboarding
      sobre={sobre}
      titulo="Diagnóstico inicial"
      progresso={r.passo / ultimo}
      rotuloProgresso={r.passo === 0 ? "Início" : `${r.passo} de ${ultimo}`}
    >
      <div className="flex flex-col gap-6">
        {r.passo === 0 && (
          <>
            <p className="text-lg leading-relaxed">
              Olá, {estado.perfil.nome.split(" ")[0]}! Em cerca de 10 minutos vamos entender seu momento como líder.
              Seu progresso fica salvo: pode parar e voltar quando quiser.
            </p>
            <ol className="grid gap-3 sm:grid-cols-3">
              {[
                ["A", "Autoavaliação", "Como você se vê em 8 competências."],
                ["B", "Situações", `${CENARIOS.length} cenários do dia a dia de um líder.`],
                ["C", "Resposta aberta", "Um cenário respondido com suas palavras, analisado pela IA."],
              ].map(([l, t, d]) => (
                <li key={l} className="flex flex-col gap-1 rounded-2xl border border-line bg-card p-4">
                  <span className="font-display text-2xl font-extrabold italic text-tint-purple-ink">{l}</span>
                  <span className="font-bold">{t}</span>
                  <span className="text-sm text-muted">{d}</span>
                </li>
              ))}
            </ol>
            <button type="button" className={cx(botao.primario, "sm:self-end")} onClick={() => ir(1)}>
              Começar
            </button>
          </>
        )}

        {parteA && (
          <>
            <p className="text-muted">Com que frequência você age assim hoje? Não há resposta certa.</p>
            {COMPETENCIAS.map((c) => (
              <fieldset key={c.slug} className="rounded-2xl border border-line bg-card p-4">
                <legend className="sr-only">{c.nome}</legend>
                <p className="font-bold">{c.nome}</p>
                <p className="mb-3 text-sm text-muted">{c.descricao}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {ESCALA.map((rotulo, i) => {
                    const valor = i + 1;
                    const marcado = r.auto[c.slug] === valor;
                    return (
                      <label
                        key={rotulo}
                        className={cx(
                          "flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-1 text-center text-xs font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ciano",
                          marcado ? "border-primary bg-selected" : "border-line",
                        )}
                      >
                        <input
                          type="radio"
                          name={c.slug}
                          className="sr-only"
                          checked={marcado}
                          onChange={() => setR((x) => ({ ...x, auto: { ...x.auto, [c.slug]: valor } }))}
                        />
                        <span className="text-base">{valor}</span>
                        <span className="hidden sm:inline">{rotulo}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
            <Navegacao voltar={() => ir(0)} avancar={() => ir(2)} podeAvancar={autoCompleta} />
          </>
        )}

        {cenario && (
          <>
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-tint-purple-ink">Cenário · {cenario.contexto}</span>
              <p className="text-lg leading-relaxed">{cenario.texto}</p>
            </div>
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm text-muted">Escolha a reação mais próxima do que você faria</legend>
              {cenario.opcoes.map((o, i) => {
                const marcado = r.escolhas[cenario.id] === i;
                return (
                  <label
                    key={o.texto}
                    className={cx(
                      "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ciano",
                      marcado ? "border-primary bg-selected" : "border-line",
                    )}
                  >
                    <input
                      type="radio"
                      name={cenario.id}
                      checked={marcado}
                      onChange={() => setR((x) => ({ ...x, escolhas: { ...x.escolhas, [cenario.id]: i } }))}
                      className="size-5 accent-[var(--primary)]"
                    />
                    <span className="leading-snug">{o.texto}</span>
                  </label>
                );
              })}
            </fieldset>
            <Navegacao
              voltar={() => ir(r.passo - 1)}
              avancar={() => ir(r.passo + 1)}
              podeAvancar={r.escolhas[cenario.id] !== undefined}
            />
          </>
        )}

        {r.passo === ultimo && (
          <>
            {!desafio ? (
              <Carregando mensagem="Carregando cenário…" />
            ) : (
              <>
                <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-5">
                  <p className="text-lg leading-relaxed">{desafio.enunciado}</p>
                  <p className="font-semibold">{desafio.pergunta}</p>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="font-bold">Sua resposta</span>
                  <textarea
                    value={r.aberta}
                    onChange={(e) => setR((x) => ({ ...x, aberta: e.target.value }))}
                    rows={7}
                    className="rounded-xl border-2 border-line bg-card p-4 leading-relaxed focus:border-primary"
                    placeholder="Escreva como você realmente agiria."
                  />
                  <span className="text-sm text-muted">{r.aberta.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                </label>
              </>
            )}
            {enviando && <Carregando mensagem="Analisando sua resposta…" />}
            {erro && <Aviso>{erro}</Aviso>}
            <div className="flex flex-wrap justify-between gap-3">
              <button type="button" className={botao.secundario} onClick={() => ir(r.passo - 1)} disabled={enviando}>
                Voltar
              </button>
              <div className="flex flex-wrap gap-3">
                <button type="button" className={botao.secundario} onClick={() => concluir(true)} disabled={enviando}>
                  Pular esta parte
                </button>
                <button
                  type="button"
                  className={botao.primario}
                  onClick={() => concluir(false)}
                  disabled={enviando || r.aberta.trim().length < 20}
                >
                  Ver meu resultado
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Onboarding>
  );
}

function Navegacao({ voltar, avancar, podeAvancar }: { voltar: () => void; avancar: () => void; podeAvancar: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <button type="button" className={botao.secundario} onClick={voltar}>
        Voltar
      </button>
      <button type="button" className={botao.primario} onClick={avancar} disabled={!podeAvancar}>
        Continuar
      </button>
    </div>
  );
}
