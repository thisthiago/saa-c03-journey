# Plano de implementação: módulo de Arquitetura e otimização ("Arquitetura e otimização na AWS")

Plano para o módulo de arquitetura e otimização do AWS Quest, escrito em 20/10/2026 e **implementado em 22/10/2026**, com as opções recomendadas (ver a seção "Trilha Arquitetura e otimização na AWS" em [CONTEUDO.md](CONTEUDO.md) e os fatos em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md)).

> **Diferenças em relação ao plano:**
> - O AWS Application Migration Service agora se chama **AWS Transform MGN**; o serviço `aws.application-migration-service` usa o nome novo e avisa que a lista do exame ainda usa o antigo.
> - A Snow Family não aceita novos clientes: a cópia em massa da F7 usa o DataSync com Direct Connect ou o AWS Data Transfer Terminal.
> - O mapa usa cinco colunas (90, 270, 450, 630 e 815), não quatro, com F7 e F9 na quarta coluna.
> - Além dos seis laboratórios previstos, a F4 ganhou o `perf-chooser`, no motor genérico de escolha; o simulador de migração se chama `migplan/`, para não se confundir com o `migration/` (DMS).
> - A trilha tem 38 missões, 103 atividades, 62 conceitos novos e 40 questões; o `passThreshold` do final ficou em 0,7.

O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md), [Integração e mensageria](PLANO-IMPLEMENTACAO-MODULO-INTEGRACAO-E-MENSAGERIA.md) e [Monitoramento e governança](PLANO-IMPLEMENTACAO-MODULO-MONITORAMENTO-E-GOVERNANCA.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O território `arquitetura` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'planned'`, o resumo "Alta disponibilidade, recuperação de desastres, custos e Well-Architected." e um serviço previsto: AWS Well-Architected Framework.
- Diferente das outras trilhas, esta **não é sobre um grupo de serviços**. Ela ensina a decidir: ler o requisito, pesar alternativas e escolher entre os serviços que as outras trilhas apresentaram. Por isso é a trilha de fechamento da plataforma.
- Em [services.ts](../src/content/catalog/services.ts) já estão `aws.datasync` e `aws.snowball-edge` (S3 Expedition). Não existem `aws.well-architected-tool`, `aws.backup` nem `aws.application-migration-service`.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `dr.rpo-rto`, `infra.ha-vs-dr`, `infra.spof`, `infra.static-stability`, `infra.multi-az`, `infra.az`, `infra.region`, `infra.region-selection`, `infra.data-residency`, `infra.rds-multi-az` e `infra.alb-zones`. Também os conceitos de compra e escalonamento da Computação e os de classes de armazenamento e replicação da S3 Expedition. Antes de escrever cada fase, procurar no código o que a Foundations já diz sobre o Well-Architected (há menções em `foundations/concepts/f02-suporte.ts`).
- Simuladores que já existem e podem ser reaproveitados: `architecture/` (é o motor dos desafios finais e o centro desta trilha), `zones/`, `regions/`, `replication/`, `purchase/`, `instances/`, `chooser/`, `cost/` e as tabelas de preços de S3 e de Computação.

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html).

| Categoria | Serviços ligados a esta trilha |
|---|---|
| **Management and Governance** | AWS Well-Architected Tool |
| **Storage** | AWS Backup (os planos de Bancos de dados e de Arquivos e backup também o usam; ver decisões) |
| **Migration and Transfer** | AWS Application Migration Service, AWS DataSync, AWS DMS, AWS Snow Family e AWS Transfer Family |
| **AWS Cost Management** | Budgets, Cost Explorer, Cost and Usage Report e Savings Plans (ensinados em Monitoramento e governança e em Computação) |

A lista não traz AWS Elastic Disaster Recovery, AWS Resilience Hub, AWS Fault Injection Service nem AWS Migration Hub. Eles ficam fora da trilha enquanto a lista não mudar.

Além da lista de serviços, o guia do exame define os quatro domínios (Seguro, Resiliente, Alto desempenho e Custo) que o motor `architecture/` já usa como dimensões (d1 a d4). Os pesos de cada domínio entram na seção de fatos a conferir.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, juntando a fase 8 com a 9 |
| Posição na plataforma | Trilha de fechamento: recomenda Foundations, S3, IAM e Computação, sem exigir; cada missão diz qual trilha aprofunda o assunto | Só abre depois que o jogador concluir um número mínimo de trilhas |
| Leitura de questões do exame | Entra como fase 9 ("Como o exame pergunta"), usando cenários próprios | Fica só na tela de revisão (`#/revisao/questoes`) que já existe |
| Migração (7 Rs, Application Migration Service) | Entra aqui (fase 7), porque é uma decisão de arquitetura; o DMS só é citado se já estiver na trilha de Bancos de dados | Fica para uma trilha própria de Migração |
| AWS Backup | Ensinado no [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) (fase 7), junto dos outros serviços de armazenamento; aqui a fase 3 o usa como ferramenta da estratégia de backup e restauração, reaproveitando os conceitos | Ensinado aqui, na fase 3, ou na fase 8 de Bancos de dados |
| Transfer Family | Ensinado no [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) (fase 6), como opção híbrida de entrada de arquivos; aqui a fase 7 só o cita | Ensinado aqui, na fase 7 |
| Preços | Reaproveitar as tabelas reais de S3 e de Computação e acrescentar só a transferência de dados | Premissas fixas do cenário |

**Atenção:** a decisão sobre o AWS Backup afeta os planos de Bancos de dados e de Arquivos e backup, a do Transfer Family afeta o de Arquivos e backup, e a de custos depende de onde o plano de Monitoramento e governança colocar Budgets e Cost Explorer. As três precisam ser decididas juntas, com a mesma resposta em todos os planos.

**Seguidas por padrão, como nas outras trilhas**
- Entra por último em `MODULES`.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `architecture`; trilha `architecture.well-architected` ("Arquitetura e otimização na AWS", subtítulo "Well-Architected, resiliência, desempenho, custo e migração"). A pasta do módulo (`src/content/modules/architecture/`) não se confunde com o simulador `src/simulators/architecture/`, mas os imports precisam de nomes claros (por exemplo, `architectureModule` e `ArchitectureLab`).
- Território `arquitetura`, glifo `flag`, `recommends: ['foundations.aws-foundations', 'storage.s3-expedition', 'identity.iam-access', 'compute.aws-compute']`. Os IDs exatos das trilhas são conferidos no código na hora de escrever.
- Prefixo das fases: `arq.f0N`. Prefixos dos conceitos novos: `wa.*`, `res.*`, `dr.*` (o prefixo já existe por `dr.rpo-rto`), `perf.*`, `opt.*`, `mig.*`, `pat.*` e `exam.*`.

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | Well-Architected Framework | os pilares, princípios de design, lentes, Well-Architected Tool (revisão de carga de trabalho, riscos altos e médios), trade-offs entre pilares | `wa-review`: revisar uma carga fictícia e priorizar os riscos |
| **F2** | Arquiteturas resilientes | ponto único de falha (reaproveita `infra.spof`), Multi-AZ, estabilidade estática, escalar na horizontal × na vertical, desacoplamento, degradação controlada, cotas de serviço, melhorar a confiabilidade de uma aplicação legada que não pode ser alterada (balanceador, Auto Scaling, RDS Proxy e health checks do Route 53 por fora do código) | Reaproveita `zones/`; investigação "o que caiu junto?" |
| **F3** | Recuperação de desastres | RPO e RTO (reaproveita `dr.rpo-rto`), backup e restauração, pilot light, warm standby, ativo-ativo em várias Regiões, AWS Backup como ferramenta do backup e restauração (reaproveita os conceitos do [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)), failover por DNS (cita a trilha de Redes) | `dr`: escolher a estratégia que cumpre RPO e RTO pelo menor custo |
| **F4** | Alto desempenho | escolher computação, armazenamento, banco e rede pelo padrão de acesso; cache em camadas; separar leitura de escrita; aproximar os dados do usuário | Decisões e classificação, com reaproveitamento de `chooser/` |
| **F5** | Segurança na arquitetura | defesa em camadas, menor privilégio, criptografia em repouso e em trânsito, segmentação de rede, contas separadas por ambiente; cita as trilhas IAM e Redes e o [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) | Investigação de uma arquitetura com brechas |
| **F6** | Otimização de custos | dimensionamento correto, opções de compra (reaproveita Computação), classes de armazenamento (reaproveita S3), custo de transferência de dados (entre AZs, entre Regiões, para a internet), serverless × provisionado, desligar fora do horário | `transfer-cost` e `rightsizing` |
| **F7** | Migração | as estratégias de migração (os "7 Rs"), Application Migration Service, transferência de dados em massa (reaproveita DataSync e Snow da S3 Expedition), Transfer Family (cita o [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)), migração de banco (cita o DMS) | `migration-plan`: estratégia e ferramenta para cada sistema |
| **F8** | Padrões de arquitetura | três camadas, microsserviços, serverless, orientada a eventos, substituição gradual do legado, arquitetura multi-Região, infraestrutura imutável (substituir em vez de corrigir no lugar), estratégias de implantação (all at once, rolling, blue/green, canário) e como cada uma reduz o risco de uma mudança; quando cada um vale a pena | Decisão e ordenação |
| **F9** | Como o exame pergunta | requisito decisivo ("menor custo", "menos esforço operacional", "maior disponibilidade"), restrições escondidas no enunciado, eliminar alternativas que funcionam mas não atendem, questões de resposta múltipla | `exam-reader`: marcar o requisito decisivo e eliminar alternativas |
| **Final** | Revisão Well-Architected | integração de todas as trilhas | Empresa fictícia em crescimento, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F2.
- F4 exige F1.
- F5 exige F1.
- F6 exige F1.
- F7 exige F3.
- F8 exige F2 e F4.
- F9 exige F3, F5, F6 e F8.
- O final exige as nove.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1.
- x=300: F2, F4, F5 e F6.
- x=560: F3, F7 e F8.
- x=820: F9 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Revisão Well-Architected

- Empresa fictícia que cresceu rápido numa única AZ: sem recuperação de desastres, com custo alto, acesso amplo demais e um sistema legado no escritório.
- Etapas do `architecture`:
  1. Revisão inicial e riscos prioritários.
  2. Alta disponibilidade.
  3. Recuperação de desastres.
  4. Desempenho e cache.
  5. Segurança em camadas.
  6. Custo de computação e armazenamento.
  7. Custo de transferência de dados.
  8. Migração do legado.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7). Como é a trilha de fechamento, cabe avaliar se o `passThreshold` deve subir; a decisão fica para o M6.

### Tamanho estimado

Em torno de 34 missões, 90 atividades, 55 conceitos novos (menos que nas outras trilhas, porque esta reaproveita muito), 6 laboratórios novos, 20 conquistas (`ach.arq-*`) e 40 questões no `questions.ts`, cobrindo os quatro domínios e as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

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
| `wareview/` | Revisão de uma carga de trabalho fictícia: respostas a perguntas por pilar geram riscos altos e médios, e o jogador escolhe quais melhorias atacar primeiro com um orçamento de esforço. As perguntas são escritas para o jogo a partir da documentação, sem copiar o questionário oficial. |
| `dr/` | Estratégias de recuperação contra um desastre na Região: para cada estratégia, dados perdidos (RPO), tempo até voltar (RTO) e custo mensal da Região de recuperação. Tempos de restauração e de escalonamento são premissa do cenário; o custo usa as tabelas de preços existentes. |
| `transfercost/` | Caminhos de dados (mesma AZ, entre AZs, entre Regiões, para a internet, via CloudFront, via NAT, via endpoint) e o custo mensal de cada fluxo. Precisa de uma tabela de transferência de dados (ver Preços). |
| `rightsizing/` | Utilização de uma frota ao longo de semanas e a recomendação de tamanho e de opção de compra. Reaproveita `instances/` e `purchase/` e a tabela de Computação, sem duplicar o catálogo de tipos. |
| `migration/` | Sistemas de uma empresa fictícia e a estratégia de migração de cada um (das sete), com a ferramenta certa e as restrições (prazo, licença, dependências). Se o plano de Bancos de dados criar um simulador com o mesmo nome, os dois são unificados. |
| `examreader/` | Enunciado no formato do exame com trechos marcáveis: o jogador marca o requisito decisivo e elimina alternativas. Nota pela marcação e pela escolha final. Os enunciados são próprios, nunca questões reais do exame. |

Reaproveitado sem alteração: `architecture/` em todas as fases com decisões em etapas e no desafio final, e `zones/`, `regions/`, `replication/`, `chooser/` e `cost/` nas fases correspondentes.

### Preços

- As tabelas de S3 (`npm run prices:update`) e de Computação (`npm run prices:compute`) são reaproveitadas como estão.
- Falta a transferência de dados. Se o módulo de Redes já existir, `network-prices.json` cobre isso. Se não, um script pequeno `scripts/fetch-transfer-prices.mjs` (`npm run prices:transfer`) lê só os itens de transferência da Price List Bulk API e grava `src/content/pricing/transfer-prices.json`.
- O script falha se faltar qualquer preço e nunca inventa valores. A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| Geral | domínios do SAA-C03 e o peso de cada um no guia do exame; formato das questões (resposta única e múltipla) |
| F1 | pilares atuais do Well-Architected Framework e seus princípios de design; lentes disponíveis; o que a Well-Architected Tool faz (marcos, riscos altos e médios, perfis, revisões compartilhadas) |
| F2 | definições de disponibilidade e de estabilidade estática nos whitepapers atuais; Service Quotas e cotas ajustáveis × fixas (reaproveitar o plano de Monitoramento e governança); recursos que melhoram a confiabilidade de aplicações legadas sem mudar o código |
| F3 | nomes e definições das quatro estratégias de recuperação no whitepaper de DR; AWS Backup (reaproveitar a verificação do [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)); o que o Route 53 oferece para failover (a conferir junto com a trilha de Redes) |
| F4 | o que o pilar de eficiência de desempenho recomenda para escolher recursos; padrões de cache recomendados |
| F5 | princípios de design do pilar de segurança |
| F6 | princípios do pilar de otimização de custos; regras de cobrança de transferência de dados (entrada, mesma AZ, entre AZs, entre Regiões, internet, CloudFront) |
| F7 | as estratégias de migração (nomes e definições atuais, "7 Rs"); Application Migration Service (como replica e como corta); quando usar DataSync, Snow Family e Transfer Family (reaproveitar o que a S3 Expedition já verificou) |
| F8 | padrões descritos no AWS Prescriptive Guidance que forem citados (por exemplo, substituição gradual do legado); infraestrutura imutável e estratégias de implantação no whitepaper atual (nomes e definições de rolling, blue/green e canário) |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e mudanças de nome: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `arquitetura` passa para `active` e deixa de ter `plannedServices`.
- **`content/catalog/services.ts`:** novos serviços `aws.well-architected-tool`, `aws.application-migration-service`, `aws.transfer-family` e `aws.backup`, estes dois só se o [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md) ainda não os tiver declarado (o território dos dois é `armazenamento`). Cada um com `docsUrl` conferido. O Well-Architected Framework é um conjunto de boas práticas, não um serviço: aparece em conceitos, não em `services.ts`.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): `flag` já existe. Avaliar `scale`, `compass` e `life-buoy` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `architectureModule` no fim e `CONTENT_VERSION` muda.
- **`engine/types.ts`:** nenhuma mudança prevista. Se o `examreader` precisar de um tipo novo de atividade (marcação de trechos), ele entra como laboratório, sem mudar o motor.
- **`package.json`:** script `prices:transfer`, se for preciso. **`vite.config.ts`:** chunk `content-architecture`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Serviços de outros territórios:** conferir se a trilha pode listar `aws.datasync`, `aws.snowball-edge` e os serviços de Computação em `serviceIds` sem duplicar a contagem no Codex.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), tabela de transferência de dados se for preciso, loader com teste de forma |
| **M2** | F1 e F2, com `wareview` |
| **M3** | F3 e F4, com `dr` |
| **M4** | F5 e F6, com `transfercost` e `rightsizing` |
| **M5** | F7 e F8, com `migration` |
| **M6** | F9 e desafio final, com `examreader`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

Esta trilha depende do que as outras ensinam. O ideal é implementá-la por último; se vier antes de Redes, Bancos de dados, Integração ou Monitoramento, as missões que citam essas trilhas dizem "trilha em construção" em vez de apontar para fases que não existem.

## 8. Verificação ponta a ponta

```
npm run prices:transfer   # só se a tabela de transferência for necessária
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e               # capturas em screenshots/
npm run dev               # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com as trilhas previstas;
- **Codex:** não duplica os conceitos reaproveitados (`infra.*`, `dr.rpo-rto` e os de Computação e S3);
- **preços:** os valores nos laboratórios batem com os JSONs e mostram a data;
- **recuperação de desastres:** cada estratégia do `dr` cai na faixa de RPO e RTO que o whitepaper descreve;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Trilha que depende das outras:** muito do conteúdo é revisão aplicada. Se ela for escrita antes das trilhas de Redes, Bancos de dados ou Integração, terá de ensinar o mínimo desses serviços ou adiar missões. Por isso a recomendação é implementá-la por último.
- **Repetição:** o risco maior é repetir o que outras trilhas já ensinam. Cada missão precisa de uma decisão nova (trade-off entre pilares, combinação de serviços), não de uma releitura de conceitos.
- **Conteúdo de julgamento:** muitas respostas são "depende". As notas de 0,5 para "funciona, mas não é a melhor" precisam de justificativa escrita em cada opção, e os empates de melhor opção continuam proibidos (os labs de escolha já lançam erro nesse caso).
- **Questões do exame:** a fase 9 e o `questions.ts` usam só enunciados próprios. Nunca reproduzir questões reais.
- **Premissas de recuperação:** tempos de restauração e de failover variam muito na prática. Ficam como premissa do cenário, com selo, e o painel "Simplificações" explica por quê.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
