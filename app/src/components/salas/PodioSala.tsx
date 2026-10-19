"use client";

import Link from "next/link";
import { Crown, Medal, Plus, Trophy } from "lucide-react";
import { botao, cx } from "@/components/ui";
import type { EstadoSala, LinhaRanking } from "@/lib/salas/contratos";
import { FotoPessoa, primeiroNome } from "./Pessoa";

const CORES_CONFETE = ["#1cb0f6", "#ffd23f", "#ff6b9d", "#7ae582", "#a455ee", "#ff8a00"];

/** Confete caindo (só enfeite). Posições e cores saem do índice, para a tela renderizar sempre igual. */
export function Confete() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {Array.from({ length: 48 }, (_, i) => {
        const a = (Math.sin(i * 12.9898) * 43758.5453) % 1;
        const b = (Math.sin(i * 78.233) * 12345.6789) % 1;
        const esq = Math.abs(a) * 100;
        return (
          <span
            key={i}
            className="absolute top-0 block animate-confete"
            style={
              {
                left: `${esq}%`,
                width: 8 + (i % 3) * 3,
                height: 12 + (i % 4) * 3,
                background: CORES_CONFETE[i % CORES_CONFETE.length],
                borderRadius: i % 5 === 0 ? "50%" : 2,
                animationDelay: `${(i % 12) * 0.18}s`,
                animationDuration: `${2.8 + Math.abs(b) * 2}s`,
                ["--dx" as string]: `${(b - 0.5) * 160}px`,
                ["--giro" as string]: `${360 + (i % 7) * 120}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

const COLUNAS = [
  { pos: 2, altura: 120, cor: "linear-gradient(180deg,#cfd8e3,#98a6b8)", atraso: "0.9s" },
  { pos: 1, altura: 170, cor: "linear-gradient(180deg,#ffe27a,#f5b301)", atraso: "1.5s" },
  { pos: 3, altura: 92, cor: "linear-gradient(180deg,#f0b27a,#c47a3a)", atraso: "0.4s" },
];

function Coluna({ linha, altura, cor, atraso, euId }: { linha: LinhaRanking | undefined; altura: number; cor: string; atraso: string; euId?: string }) {
  const primeiro = linha?.posicao === 1;
  return (
    <div className="flex w-[30%] max-w-[168px] flex-col items-center">
      {linha ? (
        <div className="mb-2 flex animate-pop flex-col items-center gap-1 text-center" style={{ animationDelay: atraso }}>
          {primeiro && <Crown aria-hidden className="size-9 animate-brilhar text-[#f5b301]" fill="currentColor" />}
          <FotoPessoa pessoa={linha} tamanho={primeiro ? 92 : 72} className={cx("border-4 shadow-[0_6px_0_rgba(0,0,0,0.18)]", primeiro ? "border-[#f5b301]" : "border-white/70 dark:border-white/20")} />
          <span className="max-w-full truncate text-sm font-extrabold">{linha.id === euId ? "Você" : primeiroNome(linha.nome)}</span>
          <span className="rounded-full bg-card px-2.5 py-0.5 text-xs font-extrabold">
            {linha.acertos} {linha.acertos === 1 ? "acerto" : "acertos"}
          </span>
        </div>
      ) : (
        <div style={{ height: 120 }} />
      )}
      <div
        className="grid w-full origin-bottom animate-crescer place-items-start rounded-t-2xl pt-3 text-center shadow-[0_6px_0_rgba(0,0,0,0.15)]"
        style={{ height: altura, background: cor, animationDelay: atraso }}
      >
        <span className="mx-auto font-display text-4xl font-extrabold italic text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.25)]">{linha?.posicao ?? ""}</span>
      </div>
    </div>
  );
}

export function PodioSala({ dados, euId }: { dados: EstadoSala; euId?: string }) {
  const ranking = dados.ranking ?? [];
  const meu = ranking.find((r) => r.id === euId);
  const venceu = meu?.posicao === 1;
  const ordinal = (n: number) => `${n}º`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {(venceu || ranking.length > 0) && <Confete />}
      <header className="flex animate-entrar flex-col items-center gap-2 text-center">
        <span aria-hidden className="grid size-16 place-items-center rounded-3xl bg-[#fff8dc] text-[#f5b301] dark:bg-tint-purple">
          <Trophy className="size-9 animate-quicar" />
        </span>
        <h2 className="font-display text-4xl font-extrabold italic">Resultado final</h2>
        <p className="text-muted">
          {dados.titulo} · {dados.totalPerguntas} {dados.totalPerguntas === 1 ? "pergunta" : "perguntas"}
        </p>
      </header>

      {meu && (
        <p className="animate-pop rounded-2xl bg-tint-cyan px-4 py-3.5 text-center text-lg font-extrabold text-tint-cyan-ink" style={{ animationDelay: "2s" }}>
          {venceu ? "Você ficou em 1º lugar! 🏆" : `Você ficou em ${ordinal(meu.posicao)} lugar`} · acertou {meu.acertos} de {dados.totalPerguntas}
        </p>
      )}

      {ranking.length === 0 ? (
        <p className="rounded-2xl bg-sunken px-4 py-6 text-center text-muted">Ninguém participou desta sala.</p>
      ) : (
        <div className="flex items-end justify-center gap-2 pt-4 sm:gap-4">
          {COLUNAS.map((c) => (
            <Coluna key={c.pos} linha={ranking[c.pos - 1]} altura={c.altura} cor={c.cor} atraso={c.atraso} euId={euId} />
          ))}
        </div>
      )}

      {ranking.length > 0 && (
        <section aria-label="Classificação completa" className="rounded-3xl border-2 border-line bg-card p-4 shadow-[0_4px_0_var(--line)]">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted">
            <Medal aria-hidden className="size-4" /> Classificação · desempate pelo tempo de resposta
          </h3>
          <ol className="flex flex-col gap-2">
            {ranking.map((r, i) => (
              <li
                key={r.id}
                className={cx("flex animate-entrar items-center gap-3 rounded-2xl px-3 py-2.5", r.id === euId ? "bg-selected" : "bg-sunken")}
                style={{ animationDelay: `${2 + i * 0.06}s` }}
              >
                <span className="w-7 text-center text-lg font-extrabold text-muted">{r.posicao}</span>
                <FotoPessoa pessoa={r} tamanho={40} />
                <span className="flex-1 truncate font-bold">{r.id === euId ? `${r.nome} (você)` : r.nome}</span>
                <span className="text-right font-extrabold">
                  {r.acertos}
                  <span className="font-semibold text-muted"> / {dados.totalPerguntas} acertos</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap justify-center gap-3 pb-4">
        <Link href={`/comunidade`} className={botao.primario}>
          Voltar para a comunidade
        </Link>
        {dados.ehAnfitriao && (
          <Link href={`/comunidade/sala/nova?area=${dados.area.slug}`} className={botao.secundario}>
            <Plus aria-hidden className="size-5" /> Criar outra sala
          </Link>
        )}
      </div>
    </div>
  );
}
