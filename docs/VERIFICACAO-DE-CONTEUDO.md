# Verificação de conteúdo

Fatos técnicos usados no conteúdo e nos simuladores, conferidos na documentação oficial da AWS em **16/10/2026** (S3 Expedition) e **18/10/2026** (AWS Foundations). Cada conceito do Codex traz as próprias referências; esta página reúne as decisões que mudaram o conteúdo ou exigiram atenção.

## Exame

| Fato | Fonte |
|---|---|
| A versão vigente é a SAA-C03. Domínios: Seguro 30%, Resiliente 26%, Alto desempenho 24%, Custo otimizado 20%. São 50 questões pontuadas e 15 não pontuadas, com nota mínima 720. | [Guia do exame SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html) |
| Conferido em 19/10/2026 para o banco de questões: há dois tipos de questão, **múltipla escolha** (uma correta e três distratores) e **resposta múltipla** (duas ou mais corretas entre cinco ou mais opções). Questão sem resposta conta como errada, e não há penalidade por chutar. A nota é escalonada de 100 a 1.000 e o modelo é compensatório (não é preciso passar em cada seção). | [Guia do exame SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html) |
| Conferido em 19/10/2026: o exame tem 65 questões e dura 130 minutos. O cronômetro do simulado usa esse ritmo (2 minutos por questão). | [Página da certificação](https://aws.amazon.com/certification/certified-solutions-architect-associate/) |
| A porcentagem de acertos do simulado não é convertida para a escala do exame: a AWS não publica essa conversão. A tela diz isso ao lado do resultado. | Decisão do projeto |

## Serviços e recursos sem novos clientes

| Fato | Efeito no conteúdo | Fonte |
|---|---|---|
| A AWS não oferece mais dispositivos da Snow Family a novos clientes. Alternativas: DataSync, Data Transfer Terminal, parceiros e, para computação na borda, Outposts. | A Fase 11 trata a Snow Family como legado e ensina as alternativas. | [Snowball Edge availability change](https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html) |
| O FSx File Gateway não aceita novos clientes desde 28/10/2024. | Fase 10: opção marcada e recusada para clientes novos. | [FSx File Gateway — histórico](https://docs.aws.amazon.com/filegateway/latest/filefsxw/DocumentHistory.html) |
| O serviço Amazon Glacier (vaults) não aceita novos clientes desde 15/12/2025. | Fase 2 distingue o serviço das classes S3 Glacier. | [Amazon Glacier](https://docs.aws.amazon.com/amazonglacier/latest/dev/vault-operations.html) |
| O Data Transfer Terminal está disponível, no momento, apenas para clientes Enterprise Support. | Requisito modelado no simulador de transferência. | [What is Data Transfer Terminal?](https://docs.aws.amazon.com/datatransferterminal/latest/userguide/what-is-dtt.html) |

## Armazenamento e custos (Fases 1, 2 e 6)

| Fato | Fonte |
|---|---|
| Durabilidade projetada de 11 noves. Durações mínimas de 30, 90, 90 e 180 dias. Tamanho mínimo faturável de 128 KB. Objetos arquivados somam 40 KB de overhead (8 KB no preço do Standard e 32 KB no da classe). | [Storage classes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html) |
| Transições seguem um modelo em cascata, e cada classe só pode ir para as classes listadas. Uma mesma regra não pode violar a duração mínima da classe intermediária (Glacier IR aos 4 dias → Deep Archive só a partir de 94). Desde setembro de 2024, objetos menores que 128 KB não transicionam por padrão. | [Lifecycle transitions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-transition-general-considerations.html) |
| Conflitos: a expiração vence a transição; Glacier Flexible vence Standard-IA no mesmo dia; Intelligent-Tiering é preferido, exceto sobre Glacier Flexible e Deep Archive. | [Lifecycle conflicts](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-conflicts.html) |
| Expiration em bucket versionado cria um delete marker. AbortIncompleteMultipartUpload e ExpiredObjectDeleteMarker não aceitam filtro por tag. Days e ExpiredObjectDeleteMarker não podem estar na mesma Expiration. NewerNoncurrentVersions vai de 1 a 100. | [Lifecycle elements](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html), [Exemplos](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html) |

**Nota.** Materiais antigos citam um mínimo de 30 dias antes de transicionar para Standard-IA ou One Zone-IA. A documentação consultada não traz essa regra, e ela **não** foi aplicada no simulador.

**Preços.** Os preços vêm da AWS Price List Bulk API, consultada em 16/10/2026: us-east-1 e sa-east-1, só a primeira faixa. Ficam em `src/content/pricing/s3-prices.json` e são sempre apresentados como estimativa.

## Segurança e criptografia (Fases 3 e 4)

| Fato | Fonte |
|---|---|
| Lógica de avaliação: deny explícito vence; sem allow, vale o deny implícito. Entre contas, a política de identidade e a de recurso precisam permitir. | [Policy evaluation logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html) |
| Block Public Access: BlockPublicAcls e BlockPublicPolicy rejeitam novas configurações públicas; IgnorePublicAcls e RestrictPublicBuckets mudam a avaliação do que já existe. | [Block Public Access](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html) |
| Desde 05/01/2023, todo objeto novo é criptografado com SSE-S3. Desde abril de 2026, buckets novos têm SSE-C desabilitado para novas gravações. | [Server-side encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html) |
| S3 Bucket Keys reduzem em até 99% as requisições ao KMS, valem para objetos novos, usam o ARN do bucket como contexto de criptografia e não funcionam com DSSE-KMS. | [S3 Bucket Keys](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-key.html) |
| URL pré-assinada: até 12 h pelo console e até 7 dias pela CLI ou SDK. | [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) |

## Versionamento (Fase 5)

| Fato | Fonte |
|---|---|
| Três estados; depois de habilitado, o bucket nunca volta a "sem versionamento". Objetos anteriores ficam com o ID null. | [Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html) |
| Com versionamento suspenso, um PUT substitui a versão null, e um DELETE remove a versão null e insere um delete marker null. | [Suspended — PUT](https://docs.aws.amazon.com/AmazonS3/latest/userguide/AddingObjectstoVersionSuspendedBuckets.html), [Suspended — DELETE](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeletingObjectsfromVersioningSuspendedBuckets.html) |
| Para um delete marker, GET sem versionId retorna 404 e GET com o versionId do marker retorna 405. | [Delete markers](https://docs.aws.amazon.com/AmazonS3/latest/userguide/DeleteMarker.html) |
| MFA delete: só o usuário raiz habilita, só pela CLI ou API, e não pode ser usado com lifecycle. | [MFA delete](https://docs.aws.amazon.com/AmazonS3/latest/userguide/MultiFactorAuthenticationDelete.html) |
| Object Lock exige versionamento. No modo compliance, nem o usuário raiz exclui a versão. O DELETE com versionId é negado; o DELETE simples cria um delete marker. | [Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html) |

## Replicação (Fase 7)

| Fato | Fonte |
|---|---|
| Exige versionamento na origem e no destino, um papel IAM e, entre contas, uma bucket policy no destino. Com o versionamento do destino desabilitado, a replicação falha (FAILED). | [Requirements](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-requirements.html) |
| Não são replicados: objetos existentes, réplicas de outra regra, objetos em Glacier Flexible ou Deep Archive, ações do lifecycle, DELETE com versionId e, com filtro por tag, objetos marcados depois do PUT. Delete markers só com DeleteMarkerReplication (e não em regras com filtro por tag). | [What is replicated](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-what-is-isnot-replicated.html) |
| SSE-KMS exige opt-in e uma chave na Região de destino; o papel precisa de kms:Decrypt e kms:Encrypt; chaves gerenciadas pela AWS não servem entre contas. SSE-C é replicado sem permissões extras. | [Encrypted objects](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-config-for-kms-objects.html) |
| O RTC replica 99,9% dos objetos em até 15 minutos. O plano inicial dizia 99,99%; o conteúdo usa o valor da documentação. | [S3 RTC](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html) |

## Eventos (Fase 8)

| Fato | Fonte |
|---|---|
| Destinos: SNS, SQS, Lambda e EventBridge. SQS FIFO não é destino direto, só via EventBridge. A entrega acontece pelo menos uma vez, em geral em segundos. A documentação alerta para loops recursivos. | [Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/EventNotifications.html) |
| Filtros sobrepostos para os mesmos tipos de evento são recusados (um filtro vazio sobrepõe todos). Curingas não são aceitos. | [Filtering](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-filtering.html) |
| O sequencer ordena eventos de uma mesma key, não de keys diferentes. | [Event message structure](https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-content-structure.html) |

## Requester Pays (Fase 9)

| Fato | Fonte |
|---|---|
| O requisitante paga a requisição e o download; o dono paga o armazenamento. Requisições anônimas não são aceitas. O cabeçalho x-amz-request-payer é obrigatório para quem não é o dono. Com papel assumido, paga a conta do papel. Um 403 iniciado dentro da conta ou da organização do dono é cobrado do dono. Em RestoreObject, o dono paga a recuperação. | [Requester Pays](https://docs.aws.amazon.com/AmazonS3/latest/userguide/RequesterPaysBuckets.html), [Downloading](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ObjectsinRequesterPaysBuckets.html) |

## Storage Gateway e transferência (Fases 10 e 11)

| Fato | Fonte |
|---|---|
| O S3 File Gateway oferece NFS (v3 e 4.1) e SMB (2 e 3), com arquivos guardados como objetos no S3. | [S3 File Gateway](https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html) |
| Volume Gateway: cached volumes guardam os dados no S3 e um cache local; stored volumes guardam tudo no local, com snapshots na AWS que podem ser recuperados no EC2. | [Volume Gateway](https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html) |
| O Tape Gateway arquiva fitas em S3 Glacier Flexible Retrieval ou Deep Archive. | [Tape Gateway](https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html) |
| Uma tarefa do DataSync usa um link de 10 Gbps por inteiro. A conexão hospedada do Direct Connect é a opção indicada quando a banda não basta. | [Snowball Edge availability change](https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html) |
| O S3 Transfer Acceleration usa as edge locations do CloudFront para transferências de longa distância. | [Transfer Acceleration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html) |

## Divergências e cuidados

- **Express One Zone.** Páginas diferentes da documentação dão percentuais distintos de redução no custo de requisições. Por isso, o conteúdo não cita esse número.
- **Intelligent-Tiering.** A documentação não define duração mínima para a classe. A Price List tem uma linha "EarlyDelete-INT", que não é aplicada pelo simulador.
- **Premissas dos cenários.** Prazos de provisionamento do Direct Connect e de logística até o Data Transfer Terminal são premissas dos cenários da Fase 11, não dados da AWS.
- **Projeto Atlas.** A rubrica é pedagógica; os pesos foram definidos por este projeto.

## Simplificações dos simuladores

Cada simulador lista as suas simplificações na própria tela e em cada fase. As principais:
- **Acesso:** não modela SCPs, RCPs, permission boundaries, session policies, Access Points, grants do KMS nem a maioria das chaves de condição.
- **Lifecycle:** coortes criadas no dia 0, com ações no dia exato (na AWS a execução é assíncrona).
- **Eventos:** entrega única e instantânea.
- **Replicação:** o tempo não é simulado.
- **Transferência:** aproveitamento fixo de 80% do link.
- **Custos:** primeira faixa de preço, sem nível gratuito nem impostos.

---

# Trilha AWS Foundations — conferido em 18/10/2026

## Infraestrutura global (Fase 1)

| Fato | Efeito no conteúdo | Fonte |
|---|---|---|
| 34 Regiões para contas AWS comuns. As lançadas depois de 20/03/2019 são opt-in. Tabela com código, AZs e país. | Catálogo `simulators/regions/catalog.ts` e visual "region-map". | [AWS Regions](https://docs.aws.amazon.com/global-infrastructure/latest/regions/aws-regions.html) |
| Toda Região tem três ou mais AZs. Regiões são isoladas, e recursos não existem em outra Região sem replicação ou cópia explícita. | Conceitos `infra.region` e `infra.no-auto-replication`. | [Fault isolation — Regions](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html) |
| AZ: um ou mais data centers com energia, rede e conectividade redundantes, a até ~100 km uma da outra, com replicação síncrona de latência de um dígito em ms. Deploys separados no tempo entre AZs. | Conceito `infra.az`. | [Fault isolation — AZs](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html) |
| EC2 e EBS são zonais. Static stability: 6 instâncias necessárias em 3 AZs → implantar 9. Local Zones e Outposts têm planos de controle na Região-mãe. | Simulador de AZs e estimativa da Fase 1. | [Zonal services](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/zonal-services.html) |
| Serviços globais: plano de controle numa Região (IAM e Route 53 em us-east-1; Global Accelerator em us-west-2) e plano de dados distribuído. Health checks do Route 53 a partir de oito Regiões. | Conceitos `infra.service-scope` e `edge.route53`. | [Global services](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/global-services.html) |
| ALB: subnets em pelo menos duas AZs; alvos numa zona não habilitada não recebem tráfego; cross-zone ligado por padrão; não mistura AZ e Local Zone. | Validação e regra do simulador de AZs. | [Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html) |
| NAT gateway zonal fica numa AZ; a recomendação é um por AZ. **NAT gateway regional** (novo) se expande pelas AZs com workloads, não faz NAT privado e pode levar até 60 min para chegar a uma AZ nova. | Simulador de AZs com três modos de NAT. Materiais antigos tratam todo NAT como zonal. | [NAT basics](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html), [Regional NAT](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html) |
| RDS Multi-AZ (DB instance): standby síncrono em outra AZ com failover automático; o standby não atende leituras. | Simulador de AZs e item de revisão. | [Multi-AZ DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html) |
| SLA do EC2: 99,99% por Região com instâncias em duas ou mais AZs; 99,5% por instância. Créditos não são reembolso e são pedidos por caso no Support Center. | Fases 1, 2 e desafio final. | [Compute SLA](https://aws.amazon.com/compute/sla/) |
| Local Zones: extensão da Região perto de centros urbanos; precisa ser habilitada; internet e Direct Connect próprios; preços diferentes da Região-mãe; habilitar não custa. | Missão "Perto da cidade". | [What is](https://docs.aws.amazon.com/local-zones/latest/ug/what-is-aws-local-zones.html), [How it works](https://docs.aws.amazon.com/local-zones/latest/ug/how-local-zones-work.html) |
| Wavelength: infraestrutura na borda das redes de operadoras; Wavelength Zone é extensão lógica da Região; tráfego dos dispositivos pelo carrier gateway; sem conexão de entrada vinda da internet. | Missão "Na rede da operadora". Nenhuma mudança de disponibilidade foi encontrada. | [What is](https://docs.aws.amazon.com/wavelength/latest/developerguide/what-is-wavelength.html), [How it works](https://docs.aws.amazon.com/wavelength/latest/developerguide/how-wavelengths-work.html) |
| Outposts: racks (42U) e servers (1U/2U), hardware operado pela AWS como parte de uma Região, ancorado numa AZ, service link obrigatório (≥500 Mbps redundantes por rack, ≤175 ms). Sem o link, instâncias continuam rodando e acessíveis pelo LGW; mutações, plano de controle e telemetria falham; auto recovery exige o link. | Missão "Dentro da fábrica". | [What is](https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html), [Service link](https://docs.aws.amazon.com/outposts/latest/userguide/service-links.html), [Failure modes](https://docs.aws.amazon.com/whitepapers/latest/aws-outposts-high-availability-design/thinking-in-terms-of-failure-modes.html) |
| CloudFront: "points of presence (also known as POPs or edge locations)"; REC entre POPs e origem; métodos PUT/POST/PATCH/OPTIONS/DELETE e requisições dinâmicas não passam pelo REC; origem S3 na mesma Região do REC → o POP vai direto ao bucket; invalidação remove de POPs e RECs. | Simulador de borda. POP e edge location são tratados como o mesmo papel. | [How CloudFront delivers content](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html) |
| Global Accelerator: dois IPs estáticos anycast (IPv4), rede global da AWS, endpoints NLB/ALB/EC2/EIP em uma ou mais Regiões; não faz cache. | Fase 1 e desafio final. | [What is](https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html) |
| S3 Express One Zone: tabela de Regiões e AZs. Europe (Spain), Milan e Zurich não aparecem. | Cenário europeu do laboratório de Regiões. | [Directory buckets — endpoints](https://docs.aws.amazon.com/AmazonS3/latest/userguide/endpoint-directory-buckets-AZ.html) |
| Preço do S3 Standard (primeira faixa) em sete Regiões, pela Price List API. | `standardByRegion` em `s3-prices.json`. | `npm run prices:update` |

## Planos de suporte (Fase 2)

| Fato | Efeito no conteúdo | Fonte |
|---|---|---|
| Planos vigentes: Basic, Business Support+, Enterprise Support e Unified Operations. | Simulador de suporte. | [AWS Support Plans](https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html) |
| Developer e Business: sem novas assinaturas desde 02/12/2025; descontinuados em 01/01/2027. Enterprise On-Ramp: suportado até 31/12/2026, com upgrade automático para Enterprise ao longo de 2026. Os três seguem no GovCloud (US). | Conceito `support.legacy`, com status "sem novos clientes", e missão "Material antigo × oferta atual". | [End of support](https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html), [FAQ](https://aws.amazon.com/premiumsupport/faqs/) |
| Basic: conta e cobrança, aumento de cotas, documentação, re:Post, Health Dashboard; não abre caso técnico. | Predição "Pane no plano Basic". | [Case management](https://docs.aws.amazon.com/awssupport/latest/user/case-management.html) |
| Primeira resposta (BS+, Enterprise, Unified Ops): 24 h / 12 h / 4 h / 1 h; sistema crítico < 30 min (BS+), < 15 min (Enterprise), 5 min por um Incident Management Engineer (Unified Ops). "Every reasonable effort". | Predições e simulador. | [Case management](https://docs.aws.amazon.com/awssupport/latest/user/case-management.html) |
| Trusted Advisor no Basic: todos os checks de Service Limits e alguns de Security e Fault tolerance (refresh manual dos de segurança); planos pagos: todos os checks e API. Trusted Advisor Priority: Enterprise e Unified Ops. | Classificação "Quem oferece o quê?". | [Trusted Advisor](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html), [Compare plans](https://aws.amazon.com/premiumsupport/plans/) |
| TAM designado, AWS Security Incident Response e Countdown: Enterprise. TAM, Domain Specialist Engineers e Incident Management Engineers: Unified Ops (Countdown Premium incluído; compromisso de 90 dias). | Simulador de suporte. | [Plans](https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html), [Unified Operations](https://docs.aws.amazon.com/awssupport/latest/user/unified-operations-intro.html) |
| Preços: BS+ mínimo US$ 29/conta ou 9% / 7% / 5% / 3% (faixas 10K, 80K, 250K); Enterprise mínimo US$ 5K (antes 15K) ou 10% / 7% / 5% / 3% (150K, 500K, 1M); Unified Ops mínimo US$ 50K ou 10% / 6% / 5% (1M, 5M). Exemplo oficial: BS+ com US$ 20K → US$ 1,6K. | `monthlyCost` testado com os exemplos da página. | [Pricing](https://aws.amazon.com/premiumsupport/pricing/) |
| O guia do SAA-C03 não lista planos de suporte; o CLF-C02 (tarefa 4.3) lista Basic, Business Support+, Enterprise Support e Unified Operations. | Conceitos de suporte com `domains: []` e nota explicando. | [CLF-C02 — domínio 4](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html) |

## Responsabilidade compartilhada (Fase 3)

| Fato | Fonte |
|---|---|
| Segurança DA nuvem (AWS: infraestrutura, hardware, software, rede, instalações) × NA nuvem (cliente, conforme os serviços escolhidos). EC2: cliente gerencia SO convidado, patches e security groups. S3/DynamoDB: AWS opera SO e plataforma; cliente gerencia dados e criptografia. Controles compartilhados (patches, configuração, treinamento) e herdados (físicos). | [Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/) |
| Lambda: runtimes gerenciados recebem atualizações automáticas no modo Auto; em imagem de contêiner, o cliente reconstrói a imagem. | [Runtime updates](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-update.html) |
| RDS: atualizações de SO opcionais não são aplicadas automaticamente; obrigatórias são aplicadas após a data, na janela de manutenção; Multi-AZ reduz o impacto. | [Maintaining a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html) |
| Outposts: o cliente responde pela segurança física e pelo controle de acesso em volta do equipamento; a Nitro Security Key é removida antes da devolução do hardware. | [Outposts rack FAQ](https://aws.amazon.com/outposts/rack/faqs/), [Security in Outposts](https://docs.aws.amazon.com/outposts/latest/userguide/security.html) |

## Premissas e simplificações da trilha

- **Latências** entre grupos de usuários e Regiões, gastos mensais das empresas e o prazo de descarte de objetos pouco acessados no POP são **premissas dos cenários**, marcadas na interface com o selo "Premissa do cenário".
- **Residência dos dados** aparece sempre como exigência contratual do cenário; nenhuma lei é citada.
- **Custo relativo** das opções de infraestrutura (laboratório de posicionamento) é julgamento de arquitetura, não preço.
- **Simulador de AZs:** falha total da AZ, failover instantâneo, sem Auto Scaling.
- **Simulador de borda:** um POP e um REC, TTL fixo por comportamento, sem revalidação; caminhos sem cache tratados como dinâmicos.
- **Suporte:** custo só pelas faixas públicas, sem preços regionais especiais nem complementos; uma conta por cenário.
- **Matriz de responsabilidade:** Lambda com .zip e runtime gerenciado (modo Auto); camadas agrupadas.
- **Architecture Foundations:** rubrica e pesos pedagógicos.

# Trilha IAM e Access Management — conferido em 19/10/2026

## Avaliação de políticas (Fases 3 e 4)

| Fato | Fonte |
|---|---|
| Por padrão tudo é negado, exceto para o usuário raiz, que tem acesso total. Ordem: Deny explícito em todas as políticas; Allow nas RCPs; Allow nas SCPs; política de recurso; identidade; permissions boundary; session policy. | [policy-eval-denyallow](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html) |
| Na mesma conta, concessão da política de recurso ao ARN do usuário ou da sessão não é limitada por deny implícito de identidade, boundary ou session policy; ao ARN da role, é limitada por boundary e session policy. Trust policies e key policies do KMS precisam permitir o principal. | mesma página |
| Citar a conta (ID ou `:root`) no Principal delega à conta; não restringe ao usuário raiz. Grupos não podem ser principal. Sem curinga parcial em ARNs de principal. `"*"` inclui anônimos. | [Principal](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html) |
| Entre contas, a AWS faz duas avaliações e as duas precisam permitir (exemplo Carlos/Demo). | [Cross-account](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic-cross-account.html) |
| Role entre contas: quem assume abre mão das próprias permissões; política de recurso: o principal mantém as dele. Delegação só dentro da mesma partição. | [Cross account resource access](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies-cross-account-resource-access.html) |
| Condições: vários operadores e várias chaves combinam com E; vários valores com OU; operador negado com vários valores, NOR. Chave ausente: condição falsa (verdadeira nos negados); `…IfExists` trata ausência como verdadeira; `Null` testa a presença. | [Condition operators](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition_operators.html), [Multiple keys or values](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-logic-multiple-context-keys-or-values.html) |
| Chaves: `aws:SecureTransport` e `aws:RequestedRegion` sempre presentes; `aws:SourceIp` ausente via VPC endpoint; `aws:MultiFactorAuthPresent` só com credenciais temporárias; `aws:SourceArn`/`aws:SourceAccount` só quando um principal de serviço chama em nome de um recurso; chave de tag sem diferenciar maiúsculas, valor diferenciando. | [Global condition keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_condition-keys.html) |
| Tipos de política, elementos, níveis de acesso; boundary, SCP, RCP e session policy não concedem. | [Policies](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html) |
| Gerenciada pela AWS (não editável), gerenciada pelo cliente, inline (um para um, apagada com a identidade). Cotas: 10 gerenciadas por usuário (até 20), 20 por role (até 25), 10 por grupo; tamanhos 6.144 (gerenciada), inline 2.048/5.120/10.240 (usuário/grupo/role). | [Managed vs inline](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_managed-vs-inline.html), [Quotas](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html) |
| Permissions boundary: usuário ou role; efetiva = identidade ∩ boundary; exemplos Shirley e María/Zhang/Nikhil (delegação com `iam:PermissionsBoundary`). | [Boundaries](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) |

## Identidades, credenciais e MFA (Fases 1 e 2)

| Fato | Fonte |
|---|---|
| Tarefas que exigem o root (e-mail/senha e fechar conta avulsa, restaurar o único admin, acesso do IAM ao Billing, MFA delete, destravar bucket policy que nega todos, RI Marketplace, GovCloud). | [Root user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-user.html) |
| Boas práticas do root: MFA (obrigatório em todo tipo de conta, registro em até 35 dias), sem chaves de acesso (`aws login` para CLI), aprovação por mais de uma pessoa, e-mail de grupo, canais de recuperação com grupos diferentes. | [Root user best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/root-user-best-practices.html) |
| Acesso root centralizado: remove credenciais root das contas-membro e permite tarefas privilegiadas pela conta de gerenciamento ou administrador delegado. | [Centralize root access](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_root-enable-root-access.html) |
| Até 2 chaves por usuário; segredo só na criação. Rotação: criar a segunda, atualizar, conferir último uso, desativar, confirmar, excluir. | [Access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html), [Update access keys](https://docs.aws.amazon.com/IAM/latest/UserGuide/id-credentials-access-keys-update.html) |
| Relatório de credenciais: CSV com usuários e root; no máximo a cada 4 horas; duas primeiras chaves. | [Credential report](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_getting-report.html) |
| Grupos: só usuários, sem aninhamento, não são principal. Usuário IAM só nas exceções (sem suporte a role, terceiros, emergência). | [Groups](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_groups.html), [Best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) |
| MFA: passkeys e chaves de segurança (FIDO, resistentes a phishing), app autenticador e token TOTP; SMS encerrado; até 8 dispositivos; FIDO não vai às APIs do STS (`aws login`); FIDO só habilitado pelo console. | [MFA](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa.html) |
| Recuperação: outro dispositivo; usuário IAM depende de administrador; root usa e-mail e telefone; trocar a senha depois. | [Recover MFA](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_mfa_lost-or-broken.html) |

## Roles e STS (Fases 5 e 6)

| Fato | Fonte |
|---|---|
| AssumeRole: 900 s até o máximo da role (1 a 12 h), padrão 3.600 s; acima do máximo, falha; encadeamento acima de 1 h falha; MFA em SerialNumber/TokenCode; ExternalId de 2 a 1.224 caracteres; até 10 session policies gerenciadas (2.048 caracteres); até 50 session tags (sobrescrevem tags da role); sessão de role não chama GetFederationToken nem GetSessionToken. | [AssumeRole](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRole.html) |
| Comparativo das APIs do STS (GetSessionToken 15 min a 36 h, padrão 12 h, root até 1 h; GetFederationToken exige session policy; SAML e WebIdentity sem credenciais AWS). | [STS comparison](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_sts-comparison.html) |
| Switch role: root não troca de role; sem ExternalId pelo console; sessão de 1 h por padrão, limitada ao tempo da sessão do usuário; permissões não se somam. | [Switch role (console)](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-console.html) |
| EC2: instance profile com uma role (limite fixo); credenciais pelos metadados em `iam/security-credentials/<role>`, renovadas automaticamente; role pode ser anexada a instância em execução. | [Roles for EC2](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2.html), [Instance profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html) |
| PassRole: permissão, não API (sem evento próprio no CloudTrail); restringir por ARN e `iam:PassedToService`; não usar ResourceTag para PassRole; só mesma conta. | [PassRole](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_passrole.html) |
| Service-linked role: definida pelo serviço, só visualizável, sem boundary; SCPs e RCPs não a limitam. | [Roles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html), [RCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html) |
| Roles Anywhere: X.509, trust anchor (AWS Private CA ou CA externa), profile com roles e uma session policy; recursos regionais. | [Roles Anywhere](https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html) |
| Assistente confuso: External ID único gerado pelo fornecedor; entre serviços, `aws:SourceArn`/`aws:SourceAccount`. Bucket policy do CloudTrail com `s3:GetBucketAcl`, `s3:PutObject` em `AWSLogs/<conta>/*`, `aws:SourceArn` e `s3:x-amz-acl`. | [Confused deputy](https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html), [CloudTrail bucket policy](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/create-s3-bucket-policy-for-cloudtrail.html) |
| AWS RAM: compartilha recursos com contas, OUs ou a organização; sem convite dentro da organização; sem cobrança adicional. | [RAM](https://docs.aws.amazon.com/ram/latest/userguide/what-is.html) |

## Federação e identidades externas (Fase 7)

| Fato | Fonte |
|---|---|
| IAM Identity Center: instância de organização recomendada; permission sets viram roles; sessão de 1 h (até 12 h); portal de 8 h (até 90 dias); sem cobrança adicional. | [What is](https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html), [Permission sets](https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html), [FAQ](https://aws.amazon.com/iam/identity-center/faqs/) |
| Fonte de identidade: uma por organização (diretório do Identity Center, AD, IdP externo); Simple AD não suportado. | [Identity source](https://docs.aws.amazon.com/singlesignon/latest/userguide/manage-your-identity-source.html) |
| Directory Service: Managed Microsoft AD (trust), AD Connector (proxy, MFA RADIUS, incompatível com RDS for SQL Server), Simple AD (Samba 4, sem MFA nem trusts). | [Directory Service](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/what_is.html) |
| Cognito: user pool (diretório, login, JWT), identity pool (credenciais AWS, visitantes, RBAC/ABAC). | [Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) |
| ABAC com `aws:PrincipalTag` e `aws:ResourceTag`. | [ABAC](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction_attribute-based-access-control.html) |

## Várias contas e guardrails (Fase 8)

| Fato | Fonte |
|---|---|
| SCP: exige all features; não concede; não afeta conta de gerenciamento, service-linked roles nem principais de fora da organização; afeta o root das contas-membro; Allow em todos os níveis; FullAWSAccess por padrão. | [SCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html), [SCP evaluation](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_evaluation.html) |
| RCP: limita recursos das contas-membro, inclusive para principais externos e o root; não afeta a conta de gerenciamento, service-linked roles nem AWS managed keys do KMS; RCPFullAWSAccess fixa; lista de serviços suportados. | [RCPs](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html) |
| Control Tower: landing zone (Organizations, Service Catalog, IAM Identity Center, Account Factory); controles preventivos (SCP/RCP), detectivos (AWS Config) e proativos (hooks do CloudFormation); obrigatórios, fortemente recomendados e eletivos; exceção da conta de gerenciamento. | [What is Control Tower](https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html), [How controls work](https://docs.aws.amazon.com/controltower/latest/userguide/how-controls-work.html) |
| IAM Access Analyzer: acesso externo (zona de confiança, por Região), interno e não usado (pago); validação com mais de 100 verificações; geração de política pelo CloudTrail. | [Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html) |

## Premissas e simplificações da trilha

- **Premissas dos cenários:** idades e últimos usos de chaves, prazos de rotação e de abandono das empresas, duração máxima de 4 h da role de produção, IPs de escritório, IDs de conta, de organização e External IDs.
- **Motor de políticas:** não modela NotPrincipal, políticas de VPC endpoint, ACLs, grants do KMS, operadores de conjunto (ForAllValues/ForAnyValue), operadores de data, nem o casamento de ARN por segmento. A lista de serviços que aceitam RCP no motor é um subconjunto da oficial.
- **Login no console** é tratado como sessão temporária (a chave de MFA existe, com true ou false); a idade do MFA não é simulada.
- **AssumeRole:** session tags, SourceIdentity e o tamanho do token não são aplicados.
- **Organização:** só SCPs no laboratório; RCPs aparecem em previsão.
- **Escolha da solução de identidade:** a "complexidade relativa" que desempata opções é julgamento de arquitetura.
- **Arquitetura de Acesso:** rubrica e pesos pedagógicos.
- **Texto da S3 Expedition (Fase 3)** que chamava o root de impossível de limitar foi alinhado: ele não recebe políticas de identidade, mas Deny em política de recurso, SCPs e RCPs o afetam.
