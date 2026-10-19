import "server-only";
import type { CompetenciaSlug, PostForum, RespostaForum } from "@/lib/types";

/**
 * Repositório em memória do fórum (some ao reiniciar o servidor).
 * A interface é a que o back-end real (Supabase: forum_posts / forum_replies) deve implementar.
 */

const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

function seed(): PostForum[] {
  return [
    {
      id: "p1",
      area: "comercial",
      titulo: "Como dar feedback para alguém que era meu colega de time?",
      corpo:
        "Fui promovida há dois meses e preciso corrigir uma entrega de um amigo que agora é meu liderado. Tenho medo de estragar a amizade. Como vocês fizeram?",
      tags: ["feedback"],
      anonimo: true,
      autor: "Anônimo",
      setor: "Comercial",
      criadoEm: horasAtras(50),
      melhorRespostaId: "r1",
      respostas: [
        {
          id: "r1",
          autor: "Ana P.",
          mentor: true,
          corpo:
            "Comece nomeando a mudança: “nossa relação mudou e quero que isso funcione para nós dois”. Depois, fatos e não opiniões. Comigo, a amizade ficou mais madura, não menor.",
          uteis: 23,
          criadoEm: horasAtras(46),
        },
        {
          id: "r2",
          autor: "Bruno T.",
          corpo: "Separe os momentos: café é café, 1:1 é 1:1. E combine com ele que vai ser assim antes do primeiro feedback difícil.",
          uteis: 9,
          criadoEm: horasAtras(40),
        },
      ],
    },
    {
      id: "p2",
      area: "operarios",
      titulo: "Dois técnicos não se falam e isso já afeta os plantões. Intervenho ou espero?",
      corpo: "A briga foi sobre troca de plantão. Já são duas semanas e eles evitam trabalhar no mesmo turno.",
      tags: ["conflitos"],
      anonimo: false,
      autor: "Carlos M.",
      setor: "Distribuição",
      criadoEm: horasAtras(8),
      respostas: [
        {
          id: "r3",
          autor: "Assistente Conecta Líderes",
          isIA: true,
          corpo:
            "Quando o conflito já afeta o trabalho, vale intervir. Converse com cada um em separado antes de reunir os dois, e comece a conversa conjunta pelo objetivo comum: escala completa e segura.",
          uteis: 4,
          criadoEm: horasAtras(2),
        },
      ],
    },
    {
      id: "p3",
      area: "operarios",
      titulo: "Feedback corretivo em equipe de campo: presencial ou por chamada?",
      corpo: "Metade da minha equipe fica em bases diferentes. Vale a pena esperar para falar pessoalmente?",
      tags: ["feedback", "comunicacao"],
      anonimo: false,
      autor: "Lívia R.",
      setor: "Manutenção",
      criadoEm: horasAtras(30),
      respostas: [
        {
          id: "r4",
          autor: "Marcos D.",
          mentor: true,
          corpo: "Chamada de vídeo no mesmo dia é melhor do que presencial uma semana depois. O tempo pesa mais que o canal.",
          uteis: 12,
          criadoEm: horasAtras(28),
        },
      ],
    },
    {
      id: "p4",
      area: "vendas",
      titulo: "Liderado reage mal a qualquer crítica. Por onde começo?",
      corpo: "Toda vez que aponto algo, ele fica na defensiva e o clima fica ruim por dias.",
      tags: ["feedback", "inteligencia_emocional"],
      anonimo: true,
      autor: "Anônimo",
      setor: "Atendimento",
      criadoEm: horasAtras(5),
      respostas: [],
    },
    {
      id: "p5",
      area: "marketing",
      titulo: "Como vocês organizam o 1:1 com equipes grandes?",
      corpo: "Tenho 14 pessoas. Não consigo fazer 1:1 semanal com todo mundo.",
      tags: ["desenvolvimento"],
      anonimo: false,
      autor: "Renata S.",
      setor: "Distribuição",
      criadoEm: horasAtras(72),
      respostas: [
        {
          id: "r5",
          autor: "Ana P.",
          mentor: true,
          corpo: "Quinzenal de 20 minutos funciona melhor do que semanal que vive sendo cancelado. Deixe a pauta com a pessoa.",
          uteis: 15,
          criadoEm: horasAtras(70),
        },
      ],
    },
    {
      id: "p6",
      area: "comercial",
      titulo: "Cliente importante reclamou do prazo na frente do meu time. Como protejo a equipe sem ser ríspido?",
      corpo: "Foi numa reunião aberta e o tom ficou pesado. Meu time saiu desmotivado e eu não soube o que dizer na hora.",
      tags: ["comunicacao", "inteligencia_emocional"],
      anonimo: false,
      autor: "Paulo V.",
      setor: "Comercial",
      criadoEm: horasAtras(12),
      respostas: [
        {
          id: "r6",
          autor: "Ana P.",
          mentor: true,
          corpo: "Assuma a conversa com o cliente no mesmo dia e, com o time, reconheça o desconforto antes de explicar o plano. Proteger não é defender tudo, é assumir a frente.",
          uteis: 8,
          criadoEm: horasAtras(9),
        },
      ],
    },
    {
      id: "p7",
      area: "vendas",
      titulo: "A meta do mês está longe e o time se compara demais. Como motivar sem pressionar?",
      corpo: "Quando divulgo o ranking, uns se animam e outros travam. Não quero tirar a transparência, mas também não quero criar clima ruim.",
      tags: ["desempenho", "desenvolvimento"],
      anonimo: true,
      autor: "Anônimo",
      setor: "Vendas",
      criadoEm: horasAtras(20),
      respostas: [],
    },
    {
      id: "p8",
      area: "marketing",
      titulo: "Como dizer “não” a uma campanha de última hora sem desgastar a relação com outras áreas?",
      corpo: "Chegam pedidos urgentes toda semana e a equipe já está no limite. Cada “não” vira conversa difícil.",
      tags: ["decisao", "comunicacao"],
      anonimo: false,
      autor: "Débora L.",
      setor: "Marketing",
      criadoEm: horasAtras(26),
      respostas: [
        {
          id: "r7",
          autor: "Bruno T.",
          corpo: "Troque o “não” por uma escolha: “consigo entregar A ou B nesse prazo, qual é mais importante para você?”. A prioridade passa a ser decisão de quem pediu.",
          uteis: 14,
          criadoEm: horasAtras(22),
        },
      ],
    },
    {
      id: "p9",
      area: "operarios",
      titulo: "Passagem de turno sempre atrasa e o próximo turno começa no susto. O que mudar?",
      corpo: "A equipe sai correndo e informações importantes se perdem. Já tentei cobrar, mas piora quando o tempo aperta.",
      tags: ["delegacao", "comunicacao"],
      anonimo: false,
      autor: "Marcos D.",
      setor: "Operações",
      criadoEm: horasAtras(36),
      respostas: [],
    },
  ];
}

const g = globalThis as unknown as { __forum?: PostForum[] };
const posts = (): PostForum[] => (g.__forum ??= seed());

export interface Filtros {
  /** Slug da área da empresa (escudo selecionado). */
  area?: string;
  tag?: CompetenciaSlug;
  semResposta?: boolean;
  busca?: string;
}

export function listarPosts(f: Filtros = {}): PostForum[] {
  const busca = f.busca?.toLowerCase().trim();
  return posts()
    .filter((p) => !f.area || p.area === f.area)
    .filter((p) => !f.tag || p.tags.includes(f.tag))
    .filter((p) => !f.semResposta || p.respostas.length === 0)
    .filter((p) => !busca || `${p.titulo} ${p.corpo}`.toLowerCase().includes(busca))
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export function obterPost(id: string) {
  return posts().find((p) => p.id === id);
}

export function criarPost(dados: Omit<PostForum, "id" | "criadoEm" | "respostas">): PostForum {
  const post: PostForum = { ...dados, id: crypto.randomUUID(), criadoEm: new Date().toISOString(), respostas: [] };
  posts().unshift(post);
  return post;
}

export function responder(postId: string, dados: Pick<RespostaForum, "autor" | "corpo">): RespostaForum | null {
  const post = obterPost(postId);
  if (!post) return null;
  const r: RespostaForum = { ...dados, id: crypto.randomUUID(), uteis: 0, criadoEm: new Date().toISOString() };
  post.respostas.push(r);
  return r;
}

export function marcarUtil(postId: string, respostaId: string) {
  const r = obterPost(postId)?.respostas.find((x) => x.id === respostaId);
  if (r) r.uteis += 1;
  return r ?? null;
}

export function marcarMelhor(postId: string, respostaId: string) {
  const post = obterPost(postId);
  if (!post?.respostas.some((r) => r.id === respostaId)) return null;
  post.melhorRespostaId = respostaId;
  return post;
}

/**
 * Checagem simples de dados pessoais antes de publicar (a moderação por IA completa fica para depois).
 */
export function verificarDadosPessoais(texto: string): string | null {
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(texto)) return "Seu texto parece conter um e-mail.";
  if (/(\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}/.test(texto)) return "Seu texto parece conter um telefone.";
  if (/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/.test(texto)) return "Seu texto parece conter um CPF.";
  return null;
}
