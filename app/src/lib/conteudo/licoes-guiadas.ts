export interface LicaoGuiada {
  resumo: string;
  passos: { sigla: string; titulo: string; texto: string }[];
  situacao: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  explicacao: string;
}

/** Conteúdo curto para experimentar antes de abrir o texto de apoio. */
export const LICOES_GUIADAS: Record<string, LicaoGuiada> = {
  f1: {
    resumo: "Uma conversa cedo evita que um problema pequeno vire uma bronca acumulada.",
    passos: [
      { sigla: "1", titulo: "Você adia", texto: "O receio de desagradar faz a conversa ficar para depois." },
      { sigla: "2", titulo: "O problema se repete", texto: "Sem orientação, a pessoa segue fazendo do mesmo jeito." },
      { sigla: "3", titulo: "Converse cedo", texto: "Traga um fato, ouça a pessoa e combine uma mudança." },
    ],
    situacao: "Um técnico entregou o segundo relatório incompleto nesta semana.",
    pergunta: "Qual é o melhor próximo passo?",
    opcoes: ["Esperar mais um mês para ter certeza.", "Conversar em particular hoje, mostrando o que faltou.", "Dizer na reunião que ele nunca faz nada direito."],
    correta: 1, explicacao: "Uma conversa próxima do fato, em particular, permite corrigir antes de acumular irritação. Descreva o que faltou sem rotular a pessoa.",
  },
  f2: {
    resumo: "Troque julgamentos por três peças: quando aconteceu, o que a pessoa fez e qual foi o efeito.",
    passos: [
      { sigla: "S", titulo: "Situação", texto: "Na reunião de ontem…" },
      { sigla: "C", titulo: "Comportamento", texto: "…você interrompeu a Juliana três vezes…" },
      { sigla: "I", titulo: "Impacto", texto: "…e a proposta de rota dela não foi discutida." },
    ],
    situacao: "Você quer conversar sobre um relatório entregue fora do prazo.",
    pergunta: "Qual frase usa fatos em vez de um rótulo?",
    opcoes: ["Você é muito desorganizado.", "Você precisa levar o trabalho a sério.", "Na entrega de terça, o relatório chegou dois dias depois do prazo e atrasou a análise."],
    correta: 2, explicacao: "A frase mostra a situação (entrega de terça), o comportamento observável (dois dias de atraso) e o impacto (análise atrasada).",
  },
  f3: {
    resumo: "Liderar um ex-colega pede clareza de papéis, sem apagar a relação que já existe.",
    passos: [
      { sigla: "1", titulo: "Nomeie a mudança", texto: "Converse sobre o que muda com sua nova responsabilidade." },
      { sigla: "2", titulo: "Separe os momentos", texto: "O café continua; o feedback acontece em um 1:1." },
      { sigla: "3", titulo: "Use o mesmo cuidado", texto: "Combine expectativas sem privilégios nem dureza extra." },
    ],
    situacao: "Uma amiga da equipe diz: “Você virou chefe e agora só me cobra.”",
    pergunta: "Como abrir essa conversa?",
    opcoes: ["Nossa relação importa. Vamos conversar sobre o que muda no trabalho e como combinar expectativas?", "Agora sou sua chefe, você precisa aceitar.", "Para preservar a amizade, vou deixar de cobrar suas entregas."],
    correta: 0, explicacao: "Reconhecer a relação e explicar o papel abre espaço para combinar expectativas. A amizade não exige abrir mão da responsabilidade de liderar.",
  },
  f4: {
    resumo: "O feedback funciona melhor quando termina com um combinado e uma data de retorno.",
    passos: [
      { sigla: "1", titulo: "Abra e descreva", texto: "Diga o objetivo e apresente situação, comportamento e impacto." },
      { sigla: "2", titulo: "Ouça e combine", texto: "Pergunte como a pessoa viu o caso e decidam o próximo passo." },
      { sigla: "3", titulo: "Acompanhe", texto: "Marquem quando vão verificar se o combinado funcionou." },
    ],
    situacao: "Vocês concordaram em conferir os dados antes de enviar o próximo orçamento.",
    pergunta: "O que falta para fechar o feedback?",
    opcoes: ["Repetir o erro várias vezes para a pessoa não esquecer.", "Combinar quem fará a checagem e uma data para revisar o resultado.", "Encerrar e só voltar ao assunto se der problema."],
    correta: 1, explicacao: "Um responsável, uma ação concreta e uma data tornam o acordo acompanhável. Assim a conversa vira prática, em vez de ficar só na intenção.",
  },
  c1: {
    resumo: "Discordar pode melhorar uma decisão. O cuidado é manter a conversa nas ideias, sem ataques pessoais.",
    passos: [
      { sigla: "1", titulo: "Perceba o tema", texto: "A divergência é sobre o trabalho ou virou ataque à pessoa?" },
      { sigla: "2", titulo: "Proteja o respeito", texto: "Abra espaço para argumentos, sem aceitar ofensas." },
      { sigla: "3", titulo: "Busque uma decisão", texto: "Compare as propostas com um objetivo em comum." },
    ],
    situacao: "Dois técnicos propõem ordens diferentes para as inspeções.",
    pergunta: "Como aproveitar a divergência?",
    opcoes: ["Proibir discussões sobre a rota.", "Pedir os argumentos e comparar as propostas com critérios de segurança.", "Escolher a ideia de quem falar mais alto."],
    correta: 1, explicacao: "A divergência sobre ideias pode revelar uma rota melhor. O papel do líder é cuidar do respeito e conduzir uma decisão com critérios.",
  },
  c2: {
    resumo: "Ouvir cada lado primeiro ajuda a entender interesses e evita uma disputa diante do grupo.",
    passos: [
      { sigla: "1", titulo: "Converse separado", texto: "Dê espaço para cada pessoa contar sua visão." },
      { sigla: "2", titulo: "Pergunte", texto: "O que aconteceu? O que seria justo para você?" },
      { sigla: "3", titulo: "Entenda", texto: "Procure os interesses sem prometer razão a ninguém." },
    ],
    situacao: "Duas pessoas estão irritadas com uma troca de plantão.",
    pergunta: "O que perguntar na primeira conversa individual?",
    opcoes: ["Você concorda que a outra pessoa está errada?", "Por que você sempre cria problemas?", "Como você viu essa situação e o que seria uma solução justa?"],
    correta: 2, explicacao: "Perguntas abertas mostram interesses sem tomar partido. Evite julgamentos antes de entender as duas versões.",
  },
  c3: {
    resumo: "Reconheça a discordância em público e leve o aprofundamento para uma conversa com hora marcada.",
    passos: [
      { sigla: "1", titulo: "Reconheça", texto: "É um ponto importante e quero entender." },
      { sigla: "2", titulo: "Marque um horário", texto: "Vamos conversar às 15h, com os dados da escala." },
      { sigla: "3", titulo: "Combine um canal", texto: "Definam como trazer discordâncias daqui para frente." },
    ],
    situacao: "Um liderado critica sua decisão no meio da reunião da equipe.",
    pergunta: "Como responder sem abafar o assunto?",
    opcoes: ["É um ponto importante. Vamos conversar às 15h e eu trago os dados?", "Aqui quem decide sou eu.", "Vamos esquecer o assunto e seguir."],
    correta: 0, explicacao: "Reconhecer e dar um horário concreto protege a pauta sem ignorar a preocupação. Depois, combine uma forma respeitosa de discordar.",
  },
  c4: {
    resumo: "Um acordo precisa de objetivo comum, ação concreta e data para revisão.",
    passos: [
      { sigla: "1", titulo: "Objetivo comum", texto: "Queremos uma escala completa e segura." },
      { sigla: "2", titulo: "Propostas e acordo", texto: "Peça alternativas e combinem uma regra viável." },
      { sigla: "3", titulo: "Revisão marcada", texto: "Registrem o acordo e quando vão avaliar o resultado." },
    ],
    situacao: "Depois de ouvir os dois lados, vocês vão definir uma regra de troca de plantão.",
    pergunta: "Qual é o melhor fechamento?",
    opcoes: ["Escolher uma regra e nunca mais discutir o assunto.", "Registrar o que combinaram e revisar a regra na próxima semana.", "Pedir que cada pessoa resolva sozinha da próxima vez."],
    correta: 1, explicacao: "Registrar evita interpretações diferentes. Revisar permite ajustar o acordo antes que o problema volte a crescer.",
  },
};
