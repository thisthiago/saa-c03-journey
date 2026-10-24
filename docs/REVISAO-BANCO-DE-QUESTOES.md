# Revisão editorial do banco de questões

Acompanhamento da revisão do banco de questões de simulado (`src/content/modules/*/questions*.ts`, tela `#/revisao/questoes`). O escopo é só o banco: fases, missões, atividades, labs e desafios finais ficam de fora. Os fatos novos usados na revisão ficam em `docs/VERIFICACAO-DE-CONTEUDO.md`.

Início em 24/10/2026, com 483 questões.

## Regras da revisão

- **Nunca mudam:** o id da questão (o progresso salvo usa o id), a quantidade de corretas e o formato (4 alternativas com 1 correta, ou 5 ou mais com 2 ou mais corretas).
- **Mudam só com motivo registrado aqui:** `concept` e `related` (alimentam o domínio e a revisão espaçada por conceito), `domain` (o histórico passa a contar no domínio novo) e `difficulty`.
- **Livres:** texto, ordem e ids das alternativas. A tela embaralha as alternativas, e nada disso é salvo.
- **Enunciado:** cenário quando ele ajuda a decidir, requisitos decisivos explícitos, critério da decisão em negrito e nada que não pese na escolha.
- **Alternativas:** soluções comparáveis, com tamanho e detalhe parecidos (a correta não pode se denunciar por ser a mais longa ou a mais qualificada). Distratores plausíveis, sem atribuir características falsas aos serviços.
- **`why`:** na correta, o requisito que ela atende; nos distratores, quando a opção valeria, que requisito ela não atende e a confusão que representa.
- **Explicação:** requisito decisivo, característica que o atende, por que é melhor que as outras e o princípio reutilizável.
- **Dificuldade:** 1 identifica uma distinção fundamental; 2 compara serviços ou configurações plausíveis; 3 pesa várias restrições ou trade-offs.
- **Fatos:** os já registrados na VERIFICACAO são reaproveitados; fato novo é conferido na documentação oficial e registrado lá com data. Sem confirmação, a questão é sinalizada para revisão manual.

## Diagnóstico inicial (24/10/2026)

| Problema | Questões |
|---|---|
| Correta mais de 1,6 vez mais longa que a média dos distratores | 222 (em 305 das 430 de resposta única, a correta é a mais longa) |
| Explicação com menos de 110 caracteres | 128 (Arquitetura 34, Arquivos 24, Análise 21, Segurança 21, Integração 20, Redes 7, Computação 1) |
| Duas ou mais `why` com menos de 40 caracteres | 72 |
| Distrator descartável ("Nada", "Não mudar nada", "Esperar") | 22 detectados automaticamente |
| Questão de memorização ("Quais afirmações estão corretas?") | 9 |
| Pergunta genérica sem critério destacado | 44 candidatas |

Distribuição por domínio: d1 172 (35,6%), d2 139 (28,8%), d3 94 (19,5%), d4 78 (16,1%). O exame pesa 30%, 26%, 24% e 20%: desempenho (d3) e custo (d4) estão abaixo do peso.

Distribuição por dificuldade: 131 fáceis, 240 médias, 112 difíceis.

## Andamento

| Lote | Questões | Preservadas | Reescritas | Sinalizadas |
|---|---|---|---|---|
| Piloto (24/10/2026) | 24 | 4 | 20 | 0 |
| Lote 1, Arquitetura (24/10/2026) | 38 | 0 | 38 | 0 |

### Piloto

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.ana.partition-key` | 3.5 | Reescrita | — | Critério explícito; distratores de partição comparáveis; explicação completa. |
| `q.ana.lake-practices` | 4.1 | Reescrita | dificuldade 3 → 2 | Distrator de JSON trocado pela Standard-IA (confusão entre custo de guardar e de consultar). |
| `q.arq.sec-accounts` | 1.1 | Reescrita | — | Requisito "pela estrutura" explícito; distratores de VPC e EventBridge. |
| `q.arq.opt-rightsizing` | 4.2 | Reescrita | dificuldade 1 → 2 | Cenário com prazo longo; distratores Savings Plan, Spot e Auto Scaling no lugar de "Não mudar nada". |
| `q.cmp.burst-low` | 4.2 | Reescrita | — | Tipos de instância reais com vCPU e memória conferidas; GPU e família R descartáveis removidas. |
| `q.cmp.sg-facts` | 1.2 | Reescrita | — | Era memorização; virou análise de um security group concreto. |
| `q.db.standby-reads` | 3.3 | Reescrita parcial | — | Distrator de backup trocado pelo RDS Proxy. |
| `q.db.cluster` | 2.2 | Preservada | — | |
| `q.fil.efs-encryption` | 1.3 | Reescrita | — | A explicação falava só de prevenção; agora explica o requisito decisivo. |
| `q.fil.efs-access-point` | 1.3 | Reescrita | — | Explicação e `why` mais completos. |
| `q.fnd.region-selection` | 3.4 | Reescrita | — | Era um critério genérico; virou escolha entre três Regiões com premissas. |
| `q.fnd.ha-vs-dr` | 2.2 | Reescrita | — | Distratores "Nada" e plano de suporte trocados por backup na mesma Região e CRR parcial. |
| `q.gov.config-proactive` | 1.3 | Reescrita | dificuldade 3 → 2 | Era memorização com buckets S3, mas nenhuma regra gerenciada de S3 aceita o modo proativo; agora usa sub-redes. |
| `q.gov.config-recording-cost` | 4.1 | Preservada | — | |
| `q.iax.key-rotation` | 1.1 | Reescrita | — | A correta se denunciava pelo tamanho. |
| `q.iax.group-principal` | 1.1 | Reescrita parcial | — | Distrator de MFA trocado por uma confusão com trust policy. |
| `q.int.decouple` | 2.1 | Reescrita | — | Distratores síncronos comparáveis; explicação com o princípio do desacoplamento. |
| `q.int.visibility` | 2.1 | Reescrita parcial | — | Explicação completa e `why` dos distratores. |
| `q.net.vpn-ecmp` | 3.4 | Preservada | — | |
| `q.net.dx-encryption` | 1.3 | Preservada | — | |
| `q.sec.kms-admin-decrypt` | 1.3 | Reescrita | — | Distrator de classe de armazenamento trocado por um deny no IAM. |
| `q.sec.kms-envelope` | 1.3 | Reescrita | — | Alternativas equilibradas e explicação do envelope. |
| `q.s3x.expedited` | 3.1 | Reescrita | domínio d2 → d3 | Recuperar um objeto arquivado no prazo é desempenho de armazenamento, não resiliência. |
| `q.s3x.versioning` | 2.2 | Reescrita parcial | — | Transfer Acceleration e SSE-KMS trocados por bucket policy e replicação. |

Métricas das 24 questões, antes e depois:
- Correta 1,6 vez mais longa: de 13 para 0.
- Explicação curta: de 6 para 0.
- Tamanho médio da explicação: de 166 para cerca de 400 caracteres.

### Lote 1: Arquitetura

As duas questões do piloto (`q.arq.sec-accounts` e `q.arq.opt-rightsizing`) não entraram de novo. O "—" na tarefa indica questão sobre o framework ou o exame, sem tarefa própria no guia.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.arq.wa-pillars` | — | Reescrita | — | Distratores viraram listas de seis itens plausíveis (escalabilidade, conformidade, domínios do exame). |
| `q.arq.wa-milestone` | — | Reescrita | — | Requisito de comparar explícito; explicação completa. |
| `q.arq.wa-lens` | — | Reescrita | — | Distrator "remover a lente do framework" saiu (ela fica em toda carga); entrou a lente personalizada como opção de mais esforço. |
| `q.arq.wa-tradeoff` | 4.4 | Reescrita | — | Explicação do trade-off entre pilares. |
| `q.arq.wa-principles` | 2.2 | Reescrita | — | Texto padronizado (Escolha DUAS.). |
| `q.arq.res-legacy` | 2.2 | Reescrita | — | Distrator de instância maior ganhou snapshots, para ficar plausível. |
| `q.arq.res-static` | 2.2 | Reescrita | — | Explicação com a conta e o conceito de plano de controle. |
| `q.arq.res-degrade` | 2.2 | Reescrita | — | Explicação de dependência forte e fraca e backoff. |
| `q.arq.res-spof` | 2.2 | Reescrita | — | Distrator "Nada muda" virou uma confusão plausível. |
| `q.arq.dr-pilot` | 2.2 | Reescrita | — | Alternativas com o mesmo nível de detalhe; explicação pelo RPO e pelo RTO. |
| `q.arq.dr-warm` | 2.2 | Reescrita | — | Diferença entre pilot light e warm standby explicada. |
| `q.arq.dr-backup` | 4.4 | Reescrita | — | A correta era 10 vezes mais longa que os distratores. |
| `q.arq.dr-corruption` | 2.2 | Reescrita | — | Distrator de capacidade de escrita trocado pelo DynamoDB Streams. |
| `q.arq.dr-hadr` | 2.2 | Reescrita | — | Distrator "Não fazer nada" virou uma confusão plausível. |
| `q.arq.perf-cache` | 3.4 | Reescrita | — | Explicação de cache de borda e cache de dados. |
| `q.arq.perf-replica` | 3.3 | Reescrita | — | Distrator de CloudFront trocado por aumentar a instância; Multi-AZ especificado com um standby (o cluster Multi-AZ tem standbys legíveis). |
| `q.arq.perf-udp` | 3.4 | Reescrita | — | Distrator de instâncias maiores trocado por Elastic IPs. |
| `q.arq.perf-purpose` | 3.3 | Reescrita | — | Distrator "tudo no S3" trocado por fotos no DynamoDB (limite de 400 KB por item). |
| `q.arq.sec-role` | 1.1 | Reescrita | — | Distrator do usuário raiz trocado pelo Secrets Manager. |
| `q.arq.sec-layers` | 1.2 | Reescrita | — | Distrator sem relação com segurança trocado pela criptografia em repouso. |
| `q.arq.sec-people` | 1.1 | Reescrita | — | Explicação do princípio e do Session Manager. |
| `q.arq.opt-pricing` | 4.2 | Reescrita | — | Explicação por carga. |
| `q.arq.opt-schedule` | 4.2 | Reescrita | — | Distrator de mudar de Região trocado por Spot. |
| `q.arq.opt-nat` | 4.4 | Reescrita | — | Distrator de sub-rede pública trocado pelo endpoint de interface, que tem custo. |
| `q.arq.opt-transfer` | 4.4 | Reescrita | dificuldade 3 → 2 | Lembrar regras de cobrança não pesa várias restrições. |
| `q.arq.opt-serverless` | 4.2 | Reescrita | — | Distrator de instâncias maiores trocado por reduzir a uma instância. |
| `q.arq.mig-rehost` | 2.2 | Reescrita | — | Alternativas com o mesmo nível de detalhe. |
| `q.arq.mig-strategy` | 4.1 | Reescrita | — | Distrator "replatform para os dois" trocado por um que acerta metade. |
| `q.arq.mig-replatform` | 2.2 | Reescrita | — | Explicação do replatform. |
| `q.arq.mig-relocate` | 2.2 | Reescrita | — | Distrator "Não existe SaaS" trocado por repurchase de 300 aplicações. |
| `q.arq.mig-snow` | 3.1 | Reescrita | — | Explicação cita o Data Transfer Terminal e a restrição ao Enterprise Support. |
| `q.arq.pat-strangler` | 2.1 | Reescrita | — | Explicação do padrão e da disponibilidade do proxy. |
| `q.arq.pat-bluegreen` | 2.1 | Reescrita | — | Distrator de SSH trocado pelo canário. |
| `q.arq.pat-canary` | 2.1 | Reescrita | dificuldade 3 → 2 | Identificar a estratégia não pesa várias restrições. |
| `q.arq.pat-events` | 2.1 | Reescrita | domínio d3 → d2 | Acrescentar consumidores sem mudar o emissor é desacoplamento (tarefa 2.1). Distrator de servidor único trocado por fila SQS única. |
| `q.arq.pat-multiregion` | 2.2 | Reescrita | — | Aurora Global Database descrito com o write forwarding. |
| `q.arq.exam-format` | — | Reescrita | — | Explicação com a escala de 100 a 1.000. |
| `q.arq.exam-decisive` | — | Reescrita | — | Distrator do script na estação trocado por ECS agendado. |

Métricas das 40 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 30 para 0.
- Correta mais longa que todos os distratores: de 31 para 19 das 34 de resposta única (as que sobraram ficam até 25% acima do maior distrator).
- Explicação curta: de 34 para 0.
- Tamanho médio da explicação: de 91 para 472 caracteres.

## Como retomar

O padrão editorial do piloto foi aprovado em 24/10/2026. Os próximos lotes seguem esta ordem, um módulo por lote (Computação, Governança e IAM em dois lotes cada):

| Ordem | Módulo | Arquivo(s) | Situação |
|---|---|---|---|
| 1 | Arquitetura | `architecture/questions.ts` | feito |
| 2 | Arquivos | `files/questions.ts` | pendente |
| 3 | Análise | `analytics/questions.ts` | pendente |
| 4 | Integração | `integration/questions.ts` | pendente |
| 5 | Segurança | `security/questions.ts` | pendente |
| 6 | S3 | `storage/questions.ts` | pendente |
| 7 | Foundations | `foundations/questions.ts` | pendente |
| 8 | Redes | `network/questions.ts`, `network/questions-f06-f09.ts` | pendente |
| 9 | Bancos de dados | `database/questions.ts` | pendente |
| 10 | Computação | `compute/questions.ts` | pendente |
| 11 | Governança | `governance/questions*.ts` | pendente |
| 12 | IAM | `identity/questions.ts` | pendente |

Cada lote termina com: comparação com o retrato inicial (ids, conceito, domínio, dificuldade, número de opções e de corretas), `npm run typecheck`, `npm run lint`, `npx vitest run src/content src/engine`, atualização desta tabela e um commit local do arquivo do módulo e deste documento. Nada vai para o remoto sem pedido.

As questões do piloto já revisadas são puladas nos lotes.

## Observações fora do escopo

- O simulado sorteia sem os pesos dos domínios (`src/engine/exam.ts`, `simuladoSample`).
- A atividade `gov.f04.m2.a6` (fase 4 da Governança) pergunta sobre a avaliação proativa das propriedades de um bucket. Nenhuma regra gerenciada de S3 aceita o modo proativo hoje; só uma regra personalizada faria isso. Vale revisar numa tarefa das fases.
- `docs/ARQUITETURA.md` descreve os testes do banco de forma desatualizada.
