# AWS Quest

Plataforma web gamificada para aprender AWS **fazendo**: simulações, decisões, consequências e revisão espaçada. Todo o conteúdo está em português do Brasil, com os nomes oficiais dos serviços em inglês. O objetivo é preparar para a certificação **AWS Certified Solutions Architect – Associate (SAA-C03)**.

Jogue em **https://thisthiago.github.io/saa-c03-journey/**. O site é publicado no GitHub Pages a cada push na branch `main`, pelo workflow `.github/workflows/pages.yml`, depois de passar no lint e nos testes.

Três trilhas estão disponíveis:

- **AWS Foundations — Infraestrutura Global, Segurança e Suporte**: Regiões, AZs, Local Zones, Wavelength, Outposts e borda; planos de suporte; modelo de responsabilidade compartilhada. Três fases e o desafio final **Architecture Foundations**. É a trilha sugerida para quem está começando.
- **S3 Expedition — Domínio do Armazenamento AWS**: 11 fases e o desafio final **Projeto Atlas**. Recomenda (sem exigir) a AWS Foundations.
- **IAM e Access Management — Autenticação, autorização e governança de acesso**: usuário raiz, MFA, políticas, avaliação de políticas, roles e STS, PassRole e External ID, federação (IAM Identity Center, Directory Service, Cognito), ABAC, Organizations, SCPs, RCPs, permissions boundaries, Control Tower e IAM Access Analyzer. Oito fases e o desafio final **Arquitetura de Acesso**. Recomenda (sem exigir) a AWS Foundations.

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
| `npm run prices:update` | Atualiza a tabela de preços pela AWS Price List API |

O build usa caminhos relativos e rotas com `#`. Por isso, `dist/` pode ser servido de qualquer hospedagem estática, inclusive de um bucket S3.

## O que tem dentro

- **25 fases** (22 fases e 3 desafios finais), **98 missões** e **283 atividades avaliadas**.
- **218 conceitos**, cada um com referências à documentação oficial, e **624 itens de revisão espaçada**.
- **Banco de 106 questões de simulado** (55 da IAM, 34 da S3 e 17 da Foundations), no formato do exame: cada uma mostra a dificuldade, o conceito avaliado e o domínio, e explica todas as alternativas. Dá para treinar com a explicação na hora ou fazer um simulado cronometrado, com resultado por domínio e por conceito.
- **67 conquistas**.
- **8 tipos de interação**: decisão com justificativa, classificação, associação, ordenação, predição, estimativa, investigação e laboratório.
- **22 simuladores**:
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
  - escolha da solução de identidade.
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
