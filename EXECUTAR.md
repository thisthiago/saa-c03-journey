A plataforma tem doze trilhas jogáveis: **AWS Foundations** (3 fases e o desafio final **Architecture Foundations**), **S3 Expedition** (11 fases e o desafio final **Projeto Atlas**), **IAM e Access Management** (8 fases e o desafio final **Arquitetura de Acesso**), **Computação na AWS** (9 fases e o desafio final **Arquitetura de Computação**), **Bancos de dados na AWS** (9 fases e o desafio final **Arquitetura de Dados**), **Monitoramento e governança na AWS** (9 fases e o desafio final **Central de Operações**), **Redes na AWS** (9 fases e o desafio final **Projeto de Rede**), **Análise de dados e serviços de IA na AWS** (9 fases e o desafio final **Plataforma de Dados**), **Segurança e proteção de dados na AWS** (9 fases e o desafio final **Auditoria de Segurança**), **Integração e mensageria na AWS** (9 fases e o desafio final **Arquitetura Orientada a Eventos**), **Arquivos e backup na AWS** (7 fases e o desafio final **A Mudança do Escritório**) e **Arquitetura e otimização na AWS** (9 fases e o desafio final **A Revisão Well-Architected**). Typecheck, lint e build passam sem erros; os 553 testes unitários, de conteúdo e de componente e os testes E2E também.

## O que foi implementado
- **Plataforma extensível**:
  - motor de jogo em TypeScript puro: XP, níveis, domínio por conceito, revisão espaçada, desbloqueio por dependências, conquistas e progresso salvo no navegador, com exportar e importar;
  - para criar uma trilha nova, basta registrar um módulo de conteúdo, sem mexer no motor nem nas telas.
- **Conteúdo**: 430 missões, 1.217 atividades avaliadas, 769 conceitos (cada um com links para a documentação oficial), 2.221 itens de revisão, 246 conquistas e um banco de 483 questões de simulado.
- **IAM e Access Management**: usuário raiz, credenciais, MFA, anatomia e avaliação de políticas, roles e STS, PassRole, Roles Anywhere, External ID, Identity Center, Directory Service, Cognito, ABAC, Organizations, SCPs, RCPs, boundaries, Control Tower e Access Analyzer. Simuladores novos: motor de políticas (construtor com JSON ao vivo e laboratório de camadas), AssumeRole (cadeia de confiança), organização com SCPs, auditoria de credenciais e escolha da solução de identidade.
- **Computação na AWS**: EC2, tipos de instância, EBS, opções de compra, Elastic Load Balancing, Auto Scaling, Lambda, contêineres (ECS, EKS, Fargate, ECR), Batch, Elastic Beanstalk e ambientes híbridos. Simuladores novos, com preços reais da AWS Price List API (`npm run prices:compute`): escolha de instâncias, volumes EBS, plano de compra, balanceadores, Auto Scaling ao longo de um dia, concorrência da Lambda e escolha da computação.
- **Bancos de dados na AWS**: RDS, alta disponibilidade (Multi-AZ, réplicas, backups, RDS Proxy), Aurora, DynamoDB (modelagem e recursos avançados), ElastiCache e bancos especializados, Redshift, segurança e backup dos bancos e migração com o DMS. Simuladores novos, com preços reais da AWS Price List API (`npm run prices:database`): dimensionamento do RDS, alta disponibilidade diante de falhas, custo do Aurora, capacidade do DynamoDB, cache na frente do banco, escolha do banco, segurança do banco e plano de migração.
- **Monitoramento e governança na AWS**: CloudWatch (métricas, alarmes, agente), logs e X-Ray, CloudTrail, AWS Config, Systems Manager, CloudFormation e Service Catalog, Control Tower e políticas da organização, custos e orçamentos, Trusted Advisor, Health e Service Quotas. Simuladores novos, com preços reais da AWS Price List API para CloudWatch, CloudTrail e Config (`npm run prices:governance`): alarmes, filtros e retenção de logs, trilhas, regras do Config, atualização de stacks, orçamentos e tags de custo, Systems Manager e escolha do serviço de operação.
- **Redes na AWS**: VPC e endereçamento, rotas e saída para a internet, security groups e network ACLs, peering e Transit Gateway, endpoints e PrivateLink, VPN, Direct Connect e Client VPN, Route 53, CloudFront e Global Accelerator, WAF, Shield, Network Firewall e Firewall Manager. Simuladores novos, com preços reais da AWS Price List API para NAT Gateway, endpoints, Transit Gateway e VPN (`npm run prices:network`): plano de endereços, tabelas de rotas, caminho de um pacote, topologias entre VPCs, caminho até os serviços, conectividade híbrida, respostas do Route 53 e escolha da solução de rede. As capturas de tela desta trilha cobrem só o desktop; tablet e celular ficam para uma etapa própria.
- **Análise de dados e serviços de IA na AWS**: data lake no S3, Glue, Athena, Lake Formation, EMR, Kinesis Data Streams, Data Firehose, MSK, Data Exchange e AppFlow, OpenSearch, Quick Sight e os serviços prontos de IA, mídia e front-end. Simuladores novos, com preços reais da AWS Price List API para Athena e Glue (`npm run prices:analytics`): formato, compressão e partição do data lake, permissões do Lake Formation, cluster do EMR com retomada de Spot e escolhas de ingestão, de serviço pronto de IA e de solução de dados. O Elastic Transcoder aparece com o selo de serviço encerrado (13/11/2025). As capturas de tela desta trilha cobrem só o desktop.
- **Segurança e proteção de dados na AWS**: KMS e CloudHSM, Secrets Manager e Parameter Store, ACM, GuardDuty, Inspector e Detective, Macie, Object Lock e Vault Lock, Security Hub e Security Hub CSPM, AWS Artifact, regras gerenciadas do WAF e resposta automática a incidentes. Simuladores novos: uso de uma chave do KMS (key policy, IAM e grants), rotação de um segredo passo a passo, inventário de certificados do ACM, triagem de achados e escolha do serviço de segurança. A tabela de preços de KMS, Secrets Manager e CloudHSM vem da AWS Price List API (`npm run prices:security`). As capturas de tela desta trilha cobrem só o desktop.
- **Integração e mensageria na AWS**: SQS (padrão e FIFO, Lambda lendo da fila), SNS, EventBridge (padrões, entre contas, replay, Scheduler e Pipes), Step Functions, API Gateway, Kinesis Data Streams, Data Firehose, MSK, Amazon MQ, AppFlow e os padrões de saga, idempotência e buffer de escrita. Simuladores novos: fila do SQS com visibilidade e DLQ, fila FIFO, filtros do SNS e padrões do EventBridge, Retry e Catch do Step Functions, limites do API Gateway, shards do Kinesis e escolha do serviço de integração. A tabela de preços vem da AWS Price List API (`npm run prices:integration`). As capturas de tela desta trilha cobrem só o desktop.
- **Arquivos e backup na AWS**: Amazon EFS (Regional e One Zone, mount targets, access points, IAM, criptografia, vazão, classes, ciclo de vida e replicação), FSx for Windows File Server, FSx for Lustre, FSx for NetApp ONTAP, FSx for OpenZFS, a escolha entre EFS, FSx, S3 e EBS, AWS Transfer Family e AWS Backup (planos, cofres, frio, contínuo, cópias, Vault Lock, cofre isolado e teste de restauração), com preços reais da AWS Price List.
- **Arquitetura e otimização na AWS**: Well-Architected Framework e Tool, arquiteturas resilientes, as quatro estratégias de recuperação de desastres, alto desempenho, segurança em camadas, otimização de custos (inclusive a transferência de dados, com `npm run prices:transfer`), migração com os 7 Rs e o AWS Transform MGN, padrões de arquitetura e de implantação e a leitura das questões do exame. Simuladores novos: revisão Well-Architected, estratégia de recuperação, recurso de desempenho, dimensionamento e compra, custo da transferência, plano de migração e leitura de questões. As capturas de tela desta trilha cobrem só o desktop.
- **AWS Foundations**: Regiões, AZs, Local Zones, Wavelength, Outposts e borda; planos de suporte vigentes (com os antigos marcados como em descontinuação); responsabilidade compartilhada por serviço. Seis simuladores novos: Regiões, AZs, CloudFront, escolha da infraestrutura, suporte e matriz de responsabilidade.
- **Banco de questões** (Revisão, "Abrir o banco de questões"): 483 questões no formato do exame, com dificuldade, conceito e domínio no enunciado e explicação de cada alternativa. Filtros por trilha, conceito, dificuldade, domínio e situação; treino com explicação na hora; simulado com cronômetro, marcação para revisar e correção comentada. Os erros trazem o conceito de volta para a revisão. No Codex, cada conceito com questões tem um link para elas.
- **Desafio final**: 8 etapas em que as decisões cruzam entre si. Por exemplo, replicar sem ter ligado o versionamento gera um risco apontado no relatório.
  - O relatório traz uma rubrica com 6 dimensões, as decisões corretas, os erros com consequências, os riscos e os conceitos a revisar.
  - Esses conceitos entram na fila de revisão na hora.
  - Para aprovar: 70% no geral e pelo menos 50% em cada dimensão.
- **Documentação**: README, `docs/ARQUITETURA.md`, `docs/CONTEUDO.md` e `docs/VERIFICACAO-DE-CONTEUDO.md` (cada fato com fonte e data de consulta).

## Principais decisões técnicas
- **Respostas calculadas, não escritas à mão**: as respostas das predições, as faturas e as comparações saem dos simuladores. Os testes de conteúdo exigem que toda predição tenha exatamente uma resposta certa, que todo laboratório comece abaixo de 70% e que a solução de referência chegue a 100%.
- **Configuração inválida é recusada inteira**, como na AWS. Uma regra de lifecycle, replicação ou notificação com erro faz o simulador mostrar que nenhuma regra está valendo. O chefe da Fase 6 é construído em cima disso.
- **Preços reais**: vêm da AWS Price List API, numa tabela com data, e aparecem sempre como estimativa (primeira faixa de preço, sem nível gratuito nem impostos).
- **Pacote dividido**: conteúdo e bibliotecas ficam em arquivos separados (cerca de 120 kB e 110 kB compactados; a trilha de computação, 117 kB; a de bancos de dados, 95 kB; a de monitoramento e governança, 140 kB; a de redes, 80 kB; a de análise de dados, 74 kB; a de segurança, 65 kB; a de integração, 55 kB; a de arquivos e backup, 51 kB; a de arquitetura e otimização, 78 kB), e as telas carregam sob demanda.

## Como executar
```bash
npm install
npm run dev     # http://localhost:5173
npm test        # testes unitários, de conteúdo e de componentes
npm run e2e     # Playwright (rode antes: npx playwright install chromium)
```

## Interações que funcionam
- **Atividades**: decisão com justificativa, classificação, associação, ordenação, predição, estimativa e investigação.
- **Laboratórios**: Regiões, AZs, CloudFront, infraestrutura, suporte, responsabilidade, bucket, custos, acesso/IAM/KMS, versionamento, lifecycle, replicação, eventos, Requester Pays, Storage Gateway, transferência, arquitetura, construtor de políticas, camadas de política, cadeia de confiança, organização, auditoria de credenciais, solução de identidade, instâncias, volumes, compra, balanceador, Auto Scaling, Lambda, escolha da computação, dimensionamento do RDS, alta disponibilidade do RDS, chaves do DynamoDB, escolha do banco, cache, banco exposto e migração, alarmes, filtros de logs, trilhas, regras do Config, atualização de stacks, orçamentos e escolha do serviço de operação.
- **Teclado**: tudo o que se arrasta também funciona só com o teclado, e há testes de componente para isso.
- **Progresso**: revisão espaçada, treino livre, banco de questões e simulados, Codex, Dossiê com exportar/importar/resetar, tema claro e escuro, e celular.

## O que ainda é simulação simplificada
Cada tela lista as suas simplificações. As principais:
- **Acesso (S3)**: não modela SCPs, permission boundaries nem Access Points; esses ficam no motor de políticas da trilha IAM.
- **Motor de políticas**: não modela NotPrincipal, políticas de VPC endpoint, grants do KMS nem operadores de conjunto.
- **Lifecycle**: as regras agem no dia exato; na AWS a execução é assíncrona.
- **Eventos**: cada evento é entregue uma vez e na hora; na AWS pode haver duplicatas.
- **Replicação**: o tempo não é simulado; o RTC aparece só como prazo garantido.
- **Transferência**: os prazos do Direct Connect e do Data Transfer Terminal são premissas dos cenários, não dados da AWS.
- **AZs**: falha total e failover instantâneo, sem Auto Scaling.
- **Borda**: um POP e um Regional Edge Cache, TTL fixo, latências como premissa.
- **Regiões e suporte**: latências e gastos mensais são premissas dos cenários.
- **Desafios finais**: a rubrica é pedagógica, com pesos definidos pelo projeto.

## Correções em relação ao plano
- O RTC replica **99,9%** dos objetos em até 15 minutos, não 99,99%. O conteúdo usa o valor da documentação.
- A regra antiga de "30 dias antes de ir para Standard-IA" não está na documentação atual e **não** foi aplicada.
- **Status atuais confirmados**:
  - Snow Family: sem novos clientes.
  - FSx File Gateway: sem novos clientes desde 28/10/2024.
  - Data Transfer Terminal: hoje só para clientes Enterprise Support.

## Pendências
- **Outras trilhas**: os outros territórios aparecem no mapa como "Em planejamento". Em Segurança e identidade, KMS e Secrets Manager aparecem como previstos e podem reaproveitar o motor de políticas.
- **Desafio final**: as 8 etapas reaproveitam as decisões das fases anteriores, mas não abrem os laboratórios completos dentro de cada etapa.
- **Simulado em andamento**: não é salvo. Recarregar ou sair da página no meio descarta as respostas; só o resultado final entra no progresso.
- **Celular**: no toque, arrastar foi substituído por "tocar no item e depois no destino".
- **Commits**: nenhum. O repositório git existe, mas sem commits, porque você não pediu.

As capturas de tela de todos os laboratórios, em celular e desktop, estão em `screenshots/`.