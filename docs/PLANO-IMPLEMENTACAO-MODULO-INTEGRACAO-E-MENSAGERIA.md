# Plano de implementação: módulo de Integração e mensageria ("Integração e mensageria na AWS")

Plano para o módulo de integração e mensageria do AWS Quest, escrito em 20/10/2026 e implementado em 22/10/2026, com as opções recomendadas da seção 2 (tarefa agendada pelo usuário). Diferenças em relação ao plano: o mapa ficou com cinco colunas em x = 90, 270, 450, 630 e 815 e altura de 800, com a Fase 9 e o desafio final em colunas separadas; os labs `queue`, `pubsub`, `eventbus`, `workflow`, `apigw` e `stream` usam o motor de laboratório em grade (`simulators/shared/grid.ts`), e `pubsub` e `eventbus` compartilham o mesmo modelo de padrões em `simulators/eventbus/` (não houve pasta `pubsub/`); o simulador de fila calcula o caminho de cada mensagem em vez de passos de tempo; os preços entram na comparação entre APIs REST e HTTP, sem laboratório de custo; o Kinesis Data Streams, o Data Firehose e o AppFlow já estavam no catálogo, e entraram Step Functions, API Gateway e Amazon MQ; foram 42 missões, 81 atividades, 46 conceitos novos, 20 conquistas e 24 questões. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md) e de [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O território `integracao` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'planned'`, o resumo "Filas, tópicos, eventos e orquestração." e quatro serviços previstos: Amazon SQS, Amazon SNS, Amazon EventBridge e AWS Step Functions.
- Já estão em [services.ts](../src/content/catalog/services.ts): `aws.sqs`, `aws.sns` e `aws.eventbridge` (território `integracao`) e `aws.lambda` (território `computacao`).
- A S3 Expedition já ensina notificações de eventos do S3, EventBridge e fan-out com SNS, e a trilha de Computação já ensina Lambda (invocação, erros no assíncrono, concorrência). Esta trilha **não repete** esses temas: aprofunda filas, tópicos, barramento, orquestração e streaming, e cita as fases anteriores onde fizer sentido.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `ev.at-least-once`, `ev.destination-permissions`, `ev.eventbridge`, `ev.fanout`, `ev.filter-overlap`, `ev.notifications`, `ev.recursion`, `lambda.invocation`, `lambda.async-errors`, `lambda.concurrency`, `lambda.reserved` e `lambda.function`.
- Simuladores que já existem e podem ser reaproveitados: `events/` (notificações do S3, EventBridge e fan-out), `lambda/` (concorrência), `architecture/` (desafio final) e o motor de políticas em `policy/` (políticas de recurso de filas e tópicos).

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html).

| Categoria | Serviços |
|---|---|
| **Application Integration** | Amazon AppFlow, Amazon EventBridge, Amazon MQ, Amazon SNS, Amazon SQS e AWS Step Functions |
| **Front-End Web and Mobile** (ligado a integração) | Amazon API Gateway (o plano de Redes deixou para esta trilha) |
| **Analytics** (streaming) | Amazon Kinesis, Amazon Data Firehose e Amazon MSK (ver decisões) |
| **Serverless** | AWS Lambda (já ensinado em Computação) |

Faltam no catálogo e entram nesta trilha: Step Functions, Amazon MQ, AppFlow e API Gateway, e Kinesis e Data Firehose se a decisão de streaming for confirmada.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, juntando a fase 8 com a 9 |
| API Gateway | Entra aqui (fase 6), como o plano de Redes já prevê | Fica para uma trilha de aplicações web |
| Streaming (Kinesis Data Streams, Data Firehose, MSK) | Kinesis Data Streams e Data Firehose entram aqui (fase 7), porque o exame cobra a escolha entre fila e stream; o MSK é só citado e é ensinado no [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md) | Tudo fica para o [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md) |
| Preços | Preços reais da Price List API, como em Computação | Premissas fixas do cenário |

**Atenção:** o plano de Bancos de dados propõe deixar o Kinesis para a trilha de análise, e o [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md) já assume que Kinesis e Firehose são ensinados aqui e só os reaproveita (fase 6). Se a proposta de streaming acima for aceita, o plano de Bancos de dados precisa ser ajustado para citar esta trilha.

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a Computação, sem exigir.
- Entra em `MODULES` depois das trilhas que já existirem quando ela for implementada.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `integration`; trilha `integration.aws-integration` ("Integração e mensageria na AWS", subtítulo "Filas, tópicos, eventos, orquestração e streaming").
- Território `integracao`, glifo `queue`, `recommends: ['foundations.aws-foundations', 'compute.aws-compute']`.
- Prefixo das fases: `int.f0N`. Prefixos dos conceitos novos: `sqs.*`, `sns.*`, `eb.*`, `sfn.*`, `apigw.*`, `kds.*`, `fh.*`, `mq.*` e `int.*`.
- Pasta `src/content/modules/integration/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | Desacoplamento e SQS essencial | chamada síncrona × assíncrona, fila como amortecedor, fila padrão, tempo de visibilidade, retenção, long polling, tamanho da mensagem, fila de mensagens mortas (DLQ) e redrive | `queue`: ajustar visibilidade e DLQ para que nenhuma mensagem se perca nem seja processada em dobro sem necessidade |
| **F2** | SQS em escala | fila FIFO, grupo de mensagens, deduplicação, vazão, fila com atraso, escalar consumidores pelo tamanho da fila, Lambda lendo do SQS (lote, falhas parciais) | `queue` com FIFO e consumidores; predição de ordem e duplicidade |
| **F3** | SNS | tópicos, assinaturas e protocolos, fan-out SNS com SQS (reaproveita `ev.fanout`), política de filtro, tópicos FIFO, novas tentativas e DLQ da assinatura | `pubsub`: montar as assinaturas e filtros para que cada mensagem chegue a quem deve |
| **F4** | EventBridge | barramento padrão e personalizado, regras e padrões de evento, alvos, eventos entre contas, arquivamento e reprocessamento, registro de esquemas, Scheduler, Pipes (reaproveita `ev.eventbridge`) | `eventbus`: escrever padrões de evento que casam com os eventos certos |
| **F5** | Step Functions | máquina de estados, fluxo Standard × Express, tipos de estado (Task, Choice, Parallel, Map, Wait), novas tentativas e captura de erros, integração direta com serviços, espera por callback | `workflow`: montar o fluxo de um pedido com tratamento de falhas |
| **F6** | API Gateway | API REST × HTTP × WebSocket, integração com Lambda e com outros serviços, estágios, limitação de requisições, cache, autorização (IAM, Cognito, autorizador Lambda), planos de uso e chaves de API como estratégia de limitação por cliente, endpoint regional × otimizado para borda × privado | `apigw`: proteger uma API de picos e de acesso indevido |
| **F7** | Streaming | Kinesis Data Streams (shards, chave de partição, ordem, retenção, consumidores), Data Firehose (entrega a destinos, transformação, buffer), carta sobre MSK, fila × stream | `stream`: dimensionar shards e escolher entre SQS e Kinesis |
| **F8** | Mensageria gerenciada e integração com SaaS | Amazon MQ (migrar brokers ActiveMQ e RabbitMQ sem reescrever a aplicação), AppFlow (dados de aplicações SaaS), quando MQ e quando SQS/SNS | Decisão e classificação, sem laboratório novo |
| **F9** | Padrões e escolha | coreografia × orquestração, idempotência, entrega "pelo menos uma vez" (reaproveita `ev.at-least-once`), saga, buffer de escrita, quadro de escolha do serviço de integração | `int-chooser`: requisito para serviço |
| **Final** | Arquitetura orientada a eventos | integração | Varejo fictício, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F1.
- F4 exige F3.
- F7 exige F2.
- F9 exige F4, F5 e F7.
- O final exige as nove.
- As demais só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1 e F6.
- x=300: F2, F3 e F5.
- x=560: F4, F7 e F8.
- x=820: F9 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Arquitetura orientada a eventos

- Loja virtual fictícia que recebe pedidos por uma API, processa pagamento, estoque e envio, avisa o cliente e alimenta relatórios em tempo quase real.
- Etapas do `architecture`:
  1. Entrada dos pedidos pela API.
  2. Fila que absorve os picos.
  3. Ordem e duplicidade dos pedidos.
  4. Distribuição para vários sistemas.
  5. Eventos entre times.
  6. Fluxo do pedido com tratamento de falhas.
  7. Stream de cliques para relatórios.
  8. Integração com o sistema legado e custo.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 34 missões, 90 atividades, 65 conceitos novos, 7 laboratórios novos, 20 conquistas (`ach.int-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

## 4. Simuladores

Todos seguem o padrão de `src/simulators/<nome>/`:
- `model.ts` puro e testado, com cabeçalho "Conferido em DD/MM/AAAA" e as URLs da documentação;
- `lab.ts`;
- interface `.tsx` e CSS Module;
- painel "Simplificações".

Cada um é ligado em:
- `activities/lab/specs.ts`;
- `lab/evaluate.ts` (`evaluateLab`, `labSolution` e `labInitialResponse`);
- `activities/registry.tsx`;
- `activities/ui-logic.ts`;
- `predict/specs.ts` e `predict/resolve.ts`, quando houver predição.

O teste de conteúdo já garante que a solução chega a 100%, que o estado inicial fica abaixo de 70% e que cada predição tem uma única opção certa.

| Simulador | O que modela |
|---|---|
| `queue/` | Fila SQS em passos de tempo: produtores, consumidores, tempo de visibilidade, falhas no processamento, contagem de recebimentos até a DLQ, retenção e long polling. Na fila FIFO, ordem por grupo de mensagens e deduplicação. Lambda lendo do SQS com lote e falhas parciais. Saída: mensagens processadas, duplicadas, perdidas, atrasadas e na DLQ. |
| `pubsub/` | Tópico SNS com assinaturas e políticas de filtro: para cada mensagem, quem recebe e por quê. Fan-out para filas. Reaproveita a ideia de `events/` para explicar a entrega. |
| `eventbus/` | Casamento de padrões de evento do EventBridge (igualdade, prefixo, lista, existência, números), regras com vários alvos e eventos entre contas. Estende ou reaproveita o modelo de `events/`, sem duplicar regras que ele já tem. |
| `workflow/` | Execução de uma máquina de estados com Task, Choice, Parallel, Map e Wait, com novas tentativas e captura de erros; custo de Standard × Express pela tabela. |
| `apigw/` | Limitação de requisições por balde de fichas (taxa e rajada), cache por estágio e autorização. Os limites usados vêm da documentação; o tráfego é premissa do cenário. |
| `stream/` | Shards do Kinesis Data Streams: vazão de escrita e de leitura por shard, distribuição pela chave de partição (shard quente), ordem por shard e retenção; comparação com uma fila SQS para o mesmo requisito. |
| `intchooser/` | Escolha do serviço, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Requisitos: um consumidor × muitos, ordem, reprocessamento, fluxo com estados, API pública, broker existente, dados de SaaS, stream em tempo real. |

Reaproveitado sem alteração: `architecture/` no desafio final, `lambda/` na integração SQS com Lambda e o motor de políticas (predição `policy`) para as políticas de recurso de filas, tópicos e barramentos.

### Preços

- Novo script `scripts/fetch-integration-prices.mjs` (`npm run prices:integration`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/integration-prices.json` com a data de publicação.
- Itens previstos: SQS (requisições padrão e FIFO), SNS (publicações e entregas por protocolo), EventBridge (eventos personalizados, Scheduler, Pipes), Step Functions (transições no Standard; requisições e duração no Express), API Gateway (REST, HTTP e WebSocket) e Kinesis Data Streams (shard por hora ou sob demanda) e Data Firehose (GB ingerido).
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | tamanho máximo da mensagem (e o padrão para mensagens grandes); tempo de visibilidade (padrão, mínimo e máximo); retenção (padrão, mínimo e máximo); long polling (tempo máximo de espera); `maxReceiveCount` e redrive da DLQ; entrega "pelo menos uma vez" e ordem aproximada na fila padrão |
| F2 | vazão da fila FIFO (com e sem lote, modo de alta vazão); grupo de mensagens; janela de deduplicação; fila com atraso e temporizador por mensagem; escalar pelo backlog por instância; Lambda com SQS (tamanho do lote, janela, falhas parciais, escala dos consumidores, fila FIFO) |
| F3 | protocolos de assinatura; política de filtro (por atributo e por corpo); tópicos FIFO e quais assinantes aceitam; política de novas tentativas por protocolo; DLQ da assinatura; tamanho máximo da mensagem |
| F4 | barramentos (padrão, personalizado, de parceiros); sintaxe dos padrões de evento; limite de alvos por regra; eventos entre contas e Regiões; arquivamento e reprocessamento; registro de esquemas; Scheduler; Pipes; novas tentativas e DLQ de alvos |
| F5 | Standard × Express (duração máxima, garantia de execução, histórico, cobrança); tipos de estado; `Retry` e `Catch`; Map distribuído; integrações otimizadas e padrões de integração (resposta imediata, execução até o fim, espera por callback) |
| F6 | REST × HTTP × WebSocket (o que cada um oferece); tipos de endpoint; limites de limitação por conta e por estágio; tempo máximo de integração; cache; autorizadores; planos de uso e chaves de API; CORS |
| F7 | Kinesis Data Streams (capacidade de escrita e leitura por shard, modo sob demanda × provisionado, retenção padrão e máxima, consumo com fan-out aprimorado); Data Firehose (destinos, buffer, transformação com Lambda); o que o MSK oferece; diferenças de ordem e reprocessamento entre SQS e Kinesis |
| F8 | motores do Amazon MQ e quando a AWS recomenda MQ em vez de SQS/SNS; implantação com alta disponibilidade no MQ; origens e destinos do AppFlow |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e novidades recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `integracao` passa para `active` e deixa de ter `plannedServices`. Se o streaming entrar, o resumo do território ganha "streams".
- **`content/catalog/services.ts`:** novos serviços `aws.step-functions`, `aws.mq`, `aws.appflow` e `aws.api-gateway`, e `aws.kinesis-data-streams` e `aws.data-firehose` se o streaming entrar. Cada um com `docsUrl` conferido. Não existe território de aplicações web no catálogo, e o território `analise` só nasce com o [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md): esses serviços ficam em `integracao`, onde são ensinados.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): `queue`, `topic` e `bolt` já existem. Avaliar `workflow`, `api` e `waves` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `integrationModule` e `CONTENT_VERSION` muda.
- **`engine/types.ts`:** nenhuma mudança prevista. `mapHeight` já existe em `TrackDef`.
- **`package.json`:** script `prices:integration`. **`vite.config.ts`:** chunk `content-integration`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Serviços já usados em outras trilhas:** conferir se a trilha pode listar `aws.lambda` em `serviceIds` sem duplicar a contagem no Codex.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `queue` |
| **M3** | F3 e F4, com `pubsub` e `eventbus` |
| **M4** | F5 e F6, com `workflow` e `apigw` |
| **M5** | F7 e F8, com `stream` |
| **M6** | F9 e desafio final, com `intchooser`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:integration   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e                  # capturas em screenshots/
npm run dev                  # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e Computação;
- **Codex:** não duplica os conceitos reaproveitados (`ev.*` e `lambda.*`);
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **simulador de fila:** reproduz o comportamento da documentação para tempo de visibilidade e `maxReceiveCount`;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Sobreposição com a S3 Expedition e a Computação:** eventos do S3, EventBridge, fan-out e Lambda já existem. Reaproveitar os conceitos `ev.*` e `lambda.*` em vez de redeclarar, e estender `events/` em vez de criar um segundo modelo das mesmas regras.
- **Fidelidade dos simuladores no tempo:** `queue` e `stream` rodam em passos de tempo, com premissas declaradas (tempo de processamento, taxa de falhas, tráfego). Cada regra tem teste que reproduz o exemplo da documentação, e o que for simplificação aparece no painel "Simplificações".
- **Serviços com mudança recente:** EventBridge Pipes e Scheduler, Map distribuído do Step Functions e modos de capacidade do Kinesis evoluem rápido. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Fronteira com Análise de dados:** a decisão sobre streaming afeta o plano de Bancos de dados e o [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md). Decidir antes do M5.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
