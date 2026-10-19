"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, Plus, RefreshCw, Target, Zap } from "lucide-react";
import { MinhaEquipe } from "@/components/rede/MinhaEquipe";
import { Clara } from "@/components/jogo";
import { CaminhoTrilha } from "@/components/painel/CaminhoTrilha";
import { BoasVindasClara } from "@/components/painel/BoasVindasClara";
import { ChipNivel } from "@/components/painel/AvatarMini";
import { Constancia } from "@/components/painel/Constancia";
import { Radar } from "@/components/Radar";
import {
  Aviso,
  Card,
  Carregando,
  LinkAcao,
  SeloIA,
  TituloSecao,
  botao,
  cx,
  formatarData,
  tempoRelativo,
} from "@/components/ui";
import { montarUnidades } from "@/lib/trilha";
import { api } from "@/lib/api";
import { competencia, forcasEAtencao } from "@/lib/competencias";
import { acoes, diasDesde, hoje, useEstado, type Estado } from "@/lib/estado";
import { useGanhoXp } from "@/lib/ganho-xp";
import { useMissaoDoDia } from "@/lib/missao/useMissaoDoDia";
import type { PostForum } from "@/lib/types";

export default function Inicio() {
  const estado = useEstado();
  if (!estado) return null;
  return <Painel estado={estado} />;
}

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Pilulas({ estado }: { estado: Estado }) {
  const ganho = useGanhoXp();
  const base = "inline-flex items-center gap-2 rounded-2xl border-2 border-line bg-card px-3.5 py-2 text-sm font-extrabold shadow-[0_3px_0_var(--line)]";
  return (
    <ul className="flex flex-wrap items-center gap-2.5" aria-label="Seus números">
      <li className={base}>
        <Flame aria-hidden className="size-5 origin-bottom animate-chama text-[#ff8a00]" fill="currentColor" />
        {estado.sequencia.dias} {estado.sequencia.dias === 1 ? "dia" : "dias"}
      </li>
      <li key={ganho?.id ?? 0} className={cx(base, ganho && "motion-safe:animate-pop border-[#f5b301]")}>
        <Zap aria-hidden className={cx("size-5 text-[#f5b301]", ganho && "motion-safe:animate-faiscar")} fill="currentColor" />
        {estado.xp.toLocaleString("pt-BR")} XP
      </li>
      <li>
        <ChipNivel estado={estado} />
      </li>
    </ul>
  );
}

function Painel({ estado }: { estado: Estado }) {
  const { perfil } = estado;
  const dataExtensa = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const { proximo } = montarUnidades(estado);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <BoasVindasClara key={estado.usuarioId ?? estado.perfil.email ?? "demo"} conta={estado.usuarioId ?? estado.perfil.email ?? "demo"} />
        {/* Saudação */}
        <section
          aria-label="Boas-vindas"
          className="relative isolate overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#1478d0_0%,#1cb0f6_70%,#5fd0ff_100%)] p-6 text-white shadow-[0_5px_0_#0b4f91] sm:p-8"
        >
          <span aria-hidden className="absolute -right-10 -top-16 -z-10 size-64 rounded-full bg-white/15" />
          <span aria-hidden className="absolute -bottom-24 right-24 -z-10 size-56 rounded-full bg-white/10" />
          <div className="flex max-w-md flex-col gap-3 pr-24 sm:pr-40">
            <span className="text-sm font-bold text-white/85 first-letter:uppercase">{dataExtensa}</span>
            <h1 className="font-display text-3xl font-extrabold italic sm:text-4xl">
              {saudacao()}, {perfil.nome.split(" ")[0]}!
            </h1>
            <p className="text-white/90">
              {perfil.cargo} · {perfil.setor} · equipe de {perfil.tamanhoEquipe} pessoas
            </p>
            {proximo?.href && (
              <Link
                href={proximo.href}
                className="mt-1 inline-flex min-h-12 items-center gap-2 self-start rounded-2xl bg-white px-5 text-sm font-extrabold uppercase tracking-wider text-[#1478d0] shadow-[0_4px_0_#9fd6f7] transition-[transform,box-shadow] active:translate-y-1 active:shadow-none"
              >
                Continuar trilha <ArrowRight aria-hidden className="size-5" />
              </Link>
            )}
          </div>
          {/* No celular ela fica menor (escala a partir do canto) e o texto reserva o espaço dela; no desktop não muda. */}
          <Clara pose="acenando" largura={150} className="pointer-events-none absolute -bottom-3 right-4 origin-bottom-right scale-[0.55] sm:scale-100" />
        </section>

        <div className="xl:hidden">
          <Pilulas estado={estado} />
        </div>

        <CardMissao estado={estado} />

        {/* No celular a constância vem logo após a missão; no desktop ela fica na coluna da direita */}
        <div className="xl:hidden">
          <Constancia estado={estado} />
        </div>

        <CaminhoTrilha estado={estado} />

        <div className="grid gap-6 lg:grid-cols-2">
          <CardRelatorio estado={estado} />
          <Card>
            <TituloSecao>Radar de competências</TituloSecao>
            <Radar
              atual={estado.pontuacoes}
              antes={estado.diagnostico?.pontuacoes}
              rotulo="Radar de competências: diagnóstico inicial comparado com hoje"
            />
          </Card>
        </div>
      </div>

      {/* Coluna direita: números, constância, comunidade, equipe */}
      <aside aria-label="Resumo" className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-8">
        <div className="hidden xl:block">
          <Pilulas estado={estado} />
        </div>
        <div className="hidden xl:block">
          <Constancia estado={estado} />
        </div>
        <CardComunidade estado={estado} />
        {estado.usuarioId ? <MinhaEquipe key={estado.usuarioId} /> : <CardEquipe estado={estado} />}
      </aside>
    </div>
  );
}

function CardMissao({ estado }: { estado: Estado }) {
  const { missao, erro } = useMissaoDoDia(estado);
  return (
    <Card as="section" aria-label="Missão do dia" className="flex flex-wrap items-center gap-4 sm:gap-5">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#1b8fe6] text-white shadow-[0_4px_0_#0f66b4]">
        <Target aria-hidden className="size-7" />
      </span>
      {!missao ? (
        erro ? <Aviso>{erro}</Aviso> : <span className="text-muted">Preparando sua missão do dia…</span>
      ) : (
        <>
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-link">
              Missão do dia · 5–10 min · +40 XP {missao.status === "feita" && "· concluída"}
            </span>
            <p className="line-clamp-2 font-bold leading-snug">{missao.desafio.enunciado}</p>
          </div>
          <Link href="/missao" className={cx(botao.primario, "w-full sm:w-auto")}>
            {missao.status === "feita" ? "Ver feedback" : missao.status === "pulada" ? "Ver missão" : "Resolver"}
            <ArrowRight aria-hidden className="size-5" />
          </Link>
        </>
      )}
    </Card>
  );
}

function CardRelatorio({ estado }: { estado: Estado }) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const r = estado.relatorio;

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const novo = await api.relatorio({
        nome: estado.perfil.nome,
        inicial: estado.diagnostico?.pontuacoes ?? estado.pontuacoes,
        atual: estado.pontuacoes,
        atividades: estado.submissoes.slice(0, 10).map((s) => ({
          titulo: s.titulo,
          data: s.data,
          nota: s.feedback.nota_geral,
          dificuldades: s.feedback.dificuldades_identificadas,
        })),
      });
      acoes.salvarRelatorio({ ...novo, geradoEm: hoje() });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  const { forcas, atencao } = forcasEAtencao(estado.pontuacoes);

  return (
    <Card className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Seu momento como líder</h2>
        <SeloIA />
      </div>
      {gerando ? (
        <Carregando mensagem="Analisando suas atividades recentes…" />
      ) : r ? (
        <>
          <p className="leading-relaxed">{r.resumo}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-xl bg-tint-cyan p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-tint-cyan-ink">Forças</span>
              {r.forcas.map((f) => (
                <span key={f} className="text-sm">{f}</span>
              ))}
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-tint-purple p-3">
              <span className="text-xs font-bold uppercase tracking-wider text-tint-purple-ink">Atenção</span>
              {r.pontos_de_atencao.map((f) => (
                <span key={f} className="text-sm">{f}</span>
              ))}
            </div>
          </div>
          <p className="rounded-xl border border-dashed border-lilas px-3.5 py-3 text-sm leading-relaxed">
            <strong>Para esta semana:</strong> {r.recomendacao_da_semana}
          </p>
          <span className="text-xs text-muted">
            Atualizado em {formatarData(r.geradoEm)} · com base em:{" "}
            {r.base_atividades.length ? r.base_atividades.join(", ") : "diagnóstico inicial"}
          </span>
        </>
      ) : (
        <p className="text-muted">
          Ainda não há relatório. Ele usa seu diagnóstico ({competencia(forcas[0]).curto} forte,{" "}
          {competencia(atencao[0]).curto} em atenção) e suas missões recentes.
        </p>
      )}
      {erro && <Aviso>{erro}</Aviso>}
      <button type="button" onClick={gerar} disabled={gerando} className={cx(botao.secundario, "min-h-11 self-start text-sm")}>
        <RefreshCw aria-hidden className="size-4" /> {r ? "Atualizar relatório" : "Gerar relatório"}
      </button>
    </Card>
  );
}

function CardEquipe({ estado }: { estado: Estado }) {
  const [adicionando, setAdicionando] = useState(false);

  function adicionar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nome = String(f.get("nome") ?? "").trim();
    if (!nome) return;
    acoes.adicionarMembro({
      nome,
      funcao: String(f.get("funcao") ?? "").trim(),
      notas: "",
      ultimo1on1: String(f.get("ultimo") || hoje()),
    });
    setAdicionando(false);
  }

  const iniciais = (n: string) =>
    n
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <Card className="flex flex-col gap-2">
      <TituloSecao
        acao={
          <button
            type="button"
            onClick={() => setAdicionando((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line px-3 text-sm font-semibold text-link"
          >
            <Plus aria-hidden className="size-4" /> Adicionar
          </button>
        }
      >
        Minha equipe
      </TituloSecao>

      {adicionando && (
        <form onSubmit={adicionar} className="mb-2 grid gap-2 rounded-xl bg-sunken p-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Nome
            <input name="nome" required className="min-h-11 rounded-lg border border-line bg-card px-3" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Função
            <input name="funcao" className="min-h-11 rounded-lg border border-line bg-card px-3" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Último 1:1
            <input name="ultimo" type="date" max={hoje()} className="min-h-11 rounded-lg border border-line bg-card px-3" />
          </label>
          <button type="submit" className={cx(botao.primario, "min-h-11 sm:col-span-3")}>
            Salvar
          </button>
        </form>
      )}

      {estado.equipe.length === 0 ? (
        <p className="text-sm text-muted">Cadastre sua equipe para receber missões mais próximas da sua realidade.</p>
      ) : (
        <ul>
          {estado.equipe.map((m, i) => {
            const d = diasDesde(m.ultimo1on1);
            return (
              <li
                key={m.id}
                className={cx("flex items-center gap-3 py-2.5", i < estado.equipe.length - 1 && "border-b border-line")}
              >
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-tint-navy text-sm font-bold text-tint-navy-ink"
                >
                  {iniciais(m.nome)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{m.nome}</span>
                  <span className="truncate text-sm text-muted">{m.funcao}</span>
                </div>
                <span className={cx("text-sm", d > 14 ? "font-semibold text-tint-risk-ink" : "text-muted")}>
                  1:1 {d <= 0 ? "hoje" : `há ${d} dias`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <span className="text-xs text-muted">Usado só para personalizar suas missões. Não é avaliação dos liderados.</span>
    </Card>
  );
}

function CardComunidade({ estado }: { estado: Estado }) {
  const foco = forcasEAtencao(estado.pontuacoes).atencao[0];
  const [posts, setPosts] = useState<PostForum[] | null>(null);

  useEffect(() => {
    api
      .chamar<PostForum[]>(`/api/comunidade?tag=${foco}`)
      .then((p) => setPosts(p.slice(0, 3)))
      .catch(() => setPosts([]));
  }, [foco]);

  return (
    <Card>
      <TituloSecao acao={<LinkAcao href="/comunidade">Ver todos</LinkAcao>}>
        Comunidade · {competencia(foco).curto.toLowerCase()}
      </TituloSecao>
      {!posts ? (
        <Carregando />
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">Nenhum tópico ainda. Que tal abrir o primeiro?</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/comunidade/${p.id}`}
                className="flex h-full flex-col gap-2 rounded-xl bg-sunken p-4 hover:bg-selected"
              >
                <span className="font-semibold leading-snug">{p.titulo}</span>
                <span className="text-sm text-muted">
                  {p.anonimo ? "Anônimo" : p.autor} · {p.respostas.length ? `${p.respostas.length} respostas` : "sem resposta"} ·{" "}
                  {tempoRelativo(p.criadoEm)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
