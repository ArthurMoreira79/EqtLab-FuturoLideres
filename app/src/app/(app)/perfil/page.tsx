"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@heroui/react";
import { CalendarCheck, ChevronDown, Download, Flame, LogOut, Medal, Pencil, Route, Target, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AvatarEmblema } from "@/components/AvatarEmblema";
import { EditorAvatar } from "@/components/EditorAvatar";
import { FeedbackView } from "@/components/FeedbackView";
import { Radar } from "@/components/Radar";
import { TemaToggle } from "@/components/TemaToggle";
import { Card, TituloSecao, Vazio, botao, cx, formatarData } from "@/components/ui";
import { Barra } from "@/components/ui";
import { authApi, sairDaConta } from "@/lib/auth/cliente";
import { AVATAR_PADRAO, type AvatarConfig } from "@/lib/avatar";
import { exportarAvatarPng } from "@/lib/avatar-svg";
import { COMPETENCIAS, NOMES_NIVEL, nivelDe } from "@/lib/competencias";
import { calcularConstancia } from "@/lib/constancia";
import { estadoDemo } from "@/lib/demo";
import { acoes, nivelXP, useEstado, type Estado } from "@/lib/estado";

export default function Perfil() {
  const estado = useEstado();
  if (!estado) return null;
  return <TelaPerfil estado={estado} />;
}

/* ───────────── conquistas com níveis (como as do Duolingo) ───────────── */

interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  Icone: LucideIcon;
  cor: string;
  nivel: number;
  atual: number;
  meta: number;
}

/** Dado o valor atual e as metas de cada nível, descobre o nível alcançado e a próxima meta. */
function escalonar(valor: number, metas: number[]) {
  const i = metas.findIndex((m) => valor < m);
  const nivel = i === -1 ? metas.length : i;
  const meta = i === -1 ? metas[metas.length - 1] : metas[i];
  return { nivel, meta, atual: Math.min(valor, meta) };
}

function conquistasDe(e: Estado): Conquista[] {
  const missoes = e.submissoes.filter((s) => s.origem === "missao").length;
  const modulos = Object.values(e.progresso).filter((p) => p.concluido).length;
  const notasAltas = e.submissoes.filter((s) => s.feedback.nota_geral >= 9).length;
  return [
    { id: "fogueira", titulo: "Lenha na Fogueira", Icone: Flame, cor: "#ff5c5c", ...escalonar(e.sequencia.dias, [3, 7, 14, 30]), descricao: "" },
    { id: "missoes", titulo: "Mão na Massa", Icone: Target, cor: "#1b8fe6", ...escalonar(missoes, [1, 10, 30, 100]), descricao: "" },
    { id: "modulos", titulo: "Aprendiz Dedicado", Icone: Route, cor: "#00a3a3", ...escalonar(modulos, [1, 2, 4, 8]), descricao: "" },
    { id: "notas", titulo: "Nota de Referência", Icone: Medal, cor: "#f5b301", ...escalonar(notasAltas, [1, 5, 15]), descricao: "" },
    { id: "xp", titulo: "XP em Alta", Icone: Zap, cor: "#a455ee", ...escalonar(e.xp, [500, 1500, 5000]), descricao: "" },
  ].map((c) => ({
    ...c,
    descricao:
      c.id === "fogueira"
        ? `Complete uma sequência de ${c.meta} dias.`
        : c.id === "missoes"
          ? `Resolva ${c.meta} ${c.meta === 1 ? "missão" : "missões"}.`
          : c.id === "modulos"
            ? `Conclua ${c.meta} ${c.meta === 1 ? "módulo" : "módulos"}.`
            : c.id === "notas"
              ? `Tire nota 9 ou mais em ${c.meta} ${c.meta === 1 ? "resposta" : "respostas"}.`
              : `Acumule ${c.meta.toLocaleString("pt-BR")} XP.`,
  }));
}

const apelido = (nome: string) =>
  "@" +
  nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

function CartaoEstatistica({ Icone, cor, valor, rotulo }: { Icone: LucideIcon; cor: string; valor: string; rotulo: string }) {
  return (
    <li className="flex items-center gap-3.5 rounded-2xl border-2 border-line bg-card px-4 py-3.5 shadow-[0_3px_0_var(--line)]">
      <Icone aria-hidden className="size-7 shrink-0" style={{ color: cor }} fill={Icone === Flame || Icone === Zap ? "currentColor" : "none"} />
      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold leading-tight">{valor}</p>
        <p className="truncate text-sm text-muted">{rotulo}</p>
      </div>
    </li>
  );
}

function TelaPerfil({ estado }: { estado: Estado }) {
  const router = useRouter();
  const [aberta, setAberta] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const { nivel, noNivel, paraProximo } = nivelXP(estado.xp);
  const inicial = estado.diagnostico!.pontuacoes;
  const avatar: AvatarConfig = estado.avatar ?? AVATAR_PADRAO;
  const constancia = calcularConstancia(estado);
  const modulosFeitos = Object.values(estado.progresso).filter((p) => p.concluido).length;
  const missoesFeitas = estado.submissoes.filter((s) => s.origem === "missao").length;
  const desde = estado.perfil.desde
    ? new Date(estado.perfil.desde).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  async function salvarAvatar(novo: AvatarConfig) {
    acoes.salvarAvatar(novo); // sempre fica salvo neste navegador
    if (estado.usuarioId) {
      try {
        await authApi.salvarAvatar(novo);
      } catch {
        throw new Error("Seu avatar foi salvo neste navegador, mas não conseguimos salvar na sua conta agora. Tente de novo em instantes.");
      }
    }
  }

  async function baixarAvatar() {
    setAviso(null);
    try {
      const como = await exportarAvatarPng(avatar, "avatar-conecta-lideres");
      setAviso(como === "baixado" ? "Imagem do avatar baixada. Use como foto de perfil onde quiser!" : null);
    } catch {
      setAviso("Não foi possível gerar a imagem agora.");
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-8">
        {/* Banner com o avatar (emblema) */}
        <section aria-label="Seu avatar" className="flex flex-col gap-5">
          <div
            className="relative flex h-[250px] items-end justify-center overflow-hidden rounded-3xl border-2 border-line shadow-[0_4px_0_var(--line)]"
            style={{ background: `#${avatar.fundo}` }}
          >
            <AvatarEmblema avatar={avatar} tamanho={250} semFundo />
            <Button
              isIconOnly
              variant="secondary"
              aria-label="Editar avatar"
              onPress={() => setEditando(true)}
              className="absolute right-4 top-4 size-11 rounded-xl border-2 border-black/15 bg-white/90 text-[#14174f] shadow-[0_3px_0_rgba(0,0,0,0.15)]"
            >
              <Pencil aria-hidden className="size-5" />
            </Button>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{estado.perfil.nome}</h1>
              <p className="text-muted">{apelido(estado.perfil.nome)}</p>
              <p>
                {estado.perfil.cargo} · {estado.perfil.setor}
              </p>
              {desde && <p className="text-sm text-muted">Por aqui desde {desde}</p>}
            </div>
            <Button variant="secondary" onPress={baixarAvatar} className={cx(botao.secundario, "min-h-11 gap-2 px-4")}>
              <Download aria-hidden className="size-4" /> Baixar avatar
            </Button>
          </div>
          {aviso && (
            <p role="status" className="rounded-xl bg-tint-cyan px-4 py-3 text-sm text-tint-cyan-ink">
              {aviso}
            </p>
          )}
        </section>

        <hr className="border-t-2 border-line" />

        {/* Estatísticas */}
        <section aria-labelledby="estatisticas" className="flex flex-col gap-4">
          <h2 id="estatisticas" className="text-2xl font-extrabold">
            Estatísticas
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            <CartaoEstatistica Icone={Flame} cor="#ff8a00" valor={String(estado.sequencia.dias)} rotulo="Dias seguidos" />
            <CartaoEstatistica Icone={Zap} cor="#f5b301" valor={estado.xp.toLocaleString("pt-BR")} rotulo="Total de XP" />
            <CartaoEstatistica Icone={Trophy} cor="#1b8fe6" valor={`Nível ${nivel}`} rotulo="Seu nível de líder" />
            <CartaoEstatistica Icone={Target} cor="#1b8fe6" valor={String(missoesFeitas)} rotulo={missoesFeitas === 1 ? "Missão feita" : "Missões feitas"} />
            <CartaoEstatistica Icone={Route} cor="#00a3a3" valor={String(modulosFeitos)} rotulo={modulosFeitos === 1 ? "Módulo concluído" : "Módulos concluídos"} />
            <CartaoEstatistica Icone={CalendarCheck} cor="#a455ee" valor={`${Math.round(constancia.taxa * 100)}%`} rotulo="Constância (4 semanas)" />
          </ul>

          {/* XP até o próximo nível: a barra enche até a posição final ao abrir a tela */}
          <div className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-card p-4 shadow-[0_3px_0_var(--line)]">
            <div className="flex items-baseline justify-between gap-2 text-sm font-extrabold">
              <span>Nível {nivel}</span>
              <span className="text-muted">
                {noNivel} / {paraProximo} XP
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`Progresso para o nível ${nivel + 1}`}
              aria-valuenow={Math.round((noNivel / paraProximo) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-4 overflow-hidden rounded-full bg-sunken"
            >
              <div
                className="h-full animate-encher rounded-full bg-[linear-gradient(90deg,#1478d0,#1cb0f6)]"
                style={{ width: `${Math.round((noNivel / paraProximo) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted">Faltam {paraProximo - noNivel} XP para o nível {nivel + 1}.</p>
          </div>
        </section>

        {/* Conquistas */}
        <section aria-labelledby="conquistas" className="flex flex-col gap-4">
          <h2 id="conquistas" className="text-2xl font-extrabold">
            Conquistas
          </h2>
          <ul className="flex flex-col gap-3">
            {conquistasDe(estado).map((c) => (
              <li key={c.id} className="flex items-center gap-4 rounded-2xl border-2 border-line bg-card p-4 shadow-[0_3px_0_var(--line)]">
                <span
                  aria-hidden
                  className="relative grid size-20 shrink-0 place-items-center rounded-2xl text-white shadow-[0_4px_0_rgba(0,0,0,0.2)]"
                  style={{ background: c.cor }}
                >
                  <c.Icone className="size-9" fill={c.Icone === Flame || c.Icone === Zap ? "currentColor" : "none"} />
                  <span className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-black/20 py-0.5 text-center text-[10px] font-extrabold uppercase tracking-wider">
                    Nível {Math.max(c.nivel, 0)}
                  </span>
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-lg font-extrabold">{c.titulo}</p>
                    <span className="shrink-0 text-sm font-bold text-muted">
                      {c.atual.toLocaleString("pt-BR")}/{c.meta.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${c.titulo}: ${c.atual} de ${c.meta}`}
                    aria-valuenow={c.atual}
                    aria-valuemin={0}
                    aria-valuemax={c.meta}
                    className="h-3.5 overflow-hidden rounded-full bg-sunken"
                  >
                    <div className="h-full animate-encher rounded-full bg-[#ffc800]" style={{ width: `${(c.atual / c.meta) * 100}%` }} />
                  </div>
                  <p className="text-sm text-muted">{c.descricao}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Histórico */}
        <Card>
          <TituloSecao>Histórico de missões e desafios</TituloSecao>
          {estado.submissoes.length === 0 ? (
            <Vazio titulo="Você ainda não fez sua primeira missão.">Ela aparece no Painel todos os dias.</Vazio>
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
                    <span className="rounded-lg bg-sunken px-2 py-1 text-sm font-bold">{s.feedback.nota_geral.toLocaleString("pt-BR")}</span>
                    <ChevronDown aria-hidden className={cx("size-4 transition-transform", aberta === s.id && "rotate-180")} />
                  </button>
                  {aberta === s.id && (
                    <div className="flex flex-col gap-4 pb-5">
                      <blockquote className="whitespace-pre-line rounded-xl bg-sunken p-4 text-sm leading-relaxed">{s.resposta}</blockquote>
                      <FeedbackView feedback={s.feedback} contestado={s.contestado} onContestar={() => acoes.contestar(s.id)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Evolução: os gráficos ficam recolhidos de propósito */}
        <details className="group rounded-3xl border-2 border-line bg-card shadow-[0_3px_0_var(--line)]">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 text-lg font-extrabold">
            Ver evolução por competência
            <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-6 border-t-2 border-line p-5 lg:grid-cols-2">
            <div>
              <TituloSecao>Antes vs. agora</TituloSecao>
              <Radar atual={estado.pontuacoes} antes={inicial} rotulo="Radar: diagnóstico inicial comparado com hoje" />
            </div>
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
          </div>
        </details>

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

      {/* Coluna direita: atividade recente */}
      <aside aria-label="Atividade" className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-8">
        <Card>
          <TituloSecao>Atividade recente</TituloSecao>
          {estado.submissoes.length === 0 ? (
            <p className="text-sm text-muted">Quando você resolver missões, o que rolou aparece aqui.</p>
          ) : (
            <ul className="flex flex-col divide-y-2 divide-line">
              {estado.submissoes.slice(0, 4).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint-cyan text-sm font-extrabold text-tint-cyan-ink">
                    {s.feedback.nota_geral.toLocaleString("pt-BR")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{s.titulo}</p>
                    <p className="text-sm text-muted">{formatarData(s.data)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {estado.relatorio && (
          <Card>
            <TituloSecao>Foco da semana</TituloSecao>
            <p className="leading-relaxed">{estado.relatorio.recomendacao_da_semana}</p>
          </Card>
        )}
      </aside>

      <EditorAvatar aberto={editando} aoMudar={setEditando} avatar={avatar} aoSalvar={salvarAvatar} />
    </div>
  );
}
