# Plano de implementação: módulo de Segurança ("Segurança e proteção de dados na AWS")

Plano para o módulo de segurança do AWS Quest, escrito em 20/10/2026 e implementado em 22/10/2026, com as opções recomendadas da seção 2 (tarefa agendada pelo usuário). Diferenças em relação ao plano: o mapa ficou com quatro colunas em x = 90, 270, 630 e 815 e altura de 840, com a Fase 7 e a Fase 8 na segunda coluna; os labs `secrets`, `certs` e `findings` usam um motor genérico de laboratório em grade (`simulators/shared/grid.ts`); o lab `kms` reaproveita o motor de políticas e acrescenta os grants; o Secrets Manager já estava no catálogo, e o Security Hub aparece como um serviço do catálogo que cobre o Security Hub e o Security Hub CSPM; foram 36 missões, 82 atividades, 54 conceitos novos, 20 conquistas e 32 questões. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura, e dos planos de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md), [Integração e mensageria](PLANO-IMPLEMENTACAO-MODULO-INTEGRACAO-E-MENSAGERIA.md), [Monitoramento e governança](PLANO-IMPLEMENTACAO-MODULO-MONITORAMENTO-E-GOVERNANCA.md) e [Arquitetura e otimização](PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md).

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O domínio 1 do exame, "Design Secure Architectures", vale 30% da nota e é o maior dos quatro. A trilha IAM cobre a tarefa 1.1 (acesso). Esta trilha cobre o que falta das tarefas 1.2 (cargas e aplicações seguras) e 1.3 (controles de segurança dos dados).
- O território `seguranca` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'active'` por causa da trilha IAM. Ele ainda lista AWS KMS e AWS Secrets Manager como serviços previstos.
- Três planos contam com esta trilha e apontam para ela:
  - o de [Bancos de dados](PLANO-IMPLEMENTACAO-MODULO-BANCO-DE-DADOS.md), para criptografia e rotação de segredos;
  - o de [Arquitetura e otimização](PLANO-IMPLEMENTACAO-MODULO-ARQUITETURA-E-OTIMIZACAO.md), na fase 5;
  - o de [Redes](PLANO-IMPLEMENTACAO-MODULO-REDES.md), como alternativa para a proteção de borda.
- Já estão em [services.ts](../src/content/catalog/services.ts), no território `seguranca`: `aws.kms`, `aws.macie`, `aws.cognito`, `aws.iam-identity-center`, `aws.directory-service`, `aws.ram`, `aws.organizations` e `aws.control-tower`.
- Outras trilhas já ensinam parte do tema, e esta trilha **não repete** esses pontos:
  - a S3 Expedition ensina SSE-S3, SSE-KMS, DSSE-KMS, SSE-C, criptografia no cliente, bucket keys, Object Lock e o Macie para dados no S3;
  - a trilha IAM ensina a key policy do KMS na avaliação de políticas, Cognito (user pool e identity pool), Identity Center, Directory Service e RAM;
  - a trilha de Computação ensina a criptografia do EBS e o IMDSv2.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais):
  - `kms.key-policy`, `macie.sensitive-data`, `s3.sse-kms`, `s3.dsse-kms`, `s3.bucket-keys`, `s3.default-encryption`, `s3.client-side-encryption` e `s3.object-lock`;
  - `cognito.user-pool`, `cognito.identity-pool`, `fed.identity-center` e `fed.directory-service`;
  - `ebs.encryption`.

  Antes de escrever cada fase, procurar no código outros conceitos de criptografia e de detecção já declarados.
- Simuladores que já existem e podem ser reaproveitados: o motor de políticas em `policy/` (key policy, grants e políticas de recurso), `org/` (políticas da organização), `architecture/` (desafio final) e `responsibility/` (modelo de responsabilidade compartilhada).

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html) e nas tarefas do [domínio 1](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain1.html).

| Categoria | Serviços |
|---|---|
| **Security, Identity, and Compliance** (que esta trilha ensina) | AWS Artifact, AWS Certificate Manager (ACM), AWS CloudHSM, Amazon Detective, Amazon GuardDuty, Amazon Inspector, AWS KMS, Amazon Macie (aprofunda), AWS Secrets Manager e AWS Security Hub |
| **Security, Identity, and Compliance** (ensinados em outras trilhas) | IAM, IAM Identity Center, Cognito, Directory Service e RAM (trilha IAM); WAF, Shield, Network Firewall e Firewall Manager (plano de Redes) |

O que as tarefas do domínio 1 pedem e esta trilha cobre:
- **Tarefa 1.2:**
  - segurança da configuração e das credenciais da aplicação;
  - serviços de segurança e seus casos de uso (o guia cita Cognito, GuardDuty e Macie);
  - ameaças vindas de fora da AWS (o guia cita DDoS e injeção de SQL);
  - integrar serviços para proteger aplicações (o guia cita Shield, WAF, Identity Center e Secrets Manager).
- **Tarefa 1.3:**
  - governança e acesso aos dados;
  - retenção e classificação de dados;
  - criptografia e gestão de chaves;
  - criptografia em repouso (KMS) e em trânsito (ACM com TLS);
  - políticas de acesso às chaves;
  - rotação de chaves e renovação de certificados;
  - alinhar a tecnologia a exigências de conformidade.

Faltam no catálogo e entram nesta trilha: ACM, CloudHSM, Secrets Manager, GuardDuty, Inspector, Detective, Security Hub e Artifact.

**Mudança de nome a tratar:** a página "What is" do Security Hub, consultada em 20/10/2026, se chama "Introduction to AWS Security Hub CSPM" e descreve o **AWS Security Hub CSPM** (Cloud Security Posture Management). A lista do exame diz só "AWS Security Hub". A fase 7 confere a relação atual entre os dois nomes antes de escrever qualquer coisa.

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como Computação | 8 fases, juntando a fase 8 com a 9 |
| Proteção de borda (WAF, Shield, Network Firewall, Firewall Manager) | Fica na fase 9 do plano de Redes, como aquele plano recomenda; aqui a fase 8 trata das ameaças (DDoS, injeção de SQL) e reaproveita os conceitos de Redes | Sai de Redes e é ensinada aqui |
| ACM (certificados e TLS) | Entra aqui (fase 4), porque a tarefa 1.3 pede renovação de certificados; o plano de Redes passa a só citar o ACM ao falar de HTTPS | Fica na fase 9 de Redes, como está hoje |
| Parameter Store | A comparação Secrets Manager × Parameter Store entra aqui (fase 3); o plano de Monitoramento e governança ensina o Parameter Store como capacidade do Systems Manager e cita esta fase | A comparação fica só em Monitoramento e governança |
| Preços | Preços reais da Price List API para KMS e Secrets Manager; GuardDuty, Inspector e Security Hub como premissa do cenário, porque a cobrança depende do volume de eventos analisados | Tudo como premissa do cenário |

**Atenção:** as decisões sobre ACM e Parameter Store mudam os planos de Redes e de Monitoramento e governança. As notas de cada um já foram ajustadas para apontar para cá, mas a escolha final é do usuário.

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations, a IAM e Access Management e a S3 Expedition, sem exigir.
- Entra em `MODULES` depois das trilhas que já existirem quando ela for implementada.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `security`; trilha `security.aws-security` ("Segurança e proteção de dados na AWS", subtítulo "Chaves, segredos, certificados, detecção e conformidade").
- Território `seguranca`, glifo `shield`, `recommends: ['foundations.aws-foundations', 'identity.iam-access', 'storage.s3-expedition']`.
- Prefixo das fases: `sec.f0N`. Prefixos dos conceitos novos: `kms.*` (além do `kms.key-policy` que já existe), `hsm.*`, `secret.*`, `acm.*`, `gd.*`, `insp.*`, `det.*`, `shub.*`, `artifact.*` e `sec.*`. O prefixo `srm.*` já pertence ao modelo de responsabilidade compartilhada e não é usado para segredos.
- Pasta `src/content/modules/security/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | Criptografia e KMS | criptografia em repouso × em trânsito, chave simétrica × assimétrica, criptografia em envelope (chave de dados protegida por uma chave do KMS), chaves da AWS × gerenciadas pela AWS × gerenciadas pelo cliente, alias, key policy (reaproveita `kms.key-policy`), quem pode usar × quem pode administrar a chave | `kms`: dizer se cada pedido de cifrar ou decifrar é aceito, olhando key policy, política IAM e grant |
| **F2** | KMS avançado e CloudHSM | rotação automática e sob demanda, material de chave importado, chaves multi-Região, uso entre contas, grants, cota de requisições e bucket keys (reaproveita `s3.bucket-keys`), CloudHSM (HSM dedicado, cluster em várias AZs, quem controla as chaves), quando escolher cada um | `kms` com rotação e multi-Região; decisão KMS × CloudHSM |
| **F3** | Segredos da aplicação | credencial no código × variável de ambiente × serviço de segredos, Secrets Manager (rotação automática com Lambda, integração com RDS, réplica em outra Região), Parameter Store `SecureString`, quando usar cada um, role da instância e da task em vez de chave fixa (reaproveita Computação) | `secrets`: acompanhar uma rotação passo a passo e dizer qual versão a aplicação lê em cada momento |
| **F4** | Certificados e TLS | TLS em trânsito, ACM (certificado público × importado, validação por DNS × por e-mail, renovação automática e quando ela não acontece), Região do certificado para CloudFront, onde o TLS termina (ALB, CloudFront, API Gateway) e onde continua até o destino | `certs`: dizer quais certificados vão vencer sem renovar e o que muda para cada um |
| **F5** | Detecção de ameaças | GuardDuty (fontes que ele analisa, tipos de achado, proteção de S3, EKS, RDS e malware), Inspector (vulnerabilidades em EC2, imagens no ECR e funções Lambda), Detective (investigar a origem de um achado) e a diferença entre detectar, avaliar e investigar | `findings`: ler achados e dizer qual serviço gerou cada um |
| **F6** | Classificação e retenção de dados | classificar dados por sensibilidade, Macie (reaproveita `macie.sensitive-data`; descoberta automática e trabalhos), retenção e imutabilidade (reaproveita `s3.object-lock`; cita o Vault Lock do AWS Backup), governança do acesso aos dados, ciclo de vida para descarte | Classificação e decisão; investigação "onde estão os dados pessoais?" |
| **F7** | Postura de segurança e conformidade | Security Hub (padrões como AWS Foundational Security Best Practices e CIS, controles, achados de outros serviços num só lugar, agregação entre Regiões e contas), dependência do AWS Config, AWS Artifact (relatórios de conformidade e acordos), responsabilidade compartilhada na conformidade (reaproveita `srm.*`) | `findings` com Security Hub; decisão "o que prova a conformidade?" |
| **F8** | Ameaças externas e resposta | DDoS, injeção de SQL e cross-site scripting, defesa em camadas (reaproveita os conceitos de WAF e Shield do plano de Redes), resposta automática a achados (achado do GuardDuty, regra do EventBridge, correção por Lambda ou Systems Manager), isolar uma instância comprometida | Ordenação da resposta a um incidente; decisão de qual camada barra cada ataque |
| **F9** | Escolhendo o serviço de segurança | quadro "qual serviço responde": GuardDuty × Inspector × Macie × Detective × Security Hub × Config × CloudTrail; KMS × CloudHSM; Secrets Manager × Parameter Store; ACM × certificado importado | `sec-chooser`: requisito para serviço |
| **Final** | Auditoria de Segurança | integração | Clínica fictícia com dados de pacientes, uma auditoria marcada e um alerta de acesso suspeito, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F1.
- F4 exige F1.
- F7 exige F5 e F6.
- F8 exige F5.
- F9 exige F2, F3, F4, F7 e F8.
- O final exige as nove.
- F5 e F6 só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1, F5 e F6.
- x=300: F2, F3, F4 e F8.
- x=560: F7 e F9.
- x=820: final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Auditoria de Segurança

- Clínica fictícia com dados de pacientes no S3 e num banco relacional, uma aplicação web exposta à internet, uma auditoria de conformidade marcada e um alerta de acesso suspeito numa instância.
- Etapas do `architecture`:
  1. Chaves e criptografia em repouso.
  2. Segredos da aplicação e do banco.
  3. Certificados e criptografia em trânsito.
  4. Detecção de ameaças.
  5. Classificação e retenção dos dados.
  6. Postura e provas de conformidade.
  7. Proteção contra ataques externos.
  8. Resposta automática ao incidente.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. O peso maior fica em Seguro. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 34 missões, 90 atividades, 60 conceitos novos, 5 laboratórios novos, 20 conquistas (`ach.sec-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

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
| `kms/` | Pedidos de `Encrypt`, `Decrypt`, `GenerateDataKey` e de administração sobre uma chave. A decisão sai da key policy, das políticas IAM e dos grants, avaliados pelo motor de `policy/`. Também mostra a criptografia em envelope (a chave de dados cifra o arquivo; o KMS só cifra a chave de dados), o efeito da rotação (dados antigos continuam legíveis) e o que muda numa chave multi-Região. |
| `secrets/` | Linha do tempo de uma rotação no Secrets Manager: as etapas da função de rotação, os rótulos de versão e qual valor a aplicação recebe em cada momento, inclusive se ela guardar o segredo em cache. Os nomes das etapas e dos rótulos só entram depois de conferidos. |
| `certs/` | Lista de certificados (emitidos pelo ACM ou importados, validação por DNS ou e-mail, Região, recurso associado) e quais renovam sozinhos, quais vencem e onde cada um pode ser usado. |
| `findings/` | Achados fictícios no formato simplificado de cada serviço (GuardDuty, Inspector, Macie, Config) e a visão consolidada do Security Hub. O jogador diz a origem de cada achado, a gravidade e a ação certa. |
| `secchooser/` | Escolha do serviço, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. Exemplos de requisito: "a chave precisa ficar num HSM dedicado", "girar a senha do banco a cada 30 dias", "descobrir CPFs em buckets", "alertar sobre chamadas de API de um IP malicioso", "provar conformidade com o PCI DSS". |

Reaproveitado sem alteração: `architecture/` no desafio final, o motor de políticas (predição `policy`) para key policies e grants, `org/` para políticas da organização e `responsibility/` na fase 7.

### Preços

- Novo script `scripts/fetch-security-prices.mjs` (`npm run prices:security`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/security-prices.json` com a data de publicação.
- Itens previstos: KMS (chave gerenciada pelo cliente por mês e requisições), Secrets Manager (segredo por mês e chamadas de API) e CloudHSM (HSM por hora).
- GuardDuty, Inspector, Macie e Security Hub ficam como premissa do cenário, porque a cobrança depende do volume analisado e de faixas difíceis de reproduzir com fidelidade.
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução. Regiões: us-east-1 e sa-east-1, como em Computação.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda, além da lista do exame, das tarefas do domínio 1 e do nome atual da página do Security Hub CSPM. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | nomes atuais dos tipos de chave (AWS owned, AWS managed, customer managed); chaves simétricas e assimétricas e o que cada uma permite; limite de tamanho do `Encrypt` direto e por que se usa `GenerateDataKey`; política padrão da chave; permissões de uso × de administração |
| F2 | rotação automática (período padrão, faixa permitida, rotação sob demanda); o que acontece com dados cifrados antes da rotação; material importado (sem rotação automática, expiração); chaves multi-Região (o que é replicado, o que não é); grants; cotas de requisições por segundo; CloudHSM (modelo de cluster, validação FIPS atual, quem tem acesso às chaves); key store personalizado |
| F3 | rotação no Secrets Manager (gatilho, função de rotação, etapas, rótulos de versão); rotação gerenciada para RDS e outros bancos; réplica do segredo em outra Região; Parameter Store (níveis padrão e avançado, `SecureString`, limites); preço de cada um |
| F4 | certificados públicos × importados no ACM; validação por DNS × e-mail; quando a renovação automática acontece e quando falha; certificados para CloudFront na Região us-east-1; serviços integrados ao ACM; certificados exportáveis (se existirem hoje); AWS Private CA (só citar, se não estiver no escopo) |
| F5 | fontes de dados do GuardDuty (CloudTrail, VPC Flow Logs, DNS) e planos de proteção atuais; GuardDuty não exige ligar Flow Logs para analisá-los; Inspector (o que escaneia hoje, varredura contínua); Detective (pré-requisitos, relação com GuardDuty); administrador delegado na organização para os três |
| F6 | Macie (descoberta automática × trabalhos, identificadores gerenciados e personalizados, onde publica os achados); Object Lock (reaproveitar a verificação da S3 Expedition); Vault Lock do AWS Backup (modos e carência) |
| F7 | situação atual do Security Hub × Security Hub CSPM; padrões disponíveis; dependência do Config; agregação entre Regiões; AWS Artifact (relatórios e acordos, quem pode baixar) |
| F8 | o que o Shield Standard e o Advanced protegem (reaproveitar a verificação do plano de Redes); regras gerenciadas do WAF para injeção de SQL e cross-site scripting; integração dos achados do GuardDuty com o EventBridge |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e mudanças de nome recentes: só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `seguranca` continua `active` e deixa de ter `plannedServices`. O resumo do território ganha "certificados, detecção e conformidade".
- **`content/catalog/services.ts`:** novos serviços `aws.acm`, `aws.cloudhsm`, `aws.secrets-manager`, `aws.guardduty`, `aws.inspector`, `aws.detective`, `aws.security-hub` e `aws.artifact`. Cada um com `docsUrl` conferido. O nome do Security Hub segue a situação verificada na fase 7.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): `shield` e `key` já existem. Avaliar `lock`, `scan` e `badge-check` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES` ganha `securityModule` e `CONTENT_VERSION` muda.
- **`engine/types.ts`:** nenhuma mudança prevista.
- **`package.json`:** script `prices:security`. **`vite.config.ts`:** chunk `content-security`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Dois módulos no mesmo território:** `seguranca` passa a ter duas trilhas (IAM e esta). Conferir como a Base e o Codex mostram um território com mais de uma trilha; `armazenamento` passa pela mesma situação no plano de [Arquivos e backup](PLANO-IMPLEMENTACAO-MODULO-ARQUIVOS-E-BACKUP.md).

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `kms` |
| **M3** | F3 e F4, com `secrets` e `certs` |
| **M4** | F5 e F6, com `findings` |
| **M5** | F7 e F8 |
| **M6** | F9 e desafio final, com `secchooser`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:security   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e               # capturas em screenshots/
npm run dev               # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations, IAM e S3 Expedition;
- **Codex:** não duplica os conceitos reaproveitados (`kms.key-policy`, `s3.*`, `cognito.*`, `fed.*`, `macie.*`);
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **simulador do KMS:** reproduz os exemplos de key policy e de grant da documentação;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Sobreposição com S3, IAM, Redes e Monitoramento:** criptografia do S3, key policy, Cognito, WAF, Shield, Config e Parameter Store já são ou serão ensinados em outro lugar. Reaproveitar os conceitos em vez de redeclarar, e citar a fase de origem.
- **Serviços que mudam de nome e de formato:** Security Hub e Security Hub CSPM, planos de proteção do GuardDuty e alvos do Inspector mudam com frequência. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Trilha "de lista":** serviços de detecção tendem a virar associação de nomes. Cada fase precisa de um laboratório ou investigação em que o jogador use o serviço para responder uma pergunta real, como "de onde veio este achado?" ou "esta chave ainda decifra os arquivos antigos?".
- **Fidelidade do simulador do KMS:** a avaliação de key policy com grants e condições tem muitos casos. O `kms` usa só os casos conferidos na documentação e declara os limites no painel "Simplificações".
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
