"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { escutarVoz, reconhecimentoDisponivel, solicitarPermissaoMicrofone, mensagemErroMicrofone } from "@/lib/clara/voz";

const assinar = () => () => {};
const semSuporte = () => false;
export function useVozClara({ aberto, aoTranscrever, aoEnviar }: {
  aberto: boolean;
  aoTranscrever: (texto: string) => void;
  aoEnviar: (texto: string) => void;
}) {
  const temMicrofone = useSyncExternalStore(assinar, () => !!reconhecimentoDisponivel() && window.isSecureContext, semSuporte);
  const temVoz = useSyncExternalStore(assinar, () => typeof window !== "undefined" && "speechSynthesis" in window, semSuporte);
  const [aguardandoPermissao, setAguardandoPermissao] = useState(false);
  const pedidoPermissao = useRef(0);
  const solicitando = useRef(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [falando, setFalando] = useState(false);
  const [vozAtiva, setVozAtiva] = useState(false);
  const [erroVoz, setErroVoz] = useState<string | null>(null);
  const escuta = useRef<ReturnType<typeof escutarVoz> | null>(null);
  const fala = useRef<SpeechSynthesisUtterance | null>(null);
  const habilitada = useRef(false);
  const visivel = useRef(aberto);
  const callbacks = useRef({ aoTranscrever, aoEnviar });
  useEffect(() => { callbacks.current = { aoTranscrever, aoEnviar }; });

  const silenciar = useCallback(() => {
    if (fala.current) {
      fala.current.onend = fala.current.onerror = null;
      fala.current = null;
      window.speechSynthesis.cancel();
    }
    setFalando(false);
  }, []);
  useEffect(() => {
    visivel.current = aberto;
    if (!aberto) {
      pedidoPermissao.current++; solicitando.current = false;
      escuta.current?.cancelar(); escuta.current = null;
      if (fala.current) {
        fala.current.onend = fala.current.onerror = null;
        fala.current = null;
        window.speechSynthesis.cancel();
      }
      // Atualiza após a limpeza dos recursos, sem alterar estado durante o render.
      const frame = requestAnimationFrame(() => { setOuvindo(false); setFalando(false); setAguardandoPermissao(false); });
      return () => cancelAnimationFrame(frame);
    }
  }, [aberto]);
  useEffect(() => () => {
    visivel.current = false;
    pedidoPermissao.current++; solicitando.current = false;
    escuta.current?.cancelar();
    if (fala.current) {
      fala.current.onend = fala.current.onerror = null;
      window.speechSynthesis.cancel();
    }
  }, []);

  function falar(texto: string, manual = false) {
    if (!temVoz || !visivel.current || (!manual && !habilitada.current)) return;
    escuta.current?.cancelar(); escuta.current = null; setOuvindo(false);
    silenciar(); setErroVoz(null);
    const mensagem = new SpeechSynthesisUtterance(texto);
    mensagem.lang = "pt-BR";
    const vozes = window.speechSynthesis.getVoices();
    mensagem.voice = vozes.find((v) => v.lang.replace("_", "-").toLowerCase() === "pt-br")
      ?? vozes.find((v) => v.lang.toLowerCase().startsWith("pt")) ?? null;
    mensagem.rate = 1;
    mensagem.onend = () => { if (fala.current === mensagem) { fala.current = null; setFalando(false); } };
    mensagem.onerror = (e) => {
      if (fala.current !== mensagem) return;
      fala.current = null; setFalando(false);
      if (e.error !== "canceled" && e.error !== "interrupted") setErroVoz("Não consegui reproduzir a voz. Toque em Ouvir última resposta para tentar novamente.");
    };
    fala.current = mensagem; setFalando(true);
    window.speechSynthesis.speak(mensagem);
  }
  function alternarVoz() {
    habilitada.current = !habilitada.current;
    setVozAtiva(habilitada.current);
    if (!habilitada.current) silenciar();
  }
  async function alternarMicrofone() {
    if (ouvindo) { escuta.current?.parar(); return; }
    if (solicitando.current) return;
    silenciar(); setErroVoz(null);
    if (!window.isSecureContext) {
      setErroVoz("Para permitir o microfone, abra a plataforma em HTTPS ou em http://localhost:3000. Endereços HTTP da rede local não permitem esse acesso.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setErroVoz("Este navegador ou prévia não permite solicitar o microfone. Abra a plataforma diretamente no Chrome ou Edge.");
      return;
    }
    const id = ++pedidoPermissao.current;
    solicitando.current = true; setAguardandoPermissao(true);
    try {
      // O pedido acontece somente no clique, mesmo sem SpeechRecognition disponível.
      await solicitarPermissaoMicrofone(navigator.mediaDevices);
      if (!visivel.current || id !== pedidoPermissao.current) return;
      const Construtor = reconhecimentoDisponivel();
      if (!Construtor) {
        setErroVoz("Microfone autorizado, mas este navegador não oferece transcrição de voz. Abra a plataforma diretamente no Chrome ou Edge para falar com a Clara. Você ainda pode digitar e ouvir as respostas aqui.");
        return;
      }
      habilitada.current = true; setVozAtiva(true); setOuvindo(true);
      escuta.current = escutarVoz(Construtor, {
        transcrever: (texto) => callbacks.current.aoTranscrever(texto),
        enviar: (texto) => { if (visivel.current) callbacks.current.aoEnviar(texto); },
        erro: setErroVoz,
        terminar: () => { escuta.current = null; setOuvindo(false); },
      });
    } catch (e) {
      if (visivel.current && id === pedidoPermissao.current) setErroVoz(mensagemErroMicrofone(e));
    } finally {
      if (id === pedidoPermissao.current) { solicitando.current = false; setAguardandoPermissao(false); }
    }
  }
  return { temMicrofone, aguardandoPermissao, temVoz, ouvindo, falando, vozAtiva, erroVoz, falar, silenciar, alternarVoz, alternarMicrofone };
}
