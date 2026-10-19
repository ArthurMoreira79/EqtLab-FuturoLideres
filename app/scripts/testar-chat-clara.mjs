import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import pg from "pg";
for (const arquivo of [".env.local", ".env"]) { try { process.loadEnvFile(arquivo); } catch {} }
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
let usuarioId;
try {
  let r = await fetch("http://localhost:3000/api/clara/chat", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
  assert.equal(r.status, 401);
  const email = `teste-clara-${randomUUID()}@example.test`;
  const { rows: contas } = await db.query(`INSERT INTO usuarios(nome,email,cargo,setor,tipo_equipe,tamanho_equipe,meses_lideranca,modelo_trabalho,senha_hash) VALUES('Teste Clara',$1,'Líder','Operações','Operacional',1,0,'Presencial','conta-descartavel-sem-senha') RETURNING id`, [email]);
  usuarioId = contas[0].id;
  const { rows: sessoes } = await db.query("INSERT INTO sessoes(usuario_id,expira_em) VALUES($1,now()+interval '5 minutes') RETURNING id", [usuarioId]);
  const segredo = process.env.JWT_SECRET?.length >= 32 ? process.env.JWT_SECRET : "segredo-somente-para-desenvolvimento-local";
  const token = await new SignJWT({ sid: sessoes[0].id }).setProtectedHeader({ alg: "HS256" }).setSubject(usuarioId).setIssuer("futuro-lideres").setAudience("futuro-lideres:app").setIssuedAt().setExpirationTime("5m").sign(new TextEncoder().encode(segredo));
  const headers = { "Content-Type": "application/json", Cookie: `fl_sessao=${token}` };
  for (const body of [{ mensagens: [] }, { mensagens: [{ papel: "usuario", texto: "x".repeat(801) }] }, { mensagens: [{ papel: "clara", texto: "Olá" }] }]) {
    r = await fetch("http://localhost:3000/api/clara/chat", { method: "POST", headers, body: JSON.stringify(body) }); assert.equal(r.status, 400);
  }
  const body = JSON.stringify({ mensagens: [{ papel: "usuario", texto: "Me explique o SCI" }], moduloId: "feedback" });
  r = await fetch("http://localhost:3000/api/clara/chat", { method: "POST", headers: { ...headers, Origin: "https://fora.example" }, body }); assert.equal(r.status, 403);
  const real = !!process.env.GEMINI_API_KEY?.trim() || (process.env.IA_PROVEDOR && process.env.IA_PROVEDOR !== "simulado");
  if (!real || process.argv.includes("--real")) {
    r = await fetch("http://localhost:3000/api/clara/chat", { method: "POST", headers, body }); assert.equal(r.status, 200);
    const dados = await r.json(); assert.equal(dados.modo, real ? "ia" : "guiado"); assert.ok(dados.resposta.length > 10);
    if (!real) assert.match(dados.resposta, /Situação/);
    console.log(`Resposta do chat validada em modo ${dados.modo}.`);
  }
  console.log("Chat validado: autenticação, tamanho, formato das mensagens, origem.");
} finally {
  if (usuarioId) {
    await db.query("DELETE FROM limites_taxa WHERE chave=$1", [`clara:chat:${usuarioId}`]);
    await db.query("DELETE FROM usuarios WHERE id=$1", [usuarioId]);
  }
  await db.end();
}
