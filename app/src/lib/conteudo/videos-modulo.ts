import conflitos from "./video-modulo-conflitos.json";
import feedback from "./video-modulo-feedback.json";

/**
 * Vídeos da Clara por módulo. O arquivo fica em `public/clara/modulo-<id>.mp4` (+ `.vtt`) e é gerado
 * uma vez com `pnpm clara:video <id>`. Para um módulo novo: JSON com a fala, entrada no script e aqui.
 */
export const VIDEOS_MODULO: Record<string, { titulo: string; trechos: string[] }> = { feedback, conflitos };
