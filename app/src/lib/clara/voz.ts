/** Interfaces mínimas: SpeechRecognition ainda não existe em todos os navegadores. */
export interface ReconhecimentoVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((evento: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type ConstrutorReconhecimento = new () => ReconhecimentoVoz;
export function reconhecimentoDisponivel(): ConstrutorReconhecimento | undefined {
  if (typeof window === "undefined") return undefined;
  const navegador = window as unknown as { SpeechRecognition?: ConstrutorReconhecimento; webkitSpeechRecognition?: ConstrutorReconhecimento };
  return navegador.SpeechRecognition ?? navegador.webkitSpeechRecognition;
}

/** Uma fala por vez. Cancelar remove callbacks antes de abortar, impedindo envio tardio. */
export function escutarVoz(Construtor: ConstrutorReconhecimento, eventos: {
  transcrever: (texto: string) => void;
  enviar: (texto: string) => void;
  erro: (texto: string) => void;
  terminar: () => void;
}) {
  const reconhecimento = new Construtor();
  reconhecimento.lang = "pt-BR";
  reconhecimento.continuous = false;
  reconhecimento.interimResults = true;
  let final = "";
  let falhou = false;
  let ativo = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancelar() {
    ativo = false;
    clearTimeout(timer);
    reconhecimento.onresult = reconhecimento.onerror = reconhecimento.onend = null;
    reconhecimento.abort();
  }
  reconhecimento.onresult = ({ results }) => {
    if (!ativo) return;
    const partes = Array.from(results);
    final = partes.filter((r) => r.isFinal).map((r) => r[0].transcript).join(" ").trim();
    const texto = partes.map((r) => r[0].transcript).join(" ").trim();
    eventos.transcrever(texto.slice(0, 800));
    if (texto.length > 800) {
      falhou = true;
      eventos.erro("Sua fala passou de 800 caracteres. Revise o texto antes de enviar.");
      reconhecimento.stop();
    }
  };
  reconhecimento.onerror = ({ error }) => {
    if (!ativo) return;
    falhou = true;
    const erros: Record<string, string> = {
      "not-allowed": "Permita o acesso ao microfone no navegador para falar com a Clara.",
      "service-not-allowed": "O navegador não permite o reconhecimento de voz. Use o chat por texto.",
      "audio-capture": "Não encontrei um microfone disponível. Confira a conexão do dispositivo.",
      "no-speech": "Não consegui ouvir sua fala. Toque no microfone e tente novamente.",
      network: "A transcrição de voz está sem conexão. Tente novamente ou digite sua mensagem.",
    };
    if (error !== "aborted") eventos.erro(erros[error] ?? "Não consegui transcrever. Tente novamente ou use o texto.");
  };
  reconhecimento.onend = () => {
    if (!ativo) return;
    ativo = false;
    clearTimeout(timer);
    eventos.terminar();
    if (!falhou && final) eventos.enviar(final);
    else if (!falhou) eventos.erro("Não consegui reconhecer uma frase. Tente novamente ou digite sua mensagem.");
  };
  try {
    reconhecimento.start();
    timer = setTimeout(() => { if (ativo) reconhecimento.stop(); }, 40_000);
  } catch {
    cancelar();
    eventos.terminar();
    eventos.erro("Não foi possível iniciar o microfone. Confira a permissão do navegador.");
  }
  return { parar: () => { if (ativo) reconhecimento.stop(); }, cancelar };
}

/** Solicita a permissão nativa e libera imediatamente o stream usado na verificação. */
export async function solicitarPermissaoMicrofone(
  dispositivos: Pick<MediaDevices, "getUserMedia">,
): Promise<void> {
  const stream = await dispositivos.getUserMedia({ audio: true, video: false });
  stream.getTracks().forEach((track) => track.stop());
}

export function mensagemErroMicrofone(erro: unknown): string {
  const nome = (erro as { name?: string })?.name;
  if (nome === "NotAllowedError" || nome === "SecurityError") return "O acesso ao microfone foi bloqueado. No ícone de permissões ao lado do endereço, permita o microfone para este site e tente novamente. Se estiver na prévia do aplicativo, abra a página no navegador.";
  if (nome === "NotFoundError") return "Não encontrei um microfone. Conecte um dispositivo e tente novamente.";
  if (nome === "NotReadableError" || nome === "AbortError") return "Não consegui acessar o microfone. Confira se outro aplicativo está usando o dispositivo e tente novamente.";
  return "Não foi possível solicitar o microfone. Confira as permissões do navegador e do sistema.";
}
