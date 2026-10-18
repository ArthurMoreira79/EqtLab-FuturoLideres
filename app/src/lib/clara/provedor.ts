import "server-only";
import { obterProvedor } from "@/lib/ia/provedor";
import { provedorCompativelOpenAI } from "@/lib/ia/compativel-openai";

/** A chave do chat não altera o provedor de avaliação e relatórios. */
export async function obterProvedorChat() {
  const chave = process.env.GEMINI_API_KEY?.trim();
  if (!chave) return obterProvedor();
  return provedorCompativelOpenAI({
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    modelo: process.env.GEMINI_CHAT_MODEL?.trim() || "gemini-3.8-flash",
    chave,
  });
}
