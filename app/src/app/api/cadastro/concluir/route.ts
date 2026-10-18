import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { cadastroCompletoSchema, mensagemDoErro, senhaNovaSchema } from "@/lib/cadastro";
import { COOKIE_RASCUNHO, apagarRascunho, idValido, obterRascunho } from "@/lib/auth/rascunho";
import { hashSenha } from "@/lib/auth/senha";
import { criarSessao } from "@/lib/auth/sessao";
import { EmailEmUso, criarUsuario } from "@/lib/auth/usuarios";
import { aplicarLimite, comTratamento, ipDoCliente, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

const corpoSchema = z.object({ senha: senhaNovaSchema }).strict();

/** POST { senha } — transforma o rascunho em conta, abre a sessão e apaga o rascunho. */
export function POST(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");
    const ip = ipDoCliente(req);
    const bloqueio = await aplicarLimite(`concluir:${ip}`, 10, 60 * 60);
    if (bloqueio) return bloqueio;

    const corpo = corpoSchema.safeParse(await lerJson(req));
    if (!corpo.success) {
      return respostaErro(400, mensagemDoErro(corpo.error), { campos: { senha: "inválida" } });
    }

    const loja = await cookies();
    const id = idValido(loja.get(COOKIE_RASCUNHO)?.value);
    const rascunho = id ? await obterRascunho(id) : null;
    if (!id || !rascunho) {
      return respostaErro(410, "Seu cadastro expirou. Vamos recomeçar?", { codigo: "rascunho_expirado" });
    }

    // Revalida tudo no servidor: o rascunho é só o que já passou pelas validações de cada fase.
    const completo = cadastroCompletoSchema.safeParse(rascunho.dados);
    if (!completo.success) {
      return respostaErro(409, "Faltam informações do seu perfil. Volte e complete as fases.", {
        codigo: "rascunho_incompleto",
      });
    }

    try {
      const usuario = await criarUsuario(completo.data, await hashSenha(corpo.data.senha));
      await apagarRascunho(id);
      loja.delete(COOKIE_RASCUNHO);
      await criarSessao(usuario.id, { ip, userAgent: req.headers.get("user-agent") });
      return NextResponse.json({ usuario }, { status: 201 });
    } catch (e) {
      if (e instanceof EmailEmUso) {
        return respostaErro(409, "Esse e-mail já tem conta. Entre com a sua senha.", { codigo: "email_em_uso" });
      }
      throw e;
    }
  });
}
