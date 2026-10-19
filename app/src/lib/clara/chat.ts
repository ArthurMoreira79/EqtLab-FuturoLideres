import { z } from "zod";
import { obterModulo } from "@/lib/conteudo/modulos";

export const pedidoChatSchema = z.object({
  mensagens: z.array(z.object({ papel: z.enum(["usuario", "clara"]), texto: z.string().trim().min(1).max(800) }).strict()).min(1).max(8),
  moduloId: z.string().max(80).optional(),
}).strict().refine((v) => v.mensagens.at(-1)?.papel === "usuario", "Envie uma pergunta para a Clara.");
export const respostaChatSchema = z.object({ resposta: z.string().trim().min(1).max(3000) });
export type PedidoChat = z.infer<typeof pedidoChatSchema>;
export type MensagemClara = PedidoChat["mensagens"][number];

/** Respostas locais para a demonstração e o provedor simulado, sem fingir uma chamada a um modelo. */
export function respostaGuiada(pedido: PedidoChat): string {
  const pergunta = pedido.mensagens.at(-1)!.texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/etapa|modulo|trilha|proxim|continu/.test(pergunta)) return "Cada módulo reúne etapas: lições, quiz e desafio prático. Faça uma etapa por vez. O painel e a página Trilha mostram o mesmo próximo passo; toque em Continuar para abrir esse ponto. Ao concluir o desafio com nota 3 ou mais, você libera o próximo módulo com conteúdo disponível.";
  if (/sci|feedback|conversa dificil/.test(pergunta)) return "Para dar feedback, use SCI: Situação (quando e onde), Comportamento (o que aconteceu, sem rótulos) e Impacto (a consequência). Exemplo: ‘Na reunião de ontem, você interrompeu a Juliana três vezes e não conseguimos ouvir a proposta dela.’ Depois, pergunte como a pessoa viu o caso e combinem uma ação e uma data de retorno.";
  if (/conflito|discuss|briga/.test(pergunta)) return "Comece ouvindo cada pessoa em separado, sem tomar partido. Pergunte o que aconteceu e o que seria justo. Depois, reúna as partes com um objetivo comum, combinem uma ação e marquem quando revisar o acordo.";
  if (/equipe|grupo|colega|email|e-mail/.test(pergunta)) return "Em Minha equipe, toque em Adicionar e procure o e-mail do colega. Você verá nome e avatar quando houver uma conta cadastrada. A pessoa aceita o convite na Comunidade; depois disso vocês podem conversar no grupo privado.";
  if (/xp|ponto|nota|quiz/.test(pergunta)) return "Cada lição concluída vale 10 XP, o quiz vale 20 XP na primeira conclusão e o desafio vale 60 XP. Você pode rever as lições sem duplicar a recompensa. A nota mínima do desafio para concluir o módulo é 3.";
  const modulo = pedido.moduloId ? obterModulo(pedido.moduloId) : undefined;
  if (modulo?.licoes[0]) return `Nesta tela você está no módulo ${modulo.titulo}. ${modulo.licoes[0].paragrafos[0]} Posso explicar o tema ou ajudar a encontrar a próxima etapa. Experimente perguntar sobre feedback, conflitos, etapas da trilha ou sua equipe.`;
  return "Sou a Clara! Neste modo guiado, posso orientar sobre as etapas da trilha, feedback, conflitos, XP e grupos da equipe. Sobre qual desses assuntos você quer conversar?";
}
