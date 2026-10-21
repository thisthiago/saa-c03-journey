# Plano de implementação: módulo de Monitoramento e governança ("Monitoramento e governança na AWS")

Plano para o módulo de monitoramento e governança do AWS Quest, escrito em 20/10/2026. Nada aqui foi implementado ainda. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md) e [Integração e mensageria](PLANO-IMPLEMENTACAO-MODULO-INTEGRACAO-E-MENSAGERIA.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O território `monitoramento` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'planned'`, o resumo "Métricas, auditoria, conformidade e recomendações." e quatro serviços previstos: Amazon CloudWatch, AWS CloudTrail, AWS Config e AWS Trusted Advisor.
- Já estão em [services.ts](../src/content/catalog/services.ts):
  - no território `monitoramento`: `aws.cloudtrail`, `aws.trusted-advisor` e `aws.health`;
  - no território `seguranca`: `aws.organizations` e `aws.control-tower`;
  - no território `computacao`: `aws.compute-optimizer` e `aws.savings-plans`.
- Outras trilhas já ensinam parte do tema, e esta trilha **não repete** esses pontos:
  - a AWS Foundations ensina os planos de suporte e o Trusted Advisor (`support.*`);
  - a trilha IAM ensina Organizations, SCP, RCP, Control Tower e o acesso root centralizado (`org.*`), além do relatório de credenciais e do IAM Access Analyzer;
  - a trilha de Computação ensina Compute Optimizer e Savings Plans.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `org.organizations`, `org.scp`, `org.scp-inheritance`, `org.rcp`, `org.control-tower`, `org.root-access-central`, `support.trusted-advisor`, `iam.access-analyzer` e `iam.credential-report`. Antes de escrever cada fase, procurar no código conceitos de CloudTrail, Auto Scaling e Savings Plans já declarados nas trilhas IAM e Computação.
- Simuladores que já existem e podem ser reaproveitados: `org/` (organização e SCPs), `support/` (planos de suporte), `cost/` (fatura do S3), `architecture/` (desafio final) e o motor de políticas em `policy/`.

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html).

| Categoria | Serviços |
|---|---|
| **Management and Governance** | AWS Auto Scaling, AWS CLI, AWS CloudFormation, AWS CloudTrail, Amazon CloudWatch, AWS Compute Optimizer, AWS Config, AWS Control Tower, AWS Health Dashboard, AWS License Manager, Amazon Managed Grafana, Amazon Managed Service for Prometheus, AWS Management Console, AWS Organizations, AWS Service Catalog, AWS Systems Manager, AWS Trusted Advisor e AWS Well-Architected Tool |
| **AWS Cost Management** | AWS Budgets, AWS Cost and Usage Report, AWS Cost Explorer e Savings Plans |
| **Developer Tools** | AWS X-Ray |

O que já é ensinado em outras trilhas e aqui só é reaproveitado: AWS Auto Scaling, Compute Optimizer e Savings Plans (Computação); Organizations e Control Tower (IAM); Trusted Advisor (Foundations).

Faltam no catálogo e entram nesta trilha: CloudWatch, Config, Systems Manager, CloudFormation, Service Catalog, License Manager, Managed Grafana, Managed Service for Prometheus, X-Ray, Budgets, Cost Explorer e Cost and Usage Report. A AWS CLI e o Management Console aparecem só como citação, sem serviço próprio no catálogo.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, juntando a fase 5 com a 6 |
| Ferramentas de custo (Budgets, Cost Explorer, Cost and Usage Report, tags de alocação de custo) | Entram aqui (fase 8), como ferramentas de governança | Ficam para a trilha de Arquitetura e otimização, cujo resumo no catálogo cita "custos" |
| Well-Architected Tool | Fica para a trilha de Arquitetura e otimização, que já prevê o Well-Architected Framework | Entra na fase 9 |
| Governança multiconta | A fase 7 aprofunda o que a trilha IAM começou (Control Tower, políticas da organização além de SCP, contas por função) sem repetir SCP | Sem fase própria; só uma carta citando a trilha IAM |
| Preços | Preços reais da Price List API, como em Computação | Premissas fixas do cenário |

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a IAM e Access Management, sem exigir.
- Entra em `MODULES` depois das trilhas que já existirem quando ela for implementada.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `governance`; trilha `governance.aws-governance` ("Monitoramento e governança na AWS", subtítulo "Métricas, auditoria, conformidade, automação e custos").
- Território `monitoramento`, glifo `eye`, `recommends: ['foundations.aws-foundations', 'identity.iam-access']`.
- Prefixo das fases: `gov.f0N`. Prefixos dos conceitos novos: `cw.*`, `logs.*`, `trail.*`, `cfg.*`, `ssm.*`, `cfn.*`, `fin.*` e `gov.*`.
- Pasta `src/content/modules/governance/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | CloudWatch: métricas e alarmes | métrica, namespace e dimensão, métricas padrão × personalizadas, resolução, por que memória e disco exigem o agente, alarme e seus estados, períodos e pontos de dados, dados ausentes, ações do alarme, alarme composto, painéis | `alarm`: configurar o alarme para disparar só no problema real |
| **F2** | Logs e observabilidade | grupos e fluxos de logs, retenção, filtro de métrica, Logs Insights, filtro de assinatura, agente do CloudWatch, X-Ray (rastreamento entre serviços), carta sobre Managed Prometheus e Managed Grafana | `logs`: transformar logs em métrica e alarme, com retenção e custo |
| **F3** | CloudTrail | eventos de gerenciamento × de dados, histórico de eventos, trilha, trilha em várias Regiões e da organização, validação de integridade dos arquivos, entrega no S3 e no CloudWatch Logs, CloudTrail Insights e Lake | `trail`: descobrir quem fez o quê, e montar a trilha que teria registrado |
| **F4** | AWS Config | gravação de configuração, item de configuração, regras gerenciadas e personalizadas, conformidade, remediação automática, pacotes de conformidade, agregador; quem responde a cada pergunta: CloudWatch, CloudTrail ou Config | `compliance`: escolher regras e remediações para fechar as não conformidades |
| **F5** | Systems Manager | Session Manager (acesso sem SSH nem porta aberta), Run Command, Patch Manager, Parameter Store (a comparação com o Secrets Manager fica na fase 3 do [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md)), Automation, inventário | Decisão e classificação; predição "precisa abrir porta?" |
| **F6** | Infraestrutura como código | CloudFormation (template, stack, change set, atualização com e sem substituição, política de exclusão, StackSets, detecção de desvio), Service Catalog (produtos aprovados para os times), citação da CLI e do Console | `stack`: prever o que uma atualização faz com cada recurso |
| **F7** | Governança multiconta | estrutura de contas por função (reaproveita `org.*`), Control Tower (landing zone, controles preventivos, detectivos e proativos, Account Factory), políticas da organização além de SCP (tags, backup; o AWS Backup em si fica no [plano de Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md)), administrador delegado, License Manager | Reaproveita `org/`; investigação de uma conta fora do padrão |
| **F8** | Custos | faturamento consolidado da organização (uma fatura para várias contas, descontos por volume e compromissos compartilhados entre contas), Cost Explorer, Budgets (custo e uso, real × previsto, ações), Cost and Usage Report, tags de alocação de custo, detecção de anomalias de custo, recomendações de Savings Plans e do Compute Optimizer (reaproveita a Computação) | `budget`: montar orçamentos e tags para achar quem gastou |
| **F9** | Recomendações e escolha | Trusted Advisor (reaproveita `support.trusted-advisor`), Health Dashboard (eventos da conta × status público), Service Quotas (consultar, pedir aumento, alarme perto do limite e cotas iguais no ambiente de standby), quadro "qual serviço responde a qual pergunta" | `ops-chooser`: pergunta para serviço |
| **Final** | Central de Operações | integração | Empresa fictícia com várias contas, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F4 exige F3.
- F7 exige F4.
- F9 exige F2, F7 e F8.
- O final exige as nove.
- As demais só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1, F3 e F5.
- x=300: F2, F4 e F6.
- x=560: F7 e F8.
- x=820: F9 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Central de Operações

- Empresa fictícia com várias contas, um incidente em produção, uma auditoria marcada e uma fatura que cresceu sem explicação.
- Etapas do `architecture`:
  1. Métricas e alarmes da aplicação.
  2. Logs centralizados e rastreamento.
  3. Auditoria de quem fez o quê.
  4. Conformidade das configurações.
  5. Acesso e correções sem abrir portas.
  6. Ambientes criados por código.
  7. Contas e controles da organização.
  8. Orçamentos, tags e recomendações de custo.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 34 missões, 90 atividades, 65 conceitos novos, 6 laboratórios novos, 20 conquistas (`ach.gov-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

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
| `alarm/` | Avaliação de um alarme do CloudWatch sobre uma série de pontos: período, estatística, limite, períodos de avaliação, pontos que disparam o alarme ("M de N") e tratamento de dados ausentes. Mostra em que momento o alarme muda de estado. Os exemplos da documentação viram teste. |
| `logs/` | Filtro de métrica sobre linhas de log, retenção do grupo e custo de ingestão e armazenamento pela tabela. |
| `trail/` | Linha do tempo de ações numa conta e o que cada configuração registra: histórico de eventos, trilha de uma Região ou de todas, eventos de dados ligados ou não. Responde "esse evento aparece? onde? por quanto tempo?". |
| `compliance/` | Recursos fictícios avaliados por regras do Config, com o resultado de conformidade e o efeito de cada remediação. |
| `stack/` | Atualização de uma stack do CloudFormation: para cada propriedade alterada, se o recurso é atualizado sem interrupção, com interrupção ou substituído, e o efeito da política de exclusão. Só usa recursos e propriedades conferidos na documentação. |
| `budget/` | Gastos diários por conta e por tag, orçamentos com limites de valor real e previsto, e quais alertas disparam. Mostra o custo sem tag como "não alocado". |
| `opschooser/` | Escolha do serviço, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Perguntas: "a CPU subiu?", "quem apagou o bucket?", "a configuração mudou?", "estamos conformes?", "quem gastou?", "a AWS está com problema na minha Região?". |

Reaproveitado sem alteração: `architecture/` no desafio final, `org/` na fase 7, `support/` na fase 9 e o motor de políticas (predição `policy`) para políticas da organização.

### Preços

- Novo script `scripts/fetch-governance-prices.mjs` (`npm run prices:governance`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/governance-prices.json` com a data de publicação.
- Itens previstos: CloudWatch (métricas personalizadas, alarmes, painéis, ingestão e armazenamento de logs, consultas do Logs Insights), CloudTrail (eventos de dados e cópias adicionais de eventos de gerenciamento) e Config (itens de configuração e avaliações de regras).
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | intervalo das métricas padrão do EC2 (básico × detalhado); quais métricas exigem o agente; resolução padrão × alta; estados do alarme; "M de N"; opções de dados ausentes; ações possíveis (SNS, Auto Scaling, ações do EC2, Systems Manager); alarme composto; retenção das métricas |
| F2 | retenção padrão dos logs; filtro de métrica e filtro de assinatura (destinos); Logs Insights; classes de log; agente do CloudWatch (nome e recursos atuais); X-Ray (segmentos, mapa de serviços) e sua relação atual com o CloudWatch Application Signals; Managed Prometheus e Managed Grafana (o que cada um é) |
| F3 | o que o histórico de eventos guarda e por quanto tempo; eventos de gerenciamento × de dados × de atividade de rede; trilha de várias Regiões e da organização; validação de integridade; CloudTrail Insights; CloudTrail Lake; tempo típico de entrega |
| F4 | gravação contínua × periódica; regras gerenciadas e personalizadas (Lambda e Guard); gatilhos por mudança e periódicos; remediação com Systems Manager Automation; pacotes de conformidade; agregador entre contas e Regiões; Config × CloudTrail |
| F5 | Session Manager (sem porta de entrada, registro das sessões); pré-requisitos (agente, role da instância); Parameter Store (padrão × avançado, `SecureString`) × Secrets Manager; Patch Manager e baselines; Automation; nomes atuais das capacidades do Systems Manager |
| F6 | seções do template; change set; comportamento de atualização por propriedade; `DeletionPolicy` e `UpdateReplacePolicy`; StackSets (permissões autogerenciadas × gerenciadas pela organização); detecção de desvio; rollback; Service Catalog (portfólio, produto, restrições) |
| F7 | Control Tower (landing zone, contas padrão, tipos de controle, Account Factory, Regiões governadas); tipos de política da organização além de SCP e RCP; administrador delegado; License Manager (regras de licença, BYOL) |
| F8 | faturamento consolidado (conta de gerenciamento, descontos por volume, compartilhamento de RIs e Savings Plans entre contas e como desligá-lo); Budgets (tipos, limites real e previsto, ações de orçamento); Cost Explorer (histórico e previsão); situação atual do Cost and Usage Report × Data Exports; tags de alocação de custo (ativação, tags geradas pela AWS, sem efeito retroativo); Cost Anomaly Detection |
| F9 | categorias de verificação do Trusted Advisor e o que cada plano de suporte libera (reaproveitar o que a Foundations já verificou); Health Dashboard (visão da conta × status público, integração com EventBridge e com a organização); Service Quotas (cotas ajustáveis × fixas, pedido de aumento, integração com CloudWatch, modelo de cotas para contas novas da organização) |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e mudanças de nome recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `monitoramento` passa para `active` e deixa de ter `plannedServices`. Se as ferramentas de custo entrarem, o resumo do território ganha "custos".
- **`content/catalog/services.ts`:** novos serviços `aws.cloudwatch`, `aws.config`, `aws.systems-manager`, `aws.cloudformation`, `aws.service-catalog`, `aws.license-manager`, `aws.managed-grafana`, `aws.managed-prometheus`, `aws.x-ray`, `aws.budgets`, `aws.cost-explorer`, `aws.cost-usage-report` e `aws.service-quotas`. Cada um com `docsUrl` conferido. O nome do Cost and Usage Report segue a situação verificada na fase 8.
- **Territórios:** Organizations e Control Tower ficam em `seguranca`, e Compute Optimizer e Savings Plans em `computacao`, como hoje. A trilha cita esses serviços sem movê-los.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): `eye` já existe. Avaliar `bell`, `scroll` e `wallet` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `governanceModule` e `CONTENT_VERSION` muda.
- **`engine/types.ts`:** nenhuma mudança prevista. `mapHeight` já existe em `TrackDef`.
- **`package.json`:** script `prices:governance`. **`vite.config.ts`:** chunk `content-governance`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Serviços de outros territórios:** conferir se a trilha pode listar `aws.organizations`, `aws.control-tower`, `aws.compute-optimizer` e `aws.savings-plans` em `serviceIds` sem duplicar a contagem no Codex.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `alarm` e `logs` |
| **M3** | F3 e F4, com `trail` e `compliance` |
| **M4** | F5 e F6, com `stack` |
| **M5** | F7 e F8, com `budget` (e `org/` reaproveitado) |
| **M6** | F9 e desafio final, com `opschooser`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:governance   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e                 # capturas em screenshots/
npm run dev                 # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e IAM;
- **Codex:** não duplica os conceitos reaproveitados (`org.*`, `support.*`, `iam.*`);
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **simulador de alarme:** reproduz os exemplos de "M de N" e de dados ausentes da documentação;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Sobreposição com Foundations, IAM e Computação:** Trusted Advisor, Organizations, SCP, Control Tower, Compute Optimizer e Savings Plans já são ensinados. Reaproveitar os conceitos em vez de redeclarar, e citar a fase de origem.
- **Serviços que mudam de nome e de formato:** Cost and Usage Report e Data Exports, X-Ray e Application Signals, capacidades do Systems Manager e eventos do CloudTrail mudam com frequência. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Fidelidade do simulador de CloudFormation:** o comportamento de atualização varia por recurso e por propriedade. O `stack` usa só os casos conferidos na documentação e declara essa limitação no painel "Simplificações".
- **Trilha "de leitura":** monitoramento tende a virar lista de serviços. Cada fase precisa de um laboratório ou de uma investigação em que o jogador use o serviço para responder uma pergunta real, não só associe nomes.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
