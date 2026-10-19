"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, Button, Card, Chip, FieldError, Input, Label, ProgressBar, TextField, ToggleButton } from "@heroui/react";
import { ArrowLeft, Check, Eye, EyeOff, Minus, Plus, Sparkles } from "lucide-react";
import { Balao, BOTAO_3D, CAMPO_JOGO, CARTAO_JOGO, ClaraClassica, LINK_TEXTO, OPCAO_JOGO } from "@/components/jogo";
import { TemaToggle } from "@/components/TemaToggle";
import { Aviso, cx } from "@/components/ui";
import { ErroApi, authApi, perfilDoUsuario } from "@/lib/auth/cliente";
import { DESAFIOS, ETAPAS, MODELOS, TIPOS_EQUIPE, errosPorCampo, senhaNovaSchema } from "@/lib/cadastro";
import { acoes } from "@/lib/estado";

interface Formulario {
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  tipoEquipe: string;
  tamanhoEquipe: number;
  mesesLideranca: number;
  modeloTrabalho: string;
  desafios: string[];
}

const FASES = [
  { titulo: "Quem é você?", fala: "Oi! Eu sou a Clara e vou te ajudar a montar o seu perfil de líder. Para começar, como você se chama?" },
  { titulo: "Sua liderança", fala: "Conta como é a sua equipe. Assim eu adapto as missões ao seu dia a dia." },
  { titulo: "Seus desafios", fala: "Em que você quer evoluir primeiro? Pode marcar quantos quiser, ou pular." },
  { titulo: "Perfil pronto!", fala: "Falta só uma senha para guardar tudo. Depois é só entrar com o seu e-mail. O diagnóstico rende +50 XP!" },
];
const FASE_SENHA = FASES.length - 1;

const FORM_INICIAL: Formulario = {
  nome: "",
  email: "",
  cargo: "",
  setor: "",
  tipoEquipe: "Operacional",
  tamanhoEquipe: 8,
  mesesLideranca: 3,
  modeloTrabalho: "Presencial",
  desafios: [],
};

/** O pedaço do formulário que pertence a cada etapa (é o que vai para o banco ao avançar). */
function dadosDaEtapa(etapa: number, f: Formulario): unknown {
  if (etapa === 0) return { nome: f.nome, email: f.email, cargo: f.cargo, setor: f.setor };
  if (etapa === 1) {
    return { mesesLideranca: f.mesesLideranca, tamanhoEquipe: f.tamanhoEquipe, tipoEquipe: f.tipoEquipe, modeloTrabalho: f.modeloTrabalho };
  }
  return { desafios: f.desafios };
}

function errosDaFase(fase: number, f: Formulario, senha: string): Record<string, string> {
  if (fase === FASE_SENHA) {
    const r = senhaNovaSchema.safeParse(senha);
    return r.success ? {} : { senha: r.error.issues[0].message };
  }
  const r = ETAPAS[fase].safeParse(dadosDaEtapa(fase, f));
  return r.success ? {} : errosPorCampo(r.error);
}

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
  opcoes: readonly string[];
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 font-extrabold">{rotulo}</legend>
      <div className="flex flex-wrap gap-2.5">
        {opcoes.map((o) => (
          <ToggleButton key={o} isSelected={valor === o} onChange={() => onChange(o)} className={OPCAO_JOGO}>
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
  const [form, setForm] = useState<Formulario>(FORM_INICIAL);
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [status, setStatus] = useState<"ocioso" | "salvando" | "salvo">("ocioso");
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [errosServidor, setErrosServidor] = useState<Record<string, string>>({});

  // Retoma de onde parou: o progresso fica no banco, preso a um cookie deste navegador.
  useEffect(() => {
    let ativo = true;
    authApi
      .lerRascunho()
      .then((r) => {
        if (!ativo || !r) return;
        setForm((f) => ({ ...f, ...r.dados }));
        setFase(Math.min(r.fase, FASE_SENHA));
      })
      .catch(() => {}) // sem banco agora? o erro aparece ao tentar salvar
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const ocupado = carregando || status === "salvando";
  const errosLocais = errosDaFase(fase, form, senha);
  const erros = { ...(tentou ? errosLocais : {}), ...errosServidor };

  function atualizar<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
    setErrosServidor((antigos) => {
      const resto = { ...antigos };
      delete resto[chave];
      return resto;
    });
    setErroGeral(null);
    setStatus("ocioso");
  }

  function alternarDesafio(d: string) {
    atualizar("desafios", form.desafios.includes(d) ? form.desafios.filter((x) => x !== d) : [...form.desafios, d]);
  }

  function voltar() {
    setTentou(false);
    setErroGeral(null);
    setErrosServidor({});
    if (fase === 0) router.push("/");
    else setFase((f) => f - 1);
  }

  function tratarErro(e: unknown) {
    const erro = e instanceof ErroApi ? e : new ErroApi("Algo deu errado. Tente novamente.", 0);
    if (erro.codigo === "rascunho_expirado") {
      setFase(0);
      setSenha("");
    }
    if (erro.campos) setErrosServidor(erro.campos);
    setErroGeral(erro.message);
    setStatus("ocioso");
  }

  async function avancar(e: React.FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setErroGeral(null);
    if (Object.keys(errosLocais).length > 0) {
      setTentou(true);
      return;
    }
    setTentou(false);
    setStatus("salvando");
    try {
      if (fase < FASE_SENHA) {
        await authApi.salvarEtapa(fase, dadosDaEtapa(fase, form));
        setStatus("salvo");
        setFase(fase + 1);
      } else {
        const { usuario } = await authApi.concluir(senha);
        acoes.criarConta(perfilDoUsuario(usuario), usuario.id);
        router.push("/bem-vindo");
      }
    } catch (err) {
      tratarErro(err);
    }
  }

  const regrasSenha = [
    { ok: senha.length >= 8, rotulo: "8 ou mais caracteres" },
    { ok: /[A-Za-z]/.test(senha), rotulo: "uma letra" },
    { ok: /\d/.test(senha), rotulo: "um número" },
  ];

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
        <main
          key={fase}
          aria-busy={carregando}
          className={cx("flex flex-1 flex-col gap-6 px-5 py-6", carregando ? "opacity-0" : "animate-entrar")}
        >
          <div className="flex items-end gap-3">
            <ClaraClassica largura={112} className="shrink-0" />
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
                  value={form.nome}
                  onChange={(v) => atualizar("nome", v)}
                  isInvalid={!!erros.nome}
                  autoComplete="name"
                  autoFocus
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Nome</Label>
                  <Input className={CAMPO_JOGO} placeholder="Como você gosta de ser chamado(a)" maxLength={80} />
                  <FieldError>{erros.nome}</FieldError>
                </TextField>
                <TextField
                  type="email"
                  value={form.email}
                  onChange={(v) => atualizar("email", v)}
                  isInvalid={!!erros.email}
                  autoComplete="email"
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">E-mail</Label>
                  <Input className={CAMPO_JOGO} placeholder="voce@empresa.com" maxLength={254} />
                  <FieldError>{erros.email}</FieldError>
                </TextField>
                <TextField
                  value={form.cargo}
                  onChange={(v) => atualizar("cargo", v)}
                  isInvalid={!!erros.cargo}
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Cargo</Label>
                  <Input className={CAMPO_JOGO} placeholder="Ex.: Coordenador de Operações" maxLength={80} />
                  <FieldError>{erros.cargo}</FieldError>
                </TextField>
                <TextField
                  value={form.setor}
                  onChange={(v) => atualizar("setor", v)}
                  isInvalid={!!erros.setor}
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Setor / área</Label>
                  <Input className={CAMPO_JOGO} placeholder="Ex.: Distribuição" maxLength={80} />
                  <FieldError>{erros.setor}</FieldError>
                </TextField>
                <p className="text-sm text-muted">
                  Usamos essas informações só para adaptar as missões. Nada é compartilhado com a sua empresa.
                </p>
                <p className="text-sm text-muted">
                  Já tem conta?{" "}
                  <Link href="/entrar" className={LINK_TEXTO}>
                    Entrar
                  </Link>
                </p>
              </div>
            )}

            {fase === 1 && (
              <div className="flex flex-col gap-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Contador
                    rotulo="Há quanto tempo lidera?"
                    unidade={(n) => (n === 1 ? "mês" : "meses")}
                    valor={form.mesesLideranca}
                    min={0}
                    max={240}
                    onChange={(n) => atualizar("mesesLideranca", n)}
                  />
                  <Contador
                    rotulo="Tamanho da equipe"
                    unidade={(n) => (n === 1 ? "pessoa" : "pessoas")}
                    valor={form.tamanhoEquipe}
                    min={1}
                    max={200}
                    onChange={(n) => atualizar("tamanhoEquipe", n)}
                  />
                </div>
                <Escolha rotulo="Tipo de equipe" opcoes={TIPOS_EQUIPE} valor={form.tipoEquipe} onChange={(v) => atualizar("tipoEquipe", v)} />
                <Escolha rotulo="Modelo de trabalho" opcoes={MODELOS} valor={form.modeloTrabalho} onChange={(v) => atualizar("modeloTrabalho", v)} />
              </div>
            )}

            {fase === 2 && (
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 font-extrabold">Seus principais desafios hoje (opcional)</legend>
                <div className="flex flex-wrap gap-2.5">
                  {DESAFIOS.map((d) => (
                    <ToggleButton key={d} isSelected={form.desafios.includes(d)} onChange={() => alternarDesafio(d)} className={OPCAO_JOGO}>
                      {d}
                    </ToggleButton>
                  ))}
                </div>
              </fieldset>
            )}

            {fase === FASE_SENHA && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16 text-xl font-extrabold">
                    <Avatar.Fallback>{iniciais(form.nome)}</Avatar.Fallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-extrabold">{form.nome.trim()}</p>
                    <p className="truncate text-muted">
                      {form.cargo.trim()} · {form.setor.trim()}
                    </p>
                    <p className="truncate text-sm text-muted">{form.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Chip color="accent" variant="soft">
                    <Chip.Label>
                      {form.mesesLideranca} {form.mesesLideranca === 1 ? "mês" : "meses"} na liderança
                    </Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>
                      Equipe de {form.tamanhoEquipe} {form.tamanhoEquipe === 1 ? "pessoa" : "pessoas"}
                    </Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>{form.tipoEquipe}</Chip.Label>
                  </Chip>
                  <Chip color="accent" variant="soft">
                    <Chip.Label>{form.modeloTrabalho}</Chip.Label>
                  </Chip>
                  {form.desafios.map((d) => (
                    <Chip key={d} variant="soft" color="default">
                      <Chip.Label>{d}</Chip.Label>
                    </Chip>
                  ))}
                </div>

                <TextField
                  type={verSenha ? "text" : "password"}
                  value={senha}
                  onChange={(v) => {
                    setSenha(v);
                    setErroGeral(null);
                    setErrosServidor({});
                  }}
                  isInvalid={!!erros.senha}
                  autoComplete="new-password"
                  autoFocus
                  isRequired
                  fullWidth
                >
                  <Label className="font-extrabold">Crie uma senha</Label>
                  <div className="relative">
                    <Input className={cx(CAMPO_JOGO, "pr-14")} placeholder="Mínimo de 8 caracteres" maxLength={128} />
                    <Button
                      isIconOnly
                      variant="ghost"
                      aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                      onPress={() => setVerSenha((v) => !v)}
                      className="absolute right-1 top-1/2 size-10 -translate-y-1/2"
                    >
                      {verSenha ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
                    </Button>
                  </div>
                  <FieldError>{erros.senha}</FieldError>
                </TextField>
                <ul className="flex flex-wrap gap-2" aria-label="Requisitos da senha">
                  {regrasSenha.map((r) => (
                    <li
                      key={r.rotulo}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold transition-colors",
                        r.ok ? "bg-[#ddf1ff] text-[#1470b8] dark:bg-selected dark:text-ciano" : "bg-[#eef3f8] text-[#6b8fa8] dark:bg-line dark:text-muted",
                      )}
                    >
                      <Check aria-hidden className={cx("size-3.5 transition-opacity", r.ok ? "opacity-100" : "opacity-30")} strokeWidth={3} />
                      {r.rotulo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {erroGeral && (
            <div className="flex flex-col gap-2">
              <Aviso>{erroGeral}</Aviso>
              {errosServidor.email && (
                <Link href="/entrar" className={LINK_TEXTO}>
                  Entrar com a minha conta
                </Link>
              )}
            </div>
          )}
          {!erroGeral && tentou && Object.keys(errosLocais).length > 0 && (
            <Aviso>
              {fase === FASE_SENHA ? "Crie uma senha que atenda aos requisitos." : "Confira os campos destacados para continuar."}
            </Aviso>
          )}
        </main>

        <footer className="sticky bottom-0 border-t-2 border-[#e3f1fb] bg-white/95 px-5 py-4 backdrop-blur dark:border-line dark:bg-bg/95">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span role="status" className="inline-flex items-center gap-2 text-sm font-extrabold text-muted">
              {status === "salvo" ? (
                <>
                  <Check aria-hidden className="size-4 text-[#1b8fe6]" strokeWidth={3} /> Progresso salvo
                </>
              ) : status === "salvando" ? (
                <>
                  <Sparkles aria-hidden className="size-4 animate-girar text-[#f5b301]" /> {fase === FASE_SENHA ? "Criando sua conta…" : "Salvando…"}
                </>
              ) : (
                <>
                  <Sparkles aria-hidden className="size-4 text-[#f5b301]" /> Seu progresso é salvo a cada fase
                </>
              )}
            </span>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isDisabled={ocupado}
              className={cx(BOTAO_3D, "sm:w-auto sm:min-w-64")}
            >
              {fase === FASE_SENHA
                ? status === "salvando"
                  ? "Criando conta…"
                  : "Criar conta e começar"
                : fase === 2 && form.desafios.length === 0
                  ? "Pular"
                  : "Continuar"}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
