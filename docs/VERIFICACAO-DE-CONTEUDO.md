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

# Trilha Computação na AWS — conferido em 20/10/2026

## Escopo do exame

| Fato | Fonte |
|---|---|
| Serviços no escopo do SAA-C03: Batch, EC2, EC2 Auto Scaling, Elastic Beanstalk, Outposts, Serverless Application Repository, VMware Cloud on AWS e Wavelength (Compute); ECR, ECS, ECS Anywhere, EKS, EKS Anywhere e EKS Distro (Containers); Fargate e Lambda (Serverless); EBS, ELB, Savings Plans, AWS Auto Scaling e Compute Optimizer em outras categorias. | [In-scope services](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) |
| A página da AWS sobre VMware apresenta hoje o **Amazon EVS** (VMware Cloud Foundation em bare metal do EC2 na VPC, migração sem trocar IPs, operado pelo cliente ou por parceiro). A trilha cita o VMware Cloud on AWS só por esse caminho. | [What is Amazon EVS?](https://docs.aws.amazon.com/evs/latest/userguide/what-is-evs.html) |

## EC2 essencial (Fase 1)

| Fato | Fonte |
|---|---|
| Estados e cobrança: `running` cobrado por segundo, com mínimo de 1 min a cada início; `stopped` não é cobrado, mas os volumes EBS sim; na hibernação, o `stopping` é cobrado. | [Instance state changes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html) |
| Stop/start: muda de host, apaga o instance store e troca o IPv4 público; IP privado e Elastic IP ficam. Hibernação: única ação que preserva a RAM (gravada no volume raiz). Terminate: o volume raiz é apagado por padrão (`DeleteOnTermination`); os demais volumes ficam. | [Lifecycle](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html), [Hibernate](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Hibernate.html) |
| Instance store: temporário, aguenta reboot e se apaga no stop, hibernate, terminate ou falha do disco. | [Instance store](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/InstanceStorage.html), [Data persistence](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-store-lifetime.html) |
| Elastic IP: estático, remapeável para outra instância, cobrado mesmo sem associação; o IPv4 público automático não pode ser convertido em Elastic IP. | [Elastic IP addresses](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html), [IP addressing](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html) |
| AMI, key pair (o EC2 não guarda a chave privada), security group, user data (alterável só com a instância parada), IMDS e instance profile. | [AMIs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html), [Key pairs](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html), [Security groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html), [User data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html), [IMDS](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html), [Roles for EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html) |
| Session Manager: acesso sem par de chaves, com chamadas registradas no CloudTrail. | [Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html) |

## Tipos de instância (Fase 2)

| Fato | Fonte |
|---|---|
| Nome: série, geração, opções e tamanho (ex.: `c7gn.xlarge`); letras de série e de opções (a, g, i, d, n, e, b, z, flex). | [Naming](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-type-names.html) |
| Famílias de uso geral, computação, memória, armazenamento e acelerada (G e P com GPU, Inf para inferência, Trn para treino, F com FPGA). | [Instance types](https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-types.html), [Accelerated](https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html) |
| Graviton: AMI Arm de 64 bits e só Linux. | [Graviton](https://aws.amazon.com/ec2/graviton/) |
| Burstable: T8i, T4g, T3a e T3 atuais (T2 da geração anterior), em unlimited por padrão; excedente cobrado só se a média de 24 h passar da baseline. Exemplo da documentação: baseline de 30% do t3.large e equilíbrio com o m5.large em 42,5% de CPU. | [Burstable](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances.html), [Credits](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html), [Unlimited](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-unlimited-mode-concepts.html) |
| Nitro, ENA e EFA (tráfego EFA não atravessa AZs nem VPCs; sem custo adicional). | [Nitro](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html), [ENA](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/enhanced-networking-ena.html), [EFA](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html) |
| Placement groups: cluster (uma AZ, baixa latência, não aceita T), partition (até 7 partições por AZ) e spread (até 7 instâncias em execução por AZ; não aceita Dedicated Instances). | [Placement strategies](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-strategies.html) |
| Compute Optimizer: recomendações a partir do uso medido; até 93 dias com as métricas avançadas pagas. | [Compute Optimizer](https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html) |

## EBS e instance store (Fase 3)

| Fato | Fonte |
|---|---|
| gp3: 1 GiB a 64 TiB, baseline de 3.000 IOPS e 125 MiB/s, até 80.000 IOPS e 2.000 MiB/s. gp2: até 16 TiB, 16.000 IOPS e 250 MiB/s. io2 Block Express: 4 GiB a 64 TiB, até 256.000 IOPS e 4.000 MiB/s, durabilidade de 99,999%. io1: até 64.000 IOPS. st1 e sc1: 125 GiB a 16 TiB, 500 e 250 MiB/s, não servem de boot. | [Volume types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html), [General Purpose](https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html), [Provisioned IOPS](https://docs.aws.amazon.com/ebs/latest/userguide/provisioned-iops.html), [HDD](https://docs.aws.amazon.com/ebs/latest/userguide/hdd-vols.html) |
| Multi-Attach: só io1 e io2, não serve de boot, sem cobrança extra; Windows só com io2. | [Multi-Attach](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html) |
| Snapshots incrementais, guardados no S3 sem acesso pelo console do S3, restauráveis em qualquer AZ da Região e copiáveis para outra Região (podendo cifrar com chave de lá). Criptografia por padrão por Região. | [Snapshots](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-snapshots.html), [Encryption by default](https://docs.aws.amazon.com/ebs/latest/userguide/encryption-by-default.html) |

## Opções de compra (Fase 4)

| Fato | Fonte |
|---|---|
| On-Demand, Savings Plans, Reserved Instances, Spot, Dedicated Hosts, Dedicated Instances, Capacity Reservations e Capacity Blocks para ML. | [Purchasing options](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-purchasing-options.html) |
| Compute SP até 66% (qualquer família, tamanho, Região, SO e tenancy, e Fargate e Lambda); EC2 Instance SP até 72% (uma família numa Região); 1 ou 3 anos, All/Partial/No Upfront. Taxa de Dedicated Instances de US$ 2/h por Região, sem desconto. | [Plan types](https://docs.aws.amazon.com/savingsplans/latest/userguide/plan-types.html), [SP e RIs](https://docs.aws.amazon.com/savingsplans/latest/userguide/sp-ris.html) |
| RIs: a AWS recomenda Savings Plans; Standard só modificável, Convertible trocável; sem cancelamento; regional × zonal (só a zonal reserva capacidade). | [RI](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-reserved-instances.html), [Scope](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/reserved-instances-scope.html) |
| Spot: aviso de 2 min por EventBridge e pelo metadata `spot/instance-action`; motivos (capacidade, preço, restrições); terminate, stop ou hibernate; preço máximo aumenta interrupções. | [Spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html), [Interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html), [Notices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-instance-termination-notices.html) |
| ODCR por AZ, cobrada mesmo sem uso; Dedicated Host com afinidade e BYOL por socket ou core. | [ODCR](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-capacity-reservations.html), [Dedicated Hosts](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/dedicated-hosts-overview.html) |

## Elastic Load Balancing (Fase 5)

| Fato | Fonte |
|---|---|
| ALB exige 2 AZs; alvos em AZ não habilitada não recebem tráfego. Cross-zone sempre ligado no ALB (desligável no target group), desligado por padrão no NLB e no GWLB; exemplo 2+8 (10% com cross-zone; 25% e 6,25% sem). | [How ELB works](https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html) |
| NLB: flow hash, IP estático por AZ (Elastic IP opcional), TCP 443 para passthrough de TLS. GWLB: GENEVE na porta 6081, endpoints nas tabelas de rotas. | [NLB](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/introduction.html), [GWLB](https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/introduction.html) |
| Regras do ALB: prioridade crescente, regra padrão por último, uma ação terminal, condições host, método, path, IP de origem, header e query string; até 3 valores por condição e 5 por regra; forward ponderado. | [Listeners](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-listeners.html), [Listener rules](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-rules.html) |
| Target groups (tipo fixo, uma função Lambda por grupo), health checks, sticky sessions (cookie até 7 dias; não funcionam com cross-zone desligado). | [Target groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html), [Health checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html), [Attributes](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html) |

## Auto Scaling (Fase 6)

| Fato | Fonte |
|---|---|
| Target tracking (recomendado), step e simple (com cooldown); nunca sai de min e max; com várias políticas, vence a que deixa mais capacidade (exemplo: 8 instâncias, remover 3 ou 25%, remove 2). | [Dynamic scaling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html), [Cooldowns](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-scaling-cooldowns.html) |
| Scheduled e predictive (tráfego cíclico, inicialização lenta). | [Predictive](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html) |
| Health checks (EC2 e, depois do grace period, ELB, EBS, VPC Lattice ou custom); término com equilíbrio entre AZs antes da política padrão. | [Health checks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-health-checks.html), [Termination](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-termination-policies.html) |
| Lifecycle hooks (CONTINUE ou ABANDON), warm pools e grupos mistos (lowest-price desaconselhada para Spot). | [Hooks](https://docs.aws.amazon.com/autoscaling/ec2/userguide/lifecycle-hooks.html), [Warm pools](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-warm-pools.html), [Mixed](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-mixed-instances-groups.html) |

## Lambda (Fase 7)

| Fato | Fonte |
|---|---|
| Memória de 128 a 10.240 MB (1.769 MB = 1 vCPU), timeout de 900 s, `/tmp` de 512 a 10.240 MB, 4 KB de variáveis, 5 camadas, payload de 6 MB síncrono e 1 MB assíncrono. | [Quotas](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) |
| Concorrência = RPS × duração; 1.000 por Região, 100 sempre sem reserva; limite de RPS de 10 vezes a concorrência; reservada é mínimo e máximo, gratuita; provisionada é cobrada e não passa da reservada. | [Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html) |
| Assíncrono: 2 novas tentativas em erros da função; destinos e DLQ (FIFO não serve); event source mapping processa pelo menos uma vez; Lambda na VPC precisa de NAT para a internet. | [Async errors](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html), [Destinations](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-retain-records.html), [ESM](https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html), [VPC](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html) |

## Contêineres (Fase 8)

| Fato | Fonte |
|---|---|
| ECS: task definition, task, service e cluster; capacidade Fargate, EC2, ECS Managed Instances e ECS Anywhere. | [What is ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html), [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html) |
| Execution role (imagem do ECR, logs, segredos) × task role (código), ambas confiando em `ecs-tasks.amazonaws.com`. | [Task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html), [Execution role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html) |
| EKS: plano de controle gerenciado, Kubernetes certificado, Auto Mode; ECR com scan on push, lifecycle policies e replicação. | [EKS](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html), [ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html) |

## Escolhendo a computação (Fase 9)

| Fato | Fonte |
|---|---|
| AWS Batch: job definition, job, job queue com prioridade, compute environment gerenciado (Fargate, EC2 On-Demand ou Spot, ECS Managed Instances) ou não gerenciado; jobs em contêiner sobre ECS ou EKS; dependências entre jobs. | [What is Batch](https://docs.aws.amazon.com/batch/latest/userguide/what-is-batch.html), [Components](https://docs.aws.amazon.com/batch/latest/userguide/batch_components.html) |
| Elastic Beanstalk: provisiona instâncias (ou EKS no modo Cluster), balanceamento, monitoramento de saúde e escala; Go, Java, .NET, Node.js, PHP, Python, Ruby e Docker; sem cobrança adicional. | [What is Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html) |
| Políticas de implantação: All at once (fora do ar por pouco tempo), Rolling (capacidade reduzida), Rolling with additional batch (mantém a capacidade), Immutable (grupo novo, as antigas ficam intactas se as novas falharem), Traffic splitting (canary, exige ALB). Blue/green por troca de CNAME, exigido para versão de plataforma incompatível; banco fora do ambiente. | [Deployment policies](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.rolling-version-deploy.html), [Blue/Green](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.CNAMESwap.html) |
| Serverless Application Repository: aplicações SAM publicadas de forma privada, compartilhada ou pública. | [What is SAR](https://docs.aws.amazon.com/serverlessrepo/latest/devguide/what-is-serverlessrepo.html) |
| ECS Anywhere: instâncias externas com launch type EXTERNAL, agente do SSM, sem balanceamento de carga nem service discovery, sem `awsvpc`. | [ECS Anywhere](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-anywhere.html) |
| EKS Anywhere: operado pelo cliente, em vSphere, bare metal, Nutanix, CloudStack e Snow, também em ambientes isolados. Hybrid Nodes e EKS no Outposts exigem conexão confiável com a Região. | [EKS deployment options](https://docs.aws.amazon.com/eks/latest/userguide/eks-deployment-options.html) |

## Preços

- `src/content/pricing/compute-prices.json` é gerado por `npm run prices:compute` a partir da AWS Price List API (ofertas AmazonEC2, AWSComputeSavingsPlan, AWSLambda, AmazonECS e AWSELB) para us-east-1 e sa-east-1. O script falha se faltar algum preço ou se houver ambiguidade.
- O desconto do Spot não está na Price List API: entra como **premissa do cenário** (70%), e o fato de existir desconto vem da página do Spot.
- Mês de 730 horas; primeira faixa de preço, sem nível gratuito nem impostos.

## Premissas e simplificações da trilha

- **Premissas dos cenários:** cargas, perfis de CPU e de tráfego ao longo do dia, capacidade por instância, atraso de launch e warmup, desconto do Spot e orçamentos dos labs.
- **Instâncias:** a carga cabe se vCPU e memória bastam (sem rede, disco ou benchmark); preços On-Demand de Linux.
- **Volumes:** a configuração de referência é a mais barata que atende, achada por busca.
- **Compra:** cada compromisso (RI ou Savings Plan) cobre exatamente as instâncias do segmento e é cobrado as 730 horas do mês; preços No Upfront, Linux e tenancy compartilhada.
- **Balanceadores:** o forward ponderado é determinístico.
- **Auto Scaling:** passos de 5 min; o predictive repete o dia anterior.
- **Lambda:** a carga é o pico constante; sem reserva, as funções dividem a concorrência livre em proporção à necessidade.
- **Escolha da computação:** a "complexidade relativa" que desempata as opções é julgamento de arquitetura.
- **Arquitetura de Computação:** rubrica e pesos pedagógicos.
- **Variantes novas** (Lambda Managed Instances, durable functions, ECS Managed Instances e EC2 managed instances) aparecem só como aviso, sem detalhes.

# Trilha Bancos de dados na AWS — conferido em 21/10/2026

## Escopo do exame

| Fato | Fonte |
|---|---|
| Serviços no escopo do SAA-C03 em Database: Aurora, Aurora Serverless, DocumentDB, DynamoDB, ElastiCache, Keyspaces, Neptune, RDS e Redshift; AWS DMS em Migration and Transfer; AWS Backup em Storage. | [In-scope services](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) |
| A documentação atual chama de "Aurora serverless" o antigo Aurora Serverless v2 (nota de abril de 2026 no blog da AWS); o v1 é descrito como produto descontinuado, de outra arquitetura. A trilha ensina só o atual. | [Using Aurora serverless](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html), [How Aurora serverless works](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html), [Blog: upgrade v1 to v2](https://aws.amazon.com/blogs/database/upgrade-from-amazon-aurora-serverless-v1-to-v2-with-minimal-downtime) |

## RDS essencial (Fase 1)

| Fato | Fonte |
|---|---|
| Motores: Db2, MariaDB, SQL Server, MySQL, Oracle e PostgreSQL; o Aurora tem guia próprio. A AWS cuida de escala, alta disponibilidade, backups, patches e instalação do motor e do sistema operacional; otimização da aplicação e ajuste de consultas ficam com o cliente. A AWS recomenda o RDS como escolha padrão. | [What is Amazon RDS?](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html) |
| Classes: db.m (uso geral), db.r, db.x e db.z (memória), db.c (computação), db.t (burstable); a classe pode ser trocada. | [DB instance classes](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.DBInstanceClass.html) |
| Armazenamento: gp3 com 3.000 IOPS e 125 MiB/s abaixo de 400 GiB e 12.000 IOPS e 500 MiB/s a partir de 400 GiB (volume dividido em quatro; MySQL, MariaDB, PostgreSQL e Db2), aceitando de 12.000 a 64.000 IOPS e de 500 a 4.000 MiB/s; até 0,25 MiB/s por IOPS e 500 IOPS por GiB. io2 Block Express até 256.000 IOPS, de 0,5 a 1.000 IOPS por GiB, 100 GiB a 64 TiB. Magnético descontinuado; desde 01/07/2026 não se restaura snapshot para ele. 64 TiB (256 TiB com volumes adicionais no Oracle e no SQL Server). | [Amazon RDS DB instance storage](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html) |
| Autoscaling de armazenamento: espaço livre ≤ 10% por 5 minutos; aumento pelo maior entre 10 GiB, 10% e o crescimento previsto para 7 horas; até quatro alterações em 24 horas; nunca diminui; sem reboot. | [Storage autoscaling](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIOPS.Autoscaling.html) |
| Parameter group padrão não pode ser alterado; estáticos valem após reboot; `pending-reboot` não reinicia sozinho na janela de manutenção. | [Overview of parameter groups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/parameter-groups-overview.html) |
| DB subnet group com subnets em pelo menos duas AZs; Public access, subnets públicas e security group decidem o acesso pela internet; conectar pelo nome DNS. | [Working with a DB instance in a VPC](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html) |
| Janela de manutenção semanal de 30 minutos; no Multi-AZ, o patch de sistema operacional vai primeiro ao standby; atualização da versão do motor para as duas instâncias juntas. Blue/Green (MySQL, MariaDB e PostgreSQL) com troca em geral abaixo de 1 minuto. | [Maintaining a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.Maintenance.html), [Blue/Green Deployments](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/blue-green-deployments.html) |

## Alta disponibilidade no RDS (Fase 2)

| Fato | Fonte |
|---|---|
| Multi-AZ com um standby: síncrono, não atende leituras, failover em geral de 60 a 120 s com troca do DNS; AWS recomenda cache de DNS de até 60 s em Java. | [Multi-AZ DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html), [Failover](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html) |
| Cluster Multi-AZ: escritor e dois leitores em três AZs, semissíncrono (commit espera um leitor), leitores atendem leituras, failover em geral abaixo de 35 s. | [Multi-AZ DB cluster](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html), [Cluster failover](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts-failover.html) |
| Réplicas de leitura: assíncronas, até 15 por primária, cobradas como instâncias, sem cobrança de transferência na mesma Região, criação manual, exigem backup automático na origem; em outra Região para DR (transferência cobrada, chave KMS do destino). Promoção: reinicia, sem volta, não afeta outras réplicas. | [Read replicas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html), [Creating](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.Create.html), [Cross-Region](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.XRgn.html), [Promoting](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.Promote.html), [Quotas](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html) |
| Backup automático de 0 a 35 dias (padrão 7 no console e 1 na API; 0 desliga); incrementais no S3; PITR com logs enviados a cada 5 minutos, restauração numa instância nova. | [Backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html), [Retention](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.BackupRetention.html), [PITR](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html) |
| Snapshots manuais ficam até serem apagados (100 por Região); compartilháveis com até 20 contas; com a chave padrão do RDS não podem ser compartilhados; criptografados nunca públicos; automáticos precisam ser copiados antes. | [Sharing snapshots](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ShareSnapshot.html), [Copying snapshots](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CopySnapshot.html) |
| RDS Proxy: pool de conexões, segura clientes no failover, IAM e Secrets Manager; mesma VPC, não público, só a instância de escrita; cobrado por vCPU. | [RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html) |

## Amazon Aurora (Fase 3)

| Fato | Fonte |
|---|---|
| Volume do cluster com seis cópias em três AZs, independente do número de instâncias; até 256 TiB em algumas versões; espaço diminui ao apagar dados. | [Aurora storage](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html), [High availability](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html) |
| Até 15 réplicas; failover em geral abaixo de 60 s (muitas vezes 30 s); sem réplicas, recriação em geral abaixo de 10 minutos; prioridades de 0 a 15. Aurora Auto Scaling só para leitoras. | [High availability](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html), [Aurora Auto Scaling](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Integrating.AutoScaling.html) |
| Endpoints de cluster, de leitura, personalizado e de instância. | [Endpoints](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html) |
| Global Database: primário e até 10 secundários de leitura, replicação em geral abaixo de 1 s, até 16 instâncias por secundário, switchover e failover, write forwarding. | [Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html) |
| Aurora serverless: ACU com cerca de 2 GiB, de 0 a 256 ACUs conforme a versão, passos de 0,5 ACU, cobrança por ACU-hora, mistura com instâncias provisionadas. | [How Aurora serverless works](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html) |
| Standard × I/O-Optimized: I/O-Optimized indicado quando a E/S passa de 25% do gasto; de Standard para I/O-Optimized uma vez a cada 30 dias. | [Aurora storage](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html) |
| Backtrack só no Aurora MySQL, janela de até 72 h, ligado na criação; clone copy-on-write, até 15 clones assim. | [Backtrack](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Managing.Backtrack.html), [Cloning](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Clone.html) |

## DynamoDB (Fases 4 e 5)

| Fato | Fonte |
|---|---|
| Sem servidor, três AZs, sem esquema fora da chave, item de até 400 KB; chave de partição por hash, chave composta com ordenação. | [What is DynamoDB?](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html), [Core components](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html), [Partitions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.Partitions.html), [Constraints](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Constraints.html) |
| Unidades: leitura de 4 KB (forte 1, eventual ½, transacional 2), escrita de 1 KB (transacional 2), arredondamento para cima; exemplos 80 RCU e 100 WCU. | [Read and write operations](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/read-write-operations.html), [Provisioned mode](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/provisioned-capacity-mode.html) |
| Partição: até 3.000 unidades de leitura e 1.000 de escrita por segundo; write sharding; capacidade adaptativa e burst de 300 s. | [Partition key design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html), [Write sharding](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-sharding.html), [Burst and adaptive](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/burst-adaptive-capacity.html) |
| Sob demanda (padrão recomendado; nova tabela até 4.000 escritas e 12.000 leituras por segundo, dobro do pico anterior) × provisionado; troca para sob demanda até quatro vezes em 24 h; 40.000 unidades por tabela; meta de 70% no auto scaling. | [On-demand](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode.html), [Quotas](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html) |
| GSI × LSI (20 e 5 por tabela, LSI só na criação e 10 GB por chave, GSI só leitura eventual). | [Secondary indexes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SecondaryIndexes.html), [Read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html) |
| Streams (24 h, ordem por item, uma vez); TTL (época Unix, em geral alguns dias, sem WCU); DAX (microssegundos, leituras eventuais, não indicado para leitura forte nem escrita intensa); tabelas globais (todas gravam, last writer wins, MREC em geral até 1 s, MRSC com três Regiões); PITR de 1 a 35 dias por segundo, tabela nova; transações (100 ações, 4 MB, duas operações, não entre Regiões); exportação para o S3 sem RCU. | [Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html), [TTL](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html), [DAX](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html), [Global tables](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html), [How global tables work](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_HowItWorks.html), [PITR](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Point-in-time-recovery.html), [Transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html), [Export](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataExport.HowItWorks.html) |

## Cache e bancos especializados (Fase 6)

| Fato | Fonte |
|---|---|
| ElastiCache com Valkey, Redis OSS e Memcached, serverless ou em nós; Memcached multithread, sem replicação nem backup em nós; Valkey e Redis OSS com sorted sets, pub/sub, failover e backup. Sessões como caso de uso. | [What is ElastiCache?](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html), [Comparing engines](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/SelectEngine.html), [What is Valkey?](https://aws.amazon.com/elasticache/what-is-valkey/) |
| Lazy loading (três idas na falta, dado pode ficar velho), write-through (sempre atual, guarda dados não lidos) e TTL. | [Caching strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html) |
| DocumentDB (compatível com MongoDB, seis cópias em três AZs, 15 réplicas); Neptune (Gremlin, openCypher e SPARQL, 15 réplicas); Keyspaces (compatível com Cassandra, sem servidor, sob demanda ou provisionado). | [DocumentDB](https://docs.aws.amazon.com/documentdb/latest/developerguide/what-is.html), [Neptune](https://docs.aws.amazon.com/neptune/latest/userguide/intro.html), [Keyspaces](https://docs.aws.amazon.com/keyspaces/latest/devguide/what-is-keyspaces.html) |

## Redshift (Fase 7)

| Fato | Fonte |
|---|---|
| Data warehouse em petabytes; armazenamento em colunas (5 de 100 colunas ≈ 5% dos dados, blocos de 1 MB); nó líder com dois ou mais nós de computação; RMS no RA3; concurrency scaling. | [What is Redshift?](https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html), [Columnar storage](https://docs.aws.amazon.com/redshift/latest/dg/c_columnar_storage_disk_mem_mgmnt.html), [Architecture](https://docs.aws.amazon.com/redshift/latest/dg/c_high_level_system_architecture.html), [Concurrency scaling](https://docs.aws.amazon.com/redshift/latest/dg/concurrency-scaling.html) |
| Serverless: RPUs, por segundo com mínimo de 60 s, sem cobrança parado. Spectrum consulta o S3 sem carregar. | [Serverless capacity](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-capacity.html), [Serverless billing](https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-billing.html), [Spectrum](https://docs.aws.amazon.com/redshift/latest/dg/c-using-spectrum.html) |
| Snapshots automáticos a cada cerca de 8 h ou 5 GB por nó, retenção padrão de 1 dia (até 35 no RA3), cópia automática para outra Região; Multi-AZ em duas AZs com um endpoint. | [Snapshots](https://docs.aws.amazon.com/redshift/latest/mgmt/working-with-snapshots.html), [Cross-Region copy](https://docs.aws.amazon.com/redshift/latest/mgmt/cross-region-snapshot-copy.html), [Multi-AZ](https://docs.aws.amazon.com/redshift/latest/mgmt/managing-cluster-multi-az.html) |
| Data sharing de dados vivos entre clusters, contas e Regiões; zero-ETL a partir de Aurora, RDS e DynamoDB. Athena: SQL sem servidor sobre o S3, pago por consulta. | [Data sharing](https://docs.aws.amazon.com/redshift/latest/dg/datashare-overview.html), [Zero-ETL](https://docs.aws.amazon.com/redshift/latest/mgmt/zero-etl-using.html), [Athena](https://docs.aws.amazon.com/athena/latest/ug/what-is.html) |

## Segurança e backup (Fase 8)

| Fato | Fonte |
|---|---|
| Criptografia em repouso (AES-256, KMS) cobre armazenamento, logs, backups, réplicas e snapshots; só na criação; para um banco existente, copiar snapshot com criptografia e restaurar; não desliga; réplica com o mesmo estado da origem. | [Encrypting RDS resources](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.Encryption.html) |
| TLS: `rds.force_ssl` no PostgreSQL. Autenticação IAM (MariaDB, MySQL, PostgreSQL) com token de 15 minutos. Senha mestre gerenciada no Secrets Manager, rotação a cada 7 dias por padrão. | [SSL PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html), [IAM DB auth](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html), [Secrets Manager](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html) |
| DynamoDB criptografado por padrão (chave da AWS sem custo); endpoint de gateway para S3 e DynamoDB sem custo adicional; `dynamodb:LeadingKeys`. | [DynamoDB encryption](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/EncryptionAtRest.html), [Gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html), [Fine-grained access](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/specifying-conditions.html) |
| Proteção contra exclusão (ligada por padrão no console), snapshot final e retenção dos backups automáticos (replicados para outra Região permanecem). | [Deleting a DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_DeleteInstance.html) |
| AWS Backup: planos, cofres, backups imutáveis, Vault Lock (WORM; compliance × governance; sem custo adicional), gestão entre contas. | [What is AWS Backup?](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html), [Vault Lock](https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html) |

## Migração e escolha (Fase 9)

| Fato | Fonte |
|---|---|
| DMS: servidor de replicação, endpoints, tarefas; DMS Serverless; Schema Conversion e AWS SCT para trocar de motor; criptografia KMS e SSL; failover da replicação; cria tabelas e chaves primárias. | [What is DMS?](https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html), [Serverless](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.html), [Schema Conversion](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_SchemaConversion.html), [SCT](https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/CHAP_Welcome.html) |
| Tipos de tarefa: carga completa, carga completa com CDC e só CDC. Validação compara origem e destino, inclusive as mudanças da CDC. Migrações homogêneas usam ferramentas nativas, sem validação embutida. | [Creating a task](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.Creating.html), [Validation](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Validating.html), [Homogeneous migrations](https://docs.aws.amazon.com/dms/latest/userguide/data-migrations.html) |
| Guia de escolha de banco da AWS. | [Choosing an AWS database service](https://aws.amazon.com/getting-started/decision-guides/databases-on-aws-how-to-choose/) |

## Preços

- `src/content/pricing/database-prices.json` é gerado por `npm run prices:database` a partir da AWS Price List API (ofertas AmazonRDS, AmazonElastiCache, AmazonDynamoDB e AmazonRedshift) para us-east-1 e sa-east-1: RDS for PostgreSQL (Single-AZ e Multi-AZ, gp3 e io2, backup, RDS Proxy), Aurora PostgreSQL (Standard e I/O-Optimized, Serverless), DynamoDB (sob demanda, provisionado, armazenamento, PITR, backup), nós do ElastiCache (Valkey, Redis OSS, Memcached) e Redshift (RA3, armazenamento gerenciado, Serverless, Spectrum). Primeira faixa paga, sem nível gratuito; o script falha se faltar algum preço ou se houver ambiguidade.
- Mês de 730 horas.

## Premissas e simplificações da trilha

- **Premissas dos cenários:** cargas, tamanhos e tráfego das tabelas; tempos de promoção de réplica (10 min), restauração (30 min) e recuperação Single-AZ (15 min); latência de 0,5 ms no cache e 8 ms no banco; 75% da memória do nó de cache para dados; carga completa do DMS a 200 GB por hora e virada de 10 minutos.
- **Dimensionamento:** só PostgreSQL; a carga cabe se vCPU, memória, espaço, IOPS e throughput bastam; a referência é a mais barata, achada por busca.
- **Alta disponibilidade:** o cluster Multi-AZ é cobrado como três instâncias da mesma classe (a AWS usa classes próprias); o custo considera só instâncias e RDS Proxy.
- **DynamoDB:** cada valor de chave de partição numa única partição; provisionado sem auto scaling, cobrindo o pico.
- **Cache:** com TTL, cada item quente falta uma vez por período; sem TTL, cache já aquecido.
- **Escolha do banco:** a "complexidade relativa" que desempata as opções é julgamento de arquitetura.
- **Arquitetura de Dados:** rubrica e pesos pedagógicos.

# Trilha Monitoramento e governança na AWS — conferido em 21/10/2026

## Escopo do exame

| Fato | Fonte |
|---|---|
| Serviços no escopo do SAA-C03 em Management and Governance: Auto Scaling, CLI, CloudFormation, CloudTrail, CloudWatch, Compute Optimizer, Config, Control Tower, Health Dashboard, License Manager, Managed Grafana, Managed Service for Prometheus, Management Console, Organizations, Service Catalog, Systems Manager, Trusted Advisor e Well-Architected Tool; em Cost Management: Budgets, Cost and Usage Report, Cost Explorer e Savings Plans; em Developer Tools: X-Ray. | [Serviços no escopo](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) |

## CloudWatch: métricas e alarmes (Fase 1)

| Fato | Fonte |
|---|---|
| O CloudWatch junta métricas, painéis, alarmes e logs; muitos serviços enviam métricas básicas sem custo; a documentação atual distingue métricas OpenTelemetry (recomendadas) e métricas clássicas do CloudWatch. | [What is Amazon CloudWatch?](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html) |
| Namespace (sem padrão; `AWS/EC2`), dimensões (até 30; cada combinação é uma métrica), períodos (1, 5, 10, 30 ou múltiplo de 60 s; padrão 60 s), resolução padrão (1 min) e alta (1 s), retenção: menos de 60 s por 3 horas, 1 min por 15 dias, 5 min por 63 dias, 1 hora por 455 dias. | [CloudWatch concepts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html) |
| EC2: pontos de 5 minutos por padrão (básico, sem custo) e de 1 minuto com monitoramento detalhado (cobrado por métrica); verificações de status a cada minuto sem custo; a lista de métricas do `AWS/EC2` não inclui memória nem uso de disco do sistema operacional. | [Monitor your instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-cloudwatch.html), [Detailed monitoring](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/manage-detailed-monitoring.html), [Instance metrics](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html) |
| Agente do CloudWatch: métricas de dentro do sistema operacional (`mem_used_percent`, `disk_used_percent`), logs, StatsD e collectd; namespace padrão `CWAgent`; EC2 e servidores locais. | [CloudWatch agent](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html), [Metrics collected](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/metrics-collected-by-CloudWatch-agent.html) |
| Estados OK, ALARM e INSUFFICIENT_DATA; estados de avaliação; período, períodos de avaliação (N) e pontos para disparar (M); intervalo de avaliação = N × período (exemplos: 4 de 5 com 1 min = 5 min; 3 de 3 com 10 min = 30 min); avaliação a cada minuto; alarmes de vários dias avaliados a cada hora. | [Alarm evaluation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-evaluation.html) |
| Dados ausentes: notBreaching, breaching, ignore e missing (padrão); intervalo de avaliação de 5 pontos para N = 3; as duas tabelas de exemplos (3 de 3 e 2 de 3) e o alarme prematuro; `AWS/DynamoDB` ignora ausentes por padrão; recomendação de missing em alarmes que agem sobre o EC2. Os testes do simulador reproduzem as dez linhas das tabelas. | [Missing data](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarms-and-missing-data.html) |
| Ações: SNS, Lambda, EC2 (parar, encerrar, reiniciar, recuperar), Auto Scaling, Systems Manager (OpsItem e incidente, só em ALARM), investigação; ações só na transição de estado (exceto Auto Scaling); eventos no EventBridge. | [Alarm actions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-actions.html) |
| Alarme composto: regras com AND, OR e NOT; ações SNS, Lambda e Systems Manager; até 100 alarmes monitorados e 150 compostos por alarme; mesma conta e Região. | [Composite alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/alarm-combining.html) |
| Painéis: vários recursos e Regiões numa tela, painéis automáticos, roteiro operacional, painéis entre contas. | [Dashboards](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html) |

## Logs e rastreamento (Fase 2)

| Fato | Fonte |
|---|---|
| Evento, fluxo, grupo; retenção e filtros por grupo; padrão de guardar para sempre; valores de retenção aceitos (1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653); exclusão em até 72 horas depois do prazo. | [Logs concepts](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatchLogsConcepts.html), [Log groups](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Working-with-log-groups-and-streams.html), [PutRetentionPolicy](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutRetentionPolicy.html) |
| Classes Standard e Infrequent Access: só a ingestão tem preço diferente; Infrequent Access sem filtros de métrica e de assinatura, Live Tail, GetLogEvents e FilterLogEvents; a classe não muda depois da criação. Na Price List há outros itens de armazenamento (`TimedStorage-IA` e `TimedStorage-AIA`) cujo significado não foi confirmado; o simulador usa o preço de armazenamento da versão atual para as duas classes, como diz a documentação. | [Log classes](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatch_Logs_Log_Classes.html) |
| Filtro de métrica: só Standard, não retroativo, dimensões e unidade. Padrões: diferenciam maiúsculas de minúsculas, termos (todos), `?` opcional, frases entre aspas; JSON com `$.`, `=`, `!=`, `>`, `<`, `>=`, `<=`, `&&`, `||` e parênteses (ordem: parênteses, `&&`, `||`). Os testes reproduzem os exemplos da página. | [Metric filters](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/MonitoringLogData.html), [Filter pattern syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html) |
| Filtro de assinatura: Kinesis Data Streams, Firehose e Lambda (e OpenSearch), em geral em menos de 3 minutos, até 5 por grupo, um por conta e Região no nível da conta, só Standard, novas tentativas por até 24 horas. | [Subscriptions](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/Subscriptions.html) |
| Logs Insights: linguagem própria, OpenSearch PPL e SQL; descoberta de campos (Route 53, Lambda, CloudTrail, VPC, JSON); 100 consultas simultâneas; preço por GB lido. | [Logs Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AnalyzingLogData.html) |
| Lambda envia logs sozinha para `/aws/lambda/<função>` se a role tiver `logs:CreateLogGroup`, `logs:CreateLogStream` e `logs:PutLogEvents` (AWSLambdaBasicExecutionRole); 5 a 10 minutos de atraso; a documentação atual chama as funções clássicas de "Event Functions". | [Lambda e CloudWatch Logs](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html) |
| X-Ray: segmentos, subsegmentos, rastros, mapa de serviços, erros (400), falhas (500) e limitação (429); amostragem padrão (primeira requisição de cada segundo e 5% das demais); cabeçalho `X-Amzn-Trace-Id`; anotações indexadas (até 50 por rastro) e metadados não indexados; daemon por UDP (já nas plataformas do Elastic Beanstalk e da Lambda). Application Signals coleta métricas e rastros automaticamente. | [X-Ray concepts](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html), [What is X-Ray](https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html), [Application Signals](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Monitoring-Sections.html) |
| Prometheus gerenciado: sem servidor, compatível com Prometheus e PromQL, replicado em três AZs, EKS e Kubernetes autogerenciado. Grafana gerenciado: workspaces, integra CloudWatch, OpenSearch, X-Ray e Prometheus gerenciado. | [Managed Prometheus](https://docs.aws.amazon.com/prometheus/latest/userguide/what-is-Amazon-Managed-Service-Prometheus.html), [Managed Grafana](https://docs.aws.amazon.com/grafana/latest/userguide/what-is-Amazon-Managed-Service-Grafana.html) |

## CloudTrail (Fase 3)

| Fato | Fonte |
|---|---|
| O CloudTrail registra ações no console, na CLI, nos SDKs e nas APIs; campos de um registro: `eventTime`, `userIdentity`, `eventSource`, `eventName`, `awsRegion`, `sourceIPAddress`, `userAgent`, `errorCode`, `requestParameters`. Formas de registrar: histórico de eventos, trilhas e CloudTrail Lake. | [What Is CloudTrail?](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html), [Record contents](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html) |
| Histórico de eventos: 90 dias de eventos de gerenciamento, por Região, sem custo, imutável, ligado em toda conta, independente das trilhas, só eventos de gerenciamento no console. | [Event history](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/view-cloudtrail-events.html) |
| Eventos de gerenciamento (padrão; exemplos `AttachRolePolicy`, `CreateSubnet`, `ConsoleLogin`; leitura, gravação ou os dois) e de dados (desligados por padrão, com custo; `GetObject`, `DeleteObject`, `Invoke`, `Publish`; seletores avançados); eventos de atividade de rede (endpoints de VPC). | [Management events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-management-events-with-cloudtrail.html), [Data events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-data-events-with-cloudtrail.html), [Network activity events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-network-events-with-cloudtrail.html) |
| Trilhas: S3 e, opcionalmente, CloudWatch Logs e EventBridge; uma cópia dos eventos de gerenciamento sem custo da CloudTrail; trilhas do console são de várias Regiões e as de uma Região só pela CLI; bucket de qualquer Região; cópia da trilha em Regiões opcionais habilitadas depois. Trilha para o CloudWatch Logs envia só os eventos que a trilha registra. | [Trails](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-trails.html), [Multiple Regions](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/receive-cloudtrail-log-files-from-multiple-regions.html), [CloudWatch Logs](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/send-cloudtrail-events-to-cloudwatch-logs.html) |
| Trilha da organização: criada pela conta de gerenciamento ou por administrador delegado; vale para todas as contas membro; membros veem mas não alteram; sem acesso aos arquivos por padrão. | [Organization trail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/creating-trail-organization.html) |
| Validação de integridade: SHA-256 e SHA-256 com RSA; resumo assinado a cada hora, em pasta separada do mesmo bucket; cadeia de assinaturas; chaves por Região. Entrega média de cerca de 5 minutos, sem garantia. | [Integrity validation](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-log-file-validation-intro.html), [Log files](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-working-with-log-files.html) |
| Insights: linha de base de taxa de chamadas e de erros, para eventos de gerenciamento e de dados; eventos do Insights cobrados à parte; entrega em até 30 minutos da atividade incomum. CloudTrail Lake: data lake gerenciado, consultas em SQL, retenção de até 3.653 dias (um ano extensível) ou 2.557 dias (sete anos), consulta cobrada por dados lidos. | [Insights](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-insights-events-with-cloudtrail.html), [Lake](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html) |

## AWS Config (Fase 4)

| Fato | Fonte |
|---|---|
| O Config mostra a configuração dos recursos, as relações e o histórico; precisa de bucket do S3, tópico do SNS e role do IAM; você escolhe os tipos de recurso gravados. | [What Is AWS Config?](https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html) |
| Gravador (gerenciado pelo cliente ou vinculado a serviço), item de configuração, histórico, snapshot, fluxo de configuração (SNS), relações entre recursos; gravação contínua e diária; recurso não gravado só tem criação e exclusão; Firewall Manager depende da gravação contínua. | [Concepts](https://docs.aws.amazon.com/config/latest/developerguide/config-concepts.html), [Recording](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html) |
| Regras gerenciadas e personalizadas (Lambda e Guard); resultados COMPLIANT, NON_COMPLIANT, ERROR e NOT_APPLICABLE; gatilhos (mudança de configuração, periódico, híbrido) e modos (detectivo e proativo; o proativo não corrige nem impede a criação). | [Concepts](https://docs.aws.amazon.com/config/latest/developerguide/config-concepts.html), [Managed rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_use-managed-rules.html), [Custom rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html) |
| Regras usadas nos simuladores e seus gatilhos: `s3-bucket-public-read-prohibited` (mudança e periódico), `s3-bucket-server-side-encryption-enabled` (mudança), `encrypted-volumes` (mudança; volumes ligados), `restricted-ssh` (mudança e periódico; 0.0.0.0/0 e ::/0), `rds-instance-public-access-check` (mudança), `ec2-instance-managed-by-systems-manager` (mudança), `required-tags` (mudança), `root-account-mfa-enabled` (periódico). | [restricted-ssh](https://docs.aws.amazon.com/config/latest/developerguide/restricted-ssh.html), [encrypted-volumes](https://docs.aws.amazon.com/config/latest/developerguide/encrypted-volumes.html), [required-tags](https://docs.aws.amazon.com/config/latest/developerguide/required-tags.html) e as demais páginas de regra |
| Remediação com documentos de automação do Systems Manager (gerenciados ou próprios), manual ou automática; só regras que não são vinculadas a serviço; AWS-DisablePublicAccessForSecurityGroup desabilita SSH e RDP abertos para todos. | [Remediation](https://docs.aws.amazon.com/config/latest/developerguide/remediation.html), [Auto remediation](https://docs.aws.amazon.com/config/latest/developerguide/setup-autoremediation.html), [AWS-DisablePublicAccessForSecurityGroup](https://docs.aws.amazon.com/systems-manager-automation-runbooks/latest/userguide/automation-aws-disablepublicaccessforsecuritygroup.html) |
| Pacotes de conformidade (YAML, regras e remediações, conta e Região ou organização, verificações de processo); agregador (várias contas e Regiões, somente leitura, sem custo adicional, sem autorização com o Organizations). | [Conformance packs](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html), [Aggregation](https://docs.aws.amazon.com/config/latest/developerguide/aggregate-data.html) |

## Systems Manager (Fase 5)

| Fato | Fonte |
|---|---|
| O Systems Manager gerencia nós na AWS, em ambientes locais e em outras nuvens; o nó precisa ter o SSM Agent e falar com o serviço; as ferramentas (Session Manager, Run Command, Patch Manager, Parameter Store, Automation e outras) e o console unificado, lançado em 21/11/2024. | [What is Systems Manager?](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html) |
| Permissões: por padrão o Systems Manager não age nas instâncias; role com AmazonSSMManagedInstanceCore ou Default Host Management Configuration (IMDSv2 e SSM Agent 3.2.582.0 ou mais novo; sem IMDSv1). O agente usa o ssmmessages (e o ec2messages em Regiões lançadas antes de 2024); endpoints de interface ssm, ssmmessages e ec2messages para instâncias sem internet. | [Instance permissions](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-instance-permissions.html), [SSM Agent](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html), [VPC endpoints](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html) |
| Session Manager: sem portas de entrada, bastion e chaves SSH; controle por IAM; EC2 e nós híbridos; encaminhamento de portas; registro por CloudTrail, S3, CloudWatch Logs e EventBridge. | [Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html), [Logging session activity](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-auditing.html) |
| Run Command (comandos remotos em escala; sem custo adicional em nós EC2). Patch Manager (patch baseline, varredura e varredura com instalação, relatório de conformidade, conformidade não significa segurança, agenda cron ou rate). State Manager (associações; escolha entre State Manager e Maintenance Windows). Inventory (metadados dos nós; S3 e Athena). Maintenance Windows (quando executar ações disruptivas). | [Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html), [Patch Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html), [State Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state.html), [Inventory](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-inventory.html), [Maintenance Windows](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-maintenance.html) |
| Parameter Store: String, StringList e SecureString (KMS); camada padrão (10.000 parâmetros, 4 KB, sem custo) e avançada (100.000, 8 KB, política de parâmetro, compartilhamento entre contas, paga; padrão pode virar avançado, não o contrário); para segredos a AWS recomenda o Secrets Manager. Automation: runbooks, aprovações, EventBridge, agendamento. | [Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html), [Parameter tiers](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html), [Automation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html) |

## Infraestrutura como código (Fase 6)

| Fato | Fonte |
|---|---|
| CloudFormation: template e stack; apagar a stack apaga os recursos; seções do template (Resources obrigatória; Parameters, Outputs, Mappings, Conditions, Metadata, Rules e Transform opcionais). | [What is CloudFormation?](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html), [Template sections](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-anatomy.html) |
| Change sets: mostram o efeito sobre propriedades e atributos antes de executar; a stack só muda na execução. Comportamentos de atualização (sem interrupção, com alguma interrupção, substituição; o recurso novo é criado antes e o antigo apagado por padrão). | [Change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html), [Update behaviors](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-update-behaviors.html) |
| Comportamento por propriedade, lido na referência de cada tipo (consulta de "Update requires" em 21/10/2026): EC2::Instance (InstanceType e UserData: alguma interrupção; ImageId, AvailabilityZone, SubnetId e KeyName: substituição; Tags e IamInstanceProfile: sem interrupção); RDS::DBInstance (DBInstanceClass: alguma interrupção; AllocatedStorage e PubliclyAccessible: sem interrupção; DBInstanceIdentifier, MasterUsername e StorageEncrypted: substituição); S3::Bucket (BucketName: substituição; Tags, BucketEncryption e PublicAccessBlockConfiguration: sem interrupção); DynamoDB::Table (TableName: substituição; BillingMode, TimeToLiveSpecification e Tags: sem interrupção); Lambda::Function (FunctionName: substituição; Runtime, MemorySize e Timeout: sem interrupção); EC2::SecurityGroup (GroupDescription, GroupName e VpcId: substituição; Tags: sem interrupção). A propriedade Port do RDS fica de fora: o guia a cita como substituição e a referência a indica como alguma interrupção. | [aws-resource-ec2-instance](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-instance.html), [rds-dbinstance](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-rds-dbinstance.html), [s3-bucket](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-s3-bucket.html), [dynamodb-table](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-dynamodb-table.html), [lambda-function](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-lambda-function.html), [ec2-securitygroup](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-securitygroup.html) |
| DeletionPolicy (Delete é o padrão; Retain, RetainExceptOnCreate e Snapshot; vale para recurso removido do modelo; não vale para recurso substituído; padrão Snapshot para RDS::DBCluster e RDS::DBInstance sem DBClusterIdentifier; tipos com snapshot: DocDB::DBCluster, EC2::Volume, ElastiCache::CacheCluster e ReplicationGroup, Neptune::DBCluster, RDS::DBCluster, RDS::DBInstance, Redshift::Cluster). UpdateReplacePolicy (Delete, Retain ou Snapshot para o recurso antigo substituído). | [DeletionPolicy](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-deletionpolicy.html), [UpdateReplacePolicy](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatereplacepolicy.html) |
| StackSets: várias contas e Regiões numa operação; conta administradora e contas de destino; permissões autogerenciadas e gerenciadas pelo serviço (roles criadas pelo StackSets, implantação automática em contas novas da organização); instância de stack; StackSet é um recurso regional. Desvio (drift) e opções de falha (preservar os recursos criados com sucesso). | [StackSets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html), [Concepts](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stacksets-concepts.html), [Drift](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html), [Failure options](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/stack-failure-options.html) |
| Service Catalog: catálogo de produtos aprovados, portfólios, restrições (lançamento, notificação, atualização de tags, StackSet e template); a restrição de lançamento indica a role que o Service Catalog assume e vale para o produto no portfólio. Console, CLI e SDKs. | [What is Service Catalog?](https://docs.aws.amazon.com/servicecatalog/latest/adminguide/introduction.html), [Constraints](https://docs.aws.amazon.com/servicecatalog/latest/adminguide/constraints.html), [Launch constraints](https://docs.aws.amazon.com/servicecatalog/latest/adminguide/constraints-launch.html) |

## Governança multiconta (Fase 7)

| Fato | Fonte |
|---|---|
| Control Tower: orquestra o Organizations, o Service Catalog e o IAM Identity Center para montar uma landing zone; controles (também chamados de guardrails), Account Factory, painel. A landing zone tem a raiz, uma OU de integração de serviços (Security, por padrão), uma OU Sandbox opcional, o diretório do IAM Identity Center e as contas das integrações com Config, CloudTrail e Backup; até a versão 3.3 a OU Security tem as contas compartilhadas Log Archive e Audit, e a partir da versão 4.0 a OU Security não é mais exigida; o Control Tower usa StackSets; apagar ou alterar à mão recursos gerenciados leva a um estado desconhecido; a conta Audit permite assumir uma role para revisar outras contas, sem entrar nelas. | [What Is AWS Control Tower?](https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html), [How AWS Control Tower works](https://docs.aws.amazon.com/controltower/latest/userguide/how-control-tower-works.html) |
| Controles: aplicados a toda a OU; preventivos (SCPs, RCPs e políticas declarativas; status aplicado ou não habilitado; todas as Regiões), detectivos (regras do Config; limpo, em violação ou não habilitado; só Regiões suportadas) e proativos (hooks do CloudFormation; PASS, FAIL ou SKIP); orientação obrigatória, fortemente recomendada e eletiva (obrigatórios não são mais aplicados por padrão a partir da versão 4.0); exceção intencional para a conta de gerenciamento (os controles preventivos não valem para ela; tudo continua registrado). | [Controls](https://docs.aws.amazon.com/controltower/latest/userguide/controls.html), [Control behavior and guidance](https://docs.aws.amazon.com/controltower/latest/controlreference/control-behavior.html) |
| Account Factory: modelo de conta configurável sobre produtos do Service Catalog; o pedido pode vir do Account Factory, do console do Service Catalog ou da API ProvisionProduct; o Control Tower chama o CreateAccount do Organizations e depois aplica baselines e controles; grupo AWSAccountFactory do IAM Identity Center; role AWSControlTowerExecution para matricular contas existentes; OU com AWSControlTowerBaseline; o desvio (drift) é tarefa regular dos administradores da conta de gerenciamento. | [Account Factory](https://docs.aws.amazon.com/controltower/latest/userguide/account-factory.html), [Accounts](https://docs.aws.amazon.com/controltower/latest/userguide/accounts.html), [Drift](https://docs.aws.amazon.com/controltower/latest/userguide/drift.html) |
| Políticas do Organizations: SCPs e RCPs (autorização); declarativas (EC2, mantidas quando o serviço ganha recursos novos; ex.: bloquear acesso público à internet a recursos da VPC); backup (planos do AWS Backup por tags); tags (chaves e valores com caixa tratada; imposição só em tipos indicados; recursos sem tag e tags não definidas não são avaliados); chat, recusa de IA, Security Hub, Inspector, Bedrock e upgrade rollout; exigem all features. Administrador delegado: a conta de gerenciamento deve ser usada só para o necessário, e as SCPs não a restringem. | [Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies.html), [Tag policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_tag-policies.html), [Backup policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_backup.html), [Declarative policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_declarative.html), [Delegated administrator](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_delegate_policies.html) |
| License Manager: licenças por vCPU, núcleo físico, soquete ou número de máquinas; regras de consumo com limites rígidos ou flexíveis; BYOL; painéis; integração com Organizations, IAM, Service Quotas, CloudFormation e Marketplace. | [What is License Manager?](https://docs.aws.amazon.com/license-manager/latest/userguide/license-manager.html) |

## Custos (Fase 8)

| Fato | Fonte |
|---|---|
| Faturamento consolidado: conta de gerenciamento paga tudo; uma fatura por tipo de vendedor; uso combinado compartilha descontos por volume, RIs e Savings Plans; sem custo adicional; faturas de membros informativas. Compartilhamento de RIs e Savings Plans: toda a organização, grupo priorizado, grupo restrito e controle por conta; o compromisso beneficia primeiro a dona. | [Consolidated billing](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html), [Discount sharing](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/ri-turn-off.html) |
| Tags de alocação de custo: de usuário e geradas pela AWS, ativadas separadamente; só a conta de gerenciamento ativa; chaves diferenciam maiúsculas de minúsculas; até 24 horas para aparecer e mais 24 para ativar; createdBy só em recursos criados depois da ativação; o relatório inclui recursos com e sem tag. | [Cost allocation tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html), [Activating tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/activating-tags.html), [AWS-generated tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/aws-tags.html) |
| Cost Explorer: 13 meses de histórico e previsão de 18 meses; interface gratuita e API a US$ 0,01 por requisição paginada; não pode ser desabilitado; recomendações de RIs. Budgets: tipos (custo, uso, RI e Savings Plans), alertas sobre valor real e previsto, atualização até três vezes por dia, ações (política do IAM, SCP, instâncias EC2 e RDS; automática ou com aprovação). Cost Anomaly Detection: aprendizado de máquina, três execuções por dia, atraso de até 24 horas, 10 dias de histórico para serviço novo, causas por serviço, conta, Região e tipo de uso. | [Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html), [Budgets](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html), [Budget actions](https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html), [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html) |
| CUR (CSV no S3, atualizado ao menos uma vez ao dia) e Data Exports (CUR 2.0 recomendado; cinco tipos de exportação, entre eles as recomendações do Cost Optimization Hub; CUR antigo como exportação legada). | [Cost and Usage Reports](https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html), [Data Exports](https://docs.aws.amazon.com/cur/latest/userguide/what-is-data-exports.html) |

## Recomendações e escolha (Fase 9)

| Fato | Fonte |
|---|---|
| Trusted Advisor: examina o ambiente e recomenda ações para economizar, melhorar disponibilidade e desempenho e fechar brechas de segurança. As verificações completas, a API e o monitoramento pelo EventBridge exigem Business Support+, Enterprise Support ou Unified Operations. No Basic (e no Developer), o console mostra todas as verificações de limites de serviço e seis de segurança e tolerância a falhas (snapshots públicos do EBS e do RDS, permissões de bucket do S3, MFA na conta raiz, portas específicas de security groups e uso do endpoint global do STS); sem atualização automática, e as de segurança são atualizadas à mão. Categorias: otimização de custo, desempenho, segurança, tolerância a falhas, limites de serviço e excelência operacional. | [Trusted Advisor](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html), [verificações](https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor-check-reference.html) |
| Visão da organização do Trusted Advisor: relatórios agregados das contas membro; exige o Organizations com todos os recursos e plano pago na conta de gerenciamento. | [Organizational view](https://docs.aws.amazon.com/awssupport/latest/user/organizational-view.html) |
| AWS Health: eventos públicos (não específicos de uma conta) e eventos da conta (com recursos afetados). A página Service health não pede login e traz o histórico de 12 meses; o Your account health mostra os dois tipos. O painel é gratuito, e os eventos chegam ao EventBridge sem custo; a API exige plano pago. Eventos públicos não chegam pelas notificações gerenciadas do User Notifications. Visão da organização: todos os recursos do Organizations, eventos por até 90 dias, administrador delegado recomendado. | [What is AWS Health](https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html), [conceitos](https://docs.aws.amazon.com/health/latest/ug/aws-health-concepts-and-terms.html), [Service health](https://docs.aws.amazon.com/health/latest/ug/aws-health-dashboard-status.html), [organização](https://docs.aws.amazon.com/health/latest/ug/aggregate-events.html) |
| Service Quotas: cotas por conta ou por Região; coluna de ajustável; aumentos pequenos costumam ser automáticos, os maiores passam pelo Suporte; sem atendimento prioritário; valor aplicado; utilização; alarmes do CloudWatch nas cotas que oferecem o recurso; modelo de pedidos só para contas novas, até 10 cotas, exige todos os recursos do Organizations e Regiões comerciais sem ativação manual; mudar o modelo não altera contas existentes. | [Service Quotas](https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html), [aumento](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html), [alarmes](https://docs.aws.amazon.com/servicequotas/latest/userguide/configure-cloudwatch.html), [modelos](https://docs.aws.amazon.com/servicequotas/latest/userguide/organization-templates.html) |

**Cuidados.** A página do Trusted Advisor traz avisos de descontinuação dos planos Developer, Business e Enterprise On-Ramp em 1/1/2027, com o Business Support+ como substituto; a trilha usa os nomes vigentes. A necessidade de pedir o mesmo aumento de cota na Região de espera é consequência de a cota valer por Região, e a escolha de manter o ambiente de espera preparado é recomendação de arquitetura.

## Central de Operações (desafio final)

- O desafio final reaproveita os fatos das Fases 1 a 9. As escolhas "mais simples que atende" (por exemplo, o histórico de eventos do CloudTrail antes de uma trilha, a camada padrão do Parameter Store antes da avançada) são julgamento de arquitetura do AWS Quest, e não fatos da AWS.
- Rubrica por dimensão (Seguro, Resiliente, Alto desempenho, Custo otimizado e Requisitos) e pesos são pedagógicos.

## Preços

- `src/content/pricing/governance-prices.json` é gerado por `npm run prices:governance` a partir da AWS Price List Bulk API (ofertas AmazonCloudWatch, AWSCloudTrail e AWSConfig, publicadas em 7/10/2026, 11/9/2026 e 11/9/2026), para us-east-1 e sa-east-1, consultada em 21/10/2026: métricas personalizadas, alarmes (padrão, alta resolução e composto), ingestão de logs (Standard e Infrequent Access), armazenamento, consultas do Logs Insights, eventos de gerenciamento adicionais, de dados e do Insights do CloudTrail, e itens de configuração e avaliações do Config. Primeira faixa paga, sem nível gratuito; o script falha se faltar algum preço. Os painéis personalizados do CloudWatch não constam da Price List em massa e ficam de fora. Os preços do Budgets e do Cost Explorer não são simulados.
- Mês de 730 horas.

## Premissas e simplificações da trilha

- **Premissas dos cenários:** séries de métricas, volumes de log e de eventos, e gastos por dia dos recursos; um grupo de logs sem retenção equivale a 1.825 dias no cálculo de custo; a previsão do Budgets é uma projeção linear do gasto até o dia.
- **Alarmes:** avaliação sobre N períodos mais dois; os casos que a documentação não especifica mantêm o estado anterior; as tabelas de dados ausentes da documentação (3 de 3 e 2 de 3) são reproduzidas nos testes.
- **Logs e trilhas:** padrões de filtro de texto e JSON com as regras documentadas; localização do evento (histórico, trilha, eventos de dados) segundo o tipo de evento e a Região.
- **Config:** oito regras gerenciadas, com a avaliação descrita na documentação de cada uma; remediação manual ou automática por documento de automação.
- **CloudFormation:** tabela de propriedades conferidas na referência de cada tipo; a propriedade Port do RDS ficou de fora porque o guia e a referência divergem.
- **Orçamentos:** gasto constante por recurso, com uma mudança de patamar; só custo bruto, sem descontos, créditos, impostos e ações de orçamento.
- **Escolha do serviço:** a "complexidade relativa" que desempata as opções é julgamento de arquitetura.
- **Central de Operações:** rubrica e pesos pedagógicos.

# Trilha Redes na AWS — conferido em 21/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as 76 URLs usadas nos conceitos e no catálogo foram conferidas pelo título da página em 21/10/2026.

## Escopo do exame

| Fato | Fonte |
|---|---|
| Serviços no escopo do SAA-C03 em Networking and Content Delivery: Client VPN, CloudFront, Direct Connect, Elastic Load Balancing, Global Accelerator, PrivateLink, Route 53, Site-to-Site VPN, Transit Gateway e Amazon VPC; em Security, Identity, and Compliance, ligados a rede: Certificate Manager, Firewall Manager, Network Firewall, Shield e WAF. | [Serviços no escopo](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) |

## VPC e endereçamento (Fase 1)

| Fato | Fonte |
|---|---|
| Bloco IPv4 da VPC entre /16 (65.536 endereços) e /28 (16); recomendação das faixas da RFC 1918; proibidos 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16 e 224.0.0.0/4; evitar 172.17.0.0/16; blocos secundários de /16 a /28 sem sobreposição; o tamanho de um bloco existente não muda; o bloco primário não pode ser removido; forma canônica pela API (100.68.0.18/18 vira 100.68.0.0/18). IPv6: até cinco blocos de /44 a /60 em passos de /4. | [VPC CIDR blocks](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html) |
| Sub-rede de /16 a /28, dentro do bloco da VPC, sem sobreposição; os quatro primeiros endereços e o último são reservados (exemplo 10.0.0.0/24: rede, roteador, DNS, uso futuro, broadcast); sub-redes IPv6 de /44 a /64. | [Subnet CIDR blocks](https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html) |
| Cada sub-rede fica inteira numa zona; tipos pública, privada, só VPN e isolada definidos pelas rotas; associação automática à tabela principal e à ACL padrão. | [Subnets](https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html) |
| VPC padrão: 172.31.0.0/16, sub-rede /20 por zona, internet gateway, rota 0.0.0.0/0 na tabela principal, security group e ACL padrão, DHCP padrão; IPv4 público automático nas sub-redes padrão; nem a padrão nem a criada por você têm rota ::/0 ou IPv6 automático. | [Default VPC components](https://docs.aws.amazon.com/vpc/latest/userguide/default-vpc-components.html), [internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html) |
| A AWS cobra todos os IPv4 públicos, inclusive Elastic IPs; IPv6 fornecido pela AWS é anunciado na internet. | [IP addressing](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-ip-addressing.html) |

## Roteamento e saída (Fase 2)

| Fato | Fonte |
|---|---|
| Prefixo mais específico; no mesmo destino, estática antes de lista de prefixos antes de propagada; exemplo do peering 172.31.0.0/16 contra 0.0.0.0/0. | [Route priority](https://docs.aws.amazon.com/vpc/latest/userguide/route-tables-priority.html) |
| Internet gateway: redundante, sem limite de banda, sem custo; IP público e rota necessários; sub-rede pública é a que tem rota para ele. | [Internet gateway](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html) |
| NAT Gateway público em sub-rede pública com Elastic IP; privado sem Elastic IP; conexões só iniciadas de dentro; TCP, UDP e ICMP; 5 Gbps escalando a 100 Gbps; sem security group; não aceita tráfego vindo por peering nem por VPN ou Direct Connect num virtual private gateway; um por zona recomendado. | [NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html), [basics](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html) |
| NAT Gateway regional: expande-se sozinho, em até 60 minutos para uma zona nova; não precisa de sub-rede pública; não faz NAT privado. | [Regional NAT gateways](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html) |
| NAT instance: verificação de origem e destino desligada, banda do tipo da instância, failover por script; aceita security group, encaminhamento de portas e uso como bastion; a AWS recomenda o NAT Gateway. | [Compare](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-comparison.html), [NAT instances](https://docs.aws.amazon.com/vpc/latest/userguide/work-with-nat-instances.html) |
| Egress-only internet gateway: só IPv6, com estado, sem custo, sem security group. | [Egress-only](https://docs.aws.amazon.com/vpc/latest/userguide/egress-only-internet-gateway.html) |

## Segurança na VPC (Fase 3)

| Fato | Fonte |
|---|---|
| Security group: só permissões, avalia todas as regras, com estado, referência a outros grupos, sem custo; recomendação de não abrir 22 e 3389 para 0.0.0.0/0. Network ACL: nível de sub-rede, permite e nega, ordem crescente (1 a 32766), sem estado, sem custo; não filtra DNS da AWS, DHCP, metadados e Time Sync. | [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), [comparação](https://docs.aws.amazon.com/vpc/latest/userguide/infrastructure-security.html), [ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html) |
| ACL padrão: regras 100 e 101 permitem tudo; ACL personalizada nova nega tudo; exemplo da porta 443 casando a regra 110 e da 139 caindo na regra marcada com asterisco; portas efêmeras (Linux 32768-61000, Windows Server 2008+ 49152-65535, NAT Gateway, ELB e Lambda 1024-65535). | [Default ACL](https://docs.aws.amazon.com/vpc/latest/userguide/default-network-acl.html), [custom ACL](https://docs.aws.amazon.com/vpc/latest/userguide/custom-network-acl.html) |
| Flow Logs: metadados do tráfego, destinos CloudWatch Logs, S3 e Data Firehose, fora do caminho do tráfego. Reachability Analyzer: análise da configuração, aponta o componente que bloqueia, cobrado por análise. | [Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html), [Reachability Analyzer](https://docs.aws.amazon.com/vpc/latest/reachability/what-is-reachability-analyzer.html) |

## Conectando VPCs (Fase 4)

| Fato | Fonte |
|---|---|
| Peering: um para um, entre contas e Regiões, rotas nos dois lados, sem blocos sobrepostos (nem parcialmente), sem transitividade, sem borda a borda (internet gateway, NAT, VPN, Direct Connect e endpoint de gateway), pedido expira em 7 dias, MTU 9.001 na Região e 8.500 entre Regiões. | [Peering basics](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html) |
| Transit Gateway: roteador regional; anexos de VPC (uma sub-rede por zona), VPN, Direct Connect gateway, Connect e peering; tabelas com associação e propagação; tabelas separadas isolam grupos; estática vence propagada; ECMP para VPN; compartilhamento pelo RAM; anexo de Network Firewall. | [How Transit Gateway works](https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html) |

## Acesso privado (Fase 5)

| Fato | Fonte |
|---|---|
| Endpoint de gateway: só S3 e DynamoDB, sem custo, rota com lista de prefixos (vence 0.0.0.0/0), só na Região, não atende rede da empresa, peering entre Regiões nem Transit Gateway, não usa PrivateLink. | [Gateway endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html), [S3](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html) |
| Endpoint de interface: cobrança por hora em cada zona e por GB; interface por zona; DNS privado; recomendação de duas zonas; o serviço não inicia conexões. | [Access AWS services](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-aws-services.html) |
| Política de endpoint: padrão com acesso total, não substitui políticas de identidade e de recurso; Principal "*" no endpoint de gateway. Serviço de endpoint: Network Load Balancer do provedor, endpoint de interface do consumidor, duas zonas recomendadas. | [Endpoint policies](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-access.html), [Share your services](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html) |

## Conectividade híbrida (Fase 6)

| Fato | Fonte |
|---|---|
| Site-to-Site VPN: IPsec, dois túneis, virtual private gateway (uma VPC) ou Transit Gateway; estática ou BGP; VPN acelerada pelo Global Accelerator. | [Site-to-Site VPN](https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html) |
| Túnel padrão até 1,25 Gbps e 140 mil pacotes por segundo; túnel de grande largura de banda até 5 Gbps; ECMP no Transit Gateway só com roteamento dinâmico. | [VPN quotas](https://docs.aws.amazon.com/vpn/latest/s2svpn/vpn-limits.html) |
| Direct Connect: dedicado de 1, 10, 100 ou 400 Gbps; hospedado de 50 Mbps a 25 Gbps por parceiro; revisão em até 72 horas úteis; cobrança após ativação ou 90 dias da LOA-CFA; VIFs privada, pública e de trânsito; Direct Connect gateway global (sem a China). | [Welcome](https://docs.aws.amazon.com/directconnect/latest/UserGuide/Welcome.html), [dedicada](https://docs.aws.amazon.com/directconnect/latest/UserGuide/dedicated_connection.html), [hospedada](https://docs.aws.amazon.com/directconnect/latest/UserGuide/hosted_connection.html), [gateway](https://docs.aws.amazon.com/directconnect/latest/UserGuide/direct-connect-gateways-intro.html) |
| MACsec em dedicadas de 10, 100 e 400 Gbps, não em hospedadas, sem custo extra; modelos de resiliência máxima (99,99%), alta (99,9%) e desenvolvimento e teste. Client VPN: OpenVPN, Active Directory, SAML ou certificado, cobrança por associação e por conexão. | [MACsec](https://docs.aws.amazon.com/directconnect/latest/UserGuide/MACsec.html), [Resiliency Toolkit](https://docs.aws.amazon.com/directconnect/latest/UserGuide/resilency_toolkit.html), [Client VPN](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html) |

## DNS com Route 53 (Fase 7)

| Fato | Fonte |
|---|---|
| Zonas públicas e privadas; alias no ápice, sem cobrança de consultas a recursos da AWS, TTL do recurso; CNAME não pode ficar no ápice e, para outro registro do Route 53, conta como duas consultas. | [Hosted zones](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/hosted-zones-working-with.html), [alias](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html) |
| Oito políticas de roteamento; ponderada (peso ÷ soma, exemplo 1 e 255, tabela do peso zero); geolocalização (região menor vence, sem padrão não há resposta); múltiplas respostas (até oito saudáveis); failover ativo-passivo. | [Routing policies](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html), [weighted](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-weighted.html), [geo](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html), [multivalue](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-multivalue.html), [failover](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html) |
| Verificações de endpoint, calculadas e por alarme do CloudWatch (sem "M de N" nem alta resolução); Resolver na VPC+2, endpoints de entrada e de saída, regras de encaminhamento. | [Health checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-types.html), [Resolver](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html) |

## Entrega de conteúdo (Fase 8)

| Fato | Fonte |
|---|---|
| OAC recomendado no lugar da OAI (SSE-KMS, PUT e DELETE, todas as Regiões); bucket de site estático não aceita OAC; certificado do ACM em us-east-1 para o CloudFront; URLs e cookies assinados; restrição geográfica por país com 403; nomes versionados recomendados no lugar de invalidações frequentes. | [OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html), [certificados](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html), [assinados](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-choosing-signed-urls-cookies.html), [geo](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/georestrictions.html), [invalidação](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Invalidation.html) |
| CloudFront Functions (JavaScript, eventos do usuário, menos de 1 ms, 2 MB, 10 KB) × Lambda@Edge (Node.js e Python, até 30 s, rede, arquivos e corpo, 10.000 requisições por segundo por Região). Global Accelerator: dois IPv4 anycast fixos, TCP e UDP, endpoints ALB, NLB, EC2 e Elastic IP, failover por saúde, controle de tráfego e pesos. | [Functions × Lambda@Edge](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-functions-choosing.html), [Global Accelerator](https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html) |

## Proteção de borda (Fase 9)

| Fato | Fonte |
|---|---|
| WAF: recursos protegidos (CloudFront, API Gateway REST, ALB, AppSync, Cognito, App Runner, Verified Access, Amplify e outros); grupos gerenciados Core rule set (inclui XSS) e SQL database; regra por taxa. | [WAF](https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html), [baseline](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html), [use case](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-use-case.html), [taxa](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html) |
| Shield Standard automático e sem custo extra, camadas 3 e 4; Shield Advanced: recursos protegidos, só os adicionados, WAF padrão incluído, mitigação automática na camada 7, SRT com Business ou Enterprise, créditos de custo, cobrança por família de faturamento. | [Overview](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-overview.html), [Standard](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-standard-summary.html), [Advanced](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-advanced-summary.html), [capacidades](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-advanced-summary-capabilities.html), [recursos](https://docs.aws.amazon.com/waf/latest/developerguide/ddos-advanced-summary-protected-resources.html) |
| Network Firewall: com estado, IPS Suricata, filtro por domínio, sub-redes próprias por zona. Firewall Manager: WAF, Shield Advanced, security groups, ACLs, Network Firewall e DNS Firewall em toda a organização, contas novas incluídas, cobrança dos serviços gerenciados. | [Network Firewall](https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html), [Firewall Manager](https://docs.aws.amazon.com/waf/latest/developerguide/fms-chapter.html) |

**Cuidados.** A trilha não cita prazo para o circuito do Direct Connect: a demora do parceiro é premissa do cenário. O "não" do NLB e da instância EC2 como recursos do WAF vem da lista oficial de recursos protegidos, que não os inclui.

## Projeto de Rede (desafio final)

- Reaproveita os fatos das Fases 1 a 9. Rubrica e pesos são pedagógicos.

## Preços

- `src/content/pricing/network-prices.json` é gerado por `npm run prices:network` a partir da AWS Price List Bulk API (ofertas AmazonVPC de 16/10/2026, AmazonEC2 de 15/10/2026 e AWSDataTransfer de 16/9/2026), para us-east-1 e sa-east-1, consultada em 21/10/2026: hora e GB do NAT Gateway, hora por zona e GB do endpoint de interface, hora de anexo e GB do Transit Gateway, hora de conexão VPN, hora de associação e de conexão da Client VPN, hora de IPv4 público e GB entre zonas. Primeira faixa paga; o script falha se faltar algum preço. O Direct Connect cobra por local de conexão e fica de fora.
- Mês de 730 horas.

## Premissas e simplificações da trilha

- **Endereços:** só IPv4 nos laboratórios; bloco desalinhado tratado como erro.
- **Rotas:** uma rota para a internet por família de endereços em cada sub-rede.
- **Fluxos:** conexões TCP em IPv4; a internet chega só a instâncias com IP público em sub-rede pública.
- **Conexões entre VPCs:** o peering não tem custo por hora nem por GB processado; a transferência entre zonas fica fora da conta; todo anexo do Transit Gateway custa o preço do anexo de VPC; o limite de conexões que a equipe aceita é premissa.
- **Endpoints:** custo de hora e de GB processado; quando o NAT já existe, só o GB entra.
- **Escolhas (híbrida, DNS e rede):** a complexidade que desempata as opções é julgamento de arquitetura.
- **CloudFront:** um POP e um cache regional, TTL fixo por comportamento, latências ilustrativas.

# Trilha Análise de dados e serviços de IA na AWS — conferido em 21/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as 83 URLs usadas nos conceitos e as dos 24 serviços novos do catálogo foram conferidas pelo título da página em 21/10/2026. A página da documentação do Elastic Transcoder já não existe; o catálogo aponta para o anúncio do encerramento.

## Escopo do exame e situação dos serviços

| Fato | Fonte |
|---|---|
| A lista do SAA-C03 inclui Athena, Data Exchange, Data Firehose, EMR, Glue, Kinesis, Kinesis Video Streams, Lake Formation, MSK, OpenSearch Service, Amazon Quick, Comprehend, Lex, Polly, Rekognition, SageMaker AI, Textract, Transcribe, Translate, Elastic Transcoder, Amplify e Device Farm. | [In-Scope AWS Services](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) |
| O Amazon Quick evoluiu do Amazon QuickSight, que continua como Amazon Quick Sight, um recurso do Quick; as APIs do QuickSight continuam valendo. O Quick também tem Quick Flows, Quick Automate, Quick Index e Quick Research. | [What is Amazon Quick?](https://docs.aws.amazon.com/quick/latest/userguide/what-is.html) |
| A AWS encerrou o Amazon Elastic Transcoder em 13/11/2025; depois dessa data, o serviço não pode mais ser usado. A alternativa é o AWS Elemental MediaConvert. | [Support for Amazon Elastic Transcoder ending soon](https://aws.amazon.com/blogs/media/support-for-amazon-elastic-transcoder-ending-soon/) |

## Data lake no S3 (Fase 1)

| Fato | Fonte |
|---|---|
| Data lake: repositório central de dados estruturados ou não, guardados no formato original, com a estrutura definida na leitura; data warehouse: esquema definido antes, otimizado para SQL; muitas empresas precisam dos dois. | [What is a Data Lake?](https://aws.amazon.com/what-is/data-lake/) |
| Camadas recomendadas: bruta (formato original, versionamento), tratada (por exemplo, CSV convertido em Parquet por um job do Glue) e de consumo; um bucket por camada; camada de chegada extra para dados pessoais; ciclo de vida sugerido para a bruta: Standard-IA depois de um ano e Glacier depois de mais dois. | [Recommended data layers](https://docs.aws.amazon.com/prescriptive-guidance/latest/defining-bucket-names-data-lakes/data-layer-definitions.html) |
| Parquet e ORC são colunares: comprimem por coluna, pulam blocos por estatísticas e permitem dividir a leitura; o ORC costuma gerar arquivos menores; conversão por CTAS no Athena ou job do Glue. | [Use columnar storage formats](https://docs.aws.amazon.com/athena/latest/ug/columnar-storage.html) |
| Formatos de compressão do Athena (GZIP, ZSTD, Snappy, LZ4, LZO, BZIP2, ZLIB); a compressão de CSV e JSON é reconhecida pela extensão; o Athena não lê .zip. | [Use compression in Athena](https://docs.aws.amazon.com/athena/latest/ug/compression-formats.html) |
| O Athena cobra os bytes lidos antes da descompressão; texto comprimido, em geral, não se divide entre leitores; muitos arquivos pequenos pioram as consultas; grupos de linhas do Parquet com 128 MB e faixas do ORC com 64 MB por padrão; mais de 1.000 arquivos por partição piora a listagem; partição demais fragmenta, de menos lê além do necessário. | [Optimize data](https://docs.aws.amazon.com/athena/latest/ug/performance-tuning-data-optimization-techniques.html) |
| Com a partição no WHERE, o Athena lê só as partições escolhidas; formato de pastas do Hive (chave=valor); sem partição, consultas sobre buckets com muitos objetos podem esbarrar no limite de requisições do S3. | [Partition your data](https://docs.aws.amazon.com/athena/latest/ug/partitions.html) |

## Catálogo e transformação com o Glue (Fase 2)

| Fato | Fonte |
|---|---|
| Um Data Catalog por conta e por Região; substitui o Hive Metastore; usado por Athena, Redshift Spectrum e EMR; acesso controlado por IAM e Lake Formation. | [AWS Glue components](https://docs.aws.amazon.com/glue/latest/dg/components-overview.html) |
| Crawlers rodam classificadores próprios e depois os prontos, criam ou atualizam tabelas e partições. | [Using crawlers](https://docs.aws.amazon.com/glue/latest/dg/add-crawler.html) |
| Job bookmarks evitam reprocessar e duplicar; fontes JDBC e S3 em JSON, CSV, Avro, XML, Parquet e ORC (Glue 1.0 ou mais novo). | [Job bookmarks](https://docs.aws.amazon.com/glue/latest/dg/monitor-continuations.html) |
| Gatilhos por horário, por condição (SUCCEEDED, FAILED, TIMEOUT e outros) e sob demanda; um gatilho inicia no máximo dois crawlers; workflows são os recomendados para fluxos com vários passos. | [AWS Glue triggers](https://docs.aws.amazon.com/glue/latest/dg/about-triggers.html), [workflows](https://docs.aws.amazon.com/glue/latest/dg/workflows_overview.html) |
| Tipos de job Spark, Spark Streaming, Ray e Python shell; 1 DPU = 4 vCPU e 16 GB; cobrança por segundo, mínimo de 1 minuto (Glue 2.0 ou mais novo); Spark com no mínimo 2 DPU e padrão 10; crawlers com mínimo de 10 minutos; Data Catalog gratuito até 1 milhão de objetos e 1 milhão de requisições por mês; exemplo: 6 DPU por 15 minutos a US$ 0,44 = US$ 0,66. | [AWS Glue Pricing](https://aws.amazon.com/glue/pricing/) |
| Execução Flex: capacidade ociosa, mais barata, com início e duração variáveis, para jobs sem pressa. | [Introducing AWS Glue Flex jobs](https://aws.amazon.com/blogs/big-data/introducing-aws-glue-flex-jobs-cost-savings-on-etl-workloads/) |
| DataBrew: preparação visual sem código, mais de 250 transformações, sem servidor. | [What is AWS Glue DataBrew?](https://docs.aws.amazon.com/databrew/latest/dg/what-is.html) |

## Consultas com Athena (Fase 3)

| Fato | Fonte |
|---|---|
| Cobrança por TB lido, arredondada ao megabyte, mínimo de 10 MB por consulta; DDL e consultas com falha não pagam; canceladas pagam o que leram; exemplo: 3 TB em texto = US$ 15, com GZIP 3:1 = US$ 5, colunar lendo 1 de 4 colunas = US$ 1,25; consultas federadas pagam também o Lambda. | [Amazon Athena Pricing](https://aws.amazon.com/athena/pricing/) |
| Workgroups separam cargas, histórico e custo; um limite por consulta (cancela) e vários limites do workgroup por hora ou dia (alarme pelo SNS); a consulta cancelada é cobrada. | [Workgroups](https://docs.aws.amazon.com/athena/latest/ug/workgroups-manage-queries-control-costs.html), [data usage controls](https://docs.aws.amazon.com/athena/latest/ug/workgroups-setting-control-limits-cloudwatch.html) |
| Reservas de capacidade: DPUs dedicados para workgroups, com prioridade e fora da cota de consultas da conta; 1 DPU ≈ 4 vCPU e 16 GB. | [Manage query processing capacity](https://docs.aws.amazon.com/athena/latest/ug/capacity-management.html) |
| Consultas federadas com conectores; filtros empurrados para a fonte; parte dos conectores roda como Lambda. | [Federated Query](https://docs.aws.amazon.com/athena/latest/ug/federated-queries.html) |
| Reaproveitamento de resultados com idade máxima, dentro do mesmo workgroup; projeção de partições calcula as partições pelas propriedades da tabela. | [Reuse query results](https://docs.aws.amazon.com/athena/latest/ug/reusing-query-results.html), [partition projection](https://docs.aws.amazon.com/athena/latest/ug/partition-projection.html) |

## Governança com Lake Formation (Fase 4)

| Fato | Fonte |
|---|---|
| Permissões por GRANT e REVOKE que complementam o IAM; valem para Athena, Quick, Redshift Spectrum, EMR e Glue; modo híbrido; compartilhamento entre contas. | [What is AWS Lake Formation?](https://docs.aws.amazon.com/lake-formation/latest/dg/what-is-lake-formation.html) |
| O pedido precisa passar no IAM e no Lake Formation; permissões valem só na Região concedida. | [Overview of Lake Formation permissions](https://docs.aws.amazon.com/lake-formation/latest/dg/lf-permissions-overview.html) |
| Fluxo: metadados, checagem, credenciais temporárias (credential vending), leitura e filtragem no serviço integrado. | [How it works](https://docs.aws.amazon.com/lake-formation/latest/dg/how-it-works.html) |
| Filtros por coluna, linha e célula, inclusive colunas aninhadas. | [Data filtering](https://docs.aws.amazon.com/lake-formation/latest/dg/data-filtering.html) |
| LF-Tags são pares chave-valor; recomendadas com muitos objetos; não são tags do IAM. | [LF-TBAC](https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html) |
| Configuração padrão: Super para IAMAllowedPrincipals e "Use only IAM access control"; no modo híbrido, quem é incluído precisa de IAM e Lake Formation. | [Default settings](https://docs.aws.amazon.com/lake-formation/latest/dg/change-settings.html), [hybrid access mode](https://docs.aws.amazon.com/lake-formation/latest/dg/hybrid-access-mode.html) |
| Compartilhamento entre contas pelo AWS RAM; na mesma organização vale na hora; fora dela, convite. Registrar um caminho registra as pastas abaixo dele. | [Cross-account](https://docs.aws.amazon.com/lake-formation/latest/dg/cross-account-permissions.html), [register](https://docs.aws.amazon.com/lake-formation/latest/dg/register-data-lake.html) |

## Processamento com EMR (Fase 5)

| Fato | Fonte |
|---|---|
| Primário coordena (três primários desde a 5.23.0); core guarda HDFS e perdê-lo arrisca dados; task só processa. | [Node types](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-master-core-task-nodes.html) |
| Primário em Spot: a retomada termina o cluster; core em Spot só se a perda de HDFS for tolerável; task em Spot sem perda de dados; dados críticos: primário e core On-Demand, task Spot; trocar primário ou core de opção exige outro cluster. | [Spot best practices](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-instances-guidelines.html) |
| HDFS é efêmero; S3 pelo conector S3A desde a 7.10.0 (antes, EMRFS). | [Storage and file systems](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-file-systems.html) |
| Cluster de longa duração é o padrão do console e da CLI; transitório termina depois dos passos. | [Continue or terminate](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-plan-longrunning-transient.html) |
| EMR Serverless sem cluster, com recursos pré-inicializáveis; EMR no EKS roda no Kubernetes existente. | [EMR Serverless](https://docs.aws.amazon.com/emr/latest/EMR-Serverless-UserGuide/emr-serverless.html), [EMR on EKS](https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/emr-eks.html) |

## Ingestão e streaming (Fase 6)

| Fato | Fonte |
|---|---|
| Shard: escrita de 1 MB/s ou 1.000 registros/s, leitura de 2 MB/s; registro de até 1 MB; retenção de 24 horas a 365 dias; modos sob demanda e provisionado. | [Terminology](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html), [modes](https://docs.aws.amazon.com/streams/latest/dev/how-do-i-size-a-stream.html), [retention](https://docs.aws.amazon.com/streams/latest/dev/kinesis-extended-retention.html) |
| Firehose entrega no S3, Redshift, OpenSearch, Splunk, Iceberg e HTTP, sem código; transforma com Lambda; buffer de 1 a 128 MiB e de 60 a 900 segundos (o primeiro limite atingido dispara a entrega); converte JSON em Parquet ou ORC com o esquema do Data Catalog; partição dinâmica; aceita um fluxo do Kinesis Data Streams como origem. | [What is Firehose?](https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html), [format conversion](https://docs.aws.amazon.com/firehose/latest/dev/record-format-conversion.html), [backup settings](https://docs.aws.amazon.com/firehose/latest/dev/create-configure-backup.html), [source](https://docs.aws.amazon.com/firehose/latest/dev/create-name.html) |
| MSK: Kafka gerenciado, provisionado ou sem servidor; MSK Serverless numa lista de Regiões que inclui us-east-1 e não inclui sa-east-1; MSK Connect com Kafka Connect. | [MSK](https://docs.aws.amazon.com/msk/latest/developerguide/what-is-msk.html), [MSK Serverless](https://docs.aws.amazon.com/msk/latest/developerguide/serverless.html), [MSK Connect](https://docs.aws.amazon.com/msk/latest/developerguide/msk-connect.html) |
| Data Exchange: dados de outras organizações por concessão ou assinatura, e Open Data on AWS; AppFlow: SaaS (Salesforce, Zendesk) para S3 e Redshift, sem código. | [Data Exchange](https://docs.aws.amazon.com/data-exchange/latest/userguide/what-is.html), [AppFlow](https://docs.aws.amazon.com/appflow/latest/userguide/what-is-appflow.html) |

## Busca e visualização (Fase 7)

| Fato | Fonte |
|---|---|
| OpenSearch Service: domínios de OpenSearch ou Elasticsearch até 7.10; substitui nós com falha; logs, monitoramento e cliques. | [What is OpenSearch Service?](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html) |
| OpenSearch Serverless com coleções; OpenSearch Ingestion sem servidor, baseado no Data Prepper. | [Serverless](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-overview.html), [Ingestion](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ingestion.html) |
| Multi-AZ with Standby recomendado para produção: três zonas, três mestres dedicados, réplicas, 99,99%. | [Multi-AZ](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/managedomains-multiaz.html) |
| SPICE em memória, reusado sem custo extra; com fonte cobrada por consulta, paga-se a criação e as atualizações; capacidade por Região. Segurança por linha e incorporação na edição Enterprise. Fontes incluem Athena, Redshift, S3, RDS, Aurora, OpenSearch, Salesforce e Snowflake. | [SPICE](https://docs.aws.amazon.com/quick/latest/userguide/spice.html), [RLS](https://docs.aws.amazon.com/quick/latest/userguide/restrict-access-to-a-data-set-using-row-level-security.html), [embedding](https://docs.aws.amazon.com/quick/latest/userguide/embedding-overview.html), [sources](https://docs.aws.amazon.com/quick/latest/userguide/supported-data-sources.html) |

## Serviços prontos de IA, mídia e front-end (Fase 8)

| Fato | Fonte |
|---|---|
| Comprehend: entidades, frases-chave, idioma e sentimento; detecção de dados pessoais em inglês e espanhol. | [Comprehend](https://docs.aws.amazon.com/comprehend/latest/dg/what-is.html), [PII](https://docs.aws.amazon.com/comprehend/latest/dg/pii.html) |
| Lex: chatbots de voz e texto, integração com Lambda; Polly: texto em fala; Transcribe: fala em texto, em tempo real ou lote, com legendas WebVTT e SubRip; Translate: tradução. | [Lex](https://docs.aws.amazon.com/lexv2/latest/dg/what-is.html), [Polly](https://docs.aws.amazon.com/polly/latest/dg/what-is.html), [Transcribe](https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html), [subtitles](https://docs.aws.amazon.com/transcribe/latest/dg/subtitles.html), [Translate](https://docs.aws.amazon.com/translate/latest/dg/what-is.html) |
| Rekognition: objetos, textos, conteúdo impróprio e rostos em imagens e vídeos; Textract: texto, formulários e tabelas, notas e recibos. | [Rekognition](https://docs.aws.amazon.com/rekognition/latest/dg/what-is.html), [Textract](https://docs.aws.amazon.com/textract/latest/dg/what-is.html) |
| SageMaker AI: construir, treinar e hospedar modelos. Kinesis Video Streams: vídeo ao vivo de câmeras e aparelhos. MediaConvert: conversão de arquivos de vídeo. | [SageMaker AI](https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html), [Kinesis Video Streams](https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/what-is-kinesis-video.html), [MediaConvert](https://docs.aws.amazon.com/mediaconvert/latest/ug/what-is.html) |
| Amplify Hosting: deploy pelo Git, CDN e ambientes por branch; Device Farm: aparelhos reais, só em us-west-2. | [Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html), [Device Farm](https://docs.aws.amazon.com/devicefarm/latest/developerguide/welcome.html) |

## Escolha da solução e desafio final (Fase 9 e Plataforma de Dados)

- Reaproveitam os fatos das Fases 1 a 8. A preferência pela opção com menos operação e a rubrica do desafio final são julgamento pedagógico do AWS Quest.

## Preços

- `src/content/pricing/analytics-prices.json` é gerado por `npm run prices:analytics` a partir da AWS Price List Bulk API (ofertas AmazonAthena de 11/9/2026 e AWSGlue de 12/10/2026), para us-east-1 e sa-east-1, consultada em 21/10/2026: Athena US$ 5 (us-east-1) e US$ 9 (sa-east-1) por TB lido, capacidade reservada a US$ 0,30 por DPU-hora; Glue a US$ 0,44 (padrão), US$ 0,29 (Flex) e US$ 0,308 (Glue 6.0 ou mais novo) por DPU-hora em us-east-1.
- O S3 Standard vem da tabela da S3 Expedition; o EMR usa o On-Demand da tabela de Computação.

## Premissas e simplificações da trilha

- **Data lake:** Snappy 2:1, GZIP e ZSTD 3:1, JSON 60% maior que o CSV, Parquet e ORC do mesmo tamanho, arquivo pequeno abaixo de 64 MB em média por partição, mês de 30 dias.
- **Lake Formation:** concessões de leitura que se somam; as permissões do IAM já liberam o Athena.
- **EMR:** um lote por nó core ou task por hora; uma retomada de Spot na hora indicada, sem reposição; grupo primário em Spot retomado inteiro; core perdido com HDFS faz o job falhar; desconto do Spot de 70% e taxa do EMR fora da conta.
- **Escolhas (ingestão, IA e solução de dados):** a complexidade que desempata as opções é julgamento de arquitetura.

# Trilha Segurança e proteção de dados na AWS — conferido em 22/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as 47 URLs usadas nos conceitos e as dos 7 serviços novos do catálogo (ACM, CloudHSM, GuardDuty, Inspector, Detective, Security Hub e Artifact) foram conferidas pelo título da página em 22/10/2026. O Secrets Manager já estava no catálogo.

## Escopo do exame e situação dos serviços

| Fato | Fonte |
|---|---|
| A tarefa 1.2 cita a segurança da configuração e das credenciais da aplicação, Cognito, GuardDuty e Macie, ameaças externas como DDoS e injeção de SQL, e Shield, WAF, IAM Identity Center e Secrets Manager. A tarefa 1.3 cita retenção e classificação de dados, gestão de chaves, KMS para dados em repouso, ACM com TLS para dados em trânsito, políticas de acesso às chaves, rotação de chaves e renovação de certificados. | [Content Domain 1: Design Secure Architectures](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain1.html) |
| Hoje são dois serviços: o Security Hub CSPM (o antigo Security Hub) faz as checagens de postura; o Security Hub correlaciona esses achados com os do Inspector, do GuardDuty e do Macie para apontar exposições. A AWS recomenda ligar os dois; sem o CSPM, o Security Hub não usa os achados de postura. A lista do exame cita só "AWS Security Hub". | [What are Security Hub and Security Hub CSPM?](https://docs.aws.amazon.com/securityhub/latest/userguide/what-are-securityhub-services.html) |

## Criptografia e KMS (Fase 1)

| Fato | Fonte |
|---|---|
| Três tipos de chave: do cliente (controle total, custo mensal), gerenciada pela AWS (na conta, alias aws/serviço, rotação anual obrigatória, sem custo mensal, não compartilhável com outras contas; serviços novos não a criam desde 2021) e da AWS (numa conta do serviço, invisível, sem custo). | [AWS KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html) |
| A key policy não dá acesso automático à conta; o statement com o principal da conta habilita as políticas IAM (sem ele, IAM que permite não vale, IAM que nega vale). Statement de administradores (Create*, Describe*, Enable*, List*, Put*, Update*, Revoke*, Disable*, Get*, Delete*, TagResource, UntagResource, ScheduleKeyDeletion, CancelKeyDeletion, RotateKeyOnDemand) sem operações criptográficas; statement de usuários com Encrypt, Decrypt, ReEncrypt*, GenerateDataKey* e DescribeKey. | [Default key policy](https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-default.html) |
| Encrypt aceita até 4.096 bytes com chave simétrica (446 bytes com RSA 4096 e OAEP SHA-256); para dados maiores, GenerateDataKey devolve a chave de dados aberta e cifrada. | [Encrypt](https://docs.aws.amazon.com/kms/latest/APIReference/API_Encrypt.html) |

## KMS avançado e CloudHSM (Fase 2)

| Fato | Fonte |
|---|---|
| Rotação automática a cada 365 dias por padrão, com período configurável; rotação sob demanda; só em chaves simétricas do cliente (a sob demanda também com material importado); o material antigo é guardado e escolhido para decifrar; a rotação não cifra de novo os dados; a primeira e a segunda rotação aumentam a cobrança, as seguintes não. | [Rotate AWS KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html) |
| Material importado pode expirar ou ser apagado; a chave fica inutilizável e passa ao estado PendingImport. | [Rotate AWS KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html), [Key states of AWS KMS keys](https://docs.aws.amazon.com/kms/latest/developerguide/key-state.html) |
| Chaves multi-Região: mesmo material e ID; key policy, grants, alias, tags e estado independentes; não são globais; uma chave de uma Região não vira multi-Região; a AWS indica chaves de uma Região para a maioria dos casos. | [Multi-Region keys](https://docs.aws.amazon.com/kms/latest/developerguide/multi-region-keys-overview.html) |
| Grants só permitem; uma chave por grant; o grantee usa sem citar; token para uso imediato; 50.000 grants por chave; usados por serviços como o EBS. | [Grants in AWS KMS](https://docs.aws.amazon.com/kms/latest/developerguide/grants.html) |
| Cota compartilhada das operações simétricas: 10.000 por segundo, 20.000 em algumas Regiões e 100.000 em us-east-1, us-west-2 e eu-west-1; acima disso, ThrottlingException; pedidos feitos por serviços em seu nome contam. | [Request quotas](https://docs.aws.amazon.com/kms/latest/developerguide/requests-per-second.html) |
| CloudHSM: HSMs de um só cliente, FIPS 140-2 ou 140-3 nível 3 no modo FIPS; a AWS não vê os dados; o cliente gerencia os próprios usuários; o guia indica o KMS para quem não precisa operar HSMs. | [What is AWS CloudHSM?](https://docs.aws.amazon.com/cloudhsm/latest/userguide/introduction.html) |

## Segredos da aplicação (Fase 3)

| Fato | Fonte |
|---|---|
| Quatro etapas da função de rotação: createSecret (AWSPENDING), setSecret, testSecret e finishSecret (AWSCURRENT para a nova, AWSPREVIOUS para a anterior); a função não pode chamar outra função para girar. | [Lambda rotation functions](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda-functions.html) |
| Rotação tão frequente quanto a cada 4 horas e tão espaçada quanto a cada 999 dias; janela de no mínimo uma hora; expressões rate() e cron() em UTC. | [Rotation schedules](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_schedule.html) |
| Usuário único: curto intervalo em que o banco pode recusar a senha; conexões abertas não caem. Usuários alternados: clone na primeira rotação, as duas credenciais valem depois, exige segredo de superusuário. | [Rotation strategies](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotation-strategy.html) |
| Rotação gerenciada, sem Lambda, para a senha principal do RDS, do Aurora e do DocumentDB e a de administrador do Redshift; costuma terminar em até um minuto. | [Managed rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_managed.html) |
| Réplicas em outras Regiões; a rotação da principal chega às réplicas; chave do KMS da própria Região; réplica promovível. | [Replicate secrets](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create-manage-multi-region-secrets.html) |
| O componente de cache atualiza os segredos a cada hora por padrão. | [Client-side caching (Python)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_cache-python.html) |
| Parameter Store padrão: 10.000 parâmetros, 4 KB, sem custo extra; avançado: 100.000, 8 KB, políticas, com custo. | [Parameter tiers](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html) |

## Certificados e TLS (Fase 4)

| Fato | Fonte |
|---|---|
| Certificados públicos do ACM sem custo adicional (os exportáveis têm custo); regionais; não se copiam entre Regiões; para o CloudFront, us-east-1. | [What is AWS Certificate Manager?](https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html) |
| Serviços integrados: ELB, CloudFront, EKS (ACK), Cognito, Elastic Beanstalk, App Runner, API Gateway, Nitro Enclaves, CloudFormation, Amplify, OpenSearch e Network Firewall; certificado gerenciado direto numa instância EC2 só com Nitro Enclaves. | [Managed automation with integrated services](https://docs.aws.amazon.com/acm/latest/userguide/acm-services.html) |
| Renovação gerenciada: elegível se associado a um serviço integrado ou exportado; não elegível se importado ou vencido. DNS: a 45 dias, renova se em uso e com os CNAMEs; eventos a 30, 15, 7, 3 e 1 dia se não validar. E-mail: exige ação, avisos a partir de 45 dias. Validade de 198 dias. | [Managed renewal](https://docs.aws.amazon.com/acm/latest/userguide/managed-renewal.html), [DNS renewal](https://docs.aws.amazon.com/acm/latest/userguide/dns-renewal-validation.html), [validation](https://docs.aws.amazon.com/acm/latest/userguide/domain-ownership-validation.html), [characteristics](https://docs.aws.amazon.com/acm/latest/userguide/acm-certificate-characteristics.html) |
| Importados não são renovados pelo ACM; reimportar mantém o ARN; eventos de vencimento a partir de 45 dias (importados e privados) e 30 dias (públicos). | [Import certificates](https://docs.aws.amazon.com/acm/latest/userguide/import-certificate.html), [EventBridge](https://docs.aws.amazon.com/acm/latest/userguide/supported-events.html) |
| Exportáveis: para EC2, contêineres e servidores próprios; 198 dias; renovados 45 dias antes; implantação com o cliente. | [Exportable public certificates](https://docs.aws.amazon.com/acm/latest/userguide/acm-exportable-certificates.html) |

## Detecção de ameaças (Fase 5)

| Fato | Fonte |
|---|---|
| GuardDuty: fontes básicas (eventos de gerenciamento do CloudTrail, VPC Flow Logs e DNS) sem ligar nada; Extended Threat Detection sem custo extra; planos S3, EKS, Runtime Monitoring, Malware Protection (EC2, S3, AWS Backup), RDS, Lambda e AI Protection; teste de 30 dias com todos menos o Runtime Monitoring. | [What is Amazon GuardDuty?](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html) |
| Formato Propósito:Recurso/Família.Mecanismo!Artefato e a lista de propósitos; tipos usados: UnauthorizedAccess:EC2/SSHBruteForce, CryptoCurrency:EC2/BitcoinTool.B!DNS, Recon:EC2/PortProbeUnprotectedPort, Backdoor:EC2/C&CActivity.B, UnauthorizedAccess:IAMUser/MaliciousIPCaller e Policy:IAMUser/RootCredentialUsage. | [Finding format](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-format.html), [EC2 types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-ec2.html), [IAM types](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_finding-types-iam.html) |
| Achados no EventBridge: novos quase em tempo real; ocorrências seguintes agrupadas a cada 6 horas (ou 15 minutos e 1 hora); evento "GuardDuty Finding" com source aws.guardduty; achados guardados por 90 dias. | [EventBridge](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_cloudwatch.html) |
| Inspector: EC2, imagens do ECR e Lambda, varredura contínua, nota de risco ajustada, ativação para a organização. Tipos: Package vulnerability, Code vulnerability (Lambda) e Network reachability (EC2, a cada 12 horas). | [What is Amazon Inspector?](https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html), [finding types](https://docs.aws.amazon.com/inspector/latest/user/findings-types.html) |
| Detective: CloudTrail, VPC Flow Logs e achados do GuardDuty; grafo de comportamento; até um ano de histórico; administrador designado pela organização. | [What is Amazon Detective?](https://docs.aws.amazon.com/detective/latest/userguide/what-is-detective.html) |

## Classificação e retenção (Fase 6)

| Fato | Fonte |
|---|---|
| Descoberta automática do Macie por amostragem, todo dia; trabalhos com análise completa, uma vez ou recorrentes; identificadores gerenciados e personalizados; listas de permissão. | [Automated discovery](https://docs.aws.amazon.com/macie/latest/user/discovery-asdd.html), [jobs](https://docs.aws.amazon.com/macie/latest/user/discovery-jobs.html) |
| Achados de política (Policy:IAMUser/S3…) e de dados sensíveis (SensitiveData:S3Object/…); guardados por 90 dias; os de política só para mudanças depois de o Macie ser ligado. | [Types of Macie findings](https://docs.aws.amazon.com/macie/latest/user/findings-types.html) |
| Vault Lock: modo governança (removível com permissão) e conformidade (imutável depois da carência, de no mínimo 3 dias, nem a AWS muda); sem custo adicional. | [AWS Backup Vault Lock](https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html) |

## Postura e conformidade (Fase 7)

| Fato | Fonte |
|---|---|
| Security Hub CSPM: padrões FSBP, CIS, PCI DSS e NIST; controles com achados; recebe achados do GuardDuty, do Inspector e do Macie; só achados novos e da Região ligada; o AWS Config precisa estar ligado e gravando para a maioria dos controles; teste de 30 dias. | [Introduction to AWS Security Hub CSPM](https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html), [standards](https://docs.aws.amazon.com/securityhub/latest/userguide/standards-view-manage.html) |
| Controles [S3.5] (TLS, regra s3-bucket-ssl-requests-only) e [S3.8] (bloqueio de acesso público no bucket). | [Security Hub CSPM controls for Amazon S3](https://docs.aws.amazon.com/securityhub/latest/userguide/s3-controls.html) |
| Artifact: relatórios ISO, PCI e SOC da AWS e acordos, sem custo; a empresa documenta a parte dela. | [What is AWS Artifact?](https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html) |

## Ameaças externas e resposta (Fase 8)

| Fato | Fonte |
|---|---|
| Core rule set (AWSManagedRulesCommonRuleSet) com regras de cross-site scripting; SQL database (AWSManagedRulesSQLiRuleSet) contra injeção de SQL. | [Baseline rule groups](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-baseline.html), [use-case rule groups](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-use-case.html) |
| Contenção do EC2 trocando os security groups por um grupo restritivo; conexões já rastreadas não caem; contenção do IAM com política que nega tudo; ciclo detecção, contenção, erradicação e recuperação. | [Contain](https://docs.aws.amazon.com/security-ir/latest/userguide/contain.html) |

## Escolha e desafio final (Fase 9 e Auditoria de Segurança)

- Reaproveitam os fatos das Fases 1 a 8. A preferência pela opção com menos operação e a rubrica do desafio final são julgamento pedagógico do AWS Quest.

## Preços

- `src/content/pricing/security-prices.json` é gerado por `npm run prices:security` a partir da AWS Price List Bulk API (ofertas awskms, AWSSecretsManager e CloudHSM de 11/9/2026), para us-east-1 e sa-east-1, consultada em 22/10/2026: KMS a US$ 1 por chave gerenciada pelo cliente por mês e US$ 0,03 por 10.000 requisições simétricas; Secrets Manager a US$ 0,40 por segredo por mês e US$ 0,05 por 10.000 chamadas; CloudHSM a US$ 1,60 por HSM-hora em us-east-1 e US$ 2,72 em sa-east-1.
- GuardDuty, Inspector, Macie e Security Hub não entram na tabela: a cobrança depende do volume analisado.

## Premissas e simplificações da trilha

- **KMS:** as políticas IAM das roles estão fixas; um Deny explícito vence também os grants; restrições de grant, tokens e grants entre contas não são simulados.
- **Secrets Manager:** a aplicação com cache guardou a versão 1 antes da rotação e não renovou a cópia no momento perguntado; atrasos de propagação no banco não são simulados.
- **ACM:** todos os certificados do laboratório estão a menos de 45 dias do vencimento; certificados privados e a validação por HTTP ficam de fora.
- **Achados:** aparecem com o tipo e um resumo; a ação certa de cada achado é julgamento de arquitetura.
- **Escolhas:** a complexidade que desempata as opções é julgamento de arquitetura.

# Trilha Integração e mensageria na AWS — conferido em 22/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as 49 URLs usadas nos conceitos e as dos 3 serviços novos do catálogo (Step Functions, API Gateway e Amazon MQ) foram conferidas pelo título da página em 22/10/2026. Sete títulos diferiam do esperado (por exemplo, "Amazon EventBridge event bus (default and Classic)" e "Deployment options for Amazon MQ for ActiveMQ brokers") e foram corrigidos nas referências.

## SQS essencial (Fase 1)

| Fato | Fonte |
|---|---|
| Fila padrão: vazão praticamente ilimitada, entrega pelo menos uma vez e ordem de melhor esforço; lotes de até 10 mensagens; cerca de 120.000 mensagens em processamento. | [Standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html) |
| Tempo de visibilidade: padrão de 30 s, de 0 s a 12 horas, contadas a partir do primeiro recebimento; se a mensagem não é apagada no prazo, volta a ficar visível; ChangeMessageVisibility estende o prazo. | [Visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) |
| Retenção padrão de 4 dias, de 1 minuto a 14 dias; mensagem de até 1 MiB; para cargas maiores, S3 com a biblioteca Extended Client, até 2 GB. | [Message quotas](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html), [Large messages](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-s3-messages.html) |
| Short polling consulta parte dos servidores; long polling espera até 20 s e consulta todos, com menos respostas vazias e menos custo. | [Short and long polling](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-short-and-long-polling.html) |
| DLQ: maxReceiveCount; mesma conta e Região; na fila padrão, a mensagem mantém a data original de entrada (retenção da DLQ maior que a da origem); na FIFO, a data recomeça; a AWS desaconselha DLQ na FIFO quando a ordem exata importa; redrive devolve as mensagens. | [Dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html) |

## SQS em escala (Fase 2)

| Fato | Fonte |
|---|---|
| Fila FIFO: ordem dentro do grupo de mensagens, processamento exatamente uma vez, nome terminado em .fifo; uma fila padrão não vira FIFO. | [FIFO queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html) |
| Deduplicação em janela de 5 minutos, pelo ID do produtor ou por hash SHA-256 do corpo (deduplicação por conteúdo). | [Exactly-once processing](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html) |
| FIFO: 300 transações por segundo por ação sem lote, 3.000 mensagens com lotes de 10; modo de alta vazão com limites por Região (70.000 em us-east-1; 4.500 em São Paulo), exigindo muitos grupos. | [FIFO queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queues.html), [High throughput](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/high-throughput-fifo.html) |
| Fila com atraso de 0 a 15 minutos; temporizador por mensagem só na fila padrão ("FIFO queues don't support timers on individual messages"). | [Delay queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-delay-queues.html), [Message timers](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-timers.html) |
| Lambda com SQS: lote de até 10.000 (padrão) ou 10 (FIFO), janela de até 5 minutos; visibilidade de pelo menos seis vezes o tempo limite da função; maxReceiveCount de pelo menos 5; escala a partir de 5 consumidores, mais 300 por minuto, até 1.250; concorrência máxima de 2 a 1.000; na FIFO, limitada pelo número de grupos; entrega pelo menos uma vez, com função idempotente. | [Using Lambda with SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html), [Configure](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html), [Scaling](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-scaling.html) |
| Falha parcial do lote com ReportBatchItemFailures e batchItemFailures. | [Error handling](https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-errorhandling.html) |

## SNS (Fase 3)

| Fato | Fonte |
|---|---|
| Assinaturas: HTTP e HTTPS, e-mail, Firehose, SQS, Lambda, notificações para celular e SMS. | [What is Amazon SNS?](https://docs.aws.amazon.com/sns/latest/dg/welcome.html) |
| Política de filtro por atributos ou corpo; nomes de propriedade com E, valores com OU; sem política, a assinatura recebe tudo; operadores de valor exato, prefixo, sufixo, anything-but, numérico, exists, equals-ignore-case e IP. | [Message filtering](https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html), [Filter policies](https://docs.aws.amazon.com/sns/latest/dg/sns-subscription-filter-policies.html) |
| Tópico FIFO com ordem e deduplicação, integrado a filas SQS FIFO. | [FIFO topics](https://docs.aws.amazon.com/sns/latest/dg/sns-fifo-topics.html) |
| Novas tentativas: destinos gerenciados pela AWS (SQS, Lambda) 100.015 tentativas em 23 dias; destinos do cliente (HTTP) 50 em 6 horas; depois, descarte, a menos que a assinatura tenha DLQ (fila SQS). | [Delivery retries](https://docs.aws.amazon.com/sns/latest/dg/sns-message-delivery-retries.html), [Dead-letter queues](https://docs.aws.amazon.com/sns/latest/dg/sns-dead-letter-queues.html) |
| Fan-out com uma fila SQS por assinante. | [Fanout to SQS](https://docs.aws.amazon.com/sns/latest/dg/sns-sqs-as-subscriber.html) |

## EventBridge (Fase 4)

| Fato | Fonte |
|---|---|
| Barramento padrão em toda conta, barramentos personalizados e de parceiros; a página atual separa os barramentos clássicos (regras e alvos) do novo Custom Event Bus (assinaturas criadas pelos consumidores e eventos guardados para reprocessamento). | [Event bus (default and Classic)](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-bus.html) |
| Padrão com a mesma estrutura do evento; campos com E, lista com OU, campos não citados ignorados; operadores prefix, suffix, anything-but, numeric, exists e equals-ignore-case. | [Event patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html), [Comparison operators](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-pattern-operators.html) |
| Até cinco alvos por regra; DLQ do alvo é uma fila SQS padrão; regras agendadas como recurso legado, com o Scheduler recomendado. | [Rules](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rules.html), [Targets](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-targets.html) |
| Barramento de outra conta como alvo, liberado pela política de recurso do barramento de destino. | [Between accounts](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-cross-account.html) |
| Arquivo com retenção indefinida por padrão; replay para o mesmo barramento; até 10 reprocessamentos ao mesmo tempo. | [Archive and replay](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-archive.html) |
| Pipes: integração ponto a ponto entre origem e alvo, com filtro e enriquecimento opcionais. | [Pipes](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-pipes.html) |
| Scheduler: milhões de agendamentos, mais de 270 serviços, janela flexível e novas tentativas. | [What is EventBridge Scheduler?](https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html) |

Não confirmado e fora do conteúdo: os números da política de novas tentativas dos alvos do EventBridge.

## Step Functions (Fase 5)

| Fato | Fonte |
|---|---|
| Standard: até um ano, exatamente uma vez, cobrança por transição, histórico de 90 dias, .sync e .waitForTaskToken. Express: até 5 minutos; assíncrono pelo menos uma vez e síncrono no máximo uma vez; cobrança por execução, duração e memória; só resposta imediata. | [Choosing workflow type](https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html) |
| Estados Task, Choice, Parallel, Map, Pass, Wait, Succeed e Fail. | [Workflow states](https://docs.aws.amazon.com/step-functions/latest/dg/workflow-states.html) |
| Sem tratamento, o erro faz a execução falhar; Retry com IntervalSeconds 1, MaxAttempts 3 e BackoffRate 2.0 por padrão; Catch com Next; States.ALL casa com qualquer erro. | [Handling errors](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html) |
| Padrões de integração: resposta imediata, execução até o fim (.sync) e espera por callback (.waitForTaskToken), com heartbeat. | [Service integration patterns](https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html) |
| Saga: orquestração com coordenador central (a AWS cita o Step Functions) e coreografia sem coordenador, mais difícil de acompanhar e de tratar prazos e novas tentativas; transações de compensação. | [Saga orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html), [Saga choreography](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html) |

## API Gateway (Fase 6)

| Fato | Fonte |
|---|---|
| REST tem chaves de API, limite por cliente, validação de requisição, WAF, endpoint privado e cache; HTTP é mais simples e mais barata, com autorizador JWT; as duas aceitam IAM, Cognito e autorizador Lambda; políticas de recurso só na REST. | [REST or HTTP](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html) |
| Endpoints otimizados para borda (padrão da REST), regionais e privados. | [Endpoint types](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-endpoint-types.html) |
| Balde de tokens; 429 Too Many Requests; conta com 10.000 requisições por segundo e burst de 5.000 por Região; ordem dos limites: usage plan por cliente, método no estágio, conta. | [Throttling](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html) |
| Usage plans com taxa, burst e cota por chave de API; chave de API não serve para autorização (use IAM, Cognito ou autorizador Lambda). | [Usage plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html) |
| Cache do estágio só na REST; TTL padrão de 300 s, máximo de 3.600 s; GET por padrão; cobrança por hora conforme o tamanho escolhido. | [Cache settings](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html) |

## Streaming (Fase 7)

| Fato | Fonte |
|---|---|
| Chave de partição com hash MD5 decide o shard; registro de até 1 MB; shard com 1 MB/s ou 1.000 registros por segundo de escrita e 2 MB/s de leitura. | [Terminology and concepts](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html), [Quotas and limits](https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html) |
| Enhanced fan-out: 2 MB/s por consumidor por shard, por push, cerca de 70 ms contra cerca de 200 ms; até 20 consumidores (50 no On-demand Advantage); cobra a leitura dos dados e a hora de consumidor por shard. | [Enhanced fan-out](https://docs.aws.amazon.com/streams/latest/dev/enhanced-consumers.html) |
| Kinesis Data Streams (retenção e modos), Data Firehose (entrega e Parquet) e MSK seguem os fatos da trilha Análise de dados. | ver a seção da trilha Análise de dados |

## Amazon MQ e SaaS (Fase 8)

| Fato | Fonte |
|---|---|
| Brokers ActiveMQ Classic e RabbitMQ; JMS, AMQP, MQTT, OpenWire e STOMP; migrar sem reescrever; SQS e SNS recomendados para aplicações novas. | [What is Amazon MQ?](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/welcome.html) |
| Instância única numa zona; ativo e em espera com dois brokers em duas zonas e EFS; dois endpoints por protocolo, um ativo por vez; RabbitMQ com filas de quórum entre zonas. | [Deployment options](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-broker-architecture.html) |
| AppFlow segue os fatos da trilha Análise de dados (`ingest.third-party`). | ver a seção da trilha Análise de dados |

## Padrões, escolha e desafio final (Fase 9 e Arquitetura Orientada a Eventos)

- Reaproveitam os fatos das Fases 1 a 8. A idempotência segue a recomendação da página "Using Lambda with Amazon SQS". O buffer de escrita, a preferência pela opção com menos operação e a rubrica do desafio final são julgamento pedagógico do AWS Quest.

## Preços

- `src/content/pricing/integration-prices.json` é gerado por `npm run prices:integration` a partir da AWS Price List Bulk API (ofertas AWSQueueService, AmazonSNS, AWSEvents, AmazonStates, AmazonApiGateway, AmazonKinesis e AmazonKinesisFirehose), para us-east-1 e sa-east-1, consultada em 22/10/2026. Em us-east-1: SQS a US$ 0,40 por milhão de requisições padrão e US$ 0,50 na FIFO; SNS a US$ 0,50 por milhão de publicações; EventBridge a US$ 1,00 por milhão de eventos personalizados; Step Functions Standard a US$ 0,025 por mil transições; API Gateway a US$ 3,50 por milhão na REST e US$ 1,00 na HTTP; Kinesis a US$ 0,015 por shard-hora; Firehose a US$ 0,029 por GB.
- O conteúdo usa a comparação de preço entre REST e HTTP; os outros valores ficam disponíveis para laboratórios de custo futuros.

## Premissas e simplificações da trilha

- **Filas:** um consumidor por vez recebe a mensagem; o processamento leva sempre o mesmo tempo; a janela de lote do Lambda fica fora da conta da visibilidade.
- **Filtros:** o laboratório filtra atributos; $or, wildcard e cidr ficam de fora; cada regra tem um alvo.
- **Step Functions:** cada passo falha sempre com o mesmo tipo de erro; o Retry usa a espera padrão.
- **API Gateway:** o balde é reabastecido uma vez por segundo; só o limite do usage plan entra no laboratório.
- **Kinesis:** os dados se espalham por igual entre os shards (exceto a chave quente); o limite de 5 leituras por segundo do shard fica de fora.
- **Escolhas:** a complexidade que desempata as opções é julgamento de arquitetura.

# Trilha Arquivos e backup na AWS — conferido em 22/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as URLs usadas nos conceitos e a do serviço novo do catálogo (AWS Transfer Family) foram conferidas pelo título da página em 22/10/2026. As páginas `storage-classes.html` e `availability-durability.html` do EFS só devolvem o título: o conteúdo está em [Features of Amazon EFS](https://docs.aws.amazon.com/efs/latest/ug/features.html), que é a referência usada. A página antiga de desduplicação do FSx for Windows foi incorporada a [Managing storage](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/managing-storage-configuration.html).

## EFS essencial (Fase 1)

| Fato | Fonte |
|---|---|
| NFS 4.0 e 4.1; elástico, sem provisionar capacidade; montado por EC2, ECS, EKS, Lambda e Fargate; não suportado em instâncias Windows; padrões recomendados General Purpose e Elastic. | [What is Amazon EFS?](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html) |
| Regional (recomendado) guarda os dados em várias AZs e segue acessível com AZs fora; One Zone guarda numa AZ e pode perder os dados com a perda da AZ; 11 noves de durabilidade nos dois; One Zone só em algumas AZs e com backup automático pelo AWS Backup. | [Features of Amazon EFS](https://docs.aws.amazon.com/efs/latest/ug/features.html) |
| Um mount target por AZ no Regional; um só, na AZ do sistema de arquivos, no One Zone; acesso de outra AZ gera cobrança; IP do mount target não muda; security group no mount target. | [Managing mount targets](https://docs.aws.amazon.com/efs/latest/ug/manage-fs-access.html) |
| Access points impõem usuário POSIX e diretório raiz; funcionam sobre mount targets; security groups ficam no mount target. | [Working with access points](https://docs.aws.amazon.com/efs/latest/ug/efs-access-points.html) |
| Sem política, acesso total a qualquer cliente que alcance um mount target; ClientMount, ClientWrite e ClientRootAccess; aws:SecureTransport exige TLS; autorização pelo IAM exige o mount helper; basta um Allow na identidade ou no recurso. | [Using IAM to control access](https://docs.aws.amazon.com/efs/latest/ug/iam-access-control-nfs-efs.html) |
| Criptografia em repouso escolhida na criação, sem mudança depois (replicar para um novo); ligada por padrão no console e não na CLI ou API; elasticfilesystem:Encrypted em políticas e SCPs. | [Encrypting data at rest](https://docs.aws.amazon.com/efs/latest/ug/encryption-at-rest.html) |

## EFS: desempenho e custo (Fase 2)

| Fato | Fonte |
|---|---|
| Elastic (padrão e recomendado) para picos ou média de até 5% do pico, cobrado por dado lido e gravado; Provisioned cobra o que passa da base da Standard; Bursting com base de 50 KiB/s por GiB na Standard, rajada de 100 MiB/s por TiB (mínimo de 100 MiB/s) e créditos; espera de 24 horas depois de mudar para Provisioned. | [Performance specifications](https://docs.aws.amazon.com/efs/latest/ug/performance.html) |
| General Purpose recomendado sempre; Max I/O de geração anterior, sem One Zone e sem Elastic; IOPS não cobradas à parte. | [Performance specifications](https://docs.aws.amazon.com/efs/latest/ug/performance.html) |
| Standard, Infrequent Access (poucas vezes por trimestre) e Archive (poucas vezes por ano); latência de dezenas de milissegundos nas frias; mínimo de 128 KiB por arquivo; Archive com 90 dias mínimos e só com Elastic; metadados sempre na Standard. | [Features of Amazon EFS](https://docs.aws.amazon.com/efs/latest/ug/features.html), [Managing storage lifecycle](https://docs.aws.amazon.com/efs/latest/ug/lifecycle-management-efs.html) |
| Ciclo de vida pelo último acesso: IA em 30 dias e Archive em 90 por padrão; volta para a Standard opcional, no primeiro acesso; gravações em arquivos frios passam pela Standard e voltam a esfriar depois de 24 horas. | [Managing storage lifecycle](https://docs.aws.amazon.com/efs/latest/ug/lifecycle-management-efs.html) |
| Replicação contínua para outra Região ou a mesma, com RPO de 15 minutos na maioria dos casos (mais com mais de 100 milhões de arquivos ou arquivos acima de 100 GB que mudam muito); failover e failback. | [Replicating EFS file systems](https://docs.aws.amazon.com/efs/latest/ug/efs-replication.html) |

## FSx for Windows File Server (Fase 3)

| Fato | Fonte |
|---|---|
| SMB 2.0 a 3.1.1, clientes Windows e Linux; AWS Managed Microsoft AD ou AD próprio; sem AD Connector nem Simple AD; domínio não muda depois da criação; acesso do local por Direct Connect ou VPN, não pela internet; backups diários automáticos. | [What is FSx for Windows?](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html), [Working with Microsoft AD](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/aws-ad-integration-fsxW.html) |
| Single-AZ com cerca de 30 minutos de parada na recuperação; Multi-AZ com failover em menos de 30 s, inclusive na AZ fora, e volta automática; clientes Linux não acompanham o failover pelo DNS; Multi-AZ recomendado para produção; HDD não existe no Single-AZ 1. | [Single-AZ and Multi-AZ](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/high-availability-multiAZ.html) |
| SSD para latência e cópias de sombra; HDD para diretórios pessoais; HDD para SSD sim, SSD para HDD não; capacidade só aumenta; desduplicação com economia típica de 50% a 60% (30% a 50% em documentos, 70% a 80% em desenvolvimento). | [Managing storage](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/managing-storage-configuration.html) |
| Cópias de sombra desligadas por padrão; restauração pelo Explorador de Arquivos; limite padrão de 10% do armazenamento; recomendação de menos de 64 cópias e SSD; não substituem backups. | [Shadow copies](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/shadow-copies-fsxW.html) |

## FSx for Lustre (Fase 4)

| Fato | Fonte |
|---|---|
| ML, HPC, vídeo e modelagem financeira; latência abaixo de 1 ms, vários TB/s e milhões de IOPS; clientes Linux; EC2, ECS e EKS; SageMaker AI, Batch e ParallelCluster. | [What is FSx for Lustre?](https://docs.aws.amazon.com/fsx/latest/LustreGuide/what-is.html) |
| Scratch sem replicação, servidor não trocado e erro de I/O nos arquivos do servidor com falha, base de 200 MBps por TiB e rajada de até seis vezes; persistente com replicação na AZ (entre AZs no Intelligent-Tiering) e servidor trocado em minutos; classes SSD, HDD e Intelligent-Tiering. | [Deployment and storage class options](https://docs.aws.amazon.com/fsx/latest/LustreGuide/using-fsx-lustre.html) |
| Associação com repositório de dados: até 8 por sistema de arquivos; importação e exportação automáticas; sem associações no Scratch 1; conflitos de gravação ficam com a aplicação. | [Linking to an S3 bucket](https://docs.aws.amazon.com/fsx/latest/LustreGuide/create-dra-linked-data-repo.html) |

## FSx for NetApp ONTAP e OpenZFS (Fase 5)

| Fato | Fonte |
|---|---|
| ONTAP: NFS, SMB, iSCSI e NVMe; Linux, Windows e macOS; Single-AZ e Multi-AZ; snapshots, clones, SnapMirror e SnapLock; migrar NetApp sem mudar a aplicação. | [What is FSx for ONTAP?](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/what-is-fsx-ontap.html) |
| Camada SSD provisionada e capacity pool elástico; política de tiering por volume; até 65% de economia com compressão e desduplicação em compartilhamentos gerais; recomendação de não passar de 80% de uso da SSD. | [Managing storage capacity](https://docs.aws.amazon.com/fsx/latest/ONTAPGuide/managing-storage-capacity.html) |
| OpenZFS: NFS v3 a v4.2, sem SMB; Linux, Windows e macOS; até 2 milhões de IOPS com centenas de microssegundos; snapshots e clones; Multi-AZ (HA) e Single-AZ (HA) com failover em cerca de 60 s; Single-AZ (non-HA) com recuperação em cerca de 30 minutos. | [What is FSx for OpenZFS?](https://docs.aws.amazon.com/fsx/latest/OpenZFSGuide/what-is-fsx.html) |

## Escolha e caminho de entrada (Fase 6)

| Fato | Fonte |
|---|---|
| Transfer Family: SFTP, FTPS, FTP, AS2 e transferências pelo navegador; destinos S3 e EFS; até 3 AZs; fluxos gerenciados. | [What is AWS Transfer Family?](https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html) |
| Endpoint na VPC interno ou voltado para a internet, com IPs elásticos e security groups; só SFTP e FTPS no voltado para a internet; usuários gerenciados pelo serviço ou provedor personalizado. | [Create a server in a VPC](https://docs.aws.amazon.com/transfer/latest/userguide/create-server-in-vpc.html) |
| FTP sem criptografia, só com endpoint interno na VPC; identidade pelo AWS Managed Microsoft AD ou provedor personalizado (Lambda ou API Gateway). | [Create an FTP-enabled server](https://docs.aws.amazon.com/transfer/latest/userguide/create-server-ftp.html) |
| DataSync: NFS e SMB para EFS e FSx com agente; S3 para EFS e FSx sem agente. | [DataSync locations](https://docs.aws.amazon.com/datasync/latest/userguide/working-with-locations.html) |

## AWS Backup (Fase 7)

| Fato | Fonte |
|---|---|
| Planos com regras; seleção por tags; incrementais; cofres com chave do KMS e política de acesso; conteúdo imutável; backups mantidos mesmo com a origem apagada; cópia entre Regiões e entre contas da organização; lista de serviços cobertos. | [What is AWS Backup?](https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html) |
| Frequência de hora em hora a mensal, ou cron; janela padrão às 0h30, 8 horas para iniciar e 7 dias para terminar; retenção de 1 dia a 100 anos; contínuo de 1 a 35 dias; frio com 90 dias mínimos e retenção 90 dias maior que a transição; recomendação de 8 dias no quente; frio para CloudFormation, DynamoDB com recursos avançados, EBS (Snapshot Archive, backups mensais ou menos frequentes), EFS, SAP HANA, Timestream e VMware. | [Backup plan options](https://docs.aws.amazon.com/aws-backup/latest/devguide/plan-options-and-configuration.html) |
| Contínuo para S3, RDS, Aurora e SAP HANA; cópia entre Regiões e contas para EC2, S3, EBS, RDS, Aurora, EFS, os quatro FSx e outros; sem contínuo no RDS em cluster Multi-AZ; cópia de contínuo vira snapshot. | [Feature availability](https://docs.aws.amazon.com/aws-backup/latest/devguide/backup-feature-availability.html) |
| Cofre logicamente isolado com Vault Lock em conformidade, chave da AWS ou do cliente, compartilhável pelo AWS RAM ou por aprovação de várias pessoas para restaurar de outra conta. | [Logically air-gapped vault](https://docs.aws.amazon.com/aws-backup/latest/devguide/logicallyairgappedvault.html) |
| Teste de restauração agendado, com ponto mais recente ou aleatório, tempo medido, recursos apagados ao fim, custo por teste e controle no Audit Manager. | [Restore testing](https://docs.aws.amazon.com/aws-backup/latest/devguide/restore-testing.html) |

## Preços

- `src/content/pricing/files-prices.json` é gerado por `npm run prices:files` a partir da AWS Price List Bulk API (ofertas AmazonEFS, AmazonFSx, AWSBackup e AWSTransfer), para us-east-1 e sa-east-1, consultada em 22/10/2026.
- Em us-east-1: EFS Standard a US$ 0,30 por GB-mês (One Zone a US$ 0,16), Infrequent Access a US$ 0,016 com vazão Elastic e US$ 0,025 com Bursting ou Provisioned (a Price List traz os dois itens, com descrições próprias), Archive a US$ 0,008; leitura do IA a US$ 0,01 e do Archive a US$ 0,03 por GB; Elastic a US$ 0,03 por GB lido e US$ 0,06 por GB gravado; Provisioned a US$ 6,00 por MiB/s-mês.
- FSx for Windows: SSD a US$ 0,13 (Single-AZ) e US$ 0,23 (Multi-AZ) por GB-mês; HDD a US$ 0,013 e US$ 0,025; vazão a US$ 2,20 e US$ 4,50 por MBps-mês. AWS Backup: backups do EFS a US$ 0,05 no quente e US$ 0,01 no frio por GB-mês. Transfer Family: US$ 0,30 por hora de protocolo e US$ 0,04 por GB.

## Premissas e simplificações da trilha

- **EFS:** a vazão média e o pico resumem a carga; os créditos do Bursting não são simulados minuto a minuto e as leituras não têm o desconto de medição; no Provisioned, a vazão contratada é igual ao pico; a cobrança única da transição entre classes fica de fora; 1 GB vale 1 GiB.
- **FSx:** um sistema de arquivos de uma AZ só fica fora enquanto a AZ estiver fora; a recuperação a partir de backup em outra AZ é outra ação.
- **AWS Backup:** cada recurso tem uma regra; o custo considera só o armazenamento dos backups do EFS, com o tamanho guardado como premissa e a fração no frio proporcional ao tempo de retenção.
- **Escolhas:** a complexidade que desempata as opções é julgamento de arquitetura.

# Trilha Arquitetura e otimização na AWS — conferido em 22/10/2026

O site da documentação da AWS devolve 200 para páginas que não existem; as URLs usadas nos conceitos e nos dois serviços novos do catálogo (AWS Well-Architected Tool e AWS Transform MGN) foram conferidas pelo título da página em 22/10/2026. As páginas `intro.html` e `workloads-improvement-plan.html` do guia da Well-Architected Tool só devolvem o título: o conteúdo usado está em [Workloads](https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html), [Milestones](https://docs.aws.amazon.com/wellarchitected/latest/userguide/milestones.html), [Lenses](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses.html) e [Tool profiles](https://docs.aws.amazon.com/wellarchitected/latest/userguide/profiles.html). A página de princípios do pilar de segurança no guia do pilar também só devolve o título; a usada é a do framework.

## Exame (Geral e Fase 9)

| Fato | Fonte |
|---|---|
| Múltipla escolha com uma certa e três distratores; resposta múltipla com duas ou mais certas entre cinco ou mais; distratores plausíveis para quem tem conhecimento incompleto; em branco conta como errada, sem penalidade por chute; 50 questões pontuadas e 15 não pontuadas, sem identificação; escala de 100 a 1.000, mínimo de 720; modelo compensatório; pesos 30%, 26%, 24% e 20%. | [SAA-C03 exam guide](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html) |
| A lista de serviços do exame traz o AWS Well-Architected Tool e o AWS Application Migration Service (nome antigo do AWS Transform MGN); não traz Elastic Disaster Recovery, Resilience Hub, Fault Injection Service nem Migration Hub. | [In-scope services](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) (conferido em 20/10/2026) |

## Well-Architected Framework e Tool (Fase 1)

| Fato | Fonte |
|---|---|
| Seis pilares: excelência operacional, segurança, confiabilidade, eficiência de desempenho, otimização de custos e sustentabilidade. | [The pillars of the framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html) |
| Princípios gerais: parar de adivinhar a capacidade, testar em escala de produção, automatizar pensando em experimentar, arquiteturas evolutivas, decidir com dados e game days. | [General design principles](https://docs.aws.amazon.com/wellarchitected/latest/framework/general-design-principles.html) |
| Princípios de cada pilar (oito de operação, sete de segurança, cinco de confiabilidade, cinco de desempenho, cinco de custo e seis de sustentabilidade); economia de cerca de 75% com 40 de 168 horas; dois servidores a 30% gastam mais que um a 60%. | [Operação](https://docs.aws.amazon.com/wellarchitected/latest/framework/oe-design-principles.html), [Segurança](https://docs.aws.amazon.com/wellarchitected/latest/framework/sec-design.html), [Confiabilidade](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/design-principles.html), [Desempenho](https://docs.aws.amazon.com/wellarchitected/latest/performance-efficiency-pillar/design-principles.html), [Custo](https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/design-principles.html), [Sustentabilidade](https://docs.aws.amazon.com/wellarchitected/latest/sustainability-pillar/design-principles-for-sustainability-in-the-cloud.html) |
| Riscos altos (HRIs) e médios (MRIs) saem das respostas; são orientações; motivos para não seguir uma boa prática são documentados nas notas; só o dono apaga a carga, com os marcos; compartilhamento com contas, usuários, organização e OUs. | [Workloads](https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html) |
| Marco grava o estado da carga num momento; lente do framework aplicada a toda carga; lentes do catálogo e personalizadas; até 5 por vez e 20 no total; dados guardados ao remover uma lente; perfis priorizam perguntas; sem cobrança própria. | [Milestones](https://docs.aws.amazon.com/wellarchitected/latest/userguide/milestones.html), [Lenses](https://docs.aws.amazon.com/wellarchitected/latest/userguide/lenses.html), [Tool profiles](https://docs.aws.amazon.com/wellarchitected/latest/userguide/profiles.html), [Pricing](https://aws.amazon.com/well-architected-tool/pricing/) |
| Nível de risco de cada boa prática do laboratório `wa-review`: alto em OPS05-BP01, SEC02-BP01, SEC02-BP02, SEC08-BP02, REL05-BP01, REL09-BP01, REL10-BP01, REL13-BP02, PERF03-BP01, COST04-BP01 e COST07-BP01; médio em REL08-BP04, PERF04-BP06 e SUS02-BP01; baixo em COST06-BP03. | Páginas de cada boa prática em `docs.aws.amazon.com/wellarchitected/latest/framework/` (URLs em `src/simulators/wareview/model.ts`) |

## Resiliência (Fase 2)

| Fato | Fonte |
|---|---|
| Degradação controlada (REL05-BP01, risco alto): seguir com a função principal, com exemplos de página parcial, parâmetros padrão e gravações enfileiradas. | [REL05-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_mitigate_interaction_failure_graceful_degradation.html) |
| Planos de dados têm metas de disponibilidade maiores que os de controle; o Auto Scaling na recuperação é dependência do plano de controle; cotas da Região de recuperação precisam permitir a capacidade de produção. | [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html) |
| Produção em pelo menos duas AZs; antipadrão de várias Regiões quando várias AZs bastam; dependências entre Regiões aumentam o risco. | [REL10-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_fault_isolation_multiaz_region_system.html) |

## Recuperação de desastres (Fase 3)

| Fato | Fonte |
|---|---|
| Em ordem crescente de custo e decrescente de RPO e RTO: backup e restauração (RPO em horas, RTO de até 24 horas; PITR pode levar o RPO a cerca de 5 minutos), pilot light (minutos e dezenas de minutos), warm standby (segundos e minutos; capacidade total é hot standby) e ativo-ativo (perto de zero e potencialmente zero); não usar estratégia mais rígida que a meta; REL13-BP02 com risco alto. | [REL13-BP02](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html) |
| Pilot light não atende sem ação prévia; warm standby já atende reduzido; conta separada por Região; replicação contínua não protege contra corrupção; estratégias de gravação write global, write local e por partição. | [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html) |

## Desempenho (Fase 4)

| Fato | Fonte |
|---|---|
| Armazenamento pela característica do dado e do acesso; antipadrão de ficar num tipo de banco por experiência; cache e réplicas para cargas de leitura; risco alto. | [PERF03-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_data_use_purpose_built_data_store.html) |
| Local pela necessidade de rede, borda (CloudFront, Global Accelerator), Local Zones, Wavelength e placement groups; risco médio. | [PERF04-BP06](https://docs.aws.amazon.com/wellarchitected/latest/framework/perf_networking_choose_workload_location_network_requirements.html) |

## Segurança (Fase 5)

| Fato | Fonte |
|---|---|
| Credenciais temporárias no lugar de chaves longas, roles para máquinas e federação para pessoas; risco alto. | [SEC02-BP02](https://docs.aws.amazon.com/wellarchitected/latest/framework/sec_identities_unique.html) |
| Criptografia em repouso por padrão (inclusive a padrão de novos volumes EBS); risco alto. | [SEC08-BP02](https://docs.aws.amazon.com/wellarchitected/latest/framework/sec_protect_data_rest_encrypt.html) |

## Custos (Fase 6)

| Fato | Fonte |
|---|---|
| Candidatas a reduzir: uso máximo de CPU e memória abaixo de 40% em quatro semanas; risco baixo. | [COST06-BP03](https://docs.aws.amazon.com/wellarchitected/latest/framework/cost_type_size_number_resources_metrics.html) |
| Análise do modelo de compra por componente; Spot até 90%; Savings Plans para EC2, Lambda e Fargate; desligar EC2 e RDS fora do horário reduz 70% ou mais; risco alto. | [COST07-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/cost_pricing_model_analysis.html) |
| Rastrear recursos por tags, com dono, função e data de desativação; risco alto. | [COST04-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/cost_decomissioning_resources_track.html) |
| Entre AZs, cobrado na entrada e na saída; entre Regiões, só a saída da origem; entrada da internet sem cobrança. | [Understanding data transfer charges](https://docs.aws.amazon.com/cur/latest/userguide/cur-data-transfers-charges.html) |
| Mesma AZ sem cobrança; NAT Gateway cobra o processamento por GB; endpoints de gateway sem cobrança de transferência. | [Overview of Data Transfer Costs](https://aws.amazon.com/blogs/architecture/overview-of-data-transfer-costs-for-common-architectures/) |
| 100 GB por mês de saída para a internet gratuitos, somando serviços e Regiões. | [EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/) |

## Migração (Fase 7)

| Fato | Fonte |
|---|---|
| Os 7 Rs e seus casos de uso (retire com 90 dias sem conexões e aplicações zumbis abaixo de 5%; retain; rehost; relocate; repurchase; replatform com o exemplo do SQL Server para o RDS; refactor como a mais complexa); em migrações grandes, rehost, relocate e replatform primeiro. | [About the migration strategies](https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html) |
| AWS Transform MGN: novo nome do Application Migration Service; replicação contínua em nível de bloco; corte em minutos; templates de replicação, lançamento e pós-lançamento; aplicações e ondas; recomendado para rehost. | [What Is AWS Transform MGN?](https://docs.aws.amazon.com/mgn/latest/ug/what-is-application-migration-service.html), [When to choose](https://aws.amazon.com/application-migration-service/when-to-choose-aws-mgn/) |
| Estados do servidor (Not ready, Ready for testing, Test in progress, Ready for cutover, Cutover in progress, Cutover complete); terminar instâncias de teste; finalizar o corte encerra a replicação. | [Migration lifecycle](https://docs.aws.amazon.com/mgn/latest/ug/lifecycle.html) |

## Padrões (Fase 8)

| Fato | Fonte |
|---|---|
| Strangler fig: proxy na frente do monólito, troca gradual, camada anticorrupção, proxy como possível ponto único de falha (API Gateway Multi-AZ reduz o risco), exige acesso ao código. O Migration Hub Refactor Spaces não aceita novos clientes desde 07/11/2025 e não é citado no conteúdo. | [Strangler fig pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/strangler-fig.html) |
| Infraestrutura imutável, canário e blue/green; risco médio. | [REL08-BP04](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_tracking_change_management_immutable_infrastructure.html) |
| In-place (de uma vez ou em ondas), blue/green, canário, linear e all at once; rolling mais rápido que blue/green, sem isolamento. | [Deployment strategies](https://docs.aws.amazon.com/whitepapers/latest/introduction-devops-aws/deployment-strategies.html), [Rolling deployments](https://docs.aws.amazon.com/whitepapers/latest/overview-deployment-options/rolling-deployments.html) |

## Preços

- `src/content/pricing/transfer-prices.json` é gerado por `npm run prices:transfer` a partir da AWS Price List Bulk API (oferta AWSDataTransfer de us-east-1 e oferta global AmazonCloudFront), consultada em 22/10/2026: entrada da internet US$ 0; saída para a internet US$ 0,09 por GB (primeira faixa paga); entre AZs US$ 0,01 por GB em cada sentido; saída para us-east-2 US$ 0,01 e para us-west-2, sa-east-1 e eu-west-1 US$ 0,02 por GB; da Região para o CloudFront US$ 0; saída do CloudFront nos Estados Unidos US$ 0,085 por GB. O script falha se um item cobrado a zero passar a ter preço.
- Os labs reaproveitam as tabelas de Computação (EC2, Savings Plans e Lambda), Bancos de dados (RDS) e Redes (NAT Gateway e endpoints).

## Premissas e simplificações da trilha

- **Recuperação:** cada estratégia vale pelo pior caso da faixa (24 horas e 24 horas; 15 minutos e 1 hora; 1 minuto e 15 minutos; perto de zero); warm standby com um quarto da frota; custo só de instâncias On-Demand, réplica Single-AZ e armazenamento dos backups.
- **Dimensionamento:** cada tamanho abaixo tem metade das vCPUs e da memória e dobra o pico, que precisa ficar abaixo de 80%; Spot com o desconto premissa da trilha de Computação.
- **Transferência:** primeira faixa, sem os 100 GB gratuitos; NAT já existente; endpoint de interface novo cobrado por hora em duas AZs.
- **Leitura de questões:** enunciados do AWS Quest; quais restrições cada alternativa cumpre e a ordem no requisito decisivo são julgamento de arquitetura.

# Revisão do banco de questões — conferido em 24/10/2026

Fatos novos usados na revisão editorial do banco de questões (ver `docs/REVISAO-BANCO-DE-QUESTOES.md`).

| Fato | Fonte | Efeito no conteúdo |
|---|---|---|
| Separar cargas e ambientes (produção, desenvolvimento, teste) em contas; a conta é uma fronteira forte de isolamento para segurança, cobrança e acesso; Organizations e Control Tower; risco alto. | [SEC01-BP01](https://docs.aws.amazon.com/wellarchitected/latest/framework/sec_securely_operate_multi_accounts.html) | `q.arq.sec-accounts` |
| Modo proativo do Config avalia propriedades antes da implantação e não corrige nem impede a criação. Só duas regras gerenciadas aceitam o modo proativo hoje: `eip-attached` e `subnet-auto-assign-public-ip-disabled` (tipos AWS::EC2::EIP e AWS::EC2::Subnet). Todas aceitam o modo detectivo. | [Components of a rule](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config-rules.html), [Managed rules by evaluation mode](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-evaluation-mode.html) | `q.gov.config-proactive` passou a usar sub-redes em vez de buckets S3. |
| t3.micro: 2 vCPUs e 1 GiB; t3.large: 2 vCPUs e 8 GiB; m5.large: 2 vCPUs e 8 GiB; c5.large: 2 vCPUs e 4 GiB. | [General purpose](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html), [Compute optimized](https://docs.aws.amazon.com/ec2/latest/instancetypes/co.html) | `q.cmp.burst-low` |
| O Amazon Data Lifecycle Manager automatiza criação, retenção e exclusão de snapshots do EBS e de AMIs com EBS; não gerencia backups de outros serviços. | [Automate backups with Amazon Data Lifecycle Manager](https://docs.aws.amazon.com/ebs/latest/userguide/snapshot-lifecycle.html) | Distrator de `q.fil.backup-central`. |
| No Transfer Family, IPs elásticos e security groups são recursos do endpoint hospedado na VPC (interno ou voltado para a internet); o voltado para a internet aceita só SFTP e FTPS; servidores com endpoint público podem ser convertidos para o endpoint na VPC. | [Create a server in a VPC](https://docs.aws.amazon.com/transfer/latest/userguide/create-server-in-vpc.html) | `q.fil.transfer-endpoint`. |
