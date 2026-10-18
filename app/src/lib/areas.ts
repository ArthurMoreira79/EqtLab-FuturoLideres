/**
 * Áreas da empresa (os “escudos” da Comunidade). A fonte oficial é a tabela `areas` do banco;
 * esta lista é o espelho do que a migração semeia e serve de reserva quando o banco não responde
 * (ex.: modo demonstração), para a tela nunca ficar vazia.
 */

export type ProvedorReuniao = "meet" | "teams";

export interface Area {
  slug: string;
  nome: string;
  descricao: string;
  /** Cor do escudo (#rrggbb). */
  cor: string;
  ordem: number;
  /** Link da reunião da área (sempre https). Nulo se a área não tiver reunião. */
  reuniao: { provedor: ProvedorReuniao; titulo: string; url: string } | null;
}

export const ROTULO_PROVEDOR: Record<ProvedorReuniao, string> = { meet: "Google Meet", teams: "Microsoft Teams" };

export const AREAS_PADRAO: Area[] = [
  {
    slug: "comercial",
    nome: "Comercial",
    descricao: "Relacionamento com clientes e parcerias.",
    cor: "#1b8fe6",
    ordem: 1,
    reuniao: { provedor: "meet", titulo: "Daily do Comercial", url: "https://meet.google.com/new" },
  },
  {
    slug: "vendas",
    nome: "Vendas",
    descricao: "Metas, funil e negociação.",
    cor: "#16a34a",
    ordem: 2,
    reuniao: { provedor: "teams", titulo: "Reunião de Vendas", url: "https://teams.microsoft.com/" },
  },
  {
    slug: "marketing",
    nome: "Marketing",
    descricao: "Marca, campanhas e comunicação.",
    cor: "#c026d3",
    ordem: 3,
    reuniao: { provedor: "meet", titulo: "Alinhamento de Marketing", url: "https://meet.google.com/new" },
  },
  {
    slug: "operarios",
    nome: "Operários",
    descricao: "Campo, manutenção e operações.",
    cor: "#ea580c",
    ordem: 4,
    reuniao: { provedor: "teams", titulo: "Passagem de turno", url: "https://teams.microsoft.com/" },
  },
];

export const AREA_INICIAL = AREAS_PADRAO[0].slug;

/** Só abre links https. Protege contra um valor ruim no banco (ex.: `javascript:`). */
export function urlSegura(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
