// Integração real com Postgres e o servidor local. Só cria/remove contas sintéticas desta execução.
import assert from "node:assert/strict";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import pg from "pg";
for (const arquivo of [".env.local", ".env"]) { try { process.loadEnvFile(arquivo); } catch {} }
const base = "http://localhost:3000";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const ids = [];
const prefixo = `rede-${Date.now()}-${randomUUID().slice(0, 6)}`;
const senha = `${randomUUID()}a1`;
const avatar = { genero: "masculino", cabelo: "shortCurly", corDoCabelo: "2c1b18", pele: "edb98a", olhos: "default", sobrancelhas: "defaultNatural", boca: "smile", oculos: "nenhum", barba: "nenhuma", roupa: "shirtCrewNeck", corDaRoupa: "5199e4", fundo: "b6e3f4" };
async function criar(nome, email = `${prefixo}-${nome}@example.test`) {
  const salt = randomBytes(16);
  const hash = ["scrypt", 16384, 8, 1, salt.toString("base64"), scryptSync(senha, salt, 64, { N: 16384, r: 8, p: 1 }).toString("base64")].join("$");
  const { rows } = await db.query(`INSERT INTO usuarios (nome,email,cargo,setor,tipo_equipe,tamanho_equipe,meses_lideranca,modelo_trabalho,senha_hash,avatar) VALUES ($1,$2,'Líder','Operações','Operacional',5,0,'Presencial',$3,$4::jsonb) RETURNING id,nome,email`, [nome, email, hash, JSON.stringify(avatar)]);
  ids.push(rows[0].id); return rows[0];
}
async function login(conta) {
  const r = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: conta.email, senha }) });
  assert.equal(r.status, 200, JSON.stringify(await r.clone().json()));
  return r.headers.getSetCookie().find((s) => s.startsWith("fl_sessao="))?.split(";")[0];
}
async function request(cookie, query = "", acao, status = 200, origin) {
  const r = await fetch(`${base}/api/rede${query}`, {
    method: acao ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(origin ? { Origin: origin } : {}) },
    ...(acao ? { body: JSON.stringify(acao) } : {}),
  });
  const data = await r.json(); assert.equal(r.status, status, JSON.stringify(data)); return data;
}
await db.connect();
try {
  await request(null, "", undefined, 401);
  const dono = await criar("responsavel"), membro = await criar("colega"), fora = await criar("externo");
  const a = await login(dono), b = await login(membro), c = await login(fora);
  const busca = await request(a, `?busca=${encodeURIComponent(membro.email.slice(0, -6))}`);
  assert.equal(busca.pessoas[0].id, membro.id); assert.ok(busca.pessoas[0].avatar); assert.equal(busca.pessoas[0].senhaHash, undefined);
  assert.deepEqual((await request(a, "?busca=re")).pessoas, []);
  assert.deepEqual((await request(a, "?busca=%25%25%25")).pessoas, []);
  await request(a, "", { acao: "adicionar-membro", email: dono.email }, 400);
  const { equipeId } = await request(a, "", { acao: "adicionar-membro", email: membro.email.toUpperCase(), funcao: "Técnico", ultimo1on1: "2026-01-10" });
  await request(a, "", { acao: "adicionar-membro", email: membro.email }, 409);
  await request(b, `?equipe=${equipeId}`, undefined, 403);
  await request(c, `?equipe=${equipeId}`, undefined, 403);
  assert.equal((await request(b)).convites[0].id, equipeId);
  await request(c, "", { acao: "aceitar-convite", equipeId }, 404);
  await request(b, "", { acao: "aceitar-convite", equipeId });
  assert.equal((await request(b)).grupos[0].id, equipeId);
  const g = await request(b, `?equipe=${equipeId}`);
  assert.equal(g.membros[0].ultimo1on1, null);
  const membroId = g.membros[0].id;
  await request(b, "", { acao: "atualizar-membro", equipeId, membroId, funcao: "Admin", ultimo1on1: null }, 403);
  await request(b, "", { acao: "remover-membro", equipeId, membroId }, 403);
  await request(a, "", { acao: "atualizar-membro", equipeId, membroId, funcao: "Analista", ultimo1on1: "2026-02-01" });
  await request(c, "", { acao: "enviar-mensagem", equipeId, texto: "Invasão" }, 403);
  await request(a, "", { acao: "enviar-mensagem", equipeId, texto: "Olá, equipe!" });
  await request(b, "", { acao: "enviar-mensagem", equipeId, texto: "Conectado!" });
  const conversa = await request(b, `?equipe=${equipeId}`);
  assert.equal(conversa.mensagens.length, 2); assert.equal(conversa.mensagens[1].autor.id, membro.id);
  const futuro = `${prefixo}-futuro@example.test`;
  await request(a, "", { acao: "adicionar-membro", email: futuro, nome: "Pessoa futura" });
  const novaConta = await criar("nova-conta", futuro); const d = await login(novaConta);
  assert.equal((await request(d)).convites[0].id, equipeId);
  await request(d, "", { acao: "aceitar-convite", equipeId });
  assert.ok((await request(d, `?equipe=${equipeId}`)).membros.some((m) => m.usuarioId === novaConta.id && m.status === "ativo"));
  const outroGrupo = await request(c, "", { acao: "adicionar-membro", email: membro.email });
  await request(b, "", { acao: "recusar-convite", equipeId: outroGrupo.equipeId });
  assert.equal((await request(b)).convites.length, 0);
  await request(a, "", { acao: "enviar-mensagem", equipeId, texto: "teste", donoId: fora.id }, 400);
  await request(a, "", { acao: "enviar-mensagem", equipeId, texto: "teste" }, 403, "https://outro.example");
  await request(a, "", { acao: "remover-membro", equipeId, membroId });
  await request(b, `?equipe=${equipeId}`, undefined, 403);
  assert.equal((await request(b)).grupos.length, 0);
  const { rows } = await db.query("SELECT count(*) AS total FROM equipe_mensagens WHERE equipe_id=$1", [equipeId]);
  assert.equal(rows[0].total, "2");
  console.log("Rede validada: busca com avatar, convites, conta futura, aceite/recusa, mensagens persistidas, atualização, remoção e isolamento entre contas.");
} finally {
  if (ids.length) {
    await db.query("DELETE FROM limites_taxa WHERE chave LIKE $1", [`login:conta:${prefixo}%`]);
    await db.query("DELETE FROM limites_taxa WHERE chave = ANY($1::text[])", [ids.flatMap((id) => [`rede:leitura:${id}`, `rede:escrita:${id}`])]);
    await db.query("DELETE FROM usuarios WHERE id = ANY($1::uuid[])", [ids]);
  }
  await db.end();
}
