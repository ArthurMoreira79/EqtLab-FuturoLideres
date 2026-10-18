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
| Trilha | `/trilha`, `/trilha/[modulo]` | Caminho em pontos (lição, quiz, baú de desafio) com todos os módulos; a Clara acompanha o ponto atual e pula até o que você apontar. Cada módulo tem lições + quiz + desafio |
| Missão do dia | `/missao` | Cenário aberto, escolha + justificativa, mundo real; trocar 1×/dia, pular |
| Comunidade | `/comunidade`, `/comunidade/nova`, `/comunidade/[id]` | Anônimo, útil, melhor resposta, resposta da IA |
| Perfil | `/perfil` | Estilo Duolingo: avatar (editável, masculino/feminino), estatísticas com XP, conquistas com níveis e histórico. Gráficos de evolução ficam recolhidos |

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
| PUT | `/api/perfil/avatar` | Salva o avatar (emblema do perfil) da conta; cada peça é validada no servidor |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/eu` | Login, logout (revoga a sessão) e “quem sou eu” |
| GET / POST | `/api/diagnostico` | Recupera o último diagnóstico / valida as 4 respostas, calcula notas e salva em transação |
| GET | `/api/desafios/:id` | Versão pública do desafio (sem rubrica nem exemplo de resposta) |
| GET | `/api/areas` | Áreas da empresa (Comercial, Vendas, Marketing, Operários) com o link da reunião de cada uma |
| POST | `/api/salas` | **Admin** cria a sala de jogo (título, área, contagem, perguntas) e recebe o código de 6 dígitos |
| POST | `/api/salas/entrar` | Entra na sala pelo código (o QR code leva à mesma sala) |
| GET | `/api/salas/:codigo` | Estado da sala: fase, pergunta, participantes e placar (a tela consulta a cada segundo) |
| POST | `/api/salas/:codigo/responder` · `/iniciar` | Responde a pergunta atual / anfitrião começa antes do fim da contagem |
| GET/POST | `/api/comunidade` | Lista (filtros `area`, `tag`, `semResposta`, `q`) / cria tópico numa área (bloqueia e-mail, telefone, CPF) |
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

> O rascunho do diagnóstico fica neste navegador, isolado por conta. Ao concluir, as quatro respostas, as oito notas e a ordem da trilha são gravadas juntas no PostgreSQL; só após a confirmação a tela avança. No login em outro dispositivo, o diagnóstico é recuperado. O modo demonstração continua local. XP e progresso de missões ainda ficam no navegador. Equipes e mensagens dos grupos de contas autenticadas ficam no PostgreSQL; o fórum geral ainda usa seu repositório em memória. Cada ação de `estado.ts` corresponde a uma tabela do modelo de dados (seção 7 da especificação), e o `usuarioId` já é guardado junto para facilitar essa migração.

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

## Avatar (emblema do perfil)

O avatar só aparece no perfil e pode ser baixado como imagem (PNG) para usar de foto em outros lugares. É montado com o estilo **avataaars** do [DiceBear](https://www.dicebear.com/) (`@dicebear/core` + `@dicebear/avataaars`), gerado no navegador, sem chamadas externas.

- As peças e as regras (cabelo/roupa por gênero, barba só no masculino) ficam em `src/lib/avatar.ts`, usado no navegador e no servidor.
- Fica salvo no navegador e, com conta, na coluna `usuarios.avatar` (jsonb). Ao entrar em outro dispositivo, o avatar volta junto com a conta.
- Créditos: design avataaars por Pablo Stanley (gratuito para uso pessoal e comercial); código do DiceBear sob MIT.

## Comunidade por área

Na Comunidade, cada escudo no topo é uma área da empresa. Trocar de escudo troca o fórum, a reunião e a descrição; a coluna ao lado mostra o XP de quem está logado. A aba “Minha equipe” guarda os grupos da seção abaixo.

- As áreas ficam na tabela `areas` (migration `0004`, já com as 4 áreas): `slug`, `nome`, `descricao`, `cor`, `ordem`, `ativa` e a reunião (`reuniao_provedor` = `meet` ou `teams`, `reuniao_titulo`, `reuniao_url`). Dois `CHECK`s no banco exigem cor hexadecimal e link `https://`. A tela só renderiza o link se ele for `https://`.
- **Os links de reunião são exemplos.** Troque pelos reais direto no banco:
  `UPDATE "areas" SET "reuniao_url" = 'https://meet.google.com/xxx-yyyy-zzz' WHERE "slug" = 'comercial';`
- Se o banco estiver fora do ar, `/api/areas` devolve a lista padrão de `src/lib/areas.ts`, e a tela não quebra.
- Todo tópico novo precisa de uma `area` válida (a API valida contra a tabela).
- Os tópicos do fórum ainda ficam **em memória** (somem ao reiniciar o servidor). Próximos passos: persistir tópicos/respostas e criar o botão “criar sala” para salas de jogo com perguntas e respostas por área, que se encaixa na mesma tabela `areas`.

## Salas de jogo (quiz ao vivo)

Na Comunidade, quem é **admin** vê o botão **Criar sala**; todos têm **Entrar com código**. É o estilo “Kahoot”/Gupy Education:

1. O admin monta a sala (`/comunidade/sala/nova`): nome, área, contagem regressiva (30 s a 5 min) e as perguntas (2 a 4 alternativas, uma certa, 10 a 60 s para responder).
2. A sala abre no **lobby**: QR code no centro com o código de 6 dígitos embaixo e a contagem regressiva; cada pessoa que entra aparece como um balão flutuando com o avatar do perfil. O anfitrião pode usar **Começar agora**.
3. As pessoas entram digitando o código (6 caixinhas) ou apontando a câmera para o QR code (que abre `/comunidade/sala/<código>`; quem não está logado entra e volta para a sala).
4. As perguntas passam sozinhas: cada uma dura o seu tempo, depois mostra a resposta certa, quantos marcaram cada opção e o placar parcial.
5. No fim, **pódio** (1º, 2º, 3º) com confete e a classificação completa: acertos de N e, em empate, quem acertou mais rápido.

**Como funciona por baixo**
- Tabelas: `salas`, `sala_perguntas`, `sala_participantes`, `sala_respostas` (migration `0005`) e a coluna `usuarios.papel` (`membro` | `admin`).
- Não há “passar a vez”: o andamento sai do relógio (`src/lib/salas/contratos.ts`, `calcularFase`). Servidor e navegador fazem a mesma conta; o navegador corrige o próprio relógio pelo do servidor, então a contagem e o cronômetro ficam alinhados em todos os aparelhos.
- A resposta certa só sai do servidor depois que o tempo da pergunta acaba, o tempo de resposta é medido no servidor e cada pessoa responde uma vez por pergunta. A tolerância de rede (0,7 s) vale só para o fim da pergunta.
- Quem não estava na sala antes do início não entra depois (para o placar ser justo). O anfitrião acompanha, mas não joga.
- O código tem limite de tentativas por conta (30 em 10 min) para ninguém “adivinhar” salas.
- Atualização por consulta a cada 1 s (350 ms na virada de fase), sem WebSocket: simples de hospedar (Vercel) e suficiente para uma sala de dezenas de pessoas. Se precisar de centenas, o passo seguinte é trocar a consulta por SSE/Redis.

**Tornar alguém admin** (não existe tela para isso de propósito):
```sql
UPDATE "usuarios" SET "papel" = 'admin' WHERE "email" = 'pessoa@empresa.com';
```
Admin é o mesmo que um membro, mais o botão de criar sala. A criação é validada de novo no servidor (`403` para quem não é admin).

## Rede de equipes e grupos

Contas autenticadas usam o PostgreSQL para “Minha equipe”. Ao digitar pelo menos três caracteres de um e-mail, o formulário pesquisa até oito contas e mostra nome, e-mail e avatar (ou iniciais). Uma pessoa pode gerenciar sua própria equipe e participar de várias outras. Os grupos aparecem na Comunidade e são compartilhados por todos os membros que aceitaram o convite.

O responsável adiciona pessoas por e-mail. O vínculo nasce pendente, mesmo quando a conta já existe; o destinatário aceita ou recusa na Comunidade. Se o e-mail ainda não tiver conta, o convite aparece quando a pessoa se cadastrar com aquele e-mail. Não há envio de e-mails. Só o responsável pode editar função, registrar o último 1:1 ou remover membros. A data do 1:1 não é compartilhada com o grupo.

A conversa do grupo persiste as mensagens no banco e mostra as 100 mais recentes, atualizando a cada 15 segundos com a página visível. Pessoas pendentes, removidas e de fora não conseguem ler nem enviar mensagens. O fórum geral continua separado e com a implementação existente. O modo demonstração mantém a equipe local; registros antigos sem e-mail não são vinculados automaticamente. Reuniões e integrações com agendas ficam para uma próxima etapa.

### Tabelas Drizzle

| Tabela | Dados e vínculos |
|---|---|
| `equipes` | Nome do grupo, responsável (`usuarios`), data de criação; uma equipe própria por responsável |
| `equipe_membros` | Grupo, e-mail normalizado, usuário quando existir, nome, função, último 1:1 e estado pendente/ativo; e-mail único dentro do grupo |
| `equipe_mensagens` | Grupo, autor (`usuarios`), texto e data; índice por grupo/data |

Schema: `src/lib/db/schema.ts`. Migração: `drizzle/0003_early_hawkeye.sql`. Exclusões usam as chaves estrangeiras declaradas no schema. A migração é aplicada com `pnpm db:migrate` (ou na primeira requisição do processo).

### API para integração

Todas as operações de `/api/rede` exigem a sessão da pessoa autenticada, validam entradas com Zod e aplicam limites de requisições. Nenhum identificador de responsável vindo do cliente substitui a sessão.

| Método | Requisição | Resultado |
|---|---|---|
| GET | `/api/rede` | Equipe própria, grupos conectados e convites pendentes |
| GET | `/api/rede?busca=prefixo-do-email` | Pessoas encontradas (apenas nome, e-mail, cargo, id e avatar) |
| GET | `/api/rede?equipe=UUID` | Membros e mensagens; restrito ao responsável e membros ativos |
| POST | `{ acao: "criar-equipe", nome }` | Cria a equipe própria ou renomeia a existente |
| POST | `{ acao: "adicionar-membro", email, nome?, funcao?, ultimo1on1? }` | Cria a equipe se necessário e registra o convite, sem duplicar e-mails |
| POST | `{ acao: "aceitar-convite" ou "recusar-convite", equipeId }` | Aceita/recusa somente o convite destinado ao e-mail da sessão |
| POST | `{ acao: "atualizar-membro", equipeId, membroId, funcao, ultimo1on1 }` | Atualiza somente na equipe que a pessoa gerencia |
| POST | `{ acao: "remover-membro", equipeId, membroId }` | Remove vínculo e acesso ao grupo |
| POST | `{ acao: "enviar-mensagem", equipeId, texto }` | Salva mensagem de até 2.000 caracteres no grupo |

Contratos: `src/lib/rede/contratos.ts`. Cliente tipado: `src/lib/rede/cliente.ts`. O teste de integração `node scripts/testar-rede.mjs` (na pasta `app`, com servidor local na porta 3000 e Postgres configurado) cria contas temporárias, testa o isolamento de acesso e apaga apenas os registros da própria execução.
