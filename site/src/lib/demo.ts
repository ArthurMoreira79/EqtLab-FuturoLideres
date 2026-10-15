import { ordenarTrilha } from "@/lib/competencias";
import { hoje, type Estado } from "@/lib/estado";
import type { Pontuacoes } from "@/lib/types";

/** Usuária fictícia com 3 semanas de histórico para a demo do hackathon. */

const diasAtras = (n: number) => hoje(new Date(Date.now() - n * 86_400_000));

const inicial: Pontuacoes = {
  comunicacao: 3,
  feedback: 2,
  delegacao: 2.5,
  conflitos: 2,
  decisao: 3.5,
  inteligencia_emocional: 3,
  desenvolvimento: 2.5,
  desempenho: 3,
};

const semana1: Pontuacoes = { ...inicial, comunicacao: 3.2, decisao: 3.7, feedback: 2.2, conflitos: 2.1 };
const semana2: Pontuacoes = { ...semana1, comunicacao: 3.4, decisao: 3.9, feedback: 2.6, conflitos: 2.3, delegacao: 2.8 };
const atual: Pontuacoes = {
  comunicacao: 3.5,
  feedback: 3,
  delegacao: 3,
  conflitos: 2.5,
  decisao: 4,
  inteligencia_emocional: 3.5,
  desenvolvimento: 3,
  desempenho: 3.5,
};

export function estadoDemo(): Estado {
  return {
    perfil: {
      nome: "Mariana Costa",
      cargo: "Coordenadora de Operações",
      setor: "Distribuição",
      tipoEquipe: "Operacional",
      tamanhoEquipe: 9,
      mesesLideranca: 4,
      modeloTrabalho: "Presencial",
      desafios: ["Dar feedback", "Lidar com conflitos", "Liderar ex-colegas"],
    },
    diagnostico: { pontuacoes: inicial, data: diasAtras(21) },
    pontuacoes: atual,
    historico: [
      { data: diasAtras(21), pontuacoes: inicial },
      { data: diasAtras(14), pontuacoes: semana1 },
      { data: diasAtras(7), pontuacoes: semana2 },
      { data: diasAtras(1), pontuacoes: atual },
    ],
    trilha: ordenarTrilha(inicial),
    progresso: {
      feedback: { licoesFeitas: ["f1", "f2", "f3"], concluido: false },
    },
    xp: 1240,
    sequencia: { dias: 12, ultimoDia: diasAtras(1), congelada: false },
    trocasHoje: { data: hoje(), usadas: 0 },
    missao: null,
    submissoes: [
      {
        id: "demo-1",
        desafioId: "m-feedback-atraso",
        titulo: "Atrasos recorrentes",
        origem: "missao",
        resposta:
          "Vou esperar mais uma semana para ver se ele melhora e, se continuar, falo com ele em particular sobre os atrasos.",
        data: diasAtras(2),
        feedback: {
          nota_geral: 6.2,
          competencias: [
            { competencia: "feedback", nota: 5.8, nivel: "em_desenvolvimento" },
            { competencia: "desempenho", nota: 6.4, nivel: "proficiente" },
          ],
          pontos_fortes: ["Você escolheu um espaço reservado. (“falo com ele em particular sobre os atrasos”)"],
          pontos_de_melhoria: [
            "Use fatos e impacto: quando aconteceu, o que aconteceu e qual foi a consequência.",
            "Combine o próximo passo e quando vão revisar.",
          ],
          riscos_da_abordagem: ["Sem combinado, a conversa vira só desabafo e nada muda."],
          exemplo_de_resposta_melhor:
            "Converso com ele a sós ainda hoje: “Carlos, neste mês você chegou depois das 7h em quatro dias, e em dois a equipe saiu sem você.” Pergunto o que está acontecendo e combinamos uma data para revisar.",
          dificuldades_identificadas: ["Feedback e conversas difíceis"],
          proximo_passo_sugerido: "Faça a lição “O modelo SCI” do módulo Feedback e conversas difíceis.",
          confianca: "media",
        },
      },
      {
        id: "demo-2",
        desafioId: "m-prioridades",
        titulo: "Duas urgências ao mesmo tempo",
        origem: "missao",
        resposta:
          "Priorizo a ocorrência porque envolve segurança e clientes sem energia. Aviso a diretoria logo cedo explicando o motivo e proponho uma entrega parcial às 14h.",
        data: diasAtras(4),
        feedback: {
          nota_geral: 8.6,
          competencias: [
            { competencia: "decisao", nota: 8.8, nivel: "referencia" },
            { competencia: "comunicacao", nota: 8.2, nivel: "referencia" },
          ],
          pontos_fortes: [
            "Você explicitou o critério de prioridade. (“Priorizo a ocorrência porque envolve segurança e clientes sem energia”)",
            "Você avisou as partes afetadas.",
            "Você ofereceu uma alternativa para a demanda que ficou em segundo plano.",
          ],
          pontos_de_melhoria: ["Sua resposta cobre a rubrica. Para ir além, pense em como medir se a solução funcionou."],
          riscos_da_abordagem: [],
          exemplo_de_resposta_melhor:
            "Priorizo a ocorrência, remanejo duas pessoas para o campo, aviso a diretoria às 8h30 e proponho entrega parcial às 14h.",
          dificuldades_identificadas: [],
          proximo_passo_sugerido: "Repita uma missão desta competência na próxima semana.",
          confianca: "media",
        },
      },
    ],
    equipe: [
      { id: "e1", nome: "Rafael Souza", funcao: "Técnico sênior", notas: "Muito experiente, questiona decisões em público.", ultimo1on1: diasAtras(3) },
      { id: "e2", nome: "Juliana Lima", funcao: "Analista de operações", notas: "Queda de engajamento nas últimas semanas.", ultimo1on1: diasAtras(21) },
      { id: "e3", nome: "Paulo Alves", funcao: "Eletricista", notas: "Interesse em planejamento.", ultimo1on1: diasAtras(8) },
    ],
    relatorio: {
      resumo:
        "Mariana, você tem decidido com mais segurança e comunica prioridades com clareza. O próximo salto está nas conversas difíceis: nas últimas respostas, você tende a adiar o feedback corretivo.",
      forcas: ["Tomada de decisão e priorização", "Comunicação e escuta ativa"],
      pontos_de_atencao: ["Feedback e conversas difíceis", "Gestão de conflitos"],
      padroes_observados: ["Nas últimas respostas, “Feedback e conversas difíceis” apareceu como dificuldade mais de uma vez."],
      recomendacao_da_semana:
        "No próximo 1:1, use o modelo Situação–Comportamento–Impacto em um ponto que você vem evitando.",
      base_atividades: ["Atrasos recorrentes", "Duas urgências ao mesmo tempo", "Diagnóstico inicial"],
      geradoEm: diasAtras(1),
    },
  };
}
