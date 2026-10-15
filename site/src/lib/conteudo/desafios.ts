import "server-only";
import type { Desafio, DesafioPublico } from "@/lib/types";

/**
 * Banco curado de cenários (seed). Fica só no servidor: a rubrica e o exemplo
 * de resposta nunca vão para o navegador.
 * Os "sinais" são trechos procurados pelo avaliador simulado (sem acento, minúsculas).
 */
export const DESAFIOS: Desafio[] = [
  {
    id: "m-questionamento-publico",
    tipo: "cenario",
    titulo: "Questionado na frente da equipe",
    enunciado:
      "Na reunião de alinhamento, Rafael, técnico sênior, diz na frente de todos: “Essa nova escala não vai funcionar, quem decidiu isso não conhece o campo.”",
    pergunta: "O que você faz nos próximos minutos e depois da reunião?",
    competencias: ["conflitos", "comunicacao"],
    dificuldade: 2,
    exemploResposta:
      "“Rafael, é um ponto importante e quero entender os detalhes. Para não perder a pauta, vamos conversar às 15h, só nós dois, e eu trago os dados da escala.” Na conversa, ouço os argumentos, explico os critérios da decisão e combino com ele como trazer discordâncias no futuro.",
    rubrica: [
      { id: "reconhece", competencia: "comunicacao", sinais: ["agradec", "entendo", "ponto importante", "obrigad", "faz sentido", "reconhec", "quero ouvir"], forte: "Você reconheceu a fala sem se defender.", melhoria: "Comece reconhecendo a preocupação antes de responder — isso baixa a tensão.", risco: "Responder na defensiva pode transformar a discordância em disputa de poder diante da equipe." },
      { id: "privado", competencia: "conflitos", sinais: ["a sos", "em particular", "reservad", "depois da reuniao", "conversa individual", "so nos dois", "separado", "1:1", "particular"], forte: "Você levou a discussão para um espaço reservado.", melhoria: "Leve o aprofundamento para uma conversa individual, fora da frente da equipe.", risco: "Discutir em público expõe as duas partes e incentiva outras pessoas a tomar lados." },
      { id: "horario", competencia: "comunicacao", sinais: ["hoje", "amanha", "as 1", "horario", "logo apos", "logo depois", "ainda hoje", "h,", "agendar"], forte: "Você deu um prazo concreto para retomar o assunto.", melhoria: "Combine um horário concreto para retomar o assunto.", risco: "Adiar sem horário pode soar como evitar o assunto para o resto da equipe." },
      { id: "combinado", competencia: "conflitos", sinais: ["combinar", "combino", "acordo", "no futuro", "proxima vez", "forma de discordar", "canal", "como trazer"], forte: "Você combinou como lidar com discordâncias daqui para frente.", melhoria: "Combine com ele como trazer discordâncias no futuro, para o comportamento não se repetir em público." },
    ],
  },
  {
    id: "m-desmotivado",
    tipo: "cenario",
    titulo: "Queda de motivação",
    enunciado:
      "Juliana sempre foi uma das mais engajadas da equipe. Nas últimas três semanas ela chega no horário exato, não participa das reuniões e entregou duas tarefas com atraso.",
    pergunta: "Como você aborda essa situação?",
    competencias: ["desenvolvimento", "inteligencia_emocional"],
    dificuldade: 2,
    exemploResposta:
      "Marco um 1:1 tranquilo, começo dizendo que percebi uma mudança e que estou preocupado com ela, não cobrando. Pergunto como ela está e escuto. Depois falo dos atrasos com fatos e, juntos, combinamos o que eu posso fazer para ajudar e quando voltamos a conversar.",
    rubrica: [
      { id: "conversa", competencia: "desenvolvimento", sinais: ["1:1", "conversa individual", "em particular", "a sos", "chamo ela", "marco uma conversa", "reservad"], forte: "Você buscou uma conversa individual.", melhoria: "Marque uma conversa individual antes de tirar conclusões." },
      { id: "pergunta", competencia: "inteligencia_emocional", sinais: ["pergunto", "como ela esta", "escuto", "ouvir", "entender o que", "perguntar"], forte: "Você abriu espaço para ouvir antes de cobrar.", melhoria: "Pergunte como ela está e escute antes de falar dos atrasos.", risco: "Começar pela cobrança pode fazer a pessoa se fechar." },
      { id: "fatos", competencia: "desenvolvimento", sinais: ["atraso", "fatos", "percebi", "notei", "observei"], forte: "Você trouxe fatos observáveis.", melhoria: "Cite os fatos que você observou (atrasos, participação), sem rótulos como “desinteressada”." },
      { id: "apoio", competencia: "desenvolvimento", sinais: ["ajudar", "apoio", "apoiar", "o que posso fazer", "plano", "acompanh"], forte: "Você ofereceu apoio e um próximo passo.", melhoria: "Termine com um combinado: o que você vai fazer para apoiar e quando voltam a conversar." },
    ],
  },
  {
    id: "m-delegacao",
    tipo: "escolha",
    titulo: "Delegar o relatório mensal",
    enunciado:
      "Você sempre montou o relatório mensal de indicadores, que toma um dia inteiro. Paulo, eletricista com interesse em planejamento, nunca fez esse tipo de tarefa.",
    pergunta: "Qual caminho você escolhe? Justifique.",
    opcoes: [
      "Delego para o Paulo com um exemplo pronto, combino uma revisão no meio do prazo e fico disponível para dúvidas.",
      "Continuo fazendo eu mesmo: é rápido e não tenho tempo para ensinar.",
      "Passo para o Paulo e reviso só no final para não parecer microgerenciamento.",
      "Divido o relatório entre três pessoas para ninguém ficar sobrecarregado.",
    ],
    opcaoRecomendada: 0,
    competencias: ["delegacao", "desenvolvimento"],
    dificuldade: 1,
    exemploResposta:
      "Delego ao Paulo porque conecta com o interesse dele e libera meu tempo. Explico o objetivo do relatório, mostro o do mês passado, combinamos um ponto de checagem na metade do prazo e deixo claro que ele pode decidir o formato dos gráficos.",
    rubrica: [
      { id: "objetivo", competencia: "delegacao", sinais: ["objetivo", "para que serve", "resultado esperado", "explico", "contexto"], forte: "Você explicou o objetivo da tarefa, não só o passo a passo.", melhoria: "Explique para que serve o relatório e o que é um bom resultado." },
      { id: "checagem", competencia: "delegacao", sinais: ["revisao", "meio do prazo", "metade", "checagem", "acompanh", "ponto de controle"], forte: "Você combinou um ponto de checagem.", melhoria: "Combine um ponto de checagem antes do prazo final.", risco: "Revisar só no fim pode gerar retrabalho e frustração." },
      { id: "interesse", competencia: "desenvolvimento", sinais: ["interesse", "crescer", "desenvolv", "aprender", "carreira", "oportunidade"], forte: "Você conectou a tarefa ao desenvolvimento do Paulo.", melhoria: "Mostre como a tarefa conecta com o interesse dele em planejamento." },
      { id: "autonomia", competencia: "delegacao", sinais: ["autonomia", "pode decidir", "liberdade", "do jeito dele", "confian"], forte: "Você deixou claro onde ele tem autonomia.", melhoria: "Deixe claro o que ele pode decidir sozinho." },
    ],
  },
  {
    id: "m-prioridades",
    tipo: "cenario",
    titulo: "Duas urgências ao mesmo tempo",
    enunciado:
      "Às 8h chegam duas demandas: a diretoria quer um levantamento para as 14h e uma equipe de campo pede reforço para uma ocorrência que deixou um bairro sem energia.",
    pergunta: "Como você prioriza e comunica sua decisão?",
    competencias: ["decisao", "comunicacao"],
    dificuldade: 2,
    exemploResposta:
      "Priorizo a ocorrência, que afeta clientes agora e envolve segurança. Remanejo duas pessoas para o campo, aviso a diretoria às 8h30 explicando o motivo e proponho entregar uma versão parcial às 14h e a completa até as 17h.",
    rubrica: [
      { id: "criterio", competencia: "decisao", sinais: ["impacto", "urgencia", "seguranca", "clientes", "criterio", "prioridade", "priorizo"], forte: "Você explicitou o critério de prioridade.", melhoria: "Deixe claro qual critério decidiu a prioridade (impacto, segurança, clientes)." },
      { id: "avisa", competencia: "comunicacao", sinais: ["aviso", "comunico", "informo", "explico", "ligo", "mensagem"], forte: "Você avisou as partes afetadas.", melhoria: "Comunique cedo a quem vai esperar, explicando o motivo.", risco: "Ficar em silêncio faz o atraso parecer descaso." },
      { id: "alternativa", competencia: "decisao", sinais: ["parcial", "proponho", "alternativa", "novo prazo", "negoci", "ate as"], forte: "Você ofereceu uma alternativa para a demanda que ficou em segundo plano.", melhoria: "Proponha uma alternativa (entrega parcial, novo prazo) para a outra demanda." },
    ],
  },
  {
    id: "m-elogio",
    tipo: "mundo_real",
    titulo: "Reconhecimento específico",
    enunciado:
      "Missão no mundo real: hoje, faça um elogio específico a alguém da equipe sobre algo que essa pessoa fez nesta semana.",
    pergunta: "Registre como foi: o que você disse, como a pessoa reagiu e o que você aprendeu.",
    competencias: ["feedback", "desenvolvimento"],
    dificuldade: 1,
    exemploResposta:
      "Disse ao Rafael: “Na ocorrência de terça, você explicou o procedimento ao técnico novo com calma e isso evitou um erro.” Ele ficou surpreso e contou que ninguém tinha percebido. Aprendi que elogio específico vale mais que “bom trabalho”.",
    rubrica: [
      { id: "especifico", competencia: "feedback", sinais: ["quando", "na ocorrencia", "ontem", "terca", "segunda", "quarta", "quinta", "sexta", "na reuniao", "no dia"], forte: "Seu elogio citou uma situação concreta.", melhoria: "Cite a situação concreta: quando e o que a pessoa fez." },
      { id: "impacto", competencia: "feedback", sinais: ["isso", "impacto", "ajudou", "evitou", "fez diferenca", "resultado"], forte: "Você mostrou o impacto do comportamento.", melhoria: "Diga qual foi o impacto do que a pessoa fez." },
      { id: "reflexao", competencia: "desenvolvimento", sinais: ["aprendi", "percebi", "reagiu", "ficou", "reacao"], forte: "Você refletiu sobre a reação e o aprendizado.", melhoria: "Registre como a pessoa reagiu e o que você aprendeu." },
    ],
  },
  {
    id: "m-erro-proprio",
    tipo: "cenario",
    titulo: "O erro foi seu",
    enunciado:
      "Você passou uma informação errada sobre o turno de domingo e dois técnicos foram escalados sem necessidade. Eles estão irritados no grupo da equipe.",
    pergunta: "O que você faz?",
    competencias: ["inteligencia_emocional", "comunicacao"],
    dificuldade: 1,
    exemploResposta:
      "Assumo o erro no grupo sem justificativas longas: “Errei na escala de domingo, desculpem.” Converso com os dois para compensar as horas e explico o que vou mudar para conferir a escala antes de publicar.",
    rubrica: [
      { id: "assume", competencia: "inteligencia_emocional", sinais: ["errei", "assumo", "meu erro", "desculp", "responsabilidade"], forte: "Você assumiu o erro sem rodeios.", melhoria: "Assuma o erro de forma clara e breve.", risco: "Justificar demais soa como transferir a culpa." },
      { id: "repara", competencia: "comunicacao", sinais: ["compens", "banco de horas", "folga", "reparar", "converso com os dois"], forte: "Você buscou reparar o impacto para as pessoas afetadas.", melhoria: "Proponha uma forma de compensar quem foi afetado." },
      { id: "previne", competencia: "inteligencia_emocional", sinais: ["conferir", "checar", "vou mudar", "processo", "nao se repita", "daqui para frente"], forte: "Você mostrou o que muda para não se repetir.", melhoria: "Diga o que vai mudar para o erro não se repetir." },
    ],
  },
  {
    id: "m-metas",
    tipo: "cenario",
    titulo: "Meta escorregando",
    enunciado:
      "Faltam dez dias para o fim do mês e a equipe está em 60% da meta de inspeções. Na semana passada você só olhou o indicador no painel.",
    pergunta: "Como você conduz os próximos dez dias?",
    competencias: ["desempenho", "decisao"],
    dificuldade: 3,
    exemploResposta:
      "Reúno a equipe hoje, mostro o número sem culpar ninguém e pergunto o que está travando. Priorizamos as inspeções de maior risco, redistribuímos as rotas e combinamos um check-in rápido diário de 10 minutos até o fim do mês.",
    rubrica: [
      { id: "transparencia", competencia: "desempenho", sinais: ["mostro", "numero", "indicador", "transparen", "compartilho"], forte: "Você deu transparência ao indicador.", melhoria: "Compartilhe o número com a equipe, sem culpar." },
      { id: "causas", competencia: "desempenho", sinais: ["travando", "causa", "por que", "pergunto", "dificuldade", "obstaculo"], forte: "Você buscou as causas com a equipe.", melhoria: "Pergunte à equipe o que está travando antes de cobrar ritmo." },
      { id: "ritual", competencia: "desempenho", sinais: ["diario", "check-in", "acompanh", "todo dia", "semanal", "ritual"], forte: "Você criou um ritual de acompanhamento.", melhoria: "Crie um acompanhamento curto e frequente até o fim do mês.", risco: "Sem acompanhamento, o desvio só aparece no fechamento." },
      { id: "prioriza", competencia: "decisao", sinais: ["priori", "maior risco", "redistribu", "foco"], forte: "Você priorizou onde concentrar o esforço.", melhoria: "Defina onde concentrar o esforço (ex.: inspeções de maior risco)." },
    ],
  },
  {
    id: "m-feedback-atraso",
    tipo: "cenario",
    titulo: "Atrasos recorrentes",
    enunciado:
      "Carlos chegou atrasado quatro vezes neste mês e a equipe de campo saiu sem ele duas vezes. Ninguém falou nada com ele ainda.",
    pergunta: "Como você conduz a conversa?",
    competencias: ["feedback", "desempenho"],
    dificuldade: 2,
    exemploResposta:
      "Converso com ele a sós ainda hoje: “Carlos, neste mês você chegou depois das 7h em quatro dias, e em dois a equipe saiu sem você, o que atrasou as ordens de serviço.” Pergunto o que está acontecendo, combinamos uma solução e uma data para revisar.",
    rubrica: [
      { id: "privado", competencia: "feedback", sinais: ["a sos", "em particular", "reservad", "1:1", "individual", "so nos dois"], forte: "Você escolheu um espaço reservado.", melhoria: "Faça a conversa em particular." },
      { id: "sci", competencia: "feedback", sinais: ["quatro", "vezes", "dias", "atrasou", "impacto", "equipe saiu"], forte: "Você usou fatos e o impacto (modelo SCI).", melhoria: "Use fatos e impacto: quando aconteceu, o que aconteceu e qual foi a consequência." },
      { id: "escuta", competencia: "feedback", sinais: ["pergunto", "o que esta acontecendo", "escuto", "entender"], forte: "Você perguntou antes de concluir.", melhoria: "Pergunte o que está acontecendo — pode haver um motivo que você não conhece." },
      { id: "combinado", competencia: "desempenho", sinais: ["combinamos", "combinar", "data", "revisar", "acompanh", "proxima semana"], forte: "Você combinou um próximo passo e um acompanhamento.", melhoria: "Combine o próximo passo e quando vão revisar.", risco: "Sem combinado, a conversa vira só desabafo e nada muda." },
    ],
  },

  /* ---------- Desafios de módulo ---------- */
  {
    id: "d-feedback",
    tipo: "cenario",
    foraDoSorteio: true,
    moduloId: "feedback",
    titulo: "Desafio · O feedback que ninguém quer dar",
    enunciado:
      "Ana, sua colega de equipe até o mês passado e hoje sua liderada, entregou um orçamento com erros que chegaram ao cliente. Vocês são amigas e ela costuma levar críticas para o lado pessoal.",
    pergunta: "Escreva como seria a conversa: como você abre, o que diz e como termina.",
    competencias: ["feedback", "inteligencia_emocional"],
    dificuldade: 3,
    exemploResposta:
      "“Ana, quero falar de um assunto de trabalho e separar da nossa amizade. Na terça, o orçamento da obra X foi para o cliente com dois valores errados, e ele questionou nossa confiabilidade. Quero entender o que aconteceu.” Escuto, combinamos uma checagem dupla para os próximos orçamentos e marco 15 minutos na sexta para ver como foi.",
    rubrica: [
      { id: "relacao", competencia: "inteligencia_emocional", sinais: ["amizade", "separar", "papel", "mudou", "relacao", "como lider"], forte: "Você nomeou a mudança na relação.", melhoria: "Nomeie a mudança: agora vocês têm papéis diferentes, e isso não apaga a amizade." },
      { id: "situacao", competencia: "feedback", sinais: ["na terca", "ontem", "orcamento", "quando", "situacao"], forte: "Você descreveu a situação concreta.", melhoria: "Descreva a situação: quando e em qual entrega." },
      { id: "impacto", competencia: "feedback", sinais: ["cliente", "impacto", "confian", "consequencia", "questionou"], forte: "Você mostrou o impacto no cliente.", melhoria: "Mostre o impacto do erro, não só o erro.", risco: "Sem impacto, o feedback parece implicância pessoal." },
      { id: "proximo", competencia: "feedback", sinais: ["combinamos", "checagem", "proximo", "sexta", "acompanh", "revis"], forte: "Você terminou com um combinado e acompanhamento.", melhoria: "Termine com um combinado e uma data para retomar." },
    ],
  },
  {
    id: "d-conflitos",
    tipo: "cenario",
    foraDoSorteio: true,
    moduloId: "conflitos",
    titulo: "Desafio · Dois técnicos que não se falam",
    enunciado:
      "Marcos e Diego tiveram uma discussão há duas semanas sobre a divisão de plantões. Desde então não se falam, e um evita o turno do outro, o que deixou duas noites com equipe incompleta.",
    pergunta: "Descreva como você conduz a situação, passo a passo.",
    competencias: ["conflitos", "comunicacao"],
    dificuldade: 3,
    exemploResposta:
      "Converso com cada um em separado para ouvir sua versão sem julgar. Depois reúno os dois, começo pelo objetivo comum (escala completa e segura), peço que cada um proponha uma regra justa de divisão de plantões e registramos o acordo. Combino revisar em duas semanas.",
    rubrica: [
      { id: "separado", competencia: "conflitos", sinais: ["separad", "cada um", "individual", "a sos"], forte: "Você ouviu cada lado separadamente primeiro.", melhoria: "Ouça cada um em separado antes de reunir os dois." },
      { id: "objetivo", competencia: "comunicacao", sinais: ["objetivo comum", "seguranca", "escala completa", "equipe", "clientes"], forte: "Você ancorou a conversa num objetivo comum.", melhoria: "Comece a conversa conjunta pelo objetivo comum." },
      { id: "acordo", competencia: "conflitos", sinais: ["acordo", "regra", "propor", "proponha", "combin", "registr"], forte: "Você conduziu para um acordo concreto.", melhoria: "Conduza para um acordo concreto e registrado.", risco: "Impor uma solução resolve a escala mas mantém o conflito." },
      { id: "revisar", competencia: "conflitos", sinais: ["revisar", "duas semanas", "acompanh", "voltar a conversar"], forte: "Você definiu quando revisar o acordo.", melhoria: "Defina quando vão revisar o acordo." },
    ],
  },

  /* ---------- Diagnóstico, parte C ---------- */
  {
    id: "diag-aberto",
    tipo: "cenario",
    foraDoSorteio: true,
    titulo: "Diagnóstico · resposta aberta",
    enunciado:
      "Você assumiu a equipe há um mês. Um liderado antigo diz em particular: “O antigo coordenador deixava a gente resolver do nosso jeito. Agora tudo precisa passar por você.”",
    pergunta: "Como você responde e o que faz nas próximas semanas?",
    competencias: ["delegacao", "comunicacao", "feedback"],
    dificuldade: 2,
    exemploResposta:
      "Agradeço a sinceridade e pergunto quais decisões ele sente que travaram. Explico que estou conhecendo o trabalho e combinamos quais assuntos a equipe decide sozinha e quais passam por mim. Em um mês revisamos juntos se a regra está funcionando.",
    rubrica: [
      { id: "acolhe", competencia: "comunicacao", sinais: ["agradec", "sinceridade", "obrigad", "entendo", "faz sentido"], forte: "Você acolheu o feedback.", melhoria: "Agradeça a sinceridade antes de explicar seu lado." },
      { id: "pergunta", competencia: "feedback", sinais: ["pergunto", "quais", "exemplo", "entender"], forte: "Você pediu exemplos concretos.", melhoria: "Peça exemplos de decisões que travaram." },
      { id: "combina", competencia: "delegacao", sinais: ["combinamos", "decide sozinh", "autonomia", "quais assuntos", "regra", "alcada"], forte: "Você definiu com ele o que a equipe decide sozinha.", melhoria: "Combine claramente o que a equipe decide sem você." },
      { id: "revisa", competencia: "delegacao", sinais: ["revisar", "um mes", "acompanh", "testar"], forte: "Você combinou revisar o acordo.", melhoria: "Combine uma data para revisar se o novo combinado funciona." },
    ],
  },
];

export function obterDesafio(id: string): Desafio | undefined {
  return DESAFIOS.find((d) => d.id === id);
}

export function publico(d: Desafio): DesafioPublico {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rubrica, exemploResposta, opcaoRecomendada, ...resto } = d;
  return resto;
}
