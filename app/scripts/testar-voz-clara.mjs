import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const modulo = { exports: {} };
const codigo = ts.transpileModule(fs.readFileSync('src/lib/clara/voz.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(codigo, { module: modulo, exports: modulo.exports, setTimeout, clearTimeout });
const { escutarVoz, reconhecimentoDisponivel } = modulo.exports;
assert.equal(reconhecimentoDisponivel(), undefined);
const estado = {};
class Reconhecimento {
  constructor() { estado.atual = this; }
  start() { this.iniciado = true; }
  stop() { this.onend?.(); }
  abort() { this.abortado = true; this.onend?.(); }
}
function sessao(Classe = Reconhecimento) {
  const dados = { transcricoes: [], envios: [], erros: [], fins: 0 };
  const controle = escutarVoz(Classe, { transcrever: t => dados.transcricoes.push(t), enviar: t => dados.envios.push(t), erro: t => dados.erros.push(t), terminar: () => dados.fins++ });
  return { dados, controle };
}
function resultado(texto, isFinal) { estado.atual.onresult?.({ results: [{ isFinal, 0: { transcript: texto } }] }); }
let s = sessao();
assert.equal(estado.atual.lang, 'pt-BR');
resultado('Meu dia', false);
assert.equal(s.dados.envios.length, 0);
resultado('Meu dia como líder foi difícil.', true);
s.controle.parar();
assert.deepEqual(s.dados.envios, ['Meu dia como líder foi difícil.']);
estado.atual.onend?.();
assert.equal(s.dados.envios.length, 1, 'fim duplicado não pode enviar duas vezes');
s = sessao(); resultado('Não enviar ao fechar', true); const fimAntigo = estado.atual.onend; s.controle.cancelar(); fimAntigo();
assert.equal(s.dados.envios.length, 0); assert.equal(estado.atual.abortado, true);
s = sessao(); estado.atual.onerror({ error: 'not-allowed' }); estado.atual.onend();
assert.match(s.dados.erros[0], /Permita/); assert.equal(s.dados.envios.length, 0);
s = sessao(); resultado('x'.repeat(801), true);
assert.equal(s.dados.transcricoes[0].length, 800); assert.equal(s.dados.envios.length, 0); assert.match(s.dados.erros[0], /800/);
s = sessao(); estado.atual.onend(); assert.equal(s.dados.envios.length, 0); assert.match(s.dados.erros[0], /reconhecer/);
s = sessao(class extends Reconhecimento { start() { throw new Error('permissão'); } });
assert.equal(s.dados.fins, 1); assert.equal(estado.atual.abortado, true); assert.match(s.dados.erros[0], /permissão/);
console.log('Voz validada: transcrição parcial/final, envio único, cancelamento, permissão negada, limite e falha ao iniciar.');

const { solicitarPermissaoMicrofone, mensagemErroMicrofone } = modulo.exports;
let restricoes;
let paradas = 0;
await solicitarPermissaoMicrofone({ getUserMedia: async (pedido) => {
  restricoes = pedido;
  return { getTracks: () => [{ stop: () => paradas++ }, { stop: () => paradas++ }] };
} });
assert.equal(restricoes.audio, true);
assert.equal(restricoes.video, false);
assert.equal(paradas, 2, 'liberar todos os tracks após verificar a permissão');
await assert.rejects(solicitarPermissaoMicrofone({ getUserMedia: async () => { throw Object.assign(new Error('bloqueado'), { name: 'NotAllowedError' }); } }), { name: 'NotAllowedError' });
assert.match(mensagemErroMicrofone({ name: 'NotAllowedError' }), /permissões ao lado do endereço/);
assert.match(mensagemErroMicrofone({ name: 'NotFoundError' }), /Conecte/);
assert.match(mensagemErroMicrofone({ name: 'NotReadableError' }), /outro aplicativo/);
console.log('Permissão validada: somente áudio, liberação dos tracks e erros de bloqueio/dispositivo.');
