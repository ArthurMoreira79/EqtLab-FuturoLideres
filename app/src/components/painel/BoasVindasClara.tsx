"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Play, RotateCcw, Square, X } from "lucide-react";
import { Clara, BOTAO_3D, BOTAO_3D_CLARO } from "@/components/jogo";
import { cx } from "@/components/ui";
import conteudo from "@/lib/conteudo/boas-vindas.json";

const fala = conteudo.trechos.join(" ");

export function BoasVindasClara({ conta }: { conta: string }) {
  const chave = `futuro-lideres:boas-vindas:v1:${conta}`;
  const [aberto, setAberto] = useState(() => {
    try { return localStorage.getItem(chave) !== "visto"; } catch { return true; }
  });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [consultando, setConsultando] = useState(true);
  const [falando, setFalando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const voz = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/clara/boas-vindas", { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((dados) => setVideoUrl(dados.videoUrl))
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setConsultando(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (aberto) dialogo.current?.showModal();
    else dialogo.current?.close();
  }, [aberto]);

  useEffect(() => () => {
    if (voz.current && "speechSynthesis" in window) {
      voz.current.onend = null;
      voz.current.onerror = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  function parar() {
    if (voz.current && "speechSynthesis" in window) {
      voz.current.onend = null;
      voz.current.onerror = null;
      window.speechSynthesis.cancel();
      voz.current = null;
    }
    video.current?.pause();
    setFalando(false);
  }

  function fechar() {
    parar();
    try { localStorage.setItem(chave, "visto"); } catch {}
    setAberto(false);
  }

  async function ouvir() {
    parar();
    setErro(null);
    if (videoUrl && video.current) {
      try {
        video.current.currentTime = 0;
        await video.current.play();
      } catch {
        setErro("Não foi possível reproduzir o vídeo. Você pode ler a mensagem abaixo.");
      }
      return;
    }
    if (!("speechSynthesis" in window)) {
      setErro("Este navegador não oferece leitura em voz alta. A mensagem está disponível abaixo.");
      return;
    }
    const mensagem = new SpeechSynthesisUtterance(fala);
    mensagem.lang = "pt-BR";
    mensagem.rate = 0.96;
    const vozes = window.speechSynthesis.getVoices();
    mensagem.voice = vozes.find((v) => v.lang.toLowerCase() === "pt-br") ?? null;
    mensagem.onstart = () => setFalando(true);
    mensagem.onend = () => { setFalando(false); voz.current = null; };
    mensagem.onerror = () => {
      setFalando(false);
      voz.current = null;
      setErro("A voz não está disponível neste navegador. Você pode ler a mensagem abaixo.");
    };
    voz.current = mensagem;
    window.speechSynthesis.speak(mensagem);
  }

  return (
    <>
      <button type="button" onClick={() => setAberto(true)}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border-2 border-line bg-card px-4 text-sm font-bold text-link">
        <MessageCircle aria-hidden className="size-4" /> Boas-vindas da Clara
      </button>
      <dialog ref={dialogo} aria-labelledby="clara-boas-vindas-titulo" aria-describedby="clara-boas-vindas-descricao"
        onCancel={(e) => { e.preventDefault(); fechar(); }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border-2 border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-[#080d35]/75 backdrop:backdrop-blur-sm">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#1478d0,#1cb0f6)] px-6 pb-0 pt-5 text-white">
          <button type="button" aria-label="Fechar boas-vindas" onClick={fechar}
            className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full bg-black/15 hover:bg-black/30">
            <X aria-hidden className="size-5" />
          </button>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em]">Sua jornada começa aqui</span>
          {videoUrl ? (
            <video ref={video} src={videoUrl} poster="/clara/boas-vindas-cenario.png" controls playsInline preload="metadata"
              onPlay={() => setFalando(true)} onPause={() => setFalando(false)} onEnded={() => setFalando(false)}
              onError={() => { setVideoUrl(null); setFalando(false); setErro("O vídeo não carregou. Use Ouvir a Clara para escutar a prévia."); }}
              className="mx-auto mt-4 aspect-video w-full rounded-t-2xl bg-[#0d3171] object-contain" aria-label="Clara apresenta o Futuro Líderes">
              <track kind="captions" src="/clara/boas-vindas.vtt" srcLang="pt-BR" label="Português" default />
            </video>
          ) : (
            <div className="mt-3 flex items-end justify-center gap-4">
              <Clara pose="acenando" busto largura={180} prioridade className={falando ? "motion-safe:animate-flutuar" : ""} />
              <div className="mb-8 rounded-2xl rounded-bl-sm bg-white px-4 py-3 font-bold text-[#1478d0] shadow-lg">
                {falando ? "Vamos aprender juntos!" : "Oi! Eu sou a Clara."}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div>
            <h2 id="clara-boas-vindas-titulo" className="text-2xl font-extrabold text-heading">{conteudo.titulo}</h2>
            <p id="clara-boas-vindas-descricao" className="mt-1 text-sm text-muted">Uma mensagem da sua companheira de jornada.</p>
          </div>
          <div className="space-y-2 text-sm leading-relaxed text-muted">
            {conteudo.trechos.map((trecho) => <p key={trecho}>{trecho}</p>)}
          </div>
          {!consultando && !videoUrl && <p className="text-xs text-muted">Prévia com voz do navegador. O vídeo animado da Clara será exibido aqui quando estiver disponível.</p>}
          {erro && <p role="alert" className="text-sm text-tint-risk-ink">{erro}</p>}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={consultando} className={cx(BOTAO_3D_CLARO, "flex-1 gap-2 px-4 text-sm")}
              onClick={() => falando ? parar() : void ouvir()}>
              {falando ? <Square aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
              {consultando ? "Preparando…" : falando ? "Parar" : "Ouvir a Clara"}
            </button>
            <button type="button" className={cx(BOTAO_3D, "flex-1 px-4 text-sm")} onClick={fechar}>Vamos começar!</button>
          </div>
          <button type="button" className="inline-flex min-h-9 items-center justify-center gap-2 text-xs font-bold text-link" onClick={() => void ouvir()} disabled={consultando}>
            <RotateCcw aria-hidden className="size-3.5" /> Ouvir novamente
          </button>
        </div>
      </dialog>
    </>
  );
}
