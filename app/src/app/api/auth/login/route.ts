import { NextResponse, type NextRequest } from "next/server";
import { loginSchema, mensagemDoErro } from "@/lib/cadastro";
import { conferirSenha, gastarTempoDeConferencia } from "@/lib/auth/senha";
import { criarSessao } from "@/lib/auth/sessao";
import { buscarParaLogin, registrarLogin } from "@/lib/auth/usuarios";
import { zerarLimite } from "@/lib/seguranca/limite";
import { aplicarLimite, comTratamento, ipDoCliente, lerJson, origemValida, respostaErro } from "@/lib/seguranca/http";

const JANELA = 15 * 60;

/** POST /api/auth/login — { email, senha } */
export function POST(req: NextRequest) {
  return comTratamento(async () => {
    if (!origemValida(req)) return respostaErro(403, "Origem não permitida.");

    const dados = loginSchema.safeParse(await lerJson(req));
    if (!dados.success) {
      return respostaErro(400, mensagemDoErro(dados.error));
    }
    const { email, senha } = dados.data;
    const ip = ipDoCliente(req);

    // Dois freios: por IP (varredura de várias contas) e por conta (força bruta distribuída).
    const chaveConta = `login:conta:${email}`;
    const bloqueio =
      (await aplicarLimite(`login:ip:${ip}`, 30, JANELA)) ?? (await aplicarLimite(chaveConta, 8, JANELA));
    if (bloqueio) return bloqueio;

    const achado = await buscarParaLogin(email);
    const confere = achado ? await conferirSenha(senha, achado.senhaHash) : (await gastarTempoDeConferencia(senha), false);
    if (!achado || !confere) {
      // Mesma mensagem nos dois casos: não revela se o e-mail tem conta.
      return respostaErro(401, "E-mail ou senha incorretos.");
    }

    await zerarLimite(chaveConta);
    await registrarLogin(achado.usuario.id);
    await criarSessao(achado.usuario.id, { ip, userAgent: req.headers.get("user-agent") });
    return NextResponse.json({ usuario: achado.usuario });
  });
}
