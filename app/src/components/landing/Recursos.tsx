"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { BadgeCheck, Bell, Check, Download, Gamepad2, Mic, Shirt, Sparkles, UserRound, Users, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Revelar } from "@/components/animacoes";
import { EscudosDeAreas } from "@/components/comunidade/EscudosDeAreas";
import { CARTAO_JOGO, Clara } from "@/components/jogo";
import { cx } from "@/components/ui";
import { AREAS_PADRAO } from "@/lib/areas";
import { AVATAR_PADRAO, CABELOS, trocarGenero, type AvatarConfig } from "@/lib/avatar";

// O editor de avatar traz a biblioteca de desenho: só carrega quando a pessoa chega nessa parte.
const AvatarEmblema = dynamic(() => import("@/components/AvatarEmblema").then((m) => m.AvatarEmblema), {
  ssr: false,
  loading: () => <span className="block size-[190px] rounded-full bg-[#e6eef5] dark:bg-line" />,
});

/** Entra pulando quando o bloco aparece na tela (use dentro de um `Revelar`). */
const ENTRA = "opacity-0 group-data-[visivel=true]/rev:animate-entrar";
const POP = "opacity-0 group-data-[visivel=true]/rev:animate-pop";
const atraso = (ms: number) => ({ animationDelay: `${ms}ms` });

function Bloco({
  Icone,
  cor,
  etiqueta,
  titulo,
  texto,
  itens,
  invertido,
  children,
}: {
  Icone: LucideIcon;
  cor: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  itens: string[];
  invertido?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Revelar como="section" className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={cx("flex flex-col gap-4", invertido && "lg:order-2")}>
        <span
          className="inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_3px_0_rgba(0,0,0,0.18)]"
          style={{ background: cor }}
        >
          <Icone aria-hidden className="size-4" /> {etiqueta}
        </span>
        <h3 className="text-3xl font-extrabold leading-tight sm:text-4xl">{titulo}</h3>
        <p className="text-lg leading-relaxed text-muted">{texto}</p>
        <ul className="flex flex-col gap-2.5">
          {itens.map((item, i) => (
            <li key={item} style={atraso(300 + i * 140)} className={cx("flex items-start gap-3 font-semibold", ENTRA)}>
              <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-white" style={{ background: cor }}>
                <Check className="size-3.5" strokeWidth={3.5} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className={cx("relative", invertido && "lg:order-1")}>{children}</div>
    </Revelar>
  );
}

/* ───────────── 1 · IA integrada ───────────── */

function MockChat() {
  return (
    <div className={cx(CARTAO_JOGO, "flex flex-col gap-3 p-5")}>
      <div className="flex items-center gap-3 border-b-2 border-[#e6eef5] pb-3 dark:border-line">
        <Clara pose="acenando" busto largura={46} className="rounded-full bg-[#ddf4ff] dark:bg-selected" />
        <div className="flex-1">
          <p className="font-extrabold">Clara</p>
          <p className="text-xs font-bold text-muted">Sua mentora com IA</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#16a34a]">
          <span aria-hidden className="size-2.5 animate-pulsar rounded-full bg-[#22c55e]" /> online
        </span>
      </div>
      <p style={atraso(500)} className={cx("max-w-[85%] self-end rounded-2xl rounded-br-sm bg-[#1b8fe6] px-4 py-2.5 font-semibold text-white", ENTRA)}>
        Meu liderado reagiu mal ao feedback. E agora?
      </p>
      <p
        aria-hidden
        style={atraso(1300)}
        className="flex w-16 animate-digitando items-center justify-center gap-1 self-start overflow-hidden rounded-2xl rounded-bl-sm bg-[#eef3f8] py-3 dark:bg-sunken"
      >
        {[0, 160, 320].map((d) => (
          <span key={d} className="size-2 animate-pontos rounded-full bg-[#1b8fe6]" style={atraso(d)} />
        ))}
      </p>
      <p style={atraso(3000)} className={cx("max-w-[92%] self-start rounded-2xl rounded-bl-sm bg-[#eef3f8] px-4 py-2.5 font-semibold dark:bg-sunken", ENTRA)}>
        Calma, isso é comum! Comece pelos fatos: <strong>Situação, Comportamento e Impacto</strong>. Quer treinar a frase comigo?
      </p>
      <div style={atraso(3600)} className={cx("mt-1 flex items-center gap-2", ENTRA)}>
        <span className="flex-1 rounded-2xl border-2 border-[#cfe9fb] px-4 py-2.5 text-sm font-semibold text-[#8aa4b8] dark:border-line dark:text-muted">Escreva ou fale com a Clara…</span>
        <span className="grid size-11 animate-pulsar place-items-center rounded-2xl bg-[#1b8fe6] text-white shadow-[0_3px_0_#1470b8]">
          <Mic aria-hidden className="size-5" />
        </span>
      </div>
    </div>
  );
}

/* ───────────── 2 · Reuniões ───────────── */

function MockReunioes() {
  const salas = [
    { cor: "#1b8fe6", Icone: Video, via: "Google Meet", nome: "Daily do Comercial", area: "Comercial" },
    { cor: "#16a34a", Icone: Users, via: "Microsoft Teams", nome: "Reunião de Vendas", area: "Vendas" },
  ];
  return (
    <div className="flex flex-col gap-4">
      {salas.map((s, i) => (
        <div
          key={s.nome}
          style={{ ...atraso(250 + i * 250), borderColor: `color-mix(in srgb, ${s.cor} 55%, var(--line))` }}
          className={cx(CARTAO_JOGO, "flex flex-wrap items-center gap-4 p-4", ENTRA)}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_3px_0_rgba(0,0,0,0.2)]" style={{ background: s.cor }}>
            <s.Icone aria-hidden className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted">
              Reunião da área · {s.via}
            </p>
            <p className="truncate text-lg font-extrabold leading-tight">{s.nome}</p>
          </div>
          <span className={cx("inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_rgba(0,0,0,0.22)]", i === 0 && "animate-pulsar")} style={{ background: s.cor }}>
            Entrar
          </span>
        </div>
      ))}
      <p style={atraso(900)} className={cx("flex items-center gap-2 self-start rounded-full bg-[#fff8dc] px-4 py-2 text-sm font-extrabold text-[#8a6100] dark:bg-tint-purple dark:text-ciano", POP)}>
        <Bell aria-hidden className="size-4 animate-balancar" /> Um clique e você está na sala da sua área
      </p>
    </div>
  );
}

/* ───────────── 3 · Comunidade por área ───────────── */

const TOPICOS: Record<string, string[]> = {
  comercial: ["Cliente reclamou do prazo na frente do time. E agora?", "Como alinhar metas com o time de vendas?"],
  vendas: ["Liderado reage mal a qualquer crítica. Por onde começo?", "A meta do mês está longe e o time se compara demais."],
  marketing: ["Como dar feedback sobre uma campanha sem desanimar?", "Dois criativos discordam do rumo. Como mediar?"],
  operarios: ["Troca de plantão virou briga. Como resolver?", "Como falar de segurança sem soar como bronca?"],
};

function MockComunidade() {
  const [slug, setSlug] = useState(AREAS_PADRAO[0].slug);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual) return;
    const t = setInterval(() => setSlug((atual) => AREAS_PADRAO[(AREAS_PADRAO.findIndex((a) => a.slug === atual) + 1) % AREAS_PADRAO.length].slug), 2600);
    return () => clearInterval(t);
  }, [manual]);

  const area = AREAS_PADRAO.find((a) => a.slug === slug)!;
  return (
    <div className={cx(CARTAO_JOGO, "flex flex-col gap-3 p-4 sm:p-5")}>
      <EscudosDeAreas
        areas={AREAS_PADRAO}
        selecionada={slug}
        aoEscolher={(s) => {
          setManual(true);
          setSlug(s);
        }}
      />
      <ul key={slug} className="flex flex-col gap-2.5">
        {TOPICOS[slug].map((t, i) => (
          <li
            key={t}
            style={{ ...atraso(i * 120), borderLeftColor: area.cor }}
            className="animate-entrar rounded-2xl border-2 border-l-8 border-[#e6eef5] bg-white p-3.5 font-bold dark:border-line dark:bg-sunken"
          >
            {t}
            <span className="mt-1 block text-xs font-semibold text-muted">{i === 0 ? "Anônimo · sem resposta · há 5 h" : "Ana P. · 2 respostas · ontem"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── 4 · Rede de equipes ───────────── */

const PESSOAS = [
  { nome: "Ana", cor: "#a455ee", x: 14, y: 20 },
  { nome: "Bruno", cor: "#1b8fe6", x: 80, y: 14 },
  { nome: "Carla", cor: "#ff8a00", x: 90, y: 62 },
  { nome: "Davi", cor: "#16a34a", x: 52, y: 88 },
  { nome: "Elisa", cor: "#ec4899", x: 8, y: 66 },
];

function MockRede() {
  return (
    <div className={cx(CARTAO_JOGO, "relative h-[340px] overflow-hidden")}>
      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
        {PESSOAS.map((p, i) => (
          <line
            key={p.nome}
            x1="50" y1="50" x2={p.x} y2={p.y}
            stroke={p.cor} strokeWidth="0.6" strokeDasharray="2 2" strokeLinecap="round"
            className="opacity-0 group-data-[visivel=true]/rev:animate-entrar"
            style={atraso(400 + i * 200)}
          />
        ))}
      </svg>
      <span className="absolute left-1/2 top-1/2 z-10 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#1b8fe6] text-white shadow-[0_6px_0_#1470b8] animate-pulsar">
        <span className="flex flex-col items-center text-xs font-extrabold leading-tight">
          <Users aria-hidden className="size-7" /> Sua equipe
        </span>
      </span>
      {PESSOAS.map((p, i) => (
        <span key={p.nome} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          <span style={atraso(500 + i * 200)} className={cx("block", POP)}>
            <span className="flex animate-flutuar flex-col items-center gap-1" style={{ animationDelay: `${-i * 700}ms`, animationDuration: `${4 + i * 0.5}s` }}>
              <span className="grid size-14 place-items-center rounded-full border-4 border-white text-lg font-extrabold text-white shadow-[0_5px_0_rgba(0,0,0,0.18)] dark:border-card" style={{ background: p.cor }}>
                {p.nome[0]}
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold dark:bg-sunken">{p.nome}</span>
            </span>
          </span>
        </span>
      ))}
      <span style={atraso(1700)} className={cx("absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1.5 text-xs font-extrabold text-[#15803d]", POP)}>
        <BadgeCheck aria-hidden className="size-4" /> Convite aceito
      </span>
      <span style={atraso(2000)} className={cx("absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#fff8dc] px-3 py-1.5 text-xs font-extrabold text-[#8a6100] dark:bg-tint-purple dark:text-ciano", POP)}>
        Último 1:1 · há 3 dias
      </span>
    </div>
  );
}

/* ───────────── 5 · Sala de jogos ───────────── */

function MockSala() {
  const [seg, setSeg] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setSeg((s) => (s <= 1 ? 45 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const pessoas = [
    { n: "A", cor: "#a455ee", pos: "left-3 top-14" },
    { n: "B", cor: "#1b8fe6", pos: "right-4 top-10" },
    { n: "C", cor: "#ff8a00", pos: "left-6 bottom-28" },
    { n: "D", cor: "#16a34a", pos: "right-3 bottom-32" },
  ];
  return (
    <div className={cx(CARTAO_JOGO, "relative flex flex-col items-center gap-3 overflow-hidden p-5")}>
      <div className="flex w-full items-center justify-between">
        <span className="rounded-full bg-[#16a34a] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">Vendas</span>
        <span className="text-sm font-extrabold">Quiz de feedback</span>
      </div>
      {pessoas.map((p, i) => (
        <span key={p.n} className={cx("absolute z-0", p.pos)}>
          <span style={atraso(500 + i * 180)} className={POP}>
            <span className="grid size-12 animate-flutuar place-items-center rounded-full border-4 border-white font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] dark:border-card" style={{ background: p.cor, animationDelay: `${-i * 900}ms` }}>
              {p.n}
            </span>
          </span>
        </span>
      ))}
      <div className="relative z-10 flex flex-col items-center gap-2 rounded-3xl border-2 border-[#e6eef5] bg-white p-3 dark:border-line dark:bg-card">
        <span className="rounded-xl bg-white p-1.5">
          <QRCodeSVG value="https://conecta.lideres/sala/482913" size={104} level="M" bgColor="#ffffff" fgColor="#0b0d33" title="Exemplo de QR code de sala" />
        </span>
        <p className="text-2xl font-extrabold tracking-[0.16em]">482 913</p>
        <p className="rounded-xl bg-tint-cyan px-4 py-1 text-center text-tint-cyan-ink">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider">Começa em</span>
          <span key={seg} className="block animate-tique text-2xl font-extrabold tabular-nums leading-none">
            0:{String(seg).padStart(2, "0")}
          </span>
        </p>
      </div>
      <div className="flex items-end gap-2 pt-1" aria-label="Exemplo de pódio">
        {[
          { h: 48, c: "linear-gradient(180deg,#cfd8e3,#98a6b8)", t: "2", d: 900 },
          { h: 72, c: "linear-gradient(180deg,#ffe27a,#f5b301)", t: "1", d: 1300 },
          { h: 36, c: "linear-gradient(180deg,#f0b27a,#c47a3a)", t: "3", d: 500 },
        ].map((c) => (
          <span
            key={c.t}
            style={{ height: c.h, background: c.c, animationDelay: `${c.d}ms` }}
            className="grid w-16 origin-bottom place-items-start rounded-t-xl pt-1 text-center font-display text-2xl font-extrabold italic text-white opacity-0 group-data-[visivel=true]/rev:animate-coluna"
          >
            {c.t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────────── 6 · Avatar ───────────── */

const AVATARES: AvatarConfig[] = [
  AVATAR_PADRAO,
  { ...trocarGenero(AVATAR_PADRAO, "feminino"), corDoCabelo: "a55728", pele: "d08b5b", corDaRoupa: "ff488e", fundo: "ffd5dc", oculos: "round", boca: "twinkle" },
  { ...AVATAR_PADRAO, cabelo: CABELOS.masculino[1], barba: "beardLight", pele: "ae5d29", corDaRoupa: "25557c", fundo: "c9f2c7", oculos: "wayfarers" },
  { ...trocarGenero(AVATAR_PADRAO, "feminino"), corDoCabelo: "c93305", pele: "ffdbb4", corDaRoupa: "a7ffc4", fundo: "c0aede", olhos: "happy" },
];

function MockAvatar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % AVATARES.length), 2000);
    return () => clearInterval(t);
  }, []);
  const chips = [
    { Icone: Sparkles, t: "Cabelo", pos: "left-0 top-6" },
    { Icone: Shirt, t: "Roupa", pos: "right-0 top-16" },
    { Icone: UserRound, t: "Óculos", pos: "left-2 bottom-20" },
    { Icone: Download, t: "Baixar PNG", pos: "right-0 bottom-8" },
  ];
  return (
    <div className={cx(CARTAO_JOGO, "relative grid h-[340px] place-items-center overflow-hidden")}>
      <span aria-hidden className="absolute size-72 animate-girar rounded-full border-4 border-dashed border-[#cfe9fb] dark:border-line" />
      <span key={i} className="animate-pop overflow-hidden rounded-full ring-8 ring-[#ddf4ff] dark:ring-selected">
        <AvatarEmblema avatar={AVATARES[i]} tamanho={190} />
      </span>
      {chips.map((c, k) => (
        <span key={c.t} className={cx("absolute", c.pos)}>
          <span style={atraso(500 + k * 200)} className={POP}>
            <span className="inline-flex animate-quicar items-center gap-1.5 rounded-full border-2 border-[#cfe9fb] bg-white px-3 py-1.5 text-xs font-extrabold dark:border-line dark:bg-sunken" style={{ animationDelay: `${k * 300}ms` }}>
              <c.Icone aria-hidden className="size-3.5 text-[#1b8fe6]" /> {c.t}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

/* ───────────── Seção ───────────── */

export function Recursos() {
  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <Bloco
        Icone={Sparkles}
        cor="#a455ee"
        etiqueta="IA integrada"
        titulo="Uma mentora com IA que acompanha o seu dia"
        texto="A Clara conversa com você por texto ou voz, analisa as suas respostas nas missões e mostra onde você acertou e como melhorar."
        itens={["Feedback imediato nas missões e desafios", "Chat com a Clara para qualquer situação de liderança", "Relatório do seu momento como líder"]}
      >
        <MockChat />
      </Bloco>

      <Bloco
        Icone={Video}
        cor="#1b8fe6"
        etiqueta="Reuniões"
        titulo="A reunião do seu time a um clique"
        texto="Cada área da empresa tem a sua sala fixa no Google Meet ou no Microsoft Teams, bem no topo da comunidade."
        itens={["Link da reunião sempre à vista", "Abre em outra aba, sem perder a trilha", "Uma sala para cada área"]}
        invertido
      >
        <MockReunioes />
      </Bloco>

      <Bloco
        Icone={Users}
        cor="#00a3a3"
        etiqueta="Comunidade"
        titulo="Um fórum para cada área da empresa"
        texto="Comercial, Vendas, Marketing e Operários têm o seu próprio espaço. Troque experiências com quem vive a mesma rotina que você."
        itens={["Perguntas anônimas para temas sensíveis", "Melhor resposta e respostas da IA", "Clique num escudo para trocar de área"]}
      >
        <MockComunidade />
      </Bloco>

      <Bloco
        Icone={Users}
        cor="#ec4899"
        etiqueta="Rede de equipes"
        titulo="Monte a sua rede e lidere junto"
        texto="Convide colegas pelo e-mail, forme grupos e acompanhe como está cada pessoa da equipe, tudo salvo na sua conta."
        itens={["Convites que cada pessoa aceita", "Grupo privado para conversar", "Registro do último 1:1"]}
        invertido
      >
        <MockRede />
      </Bloco>

      <Bloco
        Icone={Gamepad2}
        cor="#16a34a"
        etiqueta="Sala de jogos"
        titulo="Quiz ao vivo com a sua equipe"
        texto="O administrador cria a sala e as perguntas. Todo mundo entra pelo código de 6 dígitos ou pelo QR code, e o ranking sai no final."
        itens={["Lobby com balões, QR code e contagem regressiva", "Respostas com tempo, placar a cada pergunta", "Pódio com 1º, 2º e 3º lugares"]}
      >
        <MockSala />
      </Bloco>

      <Bloco
        Icone={UserRound}
        cor="#f59e0b"
        etiqueta="Seu avatar"
        titulo="Crie o seu boneco de líder"
        texto="Monte um avatar masculino ou feminino, com cabelo, roupa e óculos do seu jeito. Ele vira o emblema do seu perfil."
        itens={["Mais de 30 peças para combinar", "Aparece no seu perfil e nas salas de jogo", "Baixe em PNG para usar de foto"]}
        invertido
      >
        <MockAvatar />
      </Bloco>
    </div>
  );
}
