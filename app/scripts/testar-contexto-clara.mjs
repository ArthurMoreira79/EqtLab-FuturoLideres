// Verifica o modelo compartilhado sem precisar iniciar o Next ou modificar dados de usuário.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src");
const cache = new Map();
function carregar(arquivo) {
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const modulo = { exports: {} }; cache.set(arquivo, modulo);
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const localRequire = (nome) => {
    if (nome === "server-only") return {};
    if (!nome.startsWith("@/") && !nome.startsWith(".")) return require(nome);
    const base = nome.startsWith("@/") ? path.join(raiz, nome.slice(2)) : path.resolve(path.dirname(arquivo), nome);
    return carregar(`${base}.ts`);
  };
  vm.runInNewContext(codigo, { module: modulo, exports: modulo.exports, require: localRequire, Set, Map, process: { env: {} }, fetch: (...args) => fetchSimulado(...args), AbortSignal }, { filename: arquivo });
  return modulo.exports;
}

let chamada;
let status = 200;
async function fetchSimulado(url, init) {
  chamada = { url, init, body: JSON.parse(init.body) };
  return { ok: status === 200, status, json: async () => ({ choices: [{ message: { content: '{"resposta":"O que foi mais desafiador no seu dia?"}' } }] }) };
}
const { provedorCompativelOpenAI } = carregar(path.join(raiz, "lib/ia/compativel-openai.ts"));
const provedor = provedorCompativelOpenAI({ baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", modelo: "gemini-3.8-flash", chave: "chave-ficticia" });
const resposta = await provedor.conversar({ moduloId: "feedback", mensagens: [
  { papel: "usuario", texto: "Quero falar sobre meu dia como líder" },
  { papel: "clara", texto: "O que aconteceu?" },
  { papel: "usuario", texto: "Meu colega usa privado@example.test, CPF 123.456.789-01 e chave AIzaABCDEFGHIJKLMNOPQRSTUVWXYZ1234567" },
] });
assert.match(resposta.resposta, /desafiador/);
assert.equal(chamada.url, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
assert.equal(chamada.init.headers.Authorization, "Bearer chave-ficticia");
const sistema = chamada.body.messages[0].content;
assert.match(sistema, /Por que adiamos o feedback/);
assert.doesNotMatch(sistema, /gabarito.*corret[ao]|DATABASE_URL|JWT_SECRET/);
const historico = chamada.body.messages[1].content;
assert.match(historico, /Quero falar sobre meu dia/);
assert.match(historico, /e-mail omitido/);
assert.doesNotMatch(historico, /privado@example|123.456.789|AIzaABC/);
assert.equal(chamada.body.model, "gemini-3.8-flash");
status = 429;
await assert.rejects(provedor.conversar({ mensagens: [{ papel: "usuario", texto: "Olá" }] }), (e) => e.status === 429 && !e.message.includes("chave-ficticia"));
console.log("Contexto Clara validado: conteúdo editorial, histórico, remoção de identificadores, endpoint Gemini e erro de cota sem credenciais.");
