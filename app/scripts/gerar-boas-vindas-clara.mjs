import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try { process.loadEnvFile(path.join(raiz, ".env.local")); } catch {}
const destino = path.join(raiz, "public/clara/boas-vindas-cenario.mp4");
const chave = process.env.DID_API_KEY?.trim().replace(/^Basic\s+/i, "");
if (!chave) {
  console.error("Configure DID_API_KEY em app/.env.local e execute pnpm clara:video novamente. Nenhuma chamada foi feita à D-ID.");
  process.exit(1);
}
if (!process.argv.includes("--force") && !process.env.DID_TALK_ID && await access(destino).then(() => true, () => false)) {
  console.log("O vídeo já existe. Use --force para gerar novamente (consome créditos).");
  process.exit(0);
}
// O painel pode fornecer usuário:segredo ou o valor Basic já codificado.
const credencial = chave.includes(":") ? Buffer.from(chave).toString("base64") : chave;
const headers = { Authorization: `Basic ${credencial}` };
async function api(caminho, init = {}) {
  const r = await fetch(`https://api.d-id.com${caminho}`, {
    ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(30_000),
  });
  const dados = await r.json();
  if (!r.ok) {
    // Não imprime cabeçalhos nem a credencial em erros.
    throw new Error(`D-ID respondeu ${r.status} (${dados.kind ?? dados.error?.kind ?? "erro"}). Verifique a chave, os créditos e a imagem no painel da D-ID.`);
  }
  return dados;
}

try {
  const conteudo = JSON.parse(await readFile(path.join(raiz, "src/lib/conteudo/boas-vindas.json"), "utf8"));
  let id = process.env.DID_TALK_ID;
  if (id && !/^tlk_[a-zA-Z0-9_-]+$/.test(id)) throw new Error("DID_TALK_ID inválido.");
  if (!id) {
    // Usa o processador de imagens já instalado pelo Next apenas para converter WebP em PNG.
    const require = createRequire(import.meta.url);
    const nextRequire = createRequire(require.resolve("next/package.json"));
    const sharp = nextRequire("sharp");
    const imagem = await sharp(path.join(raiz, "public/clara/boas-vindas-cenario.png")).png().toBuffer();
    const form = new FormData();
    form.append("image", new Blob([imagem], { type: "image/png" }), "clara.png");
    console.log("Enviando a imagem da Clara para o teste de animação…");
    const upload = await api("/images", { method: "POST", body: form });
    if (!upload.url) throw new Error("A D-ID não retornou a URL da imagem.");
    const criado = await api("/talks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_url: upload.url,
        // Mantém corpo e cenário da imagem de origem, animando o rosto no lugar.
        config: { stitch: true },
        script: {
          type: "text", input: conteudo.trechos.join(" "),
          provider: { type: "microsoft", voice_id: process.env.DID_VOICE_ID ?? "pt-BR-FranciscaNeural" },
        },
      }),
    });
    id = criado.id;
    if (!id) throw new Error("A D-ID não retornou o identificador do vídeo.");
    console.log(`Vídeo solicitado: ${id}. Para retomar sem gerar outro: DID_TALK_ID=${id} pnpm clara:video`);
  }
  let pronto;
  for (let tentativa = 0; tentativa < 160; tentativa++) {
    const resultado = await api(`/talks/${encodeURIComponent(id)}`);
    if (resultado.status === "done" && resultado.result_url) { pronto = resultado; break; }
    if (["error", "rejected", "failed"].includes(resultado.status)) throw new Error(`A geração terminou com status ${resultado.status}. A imagem ilustrada pode não ter sido aceita.`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  if (!pronto) throw new Error(`O vídeo ainda não ficou pronto. Retome com DID_TALK_ID=${id} pnpm clara:video`);
  const video = await fetch(pronto.result_url, { signal: AbortSignal.timeout(60_000) });
  if (!video.ok) throw new Error(`Não foi possível baixar o vídeo (${video.status}).`);
  const bytes = Buffer.from(await video.arrayBuffer());
  if (bytes.subarray(4, 8).toString() !== "ftyp") throw new Error("A resposta não contém um vídeo MP4 válido.");
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, bytes);
  // Legendas aproximadas por trecho; o texto completo também fica visível no modal.
  const duracao = Number(pronto.duration) > 0 ? Number(pronto.duration) : conteudo.trechos.join(" ").split(/\s+/).length / 2.5;
  const total = conteudo.trechos.reduce((s, t) => s + t.length, 0);
  const tempo = (segundos) => new Date(Math.round(segundos * 1000)).toISOString().slice(11, 23);
  let inicio = 0;
  const legendas = conteudo.trechos.map((trecho, i) => {
    const fim = inicio + duracao * trecho.length / total;
    const cue = `${i + 1}\n${tempo(inicio)} --> ${tempo(fim)}\n${trecho}\n`;
    inicio = fim;
    return cue;
  });
  await writeFile(path.join(raiz, "public/clara/boas-vindas.vtt"), `WEBVTT\n\n${legendas.join("\n")}`);
  console.log("Vídeo e legendas salvos em public/clara/. Abra o dashboard para testar a sincronização facial.");
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : "Falha ao gerar o vídeo.");
  process.exitCode = 1;
}
