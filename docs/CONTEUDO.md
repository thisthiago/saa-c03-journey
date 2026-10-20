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

`src/content/pricing/s3-prices.json` é gerado por `npm run prices:update`, a partir da AWS Price List API (ofertas AmazonS3, AmazonS3GlacierDeepArchive e AWSDataTransfer; Regiões us-east-1 e sa-east-1, mais o S3 Standard de sete Regiões em `standardByRegion`, usado na comparação entre Regiões). Os preços dos planos de suporte ficam em `simulators/support/model.ts`, com data e fonte, porque não vêm da Price List API. O script falha se faltar algum preço e nunca inventa valores. A interface sempre indica a data da tabela e que se trata de estimativa (primeira faixa, sem nível gratuito nem impostos).
