"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, FieldError, Input, Label, TextField } from "@heroui/react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Balao, BOTAO_3D, CAMPO_JOGO, CARTAO_JOGO, ClaraClassica, LINK_TEXTO } from "@/components/jogo";
import { TemaToggle } from "@/components/TemaToggle";
import { Aviso, cx } from "@/components/ui";
import { ErroApi, authApi, perfilDoUsuario } from "@/lib/auth/cliente";
import { errosPorCampo, loginSchema } from "@/lib/cadastro";
import { acoes, hoje, lerEstadoAtual, proximaTela } from "@/lib/estado";

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const validacao = loginSchema.safeParse({ email, senha });
  const erros = tentou && !validacao.success ? errosPorCampo(validacao.error) : {};

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setErroGeral(null);
    if (!validacao.success) {
      setTentou(true);
      return;
    }
    setEnviando(true);
    try {
      const { usuario } = await authApi.login(validacao.data.email, validacao.data.senha);
      // Se a pessoa já fez o diagnóstico (em outro dispositivo), traz do banco para não repetir.
      const salvo = await authApi.ultimoDiagnostico().catch(() => null);
      acoes.entrar(
        perfilDoUsuario(usuario),
        usuario.id,
        salvo && { pontuacoes: salvo.pontuacoes, data: hoje(new Date(salvo.criadoEm)) },
        usuario.avatar,
      );
      const destino = proximaTela(lerEstadoAtual());
      // Veio de um QR code de sala: só volta para lá se a conta já passou pelo tour e pelo diagnóstico.
      const proximo = new URLSearchParams(window.location.search).get("proximo");
      router.push(destino === "/inicio" && proximo && /^\/comunidade\/sala\/\d{6}$/.test(proximo) ? proximo : destino);
    } catch (err) {
      setErroGeral(err instanceof ErroApi ? err.message : "Algo deu errado. Tente novamente.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-gradient-to-b from-[#eef9ff] to-white text-heading dark:from-[#11144a] dark:to-bg">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-5">
        <Button isIconOnly variant="ghost" aria-label="Voltar ao início" onPress={() => router.push("/")}>
          <ArrowLeft aria-hidden className="size-6" />
        </Button>
        <TemaToggle className="text-heading hover:bg-white/60 dark:hover:bg-white/10" />
      </header>

      <form onSubmit={enviar} noValidate className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <main className="flex flex-1 animate-entrar flex-col gap-6 px-5 py-6">
          <div className="flex items-end gap-3">
            <ClaraClassica largura={112} className="shrink-0" />
            <Balao cauda="esquerda" className="mb-6 flex-1">
              Que bom te ver de volta! Entre com o seu e-mail e a sua senha para continuar de onde parou.
            </Balao>
          </div>

          <h1 className="text-3xl font-extrabold">Entrar</h1>

          <Card className={cx(CARTAO_JOGO, "gap-5 p-6")}>
            <TextField
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setErroGeral(null);
              }}
              isInvalid={!!erros.email}
              autoComplete="email"
              autoFocus
              isRequired
              fullWidth
            >
              <Label className="font-extrabold">E-mail</Label>
              <Input className={CAMPO_JOGO} placeholder="voce@empresa.com" maxLength={254} />
              <FieldError>{erros.email}</FieldError>
            </TextField>

            <TextField
              type={verSenha ? "text" : "password"}
              value={senha}
              onChange={(v) => {
                setSenha(v);
                setErroGeral(null);
              }}
              isInvalid={!!erros.senha}
              autoComplete="current-password"
              isRequired
              fullWidth
            >
              <Label className="font-extrabold">Senha</Label>
              <div className="relative">
                <Input className={cx(CAMPO_JOGO, "pr-14")} maxLength={128} />
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

            {erroGeral && <Aviso>{erroGeral}</Aviso>}
          </Card>

          <p className="text-sm text-muted">
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className={LINK_TEXTO}>
              Criar meu perfil
            </Link>
          </p>
        </main>

        <footer className="sticky bottom-0 border-t-2 border-[#e3f1fb] bg-white/95 px-5 py-4 backdrop-blur dark:border-line dark:bg-bg/95">
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="lg" isDisabled={enviando} className={cx(BOTAO_3D, "sm:w-auto sm:min-w-64")}>
              {enviando ? "Entrando…" : "Entrar"}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
