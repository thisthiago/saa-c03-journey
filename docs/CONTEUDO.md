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

## Trilha Redes na AWS

Módulo `src/content/modules/network/`, território `redes`. Reaproveita, sem redeclarar, `ec2.security-group` (Fase 3), `infra.nat-zonal-regional` (Fase 2), `edge.route53` (Fase 7) e `edge.cloudfront`, `edge.pop`, `edge.regional-edge-cache` e `edge.global-accelerator` (Fase 8). O Elastic Load Balancing continua ensinado na trilha de Computação. Acrescenta conceitos `vpc.*`, `rt.*`, `sg.*`, `tgw.*`, `pl.*`, `hyb.*`, `dns.*`, `cdn.*`, `edgesec.*` e `net.choose`. O ACM só é citado (certificado do CloudFront em us-east-1) e o API Gateway fica de fora.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | VPC e endereçamento | Varejo Ponto Certo | Plano de endereços (`vpc-planner`) |
| 2 | Roteamento e saída para a internet | Varejo Ponto Certo | Tabelas de rotas (`route-table`) |
| 3 | Segurança dentro da VPC | Escola Online Saber Mais | Caminho de cada fluxo (`reach`) |
| 4 | Conectando VPCs | Grupo Horizonte Seguros | Topologias com peering e Transit Gateway (`connect`) |
| 5 | Acesso privado a serviços | Corretora Valor Certo | Caminho até os serviços, com custo (`endpoints`) |
| 6 | Conectividade híbrida | Metalúrgica Ferro Forte | Escolha da conexão (`hybrid`) |
| 7 | DNS com Route 53 | Portal de Notícias Agora | Escolha da política de roteamento (`dns-policy`) |
| 8 | Entrega de conteúdo | Streaming de Música Batuque | Cache do CloudFront (lab `edge`, reaproveitado) |
| 9 | Proteção de borda e escolha | Mercado Online Pechincha | Escolha da solução de rede (`net-chooser`) |
| Final | Projeto de Rede | Supermercados Cesta Cheia | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Dependências.** A Fase 2 exige a 1; a 3, a 4 e a 5 exigem a 2; a 6 exige a 4; a 9 exige a 7 e a 8; a 7 e a 8 só recomendam; o desafio final exige as nove. A trilha recomenda a AWS Foundations e a Computação. O mapa usa cinco colunas (x = 90, 270, 450, 630 e 815) e `mapHeight: 800`.

**Preços reais nos labs.** O custo das topologias com Transit Gateway e dos caminhos até os serviços (NAT Gateway e endpoints) vem de `simulators/network-prices.ts`, que lê a tabela gerada por `npm run prices:network`.

**Previsões calculadas.** As previsões `cidr`, `route`, `reach`, `connect` e `dns` usam os simuladores `vpcnet`, `reach`, `connect` e `dns`; a Fase 8 usa a previsão `edge` da Foundations.

**Escolhas.** Os labs `hybrid`, `dns-policy` e `net-chooser` usam o motor genérico `simulators/shared/chooser.ts` e a interface `shared/ChoiceLab.tsx`: cada cartão tem um requisito que decide, a melhor opção vale 1, uma que atende com mais trabalho vale 0,5 e uma que deixa um requisito de fora vale 0. Os testes falham se duas opções empatarem como melhor.

## Trilha Análise de dados e serviços de IA na AWS

Módulo `src/content/modules/analytics/`, território novo `analise` ("Análise de dados e IA", glifo `chart`). Reaproveita, sem redeclarar, `lc.rules` (Fase 1), `rs.vs-athena` (Fases 3 e 9) e `rs.what` (comparações). Declara o básico de Kinesis Data Streams (`kds.streams`) e Data Firehose (`fh.delivery`, `fh.parquet`), com os prefixos do plano de Integração e mensageria, que deve reaproveitá-los.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Data lake no S3 | Transportadora Rota Sul | Formato, compressão e partição (`datalake`) |
| 2 | Catálogo e transformação | Transportadora Rota Sul | Investigação do fluxo da madrugada |
| 3 | Consultas com Athena | Portal Notícia Já | Custo do Athena por tabela (`datalake`) |
| 4 | Governança do data lake | Cooperativa de Crédito Raiz | Permissões célula a célula (`lakeperm`) |
| 5 | Processamento com EMR | Distribuidora de Energia Volt Norte | Clusters com retomada de Spot (`emr`) |
| 6 | Ingestão e streaming | Aplicativo de Mobilidade Vai Lá | Caminho de cada fonte (`ingest`) |
| 7 | Busca e visualização | Marketplace Feira Online | Investigação do painel lento |
| 8 | Serviços prontos de IA | Escola Online Saber Mais | Serviço de cada pedido (`ai-chooser`) |
| 9 | Escolhendo a solução de dados | Rede de Lojas Bem Bom | Serviço de cada pedido (`ana-chooser`) |
| Final | Plataforma de Dados | Lojas Praça Nova | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Dependências.** A Fase 2 exige a 1; a 3, a 4 e a 5 exigem a 2; a 9 exige da 3 à 8; a 6, a 7 e a 8 só recomendam; o desafio final exige as nove. A trilha recomenda a AWS Foundations e a S3 Expedition. O mapa usa cinco colunas (x = 90, 270, 450, 630 e 815), com altura de 800.

**Preços reais nos labs.** O custo do Athena (dado lido) e o armazenamento no S3 Standard vêm de `simulators/analytics-prices.ts` e `simulators/cost/prices.ts`; o lab do EMR usa o preço On-Demand da tabela de Computação e o desconto do Spot da trilha de Computação como premissa. As taxas de compressão, o tamanho do JSON e o limite de arquivo pequeno (64 MB) são premissas declaradas no lab.

**Previsões calculadas.** As previsões `datalake`, `lakeperm` e `emr` usam os simuladores de mesmo nome.

**Escolhas.** Os labs `ingest`, `ai-chooser` e `ana-chooser` usam o motor genérico `simulators/shared/chooser.ts`. No `ai-chooser`, o Elastic Transcoder aparece como opção que não atende a nada, porque foi encerrado.

## Trilha Segurança e proteção de dados na AWS

Módulo `src/content/modules/security/`, no território `seguranca`, que passa a ter duas trilhas (esta e a IAM e Access Management). Reaproveita, sem redeclarar, `kms.key-policy`, `s3.bucket-keys`, `s3.object-lock` e `macie.sensitive-data` (S3 Expedition), `iam.instance-profile` (IAM), `db.secrets` e `db.tls` (Bancos de dados), `ssm.parameter-store` e `cfg.what` (Monitoramento e governança), `edgesec.waf-managed` e `edgesec.shield-standard` (Redes) e `srm.model` (AWS Foundations). Acrescenta conceitos `kms.*`, `hsm.*`, `secret.*`, `acm.*`, `gd.*`, `insp.*`, `det.*`, `macie.*`, `bkp.vault-lock`, `shub.*`, `artifact.*` e `sec.*`.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Criptografia e KMS | Banco Digital Ponte | Key policy e grants (`kms`) |
| 2 | KMS avançado e CloudHSM | Seguradora Horizonte | Investigação da chave que parou |
| 3 | Segredos da aplicação | Plataforma de Cursos Aprende Já | Rotação passo a passo (`secrets`) |
| 4 | Certificados e TLS | Rede de Farmácias Cuidar | Inventário de certificados (`certs`) |
| 5 | Detecção de ameaças | Entrega Certa | Triagem de achados (`findings`) |
| 6 | Classificação e retenção | Hospital Vida Plena | Investigação dos achados do Macie |
| 7 | Postura e conformidade | PagFácil | Painel da véspera da auditoria (`findings`) |
| 8 | Ameaças externas e resposta | Loja Virtual Casa & Cia | Classificação dos ataques e ordem da resposta |
| 9 | Escolhendo a proteção | Grupo Educacional Saber | Serviço de cada pedido (`sec-chooser`) |
| Final | Auditoria de Segurança | Clínica Bem Viver | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Decisões adotadas** (as recomendadas no plano): 9 fases e o desafio final; WAF, Shield, Network Firewall e Firewall Manager continuam ensinados na trilha de Redes, e a Fase 8 trata das ameaças reaproveitando esses conceitos; o ACM é ensinado aqui (Fase 4); a comparação Secrets Manager × Parameter Store é ensinada aqui (Fase 3); preços reais de KMS, Secrets Manager e CloudHSM, com GuardDuty, Inspector, Macie e Security Hub fora da tabela.

**Dependências.** As Fases 2, 3 e 4 exigem a 1; a 7 exige a 5 e a 6; a 8 exige a 5; a 9 exige a 2, a 3, a 4, a 7 e a 8; a 5 e a 6 só recomendam a anterior; o desafio final exige as nove. A trilha recomenda a AWS Foundations, a IAM e Access Management e a S3 Expedition. O mapa usa quatro colunas (x = 90, 270, 630 e 815), com altura de 840.

**Laboratórios em grade.** Os labs `secrets`, `certs` e `findings` usam o motor `simulators/shared/grid.ts` e a interface `shared/GridLab.tsx`: cada linha recebe uma resposta por coluna, e o simulador da trilha calcula a resposta certa e o porquê. O lab `kms` usa o motor de políticas da trilha IAM para a key policy e o IAM, e acrescenta os grants.

**Previsões calculadas.** As previsões `kms`, `secrets` e `certs` usam os simuladores de mesmo nome.

**Preços.** A Fase 2 estima o custo mensal de um cluster do CloudHSM com a tabela de `simulators/security-prices.ts`.

## Trilha Integração e mensageria na AWS

Módulo `src/content/modules/integration/`, no território `integracao`, que passa a ser ativo. Reaproveita, sem redeclarar, `ev.fanout`, `ev.eventbridge` e `ev.at-least-once` (S3 Expedition) e `kds.streams`, `fh.delivery`, `fh.parquet`, `msk.kafka` e `ingest.third-party` (Análise de dados). Acrescenta conceitos `sqs.*`, `sns.*`, `eb.*`, `sfn.*`, `apigw.*`, `kds.partition-key`, `kds.enhanced-fanout`, `mq.*` e `int.*`. Step Functions, API Gateway e Amazon MQ entram no catálogo de serviços.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Desacoplamento e SQS | Livraria Página Viva | Visibilidade e DLQ de quatro filas (`queue`) |
| 2 | SQS em escala | Ingressos Já | Filas lidas por Lambda e por servidor (`queue`) |
| 3 | Tópicos com SNS | Academias Movimento | Política de filtro de cada assinatura (`pubsub`) |
| 4 | Eventos com EventBridge | Transportadora Rota Certa | Padrão de evento de cada regra (`eventbus`) |
| 5 | Fluxos com Step Functions | Seguradora Amparo | Retry e Catch de cada passo (`workflow`) |
| 6 | APIs com API Gateway | Clima Já | Taxa e burst de cada cliente (`apigw`) |
| 7 | Streaming | Frota Conectada | Modo de leitura e shards de cada stream (`stream`) |
| 8 | Brokers e SaaS | Cooperativa de Crédito Raiz | Investigação da parada do broker |
| 9 | Padrões e escolha | Marketplace Feira Livre | Serviço de cada pedido (`int-chooser`) |
| Final | Arquitetura Orientada a Eventos | Loja Virtual Vitrine | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Decisões adotadas** (as recomendadas no plano): 9 fases e o desafio final; o API Gateway é ensinado aqui (Fase 6); Kinesis Data Streams e Data Firehose entram na Fase 7, reaproveitando os conceitos da Análise de dados, e o MSK é citado; preços reais da AWS Price List. Parameter Store, Secrets Manager e ACM continuam ensinados nas trilhas de Monitoramento e de Segurança, sem conceito novo aqui.

**Dependências.** As Fases 2 e 3 exigem a 1; a 4 exige a 3; a 7 exige a 2; a 9 exige a 4, a 5 e a 7; a 5, a 6 e a 8 só recomendam outras fases; o desafio final exige as nove. A trilha recomenda a AWS Foundations e a Computação. O mapa usa cinco colunas (x = 90, 270, 450, 630 e 815), com altura de 800.

**Laboratórios em grade.** Os labs `queue`, `pubsub`, `eventbus`, `workflow`, `apigw` e `stream` usam o motor `simulators/shared/grid.ts`. `pubsub` e `eventbus` compartilham o modelo de `simulators/eventbus/` (o casamento de padrões vale para as políticas de filtro do SNS e para os padrões do EventBridge): a resposta certa de cada destino é o único padrão da paleta que entrega exatamente o que ele quer. O lab `int-chooser` usa o motor de escolha de `simulators/shared/chooser.ts`.

**Previsões calculadas.** As previsões `queue`, `fifo`, `eventbus`, `workflow`, `apigw` e `stream` usam os simuladores de mesmo nome.

## Trilha Arquivos e backup na AWS

Módulo `src/content/modules/files/`, no território `armazenamento`, que passa a ter duas trilhas (S3 Expedition e esta). Reaproveita, sem redeclarar, `storage.file`, `sgw.s3-file`, `sgw.fsx-file`, `mig.datasync`, `backup.independent-copy` e `dr.rpo-rto` (S3 Expedition), `fed.directory-service` (IAM), `ebs.snapshots` (Computação), `bkp.aws-backup` (Bancos de dados), `gov.org-policies` (Monitoramento e governança) e `bkp.vault-lock` (Segurança). Fica no fim de `MODULES` para que o Codex mostre esses conceitos nas trilhas que os declaram.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | EFS essencial | Escola Aberta | Tipo e mount targets de quatro sistemas de arquivos (`filesystem`, modo `access`) |
| 2 | EFS: desempenho e custo | Grupo Atlântico | Vazão e ciclo de vida pelo menor custo, com preços reais (`filesystem`, modo `cost`) |
| 3 | FSx for Windows File Server | Construtora Alicerce | Investigação da parada do Single-AZ; configuração e custo do Multi-AZ |
| 4 | FSx for Lustre | Laboratório Genoma Sul | Scratch, persistente ou EFS para cinco cargas |
| 5 | FSx for NetApp ONTAP e OpenZFS | Seguradora Horizonte e Estúdio Pixel | Sistema de arquivos de seis cargas (`fs-chooser`) |
| 6 | Escolha e caminho de entrada | Distribuidora Rota Sul | Armazenamento e caminho de entrada de nove necessidades (`fs-chooser`) |
| 7 | AWS Backup | Hospital Santa Aurora | Frequência, frio, cópia e trava de cinco recursos (`backup`) |
| Final | A Mudança do Escritório | Estúdio Traço Livre | Arquitetura em 7 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Decisões adotadas** (as recomendadas no plano): trilha curta, com 7 fases e o desafio final; o AWS Backup é ensinado aqui (Fase 7), e as trilhas de Bancos de dados e de Arquitetura e otimização só o citam; o Transfer Family é ensinado aqui (Fase 6); preços reais da AWS Price List para EFS, FSx, AWS Backup e Transfer Family.

**Dependências.** A Fase 2 exige a 1; a 4 e a 5 exigem a 3; a 6 exige a 2, a 4 e a 5; a 3 e a 7 só recomendam a anterior; o desafio final exige as sete. A trilha recomenda a AWS Foundations e a S3 Expedition. O mapa usa quatro colunas e a altura padrão.

**Laboratórios.** `filesystem` e `backup` usam o motor em grade (`simulators/shared/grid.ts`); `fs-chooser` usa o motor de escolha (`simulators/shared/chooser.ts`). O custo do `filesystem` escolhe a combinação válida mais barata entre os três modos de vazão e os três ciclos de vida, e o modelo recusa empates (diferença menor que 1%).

**Previsões calculadas.** `efs-access` e `efs-cost` usam `simulators/filesystem/`; `fsx-failure` usa `simulators/fsx/`; `backup` usa `simulators/backup/`.

## Trilha Arquitetura e otimização na AWS

Módulo `src/content/modules/architecture/`, no território `arquitetura`, que passa a ficar ativo. É a trilha de fechamento: ensina a decidir entre os serviços das outras trilhas, por isso reaproveita muitos conceitos sem redeclarar, entre eles `infra.*` e `edge.*` (Foundations), `dr.rpo-rto`, `mig.*`, `sc.intelligent-tiering` e `s3.transfer-acceleration` (S3 Expedition), `iam.roles`, `fed.identity-center` e `iam.least-privilege` (IAM e S3), `asg.*`, `elb.health-checks`, `ec2.*`, `ebs.io2`, `lambda.pricing`, `cmp.evs` e `cmp.beanstalk-deploy` (Computação), `rds.*`, `ddb.*`, `aur.global-database`, `cache.*`, `db.*`, `dms.what` e `bkp.aws-backup` (Bancos de dados), `ops.service-quotas`, `gov.account-structure`, `fin.cost-allocation-tags`, `cfn.what`, `trail.org-trail` e `ssm.session-manager` (Monitoramento e governança), `dns.*`, `pl.*`, `rt.public-private`, `sg.reference` e `edgesec.waf` (Redes), `sec.*` e `secret.where` (Segurança), `int.*`, `eb.bus` e `apigw.*` (Integração) e `bkp.copy` e `xfer.transfer-family` (Arquivos e backup). Fica no fim de `MODULES`.

| Fase | Tema | Empresas fictícias | Laboratórios |
|---|---|---|---|
| 1 | Well-Architected Framework | Feira Digital | Pilar e nível de risco de oito achados, lidos nas páginas das boas práticas (`wa-review`) |
| 2 | Arquiteturas resilientes | Palco Livre | Investigação do ponto único de falha; bilheteria que perde qualquer AZ com a capacidade inteira (`zones`, reaproveitado) |
| 3 | Recuperação de desastres | Saúde Já | Estratégia e Região de recuperação de quatro sistemas, com custo real de EC2 e RDS (`dr`) |
| 4 | Alto desempenho | Arena Play | Recurso de desempenho de nove gargalos (`perf-chooser`) |
| 5 | Segurança na arquitetura | Crédito Unido | Investigação de um vazamento por credencial longa |
| 6 | Otimização de custos | Leia Mais | Tamanho e compra de cinco frotas (`rightsizing`); cobrança e mudança de sete fluxos de dados (`transfer-cost`) |
| 7 | Migração | Forte Aço | Estratégia e ferramenta de oito sistemas (`migration-plan`) |
| 8 | Padrões de arquitetura | Viagem Fácil | Arquitetura em 4 etapas, com dimensões Resiliente, Alto desempenho, Custo e Requisitos |
| 9 | Como o exame pergunta | Grupo de estudos AWS Quest | Veredito e motivo das alternativas de três enunciados próprios (`exam-reader`) |
| Final | A Revisão Well-Architected | EducaMais | Arquitetura em 8 etapas, com dimensões Seguro, Resiliente, Alto desempenho, Custo e Requisitos |

**Decisões adotadas** (as recomendadas no plano): 9 fases e o desafio final; trilha de fechamento, que recomenda a Foundations, a S3 Expedition, a IAM e a Computação sem exigir; leitura de questões como fase própria (F9), com enunciados do AWS Quest; migração com os 7 Rs e o AWS Transform MGN aqui (F7); AWS Backup e Transfer Family só citados (são ensinados em Arquivos e backup); preços reais de S3, Computação e Bancos de dados reaproveitados, mais a tabela nova de transferência de dados (`npm run prices:transfer`). O `passThreshold` do final ficou em 0,7, igual ao das outras trilhas.

**Fatos que mudaram o conteúdo.** O AWS Application Migration Service hoje se chama AWS Transform MGN; o catálogo usa o nome novo e avisa que a lista do exame ainda usa o antigo. A Snow Family não aceita novos clientes, então a cópia em massa da F7 vai pelo DataSync com Direct Connect ou pelo AWS Data Transfer Terminal.

**Dependências.** A Fase 2, a 4, a 5 e a 6 exigem a 1; a 3 exige a 2; a 7 exige a 3; a 8 exige a 2 e a 4; a 9 exige a 3, a 5, a 6 e a 8; o desafio final exige as nove. O mapa usa cinco colunas e altura 800.

**Laboratórios.** `wa-review`, `dr`, `transfer-cost`, `rightsizing`, `migration-plan` e `exam-reader` usam o motor em grade (`simulators/shared/grid.ts`); `perf-chooser` usa o motor de escolha. O `dr` escolhe a estratégia mais barata que cumpre o RPO e o RTO (pior caso de cada faixa do REL13-BP02, como premissa) e mostra o custo mensal da Região de recuperação. O `rightsizing` reduz um tamanho a cada vez que o pico de CPU e memória dobrado continua abaixo de 80% e escolhe a compra válida mais barata. O `transfer-cost` calcula o custo mensal de cada caminho e recusa empates. O `migplan` foi chamado assim para não se confundir com o `migration` (DMS) da trilha de Bancos de dados.

## Princípios de escrita

- **Aprender fazendo.** Cada missão segue a ordem: contexto (briefing) → conceitos-chave (intel, até ~80 palavras por carta) → desafios → resultado (debrief). Na interface aparecem só os nomes em português.
- **Fato separado de recomendação.** Nos conceitos, `facts` traz o comportamento documentado e `recommendations` traz o julgamento de arquitetura.
- **Status explícito.** Serviços e recursos sem novos clientes levam `availability: { kind: 'no-new-customers', since, alternatives }`. Hoje são quatro: Snow Family, FSx File Gateway, o serviço Amazon Glacier (vaults) e os planos de suporte Developer, Business e Enterprise On-Ramp. Serviços encerrados levam `availability: { kind: 'discontinued', since, note, alternatives }`, com o selo "Serviço encerrado" no Codex e na página Sobre; hoje só o Amazon Elastic Transcoder (13/11/2025, alternativa: MediaConvert).
- **Respostas calculadas.** Predições declaram um cenário (`spec`), e o simulador calcula a resposta. Faturas, custos e comparações também vêm dos modelos.
- **Simplificações declaradas.** Toda fase lista as suas, e cada simulador tem um painel "Simplificações".
- **Linguagem.** PT-BR, nomes oficiais em inglês, títulos neutros em gênero, sem copiar textos da AWS.

## Como escrever um conceito do Codex

A revisão didática de 24/10/2026 ([docs/revisao-codex/](revisao-codex/)) fixou o padrão abaixo. A página do conceito não muda: cada parte vai para um campo que ela já mostra.

| Parte | Campo | Como escrever |
|---|---|---|
| A ideia central | `summary` | Uma ou duas frases que se entendem sozinhas. Aparece também nos cartões de Conceitos-chave sem `body`. |
| Imagem mental, mecanismo, exemplo e regra prática | `explanation[]` | Um parágrafo por parte, nessa ordem. A analogia é opcional e termina com "O limite da comparação: …" quando pode enganar. O exemplo começa com "Exemplo:", e o último parágrafo, com "**Regra prática:**". |
| Quando usar e quando não serve | `useCases`, `limitations` | Requisitos que favorecem ou eliminam a escolha. |
| Não confunda com | `comparisons` | `with` é sempre o id de outro conceito; o texto diz a diferença que muda a decisão. |
| Armadilhas | `commonMistakes`, `consequences` | O erro concreto e, se ensinar, o custo dele. |
| Fatos e julgamento | `facts`, `recommendations` | Comportamento documentado em `facts`; julgamento de arquitetura em `recommendations`. |
| Como aparece na SAA-C03 | `exam.notes` | Os sinais do enunciado entre aspas, o raciocínio esperado e o distrator típico. **Texto puro**: a tela não interpreta negrito, código nem links nesse campo. |

Regras que valem para todos:

- A profundidade acompanha o conceito: um conceito fundamental pede resumo e mecanismo; um comparativo, também comparação e armadilhas; um arquitetural, exemplo com raciocínio e notas da prova. Texto mais longo não é sinônimo de texto melhor.
- Nada de dizer que o assunto "cai" ou "sempre aparece" na prova.
- A marcação não aninha: código ou link dentro de negrito aparecem crus na tela.
- Links para outros conceitos usam `[[id|rótulo]]` (fora de `exam.notes`), e o alvo precisa existir.

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

`src/content/pricing/integration-prices.json` é gerado por `npm run prices:integration` (SQS padrão e FIFO, SNS, EventBridge com eventos personalizados, Pipes e Scheduler, Step Functions Standard e Express, API Gateway REST, HTTP e WebSocket, Kinesis Data Streams e Data Firehose; us-east-1 e sa-east-1), a partir das ofertas AWSQueueService, AmazonSNS, AWSEvents, AmazonStates, AmazonApiGateway, AmazonKinesis e AmazonKinesisFirehose da AWS Price List Bulk API; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/files-prices.json` é gerado por `npm run prices:files` (EFS por classe, leitura das classes frias, vazão Elastic e Provisioned; armazenamento e vazão dos quatro FSx; backups do EFS no quente e no frio, cópia entre Regiões, restauração e teste de restauração no AWS Backup; protocolo por hora e dados no Transfer Family; us-east-1 e sa-east-1). O script falha se algum preço faltar ou for ambíguo.

`src/content/pricing/security-prices.json` é gerado por `npm run prices:security` (KMS: chave gerenciada pelo cliente por mês e requisições simétricas; Secrets Manager: segredo por mês e chamadas de API; CloudHSM: HSM por hora; us-east-1 e sa-east-1), a partir das ofertas awskms, AWSSecretsManager e CloudHSM da AWS Price List Bulk API; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/analytics-prices.json` é gerado por `npm run prices:analytics` (Athena: dado lido e capacidade reservada; Glue: DPU-hora de jobs padrão, Flex e Glue 6.0 ou mais novo, crawlers e Data Catalog; us-east-1 e sa-east-1), a partir das ofertas AmazonAthena e AWSGlue da AWS Price List Bulk API; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/network-prices.json` é gerado por `npm run prices:network` (NAT Gateway, endpoints de interface, Transit Gateway, Site-to-Site VPN, Client VPN, IPv4 público e transferência entre zonas; us-east-1 e sa-east-1). O script lê as ofertas AmazonVPC e AWSDataTransfer em JSON e o CSV regional do EC2 em streaming, para o NAT Gateway; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/governance-prices.json` é gerado por `npm run prices:governance` (CloudWatch, CloudTrail e Config; us-east-1 e sa-east-1), a partir da AWS Price List Bulk API; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/database-prices.json` é gerado por `npm run prices:database` (RDS for PostgreSQL, Aurora PostgreSQL, DynamoDB, ElastiCache e Redshift; us-east-1 e sa-east-1). O script lê o CSV regional do RDS e do ElastiCache em streaming e usa a primeira faixa paga de cada item; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/compute-prices.json` é gerado por `npm run prices:compute` (EC2, Savings Plans, Lambda, Fargate e ELB; us-east-1 e sa-east-1). O script lê o CSV regional do EC2 em streaming; com `PRICES_CACHE=<pasta>`, lê arquivos já baixados.

`src/content/pricing/s3-prices.json` é gerado por `npm run prices:update`, a partir da AWS Price List API (ofertas AmazonS3, AmazonS3GlacierDeepArchive e AWSDataTransfer; Regiões us-east-1 e sa-east-1, mais o S3 Standard de sete Regiões em `standardByRegion`, usado na comparação entre Regiões). Os preços dos planos de suporte ficam em `simulators/support/model.ts`, com data e fonte, porque não vêm da Price List API. O script falha se faltar algum preço e nunca inventa valores. A interface sempre indica a data da tabela e que se trata de estimativa (primeira faixa, sem nível gratuito nem impostos).
