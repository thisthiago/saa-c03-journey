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

## Como retomar

O padrão editorial do piloto foi aprovado em 24/10/2026. Os próximos lotes seguem esta ordem, um módulo por lote (Computação, Governança e IAM em dois lotes cada):

| Ordem | Módulo | Arquivo(s) | Situação |
|---|---|---|---|
| 1 | Arquitetura | `architecture/questions.ts` | pendente |
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
