import "server-only";
import { respostaGuiada } from "@/lib/clara/chat";
import { MIN_PALAVRAS_RESPOSTA } from "./limites";
import { competencia, forcasEAtencao, nivelDe, SLUGS } from "@/lib/competencias";
import { MODULOS } from "@/lib/conteudo/modulos";
import type { CompetenciaSlug, CriterioRubrica } from "@/lib/types";
import type { ProvedorIA } from "./provedor";
import type { FeedbackIA, RelatorioIA, ResultadoAvaliacao } from "./schema";

/**
 * Avaliador simulado: não chama nenhuma IA.
 * Procura na resposta os "sinais" de cada critério da rubrica e monta um feedback
 * no mesmo formato JSON que uma IA real devolveria. Serve para testar o fluxo
 * completo sem custo e sem chave de API.
 */

const normalizar = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function trechoCom(resposta: string, sinal: string): string | null {
  const frases = resposta.split(/(?<=[.!?…])\s+/);
  const alvo = normalizar(sinal);
  const frase = frases.find((f) => normalizar(f).includes(alvo));
  if (!frase) return null;
  const limpa = frase.trim().replace(/[.…]+$/, "");
  return limpa.length > 90 ? `${limpa.slice(0, 87)}…` : limpa;
}

function atende(resposta: string, c: CriterioRubrica): string | null | false {
  const texto = normalizar(resposta);
  const sinal = c.sinais.find((s) => texto.includes(normalizar(s)));
  if (!sinal) return false;
  return trechoCom(resposta, sinal);
}

const arred = (n: number) => Math.round(n * 10) / 10;
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const provedorSimulado: ProvedorIA = {
  nome: "simulado",

  async conversar(pedido) { return { resposta: respostaGuiada(pedido) }; },

  async avaliar({ desafio, resposta, opcaoEscolhida }): Promise<ResultadoAvaliacao> {
    await new Promise((r) => setTimeout(r, 900)); // simula a latência de uma IA

    const palavras = resposta.trim().split(/\s+/).filter(Boolean).length;
    if (palavras < MIN_PALAVRAS_RESPOSTA) {
      return {
        status: "desenvolver",
        mensagem:
          `Escreva pelo menos ${MIN_PALAVRAS_RESPOSTA} palavras. Conte o que você faria primeiro, o que diria e como acompanharia a situação depois.`,
      };
    }

    const resultados = desafio.rubrica.map((c) => ({ c, achado: atende(resposta, c) }));
    const atendidos = resultados.filter((r) => r.achado !== false);
    const faltando = resultados.filter((r) => r.achado === false);
    const proporcao = atendidos.length / desafio.rubrica.length;

    const bonusTamanho = Math.min(1, palavras / 120);
    const bonusOpcao =
      desafio.tipo === "escolha" && opcaoEscolhida !== undefined && opcaoEscolhida === desafio.opcaoRecomendada ? 0.5 : 0;
    const notaGeral = arred(limitar(3 + 5.5 * proporcao + bonusTamanho + bonusOpcao, 0, 10));

    const competencias = desafio.competencias.map((slug) => {
      const daComp = resultados.filter((r) => r.c.competencia === slug);
      const p = daComp.length ? daComp.filter((r) => r.achado !== false).length / daComp.length : proporcao;
      const nota = arred(limitar(3 + 6 * p + bonusTamanho * 0.5, 0, 10));
      return { competencia: slug, nota, nivel: nivelDe(nota / 2) };
    });

    const fracas = faltando.map((r) => r.c.competencia);
    const compProximo: CompetenciaSlug = fracas[0] ?? desafio.competencias[0];
    const modulo = MODULOS.find((m) => m.competencia === compProximo);

    const feedback: FeedbackIA = {
      nota_geral: notaGeral,
      competencias,
      pontos_fortes: atendidos.length
        ? atendidos.map((r) => (r.achado ? `${r.c.forte} (“${r.achado}”)` : r.c.forte))
        : ["Você se posicionou diante da situação em vez de ignorá-la — é o primeiro passo."],
      pontos_de_melhoria: faltando.length
        ? faltando.map((r) => r.c.melhoria)
        : ["Sua resposta cobre a rubrica. Para ir além, pense em como medir se a solução funcionou."],
      riscos_da_abordagem: faltando.filter((r) => r.c.risco).map((r) => r.c.risco!).slice(0, 2),
      exemplo_de_resposta_melhor: desafio.exemploResposta,
      dificuldades_identificadas: [...new Set(fracas)].map((s) => competencia(s).nome),
      proximo_passo_sugerido: modulo
        ? `Faça a lição “${modulo.licoes[0]?.titulo ?? modulo.titulo}” do módulo ${modulo.titulo}.`
        : "Repita uma missão desta competência na próxima semana.",
      confianca: "media",
    };
    return { status: "ok", feedback };
  },

  async gerarRelatorio({ inicial, atual, atividades, nome }): Promise<RelatorioIA> {
    await new Promise((r) => setTimeout(r, 700));
    const { forcas, atencao } = forcasEAtencao(atual);
    const evolucao = SLUGS.map((s) => ({ s, d: atual[s] - inicial[s] })).sort((a, b) => b.d - a.d);
    const maisEvoluiu = evolucao[0];
    const dificuldades = atividades.flatMap((a) => a.dificuldades);
    const recorrente = dificuldades.sort(
      (a, b) => dificuldades.filter((d) => d === b).length - dificuldades.filter((d) => d === a).length,
    )[0];

    const resumo =
      `${nome ? `${nome.split(" ")[0]}, você` : "Você"} mostra mais segurança em ${competencia(forcas[0]).nome.toLowerCase()} ` +
      `e em ${competencia(forcas[1]).curto.toLowerCase()}. ` +
      (maisEvoluiu && maisEvoluiu.d > 0.2
        ? `O maior avanço desde o diagnóstico foi em ${competencia(maisEvoluiu.s).curto.toLowerCase()}. `
        : "") +
      `O próximo salto está em ${competencia(atencao[0]).nome.toLowerCase()}.`;

    return {
      resumo,
      forcas: forcas.map((s) => competencia(s).nome),
      pontos_de_atencao: atencao.map((s) => competencia(s).nome),
      padroes_observados: recorrente
        ? [`Nas últimas respostas, “${recorrente}” apareceu como dificuldade mais de uma vez.`]
        : ["Ainda há poucas atividades para identificar padrões."],
      recomendacao_da_semana:
        atencao[0] === "feedback"
          ? "No próximo 1:1, use o modelo Situação–Comportamento–Impacto em um ponto que você vem evitando."
          : `Escolha uma situação real desta semana e aplique uma prática do módulo ${competencia(atencao[0]).curto}.`,
      base_atividades: atividades.slice(0, 8).map((a) => a.titulo),
    };
  },
};
