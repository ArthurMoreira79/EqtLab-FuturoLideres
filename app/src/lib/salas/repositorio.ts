import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, gt } from "drizzle-orm";
import { lerAvatar } from "@/lib/avatar";
import { obterDb, schema } from "@/lib/db";
import {
  calcularFase,
  GRACA_MS,
  type EstadoSala,
  type LinhaRanking,
  type ParticipanteSala,
  type SalaNova,
} from "./contratos";

const { areas, salas, salaPerguntas, salaParticipantes, salaRespostas, usuarios } = schema;

export class ErroSala extends Error {
  constructor(
    readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

interface PerguntaSala {
  id: string;
  enunciado: string;
  alternativas: string[];
  correta: number;
  tempoSegundos: number;
}

// As perguntas de uma sala nunca mudam depois de criadas: evita reler a cada “batida” de quem está jogando.
const cachePerguntas = new Map<string, PerguntaSala[]>();

async function perguntasDa(salaId: string): Promise<PerguntaSala[]> {
  const guardado = cachePerguntas.get(salaId);
  if (guardado) return guardado;
  const db = await obterDb();
  const linhas = await db
    .select({
      id: salaPerguntas.id,
      enunciado: salaPerguntas.enunciado,
      alternativas: salaPerguntas.alternativas,
      correta: salaPerguntas.correta,
      tempoSegundos: salaPerguntas.tempoSegundos,
    })
    .from(salaPerguntas)
    .where(eq(salaPerguntas.salaId, salaId))
    .orderBy(asc(salaPerguntas.ordem));
  if (cachePerguntas.size > 100) cachePerguntas.clear();
  cachePerguntas.set(salaId, linhas);
  return linhas;
}

export async function papelDe(usuarioId: string): Promise<"membro" | "admin"> {
  const db = await obterDb();
  const [u] = await db.select({ papel: usuarios.papel }).from(usuarios).where(eq(usuarios.id, usuarioId));
  return u?.papel === "admin" ? "admin" : "membro";
}

async function buscarSala(codigo: string) {
  const db = await obterDb();
  const [sala] = await db
    .select({
      id: salas.id,
      codigo: salas.codigo,
      titulo: salas.titulo,
      criadorId: salas.criadorId,
      contagemSegundos: salas.contagemSegundos,
      inicioEm: salas.inicioEm,
      area: { slug: areas.slug, nome: areas.nome, cor: areas.cor },
    })
    .from(salas)
    .innerJoin(areas, eq(areas.id, salas.areaId))
    .where(eq(salas.codigo, codigo));
  if (!sala) throw new ErroSala(404, "Não achamos uma sala com esse código. Confira os 6 dígitos.");
  return sala;
}

export async function criarSala(usuarioId: string, dados: SalaNova): Promise<{ codigo: string }> {
  if ((await papelDe(usuarioId)) !== "admin") throw new ErroSala(403, "Só administradores podem criar salas.");
  const db = await obterDb();
  const [area] = await db
    .select({ id: areas.id })
    .from(areas)
    .where(and(eq(areas.slug, dados.area), eq(areas.ativa, true)));
  if (!area) throw new ErroSala(400, "Essa área não existe.");

  const inicioEm = new Date(Date.now() + dados.contagemSegundos * 1000);
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const codigo = String(randomInt(100_000, 1_000_000));
    try {
      await db.transaction(async (tx) => {
        const [sala] = await tx
          .insert(salas)
          .values({ codigo, areaId: area.id, criadorId: usuarioId, titulo: dados.titulo, contagemSegundos: dados.contagemSegundos, inicioEm })
          .returning({ id: salas.id });
        await tx.insert(salaPerguntas).values(
          dados.perguntas.map((p, ordem) => ({
            salaId: sala.id,
            ordem,
            enunciado: p.enunciado,
            alternativas: p.alternativas,
            correta: p.correta,
            tempoSegundos: p.tempoSegundos,
          })),
        );
      });
      return { codigo };
    } catch (e) {
      if ((e as { code?: string }).code === "23505") continue; // código já usado: sorteia outro
      throw e;
    }
  }
  throw new ErroSala(503, "Não conseguimos gerar um código agora. Tente de novo.");
}

export async function entrarNaSala(codigo: string, usuarioId: string): Promise<{ codigo: string }> {
  const sala = await buscarSala(codigo);
  if (sala.criadorId === usuarioId) return { codigo };
  const db = await obterDb();
  const [ja] = await db
    .select({ id: salaParticipantes.usuarioId })
    .from(salaParticipantes)
    .where(and(eq(salaParticipantes.salaId, sala.id), eq(salaParticipantes.usuarioId, usuarioId)));
  if (!ja) {
    if (Date.now() >= sala.inicioEm.getTime()) throw new ErroSala(409, "Essa sala já começou. Peça um novo código ao anfitrião.");
    await db.insert(salaParticipantes).values({ salaId: sala.id, usuarioId }).onConflictDoNothing();
  }
  return { codigo };
}

const ANTECEDENCIA_INICIO_MS = 3_000;

/** Anfitrião: encerra a contagem e começa em 3 segundos (para dar tempo de ver o “3, 2, 1”). */
export async function iniciarAgora(codigo: string, usuarioId: string) {
  const sala = await buscarSala(codigo);
  if (sala.criadorId !== usuarioId) throw new ErroSala(403, "Só quem criou a sala pode iniciá-la.");
  const novo = new Date(Date.now() + ANTECEDENCIA_INICIO_MS);
  if (sala.inicioEm.getTime() <= novo.getTime()) return; // já vai começar (ou começou)
  const db = await obterDb();
  await db.update(salas).set({ inicioEm: novo }).where(and(eq(salas.id, sala.id), gt(salas.inicioEm, novo)));
}

export async function responder(codigo: string, usuarioId: string, alternativa: number) {
  const sala = await buscarSala(codigo);
  if (sala.criadorId === usuarioId) throw new ErroSala(403, "O anfitrião acompanha a sala, mas não responde.");
  const db = await obterDb();
  const [participante] = await db
    .select({ id: salaParticipantes.usuarioId })
    .from(salaParticipantes)
    .where(and(eq(salaParticipantes.salaId, sala.id), eq(salaParticipantes.usuarioId, usuarioId)));
  if (!participante) throw new ErroSala(403, "Entre na sala com o código antes de responder.");

  const perguntas = await perguntasDa(sala.id);
  const agora = Date.now();
  const inicioEm = sala.inicioEm.getTime();
  const temposS = perguntas.map((p) => p.tempoSegundos);
  let etapa = calcularFase(inicioEm, temposS, agora);
  // Tolerância de rede só para o FIM da pergunta (quem clicou no último instante); o início não muda.
  if (etapa.fase === "revelacao" && agora - etapa.inicioDaFaseEm <= GRACA_MS) etapa = calcularFase(inicioEm, temposS, agora - GRACA_MS);
  if (etapa.fase === "lobby") throw new ErroSala(409, "A sala ainda não começou.");
  if (etapa.fase !== "pergunta") throw new ErroSala(409, "O tempo dessa pergunta acabou.");
  const pergunta = perguntas[etapa.indice];
  if (alternativa >= pergunta.alternativas.length) throw new ErroSala(400, "Essa alternativa não existe.");

  const tempoMs = Math.min(Math.max(agora - etapa.inicioDaFaseEm, 0), pergunta.tempoSegundos * 1000);
  const gravadas = await db
    .insert(salaRespostas)
    .values({ perguntaId: pergunta.id, usuarioId, salaId: sala.id, alternativa, correta: alternativa === pergunta.correta, tempoMs })
    .onConflictDoNothing()
    .returning({ id: salaRespostas.perguntaId });
  if (gravadas.length === 0) throw new ErroSala(409, "Você já respondeu essa pergunta.");
}

export async function estadoDaSala(codigo: string, usuarioId: string): Promise<EstadoSala> {
  const sala = await buscarSala(codigo);
  const db = await obterDb();
  const ehAnfitriao = sala.criadorId === usuarioId;

  const [gente, perguntas, respostas] = await Promise.all([
    db
      .select({ id: usuarios.id, nome: usuarios.nome, avatar: usuarios.avatar })
      .from(salaParticipantes)
      .innerJoin(usuarios, eq(usuarios.id, salaParticipantes.usuarioId))
      .where(eq(salaParticipantes.salaId, sala.id))
      .orderBy(asc(salaParticipantes.entrouEm), asc(usuarios.id)),
    perguntasDa(sala.id),
    db
      .select({
        perguntaId: salaRespostas.perguntaId,
        usuarioId: salaRespostas.usuarioId,
        alternativa: salaRespostas.alternativa,
        correta: salaRespostas.correta,
        tempoMs: salaRespostas.tempoMs,
      })
      .from(salaRespostas)
      .where(eq(salaRespostas.salaId, sala.id)),
  ]);

  if (!ehAnfitriao && !gente.some((g) => g.id === usuarioId)) {
    throw new ErroSala(403, "Entre na sala com o código para participar.");
  }

  const participantes: ParticipanteSala[] = gente.map((g) => ({ id: g.id, nome: g.nome, avatar: lerAvatar(g.avatar) }));
  const temposS = perguntas.map((p) => p.tempoSegundos);
  const agora = Date.now();
  const etapa = calcularFase(sala.inicioEm.getTime(), temposS, agora);
  const atual = etapa.indice >= 0 && etapa.fase !== "encerrada" ? perguntas[etapa.indice] : null;
  const reveladaAgora = etapa.fase === "revelacao";

  const daPergunta = atual ? respostas.filter((r) => r.perguntaId === atual.id) : [];
  const minha = daPergunta.find((r) => r.usuarioId === usuarioId);

  let ranking: LinhaRanking[] | null = null;
  if (reveladaAgora || etapa.fase === "encerrada") {
    const placar = participantes.map((p) => {
      const certas = respostas.filter((r) => r.usuarioId === p.id && r.correta);
      return { ...p, acertos: certas.length, tempoMs: certas.reduce((soma, r) => soma + r.tempoMs, 0) };
    });
    // Mais acertos primeiro; empate: quem acertou mais rápido; persistindo, a ordem de entrada na sala.
    placar.sort((a, b) => b.acertos - a.acertos || a.tempoMs - b.tempoMs);
    ranking = placar.map((p, i) => ({ ...p, posicao: i + 1 }));
  }

  return {
    agora,
    codigo: sala.codigo,
    titulo: sala.titulo,
    area: sala.area,
    ehAnfitriao,
    contagemSegundos: sala.contagemSegundos,
    inicioEm: sala.inicioEm.getTime(),
    temposS,
    totalPerguntas: perguntas.length,
    fase: etapa.fase,
    indice: etapa.indice,
    participantes,
    pergunta: atual
      ? {
          enunciado: atual.enunciado,
          alternativas: atual.alternativas,
          tempoSegundos: atual.tempoSegundos,
          ...(reveladaAgora
            ? {
                correta: atual.correta,
                distribuicao: atual.alternativas.map((_, i) => daPergunta.filter((r) => r.alternativa === i).length),
              }
            : {}),
        }
      : null,
    minhaResposta: minha ? { alternativa: minha.alternativa, ...(reveladaAgora ? { correta: minha.correta } : {}) } : null,
    respondidos: daPergunta.length,
    ranking,
  };
}
