# AWS Quest

Plataforma web gamificada para aprender AWS **fazendo**: simulações, decisões, consequências e revisão espaçada. Todo o conteúdo está em português do Brasil, com os nomes oficiais dos serviços em inglês. O objetivo é preparar para a certificação **AWS Certified Solutions Architect – Associate (SAA-C03)**.

Jogue em **https://thisthiago.github.io/saa-c03-journey/**. O site é publicado no GitHub Pages a cada push na branch `main`, pelo workflow `.github/workflows/pages.yml`, depois de passar no lint e nos testes.

Seis trilhas estão disponíveis:

- **AWS Foundations — Infraestrutura Global, Segurança e Suporte**: Regiões, AZs, Local Zones, Wavelength, Outposts e borda; planos de suporte; modelo de responsabilidade compartilhada. Três fases e o desafio final **Architecture Foundations**. É a trilha sugerida para quem está começando.
- **S3 Expedition — Domínio do Armazenamento AWS**: 11 fases e o desafio final **Projeto Atlas**. Recomenda (sem exigir) a AWS Foundations.
- **IAM e Access Management — Autenticação, autorização e governança de acesso**: usuário raiz, MFA, políticas, avaliação de políticas, roles e STS, PassRole e External ID, federação (IAM Identity Center, Directory Service, Cognito), ABAC, Organizations, SCPs, RCPs, permissions boundaries, Control Tower e IAM Access Analyzer. Oito fases e o desafio final **Arquitetura de Acesso**. Recomenda (sem exigir) a AWS Foundations.
- **Computação na AWS — EC2, escalabilidade, serverless e contêineres**: EC2, tipos de instância, EBS e instance store, opções de compra (Savings Plans, RIs, Spot), Elastic Load Balancing, Auto Scaling, Lambda, ECS, EKS, Fargate e ECR, Batch, Elastic Beanstalk e ambientes híbridos. Os labs de custo usam preços reais da AWS. Nove fases e o desafio final **Arquitetura de Computação**. Recomenda (sem exigir) a AWS Foundations.
- **Bancos de dados na AWS — Relacionais, NoSQL, cache e análise**: RDS (classes, armazenamento, Multi-AZ, réplicas, backups e RDS Proxy), Aurora (réplicas, endpoints, Global Database, serverless, I/O-Optimized, Backtrack e clones), DynamoDB (chaves, capacidade, índices, Streams, TTL, DAX, tabelas globais e transações), ElastiCache, DocumentDB, Neptune, Keyspaces, Redshift, segurança e backup dos bancos e migração com o DMS. Os labs de custo usam preços reais da AWS. Nove fases e o desafio final **Arquitetura de Dados**. Recomenda (sem exigir) a AWS Foundations e a Computação.
- **Monitoramento e governança na AWS — Métricas, auditoria, conformidade, automação e custos**: CloudWatch (métricas, alarmes, agente e logs), Logs Insights e X-Ray, CloudTrail, AWS Config, Systems Manager (Session Manager, Patch Manager e Parameter Store), CloudFormation e Service Catalog, Control Tower e políticas da organização, Budgets, Cost Explorer e tags de custo, Trusted Advisor, Health e Service Quotas. Os labs de custo usam preços reais da AWS. Nove fases e o desafio final **Central de Operações**. Recomenda (sem exigir) a AWS Foundations e a IAM e Access Management.

> Projeto educacional independente, sem afiliação com a Amazon Web Services. Não usa conta, credenciais nem recursos AWS reais: tudo é simulado no navegador.

## Como executar

Requisito: Node.js 20.19 ou superior.

```bash
npm install
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
```

| Comando | O que faz |
|---|---|
| `npm run build` | Verifica os tipos e gera o site estático em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Só a verificação de tipos |
| `npm run lint` | Lint (oxlint) |
| `npm test` | Testes unitários, de conteúdo e de componentes (Vitest) |
| `npx playwright install chromium && npm run e2e` | Testes ponta a ponta e capturas de tela (em `screenshots/`) |
| `npm run prices:update` | Atualiza a tabela de preços do S3 pela AWS Price List API |
| `npm run prices:compute` | Atualiza a tabela de preços da computação (EC2, Savings Plans, Lambda, Fargate e ELB) |
| `npm run prices:database` | Atualiza a tabela de preços dos bancos de dados (RDS, Aurora, DynamoDB, ElastiCache e Redshift) |
| `npm run prices:governance` | Atualiza a tabela de preços do monitoramento (CloudWatch, CloudTrail e Config) |

O build usa caminhos relativos e rotas com `#`. Por isso, `dist/` pode ser servido de qualquer hospedagem estática, inclusive de um bucket S3.

## O que tem dentro

- **55 fases** (49 fases e 6 desafios finais), **214 missões** e **691 atividades avaliadas**.
- **444 conceitos**, cada um com referências à documentação oficial, e **1.376 itens de revisão espaçada**.
- **Banco de 284 questões de simulado** (65 da Computação, 64 do Monitoramento e governança, 55 da IAM, 49 dos Bancos de dados, 34 da S3 e 17 da Foundations), no formato do exame: cada uma mostra a dificuldade, o conceito avaliado e o domínio, e explica todas as alternativas. Dá para treinar com a explicação na hora ou fazer um simulado cronometrado, com resultado por domínio e por conceito.
- **131 conquistas**.
- **8 tipos de interação**: decisão com justificativa, classificação, associação, ordenação, predição, estimativa, investigação e laboratório.
- **45 simuladores**:
  - escolha de Região (fatos verificados + premissas do cenário);
  - resiliência entre AZs (derrubar uma AZ ou a Região);
  - fluxo do CloudFront (POP, Regional Edge Cache e origem);
  - escolha da infraestrutura (Região, AZs, Local Zone, Wavelength, Outposts, borda);
  - planos de suporte (recursos, tempos de resposta e preço);
  - matriz de responsabilidade compartilhada;
  - explorador de bucket;
  - custos, com preços reais versionados;
  - acesso (IAM, bucket policy, Block Public Access, ACL e KMS);
  - versionamento;
  - lifecycle;
  - replicação;
  - eventos;
  - Requester Pays;
  - Storage Gateway;
  - transferência de dados;
  - avaliação de arquitetura;
  - motor de políticas do IAM (Deny explícito, RCP, SCP, recurso, identidade, boundary e session policy, com duas avaliações entre contas), usado pelo construtor de políticas com JSON ao vivo e pelo laboratório de camadas;
  - AssumeRole (trust policy, duração, MFA, External ID e encadeamento);
  - organização com SCPs por nível;
  - auditoria de credenciais;
  - escolha da solução de identidade;
  - escolha de instâncias (nome do tipo, burstable e custo com preços reais);
  - volumes EBS (limites por tipo, validação e custo);
  - plano de compra (On-Demand, Savings Plans, RIs, Spot e Capacity Reservations);
  - balanceadores (regras do ALB, cross-zone e escolha entre ALB, NLB e GWLB);
  - Auto Scaling ao longo de um dia (políticas, ações agendadas, término);
  - concorrência da Lambda (reservada, provisionada, throttling e custo);
  - escolha da computação;
  - dimensionamento do RDS (classe, Single-AZ ou Multi-AZ, gp3 ou io2, com preços reais);
  - alta disponibilidade do RDS (Multi-AZ, cluster Multi-AZ, réplicas, outra Região, backup e RDS Proxy diante de falhas);
  - custo do Aurora (Standard ou I/O-Optimized);
  - capacidade do DynamoDB (unidades, partição quente, sob demanda ou provisionado);
  - cache na frente do banco (estratégia, TTL, motor e nó do ElastiCache);
  - escolha do banco (relacional, NoSQL, recursos do DynamoDB, bancos especializados e análise);
  - segurança do banco (rede, criptografia, credenciais, backup e snapshots);
  - plano de migração com o DMS;
  - alarmes do CloudWatch (períodos, M de N e dados ausentes);
  - filtros de métrica e retenção dos logs;
  - trilhas do CloudTrail (onde cada evento é encontrado);
  - regras do Config (conformidade e remediação);
  - atualização de stacks do CloudFormation (o que muda, é substituído ou removido);
  - orçamentos e tags de alocação de custo;
  - Systems Manager (nós gerenciados e portas de entrada);
  - escolha do serviço de operação.
- **Progressão**:
  - XP só por ações avaliadas; níveis;
  - domínio por conceito e revisão espaçada (Leitner), alimentados também pelo banco de questões;
  - desbloqueio por dependências;
  - progresso salvo no `localStorage`, com exportação e importação.

## Documentação

- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): camadas, motor de jogo e como estender a plataforma.
- [docs/CONTEUDO.md](docs/CONTEUDO.md): estrutura do conteúdo e como escrever fases, atividades e laboratórios.
- [docs/VERIFICACAO-DE-CONTEUDO.md](docs/VERIFICACAO-DE-CONTEUDO.md): fatos conferidos na documentação oficial (com fonte e data), premissas dos cenários e simplificações.

## Stack

Vite 8, React 19, TypeScript, React Router (rotas com hash) e Zustand. CSS Modules com design tokens (tema escuro e tema claro). Vitest e Testing Library para os testes unitários e de componentes; Playwright para os testes ponta a ponta. Não há backend.
