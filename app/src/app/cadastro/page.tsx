"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, Button, Card, Chip, FieldError, Input, Label, ProgressBar, TextField, ToggleButton } from "@heroui/react";
import { ArrowLeft, Minus, Plus, Sparkles } from "lucide-react";
import { Balao, BOTAO_3D, CARTAO_JOGO, Clara } from "@/components/jogo";
import { TemaToggle } from "@/components/TemaToggle";
import { Aviso, cx } from "@/components/ui";
import { acoes } from "@/lib/estado";
import type { Perfil } from "@/lib/types";

const TIPOS_EQUIPE = ["Técnica", "Operacional", "Comercial", "Administrativa", "Atendimento", "Mista"];
const MODELOS = ["Presencial", "Híbrido", "Remoto"];
const DESAFIOS = [
  "Dar feedback",
  "Lidar com conflitos",
  "Liderar ex-colegas",
  "Delegar",
  "Priorizar demandas",
  "Manter a equipe motivada",
  "Bater metas",
  "Controlar a ansiedade",
];

const FASES = [
  { titulo: "Quem é você?", fala: "Oi! Eu sou a Clara e vou te ajudar a montar o seu perfil de líder. Para começar, como você se chama?" },
  { titulo: "Sua liderança", fala: "Conta como é a sua equipe. Assim eu adapto as missões ao seu dia a dia." },
  { titulo: "Seus desafios", fala: "Em que você quer evoluir primeiro? Pode marcar quantos quiser, ou pular." },
  { titulo: "Perfil pronto!", fala: "Pronto! Agora vem o diagnóstico: ele ajusta a sua trilha e rende +50 XP." },
];

const PERFIL_INICIAL: Perfil = {
  nome: "",
  cargo: "",
  setor: "",
  tipoEquipe: "Operacional",
  tamanhoEquipe: 8,
  mesesLideranca: 3,
  modeloTrabalho: "Presencial",
  desafios: [],
};

const CAMPO =
  "h-12 w-full rounded-2xl border-2 border-[#cfe9fb] bg-white px-4 text-base font-semibold text-[#14174f] placeholder:text-[#9bb0c2] data-[focus-visible=true]:border-[#1b8fe6] dark:border-line dark:bg-card dark:text-ink";

const OPCAO =
  "h-12 min-h-12 rounded-2xl border-2 border-[#cfe9fb] bg-white px-4 font-extrabold text-[#14174f] shadow-[0_3px_0_#cfe9fb] data-[selected=true]:border-[#1b8fe6] data-[selected=true]:bg-[#ddf1ff] data-[selected=true]:text-[#1470b8] data-[selected=true]:shadow-[0_3px_0_#1b8fe6] dark:border-line dark:bg-card dark:text-ink dark:shadow-[0_3px_0_#2a2f7a] dark:data-[selected=true]:border-ciano dark:data-[selected=true]:bg-selected dark:data-[selected=true]:text-ciano dark:data-[selected=true]:shadow-[0_3px_0_#61d6ff]";

function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function Contador({
  rotulo,
  unidade,
  valor,
  min,
  max,
  onChange,
}: {
  rotulo: string;
  unidade: (n: number) => string;
  valor: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-extrabold">{rotulo}</span>
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="secondary"
          aria-label={`Diminuir: ${rotulo}`}
          isDisabled={valor <= min}
          onPress={() => onChange(Math.max(min, valor - 1))}
          className="size-12 rounded-2xl"
        >
          <Minus aria-hidden className="size-5" />
        </Button>
        <p aria-live="polite" className="min-w-24 text-center">
          <span className="block text-3xl font-extrabold leading-none">{valor}</span>
          <span className="text-sm font-semibold text-muted">{unidade(valor)}</span>
        </p>
        <Button
          isIconOnly
          variant="secondary"
          aria-label={`Aumentar: ${rotulo}`}
          isDisabled={valor >= max}
          onPress={() => onChange(Math.min(max, valor + 1))}
          className="size-12 rounded-2xl"
        >
          <Plus aria-hidden className="size-5" />
        </Button>
      </div>
    </div>
  );
}

function Escolha({
  rotulo,
  opcoes,
  valor,
  onChange,
}: {
  rotulo: string;
  opcoes: string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-extrabold">{rotulo}</legend>
      <div className="flex flex-wrap gap-2.5">
        {opcoes.map((o) => (
          <ToggleButton key={o} isSelected={valor === o} onChange={() => onChange(o)} className={OPCAO}>
            {o}
          </ToggleButton>
        ))}
      </div>
    </fieldset>
  );
}

export default function Cadastro() {
  const router = useRouter();
  const [fase, setFase] = useState(0);
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_INICIAL);
  const [tentouAvancar, setTentouAvancar] = useState(false);

  const ultima = fase === FASES.length - 1;
  const obrigatorios = { nome: !!perfil.nome.trim(), cargo: !!perfil.cargo.trim(), setor: !!perfil.setor.trim() };
  const faseValida = fase !== 0 || (obrigatorios.nome && obrigatorios.cargo && obrigatorios.setor);

  function atualizar<K extends keyof Perfil>(chave: K, valor: Perfil[K]) {
    setPerfil((p) => ({ ...p, [chave]: valor }));
  }

  function alternarDesafio(d: string) {
    setPerfil((p) => ({ ...p, desafios: p.desafios.includes(d) ? p.desafios.filter((x) => x !== d) : [...p.desafios, d] }));
  }

  function voltar() {
    setTentouAvancar(false);
    if (fase === 0) router.push("/");
    else setFase((f) => f - 1);
  }

  function avancar(e: React.FormEvent) {
    e.preventDefault();
    if (!faseValida) {
      setTentouAvancar(true);
      return;
    }
    setTentouAvancar(false);
    if (!ultima) {
      setFase((f) => f + 1);
      return;
    }
    acoes.criarConta({
      ...perfil,
      nome: perfil.nome.trim(),
      cargo: perfil.cargo.trim(),
      setor: perfil.setor.trim(),
    });
    router.push("/diagnostico");
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-gradient-to-b from-[#eef9ff] to-white text-heading dark:from-[#11144a] dark:to-bg">
      <header className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 pt-5">
        <Button isIconOnly variant="ghost" aria-label={fase === 0 ? "Voltar ao início" : "Voltar à fase anterior"} onPress={voltar}>
          <ArrowLeft aria-hidden className="size-6" />
        </Button>
        <ProgressBar
          aria-label={`Fase ${fase + 1} de ${FASES.length}: ${FASES[fase].titulo}`}
          value={((fase + 1) / FASES.length) * 100}
          className="flex-1"
        >
          <ProgressBar.Track className="h-4">
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <TemaToggle className="text-heading hover:bg-white/60 dark:hover:bg-white/10" />
      </header>

      <form onSubmit={avancar} noValidate className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <main key={fase} className="flex flex-1 animate-entrar flex-col gap-6 px-5 py-6">
          <div className="flex items-end gap-3">
            <Clara largura={112} className="shrink-0" />
            <Balao cauda="esquerda" className="mb-6 flex-1">
              {FASES[fase].fala}
            </Balao>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#1b8fe6] dark:text-ciano">
              Fase {fase + 1} de {FASES.length}
            </span>
            <h1 className="text-3xl font-extrabold">{FASES[fase].titulo}</h1>
          </div>

          <Card className={cx(CARTAO_JOGO, "gap-6 p-6")}>
            {fase === 0 && (
              <div className="flex flex-col gap-5">
                <TextField
                  value={perfil.nome}
                  onChange={(v) => atualizar("nome", v)}
                  isInvalid={tentouAvancar && !obrigatorios.nome}
                  autoComplete="name"
                  autoFocus
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Nome</Label>
                  <Input className={CAMPO} placeholder="Como você gosta de ser chamado(a)" />
                  <FieldError>Conte o seu nome para continuar.</FieldError>
                </TextField>
                <TextField
                  value={perfil.cargo}
                  onChange={(v) => atualizar("cargo", v)}
                  isInvalid={tentouAvancar && !obrigatorios.cargo}
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Cargo</Label>
                  <Input className={CAMPO} placeholder="Ex.: Coordenador de Operações" />
                  <FieldError>Qual é o seu cargo hoje?</FieldError>
                </TextField>
                <TextField
                  value={perfil.setor}
                  onChange={(v) => atualizar("setor", v)}
                  isInvalid={tentouAvancar && !obrigatorios.setor}
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Setor / área</Label>
                  <Input className={CAMPO} placeholder="Ex.: Distribuição" />
                  <FieldError>Informe o seu setor.</FieldError>
                </TextField>
                <p className="text-sm text-muted">Usamos essas informações só para adaptar as missões. Nada é compartilhado com a sua empresa.</p>
              </div>
            )}

            {fase === 1 && (
              <div className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Contador
                    rotulo="Há quanto tempo lidera?"
                    unidade={(n) => (n === 1 ? "mês" : "meses")}
                    valor={perfil.mesesLideranca}
                    min={0}
                    max={240}
                    onChange={(n) => atualizar("mesesLideranca", n)}
                  />
                  <Contador
                    rotulo="Tamanho da equipe"
                    unidade={(n) => (n === 1 ? "pessoa" : "pessoas")}
                    valor={perfil.tamanhoEquipe}
                    min={1}
                    max={200}
                    onChange={(n) => atualizar("tamanhoEquipe", n)}
                  />
                </div>
                <Escolha rotulo="Tipo de equipe" opcoes={TIPOS_EQUIPE} valor={perfil.tipoEquipe} onChange={(v) => atualizar("tipoEquipe", v)} />
                <Escolha rotulo="Modelo de trabalho" opcoes={MODELOS} valor={perfil.modeloTrabalho} onChange={(v) => atualizar("modeloTrabalho", v)} />
              </div>
            )}

            {fase === 2 && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 font-extrabold">Seus principais desafios hoje (opcional)</legend>
                <div className="flex flex-wrap gap-2.5">
                  {DESAFIOS.map((d) => (
                    <ToggleButton key={d} isSelected={perfil.desafios.includes(d)} onChange={() => alternarDesafio(d)} className={OPCAO}>
                      {d}
                    </ToggleButton>
                  ))}
                </div>
              </fieldset>
            )}

            {fase === 3 && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 text-xl font-extrabold">
                    <Avatar.Fallback>{iniciais(perfil.nome)}</Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-extrabold">{perfil.nome.trim()}</p>
                    <p className="truncate text-muted">
                      {perfil.cargo.trim()} · {perfil.setor.trim()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip color="accent" variant="soft">
                    <Chip.Label>
                      {perfil.mesesLideranca} {perfil.mesesLideranca === 1 ? "mês" : "meses"} na liderança
                    </Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>
                      Equipe de {perfil.tamanhoEquipe} {perfil.tamanhoEquipe === 1 ? "pessoa" : "pessoas"}
                    </Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>{perfil.tipoEquipe}</Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>{perfil.modeloTrabalho}</Chip.Label>
                  </Chip>
                </div>
                {perfil.desafios.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-extrabold text-muted">Quer evoluir em</span>
                    <div className="flex flex-wrap gap-2">
                      {perfil.desafios.map((d) => (
                        <Chip key={d} variant="soft" color="default">
                          <Chip.Label>{d}</Chip.Label>
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {tentouAvancar && !faseValida && <Aviso>Preencha nome, cargo e setor para continuar.</Aviso>}
        </main>

        <footer className="sticky bottom-0 border-t-2 border-[#e3f1fb] bg-white/95 px-5 py-4 backdrop-blur dark:border-line dark:bg-bg/95">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span className="hidden items-center gap-2 text-sm font-extrabold text-muted sm:inline-flex">
              <Sparkles aria-hidden className="size-4 text-[#f5b301]" />
              {ultima ? "Próxima fase: diagnóstico (+50 XP)" : "Cada fase te deixa mais perto do diagnóstico"}
            </span>
            <Button type="submit" variant="primary" size="lg" className={cx(BOTAO_3D, "sm:w-auto sm:min-w-64")}>
              {ultima ? "Começar o diagnóstico" : fase === 2 && perfil.desafios.length === 0 ? "Pular" : "Continuar"}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
