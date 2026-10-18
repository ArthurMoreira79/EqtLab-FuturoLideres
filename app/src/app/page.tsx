"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { Button, Card, Chip, ProgressBar, buttonVariants } from "@heroui/react";
import { Check, Compass, Flame, Handshake, Lock, MessageSquareText, Route, Sparkles, Target, Trophy, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Abertura, RaiosDeFundo, Revelar, usePose } from "@/components/animacoes";
import type { Pose } from "@/components/animacoes";
import { BOTAO_3D, BOTAO_3D_CLARO_PEQUENO, CARTAO_JOGO, ClaraClassica, LINK_TEXTO, LogoMarca, Nuvens } from "@/components/jogo";
import { TemaToggle } from "@/components/TemaToggle";
import { cx } from "@/components/ui";
import { competencia } from "@/lib/competencias";
import { estadoDemo } from "@/lib/demo";
import { acoes, useEstado } from "@/lib/estado";

interface NoDaJornada {
  Icone: LucideIcon;
  titulo: string;
  cor: string;
  atual?: boolean;
}

// Prévia da trilha: o primeiro módulo já está liberado, o resto abre conforme o diagnóstico.
const JORNADA: NoDaJornada[] = [
  { Icone: MessageSquareText, titulo: "Feedback", cor: competencia("feedback").cor, atual: true },
  { Icone: Handshake, titulo: "Conflitos", cor: competencia("conflitos").cor },
  { Icone: Users, titulo: "Delegação", cor: competencia("delegacao").cor },
  { Icone: Compass, titulo: "Decisão", cor: competencia("decisao").cor },
  { Icone: Trophy, titulo: "Líder de referência", cor: "#f5b301" },
];

const PILARES = [
  { Icone: Target, cor: "#1b8fe6", titulo: "Missões diárias", texto: "Situações reais do seu dia a dia, em 5 a 10 minutos.", xp: "+40 XP" },
  { Icone: MessageSquareText, cor: "#a455ee", titulo: "Feedback da IA", texto: "Pontos fortes, melhorias e um exemplo de resposta mais forte.", xp: "+60 XP" },
  { Icone: Route, cor: "#00a3a3", titulo: "Trilha personalizada", texto: "Módulos curtos, na ordem que o seu diagnóstico pede.", xp: "+10 XP" },
];

const DIAS = ["S", "T", "Q", "Q", "S", "S", "D"];

function ChipFlutuante({ className, atraso = 0, children }: { className?: string; atraso?: number; children: React.ReactNode }) {
  return (
    <span
      style={{ animationDelay: `${atraso}ms` }}
      className={cx(
        "absolute z-30 inline-flex animate-quicar items-center gap-1.5 rounded-full border-2 border-[#cfe9fb] bg-white px-3 py-1.5 text-sm font-extrabold text-[#14174f] shadow-[0_3px_0_#cfe9fb] dark:border-line dark:bg-card dark:text-ink dark:shadow-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Cartão do painel: muda conforme a pose da Clara, como se ela estivesse trabalhando de verdade. */
function CartaoDaClara({ pose }: { pose: Pose }) {
  return (
    <div
      key={pose}
      className="absolute inset-x-9 top-[76px] z-20 flex min-h-[78px] animate-entrar items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_3px_0_#cfe9fb] dark:bg-card dark:shadow-none"
    >
      {pose === "acenando" && (
        <>
          <span aria-hidden className="size-9 shrink-0 rounded-full border-[5px] border-[#cfe9fb] dark:border-line" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-extrabold text-[#14174f] dark:text-ink">Dar feedback sem desmotivar</p>
            <p className="text-sm font-semibold text-[#8aa4b8] dark:text-muted">Missão do dia · 5 min · +40 XP</p>
          </div>
          <Flame aria-hidden className="size-6 shrink-0 origin-bottom animate-chama text-[#ff8a00]" fill="currentColor" />
        </>
      )}
      {pose === "pensando" && (
        <>
          <Sparkles aria-hidden className="size-8 shrink-0 animate-girar text-roxo-escuro" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-extrabold text-[#14174f] dark:text-ink">
              Analisando sua resposta
              {[0, 160, 320].map((d) => (
                <span key={d} aria-hidden className="size-1.5 animate-pontos rounded-full bg-[#1b8fe6]" style={{ animationDelay: `${d}ms` }} />
              ))}
            </p>
            <p className="text-sm font-semibold text-[#8aa4b8] dark:text-muted">Comparando com a rubrica…</p>
          </div>
        </>
      )}
      {pose === "raio" && (
        <>
          <Zap aria-hidden className="size-9 shrink-0 animate-faiscar fill-[#ffd23f] text-[#ff9f1c]" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-[#14174f] dark:text-ink">Feedback pronto!</p>
            <p className="text-sm font-semibold text-[#8aa4b8] dark:text-muted">3 pontos fortes · 2 melhorias</p>
          </div>
        </>
      )}
      {pose === "comemorando" && (
        <>
          <span aria-hidden className="grid size-9 shrink-0 animate-pop place-items-center rounded-full bg-[#1b8fe6] text-white dark:bg-ciano dark:text-noite">
            <Check className="size-5" strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-[#14174f] dark:text-ink">Missão concluída! +40 XP</p>
            <p className="text-sm font-semibold text-[#8aa4b8] dark:text-muted">Sequência de 6 dias</p>
          </div>
          <Flame aria-hidden className="size-6 shrink-0 origin-bottom animate-chama text-[#ff8a00]" fill="currentColor" />
        </>
      )}
    </div>
  );
}

/** Atraso da entrada em cascata (lido pela regra `.entra` no CSS). */
const atraso = (ms: number) => ({ "--atraso": `${ms}ms` }) as CSSProperties;

export default function Boasvindas() {
  const estado = useEstado();
  const router = useRouter();
  const pose = usePose();

  function explorarDemo() {
    acoes.carregarDemo(estadoDemo());
    router.push("/inicio");
  }

  const primeiroNome = estado?.perfil.nome.split(" ")[0];
  const destino = estado ? (estado.diagnostico ? "/inicio" : "/diagnostico") : "/cadastro";
  const rotuloCta = estado ? `Continuar como ${primeiroNome}` : "Começar minha jornada";

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-white text-heading dark:bg-bg">
      <Abertura />

      {/* Abertura: céu, mascote saindo das nuvens */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#dff3ff] via-[#eef9ff] to-white dark:from-[#11144a] dark:via-[#0f1240] dark:to-bg">
        <RaiosDeFundo />
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <LogoMarca largura={120} />
          <div className="flex items-center gap-2">
            {!estado && (
              <Link href="/entrar" className={cx(buttonVariants({ variant: "secondary", size: "sm" }), BOTAO_3D_CLARO_PEQUENO)}>
                Já tenho conta
              </Link>
            )}
            <TemaToggle className="text-heading hover:bg-white/60 dark:hover:bg-white/10" />
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-6xl items-end gap-4 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-center gap-6 pb-4 text-center lg:items-start lg:pb-24 lg:text-left">
            <div className="entra" style={atraso(0)}>
              <Chip color="accent" variant="soft">
                <Chip.Label>Desafio 6 · Hackathon Equatorial</Chip.Label>
              </Chip>
            </div>
            <div className="flex flex-col gap-3">
              <span className={cx("font-display text-2xl font-extrabold italic text-[#1b8fe6] dark:text-ciano", "entra")} style={atraso(100)}>
                <Zap aria-hidden className="mr-1 inline size-6 -translate-y-0.5 animate-faiscar fill-[#ffd23f] text-[#ff9f1c]" />
                Futuro Líderes
              </span>
              <h1 className={cx("text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl", "entra")} style={atraso(200)}>
                Vire o líder em quem a sua equipe confia
              </h1>
            </div>
            <p className={cx("max-w-xl text-lg leading-relaxed text-muted", "entra")} style={atraso(320)}>
              Você foi promovido por ser bom no que faz. Agora, treine liderança como um jogo: missões curtas todo dia,
              feedback imediato da IA e uma evolução que dá para ver.
            </p>
            <div className={cx("flex w-full max-w-sm flex-col items-center gap-5 lg:items-start", "entra")} style={atraso(440)}>
              <Link href={destino} className={cx(buttonVariants({ variant: "primary", size: "lg" }), BOTAO_3D, "sm:w-full")}>
                {rotuloCta}
              </Link>
              <Button variant="ghost" onPress={explorarDemo} className={cx(LINK_TEXTO, "h-auto min-h-11 bg-transparent px-2")}>
                Explorar com dados de demonstração
              </Button>
            </div>
          </div>

          {/* Cena: painel que reage à pose da Clara */}
          <div className={cx("relative mx-auto h-[540px] w-full max-w-md", "entra")} style={atraso(250)}>
            <div
              aria-hidden
              className="absolute inset-x-3 top-0 h-[330px] rounded-[2.5rem] border-[6px] border-[#bfe3f8] bg-[#dff3ff] dark:border-line dark:bg-sunken"
            />
            <p className="absolute inset-x-0 top-8 text-center text-lg font-extrabold text-[#6b8fa8] dark:text-muted">
              Prévia · Clara, sua mentora com IA
            </p>
            <CartaoDaClara pose={pose} />

            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <ClaraClassica largura={240} prioridade />
            </div>
            <Nuvens className="z-20 h-32" />

            <ChipFlutuante className="left-0 top-[228px]">
              <Flame aria-hidden className="size-4 origin-bottom animate-chama text-[#ff8a00]" fill="currentColor" /> 5 dias seguidos
            </ChipFlutuante>
            <ChipFlutuante className="right-0 top-[300px]" atraso={500}>
              <Zap aria-hidden className="size-4 animate-faiscar text-[#f5b301]" fill="currentColor" /> Nível 1
            </ChipFlutuante>
          </div>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-5 pb-20 pt-10 sm:px-8">
        {/* Jornada */}
        <section aria-labelledby="titulo-jornada" className="flex flex-col items-center gap-8">
          <Revelar className="flex flex-col gap-2 text-center">
            <h2 id="titulo-jornada" className="text-3xl font-extrabold">
              Sua jornada de líder
            </h2>
            <p className="text-muted">Cada fase destrava a próxima. A ordem é montada a partir do seu diagnóstico.</p>
          </Revelar>
          <ol className="grid w-full max-w-4xl gap-8 pb-10 md:grid-cols-5 md:pb-12">
            {JORNADA.map(({ Icone, titulo, cor, atual }, i) => (
              <Revelar
                key={titulo}
                como="li"
                atraso={i * 130}
                className={cx(
                  "flex flex-col items-center gap-3",
                  i % 2 === 1 ? "max-md:translate-x-12 md:translate-y-10" : "max-md:-translate-x-12",
                )}
              >
                {atual && (
                  <span className="relative -mb-1 animate-quicar rounded-xl border-2 border-[#cfe9fb] bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#1b8fe6] dark:border-line dark:bg-card dark:text-ciano">
                    Começar
                  </span>
                )}
                <span
                  className={cx(
                    "grid size-20 place-items-center rounded-full shadow-[0_6px_0_rgba(20,23,79,0.22)] transition-transform hover:scale-110",
                    atual ? "animate-pulsar text-white" : "bg-[#e6eef5] text-[#9bb0c2] shadow-[0_6px_0_#cbd8e3] dark:bg-line dark:text-muted dark:shadow-[0_6px_0_#161a52]",
                  )}
                  style={atual ? { background: cor } : undefined}
                >
                  {atual ? (
                    <Icone aria-hidden className="size-9 animate-balancar" />
                  ) : (
                    <Lock aria-hidden className="size-7 group-hover/rev:animate-balancar" />
                  )}
                </span>
                <span className="text-center text-sm font-extrabold">
                  {titulo}
                  {!atual && <span className="sr-only"> (bloqueado)</span>}
                </span>
              </Revelar>
            ))}
          </ol>
        </section>

        {/* Sequência + nível */}
        <section aria-label="Sequência e nível" className="grid gap-5 lg:grid-cols-2">
          <Revelar className="flex">
            <Card className={cx(CARTAO_JOGO, "w-full gap-4 p-6")}>
              <Card.Header className="flex-row items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#fff3e0] text-[#ff8a00] dark:bg-tint-risk">
                  <Flame aria-hidden className="size-7 origin-bottom animate-chama" fill="currentColor" />
                </span>
                <div>
                  <Card.Title className="text-xl font-extrabold">Sequência semanal</Card.Title>
                  <Card.Description className="text-muted">Volte todo dia e mantenha o fogo aceso.</Card.Description>
                </div>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                <ul className="flex justify-between gap-1" aria-label="Exemplo de semana">
                  {DIAS.map((dia, i) => (
                    <li key={i} className="flex flex-col items-center gap-2 text-sm font-extrabold text-[#6b8fa8] dark:text-muted">
                      {dia}
                      <span
                        style={{ animationDelay: `${300 + i * 150}ms` }}
                        className={cx(
                          "grid size-10 place-items-center rounded-full opacity-0 group-data-[visivel=true]/rev:animate-pop",
                          i < 4
                            ? "bg-[#1b8fe6] text-white dark:bg-ciano dark:text-noite"
                            : i === 4
                              ? "border-[3px] border-dashed border-[#1b8fe6] dark:border-ciano"
                              : "bg-[#e6eef5] dark:bg-line",
                        )}
                      >
                        {i < 4 && <Check aria-hidden className="size-5" strokeWidth={3} />}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted">Perdeu um dia? A sequência congela em vez de zerar. Sem punição.</p>
              </Card.Content>
            </Card>
          </Revelar>

          <Revelar className="flex" atraso={150}>
            <Card className={cx(CARTAO_JOGO, "w-full gap-4 p-6")}>
              <Card.Header className="flex-row items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#fff8dc] text-[#f5b301] dark:bg-tint-purple">
                  <Zap aria-hidden className="size-7 animate-faiscar" fill="currentColor" />
                </span>
                <div>
                  <Card.Title className="text-xl font-extrabold">Seu nível de líder</Card.Title>
                  <Card.Description className="text-muted">A cada 500 XP você sobe um nível.</Card.Description>
                </div>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3">
                <ProgressBar aria-label="XP até o nível 2 (exemplo)" value={200} minValue={0} maxValue={500}>
                  <div className="flex justify-between text-sm font-extrabold">
                    <span>Nível 1</span>
                    <span>200 / 500 XP</span>
                  </div>
                  <ProgressBar.Track className="h-4">
                    <ProgressBar.Fill className="group-data-[visivel=true]/rev:animate-encher" />
                  </ProgressBar.Track>
                </ProgressBar>
                <p className="text-sm text-muted">Diagnóstico +50 XP · Missão +40 XP · Desafio +60 XP</p>
              </Card.Content>
            </Card>
          </Revelar>
        </section>

        {/* Pilares */}
        <ul className="grid gap-5 sm:grid-cols-3">
          {PILARES.map(({ Icone, cor, titulo, texto, xp }, i) => (
            <Revelar key={titulo} como="li" atraso={i * 140} className="flex">
              <Card className={cx(CARTAO_JOGO, "group/cartao w-full gap-3 p-6 transition-transform hover:-translate-y-1")}>
                <Card.Header className="flex-row items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl text-white group-hover/cartao:animate-quicar" style={{ background: cor }}>
                    <Icone aria-hidden className="size-6" />
                  </span>
                  <Chip color="accent" variant="soft" size="sm">
                    <Chip.Label>{xp}</Chip.Label>
                  </Chip>
                </Card.Header>
                <Card.Content className="flex flex-col gap-1">
                  <Card.Title className="text-lg font-extrabold">{titulo}</Card.Title>
                  <Card.Description className="leading-relaxed text-muted">{texto}</Card.Description>
                </Card.Content>
              </Card>
            </Revelar>
          ))}
        </ul>

        <Revelar className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl font-extrabold">Pronto para a primeira fase?</h2>
          <Link href={destino} className={cx(buttonVariants({ variant: "primary", size: "lg" }), BOTAO_3D, "sm:max-w-sm")}>
            {rotuloCta}
          </Link>
        </Revelar>
      </main>
    </div>
  );
}
