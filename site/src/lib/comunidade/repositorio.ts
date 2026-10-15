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
          autor: "Assistente Futuro Líderes",
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
  ];
}

const g = globalThis as unknown as { __forum?: PostForum[] };
const posts = (): PostForum[] => (g.__forum ??= seed());

export interface Filtros {
  tag?: CompetenciaSlug;
  semResposta?: boolean;
  busca?: string;
}

export function listarPosts(f: Filtros = {}): PostForum[] {
  const busca = f.busca?.toLowerCase().trim();
  return posts()
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
