"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Check, Lock, Target, Trophy } from "lucide-react";
import { RespostaDesafio } from "@/components/RespostaDesafio";
import { LicaoInterativa } from "@/components/trilha/LicaoInterativa";
import { QuizInterativo } from "@/components/trilha/QuizInterativo";
import { VideoModulo } from "@/components/trilha/VideoModulo";
import { VIDEOS_MODULO } from "@/lib/conteudo/videos-modulo";
import { Aviso, Barra, Carregando, TituloPagina, botao, cx } from "@/components/ui";
import { api } from "@/lib/api";
import { obterModulo, temConteudo } from "@/lib/conteudo/modulos";
import { acoes, NOTA_MINIMA, useEstado, type Estado } from "@/lib/estado";
import { montarUnidades, progressoModulo, statusModulo } from "@/lib/trilha";
import type { DesafioPublico, Modulo } from "@/lib/types";

export default function PaginaModulo() {
  const { modulo: id } = useParams<{ modulo: string }>();
  const estado = useEstado();
  if (!estado) return null;
  const m = obterModulo(id);
  if (!m) return <Aviso>Módulo não encontrado.</Aviso>;
  const st = statusModulo(estado, m);
  if (st === "producao" || st === "bloqueado" || !temConteudo(m)) return <div className="mx-auto flex max-w-3xl flex-col gap-4">
    <TituloPagina sobre="Trilha">{m.titulo}</TituloPagina>
    <Aviso tipo="info">{st === "bloqueado" ? "Conclua os módulos anteriores da sua trilha para liberar este." : "O conteúdo deste módulo está em produção e entra numa próxima versão."}</Aviso>
    <Link href="/trilha" className={cx(botao.secundario, "self-start")}>Voltar para a trilha</Link>
  </div>;
  return <ConteudoModulo key={m.id} estado={estado} modulo={m} />;
}

function ConteudoModulo({ estado, modulo }: { estado: Estado; modulo: Modulo }) {
  const { unidades } = montarUnidades(estado);
  const unidade = unidades.find((u) => u.modulo.id === modulo.id);
  const proximoModulo = unidade ? unidades[unidade.numero] : undefined;
  const prog = estado.progresso[modulo.id];
  const { fracao } = progressoModulo(estado, modulo);
  const licoesOk = modulo.licoes.every((l) => prog?.licoesFeitas.includes(l.id));
  const quizOk = prog?.quizAcertos !== undefined;
  const [etapa, setEtapa] = useState(() => {
    const primeira = modulo.licoes.find((l) => !prog?.licoesFeitas.includes(l.id))?.id ?? (!quizOk ? "quiz" : "desafio");
    if (typeof window === "undefined") return primeira;
    const pedida = new URLSearchParams(window.location.search).get("etapa") ?? window.location.hash.slice(1);
    const i = modulo.licoes.findIndex((l) => l.id === pedida);
    if (i >= 0 && modulo.licoes.slice(0, i).every((l) => prog?.licoesFeitas.includes(l.id))) return pedida;
    if ((pedida === "quiz" && licoesOk) || (pedida === "desafio" && licoesOk && quizOk)) return pedida;
    return primeira;
  });
  const cabecalho = useRef<HTMLDivElement>(null);
  useEffect(() => { cabecalho.current?.focus(); }, [etapa]);
  function ir(id: string) {
    setEtapa(id);
    const url = new URL(window.location.href);
    url.searchParams.set("etapa", id);
    url.hash = id === "quiz" || id === "desafio" ? id : "licoes";
    window.history.replaceState(null, "", url);
  }
  const indice = modulo.licoes.findIndex((l) => l.id === etapa);
  const licao = modulo.licoes[indice];
  const fase = licao ? "aprender" : etapa === "quiz" ? "testar" : "aplicar";
  const passo = indice >= 0 ? indice + 1 : etapa === "quiz" ? modulo.licoes.length + 1 : modulo.licoes.length + 2;
  const fases = [
    { id: "aprender", texto: "Aprender", Icone: BookOpen, destino: modulo.licoes[0].id, disponivel: true, feita: licoesOk },
    { id: "testar", texto: "Testar", Icone: Target, destino: "quiz", disponivel: licoesOk, feita: quizOk },
    { id: "aplicar", texto: "Aplicar", Icone: Trophy, destino: "desafio", disponivel: licoesOk && quizOk, feita: !!prog?.concluido },
  ];
  return <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-6">
    <Link href="/trilha" className="inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline"><ArrowLeft aria-hidden className="size-4" /> Voltar à trilha</Link>
    <div ref={cabecalho} tabIndex={-1} className="scroll-mt-6">
      <TituloPagina sobre={`Módulo ${unidade?.numero ?? 1} de ${unidades.length} · Etapa ${passo} de ${modulo.licoes.length + 2}${prog?.concluido ? " · concluído" : ""}`} descricao="Um passo de cada vez: entenda, experimente e leve para o dia a dia.">{modulo.titulo}</TituloPagina>
    </div>
    <div className="flex items-center gap-3"><Barra valor={fracao} className="flex-1" /><span className="text-sm font-extrabold tabular-nums">{Math.round(fracao * 100)}%</span></div>
    {prog?.concluido && proximoModulo && <Link href={`/trilha/${proximoModulo.modulo.id}`} className={cx(botao.primario, "self-start")}>Continuar para o módulo {proximoModulo.numero}</Link>}
    <nav aria-label="Etapas do módulo" className="grid grid-cols-3 gap-2">{fases.map(({ id, texto, Icone, destino, disponivel, feita }) => <button key={id} type="button" disabled={!disponivel} aria-current={fase === id ? "step" : undefined}
      onClick={() => ir(destino)} className={cx("flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-xs font-extrabold sm:text-sm", fase === id ? "border-primary bg-primary text-on-primary" : "border-line bg-card text-muted", !disponivel && "opacity-50")}>
      {!disponivel ? <Lock aria-hidden className="size-4" /> : feita ? <Check aria-hidden className="size-4" /> : <Icone aria-hidden className="size-4" />}{texto}
    </button>)}</nav>
    {licao ? <section id="licoes" className="flex scroll-mt-6 flex-col gap-5" aria-label="Lições guiadas">
      <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-muted">Lição {indice + 1} de {modulo.licoes.length}</p><nav aria-label="Escolher lição" className="flex gap-2">{modulo.licoes.map((l, i) => {
        const feita = !!prog?.licoesFeitas.includes(l.id);
        const disponivel = modulo.licoes.slice(0, i).every((anterior) => prog?.licoesFeitas.includes(anterior.id));
        return <button key={l.id} type="button" disabled={!disponivel} title={l.titulo} aria-label={`Lição ${i + 1}: ${l.titulo}${feita ? ", concluída" : ""}`} aria-current={etapa === l.id ? "step" : undefined}
          onClick={() => ir(l.id)} className={cx("grid size-10 place-items-center rounded-full border-2 text-sm font-extrabold", etapa === l.id ? "border-primary bg-primary text-on-primary" : "border-line bg-card", !disponivel && "opacity-40")}>
          {feita ? <Check aria-hidden className="size-4" /> : i + 1}
        </button>;
      })}</nav></div>
      {VIDEOS_MODULO[modulo.id] && indice === 0 && <VideoModulo moduloId={modulo.id} />}
      <LicaoInterativa key={licao.id} licao={licao} feita={!!prog?.licoesFeitas.includes(licao.id)} aoConcluir={() => {
        acoes.marcarLicao(modulo.id, licao.id);
        ir(modulo.licoes[indice + 1]?.id ?? "quiz");
      }} />
      {indice > 0 && <button type="button" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-link" onClick={() => ir(modulo.licoes[indice - 1].id)}><ArrowLeft aria-hidden className="size-4" /> Rever lição anterior</button>}
    </section> : etapa === "quiz" && licoesOk ? <section id="quiz" className="scroll-mt-6"><QuizInterativo modulo={modulo} acertosSalvos={prog?.quizAcertos} aoAvancar={() => ir("desafio")} /></section> : <section id="desafio" className="flex scroll-mt-6 flex-col gap-4">
      <div className="rounded-2xl border border-line bg-card p-5"><p className="text-xs font-extrabold uppercase tracking-wider text-link">Agora é com você</p><h2 className="mt-1 text-xl font-extrabold">Uma situação real para praticar</h2><p className="mt-2 text-sm leading-relaxed text-muted">Diga o que faria, o que falaria e como acompanharia o resultado. A análise mostra onde você acertou e como melhorar.</p></div>
      {licoesOk && quizOk && modulo.desafioId ? <Desafio key={modulo.id} estado={estado} modulo={modulo} desafioId={modulo.desafioId} /> : <Aviso tipo="info">Conclua as lições e o quiz para liberar este desafio.</Aviso>}
    </section>}
  </div>;
}
function Desafio({ estado, modulo, desafioId }: { estado: Estado; modulo: Modulo; desafioId: string }) {
  const [desafio, setDesafio] = useState<DesafioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const nota = estado.progresso[modulo.id]?.desafioNota;
  const { unidades } = montarUnidades(estado);
  const indice = unidades.findIndex((u) => u.modulo.id === modulo.id);
  const seguinte = unidades[indice + 1];
  const podeContinuar = nota !== undefined && nota >= NOTA_MINIMA && seguinte;

  useEffect(() => {
    api.desafio(desafioId).then(setDesafio).catch((e) => setErro(e.message));
  }, [desafioId]);

  if (erro) return <Aviso>{erro}</Aviso>;
  if (!desafio) return <Carregando />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-chrome p-5 text-white">
        <p className="text-lg leading-relaxed">{desafio.enunciado}</p>
        <p className="font-semibold text-ciano">{desafio.pergunta}</p>
      </div>
      {nota !== undefined && (
        <Aviso tipo="info">
          Sua melhor nota até agora: {nota.toLocaleString("pt-BR")}.{" "}
          {nota >= NOTA_MINIMA ? "Módulo concluído!" : `Leia o feedback e tente de novo: o módulo conclui com ${NOTA_MINIMA}.`}
        </Aviso>
      )}
      <RespostaDesafio
        desafio={desafio}
        estado={estado}
        origem="desafio"
        moduloId={modulo.id}
        extras={
          <Link href={podeContinuar ? `/trilha/${seguinte.modulo.id}` : "/trilha"} className={cx(botao.primario, "self-start")}>
            {podeContinuar ? `Continuar para o módulo ${seguinte.numero}` : "Voltar para a trilha"}
          </Link>
        }
      />
    </div>
  );
}
