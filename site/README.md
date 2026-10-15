# Futuro Líderes · EQT Lab

Plataforma de desenvolvimento para líderes recém-promovidos (Desafio 6 do Hackathon Equatorial).
Especificação completa: [`../prompt-futuros-lideres.md`](../prompt-futuros-lideres.md).

## Rodando

```bash
npm install
cp .env.example .env.local   # opcional: por padrão a IA é simulada
npm run dev
```

Abra http://localhost:3000 e use **Explorar com dados de demonstração** (usuária com 3 semanas de histórico) ou **Criar meu perfil** para o fluxo completo de cadastro → diagnóstico.

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Zod · lucide-react · next-themes.

## O que está pronto

| Tela | Rota | Notas |
|---|---|---|
| Boas-vindas | `/` | Criar perfil ou carregar demo |
| Cadastro / perfil profissional | `/cadastro` | |
| Diagnóstico (partes A, B, C) | `/diagnostico` | Salvamento parcial; parte C avaliada pela IA |
| Resultado com radar | `/resultado` | Trilha ordenada pelo diagnóstico |
| Home (dashboard) | `/inicio` | Missão do dia, radar antes × agora, relatório da IA, trilha, equipe, comunidade |
| Trilha | `/trilha`, `/trilha/[modulo]` | 2 módulos completos (Feedback, Conflitos): lições + quiz + desafio |
| Missão do dia | `/missao` | Cenário aberto, escolha + justificativa, mundo real; trocar 1×/dia, pular |
| Comunidade | `/comunidade`, `/comunidade/nova`, `/comunidade/[id]` | Anônimo, útil, melhor resposta, resposta da IA |
| Perfil e evolução | `/perfil` | Evolução por competência, conquistas, histórico com feedbacks, tema |

Tema claro/escuro (paleta Equatorial), mobile-first (navegação inferior no celular, menu lateral no desktop).

## Arquitetura

```
src/
  app/
    (app)/…            telas internas (protegidas pelo AppShell)
    api/               back-end mínimo (Route Handlers)
  components/          UI compartilhada (AppShell, Radar, FeedbackView, RespostaDesafio…)
  lib/
    competencias.ts    matriz de competências, níveis, ordem da trilha
    conteudo/          desafios (só servidor), módulos/lições/quiz, diagnóstico
    ia/                camada de IA plugável (veja abaixo)
    comunidade/        repositório do fórum (em memória)
    missao/            sorteio ponderado da missão do dia
    estado.ts          estado do usuário no navegador (localStorage)
    demo.ts            dados de demonstração
```

### API

| Método | Rota | Função |
|---|---|---|
| POST | `/api/avaliar` | Avalia resposta de missão/desafio/diagnóstico → feedback JSON (seção 6.1) |
| POST | `/api/relatorio` | Gera o relatório “Seu momento como líder” (seção 6.2) |
| POST | `/api/missao-do-dia` | Sorteia a missão com aleatoriedade ponderada (prioriza competências fracas, evita repetir) |
| GET | `/api/desafios/:id` | Versão pública do desafio (sem rubrica nem exemplo de resposta) |
| GET/POST | `/api/comunidade` | Lista (filtros `tag`, `semResposta`, `q`) / cria tópico (bloqueia e-mail, telefone, CPF) |
| GET/POST | `/api/comunidade/:id` | Detalhe / `acao: responder \| util \| melhor` |

Toda entrada é validada com Zod; toda saída de IA é validada com Zod antes de chegar à tela (erro amigável em caso de formato inválido).

## IA plugável

A IA ainda não foi escolhida, então a avaliação passa por um contrato (`src/lib/ia/provedor.ts`):

```ts
interface ProvedorIA {
  nome: string;
  avaliar(entrada: EntradaAvaliacao): Promise<unknown>;   // validado por avaliacaoSchema
  gerarRelatorio(pedido: PedidoRelatorio): Promise<unknown>; // validado por relatorioSchema
}
```

Provedores disponíveis (variável `IA_PROVEDOR`):

- **`simulado`** (padrão) — sem chamadas externas. Procura na resposta os “sinais” de cada critério da rubrica e devolve o mesmo JSON que uma IA real, citando trechos da resposta. Ideal para testes e para a demo offline.
- **`compativel-openai`** — qualquer API no formato `chat/completions` (OpenAI, OpenRouter, Groq, Ollama, LM Studio…). Configure `IA_BASE_URL`, `IA_API_KEY` e `IA_MODELO`.

Para outra IA (ex.: Anthropic, Gemini): crie `src/lib/ia/<nome>.ts` implementando `ProvedorIA`, reaproveite os prompts de `src/lib/ia/prompts.ts` e adicione um `case` em `obterProvedor()`.
Os prompts já seguem as regras da especificação: avaliação só pela rubrica, tom de coach, sem julgar a pessoa, pedir para desenvolver respostas curtas e proteção contra prompt injection (resposta do usuário entre marcadores com nonce).

## Para a equipe de back-end

Hoje os dados do usuário ficam no **localStorage** (`src/lib/estado.ts`) e o fórum fica **em memória no servidor** (reinicia junto com o servidor). Cada ação já corresponde a uma tabela do modelo de dados (seção 7):

| Front hoje (`acoes.*` em `estado.ts`) | Tabela no Supabase |
|---|---|
| `criarConta`, `atualizarPerfil` | `users` |
| `concluirDiagnostico` | `assessments`, `competency_scores` |
| `registrarSubmissao`, `contestar` | `submissions`, `competency_scores`, `xp_events` |
| `marcarLicao`, `salvarQuiz` | `user_modules` |
| `definirMissao`, `pularMissao` | `daily_missions` |
| `salvarRelatorio` | `ai_reports` |
| `adicionarMembro`, `atualizarMembro`, `removerMembro` | `team_members` |
| `repositorio.ts` (comunidade) | `forum_posts`, `forum_replies` |

Sugestão de migração: trocar o corpo de cada ação por uma chamada à API/Supabase mantendo as mesmas assinaturas, e trocar `useEstado()` por um hook que lê do servidor. As telas não precisam mudar.

Regras de negócio já implementadas no front e que devem migrar para o servidor: atualização de pontuação após feedback (média móvel 80/20), XP por atividade, sequência que congela no primeiro dia perdido, limite de 1 troca de missão por dia, nota mínima 7 para concluir módulo.

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run lint    # ESLint (inclui regras do React Compiler)
```
