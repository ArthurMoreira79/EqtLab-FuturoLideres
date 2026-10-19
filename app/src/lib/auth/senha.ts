import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Hash de senha com scrypt (nativo do Node, sem dependências com build).
 * Formato guardado: scrypt$N$r$p$salt(base64)$hash(base64) — os parâmetros ficam junto do hash,
 * então dá para aumentar o custo no futuro sem invalidar as senhas antigas.
 */
const N = 16_384;
const R = 8;
const P = 1;
const TAMANHO = 64;

function derivar(senha: string, salt: Buffer, opcoes: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, TAMANHO, opcoes, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derivar(senha, salt, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [tipo, n, r, p, salt, hash] = guardado.split("$");
  if (tipo !== "scrypt" || !n || !r || !p || !salt || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const obtido = await derivar(senha, Buffer.from(salt, "base64"), { N: Number(n), r: Number(r), p: Number(p) });
  return obtido.length === esperado.length && timingSafeEqual(obtido, esperado);
}

let falso: Promise<string> | undefined;

/**
 * Compara contra um hash descartável quando o e-mail não existe, para que “usuário inexistente”
 * e “senha errada” demorem o mesmo tempo (evita descobrir quais e-mails têm conta).
 */
export async function gastarTempoDeConferencia(senha: string): Promise<void> {
  falso ??= hashSenha("senha-descartavel-para-igualar-o-tempo");
  await conferirSenha(senha, await falso);
}
