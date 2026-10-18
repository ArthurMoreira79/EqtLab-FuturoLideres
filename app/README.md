# Futuro Líderes · EQT Lab

Plataforma de desenvolvimento para líderes recém-promovidos (Desafio 6 do Hackathon Equatorial).
Especificação completa: [`../prompt-futuros-lideres.md`](../prompt-futuros-lideres.md).

## Rodando

```bash
docker compose up -d               # na raiz do repositório: sobe o Postgres (porta 5434)
cd app
pnpm install
cp .env.example .env.local         # preencha o JWT_SECRET: openssl rand -base64 48
pnpm dev
```

A IA continua simulada por padrão. O banco é necessário para **criar conta e entrar**; o modo demonstração funciona sem ele.

Abra http://localhost:3000 e use **Explorar com dados de demonstração** (usuária com 3 semanas de histórico) ou **Criar meu perfil** para o fluxo completo de cadastro → diagnóstico.

Stack: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Zod · lucide-react · next-themes.

## O que está pronto

| Tela | Rota | Notas |
|---|---|---|
| Boas-vindas | `/` | Criar perfil ou carregar demo |
| Entrar | `/entrar` | Login com e-mail e senha (sessão por JWT) |
| Cadastro / perfil profissional | `/cadastro` | 4 fases, cada uma salva no banco; só a senha no fim |
| Tour “como funciona” | `/bem-vindo` | Primeiro acesso de contas novas; dá para rever em “Como funciona” no menu |
| Diagnóstico rápido | `/diagnostico` | 4 perguntas de marcar; respostas e notas salvas no PostgreSQL ao concluir |
| Resultado com barras animadas | `/resultado` | Trilha ordenada pelo diagnóstico |
| Painel (dashboard) | `/inicio` | Trilha em “caminho” (cada passo é um ponto), missão do dia, **constância** semanal, radar, relatório da IA, equipe, comunidade |
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
| GET / PUT | `/api/cadastro/rascunho` | Lê / grava o cadastro **a cada fase** (rascunho no banco, preso a um cookie) |
| POST | `/api/cadastro/concluir` | Recebe só a senha, cria a conta e abre a sessão |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/eu` | Login, logout (revoga a sessão) e “quem sou eu” |
| GET / POST | `/api/diagnostico` | Recupera o último diagnóstico / valida as 4 respostas, calcula notas e salva em transação |
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

## Persistência e autenticação

O que já vai para o **PostgreSQL** (tabelas criadas sozinhas na primeira requisição, veja `src/lib/db/index.ts`):

| Tabela | Para quê |
|---|---|
| `cadastros_rascunho` | Cada fase do cadastro é gravada ao avançar; dá para fechar a aba e retomar. Expira em 7 dias |
| `usuarios` | Conta criada no fim, só com a senha (hash **scrypt** com sal) |
| `sessoes` | Uma linha por login; o JWT carrega o id dela, então o logout **revoga** de verdade |
| `limites_taxa` | Contadores do rate limit (no banco, valem para todas as instâncias) |
| `diagnosticos` | Usuário, versão do questionário, tipo, ordem da trilha e data |
| `diagnostico_respostas` | Uma alternativa por pergunta; cópia do enunciado e da alternativa para histórico |
| `pontuacoes_competencia` | Notas calculadas no servidor, vinculadas à pessoa e ao diagnóstico |

**Sessão:** JWT HS256 (`jose`) em cookie `HttpOnly`, `SameSite=Lax` (e `Secure` em produção), 7 dias, validado também contra a tabela `sessoes`. Requer `JWT_SECRET` (≥ 32 caracteres; em produção a aplicação se recusa a subir sem ele).

**Proteções:** validação com Zod no cliente **e** no servidor (`src/lib/cadastro.ts`, objetos `.strict()`); rate limit no login (30/15 min por IP e 8/15 min por conta), no cadastro (60/10 min por IP; conclusão 10/h) com `429 + Retry-After`; mesma mensagem para “e-mail inexistente” e “senha errada” (e tempo equalizado); checagem de `Origin`; corpo limitado a 8 KB.

> O rascunho do diagnóstico fica neste navegador, isolado por conta. Ao concluir, as quatro respostas, as oito notas e a ordem da trilha são gravadas juntas no PostgreSQL; só após a confirmação a tela avança. No login em outro dispositivo, o diagnóstico é recuperado. O modo demonstração continua local. XP, progresso de missões, equipe e comunidade ainda ficam no navegador. Cada ação de `estado.ts` corresponde a uma tabela do modelo de dados (seção 7 da especificação), e o `usuarioId` já é guardado junto para facilitar essa migração.

## Scripts

```bash
npm run dev     # desenvolvimento
npm run build   # build de produção
npm run lint    # ESLint (inclui regras do React Compiler)
```

## Controle do schema com Drizzle

A fonte das tabelas é [`src/lib/db/schema.ts`](src/lib/db/schema.ts). As migrações SQL e snapshots ficam em [`drizzle/`](drizzle/). Para alterar o banco, edite o schema, rode `pnpm db:generate`, revise o SQL e rode `pnpm db:migrate`. Use `pnpm db:check` para verificar a sequência e `pnpm db:studio` para inspecionar os dados. O app também aplica migrações pendentes na primeira requisição ao banco.

Relacionamentos: `usuarios` → `sessoes`, `diagnosticos` e `pontuacoes_competencia`; `diagnosticos` → `diagnostico_respostas` e `pontuacoes_competencia`. A chave composta impede respostas duplicadas à mesma pergunta, e cada diagnóstico tem no máximo uma nota por competência. O banco restringe notas a 0–5 e alternativas a índices não negativos; a API valida os IDs e o limite de alternativas de cada pergunta.

O questionário atual tem versão 2. Registros antigos preservam a versão 1 e podem ter os textos históricos nulos. As notas são indicadores das alternativas escolhidas; competências sem evidência nas quatro respostas recebem o valor neutro 2,5. O resultado não representa módulos concluídos: a trilha começa do básico.

## Teste da Clara falando (D-ID)

No primeiro acesso ao dashboard, um modal apresenta a Clara e a plataforma. Fechar, usar Escape ou tocar em “Vamos começar!” registra a apresentação como vista por conta neste navegador, inclusive após sair e entrar. O botão “Boas-vindas da Clara” permite rever. O áudio começa apenas ao tocar em “Ouvir a Clara” e para ao fechar o modal ou sair da página.

Sem vídeo, a prévia usa a voz em português do navegador, se disponível, com a imagem da Clara e animação leve durante a fala. **Essa prévia não tem sincronização labial.**

Para gerar o teste real, configure `DID_API_KEY` em `.env.local` e execute `pnpm clara:video` na pasta `app`. O script envia a cena horizontal `public/clara/boas-vindas-cenario.png` para a D-ID, solicita a narração com `pt-BR-FranciscaNeural`, acompanha a geração e baixa o MP4 e legendas aproximadas para `public/clara/boas-vindas-cenario.mp4` e `public/clara/boas-vindas.vtt`. Confira visualmente o resultado: a detecção facial pode não funcionar bem com personagens ilustrados. A credencial fica apenas no script local; o navegador nunca recebe a chave.

O texto está em `src/lib/conteudo/boas-vindas.json`. Cada geração usa créditos da conta D-ID; acessar o dashboard apenas reproduz o arquivo pronto. Se o vídeo já existir, o script não gera outro sem `--force`. Se a geração demorar, use o `DID_TALK_ID` exibido para retomar sem nova solicitação. O vídeo é baixado porque a URL de resultado da D-ID é temporária. As legendas são estimadas por trecho e devem ser revisadas antes de publicar.

Referências: [Photo Avatars](https://docs.d-id.com/docs/v2-photo-avatar-quickstart), [upload de imagem](https://docs.d-id.com/reference/upload-an-image).

A versão com cenário usa `config.stitch: true` para preservar o enquadramento da imagem, com o rosto animado sobre corpo e ambiente. O modal mostra o vídeo em 16:9 sem cortar a imagem. Corpo e cenário são estáticos; a animação continua sendo facial. A versão anterior fica preservada em `public/clara/boas-vindas.mp4`, e a API prefere a versão com cenário quando ela existe. A imagem foi criada com a ferramenta image_gen integrada; o prompt está em `scripts/clara-cenario-prompt.md`.
