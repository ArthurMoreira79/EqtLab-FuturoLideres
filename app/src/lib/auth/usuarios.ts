import "server-only";
import { consultar } from "@/lib/db";
import { lerAvatar, type AvatarConfig } from "@/lib/avatar";
import type { DadosCadastro, UsuarioPublico } from "@/lib/cadastro";

export class EmailEmUso extends Error {}

interface LinhaUsuario {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  setor: string;
  tipo_equipe: string;
  tamanho_equipe: number;
  meses_lideranca: number;
  modelo_trabalho: string;
  desafios: string[];
  senha_hash: string;
  avatar: unknown;
  papel: string;
  criado_em: Date;
}

function publico(u: LinhaUsuario): UsuarioPublico {
  return {
    id: u.id,
    email: u.email,
    nome: u.nome,
    cargo: u.cargo,
    setor: u.setor,
    tipoEquipe: u.tipo_equipe as UsuarioPublico["tipoEquipe"],
    tamanhoEquipe: u.tamanho_equipe,
    mesesLideranca: u.meses_lideranca,
    modeloTrabalho: u.modelo_trabalho as UsuarioPublico["modeloTrabalho"],
    desafios: u.desafios as UsuarioPublico["desafios"],
    criadoEm: u.criado_em.toISOString(),
    avatar: lerAvatar(u.avatar),
    papel: u.papel === "admin" ? "admin" : "membro",
  };
}

export async function emailEmUsoPorConta(email: string): Promise<boolean> {
  const { rowCount } = await consultar("SELECT 1 FROM usuarios WHERE email = $1", [email]);
  return !!rowCount;
}

export async function buscarParaLogin(email: string): Promise<{ usuario: UsuarioPublico; senhaHash: string } | null> {
  const { rows } = await consultar<LinhaUsuario>("SELECT * FROM usuarios WHERE email = $1", [email]);
  return rows[0] ? { usuario: publico(rows[0]), senhaHash: rows[0].senha_hash } : null;
}

export async function buscarPorId(id: string): Promise<UsuarioPublico | null> {
  const { rows } = await consultar<LinhaUsuario>("SELECT * FROM usuarios WHERE id = $1", [id]);
  return rows[0] ? publico(rows[0]) : null;
}

export async function criarUsuario(d: DadosCadastro, senhaHash: string): Promise<UsuarioPublico> {
  try {
    const { rows } = await consultar<LinhaUsuario>(
      `INSERT INTO usuarios
         (email, nome, cargo, setor, tipo_equipe, tamanho_equipe, meses_lideranca, modelo_trabalho, desafios, senha_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [d.email, d.nome, d.cargo, d.setor, d.tipoEquipe, d.tamanhoEquipe, d.mesesLideranca, d.modeloTrabalho, d.desafios, senhaHash],
    );
    return publico(rows[0]);
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new EmailEmUso();
    throw e;
  }
}

export async function registrarLogin(id: string) {
  await consultar("UPDATE usuarios SET ultimo_login_em = now() WHERE id = $1", [id]);
}

export async function salvarAvatar(id: string, avatar: AvatarConfig) {
  await consultar("UPDATE usuarios SET avatar = $2::jsonb WHERE id = $1", [id, JSON.stringify(avatar)]);
}
