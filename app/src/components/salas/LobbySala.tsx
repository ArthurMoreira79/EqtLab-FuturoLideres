"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Play, Users } from "lucide-react";
import { BOTAO_3D } from "@/components/jogo";
import { cx } from "@/components/ui";
import type { EstadoSala, ParticipanteSala } from "@/lib/salas/contratos";
import { FotoPessoa, primeiroNome } from "./Pessoa";

const BOLHA = 72;
const CARTAO_METADE_LARGURA = 160;
const CARTAO_METADE_ALTURA = 250;

/** Número “aleatório” estável (0 a 1) a partir de um texto: a bolha da pessoa não muda de lugar a cada atualização. */
function sorteio(semente: string, passo: number) {
  let h = 2166136261 ^ passo;
  for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** Espalha as bolhas em volta do cartão central, sem cair em cima dele nem umas sobre as outras. */
function posicionar(pessoas: ParticipanteSala[], largura: number, altura: number) {
  const colocadas: { id: string; x: number; y: number }[] = [];
  const margem = BOLHA / 2 + 8;
  for (const p of pessoas) {
    let escolhida = { x: largura / 2, y: margem };
    for (let tentativa = 0; tentativa < 60; tentativa++) {
      const x = margem + sorteio(p.id, tentativa * 2) * Math.max(largura - 2 * margem, 1);
      const y = margem + sorteio(p.id, tentativa * 2 + 1) * Math.max(altura - 2 * margem - 22, 1);
      escolhida = { x, y };
      const noCartao =
        Math.abs(x - largura / 2) < CARTAO_METADE_LARGURA + BOLHA / 2 && Math.abs(y - altura / 2) < CARTAO_METADE_ALTURA + BOLHA / 2;
      const colide = colocadas.some((c) => Math.hypot(c.x - x, c.y - y) < BOLHA + 14);
      if (!noCartao && !colide) break;
    }
    colocadas.push({ id: p.id, ...escolhida });
  }
  return colocadas;
}

function useLargura() {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setLargura(el.clientWidth);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, largura] as const;
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");
export function formatarContagem(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${doisDigitos(total % 60)}`;
}

export function LobbySala({
  dados,
  agora,
  euId,
  iniciando,
  aoIniciar,
}: {
  dados: EstadoSala;
  agora: number;
  euId?: string;
  iniciando: boolean;
  aoIniciar: () => void;
}) {
  const [caixa, largura] = useLargura();
  const estreito = largura > 0 && largura < 640;
  const altura = estreito ? 820 : 600;
  const posicoes = useMemo(() => (largura ? posicionar(dados.participantes, largura, altura) : []), [dados.participantes, largura, altura]);
  const restanteMs = dados.inicioEm - agora;
  const segundos = Math.max(0, Math.ceil(restanteMs / 1000));
  const reta = segundos <= 5;
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/comunidade/sala/${dados.codigo}`;
  const codigoFormatado = `${dados.codigo.slice(0, 3)} ${dados.codigo.slice(3)}`;

  return (
    <div ref={caixa} className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem]" style={{ height: altura }}>
      {posicoes.map((pos, i) => {
        const pessoa = dados.participantes.find((p) => p.id === pos.id)!;
        const eu = pessoa.id === euId;
        return (
          <div key={pos.id} className="absolute z-0" style={{ left: pos.x - BOLHA / 2, top: pos.y - BOLHA / 2, width: BOLHA }}>
            <div className="animate-pop">
              <div
                className="flex animate-flutuar flex-col items-center gap-1"
                style={{ animationDuration: `${3.6 + sorteio(pessoa.id, 99) * 2.4}s`, animationDelay: `${-sorteio(pessoa.id, 98) * 4}s` }}
              >
                <FotoPessoa
                  pessoa={pessoa}
                  tamanho={BOLHA}
                  className={cx(
                    "border-4 bg-card shadow-[0_6px_0_rgba(0,0,0,0.18)]",
                    eu ? "border-ciano" : "border-white/70 dark:border-white/20",
                  )}
                />
                <span className={cx("max-w-[92px] truncate rounded-full px-2 py-0.5 text-[11px] font-extrabold", eu ? "bg-ciano text-noite" : "bg-card text-heading")}>
                  {eu ? "Você" : primeiroNome(pessoa.nome)}
                </span>
              </div>
            </div>
            <span className="sr-only">{i + 1}º a entrar: {pessoa.nome}</span>
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <section
          aria-label="Entrada da sala"
          className="pointer-events-auto z-10 flex w-[320px] max-w-[calc(100%-1rem)] animate-entrar flex-col items-center gap-3 rounded-[2rem] border-2 border-line bg-card p-5 shadow-[0_6px_0_var(--line)]"
        >
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">Escaneie ou digite o código</p>
          <div className="rounded-2xl bg-white p-3 shadow-inner">
            {link ? <QRCodeSVG value={link} size={176} level="M" bgColor="#ffffff" fgColor="#0b0d33" title={`QR code da sala ${dados.codigo}`} /> : <div className="size-44" />}
          </div>
          <p className="text-4xl font-extrabold tracking-[0.18em] text-heading" aria-label={`Código ${dados.codigo.split("").join(" ")}`}>
            {codigoFormatado}
          </p>
          <div className={cx("flex w-full flex-col items-center rounded-2xl px-4 py-2.5", reta ? "bg-[#fee4e2] text-[#b42318]" : "bg-tint-cyan text-tint-cyan-ink")}>
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Começa em</span>
            <span key={reta ? segundos : "t"} className={cx("text-4xl font-extrabold tabular-nums leading-none", reta && "animate-tique")}>
              {formatarContagem(restanteMs)}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-sm font-bold text-muted">
            <Users aria-hidden className="size-4" />
            {dados.participantes.length === 0
              ? "Aguardando as pessoas entrarem…"
              : `${dados.participantes.length} ${dados.participantes.length === 1 ? "pessoa na sala" : "pessoas na sala"}`}
          </p>
          {dados.ehAnfitriao && (
            <button type="button" onClick={aoIniciar} disabled={iniciando || segundos <= 3} className={`${BOTAO_3D} h-12 min-h-12 w-full gap-2 text-sm disabled:opacity-60`}>
              <Play aria-hidden className="size-4" fill="currentColor" /> Começar agora
            </button>
          )}
        </section>
      </div>

      {segundos > 0 && segundos <= 5 && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-40 grid place-items-center bg-[#0b0d33]/55 backdrop-blur-[2px]">
          <span key={segundos} className="animate-tique font-display text-[12rem] font-extrabold italic leading-none text-ciano drop-shadow-[0_8px_0_rgba(0,0,0,0.3)]">
            {segundos}
          </span>
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {segundos <= 5 && segundos > 0 ? `${segundos}` : ""}
      </p>
    </div>
  );
}
