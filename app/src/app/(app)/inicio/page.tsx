"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Flame, Plus, RefreshCw } from "lucide-react";
import { Radar } from "@/components/Radar";
import {
  Aviso,
  Barra,
  Card,
  Carregando,
  LinkAcao,
  SeloIA,
  TagCompetencia,
  TituloSecao,
  botao,
  cx,
  formatarData,
  tempoRelativo,
} from "@/components/ui";
import { api } from "@/lib/api";
import { competencia, forcasEAtencao } from "@/lib/competencias";
import { MODULOS, moduloDaCompetencia, temConteudo } from "@/lib/conteudo/modulos";
import { acoes, diasDesde, hoje, useEstado, type Estado } from "@/lib/estado";
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

function Painel({ estado }: { estado: Estado }) {
  const { perfil } = estado;
  const dataExtensa = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted first-letter:uppercase">{dataExtensa}</span>
          <h1 className="font-display text-3xl font-extrabold italic text-heading sm:text-4xl">
            {saudacao()}, {perfil.nome.split(" ")[0]}
          </h1>
          <span className="text-muted">
            {perfil.cargo} · {perfil.setor} · {perfil.mesesLideranca} {perfil.mesesLideranca === 1 ? "mês" : "meses"} na
            liderança · equipe de {perfil.tamanhoEquipe} pessoas
          </span>
        </div>
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-card px-4 py-2.5">
          <Flame aria-hidden className="size-5 text-roxo" />
          <span className="font-bold">
            {estado.sequencia.dias} {estado.sequencia.dias === 1 ? "dia" : "dias"} seguidos
          </span>
          {estado.sequencia.congelada && <span className="text-xs text-muted">(1 dia congelado)</span>}
        </div>
      </header>

      <CardMissao estado={estado} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <TituloSecao>Radar de competências</TituloSecao>
          <Radar
            atual={estado.pontuacoes}
            antes={estado.diagnostico?.pontuacoes}
            rotulo="Radar de competências: diagnóstico inicial comparado com hoje"
          />
        </Card>
        <CardRelatorio estado={estado} />
        <CardTrilha estado={estado} />
        <CardEquipe estado={estado} />
      </div>

      <CardComunidade estado={estado} />
    </div>
  );
}

function CardMissao({ estado }: { estado: Estado }) {
  const { missao, erro } = useMissaoDoDia(estado);
  return (
    <section
      aria-label="Missão do dia"
      className="flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-[linear-gradient(110deg,#1e2273_0%,#280f91_55%,#7c3cb8_100%)] p-6 text-white sm:p-8"
    >
      {!missao ? (
        erro ? <Aviso>{erro}</Aviso> : <span className="text-[#dcddf5]">Preparando sua missão do dia…</span>
      ) : (
        <>
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-2.5">
            <span className="text-sm font-bold uppercase tracking-[0.12em] text-ciano">
              Missão do dia · 5–10 min {missao.status === "feita" && "· concluída"}
            </span>
            <h2 className="text-xl font-bold leading-snug sm:text-2xl">{missao.desafio.enunciado}</h2>
            <div className="flex flex-wrap gap-2">
              {missao.desafio.competencias.map((c) => (
                <TagCompetencia key={c} slug={c} sobreEscuro />
              ))}
              <span className="rounded-full bg-navy px-2.5 py-1 text-xs text-[#dcddf5]">+40 XP</span>
            </div>
          </div>
          <Link href="/missao" className={botao.destaque}>
            {missao.status === "feita" ? "Ver feedback" : missao.status === "pulada" ? "Ver missão" : "Resolver agora"}
            <ArrowRight aria-hidden className="size-5" />
          </Link>
        </>
      )}
    </section>
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

function CardTrilha({ estado }: { estado: Estado }) {
  const atual =
    estado.trilha.map(moduloDaCompetencia).find((m) => temConteudo(m) && !estado.progresso[m.id]?.concluido) ??
    MODULOS[0];
  const prog = estado.progresso[atual.id];
  const passos = atual.licoes.length + 2;
  const feitos = (prog?.licoesFeitas.length ?? 0) + (prog?.quizAcertos !== undefined ? 1 : 0) + (prog?.concluido ? 1 : 0);
  const proxima = atual.licoes.find((l) => !prog?.licoesFeitas.includes(l.id));
  const concluidos = Object.values(estado.progresso).filter((p) => p.concluido).length;

  return (
    <Card className="flex flex-col gap-3.5">
      <TituloSecao acao={<LinkAcao href="/trilha">Ver trilha</LinkAcao>}>Progresso na trilha</TituloSecao>
      <span className="text-sm text-muted">
        Módulo {estado.trilha.indexOf(atual.competencia) + 1} de {estado.trilha.length} · {concluidos} concluído
        {concluidos === 1 ? "" : "s"}
      </span>
      <span className="font-display text-2xl font-bold italic text-heading">{atual.titulo}</span>
      <div className="flex items-center gap-3">
        <Barra valor={feitos / passos} className="flex-1" />
        <span className="font-bold">{Math.round((feitos / passos) * 100)}%</span>
      </div>
      <Link
        href={`/trilha/${atual.id}`}
        className="flex min-h-12 items-center gap-2.5 rounded-xl bg-sunken px-3.5 py-3 text-sm hover:bg-selected"
      >
        <ArrowRight aria-hidden className="size-4 shrink-0 text-link" />
        <span>
          Próximo:{" "}
          <strong>
            {proxima ? `${proxima.titulo} (${proxima.minutos} min)` : prog?.quizAcertos === undefined ? "Quiz rápido" : "Desafio prático"}
          </strong>
        </span>
      </Link>
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
        Na comunidade · sobre {competencia(foco).curto.toLowerCase()}
      </TituloSecao>
      {!posts ? (
        <Carregando />
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted">Nenhum tópico ainda. Que tal abrir o primeiro?</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-3">
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
