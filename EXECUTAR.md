A plataforma tem quatro trilhas jogáveis: **AWS Foundations** (3 fases e o desafio final **Architecture Foundations**), **S3 Expedition** (11 fases e o desafio final **Projeto Atlas**), **IAM e Access Management** (8 fases e o desafio final **Arquitetura de Acesso**) e **Computação na AWS** (9 fases e o desafio final **Arquitetura de Computação**). Typecheck, lint e build passam sem erros; os 296 testes unitários, de conteúdo e de componente e os 155 testes E2E também.

## O que foi implementado
- **Plataforma extensível**:
  - motor de jogo em TypeScript puro: XP, níveis, domínio por conceito, revisão espaçada, desbloqueio por dependências, conquistas e progresso salvo no navegador, com exportar e importar;
  - para criar uma trilha nova, basta registrar um módulo de conteúdo, sem mexer no motor nem nas telas.
- **Conteúdo**: 134 missões, 395 atividades avaliadas, 299 conceitos (cada um com links para a documentação oficial), 842 itens de revisão, 89 conquistas e um banco de 171 questões de simulado.
- **IAM e Access Management**: usuário raiz, credenciais, MFA, anatomia e avaliação de políticas, roles e STS, PassRole, Roles Anywhere, External ID, Identity Center, Directory Service, Cognito, ABAC, Organizations, SCPs, RCPs, boundaries, Control Tower e Access Analyzer. Simuladores novos: motor de políticas (construtor com JSON ao vivo e laboratório de camadas), AssumeRole (cadeia de confiança), organização com SCPs, auditoria de credenciais e escolha da solução de identidade.
- **Computação na AWS**: EC2, tipos de instância, EBS, opções de compra, Elastic Load Balancing, Auto Scaling, Lambda, contêineres (ECS, EKS, Fargate, ECR), Batch, Elastic Beanstalk e ambientes híbridos. Simuladores novos, com preços reais da AWS Price List API (`npm run prices:compute`): escolha de instâncias, volumes EBS, plano de compra, balanceadores, Auto Scaling ao longo de um dia, concorrência da Lambda e escolha da computação.
- **AWS Foundations**: Regiões, AZs, Local Zones, Wavelength, Outposts e borda; planos de suporte vigentes (com os antigos marcados como em descontinuação); responsabilidade compartilhada por serviço. Seis simuladores novos: Regiões, AZs, CloudFront, escolha da infraestrutura, suporte e matriz de responsabilidade.
- **Banco de questões** (Revisão, "Abrir o banco de questões"): 171 questões no formato do exame, com dificuldade, conceito e domínio no enunciado e explicação de cada alternativa. Filtros por trilha, conceito, dificuldade, domínio e situação; treino com explicação na hora; simulado com cronômetro, marcação para revisar e correção comentada. Os erros trazem o conceito de volta para a revisão. No Codex, cada conceito com questões tem um link para elas.
- **Desafio final**: 8 etapas em que as decisões cruzam entre si. Por exemplo, replicar sem ter ligado o versionamento gera um risco apontado no relatório.
  - O relatório traz uma rubrica com 6 dimensões, as decisões corretas, os erros com consequências, os riscos e os conceitos a revisar.
  - Esses conceitos entram na fila de revisão na hora.
  - Para aprovar: 70% no geral e pelo menos 50% em cada dimensão.
- **Documentação**: README, `docs/ARQUITETURA.md`, `docs/CONTEUDO.md` e `docs/VERIFICACAO-DE-CONTEUDO.md` (cada fato com fonte e data de consulta).

## Principais decisões técnicas
- **Respostas calculadas, não escritas à mão**: as respostas das predições, as faturas e as comparações saem dos simuladores. Os testes de conteúdo exigem que toda predição tenha exatamente uma resposta certa, que todo laboratório comece abaixo de 70% e que a solução de referência chegue a 100%.
- **Configuração inválida é recusada inteira**, como na AWS. Uma regra de lifecycle, replicação ou notificação com erro faz o simulador mostrar que nenhuma regra está valendo. O chefe da Fase 6 é construído em cima disso.
- **Preços reais**: vêm da AWS Price List API, numa tabela com data, e aparecem sempre como estimativa (primeira faixa de preço, sem nível gratuito nem impostos).
- **Pacote dividido**: conteúdo e bibliotecas ficam em arquivos separados (cerca de 120 kB e 110 kB compactados; a trilha de computação, 117 kB), e as telas carregam sob demanda.

## Como executar
```bash
npm install
npm run dev     # http://localhost:5173
npm test        # testes unitários, de conteúdo e de componentes
npm run e2e     # Playwright (rode antes: npx playwright install chromium)
```

## Interações que funcionam
- **Atividades**: decisão com justificativa, classificação, associação, ordenação, predição, estimativa e investigação.
- **Laboratórios**: Regiões, AZs, CloudFront, infraestrutura, suporte, responsabilidade, bucket, custos, acesso/IAM/KMS, versionamento, lifecycle, replicação, eventos, Requester Pays, Storage Gateway, transferência, arquitetura, construtor de políticas, camadas de política, cadeia de confiança, organização, auditoria de credenciais, solução de identidade, instâncias, volumes, compra, balanceador, Auto Scaling, Lambda e escolha da computação.
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