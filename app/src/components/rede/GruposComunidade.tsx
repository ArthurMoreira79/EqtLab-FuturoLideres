"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, MessageCircle, Plus, RefreshCw, Send, Users, X } from "lucide-react";
import { Aviso, Carregando, botao, cx, tempoRelativo } from "@/components/ui";
import { redeApi } from "@/lib/rede/cliente";
import type { AcaoRede, DetalheRede, MembroRede, ResumoRede } from "@/lib/rede/contratos";
import { PessoaAvatar } from "./PessoaAvatar";
import { AdicionarPessoa } from "./AdicionarPessoa";

export function GruposComunidade({ usuarioId }: { usuarioId?: string }) {
  if (!usuarioId) return <section className="rounded-2xl border border-line bg-card p-5"><h2 className="text-xl font-bold">Sua rede de equipes</h2><p className="mt-2 text-sm text-muted">Entre com sua conta para conectar colegas por e-mail e conversar em grupos privados.</p><Link className={cx(botao.secundario, "mt-4")} href="/entrar">Entrar na minha conta</Link></section>;
  return <Rede key={usuarioId} usuarioId={usuarioId} />;
}

function Rede({ usuarioId }: { usuarioId: string }) {
  const [resumo, setResumo] = useState<ResumoRede | null>(null);
  const [grupo, setGrupo] = useState<DetalheRede | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const [texto, setTexto] = useState("");
  const selecao = useRef<string | null>(null);
  const mensagem = useRef<HTMLTextAreaElement>(null);
  const carregar = useCallback(async (preferido?: string) => {
    try {
      const r = await redeApi.resumo(); setResumo(r);
      const id = preferido ?? selecao.current ?? new URLSearchParams(window.location.search).get("grupo");
      const destino = r.grupos.find((g) => g.id === id) ?? r.grupos[0];
      selecao.current = destino?.id ?? null;
      setGrupo(destino ? await redeApi.grupo(destino.id) : null);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar a rede."); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => {
    let ativo = true;
    redeApi.resumo().then(async (r) => {
      if (!ativo) return;
      setResumo(r);
      const id = new URLSearchParams(window.location.search).get("grupo");
      const destino = r.grupos.find((g) => g.id === id) ?? r.grupos[0];
      selecao.current = destino?.id ?? null;
      const detalhe = destino ? await redeApi.grupo(destino.id) : null;
      if (ativo) setGrupo(detalhe);
    }).catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar a rede."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);
  const grupoId = grupo?.id;
  useEffect(() => {
    if (!grupoId) return;
    let ativo = true;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      redeApi.grupo(grupoId).then((r) => { if (ativo) setGrupo(r); }).catch(() => {});
    }, 15_000);
    return () => { ativo = false; clearInterval(timer); };
  }, [grupoId]);

  async function agir(acao: AcaoRede) {
    if (ocupado) return;
    setOcupado(true); setErro(null);
    try {
      const r = await redeApi.agir(acao);
      await carregar(acao.acao === "aceitar-convite" ? r.equipeId : undefined);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setOcupado(false); }
  }
  async function escolher(id: string) {
    if (ocupado || carregando) return;
    selecao.current = id; setAdicionando(false); setTexto(""); setCarregando(true); setErro(null);
    await carregar(id);
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!grupo || !texto.trim() || ocupado) return;
    setOcupado(true); setErro(null);
    try {
      await redeApi.agir({ acao: "enviar-mensagem", equipeId: grupo.id, texto });
      setTexto(""); setGrupo(await redeApi.grupo(grupo.id)); mensagem.current?.focus();
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível enviar a mensagem."); }
    finally { setOcupado(false); }
  }
  const souDono = grupo?.donoId === usuarioId;
  const totalConectados = 1 + (grupo?.membros.filter((m) => m.status === "ativo").length ?? 0);
  return <section aria-label="Rede de equipes" className="flex flex-col gap-5 rounded-3xl border-2 border-line bg-card p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-tint-cyan text-tint-cyan-ink"><Users aria-hidden /></span><div><h2 className="text-xl font-extrabold">Sua rede de equipes</h2><p className="text-sm text-muted">Conecte pessoas e converse em grupo.</p></div></div>
      <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-bold text-link" disabled={carregando || ocupado} onClick={() => { setCarregando(true); setErro(null); void carregar(); }}><RefreshCw aria-hidden className="size-4" /> Atualizar</button>
    </header>
    {erro && <Aviso>{erro}</Aviso>}
    {resumo?.convites.map((g) => <div key={g.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-tint-cyan p-4">
      <PessoaAvatar nome={g.lider.nome} avatar={g.lider.avatar} /><div className="min-w-0 flex-1"><p className="font-bold">Convite: {g.nome}</p><p className="text-sm text-muted">{g.lider.nome} quer conectar você à equipe.</p></div>
      <button type="button" className={cx(botao.primario, "min-h-10 px-3 text-xs")} disabled={ocupado} onClick={() => void agir({ acao: "aceitar-convite", equipeId: g.id })}><Check aria-hidden className="size-4" /> Aceitar</button>
      <button type="button" className={cx(botao.secundario, "min-h-10 px-3 text-xs")} disabled={ocupado} onClick={() => void agir({ acao: "recusar-convite", equipeId: g.id })}><X aria-hidden className="size-4" /> Recusar</button>
    </div>)}
    {resumo && !resumo.minhaEquipe && <form className="flex flex-wrap items-end gap-3 rounded-2xl bg-sunken p-4" onSubmit={(e) => { e.preventDefault(); void agir({ acao: "criar-equipe", nome }); }}>
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-bold">Crie seu grupo<input required minLength={2} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Equipe de operações" className="min-h-11 rounded-xl border border-line bg-card px-3" /></label>
      <button className={cx(botao.primario, "min-h-11 text-sm")} disabled={ocupado} type="submit"><Plus aria-hidden className="size-4" /> Criar grupo</button>
    </form>}
    {resumo && resumo.grupos.length > 0 && <nav aria-label="Seus grupos" className="flex flex-wrap gap-2">{resumo.grupos.map((g) => <button key={g.id} type="button" aria-pressed={grupo?.id === g.id} disabled={ocupado || carregando}
      className={cx("min-h-11 rounded-xl border px-4 text-sm font-bold", grupo?.id === g.id ? "border-primary bg-primary text-on-primary" : "border-line bg-sunken")}
      onClick={() => void escolher(g.id)}>{g.nome}{g.donoId === usuarioId && " · sua equipe"}</button>)}</nav>}
    {carregando ? <Carregando mensagem="Carregando sua rede…" /> : grupo ? <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-extrabold">{grupo.nome}</h3><p className="text-sm text-muted">{totalConectados} {totalConectados === 1 ? "pessoa conectada" : "pessoas conectadas"} · responsável: {grupo.lider.nome}</p></div>
        {souDono && <button type="button" className={cx(botao.secundario, "text-sm")} onClick={() => setAdicionando((v) => !v)}><Plus aria-hidden className="size-4" /> Adicionar pessoa</button>}
      </div>
      {adicionando && souDono && <AdicionarPessoa aoCancelar={() => setAdicionando(false)} aoAdicionar={async (id) => { setAdicionando(false); await carregar(id); }} />}
      <details className="rounded-2xl border border-line p-4"><summary className="min-h-8 cursor-pointer text-sm font-bold">Pessoas e vínculos</summary>
        <div className="mt-3 flex items-center gap-3"><PessoaAvatar nome={grupo.lider.nome} avatar={grupo.lider.avatar} /><div className="min-w-0"><p className="font-bold">{grupo.lider.nome} · responsável</p><p className="break-all text-xs text-muted">{grupo.lider.email}</p></div></div>
        <ul className="mt-2 divide-y divide-line">{grupo.membros.map((m) => <PessoaMembro key={m.id} membro={m} gerenciar={souDono} ocupado={ocupado} aoRemover={() => agir({ acao: "remover-membro", equipeId: grupo.id, membroId: m.id })}
          aoSalvar={(funcao, ultimo1on1) => agir({ acao: "atualizar-membro", equipeId: grupo.id, membroId: m.id, funcao, ultimo1on1 })} />)}</ul>
      </details>
      <div className="rounded-2xl border border-line bg-sunken p-4">
        <h4 className="mb-4 flex items-center gap-2 font-bold"><MessageCircle aria-hidden className="size-5" /> Conversa da equipe</h4>
        <p className="mb-3 text-xs text-muted">Visível apenas às pessoas conectadas a este grupo. Atualiza a cada 15 segundos.</p>
        <ul aria-label="Mensagens da equipe" className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto">
          {grupo.mensagens.map((m) => <li key={m.id} className="flex gap-3"><PessoaAvatar nome={m.autor.nome} avatar={m.autor.avatar} /><div className="min-w-0 flex-1 rounded-xl bg-card p-3"><p className="text-xs font-bold">{m.autor.nome} <time dateTime={m.criadoEm} className="ml-2 font-normal text-muted">{tempoRelativo(m.criadoEm)}</time></p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{m.texto}</p></div></li>)}
        </ul>
        {!grupo.mensagens.length && <p className="py-5 text-sm text-muted">A conversa começa aqui. Compartilhe uma ideia com a equipe.</p>}
        <form onSubmit={enviar} className="mt-4 flex flex-col gap-2">
          <label className="text-sm font-bold" htmlFor={`mensagem-${grupo.id}`}>Mensagem para o grupo</label>
          <textarea ref={mensagem} id={`mensagem-${grupo.id}`} value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={2000} required disabled={ocupado}
            className="w-full rounded-xl border border-line bg-card p-3 text-sm" placeholder="Escreva para sua equipe…" />
          <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted">{texto.length}/2000</span><button type="submit" className={cx(botao.primario, "text-sm")} disabled={ocupado || !texto.trim()}><Send aria-hidden className="size-4" /> {ocupado ? "Enviando…" : "Enviar mensagem"}</button></div>
        </form>
      </div>
    </> : resumo && <p className="text-sm text-muted">Crie sua equipe ou aceite um convite para começar a conversar.</p>}
  </section>;
}

function PessoaMembro({ membro, gerenciar, ocupado, aoRemover, aoSalvar }: {
  membro: MembroRede; gerenciar: boolean; ocupado: boolean; aoRemover: () => Promise<void>;
  aoSalvar: (funcao: string, ultimo: string | null) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [funcao, setFuncao] = useState(membro.funcao);
  const [ultimo, setUltimo] = useState(membro.ultimo1on1 ?? "");
  return <li className="flex flex-col gap-2 py-3">
    <div className="flex items-center gap-3"><PessoaAvatar nome={membro.nome} avatar={membro.avatar} /><div className="min-w-0 flex-1"><p className="font-bold">{membro.nome}</p><p className="break-all text-xs text-muted">{membro.email}</p><p className="text-sm text-muted">{membro.funcao}</p><span className="text-xs font-semibold text-link">{membro.status === "ativo" ? "Conectado(a)" : "Convite pendente"}</span></div>
      {gerenciar && <button type="button" className="min-h-10 px-2 text-sm font-bold text-link" disabled={ocupado} onClick={() => setEditando((v) => !v)}>Gerenciar</button>}
    </div>
    {gerenciar && editando && <form onSubmit={(e) => { e.preventDefault(); void aoSalvar(funcao, ultimo || null); }} className="flex flex-col gap-2 rounded-xl bg-sunken p-3">
      <label className="flex flex-col gap-1 text-sm">Função<input value={funcao} onChange={(e) => setFuncao(e.target.value)} maxLength={80} className="min-h-10 rounded-lg border border-line bg-card px-3" /></label>
      <label className="flex flex-col gap-1 text-sm">Último 1:1 (só você vê)<input type="date" value={ultimo} onChange={(e) => setUltimo(e.target.value)} className="min-h-10 rounded-lg border border-line bg-card px-3" /></label>
      <button type="submit" disabled={ocupado} className={cx(botao.secundario, "text-sm")}>Salvar alterações</button>
      {removendo ? <div className="flex flex-wrap gap-2 text-sm"><span>Remover o acesso desta pessoa?</span><button type="button" className="min-h-10 font-bold text-tint-risk-ink" disabled={ocupado} onClick={() => void aoRemover()}>Confirmar remoção</button><button type="button" className="min-h-10 text-link" onClick={() => setRemovendo(false)}>Cancelar</button></div> : <button type="button" className="min-h-10 text-sm font-bold text-tint-risk-ink" onClick={() => setRemovendo(true)}>Remover da equipe</button>}
    </form>}
  </li>;
}
