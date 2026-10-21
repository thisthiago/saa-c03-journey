# Conteúdo

## Trilha AWS Foundations

Módulo `src/content/modules/foundations/`. Conhecimento transversal: os conceitos (`infra.*`, `edge.*`, `support.*`, `srm.*`) são globais no registro e podem ser usados por qualquer trilha.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Infraestrutura global | Viajaí, AgendaSaúde, Estúdio Quadro a Quadro, Rota Viva, Laticínios Serra Azul, Sabor de Casa, Consultoria Horizonte | Regiões, AZs, borda (CloudFront), escolha da infraestrutura (2) |
| 2 | Planos de suporte | Grupo Pindorama | Support Plan Challenge |
| 3 | Responsabilidade compartilhada | Farmácia Bem Viver, Mercado Leve | Matriz por serviço |
| Final | Architecture Foundations | Pulso Fitness | Arquitetura em 8 etapas, com relatório ligado aos domínios do SAA-C03 |

**Dependências.** A Fase 1 é a entrada. As Fases 2 e 3 não exigem nada e recomendam a 1. O desafio final exige as três. A S3 Expedition tem `recommends: ['foundations.aws-foundations']`: aparece o aviso "Recomendado antes", sem bloquear.

**Fato × premissa.** Nos laboratórios, fatos verificados levam o selo "Fato · 18/10/2026" e valores do cenário (latências, gasto mensal) levam "Premissa do cenário". Regiões reais aparecem só com atributos conferidos: país, AZs, opt-in, disponibilidade do S3 Express One Zone e preço do S3 Standard.

## Trilha S3 Expedition

| Fase | Tema | Empresa fictícia | Laboratórios |
|---|---|---|---|
| 1 | Fundamentos | Estúdio Lumen | Explorador de bucket |
| 2 | Classes e custos | VitaImagem Diagnósticos | Otimizador de custos |
| 3 | Segurança, acesso e privacidade | Contabilix | Acesso (menor privilégio, acesso entre contas, correção de bucket exposto) |
| 4 | Criptografia | Pagaí Pagamentos | Acesso com TLS e KMS |
| 5 | Versionamento | Traço Arquitetura | Versionamento (atualização segura, recuperação, período suspenso) |
| 6 | Lifecycle | RotaLog Transportes | Lifecycle (regras, limpeza, política ruim) |
| 7 | Replicação e DR | Nimbus Seguros | Replicação |
| 8 | Eventos | Feira Digital | Fluxo de eventos |
| 9 | Requester Pays | Instituto Geodados | Planilha de cobrança |
| 10 | Storage Gateway | Aço Forte Metalúrgica | Gateway híbrido |
| 11 | Transferência | Cine Memória | Calculadora de migração |
| Final | Projeto Atlas | Atlas Engenharia | Arquitetura em 8 etapas, com rubrica e relatório |

**Dependências**
- A Fase 1 libera as Fases 2, 3, 5, 10 e 11.
- A Fase 4 exige a 3.
- A Fase 6 exige a 2 e a 5.
- A Fase 7 exige a 3 e a 5 (e recomenda a 4).
- A Fase 8 exige a 1 e a 3.
- A Fase 9 exige a 2 e a 3.
- O desafio final exige as Fases 1 a 9 e recomenda a 10 e a 11.

## Trilha IAM e Access Management

Módulo `src/content/modules/identity/`. Reaproveita, sem redeclarar, os conceitos `iam.*` apresentados na S3 Expedition (o Codex continua mostrando cada um na primeira fase que o ensina) e acrescenta conceitos `iam.*`, `sts.*`, `org.*`, `fed.*`, `cognito.*` e `iaa.*`.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Identidades e a conta | Fermento Digital, Ateliê Tramas, Rota Fácil, Agro Semente | Auditoria de credenciais |
| 2 | MFA | Clínica Viva | Construtor de políticas (exigir MFA) |
| 3 | Anatomia de uma política | Mapa Literário | Construtor (leitura mínima, condições, ETL) |
| 4 | Como a AWS decide | Sabiá Seguros | Camadas (mesma conta, entre contas, key policy) |
| 5 | Roles e STS | Pixel Jogos | Cadeia de confiança (trust policy e duração) |
| 6 | Roles na prática | Fazenda Conectada, Colmeia Analytics | Construtor (PassRole, bucket do CloudTrail), cadeia de confiança com External ID |
| 7 | Federação e identidades externas | Rede Brisa | Construtor (ABAC), escolha da solução de identidade |
| 8 | Várias contas e guardrails | Grupo Horizonte | Organização com SCPs (2), camadas (delegação com boundary) |
| Final | Arquitetura de Acesso | Ipê Pagamentos | Arquitetura em 8 etapas, com dimensões Seguro, Menor privilégio, Resiliente, Operação e Requisitos |

**Dependências.** A Fase 4 exige a 3; a Fase 6 exige a 5; as demais só recomendam as anteriores; o desafio final exige as oito. A trilha recomenda a AWS Foundations.

**Previsões com JSON.** Atividades podem ter `exhibits` (políticas em JSON exibidas abaixo do enunciado). As previsões `policy` e `sts` são resolvidas pelo motor de políticas e pelo simulador do AssumeRole.

**Construtor de políticas.** O jogador monta statements com peças de uma paleta e vê o JSON real ao lado. Os testes mostram, ao vivo, o que a AWS decidiria; as sondas de menor privilégio multiplicam a nota por 0,7 quando a política libera algo além do necessário. Statement sem ação, recurso ou principal limita a nota a 50%.

## Trilha Computação na AWS

Módulo `src/content/modules/compute/`. Reaproveita, sem redeclarar, `iam.instance-profile`, `srm.*` e os conceitos `infra.*` da AWS Foundations (AZs, Outposts, Wavelength). Acrescenta conceitos `ec2.*`, `ebs.*`, `elb.*`, `asg.*`, `lambda.*`, `ecs.*`, `eks.*`, `fargate.*`, `ecr.*` e `cmp.*`. O ELB e o EBS continuam nos territórios Redes e Armazenamento do catálogo, mas são ensinados aqui.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | EC2 essencial | Editora Pé de Página | (predições do ciclo de vida e investigação) |
| 2 | Tipos de instância | Livraria Ponto Final, Laboratório Genoma Aberto | Escolha de instâncias |
| 3 | EBS e instance store | Clínica Sorriso Pleno, Hospital Vida Plena | Volumes |
| 4 | Opções de compra | Loja Casa & Jardim, Gráfica Papel & Tinta | Plano de compra |
| 5 | Elastic Load Balancing | Pão de Queijo Online, Jogos Pixel Brasil | Regras do listener |
| 6 | Auto Scaling | Loja Mundo Gamer, Farmácia Saúde Já | Escalonamento (2), AZs |
| 7 | Lambda | Cafeteria Grão Nobre, Rede Doce Lar Confeitarias | Concorrência |
| 8 | Contêineres | Agência Viaje Leve, Mercado Bairro Vivo | (predições de roles e investigação) |
| 9 | Escolhendo a computação | Rede Horizonte de Ensino, Mercado Ponte Alta | Escolha da computação (2) |
| Final | Arquitetura de Computação | Maré Varejo | Arquitetura em 8 etapas, com dimensões Resiliente, Alto desempenho, Custo, Seguro e Requisitos |

**Dependências.** A Fase 4 exige a 2; a Fase 6 exige a 5; a Fase 9 exige a 7 e a 8; as demais só recomendam as anteriores; o desafio final exige as nove. A trilha recomenda a AWS Foundations. O mapa tem `mapHeight: 800` por causa das cinco fases da segunda coluna.

**Preços reais nos labs.** Instâncias, volumes, compra, escalonamento e Lambda calculam custos com `simulators/compute-prices.ts`, que lê a tabela gerada por `npm run prices:compute`. O desconto do Spot é premissa do cenário.

**Escolha da computação.** O lab `compute-chooser` segue o padrão da escolha de identidade: cada carga tem um requisito que decide e requisitos rígidos; a melhor opção vale 1, uma que atende com mais trabalho vale 0,5 e uma que deixa um requisito de fora vale 0. Os testes falham se duas opções empatarem como melhor.

## Trilha Bancos de dados na AWS

Módulo `src/content/modules/database/`. Reaproveita, sem redeclarar, `infra.rds-multi-az`, `infra.ha-vs-dr` e `srm.rds` da AWS Foundations. Acrescenta conceitos `rds.*`, `aur.*`, `ddb.*`, `cache.*`, `nosql.*`, `rs.*`, `db.*`, `bkp.*` e `dms.*`. O AWS Backup entra no território Armazenamento e o Secrets Manager no de Segurança; aqui eles aparecem só no que o banco precisa (o AWS Backup é aprofundado no plano de Arquivos e backup, e KMS e Secrets Manager no de Segurança). Athena, Glue, OpenSearch e EMR ficam para o plano de Análise de dados; o Athena só aparece na comparação com o Redshift.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | RDS essencial | Agenda Fácil | Dimensionamento do RDS |
| 2 | Alta disponibilidade no RDS | Agenda Fácil | Alta disponibilidade (falhas simuladas) |
| 3 | Amazon Aurora | Vitrine Digital | Escolha do banco |
| 4 | DynamoDB: modelagem | Arena Pixel | Chaves e capacidade do DynamoDB |
| 5 | DynamoDB: recursos avançados | Arena Pixel | Escolha do banco (recursos do DynamoDB) |
| 6 | Cache e bancos especializados | Feira Livre | Cache |
| 7 | Data warehouse com Redshift | Mercadão Sul | Escolha do banco (análise) |
| 8 | Segurança e backup | Seguradora Abrigo | Banco exposto |
| 9 | Migração e escolha | Distribuidora Rota Norte | Migração com o DMS, escolha do banco |
| Final | Arquitetura de Dados | Empório Brasa | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Dependências.** A Fase 2 exige a 1; a 3 exige a 2; a 5 exige a 4; a 8 exige a 1; a 9 exige a 3, a 5 e a 6; as demais só recomendam; o desafio final exige as nove. A trilha recomenda a AWS Foundations e a Computação. O mapa usa cinco colunas (x = 90, 270, 450, 630 e 815) e `mapHeight: 800`, porque a cadeia F1, F2, F3, F9 e final tem cinco níveis de dependência.

**Preços reais nos labs.** Dimensionamento, alta disponibilidade, custo do Aurora, capacidade do DynamoDB e cache calculam custos com `simulators/database-prices.ts`, que lê a tabela gerada por `npm run prices:database`. Latências do cache, tempos de promoção de réplica e de restauração e a velocidade da carga do DMS são premissas do cenário.

**Escolha do banco.** O lab `db-chooser` segue o padrão da escolha da computação, com um único catálogo de opções (bancos, recursos do DynamoDB e opções de análise). Cada laboratório passa só as opções que fazem sentido para a fase, e os testes falham se duas opções empatarem como melhor.

## Trilha Monitoramento e governança na AWS

Módulo `src/content/modules/governance/`, território `monitoramento`. Reaproveita, sem redeclarar, `org.organizations`, `org.scp`, `org.rcp`, `org.control-tower` (Fase 7), `ec2.savings-plans` e `ec2.compute-optimizer` (Fase 8), `support.trusted-advisor` (Fase 9) e `cw.agent` (Fase 2). Acrescenta conceitos `cw.*`, `logs.*`, `xray.*`, `trail.*`, `cfg.*`, `ssm.*`, `cfn.*`, `sc.*`, `gov.*`, `fin.*` e `ops.*`. O Well-Architected Tool fica na trilha de Arquitetura, e a Fase 7 aprofunda a governança multiconta sem repetir as SCPs da trilha de IAM.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | CloudWatch: métricas e alarmes | Padaria Trigo Bom | Alarmes (períodos, M de N e dados ausentes) |
| 2 | Logs e rastreamento | Rede de Clínicas Vida Plena | Logs (retenção, classe e filtros de métrica) |
| 3 | CloudTrail | Cooperativa Agrícola Rio Claro | Trilhas (onde cada evento é encontrado) |
| 4 | AWS Config | Banco Cooperativo Horizonte | Regras de conformidade e remediação |
| 5 | Systems Manager | Rede de Supermercados Bom Preço | Escolha da ferramenta (classificação) |
| 6 | Infraestrutura como código | Estúdio Pixel Verde | Atualização de stacks (o que muda, é substituído ou removido) |
| 7 | Governança multiconta | Holding Vento Sul | Investigação (a conta fora do padrão) |
| 8 | Custos e orçamentos | Rede Mercado Tropical | Orçamentos e tags de alocação de custo |
| 9 | Recomendações e escolha | Editora Horizonte | Escolha do serviço de operação |
| Final | Central de Operações | Atlas Transportes | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Dependências.** A Fase 2 exige a 1; a 4 exige a 3; a 7 exige a 4; a 9 exige a 2, a 7 e a 8; as demais só recomendam; o desafio final exige as nove. A trilha recomenda a AWS Foundations e a IAM. O mapa usa cinco colunas (x = 90, 270, 450, 630 e 815) e `mapHeight: 800`, porque a cadeia F3, F4, F7, F9 e final tem cinco níveis de dependência.

**Preços reais nos labs.** Os custos de logs (ingestão e armazenamento), de trilhas (eventos de dados) e de regras do Config calculam valores com `simulators/governance-prices.ts`, que lê a tabela gerada por `npm run prices:governance`. A premissa de que um grupo sem retenção guarda 1.825 dias é do cenário.

**Premissas do cenário.** Os alarmes avaliam o intervalo de N períodos mais dois, com a regra do alarme prematuro; os casos que a documentação não especifica mantêm o estado anterior. O gasto de cada recurso nos orçamentos é constante por dia, com uma mudança de patamar, e a previsão é uma projeção linear. O comportamento de atualização do CloudFormation vem de uma tabela de propriedades conferidas na referência de cada tipo; a propriedade Port do RDS ficou de fora porque o guia e a referência divergem.

**Escolha do serviço.** O lab `ops-chooser` segue o padrão da escolha da computação: cada pergunta tem um requisito que decide, a melhor opção vale 1, uma que atende com mais trabalho vale 0,5 e uma que deixa um requisito de fora vale 0. Os testes falham se duas opções empatarem como melhor.

## Princípios de escrita

- **Aprender fazendo.** Cada missão segue a ordem: contexto (briefing) → conceitos-chave (intel, até ~80 palavras por carta) → desafios → resultado (debrief). Na interface aparecem só os nomes em português.
- **Fato separado de recomendação.** Nos conceitos, `facts` traz o comportamento documentado e `recommendations` traz o julgamento de arquitetura.
- **Status explícito.** Serviços e recursos sem novos clientes levam `availability: { kind: 'no-new-customers', since, alternatives }`. Hoje são quatro: Snow Family, FSx File Gateway, o serviço Amazon Glacier (vaults) e os planos de suporte Developer, Business e Enterprise On-Ramp.
- **Respostas calculadas.** Predições declaram um cenário (`spec`), e o simulador calcula a resposta. Faturas, custos e comparações também vêm dos modelos.
- **Simplificações declaradas.** Toda fase lista as suas, e cada simulador tem um painel "Simplificações".
- **Linguagem.** PT-BR, nomes oficiais em inglês, títulos neutros em gênero, sem copiar textos da AWS.

## Como escrever uma fase

1. Verifique os fatos na documentação oficial e registre-os em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).
2. Escreva os conceitos em `content/modules/<módulo>/concepts/fNN-*.ts`, com referências `https://docs.aws.amazon.com/...` ou `https://aws.amazon.com/...`.
3. Escreva a fase em `phases/fNN/phase.ts`. Cenários reutilizáveis (mundos de acesso, conjuntos de dados) ficam em arquivos ao lado.
4. Registre os conceitos e a fase no `index.ts` do módulo e acrescente conquistas em `achievements.ts`. Conquistas de aprendizagem geral ficam em `content/catalog/achievements.ts`.
5. Rode `npm test`. Os testes de integridade apontam:
   - conceitos sem avaliação ou sem item de revisão;
   - predições ambíguas;
   - laboratórios cuja solução não chega a 100% ou cujo estado inicial já passa.

## Itens de revisão

Os itens de revisão vêm de duas fontes:
- **derivados automaticamente** das atividades, a partir dos itens de classificação e associação, das decisões e das predições de cada conceito;
- **escritos à mão**, em `reviewItems` do conceito, quando nenhuma atividade cobre o conceito de forma isolada.

## Banco de questões

Cada módulo tem um `questions.ts` com questões no formato do exame. Para escrever uma:
- **Conceito principal** (`concept`): aparece no enunciado, junto com a dificuldade e o domínio. Use `related` para outros conceitos que a questão também avalia. Todos precisam ser ensinados numa fase disponível.
- **Cenário** com empresa fictícia e requisitos claros. Quando a pergunta tiver um critério ("menor esforço operacional", "mais segura", "menor custo"), destaque-o em negrito.
- **Alternativas plausíveis**: quatro com uma correta, ou cinco ou mais com duas ou mais corretas. Cada alternativa traz o porquê (`why`), inclusive as corretas.
- **Explicação** com a regra geral, nos termos do Codex. Use só fatos já registrados em `docs/VERIFICACAO-DE-CONTEUDO.md`.

Os testes recusam questão com conceito inexistente, formato errado, alternativa sem explicação, alternativas repetidas ou setas no texto.

## Preços

`src/content/pricing/governance-prices.json` é gerado por `npm run prices:governance` (CloudWatch, CloudTrail e Config; us-east-1 e sa-east-1), a partir da AWS Price List Bulk API; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/database-prices.json` é gerado por `npm run prices:database` (RDS for PostgreSQL, Aurora PostgreSQL, DynamoDB, ElastiCache e Redshift; us-east-1 e sa-east-1). O script lê o CSV regional do RDS e do ElastiCache em streaming e usa a primeira faixa paga de cada item; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/compute-prices.json` é gerado por `npm run prices:compute` (EC2, Savings Plans, Lambda, Fargate e ELB; us-east-1 e sa-east-1). O script lê o CSV regional do EC2 em streaming; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/s3-prices.json` é gerado por `npm run prices:update`, a partir da AWS Price List API (ofertas AmazonS3, AmazonS3GlacierDeepArchive e AWSDataTransfer; Regiões us-east-1 e sa-east-1, mais o S3 Standard de sete Regiões em `standardByRegion`, usado na comparação entre Regiões). Os preços dos planos de suporte ficam em `simulators/support/model.ts`, com data e fonte, porque não vêm da Price List API. O script falha se faltar algum preço e nunca inventa valores. A interface sempre indica a data da tabela e que se trata de estimativa (primeira faixa, sem nível gratuito nem impostos).
