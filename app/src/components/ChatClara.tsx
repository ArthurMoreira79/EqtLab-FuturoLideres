"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MessageCircle, Mic, MicOff, Send, Square, Volume2, VolumeX, X, Zap } from "lucide-react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useVozClara } from "@/hooks/useVozClara";
import { respostaGuiada, type MensagemClara } from "@/lib/clara/chat";
import { cx } from "./ui";

export function ChatClara({ usuarioId }: { usuarioId?: string }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<MensagemClara[]>([{ papel: "clara", texto: "Oi! Sou a Clara. Posso ajudar com sua trilha ou com uma situação de liderança. Por onde começamos?" }]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modo, setModo] = useState<"guiado" | "ia" | null>(usuarioId ? null : "guiado");
  const dialogo = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const ocupado = useRef(false);
  useEffect(() => { if (aberto) dialogo.current?.showModal(); else dialogo.current?.close(); }, [aberto]);
  useEffect(() => { if (aberto) fim.current?.scrollIntoView({ block: "nearest" }); }, [mensagens, aberto, enviando]);
  useEffect(() => {
    if (!aberto || !usuarioId) return;
    let ativo = true;
    api.chamar<{ modo: "guiado" | "ia" }>("/api/clara/chat")
      .then((r) => { if (ativo) setModo(r.modo); })
      .catch(() => { if (ativo) setErro("Não foi possível verificar a conexão da Clara. Tente enviar uma mensagem."); });
    return () => { ativo = false; };
  }, [aberto, usuarioId]);
  const voz = useVozClara({ aberto, aoTranscrever: setTexto, aoEnviar: (frase) => { void enviar(frase); } });
  const ultimaResposta = mensagens.findLast((m) => m.papel === "clara")?.texto;
  async function enviar(pergunta = texto) {
    const limpa = pergunta.trim();
    if (!limpa || ocupado.current) return;
    voz.silenciar();
    ocupado.current = true; setEnviando(true); setErro(null);
    const anteriores = mensagens;
    const novas: MensagemClara[] = [...mensagens, { papel: "usuario", texto: limpa }];
    setMensagens(novas);
    const pedido = { mensagens: novas.slice(-8), moduloId: caminho.match(/^\/trilha\/([^/]+)$/)?.[1] };
    try {
      const resposta = usuarioId
        ? await api.chamar<{ resposta: string; modo: "guiado" | "ia" }>("/api/clara/chat", { method: "POST", body: JSON.stringify(pedido) })
        : { resposta: respostaGuiada(pedido), modo: "guiado" as const };
      setMensagens([...novas, { papel: "clara", texto: resposta.resposta }]); setModo(resposta.modo); setTexto("");
      voz.falar(resposta.resposta);
    } catch (e) { setMensagens(anteriores); setErro(e instanceof Error ? e.message : "Não consegui responder agora."); }
    finally { ocupado.current = false; setEnviando(false); input.current?.focus(); }
  }
  return <>
    <button type="button" aria-label="Conversar com a Clara" aria-haspopup="dialog" aria-expanded={aberto} onClick={() => setAberto(true)}
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-5 z-50 grid size-16 place-items-center rounded-full border-[6px] border-[#2460a8] bg-[#f6ca55] text-white shadow-[0_0_0_6px_#162858,0_5px_14px_#0004] transition-transform hover:scale-105 lg:bottom-6 lg:right-6">
      <Zap aria-hidden className="size-8" fill="currentColor" /><span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-[#1b8fe6]"><MessageCircle aria-hidden className="size-3.5" /></span>
    </button>
    <dialog ref={dialogo} aria-labelledby="chat-clara-titulo" onCancel={(e) => { e.preventDefault(); setAberto(false); }}
      className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-auto right-3 top-auto m-0 h-[min(40rem,calc(100dvh-9rem))] max-h-none w-[min(24rem,calc(100%-1.5rem))] max-w-none overflow-hidden rounded-3xl border-2 border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-black/20 lg:bottom-6 lg:right-6">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 bg-[linear-gradient(110deg,#1478d0,#1cb0f6)] p-4 text-white"><div><h2 id="chat-clara-titulo" className="text-lg font-extrabold">Converse com a Clara</h2><p className="text-xs">{modo === "guiado" ? "Modo guiado · sem IA conectada" : modo === "ia" ? "Sua mentora de liderança" : "Ajuda com a trilha e liderança"}</p></div><button type="button" aria-label="Fechar chat da Clara" onClick={() => setAberto(false)} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/15"><X aria-hidden className="size-5" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4"><ol aria-label="Conversa com a Clara" aria-live="polite" className="flex flex-col gap-3">{mensagens.map((m, i) => <li key={i} className={cx("max-w-[95%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm leading-relaxed", m.papel === "clara" ? "self-start bg-sunken" : "self-end bg-tint-cyan")}><span className="mb-1 block text-xs font-bold text-link">{m.papel === "clara" ? "Clara" : "Você"}</span>{m.texto}</li>)}</ol>
          {enviando && <p role="status" className="mt-3 text-xs text-muted">Clara está preparando uma resposta…</p>}<div ref={fim} />
        </div>
        {mensagens.length === 1 && <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3">{["Como continuar minha trilha?", "Me explique o SCI", "Como conectar minha equipe?"].map((p) => <button type="button" key={p} disabled={enviando || voz.ouvindo || voz.aguardandoPermissao} onClick={() => void enviar(p)} className="min-h-9 shrink-0 rounded-xl border border-line px-3 text-left text-xs font-bold text-link">{p}</button>)}</div>}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line px-3 py-2">
          <button type="button" disabled={!voz.temVoz} aria-pressed={voz.vozAtiva} onClick={voz.alternarVoz} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-2 text-xs font-bold text-link disabled:opacity-50">{voz.vozAtiva ? <Volume2 aria-hidden className="size-4" /> : <VolumeX aria-hidden className="size-4" />}{voz.vozAtiva ? "Voz ligada" : "Ativar voz"}</button>
          {voz.falando ? <button type="button" onClick={voz.silenciar} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-2 text-xs font-bold text-link"><Square aria-hidden className="size-3" />Parar áudio</button>
            : <button type="button" disabled={!voz.temVoz || !ultimaResposta || enviando || voz.ouvindo} onClick={() => ultimaResposta && voz.falar(ultimaResposta, true)} className="flex min-h-10 items-center gap-1.5 rounded-xl border border-line px-2 text-xs font-bold text-link disabled:opacity-50"><Volume2 aria-hidden className="size-4" />Ouvir última resposta</button>}
        </div>
        {voz.aguardandoPermissao && <p role="status" className="px-4 pb-2 text-xs font-semibold text-link">Aguardando autorização… Permita o microfone na janela do navegador.</p>}
        {(voz.ouvindo || voz.falando) && <p role="status" className="px-4 pb-2 text-xs font-semibold text-link">{voz.ouvindo ? "Estou ouvindo… Ao terminar a fala, sua mensagem será enviada." : "Clara está falando…"}</p>}
        {voz.erroVoz && <p role="alert" className="px-4 pb-2 text-xs text-tint-risk-ink">{voz.erroVoz}</p>}
        {!voz.temMicrofone && <p className="px-4 pb-2 text-[11px] text-muted">Toque no microfone para solicitar acesso. A transcrição depende do suporte do navegador.</p>}
        {erro && <p role="alert" className="px-4 pb-2 text-xs text-tint-risk-ink">{erro}</p>}
        {modo === "guiado" && <p className="px-4 pb-2 text-xs text-muted">{usuarioId ? "A conexão com a IA ainda não está configurada no servidor. Estas são respostas guiadas." : "Na demonstração, as respostas são guiadas. Entre na sua conta para usar a IA configurada."}</p>}
        <p className="px-4 pb-2 text-[11px] text-muted">Use exemplos anônimos. Não envie dados pessoais ou confidenciais.</p>
        <p className="px-4 pb-2 text-[11px] text-muted">A transcrição usa o serviço de voz do navegador. O aplicativo não salva áudio.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (!voz.ouvindo && !voz.aguardandoPermissao) void enviar(); }} className="flex items-center gap-2 border-t border-line p-3"><label htmlFor="pergunta-clara" className="sr-only">Sua pergunta para a Clara</label><input ref={input} id="pergunta-clara" value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={800} disabled={enviando} readOnly={voz.ouvindo || voz.aguardandoPermissao} placeholder="Pergunte para a Clara…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-sunken px-3 text-sm" /><button type="button" aria-label={voz.ouvindo ? "Encerrar fala e enviar" : "Falar com a Clara"} aria-pressed={voz.ouvindo} disabled={enviando || voz.aguardandoPermissao} onClick={() => void voz.alternarMicrofone()} className={cx("grid size-12 shrink-0 place-items-center rounded-xl border border-line disabled:opacity-50", voz.ouvindo ? "animate-pulse bg-red-600 text-white" : "bg-sunken text-link")} title={voz.ouvindo ? "Encerrar fala e enviar" : "Falar e receber resposta em voz"}>{voz.aguardandoPermissao ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : voz.ouvindo ? <MicOff aria-hidden className="size-5" /> : <Mic aria-hidden className="size-5" />}</button><button type="submit" aria-label="Enviar para a Clara" disabled={enviando || voz.ouvindo || voz.aguardandoPermissao || !texto.trim()} className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-on-primary disabled:opacity-50"><Send aria-hidden className="size-5" /></button></form>
      </div>
    </dialog>
  </>;
}
