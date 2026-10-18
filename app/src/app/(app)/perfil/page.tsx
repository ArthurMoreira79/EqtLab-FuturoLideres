"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Award, ChevronDown, Flame, LogOut, Medal, Route, Target } from "lucide-react";
import { FeedbackView } from "@/components/FeedbackView";
import { Radar } from "@/components/Radar";
import { TemaToggle } from "@/components/TemaToggle";
import { Barra, Card, TituloPagina, TituloSecao, Vazio, botao, cx, formatarData } from "@/components/ui";
import { sairDaConta } from "@/lib/auth/cliente";
import { COMPETENCIAS, NOMES_NIVEL, nivelDe } from "@/lib/competencias";
import { estadoDemo } from "@/lib/demo";
import { acoes, nivelXP, useEstado, type Estado } from "@/lib/estado";

export default function Perfil() {
  const estado = useEstado();
  if (!estado) return null;
  return <TelaPerfil estado={estado} />;
}

function conquistas(e: Estado) {
  const missoes = e.submissoes.filter((s) => s.origem === "missao").length;
  const modulos = Object.values(e.progresso).filter((p) => p.concluido).length;
  return [
    { Icone: Target, titulo: "Primeira missão", ok: missoes >= 1 },
    { Icone: Flame, titulo: "7 dias seguidos", ok: e.sequencia.dias >= 7 },
    { Icone: Route, titulo: "Primeiro módulo", ok: modulos >= 1 },
    { Icone: Medal, titulo: "Nota 9 ou mais", ok: e.submissoes.some((s) => s.feedback.nota_geral >= 9) },
    { Icone: Award, titulo: "10 missões", ok: missoes >= 10 },
  ];
}

function TelaPerfil({ estado }: { estado: Estado }) {
  const router = useRouter();
  const [aberta, setAberta] = useState<string | null>(null);
  const { nivel, noNivel, paraProximo } = nivelXP(estado.xp);
  const inicial = estado.diagnostico!.pontuacoes;

  return (
    <div className="flex flex-col gap-6">
      <TituloPagina
        sobre={`Nível ${nivel} · ${estado.xp.toLocaleString("pt-BR")} XP`}
        descricao={`${estado.perfil.cargo} · ${estado.perfil.setor} · equipe ${estado.perfil.tipoEquipe.toLowerCase()} de ${estado.perfil.tamanhoEquipe} pessoas · ${estado.perfil.modeloTrabalho.toLowerCase()}`}
      >
        {estado.perfil.nome}
      </TituloPagina>

      <div className="flex max-w-md items-center gap-3">
        <Barra valor={noNivel / paraProximo} className="flex-1" />
        <span className="text-sm text-muted">faltam {paraProximo - noNivel} XP para o nível {nivel + 1}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <TituloSecao>Antes vs. agora</TituloSecao>
          <Radar atual={estado.pontuacoes} antes={inicial} rotulo="Radar: diagnóstico inicial comparado com hoje" />
        </Card>

        <Card>
          <TituloSecao>Evolução por competência</TituloSecao>
          <ul className="flex flex-col gap-3">
            {COMPETENCIAS.map((c) => {
              const agora = estado.pontuacoes[c.slug];
              const d = agora - inicial[c.slug];
              return (
                <li key={c.slug} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{c.nome}</span>
                    <span className="text-muted">
                      {NOMES_NIVEL[nivelDe(agora)]}
                      {Math.abs(d) >= 0.05 && (
                        <strong className={d > 0 ? "text-tint-cyan-ink" : "text-tint-risk-ink"}>
                          {" "}
                          {d > 0 ? "+" : ""}
                          {d.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                        </strong>
                      )}
                    </span>
                  </div>
                  <Barra valor={agora / 5} cor={c.cor} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card>
        <TituloSecao>Conquistas</TituloSecao>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {conquistas(estado).map(({ Icone, titulo, ok }) => (
            <li
              key={titulo}
              className={cx(
                "flex flex-col items-center gap-2 rounded-xl p-4 text-center text-sm font-semibold",
                ok ? "bg-tint-purple text-tint-purple-ink" : "bg-sunken text-muted opacity-70",
              )}
            >
              <Icone aria-hidden className="size-7" />
              {titulo}
              <span className="sr-only">{ok ? "(conquistada)" : "(bloqueada)"}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <TituloSecao>Histórico de missões e desafios</TituloSecao>
        {estado.submissoes.length === 0 ? (
          <Vazio titulo="Você ainda não fez sua primeira missão.">Ela aparece na Home todos os dias.</Vazio>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {estado.submissoes.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  aria-expanded={aberta === s.id}
                  onClick={() => setAberta(aberta === s.id ? null : s.id)}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                >
                  <span className="w-12 text-sm text-muted">{formatarData(s.data)}</span>
                  <span className="flex-1 font-semibold">{s.titulo}</span>
                  <span className="rounded-lg bg-sunken px-2 py-1 text-sm font-bold">
                    {s.feedback.nota_geral.toLocaleString("pt-BR")}
                  </span>
                  <ChevronDown aria-hidden className={cx("size-4 transition-transform", aberta === s.id && "rotate-180")} />
                </button>
                {aberta === s.id && (
                  <div className="flex flex-col gap-4 pb-5">
                    <blockquote className="whitespace-pre-line rounded-xl bg-sunken p-4 text-sm leading-relaxed">
                      {s.resposta}
                    </blockquote>
                    <FeedbackView
                      feedback={s.feedback}
                      contestado={s.contestado}
                      onContestar={() => acoes.contestar(s.id)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <TituloSecao>Configurações</TituloSecao>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <span>Tema claro / escuro</span>
            <TemaToggle className="border border-line" />
          </div>
          <p className="text-sm text-muted">
            Reavaliações de 30/60/90 dias, lembretes da missão diária e privacidade avançada entram nas próximas versões.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={botao.secundario}
              onClick={() => {
                acoes.carregarDemo(estadoDemo());
                router.push("/inicio");
              }}
            >
              Recarregar dados de demonstração
            </button>
            <button
              type="button"
              className={botao.secundario}
              onClick={() => {
                if (confirm("Sair e apagar os dados deste navegador? Sua conta continua salva e você pode entrar de novo.")) {
                  void sairDaConta();
                  router.push("/");
                }
              }}
            >
              <LogOut aria-hidden className="size-4" /> Sair e apagar dados
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
