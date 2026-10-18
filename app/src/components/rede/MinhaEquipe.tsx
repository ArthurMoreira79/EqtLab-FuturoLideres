"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Aviso, Card, Carregando, TituloSecao, botao, cx, formatarData } from "@/components/ui";
import { PessoaAvatar } from "./PessoaAvatar";
import { AdicionarPessoa } from "./AdicionarPessoa";
import { redeApi } from "@/lib/rede/cliente";
import type { DetalheRede } from "@/lib/rede/contratos";

export function MinhaEquipe() {
  const [grupo, setGrupo] = useState<DetalheRede | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const carregar = useCallback(async () => {
    try {
      const resumo = await redeApi.resumo();
      setGrupo(resumo.minhaEquipe ? await redeApi.grupo(resumo.minhaEquipe.id) : null);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar sua equipe."); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => {
    let ativo = true;
    redeApi.resumo().then(async (r) => r.minhaEquipe ? await redeApi.grupo(r.minhaEquipe.id) : null)
      .then((r) => { if (ativo) setGrupo(r); })
      .catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar sua equipe."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);
  return <Card className="flex flex-col gap-4">
    <TituloSecao acao={<button type="button" onClick={() => setAdicionando((v) => !v)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-line px-3 text-sm font-semibold text-link"><Plus aria-hidden className="size-4" /> Adicionar</button>}>Minha equipe</TituloSecao>
    {adicionando && <AdicionarPessoa aoCancelar={() => setAdicionando(false)} aoAdicionar={async (id) => { setGrupo(await redeApi.grupo(id)); setErro(null); setAdicionando(false); }} />}
    {erro && <><Aviso>{erro}</Aviso><button type="button" className={botao.secundario} onClick={() => { setCarregando(true); setErro(null); void carregar(); }}><RefreshCw className="size-4" /> Tentar novamente</button></>}
    {carregando ? <Carregando mensagem="Carregando equipe…" /> : grupo?.membros.length ? <ul className="divide-y divide-line">{grupo.membros.map((m) => <li key={m.id} className="flex items-start gap-3 py-3">
      <PessoaAvatar nome={m.nome} avatar={m.avatar} /><div className="min-w-0 flex-1"><p className="truncate font-bold">{m.nome}</p><p className="break-all text-xs text-muted">{m.email}</p><p className="text-sm text-muted">{m.funcao}</p>{m.ultimo1on1 && <p className="text-xs text-muted">Último 1:1: {formatarData(m.ultimo1on1)}</p>}<span className={cx("text-xs font-bold", m.status === "ativo" ? "text-tint-cyan-ink" : "text-muted")}>{m.status === "ativo" ? "Conectado(a)" : "Convite pendente"}</span></div>
    </li>)}</ul> : !erro && <p className="text-sm text-muted">Adicione colegas pelo e-mail e forme seu grupo na Comunidade.</p>}
    {grupo && <Link href={`/comunidade?grupo=${grupo.id}`} className={cx(botao.secundario, "w-full text-sm")}>Abrir grupo na Comunidade</Link>}
    <p className="text-xs text-muted">Equipe e vínculos salvos na sua conta. Cada pessoa aceita o convite antes de acessar o grupo.</p>
  </Card>;
}
