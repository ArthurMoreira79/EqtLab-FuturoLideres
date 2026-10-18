import type { DadosCadastro, UsuarioPublico } from "@/lib/cadastro";
import type { DiagnosticoSalvo, RespostasDiagnostico } from "@/lib/diagnostico";
import { acoes } from "@/lib/estado";

/** Funções do navegador para as rotas de autenticação e de cadastro em etapas. */

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
    readonly codigo?: string,
    readonly campos?: Record<string, string>,
  ) {
    super(mensagem);
  }
}

async function chamar<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ErroApi("Sem conexão com o servidor. Verifique a internet e tente de novo.", 0);
  }
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new ErroApi(dados.erro ?? "Algo deu errado. Tente novamente.", r.status, dados.codigo, dados.campos);
  return dados as T;
}

export interface RascunhoSalvo {
  fase: number;
  dados: Partial<DadosCadastro>;
}

export const authApi = {
  lerRascunho: () => chamar<{ rascunho: RascunhoSalvo | null }>("/api/cadastro/rascunho").then((r) => r.rascunho),

  salvarEtapa: (etapa: number, dados: unknown) =>
    chamar<{ fase: number }>("/api/cadastro/rascunho", { method: "PUT", body: JSON.stringify({ etapa, dados }) }),

  concluir: (senha: string) =>
    chamar<{ usuario: UsuarioPublico }>("/api/cadastro/concluir", { method: "POST", body: JSON.stringify({ senha }) }),

  login: (email: string, senha: string) =>
    chamar<{ usuario: UsuarioPublico }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) }),

  logout: () => chamar<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  salvarDiagnostico: (respostas: RespostasDiagnostico) =>
    chamar<{ diagnostico: DiagnosticoSalvo }>("/api/diagnostico", { method: "POST", body: JSON.stringify({ respostas }) }).then(
      (r) => r.diagnostico,
    ),

  ultimoDiagnostico: () => chamar<{ diagnostico: DiagnosticoSalvo | null }>("/api/diagnostico").then((r) => r.diagnostico),

  eu: () => chamar<{ usuario: UsuarioPublico }>("/api/auth/eu").then((r) => r.usuario),
};

/** Converte a conta do servidor no perfil que o app guarda no navegador. */
export function perfilDoUsuario(u: UsuarioPublico) {
  return {
    nome: u.nome,
    email: u.email,
    cargo: u.cargo,
    setor: u.setor,
    tipoEquipe: u.tipoEquipe,
    tamanhoEquipe: u.tamanhoEquipe,
    mesesLideranca: u.mesesLideranca,
    modeloTrabalho: u.modeloTrabalho,
    desafios: [...u.desafios],
  };
}

/**
 * Sai da conta: revoga a sessão no servidor e apaga o progresso guardado neste navegador.
 * Se o servidor não responder, o cookie expira sozinho; mesmo assim a pessoa sai aqui.
 */
export async function sairDaConta() {
  await authApi.logout().catch(() => {});
  acoes.sair();
}
