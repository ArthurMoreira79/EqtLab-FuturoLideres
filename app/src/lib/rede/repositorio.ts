import "server-only";
import { and, asc, desc, eq, ilike, ne, or } from "drizzle-orm";
import { obterDb, schema } from "@/lib/db";
import { lerAvatar } from "@/lib/avatar";
import type { AcaoRede, DetalheRede, GrupoRede, PessoaRede, ResumoRede } from "./contratos";

const { usuarios, equipes, equipeMembros, equipeMensagens } = schema;
const camposPessoa = { id: usuarios.id, nome: usuarios.nome, email: usuarios.email, cargo: usuarios.cargo, avatar: usuarios.avatar };
type LinhaPessoa = Omit<PessoaRede, "avatar"> & { avatar: unknown };
const pessoa = (p: LinhaPessoa): PessoaRede => ({ ...p, avatar: lerAvatar(p.avatar) });
export class ErroRede extends Error {
  constructor(readonly status: number, mensagem: string) { super(mensagem); }
}

export async function contaRede(usuarioId: string): Promise<PessoaRede> {
  const db = await obterDb();
  const [u] = await db.select(camposPessoa).from(usuarios).where(eq(usuarios.id, usuarioId));
  if (!u) throw new ErroRede(401, "Faça login para continuar.");
  return pessoa(u);
}

export async function buscarPessoas(usuarioId: string, busca: string): Promise<PessoaRede[]> {
  if (busca.length < 3) return [];
  const db = await obterDb();
  // Prefixo literal, sem transformar % e _ digitados em curingas SQL.
  const prefixo = busca.toLowerCase().replace(/[\\%_]/g, "\\$&");
  const linhas = await db.select(camposPessoa).from(usuarios)
    .where(and(ne(usuarios.id, usuarioId), ilike(usuarios.email, `${prefixo}%`)))
    .orderBy(asc(usuarios.email)).limit(8);
  return linhas.map(pessoa);
}

export async function listarRede(conta: PessoaRede): Promise<ResumoRede> {
  const db = await obterDb();
  const linhas = await db.select({ grupo: equipes, lider: camposPessoa }).from(equipes)
    .innerJoin(usuarios, eq(usuarios.id, equipes.donoId))
    .leftJoin(equipeMembros, and(eq(equipeMembros.equipeId, equipes.id), or(eq(equipeMembros.usuarioId, conta.id), eq(equipeMembros.email, conta.email))))
    .where(or(eq(equipes.donoId, conta.id), eq(equipeMembros.usuarioId, conta.id), eq(equipeMembros.email, conta.email)))
    .orderBy(asc(equipes.nome));
  const vinculos = await db.select().from(equipeMembros)
    .where(or(eq(equipeMembros.usuarioId, conta.id), eq(equipeMembros.email, conta.email)));
  const grupos: GrupoRede[] = [], convites: GrupoRede[] = [];
  let minhaEquipe: GrupoRede | null = null;
  for (const { grupo, lider } of linhas) {
    const g = { id: grupo.id, nome: grupo.nome, donoId: grupo.donoId, lider: pessoa(lider) };
    if (grupo.donoId === conta.id) { minhaEquipe = g; grupos.push(g); }
    else if (vinculos.some((v) => v.equipeId === grupo.id && v.status === "ativo" && v.usuarioId === conta.id)) grupos.push(g);
    else convites.push(g);
  }
  return { minhaEquipe, grupos, convites };
}

export async function autorizarGrupo(equipeId: string, conta: PessoaRede, somenteDono = false): Promise<GrupoRede> {
  const db = await obterDb();
  const [linha] = await db.select({ grupo: equipes, lider: camposPessoa }).from(equipes)
    .innerJoin(usuarios, eq(usuarios.id, equipes.donoId)).where(eq(equipes.id, equipeId));
  if (!linha) throw new ErroRede(404, "Grupo não encontrado.");
  if (linha.grupo.donoId !== conta.id) {
    const [vinculo] = await db.select({ id: equipeMembros.id }).from(equipeMembros)
      .where(and(eq(equipeMembros.equipeId, equipeId), eq(equipeMembros.usuarioId, conta.id), eq(equipeMembros.status, "ativo")));
    if (somenteDono || !vinculo) throw new ErroRede(403, "Você não tem acesso a este grupo.");
  }
  return { id: linha.grupo.id, nome: linha.grupo.nome, donoId: linha.grupo.donoId, lider: pessoa(linha.lider) };
}

export async function detalheGrupo(equipeId: string, conta: PessoaRede): Promise<DetalheRede> {
  const grupo = await autorizarGrupo(equipeId, conta);
  const db = await obterDb();
  const [membros, mensagens] = await Promise.all([
    db.select({ membro: equipeMembros, usuario: camposPessoa }).from(equipeMembros)
      .leftJoin(usuarios, eq(usuarios.id, equipeMembros.usuarioId))
      .where(eq(equipeMembros.equipeId, equipeId)).orderBy(asc(equipeMembros.criadoEm)),
    db.select({ mensagem: equipeMensagens, autor: camposPessoa }).from(equipeMensagens)
      .innerJoin(usuarios, eq(usuarios.id, equipeMensagens.autorId))
      .where(eq(equipeMensagens.equipeId, equipeId)).orderBy(desc(equipeMensagens.criadoEm), desc(equipeMensagens.id)).limit(100),
  ]);
  return {
    ...grupo,
    membros: membros.map(({ membro: m, usuario }) => ({
      id: m.id, usuarioId: m.usuarioId, nome: usuario?.nome ?? m.nome, email: m.email,
      funcao: m.funcao || usuario?.cargo || "", avatar: lerAvatar(usuario?.avatar), status: m.status,
      ultimo1on1: grupo.donoId === conta.id ? m.ultimo1on1 : null,
    })),
    mensagens: mensagens.reverse().map(({ mensagem: m, autor }) => ({ id: m.id, texto: m.texto, criadoEm: m.criadoEm.toISOString(), autor: pessoa(autor) })),
  };
}

export async function executarAcao(conta: PessoaRede, acao: AcaoRede): Promise<{ equipeId?: string }> {
  const db = await obterDb();
  if (acao.acao === "criar-equipe") {
    const [grupo] = await db.insert(equipes).values({ donoId: conta.id, nome: acao.nome })
      .onConflictDoUpdate({ target: equipes.donoId, set: { nome: acao.nome } }).returning();
    return { equipeId: grupo.id };
  }
  if (acao.acao === "adicionar-membro") {
    if (acao.email === conta.email) throw new ErroRede(400, "Você já é responsável por esta equipe.");
    return db.transaction(async (tx) => {
      await tx.insert(equipes).values({ donoId: conta.id, nome: `Equipe de ${conta.nome.split(" ")[0]}` }).onConflictDoNothing();
      const [grupo] = await tx.select().from(equipes).where(eq(equipes.donoId, conta.id));
      const [alvo] = await tx.select(camposPessoa).from(usuarios).where(eq(usuarios.email, acao.email));
      const [membro] = await tx.insert(equipeMembros).values({
        equipeId: grupo.id, email: acao.email, usuarioId: alvo?.id ?? null,
        nome: alvo?.nome ?? (acao.nome || acao.email), funcao: acao.funcao || alvo?.cargo || "",
        ultimo1on1: acao.ultimo1on1 ?? null,
      }).onConflictDoNothing().returning({ id: equipeMembros.id });
      if (!membro) throw new ErroRede(409, "Este e-mail já está na sua equipe.");
      return { equipeId: grupo.id };
    });
  }
  if (acao.acao === "aceitar-convite" || acao.acao === "recusar-convite") {
    const filtro = and(eq(equipeMembros.equipeId, acao.equipeId), eq(equipeMembros.email, conta.email), eq(equipeMembros.status, "pendente"));
    const alterados = acao.acao === "aceitar-convite"
      ? await db.update(equipeMembros).set({ status: "ativo", usuarioId: conta.id, nome: conta.nome }).where(filtro).returning({ id: equipeMembros.id })
      : await db.delete(equipeMembros).where(filtro).returning({ id: equipeMembros.id });
    if (!alterados.length) throw new ErroRede(404, "Convite não encontrado.");
    return { equipeId: acao.equipeId };
  }
  if (acao.acao === "remover-membro" || acao.acao === "atualizar-membro") {
    await autorizarGrupo(acao.equipeId, conta, true);
    const filtro = and(eq(equipeMembros.equipeId, acao.equipeId), eq(equipeMembros.id, acao.membroId));
    const alterados = acao.acao === "remover-membro"
      ? await db.delete(equipeMembros).where(filtro).returning({ id: equipeMembros.id })
      : await db.update(equipeMembros).set({ funcao: acao.funcao, ultimo1on1: acao.ultimo1on1 }).where(filtro).returning({ id: equipeMembros.id });
    if (!alterados.length) throw new ErroRede(404, "Pessoa não encontrada nesta equipe.");
    return { equipeId: acao.equipeId };
  }
  await autorizarGrupo(acao.equipeId, conta);
  await db.insert(equipeMensagens).values({ equipeId: acao.equipeId, autorId: conta.id, texto: acao.texto });
  return { equipeId: acao.equipeId };
}
