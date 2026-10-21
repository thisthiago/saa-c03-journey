# Plano de implementação: módulo de Análise de dados ("Análise de dados e serviços de IA na AWS")

Plano para o módulo de análise de dados do AWS Quest, escrito em 20/10/2026 e implementado em 21/10/2026, com as opções recomendadas da seção 2 confirmadas pelo usuário. Diferenças em relação ao plano: Kinesis Data Streams e Data Firehose foram declarados aqui (`kds.*` e `fh.*`), porque a trilha de Integração ainda não existia; os labs `ingest`, `ai-chooser` e `ana-chooser` usam o motor genérico de escolha; o AppFlow e o MediaConvert entraram no catálogo; o caso de serviço encerrado se chama `discontinued`. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md), [Integração e mensageria](PLANO-IMPLEMENTACAO-MODULO-INTEGRACAO-E-MENSAGERIA.md), [Monitoramento e governança](PLANO-IMPLEMENTACAO-MODULO-MONITORAMENTO-E-GOVERNANCA.md), [Arquitetura e otimização](PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md) e [Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- A tarefa 3.5 do exame, "Determine high-performing data ingestion and transformation solutions", não tem trilha hoje. O plano de [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md) deixa Athena, Glue, EMR e OpenSearch para esta trilha.
- Também não têm trilha os serviços prontos de machine learning, de mídia e de front-end da lista do exame. A tarefa 2.2 cita o Comprehend e o Polly como exemplos. Esta trilha os reúne numa fase de identificação (ver decisões).
- **Não existe território para o tema** no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)). A trilha cria um território novo.
- Em [services.ts](../src/content/catalog/services.ts) não existe nenhum serviço de análise, de ML, de mídia ou de front-end.
- Outras trilhas e planos já tratam parte do tema, e esta trilha **não repete** esses pontos:
  - a S3 Expedition ensina classes de armazenamento, ciclo de vida e eventos do S3, que são a base do data lake;
  - o plano de Bancos de dados ensina o Redshift (fase 7) e a diferença entre banco transacional e analítico;
  - o plano de Integração e mensageria ensina Kinesis Data Streams e Data Firehose (fase 7) e AppFlow (fase 8);
  - o plano de Segurança ensina KMS e Macie.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): os de classes de armazenamento (`sc.*`), ciclo de vida e eventos da S3 Expedition. Antes de escrever cada fase, procurar no código e nos planos implementados conceitos de Redshift, Kinesis e Firehose para reaproveitar.
- Simuladores que já existem e podem ser reaproveitados: `architecture/` (desafio final), `lifecycle/` (ciclo de vida do S3), `cost/` (fatura do S3), `chooser/` (escolha por requisito) e o motor de políticas em `policy/`.

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) e nas tarefas do [domínio 3](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain3.html).

| Categoria | Serviços |
|---|---|
| **Analytics** (que esta trilha ensina) | Amazon Athena, AWS Data Exchange, Amazon EMR, AWS Glue, AWS Lake Formation, Amazon MSK, Amazon OpenSearch Service e Amazon Quick |
| **Analytics** (ensinados em outros planos) | Amazon Kinesis e Amazon Data Firehose (Integração e mensageria), Amazon Redshift (Bancos de dados) |
| **Machine Learning** | Amazon Comprehend, Amazon Lex, Amazon Polly, Amazon Rekognition, Amazon SageMaker AI, Amazon Textract, Amazon Transcribe e Amazon Translate |
| **Media Services** | Amazon Elastic Transcoder e Amazon Kinesis Video Streams |
| **Front-End Web and Mobile** | AWS Amplify e AWS Device Farm (o API Gateway fica em Integração e mensageria) |

O que a tarefa 3.5 pede e esta trilha cobre:
- serviços de análise e visualização (o guia cita Athena, Lake Formation e Amazon Quick);
- padrões de ingestão, como a frequência;
- serviços de transformação (o guia cita o Glue);
- acesso seguro aos pontos de ingestão;
- tamanhos e velocidades que atendem ao negócio;
- montar e proteger data lakes;
- desenhar arquiteturas de streaming;
- estratégias de visualização;
- escolher a computação de processamento (o guia cita o EMR);
- transformar dados entre formatos (o guia cita CSV para Parquet).

A tarefa 3.2 também cita o EMR entre os serviços de computação.

**Dois serviços com situação especial**, conferidos em 20/10/2026:
- **Amazon Quick:** a página [What is Amazon Quick?](https://docs.aws.amazon.com/quick/latest/userguide/what-is.html) diz que o Amazon Quick evoluiu do Amazon QuickSight. O QuickSight continua como **Amazon Quick Sight**, um recurso dentro do Quick, voltado a painéis e business intelligence. A trilha ensina o Quick Sight como a parte de visualização que o exame cobra, e cita o restante do Quick sem detalhar.
- **Amazon Elastic Transcoder:** a AWS anunciou o [fim do suporte em 13/11/2025](https://aws.amazon.com/blogs/media/support-for-amazon-elastic-transcoder-ending-soon/), com o AWS Elemental MediaConvert como substituto. Mesmo assim, o serviço continua na lista do exame. A trilha o apresenta como serviço encerrado, com o MediaConvert como alternativa atual, e confere a situação de novo antes de escrever a fase.

Faltam no catálogo e entram nesta trilha: todos os serviços das quatro linhas que esta trilha ensina.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, tirando a fase 8 para uma trilha própria |
| Serviços prontos de ML, mídia e front-end | Entram aqui como fase 8, só de identificação ("qual serviço faz isto"), porque o exame não pede detalhe de configuração deles | Trilha curta própria ("Serviços prontos"), com 3 ou 4 fases |
| Território | Território novo `analise` ("Análise de dados e IA"), com glifo novo `chart` | Encaixar no território `bancos-de-dados` |
| Kinesis e Firehose | Continuam ensinados no plano de Integração e mensageria; aqui a fase 6 reaproveita os conceitos e acrescenta a conversão de formato e a entrega no data lake | Saem de Integração e são ensinados aqui |
| Redshift | Continua no plano de Bancos de dados; aqui entra só a comparação com Athena e EMR | Sai de Bancos de dados e é ensinado aqui |
| Preços | Preços reais da Price List API para Athena (por dado lido) e Glue (por DPU-hora); EMR, OpenSearch e MSK como premissa do cenário | Tudo como premissa do cenário |

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a S3 Expedition, sem exigir.
- Entra em `MODULES` depois das trilhas que já existirem quando ela for implementada.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `analytics`; trilha `analytics.aws-analytics` ("Análise de dados e serviços de IA na AWS", subtítulo "Data lake, consultas, processamento, streaming e serviços prontos").
- Território novo `analise`, glifo `chart`, `recommends: ['foundations.aws-foundations', 'storage.s3-expedition']`.
- Prefixo das fases: `ana.f0N`. Prefixos dos conceitos novos: `lake.*`, `glue.*`, `athena.*`, `lf.*`, `emr.*`, `ingest.*`, `msk.*`, `os.*`, `quick.*`, `ai.*`, `media.*`, `front.*` e `ana.*`.
- Pasta `src/content/modules/analytics/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | Data lake no S3 | data lake × data warehouse, camadas de dados (bruto, tratado, pronto para consumo), formatos em linha × em coluna (CSV, JSON, Parquet, ORC), compressão, particionamento por pasta, por que o S3 é a base (reaproveita a S3 Expedition) | `datalake`: escolher formato, compressão e partição e ver quanto dado cada consulta lê |
| **F2** | Catálogo e transformação com Glue | Data Catalog (bancos e tabelas), crawlers, jobs de ETL, conversão de CSV para Parquet, gatilhos e fluxos, job bookmarks (processar só o que é novo), Glue × escrever o próprio código | `datalake` com um job que converte e particiona; ordenação do fluxo de ETL |
| **F3** | Consultas com Athena | SQL sem servidor sobre o S3, cobrança pelo volume de dados lido, partições e formatos colunares para reduzir custo, workgroups e limites de consulta, consultas federadas, Athena × Redshift Spectrum (cita o plano de Bancos de dados) | `datalake` com custo real por consulta; predição "qual consulta custa menos?" |
| **F4** | Governança do data lake com Lake Formation | permissões por banco, tabela, coluna e linha, filtros de dados, tags do Lake Formation, compartilhamento entre contas, relação com as permissões do IAM e do S3, proteção do lago (cita KMS e endpoints dos planos de Segurança e de Redes) | `lakeperm`: dizer o que cada analista enxerga numa tabela |
| **F5** | Processamento com EMR | clusters com Spark e Hadoop, nós primário, core e task, Spot nos nós task, EMR Serverless, EMR no EKS, quando escolher EMR × Glue × Athena | `emr`: montar um cluster que termina no prazo e sobrevive à perda de Spot |
| **F6** | Ingestão e streaming no data lake | padrões de ingestão (lote, microlote, contínuo), frequência, tamanho e velocidade, Firehose convertendo para Parquet e entregando no S3 (reaproveita Integração), MSK e MSK Serverless (Kafka gerenciado) × Kinesis, Data Exchange (dados de terceiros), AppFlow (cita Integração), acesso seguro aos pontos de ingestão | `ingest`: escolher o caminho de ingestão para cada fonte |
| **F7** | Busca e visualização | OpenSearch Service (busca textual, análise de logs, painéis, OpenSearch Serverless), Amazon Quick Sight (painéis, fontes de dados, SPICE), qual ferramenta responde a qual pergunta | Decisão e classificação; investigação "o painel está lento" |
| **F8** | Serviços prontos de IA, mídia e front-end | Comprehend (texto), Lex (chatbots), Polly (texto para voz), Rekognition (imagem e vídeo), Textract (documentos), Transcribe (voz para texto), Translate, SageMaker AI (treinar e hospedar modelos próprios), Kinesis Video Streams, Elastic Transcoder (encerrado; cita o MediaConvert), Amplify (front-end e mobile), Device Farm (testes em aparelhos reais) | `ai-chooser`: necessidade para serviço |
| **F9** | Escolhendo a solução de dados | quadro de escolha: Athena × Redshift × EMR × Glue × OpenSearch × Quick Sight; Kinesis × Firehose × MSK; serviço pronto × SageMaker AI | `ana-chooser`: requisito para serviço |
| **Final** | Plataforma de Dados | integração | Rede de lojas fictícia que quer unir vendas, cliques do site e avaliações de clientes num só lugar, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F2.
- F4 exige F2.
- F5 exige F2.
- F9 exige F3, F4, F5, F6, F7 e F8.
- O final exige as nove.
- F6, F7 e F8 só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1, F6 e F8.
- x=300: F2 e F7.
- x=560: F3, F4 e F5.
- x=820: F9 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Plataforma de Dados

- Rede de lojas fictícia com vendas no banco transacional, cliques do site chegando sem parar, arquivos de parceiros em CSV, avaliações de clientes em texto livre e uma diretoria que quer um painel único.
- Etapas do `architecture`:
  1. Camadas e formato do data lake.
  2. Catálogo e transformação.
  3. Consultas sob demanda.
  4. Permissões por coluna e por linha.
  5. Processamento pesado.
  6. Ingestão contínua dos cliques.
  7. Análise do texto das avaliações.
  8. Painel para a diretoria.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. O peso maior fica em Alto desempenho e Custo. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 34 missões, 90 atividades, 65 conceitos novos, 6 laboratórios novos, 20 conquistas (`ach.ana-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

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
| `datalake/` | Uma tabela fictícia guardada em formatos e partições diferentes, e consultas que filtram por data e leem algumas colunas. Calcula quanto dado cada consulta lê e quanto custa no Athena pela tabela de preços. A taxa de compressão de cada formato é premissa do cenário; o fato de que formatos colunares e partições reduzem o volume lido vem da documentação. |
| `lakeperm/` | Permissões do Lake Formation sobre uma tabela: quem tem acesso a quais colunas e a quais linhas (filtros de dados) e por quais tags. O jogador vê a tabela como cada analista a vê. |
| `emr/` | Um cluster com nós primário, core e task, uma carga de trabalho e o efeito da perda de instâncias Spot em cada tipo de nó. Mostra se o job termina no prazo e o custo. Capacidade por nó e tempo do job são premissas do cenário. |
| `ingest/` | Fontes de dados com frequência, tamanho e exigência de latência. O jogador escolhe o caminho (lote no S3, Firehose, Kinesis Data Streams, MSK, Data Exchange, AppFlow) e vê se atende. |
| `ai-chooser/` | Escolha do serviço pronto, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Exemplos: "extrair campos de notas fiscais escaneadas", "detectar o sentimento de avaliações", "legendar vídeos", "um chatbot de atendimento", "testar o app em celulares reais". |
| `ana-chooser/` | Escolha da solução de dados, no mesmo padrão. Exemplos: "consulta esporádica sobre arquivos no S3", "painel para a diretoria", "busca textual nos produtos", "processamento Spark de 10 TB por noite", "Kafka sem gerenciar servidores". |

Reaproveitado sem alteração: `architecture/` no desafio final, `lifecycle/` na fase 1 e o motor de políticas (predição `policy`) para as permissões do S3 que convivem com o Lake Formation.

### Preços

- Novo script `scripts/fetch-analytics-prices.mjs` (`npm run prices:analytics`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/analytics-prices.json` com a data de publicação.
- Itens previstos: Athena (dado lido por consulta) e Glue (DPU-hora de job e de crawler, armazenamento do Data Catalog).
- EMR, OpenSearch e MSK ficam como premissa do cenário, porque o custo depende do tipo de instância e do tamanho do cluster. Se o modelo precisar, o EMR pode reaproveitar os preços de instância da tabela de Computação.
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame, das tarefas do domínio 3, da relação entre Amazon Quick e Quick Sight e do anúncio do fim do Elastic Transcoder. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | o que a AWS chama de data lake na documentação atual; formatos colunares suportados por Athena e Glue; recomendações de tamanho de arquivo e de particionamento |
| F2 | Data Catalog (bancos, tabelas, partições); crawlers; tipos de job (Spark, Python shell, streaming); job bookmarks; unidade de cobrança (DPU) e duração mínima; Glue DataBrew (só citar) |
| F3 | cobrança do Athena por dado lido (valor e mínimo por consulta); efeito de partição, compressão e formato colunar no volume lido; workgroups e limites; consultas federadas; modo com capacidade provisionada (se existir hoje) |
| F4 | permissões do Lake Formation (banco, tabela, coluna, filtros de linha e célula); tags do Lake Formation; modo híbrido com permissões do IAM; compartilhamento entre contas (usa RAM); integração com Athena, Glue e Redshift |
| F5 | tipos de nó do EMR e o que se perde quando cada um cai; Spot nos nós task; EMR Serverless; EMR no EKS; armazenamento no S3 com EMRFS × HDFS |
| F6 | conversão de formato no Firehose (Parquet e ORC, uso do Data Catalog); MSK provisionado × Serverless; MSK Connect; Data Exchange (o que é um produto de dados, entrega no S3); AppFlow (reaproveitar o plano de Integração) |
| F7 | OpenSearch Service (domínios, OpenSearch Serverless, ingestão com OpenSearch Ingestion); Quick Sight (fontes, SPICE, permissões, incorporação); situação atual do Amazon Quick e de seus recursos |
| F8 | o que cada serviço de IA faz hoje (Comprehend, Lex, Polly, Rekognition, Textract, Transcribe, Translate); SageMaker AI (nome atual e principais partes); Kinesis Video Streams; situação atual do Elastic Transcoder e do MediaConvert; Amplify (hospedagem e back-end); Device Farm |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e mudanças de nome recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** novo território `analise` ("Análise de dados e IA", resumo "Data lake, consultas, processamento, streaming, visualização e serviços prontos de IA."), com `status: 'active'` quando a trilha entrar. A ordem dos territórios no mapa da Base precisa ser revista.
- **`content/catalog/services.ts`:** novos serviços:
  - `aws.athena`, `aws.glue`, `aws.lake-formation`, `aws.emr`, `aws.msk`, `aws.opensearch`, `aws.quick` e `aws.data-exchange`;
  - `aws.comprehend`, `aws.lex`, `aws.polly`, `aws.rekognition`, `aws.textract`, `aws.transcribe`, `aws.translate` e `aws.sagemaker-ai`;
  - `aws.kinesis-video-streams`, `aws.elastic-transcoder`, `aws.amplify` e `aws.device-farm`.

  Cada um com `docsUrl` conferido. Kinesis e Firehose entram pelo plano de Integração e mensageria.
- **`engine/types.ts`:** `Availability` ganha um caso para serviço encerrado, por exemplo `{ kind: 'discontinued'; since: string; note: string; alternatives?: string[] }`, para o Elastic Transcoder. O Codex e o catálogo passam a mostrar um selo próprio para ele. Conferir se outros serviços já precisariam desse caso.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): novo `chart` (por exemplo, `ChartColumn` do lucide). Avaliar `search`, `brain` e `video` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `analyticsModule` e `CONTENT_VERSION` muda.
- **`package.json`:** script `prices:analytics`. **`vite.config.ts`:** chunk `content-analytics`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px. O teste de catálogo precisa aceitar o território novo.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: território novo, serviços, caso `discontinued`, glifo, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `datalake` |
| **M3** | F3 e F4, com `datalake` (custo) e `lakeperm` |
| **M4** | F5 e F6, com `emr` e `ingest` |
| **M5** | F7 e F8, com `ai-chooser` |
| **M6** | F9 e desafio final, com `ana-chooser`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:analytics   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e                # capturas em screenshots/
npm run dev                # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e S3 Expedition;
- **Codex:** não duplica os conceitos reaproveitados (`sc.*` e os de Kinesis, Firehose e Redshift, se já existirem);
- **território novo:** aparece na Base e no mapa sem quebrar o layout;
- **Elastic Transcoder:** aparece com o selo de serviço encerrado e a alternativa atual;
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Dependência de planos ainda não implementados:** Kinesis, Firehose e Redshift vêm dos planos de Integração e de Bancos de dados. Se esta trilha for implementada antes, ela declara esses conceitos e os outros planos passam a reaproveitá-los, nunca o contrário ao mesmo tempo.
- **Serviços que mudam de nome e de formato:** Amazon Quick, SageMaker AI, OpenSearch Serverless e EMR Serverless mudaram nos últimos anos. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Serviço encerrado na lista do exame:** o Elastic Transcoder pode sair da lista a qualquer momento. Conferir a lista de novo antes do M5 e remover a missão se ele sair.
- **Fase 8 "de lista":** serviços prontos tendem a virar associação de nomes. O laboratório usa necessidades reais de empresas fictícias, e cada serviço aparece pelo menos uma vez como resposta certa e uma vez como alternativa plausível errada.
- **Fidelidade do custo do Athena:** a redução de volume com Parquet e partição depende dos dados. O `datalake` declara a taxa de compressão como premissa e mostra o cálculo.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
