import type { CompetenciaSlug, Modulo } from "@/lib/types";

/**
 * Um módulo por competência. No MVP, "feedback" e "conflitos" têm conteúdo completo
 * (lições + quiz + desafio); os demais aparecem na trilha como "em produção".
 */
export const MODULOS: Modulo[] = [
  {
    id: "feedback",
    competencia: "feedback",
    titulo: "Feedback e conversas difíceis",
    descricao: "Como dar feedback específico, inclusive para quem era seu colega até ontem.",
    desafioId: "d-feedback",
    licoes: [
      {
        id: "f1",
        titulo: "Por que adiamos o feedback",
        minutos: 3,
        paragrafos: [
          "Líderes recém-promovidos costumam adiar conversas corretivas por medo de estragar a relação ou de parecer “chefe demais”.",
          "O custo de adiar é alto: o comportamento se repete, a equipe percebe que nada acontece e, quando a conversa finalmente vem, ela vem carregada de irritação acumulada.",
        ],
        exemplo:
          "Um técnico entrega relatórios incompletos há dois meses. Quando o líder fala, já está irritado e diz “você nunca faz direito” — e a conversa vira discussão.",
        naPratica: "Anote hoje um feedback que você vem adiando. Só anotar já reduz a chance de deixar para depois.",
      },
      {
        id: "f2",
        titulo: "O modelo SCI: Situação, Comportamento, Impacto",
        minutos: 4,
        paragrafos: [
          "Situação: quando e onde aconteceu. Comportamento: o que a pessoa fez, de forma observável. Impacto: qual foi a consequência.",
          "O SCI troca rótulos (“desorganizado”, “desinteressada”) por fatos. Fica mais difícil discordar de fatos e mais fácil combinar uma mudança.",
        ],
        exemplo:
          "“Na reunião de ontem (S), você interrompeu a Juliana três vezes (C). Ela parou de trazer ideias e perdemos a proposta dela de rota (I).”",
        naPratica: "Reescreva o feedback que você anotou usando S, C e I, sem nenhum adjetivo.",
      },
      {
        id: "f3",
        titulo: "Quando o liderado era seu colega",
        minutos: 4,
        paragrafos: [
          "A promoção muda o papel, não apaga a história. Nomear essa mudança em voz alta tira o “elefante da sala”.",
          "Separe os momentos: o café continua sendo o café, e a conversa sobre trabalho acontece num 1:1, com o mesmo cuidado que você teria com qualquer pessoa da equipe.",
        ],
        exemplo:
          "“Nossa relação mudou e eu quero que funcione para nós dois. Quando eu trouxer algo de trabalho, é o meu papel falando, não a amizade diminuindo.”",
        naPratica: "Se você lidera ex-colegas, marque um 1:1 com um deles só para conversar sobre essa mudança.",
      },
      {
        id: "f4",
        titulo: "O feedback que ninguém quer dar",
        minutos: 4,
        paragrafos: [
          "Abra a conversa dizendo o objetivo, descreva com SCI, pergunte a visão da pessoa e só então combinem os próximos passos.",
          "Termine com uma data: feedback sem acompanhamento vira desabafo. Um retorno rápido em uma ou duas semanas mostra que você se importa com a melhora, não com a bronca.",
        ],
        exemplo:
          "“Quero falar sobre o orçamento de terça. (SCI) … Como você enxerga o que aconteceu? … Combinamos a checagem dupla e conversamos de novo na sexta.”",
        naPratica: "Antes da próxima conversa difícil, escreva só a primeira frase. Começar é a parte mais difícil.",
      },
    ],
    quiz: [
      {
        pergunta: "Qual destas frases segue o modelo SCI?",
        opcoes: [
          "Você anda muito desligado ultimamente.",
          "Na vistoria de segunda, você não registrou duas não conformidades, e o cliente reclamou na auditoria.",
          "Precisa melhorar a atenção aos detalhes.",
        ],
        correta: 1,
        explicacao: "Ela tem situação (vistoria de segunda), comportamento observável e impacto (reclamação na auditoria).",
      },
      {
        pergunta: "Qual o melhor lugar para um feedback corretivo?",
        opcoes: ["Na reunião de equipe, para todos aprenderem", "Em uma conversa individual", "Por mensagem no grupo"],
        correta: 1,
        explicacao: "Feedback corretivo em público expõe a pessoa e costuma gerar defesa em vez de mudança.",
      },
      {
        pergunta: "O que transforma um feedback em mudança de comportamento?",
        opcoes: ["Ser firme no tom", "Repetir até a pessoa entender", "Combinar um próximo passo e acompanhar"],
        correta: 2,
        explicacao: "Sem combinado e retorno, a conversa não vira prática.",
      },
    ],
  },
  {
    id: "conflitos",
    competencia: "conflitos",
    titulo: "Gestão de conflitos",
    descricao: "Mediar divergências na equipe sem tomar partido e sem empurrar o problema.",
    desafioId: "d-conflitos",
    licoes: [
      {
        id: "c1",
        titulo: "Conflito não é o problema",
        minutos: 3,
        paragrafos: [
          "Divergência é sinal de que as pessoas se importam com o trabalho. O problema é o conflito que vira pessoal ou que fica escondido.",
          "Seu papel não é eliminar discordâncias, é garantir que elas aconteçam sobre ideias, com respeito, e terminem em decisão.",
        ],
        exemplo: "Dois técnicos discordam sobre a ordem das inspeções. Bem conduzida, a discussão gera uma rota melhor.",
        naPratica: "Liste os conflitos ativos na sua equipe e marque quais são sobre ideias e quais já viraram pessoais.",
      },
      {
        id: "c2",
        titulo: "Ouça os lados separadamente",
        minutos: 4,
        paragrafos: [
          "Antes de reunir as partes, converse com cada uma em separado. Você entende os interesses por trás das posições e baixa a temperatura.",
          "Nessas conversas, pergunte mais do que afirma e evite dar razão a alguém. Seu objetivo é entender, não julgar.",
        ],
        exemplo: "“Quero entender como você viu a situação dos plantões. O que seria justo para você?”",
        naPratica: "Escreva três perguntas abertas que você faria a cada parte de um conflito atual.",
      },
      {
        id: "c3",
        titulo: "Discordar sem desautorizar",
        minutos: 4,
        paragrafos: [
          "Quando alguém questiona sua decisão em público, reconheça o ponto, proteja a pauta e leve o aprofundamento para uma conversa individual com hora marcada.",
          "Depois, combine como discordâncias devem ser trazidas: antes da reunião, em 1:1 ou com dados. Isso legitima a discordância e evita a desautorização.",
        ],
        exemplo: "“É um ponto importante. Vamos conversar às 15h e eu trago os dados da escala.”",
        naPratica: "Defina com a equipe um canal para discordâncias e anuncie na próxima reunião.",
      },
      {
        id: "c4",
        titulo: "Do impasse ao acordo",
        minutos: 4,
        paragrafos: [
          "Na conversa conjunta, comece pelo objetivo comum, peça que cada parte proponha uma solução e só depois decida.",
          "Registre o acordo e marque uma data para revisá-lo. Acordos sem revisão se desfazem em silêncio.",
        ],
        exemplo: "“Nosso objetivo é escala completa e segura. Que regra de troca de plantão vocês dois achariam justa?”",
        naPratica: "Use a frase do objetivo comum na próxima mediação que precisar fazer.",
      },
    ],
    quiz: [
      {
        pergunta: "Qual o primeiro passo diante de um conflito entre dois liderados?",
        opcoes: ["Reunir os dois imediatamente", "Ouvir cada um em separado", "Esperar que resolvam sozinhos"],
        correta: 1,
        explicacao: "Ouvir separado revela interesses e evita que a conversa conjunta vire disputa.",
      },
      {
        pergunta: "Um liderado questiona sua decisão na frente da equipe. O que fazer?",
        opcoes: [
          "Reafirmar a decisão com firmeza para não perder autoridade",
          "Reconhecer o ponto e marcar uma conversa individual com horário",
          "Mudar a decisão na hora para evitar conflito",
        ],
        correta: 1,
        explicacao: "Reconhecer baixa a tensão; a conversa com horário mostra que o assunto não foi abafado.",
      },
      {
        pergunta: "O que mantém um acordo de pé?",
        opcoes: ["A autoridade do líder", "Registrar e revisar em uma data combinada", "Não tocar mais no assunto"],
        correta: 1,
        explicacao: "Revisar mostra que o acordo importa e permite ajustá-lo antes de ruir.",
      },
    ],
  },
  ...(
    [
      ["decisao", "Tomada de decisão e priorização", "Critérios claros para decidir rápido e comunicar bem."],
      ["delegacao", "Delegação e autonomia", "Delegar resultados, não tarefas, de acordo com a maturidade de cada pessoa."],
      ["desenvolvimento", "Desenvolvimento de pessoas", "1:1 que funcionam e planos de desenvolvimento simples."],
      ["desempenho", "Gestão de desempenho e metas", "Rituais de acompanhamento que evitam surpresas no fechamento."],
      ["comunicacao", "Comunicação e escuta ativa", "Falar para ser entendido e ouvir para entender."],
      ["inteligencia_emocional", "Inteligência emocional e autogestão", "Responder em vez de reagir sob pressão."],
    ] as [CompetenciaSlug, string, string][]
  ).map(([id, titulo, descricao]) => ({ id, competencia: id, titulo, descricao, licoes: [], quiz: [] })),
];

export function obterModulo(id: string): Modulo | undefined {
  return MODULOS.find((m) => m.id === id);
}

export function moduloDaCompetencia(slug: CompetenciaSlug): Modulo {
  return MODULOS.find((m) => m.competencia === slug)!;
}

export const temConteudo = (m: Modulo) => m.licoes.length > 0;
