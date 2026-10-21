# Plano de implementação: módulo de Bancos de dados ("Bancos de dados na AWS")

Plano para o módulo de bancos de dados do AWS Quest, escrito em 20/10/2026. Nada aqui foi implementado ainda. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e do plano do módulo de Redes ([PLANO-IMPLEMENTACAO-MODULO-REDES.md](PLANO-IMPLEMENTACAO-MODULO-REDES.md)).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O território `bancos-de-dados` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'planned'` e quatro serviços previstos: Amazon RDS, Amazon Aurora, Amazon DynamoDB e Amazon ElastiCache.
- Em [services.ts](../src/content/catalog/services.ts) só existe `aws.rds`. Todos os outros serviços do módulo entram como novos.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `infra.rds-multi-az`, `infra.multi-az`, `infra.ha-vs-dr` e `srm.rds`. Antes de escrever cada fase, procurar no código outros conceitos de banco já declarados (por exemplo, na S3 Expedition) para não duplicar o Codex.
- Simuladores que já existem e podem ser reaproveitados: `architecture/` (desafio final), `zones/` (zonas de disponibilidade), `cost/` (padrão de preços) e o motor de políticas em `policy/` (acesso por IAM ao banco).
- Conceitos de criptografia e rotação de segredos (KMS, Secrets Manager) pertencem ao [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md). Esta trilha ensina só o que o banco precisa e cita o restante.

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html).

| Categoria | Serviços |
|---|---|
| **Database** | Amazon Aurora, Amazon Aurora Serverless, Amazon DocumentDB, Amazon DynamoDB, Amazon ElastiCache, Amazon Keyspaces, Amazon Neptune, Amazon RDS e Amazon Redshift |
| **Migration and Transfer** (ligado a banco) | AWS DMS |
| **Storage** (ligado a banco) | AWS Backup |
| **Analytics** (ligado a banco) | Amazon Athena, AWS Glue e Amazon OpenSearch Service (ver decisões) |

Ficam fora da lista do exame e, portanto, da trilha: Amazon MemoryDB, Amazon Timestream e Amazon QLDB. Se a lista mudar, o plano muda junto.

Faltam no catálogo e entram nesta trilha: Aurora, Aurora Serverless, DocumentDB, DynamoDB, ElastiCache, Keyspaces, Neptune, Redshift e DMS, e o AWS Backup se o [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) ainda não o tiver declarado. O Athena e os demais serviços de análise só entram como citação (ver decisões).

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, juntando a fase 6 com a 7 |
| Análise de dados (Athena, Glue, OpenSearch, EMR, Kinesis) | Athena, Glue, OpenSearch e EMR ficam para o [plano de Análise de dados](PLANO-IMPLEMENTACAO-MODULO-ANALISE-DE-DADOS.md), e Kinesis para o plano de Integração e mensageria; aqui entra só o Redshift e uma carta explicando a diferença entre banco transacional e analítico | Athena entra na fase 7 |
| AWS Backup | Ensinado no [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) (fase 7); aqui a fase 8 ensina os backups do próprio banco (backup automático, restauração para um ponto no tempo, snapshots manuais) e cita o AWS Backup | Ensinado aqui (fase 8), porque a decisão do exame muitas vezes nasce de um banco |
| Migração de banco (DMS) | Ensinada aqui (fase 9), porque a decisão do exame quase sempre nasce de um banco | Fica para a fase 7 de Arquitetura e otimização |
| Preços | Preços reais da Price List API, como em Computação | Premissas fixas do cenário |

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a Computação, sem exigir.
- Entra em `MODULES` depois do `compute` (ou do `network`, se ele já existir).
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `database`; trilha `database.aws-database` ("Bancos de dados na AWS", subtítulo "Relacionais, NoSQL, cache e análise").
- Território `bancos-de-dados`, glifo `database`, `recommends: ['foundations.aws-foundations', 'compute.aws-compute']`.
- Prefixo das fases: `db.f0N`. Prefixos dos conceitos novos: `rds.*`, `aur.*`, `ddb.*`, `cache.*`, `nosql.*`, `rs.*`, `bkp.*`, `dms.*` e `db.*`.
- Pasta `src/content/modules/database/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | RDS essencial | motores suportados, classes de instância, armazenamento, parameter group, subnet group, responsabilidade compartilhada (reaproveita `srm.rds`) | `db-sizing`: dimensionar instância e armazenamento para uma carga |
| **F2** | Alta disponibilidade no RDS | Multi-AZ (instância e cluster), failover, réplicas de leitura, réplica entre Regiões, RDS Proxy, backups automáticos, restauração para um ponto no tempo, snapshots | `rds-ha`: montar a topologia que cumpre RPO e RTO |
| **F3** | Amazon Aurora | volume do cluster compartilhado, réplicas, endpoints, Aurora Global Database, Aurora Serverless, quando escolher Aurora em vez de RDS | `aurora-vs-rds`: escolha e custo |
| **F4** | DynamoDB: modelagem | tabela, item, chave de partição e de ordenação, índices (global e local), consistência de leitura, modos de capacidade (sob demanda e provisionado), partição quente | `ddb-keys`: escolher a chave e calcular a capacidade |
| **F5** | DynamoDB: recursos avançados | Streams, TTL, DAX, tabelas globais, backup e recuperação para um ponto no tempo, transações | `ddb-features`: resolver cenários com o recurso certo |
| **F6** | Cache e bancos especializados | ElastiCache (Redis/Valkey e Memcached), estratégias de cache (leitura sob demanda, escrita direta, TTL), DocumentDB, Neptune, Keyspaces | `cache-sim`: taxa de acerto, latência e custo |
| **F7** | Data warehouse com Redshift | processamento transacional × analítico, armazenamento em colunas, cluster e Serverless, Spectrum, cópia de snapshots; carta sobre Athena e demais serviços de análise | `rs-fit`: dizer quando Redshift é a resposta |
| **F8** | Segurança e backup | criptografia em repouso e em trânsito, autenticação por IAM, segredos, security groups, rede privada, backup automático, restauração para um ponto no tempo e snapshots manuais, com o AWS Backup citado (reaproveita os conceitos do [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)) | `db-secure`: fechar as brechas de um banco exposto |
| **F9** | Migração e escolha | DMS (migração homogênea e heterogênea, captura contínua de mudanças), Schema Conversion Tool, quadro de escolha do banco | `db-chooser`: requisito para banco |
| **Final** | Arquitetura de Dados | integração | Varejo fictício, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F2.
- F5 exige F4.
- F8 exige F1.
- F9 exige F3, F5 e F6.
- O final exige as nove.
- As demais só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1 e F4.
- x=300: F2, F5 e F6.
- x=560: F3, F7 e F8.
- x=820: F9 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Arquitetura de Dados

- Empresa fictícia de varejo com catálogo de produtos, carrinho de compras, pedidos, relatórios e um banco legado no escritório.
- Etapas do `architecture`:
  1. Banco transacional dos pedidos.
  2. Alta disponibilidade e réplicas.
  3. Catálogo e carrinho em NoSQL.
  4. Cache.
  5. Análise e relatórios.
  6. Segurança do acesso.
  7. Backup e recuperação de desastre.
  8. Migração do banco legado e custo.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 36 missões, 95 atividades, 75 conceitos novos, 8 laboratórios novos, 20 conquistas (`ach.db-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

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
| `rdsha/` | Topologia de um banco (instância única, Multi-AZ, réplicas de leitura, réplica em outra Região) contra os requisitos de RPO, RTO e leitura. Simula a falha de uma instância, de uma zona e de uma Região e diz o que acontece com as escritas, as leituras e os dados. Retenção de backup e restauração para um ponto no tempo. |
| `dynamo/` | Cálculo de unidades de leitura e escrita pelo tamanho do item e pela consistência (a fórmula da documentação vira teste), distribuição de requisições por chave de partição para mostrar a partição quente, e comparação entre modo sob demanda e provisionado pela tabela de preços. |
| `cachedb/` | Taxa de acerto, latência média e carga no banco com e sem cache; estratégias de leitura sob demanda e de escrita direta; efeito do TTL em dados desatualizados. Os números de latência são premissa do cenário. |
| `dbchooser/` | Escolha do banco, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Requisitos: SQL e junções, esquema flexível, milissegundos em escala, grafo, compatível com Cassandra, compatível com MongoDB, análise de dados, cache, migração. |
| `migration/` | Plano de migração com DMS: tipo (homogênea ou heterogênea), carga completa e captura de mudanças, tempo de indisponibilidade e passos obrigatórios (como converter o esquema). |

Reaproveitado sem alteração: `architecture/` no desafio final, `zones/` na fase de alta disponibilidade e o motor de políticas (predição `policy`) para a autenticação por IAM na fase 8.

### Preços

- Novo script `scripts/fetch-database-prices.mjs` (`npm run prices:database`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/database-prices.json` com a data de publicação.
- Itens previstos: RDS (instância por hora, Multi-AZ e armazenamento por GB), Aurora (instância, armazenamento, E/S e ACU do Serverless), DynamoDB (leitura e escrita sob demanda e provisionadas, armazenamento), ElastiCache (nó por hora) e Redshift (nó e Serverless).
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | motores do RDS e versões; limite de armazenamento por motor; tipos de armazenamento (gp3, io1/io2 e o que é padrão hoje); parameter group; o que a AWS gerencia × o que é do cliente |
| F2 | Multi-AZ de instância × Multi-AZ de cluster (standbys, leitura no standby, tempo típico de failover); réplicas de leitura (limite por origem, entre Regiões, promoção); RDS Proxy; retenção dos backups automáticos (mínimo e máximo); restauração para um ponto no tempo (janela e granularidade); snapshots manuais e compartilhamento |
| F3 | 6 cópias em 3 AZs no volume do Aurora; limite de réplicas; endpoints (cluster, leitor, personalizado); Global Database (Regiões secundárias e tempo de replicação); **situação atual do Aurora Serverless v1 e v2** (a lista do exame cita "Aurora Serverless", mas a versão v1 pode estar descontinuada); Aurora I/O-Optimized; Backtrack |
| F4 | tamanho máximo do item; chaves de partição e de ordenação; GSI × LSI (limites e quando criar); leitura eventualmente consistente × fortemente consistente × transacional (custo de cada); definição de RCU e WCU; modo sob demanda × provisionado (e troca entre eles); capacidade adaptativa; limites por partição |
| F5 | DynamoDB Streams (retenção, ordem); TTL; DAX (o que cobre e o que não cobre); tabelas globais (consistência entre Regiões, resolução de conflitos); PITR (janela); transações (limites); exportação para o S3 |
| F6 | ElastiCache: Redis/Valkey × Memcached (replicação, persistência, tipos de dados, multithreading); modo cluster; estratégias de cache e TTL; DocumentDB (compatibilidade com MongoDB, armazenamento compartilhado); Neptune (grafos, linguagens de consulta); Keyspaces (compatível com Cassandra, modos de capacidade); **disponibilidade atual de cada serviço** |
| F7 | Redshift (armazenamento em colunas, processamento paralelo em massa, nós e Serverless, Spectrum, compartilhamento de dados, snapshots entre Regiões, Multi-AZ); diferença para Athena |
| F8 | criptografia em repouso (decidida na criação do banco, e como criptografar um banco que não nasceu criptografado); TLS; autenticação por IAM no RDS e Aurora; integração com Secrets Manager (reaproveitar a verificação do [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md)); backup automático (janela, retenção máxima), restauração para um ponto no tempo, snapshots manuais e cópia entre Regiões; AWS Backup (reaproveitar a verificação do [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)) |
| F9 | DMS (instância de replicação, endpoints, tarefas, captura contínua de mudanças, DMS Serverless); Schema Conversion Tool; migração homogênea × heterogênea; migração de bancos do Oracle ou SQL Server para Aurora |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e novidades recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `bancos-de-dados` passa para `active` e deixa de ter `plannedServices`.
- **`content/catalog/services.ts`:** novos serviços `aws.aurora`, `aws.dynamodb`, `aws.elasticache`, `aws.documentdb`, `aws.neptune`, `aws.keyspaces`, `aws.redshift` e `aws.dms`, e `aws.backup` se o [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) ainda não o tiver declarado. O Aurora Serverless entra como parte de `aws.aurora`, conforme a situação verificada. Cada serviço com `docsUrl` conferido. `aws.backup` e `aws.dms` ficam nos territórios de origem do catálogo (Armazenamento e o de migração, se existir), como acontece com o ELB em Computação.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): o glifo `database` já existe. Avaliar `table`, `layers` e `archive` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES = [..., computeModule, databaseModule]` e novo `CONTENT_VERSION`.
- **`engine/types.ts`:** nenhuma mudança prevista. `mapHeight` já existe em `TrackDef`.
- **`package.json`:** script `prices:database`. **`vite.config.ts`:** chunk `content-database`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Territórios vizinhos:** conferir se a trilha pode listar `aws.backup` e `aws.dms` em `serviceIds` sem duplicar a contagem no Codex.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `rdsha` |
| **M3** | F3 (Aurora) e F4 (DynamoDB), com `dynamo` |
| **M4** | F5 e F6, com `cachedb` |
| **M5** | F7 e F8 |
| **M6** | F9 e desafio final, com `dbchooser`, `migration`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:database   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e               # capturas em screenshots/
npm run dev               # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e Computação;
- **Codex:** não duplica os conceitos reaproveitados (`infra.rds-multi-az`, `srm.rds`);
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **cálculo de capacidade do DynamoDB:** reproduz o exemplo da documentação;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Serviços com mudança recente:** Aurora Serverless (v1 e v2), DMS Serverless, tabelas globais e novidades do Redshift evoluem rápido. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Fidelidade dos simuladores:** `rdsha` e `dynamo` modelam regras reais (failover, capacidade por item). Cada regra tem teste que reproduz o exemplo da documentação. Números de latência e de tempo de failover são premissa do cenário e aparecem no painel "Simplificações".
- **Muitos serviços parecidos:** o exame cobra a escolha entre RDS, Aurora, DynamoDB, ElastiCache e Redshift. O quadro de escolha da fase 9 e as questões do `questions.ts` precisam de cenários que diferenciem de verdade, sem pegadinhas de vocabulário.
- **Sobreposição com outras trilhas:** criptografia, segredos e backup também aparecem no [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) e no [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md). Reaproveitar conceitos em vez de redeclarar, para não duplicar o Codex nem quebrar o progresso salvo.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
