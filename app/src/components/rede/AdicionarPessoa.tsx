"use client";
import { useEffect, useId, useState } from "react";
import { Aviso, botao, cx } from "@/components/ui";
import { PessoaAvatar } from "./PessoaAvatar";
import { redeApi } from "@/lib/rede/cliente";
import type { PessoaRede } from "@/lib/rede/contratos";

export function AdicionarPessoa({ aoAdicionar, aoCancelar }: { aoAdicionar: (id: string) => Promise<void>; aoCancelar: () => void }) {
  const listaId = useId();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [ultimo, setUltimo] = useState("");
  const [pessoas, setPessoas] = useState<PessoaRede[]>([]);
  const [selecionada, setSelecionada] = useState<PessoaRede | null>(null);
  const [indice, setIndice] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [avisoBusca, setAvisoBusca] = useState<string | null>(null);
  const [consultada, setConsultada] = useState("");

  useEffect(() => {
    if (email.trim().length < 3 || selecionada) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setBuscando(true);
      redeApi.buscar(email.trim(), controller.signal).then((r) => {
        setPessoas(r); setConsultada(email); setAvisoBusca(null);
      }).catch(() => {
        if (!controller.signal.aborted) { setPessoas([]); setAvisoBusca("Não foi possível buscar pessoas agora."); }
      }).finally(() => { if (!controller.signal.aborted) setBuscando(false); });
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [email, selecionada]);

  function escolher(pessoa: PessoaRede) {
    setSelecionada(pessoa); setEmail(pessoa.email); setNome(pessoa.nome); setFuncao(pessoa.cargo);
    setPessoas([]); setIndice(-1); setBuscando(false);
  }
  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true); setErro(null);
    try {
      const r = await redeApi.agir({ acao: "adicionar-membro", email, nome, funcao, ultimo1on1: ultimo || null });
      if (r.equipeId) await aoAdicionar(r.equipeId);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível adicionar."); }
    finally { setSalvando(false); }
  }
  const campo = "min-h-11 w-full min-w-0 rounded-xl border border-line bg-card px-3";
  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-2xl bg-sunken p-4">
      <div>
        <label htmlFor={`${listaId}-email`} className="mb-1 block text-sm font-semibold">E-mail da pessoa</label>
        <input id={`${listaId}-email`} type="email" required maxLength={254} value={email} autoComplete="off"
          role="combobox" aria-autocomplete="list" aria-expanded={pessoas.length > 0} aria-controls={listaId}
          aria-activedescendant={indice >= 0 ? `${listaId}-${indice}` : undefined}
          onChange={(e) => { setEmail(e.target.value); setSelecionada(null); setPessoas([]); setIndice(-1); setNome(""); setFuncao(""); setBuscando(false); setAvisoBusca(null); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && pessoas.length) { e.preventDefault(); setIndice((i) => (i + 1) % pessoas.length); }
            if (e.key === "ArrowUp" && pessoas.length) { e.preventDefault(); setIndice((i) => (i + pessoas.length - 1) % pessoas.length); }
            if (e.key === "Enter" && indice >= 0 && pessoas[indice]) { e.preventDefault(); escolher(pessoas[indice]); }
            if (e.key === "Escape") { setPessoas([]); setIndice(-1); }
          }} placeholder="Digite para buscar pelo e-mail" className={campo} disabled={salvando} />
        <ul id={listaId} role="listbox" aria-label="Pessoas encontradas" className="mt-2 flex flex-col gap-1">
          {pessoas.map((p, i) => <li key={p.id} role="presentation">
            <button id={`${listaId}-${i}`} type="button" role="option" aria-selected={indice === i} tabIndex={-1}
              className={cx("flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left hover:bg-selected", indice === i && "bg-selected")}
              onClick={() => escolher(p)}>
              <PessoaAvatar nome={p.nome} avatar={p.avatar} />
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{p.nome}</span><span className="block break-all text-xs text-muted">{p.email}</span></span>
            </button>
          </li>)}
        </ul>
        <p role="status" className="text-xs text-muted">
          {buscando ? "Buscando pessoas…" : selecionada ? `${selecionada.nome} selecionado(a).` : avisoBusca || (consultada.length >= 3 && consultada === email && !pessoas.length ? "Nenhuma conta encontrada. O vínculo ficará pendente até essa pessoa se cadastrar e aceitar." : "Digite pelo menos 3 caracteres do e-mail.")}
        </p>
      </div>
      {!selecionada && <label className="flex flex-col gap-1 text-sm">Nome (opcional)<input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} className={campo} disabled={salvando} /></label>}
      <label className="flex flex-col gap-1 text-sm">Função<input value={funcao} onChange={(e) => setFuncao(e.target.value)} maxLength={80} className={campo} disabled={salvando} /></label>
      <label className="flex flex-col gap-1 text-sm">Último 1:1 (opcional)<input type="date" value={ultimo} onChange={(e) => setUltimo(e.target.value)} className={campo} disabled={salvando} /></label>
      <p className="text-xs text-muted">A pessoa verá o convite na Comunidade ao entrar com este e-mail. Nenhuma mensagem de e-mail é enviada.</p>
      {erro && <Aviso>{erro}</Aviso>}
      <button className={cx(botao.primario, "w-full text-sm")} type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Adicionar à equipe"}</button>
      <button className="min-h-10 text-sm font-bold text-link" type="button" onClick={aoCancelar} disabled={salvando}>Cancelar</button>
    </form>
  );
}
