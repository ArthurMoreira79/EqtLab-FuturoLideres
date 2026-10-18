"use client";

import Link from "next/link";
import { BookOpen, Check, Gift, Hammer, Lock, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Clara } from "@/components/jogo";
import { cx } from "@/components/ui";
import { moduloDaCompetencia, temConteudo } from "@/lib/conteudo/modulos";
import type { Estado } from "@/lib/estado";
import { statusModulo, type StatusModulo } from "@/lib/trilha";
import type { Modulo } from "@/lib/types";

/**
 * Trilha em “caminho” (como o aprender do Duolingo, só que azul): cada passo de um módulo
 * (lição, quiz, desafio) é um ponto. O ponto atual pulsa; os seguintes ficam travados.
 */

type SituacaoNo = "feito" | "atual" | "bloqueado";
type TipoNo = "licao" | "quiz" | "desafio" | "producao";

export interface No {
  id: string;
  tipo: TipoNo;
  titulo: string;
  situacao: SituacaoNo;
  href?: string;
}

export interface Unidade {
  modulo: Modulo;
  numero: number;
  status: StatusModulo;
  nos: No[];
}

/** Monta as unidades (módulos) e marca qual é o próximo passo. O primeiro passo pendente de um módulo aberto é o “atual”. */
export function montarUnidades(estado: Estado): { unidades: Unidade[]; proximo: No | null } {
  let proximo: No | null = null;
  const unidades = estado.trilha.map((slug, i): Unidade => {
    const m = moduloDaCompetencia(slug);
    const status = statusModulo(estado, m);
    const p = estado.progresso[m.id];
    const aberto = status === "andamento" || status === "disponivel";

    if (!temConteudo(m)) {
      return { modulo: m, numero: i + 1, status, nos: [{ id: `${m.id}-prod`, tipo: "producao", titulo: m.titulo, situacao: "bloqueado" }] };
    }

    const passos: Omit<No, "situacao">[] = [
      ...m.licoes.map((l) => ({ id: l.id, tipo: "licao" as const, titulo: l.titulo, href: `/trilha/${m.id}#licoes` })),
      { id: `${m.id}-quiz`, tipo: "quiz" as const, titulo: "Quiz rápido", href: `/trilha/${m.id}#quiz` },
      { id: `${m.id}-desafio`, tipo: "desafio" as const, titulo: "Desafio prático", href: `/trilha/${m.id}#desafio` },
    ];
    const feito = (n: Omit<No, "situacao">) =>
      n.tipo === "licao" ? !!p?.licoesFeitas.includes(n.id) : n.tipo === "quiz" ? p?.quizAcertos !== undefined : !!p?.concluido;

    const nos = passos.map((n): No => {
      if (feito(n)) return { ...n, situacao: "feito" };
      if (aberto && !proximo) {
        const atual: No = { ...n, situacao: "atual" };
        proximo = atual;
        return atual;
      }
      return { ...n, situacao: "bloqueado" };
    });
    return { modulo: m, numero: i + 1, status, nos };
  });
  return { unidades, proximo };
}

const ICONE: Record<TipoNo, LucideIcon> = { licao: BookOpen, quiz: Target, desafio: Gift, producao: Hammer };
const ROTULO: Record<TipoNo, string> = { licao: "Lição", quiz: "Quiz", desafio: "Desafio", producao: "Em produção" };

/** Deslocamento horizontal de cada ponto: desenha o zigue-zague do caminho. */
const ONDA = [0, 34, 58, 34, 0, -34, -58, -34];

function Ponto({ no, deslocamento }: { no: No; deslocamento: number }) {
  const Icone = no.situacao === "feito" ? Check : no.situacao === "bloqueado" && no.tipo !== "producao" ? Lock : ICONE[no.tipo];
  const rotulo = `${ROTULO[no.tipo]}: ${no.titulo}${no.situacao === "feito" ? " (concluído)" : no.situacao === "bloqueado" ? " (bloqueado)" : ""}`;

  const visual = (
    <span
      className={cx(
        "relative grid size-[76px] place-items-center rounded-full text-white transition-transform",
        no.situacao === "feito" && "bg-[#1b8fe6] shadow-[0_6px_0_#0f66b4]",
        no.situacao === "atual" && "animate-pulsar bg-[#1cb0f6] shadow-[0_6px_0_#0f8fcf] ring-[6px] ring-[#bfe8ff] hover:scale-105 dark:ring-[#2a5f8f]",
        no.situacao === "bloqueado" && "bg-[#dbe7f2] text-[#9bb0c2] shadow-[0_6px_0_#c3d4e4] dark:bg-line dark:text-muted dark:shadow-[0_6px_0_#161a52]",
      )}
    >
      <Icone aria-hidden className="size-8" strokeWidth={no.situacao === "feito" ? 3.5 : 2.4} />
    </span>
  );

  return (
    <li className="flex justify-center" style={{ transform: `translateX(${deslocamento}px)` }}>
      {/* âncora do tamanho do círculo: balão e Clara se posicionam em relação a ele */}
      <div className="relative">
        {no.situacao === "atual" && (
          <>
            <span className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 animate-quicar whitespace-nowrap rounded-xl border-2 border-[#cfe9fb] bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1478d0] shadow-[0_3px_0_#cfe9fb] dark:border-line dark:bg-card dark:text-ciano dark:shadow-none">
              Começar
              <span aria-hidden className="absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-[#cfe9fb] bg-white dark:border-line dark:bg-card" />
            </span>
            <span className="pointer-events-none absolute left-full top-1/2 ml-6 hidden w-[150px] -translate-y-[55%] sm:block">
              <Clara pose="apontando" largura={150} />
            </span>
          </>
        )}
        {no.href && no.situacao !== "bloqueado" ? (
          <Link href={no.href} aria-label={rotulo} title={no.titulo} className="block rounded-full outline-offset-4">
            {visual}
          </Link>
        ) : (
          <span role="img" aria-label={rotulo} title={no.titulo} className="block">
            {visual}
          </span>
        )}
      </div>
    </li>
  );
}

function CabecalhoUnidade({ u, total }: { u: Unidade; total: number }) {
  const emProducao = u.status === "producao";
  return (
    <div
      className={cx(
        "flex items-center justify-between gap-4 rounded-2xl p-4 text-white",
        emProducao
          ? "bg-[#9db3c9] shadow-[0_4px_0_#7f97ae] dark:bg-line dark:shadow-none"
          : "bg-[linear-gradient(110deg,#1478d0,#1cb0f6)] shadow-[0_4px_0_#0b4f91]",
      )}
    >
      <div className="min-w-0">
        <span className="text-xs font-extrabold uppercase tracking-wider text-white/85">
          Módulo {u.numero} de {total}
          {emProducao && " · em produção"}
        </span>
        <p className="truncate text-lg font-extrabold leading-tight sm:text-xl">{u.modulo.titulo}</p>
      </div>
      {!emProducao && u.status !== "bloqueado" && (
        <Link
          href={`/trilha/${u.modulo.id}`}
          aria-label={`Abrir o módulo ${u.modulo.titulo}`}
          className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-white/80 bg-white/15 transition-colors hover:bg-white/25"
        >
          <BookOpen aria-hidden className="size-5" />
        </Link>
      )}
    </div>
  );
}

export function CaminhoTrilha({ estado }: { estado: Estado }) {
  const { unidades, proximo } = montarUnidades(estado);
  const total = unidades.length;
  const concluidas = unidades.filter((u) => u.status === "concluido").length;

  // Mostra a partir do módulo atual: ele inteiro e os 2 seguintes.
  const atualIdx = Math.max(
    0,
    unidades.findIndex((u) => u.nos.some((n) => n.situacao === "atual")),
  );
  const visiveis = unidades.slice(atualIdx, atualIdx + 3);
  const todosPontosFeitos = !proximo;

  return (
    <section aria-label="Sua trilha" className="flex flex-col gap-6">
      {concluidas > 0 && (
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-[#ddf4ff] px-3.5 py-1.5 text-sm font-extrabold text-[#1478d0] dark:bg-selected dark:text-ciano">
          <Check aria-hidden className="size-4" strokeWidth={3} />
          {concluidas} {concluidas === 1 ? "módulo concluído" : "módulos concluídos"}
        </p>
      )}

      {visiveis.map((u, k) => {
        const aberta = u.nos.some((n) => n.situacao !== "bloqueado") || k === 0;
        // Módulos futuros mostram só alguns pontos (o resto aparece quando chegar a vez).
        const nos = aberta ? u.nos : u.nos.slice(0, 3);
        return (
          <div key={u.modulo.id} className="flex flex-col gap-8">
            <CabecalhoUnidade u={u} total={total} />
            <ol className="flex flex-col gap-7 pb-2 pt-10" aria-label={`Passos de ${u.modulo.titulo}`}>
              {nos.map((n, i) => (
                <Ponto key={n.id} no={n} deslocamento={ONDA[(i + k * 3) % ONDA.length]} />
              ))}
            </ol>
          </div>
        );
      })}

      {todosPontosFeitos && (
        <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-center">
          <Trophy aria-hidden className="size-10 text-[#f5b301]" />
          <p className="font-extrabold">Você concluiu todos os módulos disponíveis!</p>
          <p className="text-sm text-muted">Novos módulos chegam em breve. Enquanto isso, mantenha a constância nas missões diárias.</p>
        </div>
      )}
    </section>
  );
}
