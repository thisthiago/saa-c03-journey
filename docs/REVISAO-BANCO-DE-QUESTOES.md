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
| Lote 2, Arquivos (24/10/2026) | 26 | 0 | 26 | 0 |
| Lote 3, Análise (24/10/2026) | 37 | 0 | 37 | 0 |
| Lote 4, Integração (24/10/2026) | 22 | 0 | 22 | 0 |
| Lote 5, Segurança (24/10/2026) | 30 | 0 | 30 | 0 |
| Lote 6, S3 (24/10/2026) | 32 | 14 | 18 | 0 |
| Lote 7, Foundations (24/10/2026) | 15 | 5 | 10 | 0 |
| Lote 8, Redes (24/10/2026) | 34 | 13 | 21 | 0 |
| Lote 9, Bancos de dados (24/10/2026) | 47 | 23 | 24 | 0 |
| Lote 10a, Computação até opções de compra (24/10/2026) | 31 | 14 | 17 | 0 |
| Lote 10b, Computação de Elastic Load Balancing em diante (24/10/2026) | 32 | 13 | 19 | 0 |
| Lote 11, Governança (24/10/2026) | 62 | 29 | 33 | 0 |
| Lote 12, IAM (24/10/2026) | 53 | 16 | 37 | 0 |
| **Total** | **483** | **131** | **352** | **0** |

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

### Lote 2: Arquivos

As duas questões do piloto (`q.fil.efs-encryption` e `q.fil.efs-access-point`) não entraram de novo. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.fil.efs-shared` | 3.1 | Reescrita | — | Distrator do FSx for Windows explicado pela escolha, não por impossibilidade. |
| `q.fil.efs-windows` | 3.1 | Reescrita | — | Distratores com detalhe comparável; explicação do erro comum. |
| `q.fil.efs-onezone` | 4.1 | Reescrita | — | Explicação de quando o Regional continua indicado. |
| `q.fil.efs-mount` | 2.2 | Reescrita | — | Explicação do mount target como caminho de rede. |
| `q.fil.efs-throughput` | 4.1 | Reescrita | — | Explicação do Elastic, do Provisioned e da base do Bursting. |
| `q.fil.efs-lifecycle` | 4.1 | Reescrita | — | Requisito de manter o caminho dos arquivos explícito. |
| `q.fil.efs-replication` | 2.2 | Reescrita | — | Distrator "One Zone em outra Região" trocado por replicação na mesma Região. |
| `q.fil.fsxw-ad` | 1.1 | Reescrita | — | Distratores explicados pelo que cada diretório faz. |
| `q.fil.fsxw-multiaz` | 2.2 | Reescrita | — | Explicação com o tempo de recuperação do Single-AZ. |
| `q.fil.fsxw-shadow` | 2.2 | Reescrita | — | Explicação dos limites das cópias de sombra. |
| `q.fil.fsxw-storage` | 4.1 | Reescrita | — | Distrator de cópias de sombra ficou plausível. |
| `q.fil.lustre-s3` | 3.1 | Reescrita | — | Distratores de EFS e EBS ficaram plausíveis. |
| `q.fil.lustre-scratch` | 4.1 | Reescrita | — | Empresa fictícia nomeada; explicação de quando usar o persistente. |
| `q.fil.lustre-durability` | 2.2 | Reescrita | — | Distrator "mount targets são do EFS" trocado por snapshots do EBS. |
| `q.fil.ontap` | 3.1 | Reescrita | — | Distratores com o motivo de cada um. |
| `q.fil.ontap-tiering` | 4.1 | Reescrita | — | Requisito de não mudar o acesso explícito. |
| `q.fil.openzfs` | 3.1 | Reescrita | — | Distrator de S3 trocado pelo Lustre persistente. |
| `q.fil.choose` | 3.1 | Reescrita | — | Texto padronizado (Escolha TRÊS.). |
| `q.fil.transfer` | 2.1 | Reescrita | — | Distrator do DataSync explicado pelo servidor que continuaria existindo. |
| `q.fil.transfer-endpoint` | 1.2 | Reescrita | — | Fato do endpoint público conferido e registrado. |
| `q.fil.backup-central` | 2.2 | Reescrita | — | Distrator de versionamento do S3 trocado pelo Data Lifecycle Manager. |
| `q.fil.backup-cold` | 4.1 | Reescrita | — | Explicação da regra dos 90 dias. |
| `q.fil.backup-continuous` | 2.2 | Reescrita | — | Explicação de como passar dos 35 dias. |
| `q.fil.backup-ransomware` | 1.3 | Reescrita | — | Explicação das duas fronteiras numa só cópia. |
| `q.fil.backup-lock` | 1.3 | Reescrita | — | WORM explicado; distrator da SCP reescrito. |
| `q.fil.restore-testing` | 2.2 | Reescrita | — | Explicação de RPO e RTO no teste. |

Métricas das 28 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 11 para 0.
- Correta mais longa que todos os distratores: de 15 para 9 das 23 de resposta única.
- Explicação curta: de 24 para 0.
- Tamanho médio da explicação: de 82 para 439 caracteres.

### Lote 3: Análise

As duas questões do piloto (`q.ana.partition-key` e `q.ana.lake-practices`) não entraram de novo. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.ana.lake-vs-warehouse` | 3.5 | Reescrita | — | Explicação de schema-on-read e schema-on-write. |
| `q.ana.layers` | 4.1 | Reescrita | — | Explicação das camadas e da sugestão de ciclo de vida. |
| `q.ana.columnar` | 4.1 | Reescrita | — | Distrator de CSV ganhou compressão, para ficar plausível. |
| `q.ana.athena-gzip` | 4.1 | Reescrita | — | Explicação com o exemplo da página de preços. |
| `q.ana.small-files` | 3.5 | Reescrita | — | Explicação de por que pouco volume ainda fica lento. |
| `q.ana.data-catalog` | 3.5 | Reescrita | — | Distratores com o motivo de cada um. |
| `q.ana.crawler` | 3.5 | Reescrita | — | Papéis de crawler, job e DataBrew explicados. |
| `q.ana.csv-parquet-job` | 3.5 | Reescrita | — | Distrator do crawler explicado pelo que ele faz. |
| `q.ana.glue-cost` | 4.1 | Reescrita | — | Explicação com a conta e a cobrança por segundo. |
| `q.ana.bookmarks` | 4.1 | Reescrita | — | Explicação da causa comum dos dois sintomas. |
| `q.ana.trigger` | 2.1 | Reescrita | — | Explicação de encadear pelo resultado, não pelo relógio. |
| `q.ana.flex` | 4.1 | Reescrita | — | Explicação de quando a execução Flex combina. |
| `q.ana.databrew` | 3.5 | Reescrita | — | Distrator do Redshift trocado por job do Glue em Python. |
| `q.ana.ctas` | 4.1 | Reescrita | — | Distrator da "compressão padrão do bucket" (recurso que não existe) trocado por um job do Glue agendado. |
| `q.ana.athena-adhoc` | 3.5 | Reescrita | — | Distrator da planilha trocado pelo OpenSearch. |
| `q.ana.athena-billing` | 4.1 | Reescrita | — | Explicação de DDL e do mínimo de 10 MB. |
| `q.ana.workgroup-limit` | 4.1 | Reescrita | — | Explicação dos dois tipos de limite. |
| `q.ana.federated` | 3.5 | Reescrita | — | Explicação de quando copiar passa a compensar. |
| `q.ana.lf-columns` | 1.3 | Reescrita | — | Explicação da camada de permissão certa. |
| `q.ana.lf-rows` | 1.3 | Reescrita | — | Distrator de tags do IAM nas linhas trocado por views no Athena. |
| `q.ana.lf-default` | 1.3 | Reescrita | — | Explicação do IAMAllowedPrincipals e do modo híbrido. |
| `q.ana.lf-share` | 1.3 | Reescrita | — | Distrator de tags do IAM trocado pela concessão manual a cada tabela. |
| `q.ana.emr-spot` | 4.2 | Reescrita | — | Explicação dos papéis dos nós. |
| `q.ana.emr-transient` | 4.2 | Reescrita | — | Distrator de saída no HDFS trocado por Reserved Instances. |
| `q.ana.emr-choice` | 3.5 | Reescrita | — | Regra prática entre Glue, Athena e EMR. |
| `q.ana.firehose-parquet` | 3.5 | Reescrita | — | Explicação da conversão de formato. |
| `q.ana.kds-replay` | 3.5 | Reescrita | — | Distrator do Glue trocado pelo SNS. |
| `q.ana.ingest-saas` | 3.5 | Reescrita | — | Explicação do Data Exchange e do DataSync. |
| `q.ana.opensearch-search` | 3.5 | Reescrita | — | Distrator do Redshift trocado pelo DynamoDB. |
| `q.ana.opensearch-ha` | 2.2 | Reescrita | — | Explicação de backup e redundância. |
| `q.ana.spice` | 4.1 | Reescrita | — | Distratores do OpenSearch e de permissão de edição trocados por Parquet e atualização a cada minuto. |
| `q.ana.quick-rls` | 1.3 | Reescrita | — | Explicação de filtro de painel e segurança. |
| `q.ana.ai-docs` | 3.5 | Reescrita | — | Explicação da combinação Textract e Comprehend. |
| `q.ana.ai-voice` | 3.5 | Reescrita | — | Explicação dos caminhos opostos. |
| `q.ana.transcoder` | 3.5 | Reescrita | — | Data do encerramento movida para o why, para equilibrar as alternativas. |
| `q.ana.streaming` | 3.5 | Reescrita | — | Distrator do Glue por hora trocado por uma aplicação própria no lugar do Firehose. |
| `q.ana.choose` | 3.5 | Reescrita | — | Distrator do OpenSearch trocado por crawler com Redshift provisionado. |

Métricas das 39 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 17 para 0.
- Correta mais longa que todos os distratores: de 24 para 16 das 35 de resposta única.
- Explicação curta: de 21 para 0.
- Tamanho médio da explicação: de 111 para 387 caracteres.

### Lote 4: Integração

As duas questões do piloto (`q.int.decouple` e `q.int.visibility`) não entraram de novo. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.int.dlq` | 2.1 | Reescrita | — | Distrator do SNS trocado por visibilidade de 12 horas; explicação de mensagem venenosa e redrive. |
| `q.int.large-message` | 2.1 | Reescrita | — | Explicação do padrão de referência. |
| `q.int.long-polling` | 4.1 | Reescrita | — | Distrator FIFO trocado por espera no próprio código. |
| `q.int.fifo` | 2.1 | Reescrita | — | Explicação do grupo de mensagens. |
| `q.int.lambda-sqs` | 2.1 | Reescrita | — | Distrator "desligar a DLQ" trocado por lote menor; texto padronizado (Escolha DUAS.). |
| `q.int.fanout` | 2.1 | Reescrita | — | Explicação de distribuição e armazenamento. |
| `q.int.sns-filter` | 2.1 | Reescrita | — | Distrator FIFO trocado por uma função Lambda filtrando. |
| `q.int.sns-retries` | 2.1 | Reescrita | — | Distrator "Nada" virou uma confusão plausível sobre os 23 dias. |
| `q.int.eb-aws-events` | 2.1 | Reescrita | — | Distratores da fila assinada pela instância e do barramento sem regra trocados por barramento personalizado e alarme de CPU. |
| `q.int.eb-replay` | 2.1 | Reescrita | — | Explicação de arquivo, replay e DLQ. |
| `q.int.scheduler` | 2.1 | Reescrita | — | Explicação do Scheduler frente às regras agendadas. |
| `q.int.sfn-type` | 2.1 | Reescrita | — | Explicação do callback com token de tarefa. |
| `q.int.sfn-errors` | 2.1 | Reescrita | — | Explicação de Retry, Catch e saga. |
| `q.int.apigw-usage-plans` | 2.1 | Reescrita | — | Explicação de chave de API como identificação, não autorização. |
| `q.int.apigw-cache` | 3.4 | Reescrita | — | Explicação de como escolher o TTL. |
| `q.int.apigw-private` | 1.2 | Reescrita | — | Distrator "API HTTP com endpoint privado" trocado por API regional com WAF. |
| `q.int.queue-vs-stream` | 2.1 | Reescrita | — | Distrator FIFO trocado por fan-out SNS com SQS (resolve os leitores, não a releitura). |
| `q.int.hot-shard` | 3.5 | Reescrita | — | Explicação com o limite de 1 MB/s por shard. |
| `q.int.mq` | 2.1 | Reescrita | — | Explicação dos protocolos e da implantação ativa e em espera. |
| `q.int.idempotency` | 2.1 | Reescrita | — | Explicação da técnica de idempotência. |
| `q.int.write-buffer` | 2.1 | Reescrita | — | Distrator do banco assinando tópico trocado por SNS com Lambda assinante. |
| `q.int.choose-multi` | 2.1 | Reescrita | — | Distratores de MQ e Kinesis trocados por SNS com filtro e SQS FIFO. |

Métricas das 24 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 15 para 0.
- Correta mais longa que todos os distratores: de 19 para 14 das 22 de resposta única.
- Explicação curta: de 20 para 0.
- Tamanho médio da explicação: de 91 para 417 caracteres.

### Lote 5: Segurança

As duas questões do piloto (`q.sec.kms-admin-decrypt` e `q.sec.kms-envelope`) não entraram de novo. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.sec.kms-key-types` | 1.3 | Reescrita | — | A correta passou a descrever a ação concreta (copiar com chave do cliente); distratores "desligar a criptografia" e "chave AWS owned" trocados por editar a key policy da aws/rds e restaurar sem criptografia. |
| `q.sec.kms-rotation` | 1.3 | Reescrita | — | Explicação de que a rotação não recifra dados antigos. |
| `q.sec.kms-multi-region` | 1.3 | Reescrita | — | Distrator de chaves independentes ganhou o mesmo alias, para ficar plausível. |
| `q.sec.kms-quota` | 3.1 | Reescrita | — | Distrator "desligar a criptografia" trocado por novas tentativas com espera crescente. |
| `q.sec.cloudhsm` | 1.3 | Reescrita | — | Distratores de Secrets Manager e ACM trocados por KMS com material importado. |
| `q.sec.kms-grants` | 1.3 | Reescrita | — | Explicação das três fontes de acesso a uma chave. |
| `q.sec.secrets-rds` | 1.3 | Reescrita | — | Distrator do cron trocado por rotação com Lambda própria. |
| `q.sec.secrets-vs-ps` | 4.1 | Reescrita | — | Distratores de código e bucket público trocados pelo AppConfig e um bucket público explicado. |
| `q.sec.secrets-alternating` | 1.3 | Reescrita | — | Distrator "desligar a rotação" trocado por rotação menos frequente. |
| `q.sec.secrets-replica` | 2.2 | Reescrita | — | Distrator da senha no código trocado por rotação independente em cada Região. |
| `q.sec.secret-role` | 1.1 | Reescrita | — | Distrator do bucket público trocado por criptografia do disco. |
| `q.sec.acm-cloudfront` | 1.3 | Reescrita | — | Explicação da regra para recursos regionais. O distrator não depende de exportação de certificados, que o ACM passou a oferecer para certificados públicos. |
| `q.sec.acm-imported` | 1.3 | Reescrita | — | Distrator de reimportar o vencido trocado por importar um novo. |
| `q.sec.acm-cname` | 1.3 | Reescrita | — | Explicação de por que o CNAME precisa ficar no DNS. |
| `q.sec.tls-end-to-end` | 1.3 | Reescrita | — | Distrator "Nada" virou uma confusão plausível sobre onde o TLS termina. |
| `q.sec.guardduty` | 1.2 | Reescrita | — | Explicação das perguntas que cada serviço responde. |
| `q.sec.inspector` | 1.2 | Reescrita | — | Distrator do Artifact trocado pelo Patch Manager. |
| `q.sec.detective` | 1.2 | Reescrita | — | Distratores de Macie e ACM trocados por Athena e Security Hub CSPM. |
| `q.sec.detect-multi` | 1.2 | Reescrita | — | Distratores de Artifact e ACM trocados por Detective e Config; texto padronizado (Escolha DOIS.). |
| `q.sec.macie` | 1.3 | Reescrita | — | Distratores com o motivo de cada um. |
| `q.sec.macie-custom` | 1.3 | Reescrita | — | Distrator "esperar a AWS" trocado por ativar mais identificadores gerenciados. |
| `q.sec.vault-lock` | 1.3 | Reescrita | — | Distrator de tags trocado por política de acesso do cofre. |
| `q.sec.security-hub` | 1.3 | Reescrita | — | Explicação da dependência do AWS Config. |
| `q.sec.artifact` | 1.3 | Reescrita | — | Distrator do chamado no suporte trocado pelo Audit Manager. |
| `q.sec.evidence-multi` | 1.3 | Reescrita | — | Distrator do ACM trocado pelo Security Hub CSPM para o relatório da AWS. |
| `q.sec.waf-sqli` | 1.2 | Reescrita | — | Explicação de por que filtros de rede não barram esses ataques. |
| `q.sec.auto-response` | 1.3 | Reescrita | — | Distrator "Ligar o Inspector" trocado por exportar para o S3 e consultar com o Athena. |
| `q.sec.containment` | 1.3 | Reescrita | — | Explicação da ordem da resposta a incidentes. |
| `q.sec.config-vs-trail` | 1.3 | Reescrita | — | Distrator do Artifact trocado pelo Macie; texto padronizado (Escolha DOIS.). |
| `q.sec.which-protection` | 1.3 | Reescrita | — | Explicação por necessidade. |

Métricas das 32 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 16 para 0.
- Correta mais longa que todos os distratores: de 21 para 15 das 29 de resposta única.
- Explicação curta: de 21 para 0.
- Tamanho médio da explicação: de 98 para 395 caracteres.

### Lote 6: S3

As duas questões do piloto (`q.s3x.expedited` e `q.s3x.versioning`) não entraram de novo. O banco do S3 já tinha explicações médias de 223 caracteres; as 14 que ensinavam bem foram preservadas sem mudança: `q.s3x.standard-ia`, `q.s3x.glacier-ir`, `q.s3x.deep-archive`, `q.s3x.intelligent-tiering`, `q.s3x.onezone`, `q.s3x.object-lock`, `q.s3x.bucket-keys`, `q.s3x.https`, `q.s3x.presigned`, `q.s3x.block-public`, `q.s3x.batch-replication`, `q.s3x.rtc`, `q.s3x.file-gateway`, `q.s3x.transfer-acceleration`. Nenhuma mudança de classificação neste lote.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.s3x.delete-marker` | 2.2 | Reescrita | — | Distratores "Não há como" e chamado no suporte trocados por backup e restauração Expedited. |
| `q.s3x.mfa-delete` | 1.3 | Reescrita | — | Era memorização ("Quais afirmações estão corretas?") sem "(Escolha DUAS.)"; virou pergunta sobre o que é preciso para habilitar. |
| `q.s3x.versioned-expiration` | 4.1 | Reescrita | — | Alternativas equilibradas; explicação do sinal listagem × conta. |
| `q.s3x.multipart-cleanup` | 4.1 | Reescrita | — | Distrator de versionamento trocado por script agendado. |
| `q.s3x.multipart` | 3.1 | Reescrita | — | `why` curtos completados; distrator "Não é possível" virou a confusão entre limite do PUT e do objeto. |
| `q.s3x.sse-kms` | 1.3 | Reescrita | — | Distrator de HTTPS trocado pela chave aws/s3. |
| `q.s3x.kms-cross-account` | 1.3 | Reescrita | — | Faltava "(Escolha DUAS.)". |
| `q.s3x.acl-disabled` | 1.3 | Reescrita parcial | — | Distrator de versionamento trocado por Bucket owner preferred. |
| `q.s3x.replication-req` | 2.2 | Reescrita parcial | — | Faltava "(Escolha DUAS.)"; distrator de Requester Pays trocado pela bucket policy de destino (exigida só entre contas). |
| `q.s3x.versioning-not-backup` | 2.2 | Reescrita | — | Distrator de classe Standard trocado por replicação na mesma conta. |
| `q.s3x.fanout` | 3.4 | Reescrita | — | Distrator de listagem trocado por Lambda chamando os três sistemas. |
| `q.s3x.fifo` | 3.4 | Reescrita parcial | — | Distrator "Não é possível" trocado por tópico FIFO do SNS (fato conferido e registrado). |
| `q.s3x.recursion` | 2.2 | Reescrita | — | Distrator de memória trocado por concorrência reservada. |
| `q.s3x.requester-pays` | 4.1 | Reescrita | — | Distrator do Transfer Acceleration trocado por CloudFront com URLs assinadas. |
| `q.s3x.tape-gateway` | 2.2 | Reescrita | — | Distrator de reescrever o backup trocado por Tape Gateway com Standard-IA. |
| `q.s3x.stored-volumes` | 2.2 | Reescrita | — | Explicação de onde ficam os dados primários. |
| `q.s3x.datasync` | 3.1 | Reescrita parcial | — | Distrator do Tape Gateway trocado por aws s3 sync. |
| `q.s3x.consistency` | 3.1 | Reescrita | — | `why` curtos completados; explicação da origem da ideia de consistência eventual. |

Métricas das 34 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 11 para 0.
- Correta mais longa que todos os distratores: de 14 para 13 das 31 de resposta única.
- Duas ou mais `why` curtas: de 3 para 0.
- Tamanho médio da explicação: de 223 para 311 caracteres.

### Lote 7: Foundations

As duas questões do piloto (`q.fnd.region-selection` e `q.fnd.ha-vs-dr`) não entraram de novo. Preservadas sem mudança: `q.fnd.data-residency`, `q.fnd.static-stability`, `q.fnd.outposts`, `q.fnd.cloudfront`, `q.fnd.global-accelerator`. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.fnd.multi-az` | 2.2 | Reescrita | — | Distrator da Local Zone trocado por aplicação em duas AZs com banco numa só. |
| `q.fnd.rds-multi-az` | 2.2 | Reescrita | — | O enunciado passou a dizer "Multi-AZ com um standby", porque o cluster Multi-AZ tem standbys que atendem leituras. |
| `q.fnd.nat-zonal` | 2.2 | Reescrita | — | Distrator do NAT maior trocado por dois NAT na mesma AZ. |
| `q.fnd.local-zones` | 3.4 | Reescrita | — | A correta tinha quase três vezes o tamanho dos distratores. |
| `q.fnd.wavelength` | 3.4 | Reescrita | — | Explicação do sinal de usuários móveis em rede de operadora. |
| `q.fnd.srm-ec2` | 1.1 | Reescrita | — | Distrator "De ninguém" trocado por AMI fornecida pela AWS. |
| `q.fnd.srm-s3` | 1.1 | Reescrita | — | Distrator "Dividida igualmente" trocado pelo Block Public Access padrão. |
| `q.fnd.srm-rds` | 1.1 | Reescrita | — | Distrator de segurança física trocado pela replicação do Multi-AZ. |
| `q.fnd.sla-vs-support` | 2.2 | Reescrita | — | Explicação da diferença entre SLA e plano de suporte. |
| `q.fnd.srm-aws` | 1.1 | Reescrita parcial | — | Faltava "(Escolha DOIS.)"; alternativas e explicação mantidas. |

Métricas das 17 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 11 para 0.
- Correta mais longa que todos os distratores: de 11 para 8 das 16 de resposta única.
- Duas ou mais `why` curtas: de 2 para 0.
- Tamanho médio da explicação: de 239 para 368 caracteres.

### Lote 8: Redes

As duas questões do piloto (`q.net.vpn-ecmp` e `q.net.dx-encryption`) não entraram de novo. Preservadas sem mudança: `q.net.subnet-size`, `q.net.vpc-cidr`, `q.net.eigw`, `q.net.nat-instance`, `q.net.nacl-stateless`, `q.net.diagnostics`, `q.net.gateway-endpoint`, `q.net.dx-gateway`, `q.net.geo-default`, `q.net.cf-cert`, `q.net.signed-cookies`, `q.net.global-accelerator`, `q.net.edge-protection`. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.net.default-vpc` | 1.2 | Reescrita | — | Era memorização ("Qual afirmação é verdadeira"); virou o caso de uma instância exposta sem querer. |
| `q.net.nat-per-az` | 2.2 | Reescrita | — | Distrator de NAT instance passou a ter duas instâncias na mesma zona. |
| `q.net.longest-prefix` | 1.2 | Reescrita | — | Explicação curta (67 caracteres) completada com o uso prático da regra. |
| `q.net.nacl-order` | 1.2 | Reescrita | — | Distrator "Remover a regra 100" trocado por regra de saída. |
| `q.net.sg-reference` | 1.2 | Reescrita | — | Distrator de regra de negação trocado por liberar a sub-rede. |
| `q.net.transitive` | 2.1 | Reescrita | — | Distratores "opção que não existe" e "Nada" trocados por instância de roteamento e uma confusão plausível. |
| `q.net.tgw-many` | 2.1 | Reescrita | — | Explicação com a conta de peerings. |
| `q.net.tgw-isolation` | 1.2 | Reescrita | — | Distrator de peerings trocado por security groups com negação. |
| `q.net.onprem-s3` | 1.2 | Reescrita | — | Explicação de por que endpoints de gateway não se estendem para fora da VPC. |
| `q.net.endpoint-service` | 1.2 | Reescrita | — | Distrator de endpoint de gateway trocado por API pública com chave. |
| `q.net.endpoint-policy` | 1.2 | Reescrita | — | Distrator "Nada: a política padrão" trocado por bucket policies. |
| `q.net.vpn-fast` | 1.2 | Reescrita | — | Distrator de VPC peering trocado por Direct Connect hospedado. |
| `q.net.dx-resiliency` | 2.2 | Reescrita | — | `why` curtos completados. |
| `q.net.client-vpn` | 1.2 | Reescrita | — | Explicação curta completada. |
| `q.net.alias-apex` | 2.2 | Reescrita | — | Distrator MX trocado por AAAA com IPs fixos. |
| `q.net.latency-routing` | 3.4 | Reescrita | — | Distrator "Simples" trocado por geoproximidade. |
| `q.net.failover` | 2.2 | Reescrita | — | Distrator de geolocalização trocado por failover sem verificação de saúde. |
| `q.net.hybrid-dns` | 2.2 | Reescrita | — | Distrator de peering trocado pela confusão entre endpoint de entrada e de saída. |
| `q.net.oac` | 1.2 | Reescrita | — | A correta tinha 2,6 vezes o tamanho dos distratores. |
| `q.net.waf-sqli` | 1.2 | Reescrita | — | Explicação dos grupos gerenciados. |
| `q.net.shield-advanced` | 1.2 | Reescrita | — | Distrator do Auto Scaling trocado por WAF com limite de taxa. |

Métricas das 36 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 9 para 0.
- Explicação curta: de 7 para 0.
- Duas ou mais `why` curtas: de 7 para 0.
- Tamanho médio da explicação: de 144 para 296 caracteres.

### Lote 9: Bancos de dados

As duas questões do piloto (`q.db.standby-reads` e `q.db.cluster`) não entraram de novo. Preservadas sem mudança: `q.db.rds-managed`, `q.db.gp3-400`, `q.db.param-group`, `q.db.multi-az`, `q.db.snapshots-long`, `q.db.proxy`, `q.db.failover-endpoint`, `q.db.ha-multi`, `q.db.aurora-failover`, `q.db.aurora-global`, `q.db.aurora-clone`, `q.db.aurora-endpoints`, `q.db.ddb-units`, `q.db.ddb-mode`, `q.db.dax`, `q.db.ddb-tx`, `q.db.specialized`, `q.db.redshift-serverless`, `q.db.spectrum`, `q.db.zero-etl`, `q.db.redshift-dr`, `q.db.gateway-endpoint`, `q.db.choose-mixed`. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.db.autoscaling` | 2.2 | Reescrita | — | Alternativas com o mesmo nível de detalhe. |
| `q.db.private` | 1.2 | Reescrita | — | A correta tinha o dobro do tamanho dos distratores. |
| `q.db.burstable` | 4.2 | Reescrita | — | Explicação de quando os créditos acabam. |
| `q.db.region-dr` | 2.2 | Reescrita | — | Distrator de retenção de 35 dias trocado por snapshots copiados entre Regiões. |
| `q.db.pitr` | 2.2 | Reescrita | — | Explicação do que fazer com a instância restaurada. |
| `q.db.share-snapshot` | 1.3 | Reescrita | — | Distrator de snapshot público trocado por editar a key policy da chave padrão. |
| `q.db.aurora-serverless` | 4.1 | Reescrita | — | Distratores de Multi-AZ e Global Database trocados por burstable e réplicas no dia. |
| `q.db.ddb-hot` | 3.3 | Reescrita | — | Distrator de leitura eventual trocado por modo sob demanda (que também respeita o limite por partição). |
| `q.db.ddb-gsi` | 3.3 | Reescrita | — | Explicação de índice global e local. |
| `q.db.ddb-streams` | 3.3 | Reescrita | — | Distrator do TTL trocado por mudar a aplicação para o SNS. |
| `q.db.ddb-ttl` | 4.1 | Reescrita | — | A correta tinha três vezes o tamanho dos distratores. |
| `q.db.global-tables` | 2.2 | Reescrita | — | `why` curtos completados. |
| `q.db.cache-strategy` | 3.3 | Reescrita | — | Explicação das duas estratégias. |
| `q.db.cache-engine` | 3.3 | Reescrita | — | A correta tinha três vezes o tamanho dos distratores. |
| `q.db.redshift-olap` | 3.3 | Reescrita | — | Distrator do Multi-AZ trocado por réplica de leitura. |
| `q.db.encrypt-existing` | 1.3 | Reescrita | — | Distrator do rds.force_ssl (parâmetro do PostgreSQL) trocado por require_secure_transport, do MySQL do cenário. |
| `q.db.iam-auth` | 1.3 | Reescrita | — | Distrator de criptografar o arquivo trocado pelo Secrets Manager. |
| `q.db.secrets-rotation` | 1.3 | Reescrita | — | Distrator da mesma senha em todos os bancos trocado por rotação com Lambda própria. |
| `q.db.deletion` | 2.2 | Reescrita | — | Distratores de Multi-AZ e snapshot público trocados por política IAM e Vault Lock em governance. |
| `q.db.dms-cdc` | 2.2 | Reescrita | — | Explicação de quando usar só CDC. |
| `q.db.sct` | 2.2 | Reescrita | — | Distrator do AWS Backup trocado pelo DMS sozinho. |
| `q.db.dms-preloaded` | 2.2 | Reescrita | — | Explicação do backup nativo como carga inicial. |
| `q.db.choose-graph` | 3.3 | Reescrita | — | Distrator do Memcached trocado pelo DynamoDB. |
| `q.db.aurora-vs-rds-oracle` | 3.3 | Reescrita | — | Distratores de DynamoDB e Redshift trocados por Oracle em EC2 e RDS for PostgreSQL. |

Métricas das 49 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 19 para 0.
- Correta mais longa que todos os distratores: de 28 para 23 das 44 de resposta única.
- Duas ou mais `why` curtas: de 2 para 0.
- Tamanho médio da explicação: de 194 para 284 caracteres.

### Lote 10a: Computação, até opções de compra

As duas questões do piloto (`q.cmp.burst-low` e `q.cmp.sg-facts`) não entraram de novo. Preservadas sem mudança: `q.cmp.instance-store-db`, `q.cmp.eip-failover`, `q.cmp.hibernate`, `q.cmp.imdsv2`, `q.cmp.sg-db`, `q.cmp.memory-family`, `q.cmp.cluster-pg`, `q.cmp.inferentia`, `q.cmp.compute-optimizer`, `q.cmp.gp2-to-gp3`, `q.cmp.encrypt-existing`, `q.cmp.compute-sp-fargate`, `q.cmp.spot-batch`, `q.cmp.dedicated-host`. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.cmp.ssm` | 1.2 | Reescrita | — | Distrator de chave compartilhada trocado pelo EC2 Instance Connect, que ainda exige a porta 22. |
| `q.cmp.golden-ami` | 3.1 | Reescrita | — | Distratores de user data a cada reboot e de limite de tamanho trocados por instância maior e pacotes vindos do S3. |
| `q.cmp.ami-region` | 2.2 | Reescrita | — | Distrator "Nada" virou uma confusão plausível; explicação completada. |
| `q.cmp.spread` | 2.2 | Reescrita | — | Texto padronizado (Escolha DUAS.); explicação dos três tipos de placement group. |
| `q.cmp.eip-cost` | 4.1 | Reescrita | — | Explicação curta (105 caracteres) completada; distrator de parar instâncias trocado por associar a instâncias paradas. |
| `q.cmp.io2-critical` | 3.1 | Reescrita | — | A correta tinha quase seis vezes o tamanho dos distratores; distrator st1 trocado por io1. |
| `q.cmp.st1` | 4.1 | Reescrita | — | Alternativas com o nome do tipo explicado. |
| `q.cmp.multi-attach` | 2.2 | Reescrita | — | Distrator de instance store trocado pelo EFS. |
| `q.cmp.snapshot-az` | 2.2 | Reescrita | — | `why` curtos completados. |
| `q.cmp.gp2-burst` | 3.1 | Reescrita | — | Distrator st1 trocado por io2, que resolve mas custa mais. |
| `q.cmp.ec2-sp-stable` | 4.2 | Reescrita | — | Distratores de Spot e Capacity Reservation reorganizados; entrou o mesmo plano com prazo de 1 ano. |
| `q.cmp.odcr` | 4.2 | Reescrita | — | Explicação da diferença entre reservar capacidade e ter desconto. |
| `q.cmp.commit-sizing` | 4.2 | Reescrita | — | Texto padronizado (Escolha DUAS.). |
| `q.cmp.app-creds` | 1.1 | Reescrita parcial | — | Alternativas equilibradas (a correta tinha quase o dobro do tamanho médio). |
| `q.cmp.burst-high` | 4.2 | Reescrita parcial | — | Alternativas equilibradas. |
| `q.cmp.graviton` | 4.2 | Reescrita parcial | — | Alternativas equilibradas. |
| `q.cmp.terminate-volumes` | 2.2 | Reescrita parcial | — | Alternativas equilibradas, cada uma com a consequência para os resultados. |

### Lote 10b: Computação, de Elastic Load Balancing em diante

Preservadas sem mudança: `q.cmp.cross-zone`, `q.cmp.asg-elb-health`, `q.cmp.lambda-reserved`, `q.cmp.lambda-vpc`, `q.cmp.fargate-ops`, `q.cmp.eks-choice`, `q.cmp.ecr`, `q.cmp.spectrum-timeout`, `q.cmp.batch-queue`, `q.cmp.beanstalk-immutable`, `q.cmp.eks-anywhere`, `q.cmp.evs`, `q.cmp.final-sp-fargate`. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.cmp.alb-path` | 3.4 | Reescrita | — | Distrator de Elastic IPs trocado por dois ALBs. |
| `q.cmp.nlb-static` | 1.3 | Reescrita parcial | — | Alternativas equilibradas. |
| `q.cmp.gwlb` | 1.3 | Reescrita | — | Distrator de Elastic IP por firewall trocado pelo AWS WAF. |
| `q.cmp.dereg` | 2.2 | Reescrita | — | A correta tinha 2,4 vezes o tamanho dos distratores; distratores de health check e cross-zone trocados por sticky sessions e intervalo menor. |
| `q.cmp.asg-tt` | 2.1 | Reescrita | — | Distrator de capacidade fixa trocado por step scaling. |
| `q.cmp.asg-scheduled` | 2.1 | Reescrita | — | Distrator de simple scaling trocado por step scaling. |
| `q.cmp.asg-termination` | 2.1 | Reescrita parcial | — | Alternativas equilibradas. |
| `q.cmp.asg-hooks` | 2.1 | Reescrita | — | Texto padronizado (Escolha DOIS.); distrator de placement group trocado por grace period. |
| `q.cmp.lambda-timeout` | 3.1 | Reescrita | — | Alternativas equilibradas. |
| `q.cmp.lambda-provisioned` | 3.1 | Reescrita | — | Distrator de DLQ trocado por mais memória; explicação do SnapStart atualizada. |
| `q.cmp.lambda-async` | 2.1 | Reescrita | — | Distrator de concorrência provisionada trocado pela DLQ padrão, que guarda o evento sem o erro. |
| `q.cmp.lambda-sources` | 2.1 | Reescrita | — | Enunciado sem cenário ganhou um requisito concreto (tamanho do lote); texto padronizado (Escolha DUAS.). |
| `q.cmp.ecs-roles` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.cmp.beanstalk` | 3.1 | Reescrita | — | Explicação curta completada. |
| `q.cmp.beanstalk-bluegreen` | 2.2 | Reescrita parcial | — | Alternativas equilibradas. |
| `q.cmp.sar` | 3.1 | Reescrita | — | A correta tinha três vezes o tamanho dos distratores; distrator do bucket público trocado por bucket compartilhado. |
| `q.cmp.anywhere` | 3.1 | Reescrita | — | Alternativas equilibradas. |
| `q.cmp.hybrid-multi` | 3.1 | Reescrita | — | Era memorização ("Quais afirmações estão corretas?"); virou cenário com duas fábricas, mantendo duas corretas. |
| `q.cmp.final-alb-az` | 2.2 | Reescrita | — | Alternativas equilibradas. |

Métricas das 65 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 23 para 0.
- Correta mais longa que todos os distratores: de 34 para 28 das 59 de resposta única.
- Explicação curta: de 1 para 0.
- Tamanho médio da explicação: de 188 para 286 caracteres.

### Lote 11: Governança

As duas questões do piloto (`q.gov.config-proactive` e `q.gov.config-recording-cost`) não entraram de novo. As outras 29 foram preservadas sem mudança. Nenhuma mudança de classificação.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.gov.composite` | 2.2 | Reescrita | — | Distrator de um tópico por alarme trocado por AND com ações nos alarmes de baixo. |
| `q.gov.alarm-actions` | 2.2 | Reescrita | — | Distratores sem relação (mover de Região, apagar volume) trocados por ações do EC2 que não existem ou não bastam. |
| `q.gov.metric-filter` | 2.2 | Reescrita | — | Distrator do monitoramento detalhado de grupo de logs (recurso que não existe) trocado por métrica publicada pelo código. |
| `q.gov.ia-metric-filter` | 4.1 | Reescrita | — | Distrator do Live Tail trocado por filtro de métrica no S3. |
| `q.gov.subscription` | 3.5 | Reescrita | — | Distrator de retenção trocado por exportação ao S3. |
| `q.gov.trail-history` | 1.2 | Reescrita | — | Distrator das métricas do IAM trocado pelo relatório de credenciais. |
| `q.gov.trail-alert` | 1.2 | Reescrita | — | Distrator do monitoramento detalhado trocado por alarme direto sobre arquivos no S3; explicação cita a alternativa com EventBridge. |
| `q.gov.trail-cost` | 4.1 | Reescrita | — | Alternativas equilibradas. |
| `q.gov.config-autoremediate` | 1.2 | Reescrita | — | Distrator do histórico do CloudTrail trocado por regra com aviso pelo SNS. |
| `q.gov.config-aggregator` | 1.2 | Reescrita | — | Alternativas equilibradas. |
| `q.gov.config-remediation-multi` | 1.2 | Reescrita | — | Era memorização ("Quais afirmações estão corretas?"); virou cenário com um caso seguro e um arriscado. |
| `q.gov.ssm-managed-multi` | 1.2 | Reescrita | — | Distrator do monitoramento detalhado trocado por endpoint de gateway. |
| `q.gov.ssm-runcommand` | 2.1 | Reescrita | — | Distratores de Parameter Store, Config e CloudTrail trocados por Session Manager, State Manager e Automation. |
| `q.gov.ssm-patch` | 1.2 | Reescrita | — | Distrator do Parameter Store trocado por AMIs novas. |
| `q.gov.ssm-secret` | 1.3 | Reescrita | — | Distratores de String e variável de ambiente trocados por script mensal e camada avançada. |
| `q.gov.ssm-automation` | 2.1 | Reescrita | — | Distrator do parâmetro "aprovado" trocado por Maintenance Window. |
| `q.gov.cfn-replacement` | 2.2 | Reescrita | — | Alternativas equilibradas. |
| `q.gov.cfn-retain` | 2.2 | Reescrita | — | `why` curtos completados; distrator do horário trocado por proteção contra término. |
| `q.gov.cfn-stacksets` | 2.2 | Reescrita | — | Distrator do agregador trocado por pacote de conformidade. |
| `q.gov.service-catalog` | 1.2 | Reescrita | — | Distrator do Parameter Store trocado por templates num bucket. |
| `q.gov.ct-mgmt` | 1.2 | Reescrita | — | Distrator de recriar a conta de gerenciamento trocado por RCP. |
| `q.gov.tag-policy` | 4.1 | Reescrita | — | Distrator da SCP trocado por política só para recursos antigos; explicação cita a SCP com condição de tags. |
| `q.gov.sharing-restricted` | 4.1 | Reescrita | — | Distrator da carência de 30 dias trocado por divisão igual. |
| `q.gov.tags-activate` | 4.1 | Reescrita | — | Distrator de reiniciar instâncias trocado por ativação nas contas membro. |
| `q.gov.budget-forecast` | 4.1 | Reescrita | — | `why` curtos completados. |
| `q.gov.anomaly` | 4.1 | Reescrita | — | Distratores de Savings Plans e Config trocados por orçamento diário e relatórios semanais. |
| `q.gov.cost-explorer-multi` | 4.1 | Reescrita | — | Era memorização ("Quais afirmações estão corretas?"); virou avaliação dos planos de um time. |
| `q.gov.ta-basic` | 4.1 | Reescrita | — | `why` curtos completados. |
| `q.gov.health-auto` | 2.2 | Reescrita | — | `why` curtos completados. |
| `q.gov.quota-region` | 2.2 | Reescrita | — | Distratores de regra inexistente e faturamento consolidado trocados por confusões sobre o escopo das cotas. |
| `q.gov.quota-multi` | 2.2 | Reescrita | — | Texto padronizado (Escolha DUAS.); distrator do faturamento consolidado trocado por aumento só na conta de gerenciamento. |
| `q.gov.ops-who` | 1.2 | Reescrita | — | A correta tinha três vezes o tamanho dos distratores. |
| `q.gov.ops-mix` | 2.2 | Reescrita | — | Texto padronizado (Escolha TRÊS.). |

Métricas das 64 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 26 para 0.
- Correta mais longa que todos os distratores: de 38 para 34 das 55 de resposta única.
- Duas ou mais `why` curtas: de 6 para 0.
- Tamanho médio da explicação: de 207 para 296 caracteres.

### Lote 12: IAM

As duas questões do piloto (`q.iax.key-rotation` e `q.iax.group-principal`) não entraram de novo. As outras 16 foram preservadas sem mudança. Nenhuma mudança de classificação. "Reescrita completa" indica questão refeita do enunciado à explicação; "Reescrita" indica ajuste das alternativas e das `why`.

| Questão | Tarefa do guia | Situação | Mudança de classificação | Observação |
|---|---|---|---|---|
| `q.iax.root-key` | 1.1 | Reescrita | — | Alternativas equilibradas; a correta não carrega mais a justificativa. |
| `q.iax.root-tasks` | 1.1 | Reescrita completa | — | Cenário de redução do uso do root; texto padronizado (Escolha DUAS.). |
| `q.iax.user-no-permission` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.when-iam-user` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.mfa-cli` | 1.1 | Reescrita | — | Distrator c trocado por outro plausível, com nova `why`. |
| `q.iax.ec2-role` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.ec2-trust` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.roles-facts` | 1.1 | Reescrita completa | — | Era memorização; virou desenho de uma role entre contas (Escolha DUAS.). |
| `q.iax.cross-account-copy` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.pass-role` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.service-linked` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.roles-anywhere` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.confused-deputy` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.trust-what` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.trust-wildcard` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.sts-duration` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.sts-chaining` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.sts-saml` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.temp-creds` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.assume-role-mfa` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.list-and-read` | 1.1 | Reescrita completa | — | ARNs de bucket e de objeto como alternativas comparáveis; texto padronizado (Escolha DUAS.). |
| `q.iax.not-action` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.policy-types-grant` | 1.1 | Reescrita completa | — | Cenário de uma role sem permissões; cada distrator é um tipo de política que só limita (Escolha DUAS.). |
| `q.iax.policy-variable` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.boundary` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.boundary-delegation` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.access-analyzer` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.policy-generation` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.identity-center` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.permission-sets` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.cognito-pools` | 1.1 | Reescrita completa | — | Cenário de aplicativo móvel com envio direto ao S3 (Escolha DUAS.). |
| `q.iax.cognito-guest` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.abac` | 1.1 | Reescrita | — | A correta tinha quatro vezes o tamanho dos distratores; `why` cita a tag de sessão. |
| `q.iax.scp-no-grant` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.scp-region` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.rcp` | 1.1 | Reescrita | — | Alternativas equilibradas. |
| `q.iax.root-central` | 1.1 | Reescrita | — | Alternativas equilibradas. |

Métricas das 55 questões do módulo, antes e depois:
- Correta 1,6 vez mais longa: de 34 para 0.
- Correta mais longa que todos os distratores: de 38 para 32 das 50 de resposta única.
- Duas ou mais `why` curtas: 0 antes e depois.
- Tamanho médio da explicação: de 230 para 251 caracteres.

## Validação final (24/10/2026)

Todas as 483 questões foram analisadas. Os ids, o número de alternativas e o número de corretas são os mesmos do início. Sete questões mudaram de classificação, todas listadas nos lotes:
- `q.ana.lake-practices`: dificuldade 3 para 2.
- `q.arq.opt-rightsizing`: dificuldade 1 para 2.
- `q.arq.opt-transfer`: dificuldade 3 para 2.
- `q.arq.pat-canary`: dificuldade 3 para 2.
- `q.arq.pat-events`: domínio d3 para d2.
- `q.gov.config-proactive`: dificuldade 3 para 2.
- `q.s3x.expedited`: domínio d2 para d3.

Métricas do banco inteiro, antes e depois:
- Correta 1,6 vez mais longa que a média dos distratores: de 222 para 0.
- Correta mais longa que todos os distratores: de 292 para 230 das 430 de resposta única.
- Explicação com menos de 110 caracteres: de 128 para 0.
- Duas ou mais `why` com menos de 40 caracteres: de 72 para 0.

Testes rodados sobre o resultado final:
- `npm run typecheck` e `npm run lint`: sem erros.
- `npm test`: 591 testes passaram.
- `npm run build`: concluído.
- `npx playwright test tests/e2e/screens.spec.ts -g "banco de questões"`: 3 testes passaram (celular, tablet e desktop).

A leitura das questões na tela (`npm run dev`) não foi feita nesta revisão.

## Como retomar

O padrão editorial do piloto foi aprovado em 24/10/2026. Os próximos lotes seguem esta ordem, um módulo por lote (Computação, Governança e IAM em dois lotes cada):

| Ordem | Módulo | Arquivo(s) | Situação |
|---|---|---|---|
| 1 | Arquitetura | `architecture/questions.ts` | feito |
| 2 | Arquivos | `files/questions.ts` | feito |
| 3 | Análise | `analytics/questions.ts` | feito |
| 4 | Integração | `integration/questions.ts` | feito |
| 5 | Segurança | `security/questions.ts` | feito |
| 6 | S3 | `storage/questions.ts` | feito |
| 7 | Foundations | `foundations/questions.ts` | feito |
| 8 | Redes | `network/questions.ts`, `network/questions-f06-f09.ts` | feito |
| 9 | Bancos de dados | `database/questions.ts` | feito |
| 10 | Computação | `compute/questions.ts` | feito |
| 11 | Governança | `governance/questions*.ts` | feito |
| 12 | IAM | `identity/questions.ts` | feito |

Cada lote termina com: comparação com o retrato inicial (ids, conceito, domínio, dificuldade, número de opções e de corretas), `npm run typecheck`, `npm run lint`, `npx vitest run src/content src/engine`, atualização desta tabela e um commit local do arquivo do módulo e deste documento. Nada vai para o remoto sem pedido.

As questões do piloto já revisadas são puladas nos lotes.

## Observações fora do escopo

- O simulado sorteia sem os pesos dos domínios (`src/engine/exam.ts`, `simuladoSample`).
- A atividade `gov.f04.m2.a6` (fase 4 da Governança) pergunta sobre a avaliação proativa das propriedades de um bucket. Nenhuma regra gerenciada de S3 aceita o modo proativo hoje; só uma regra personalizada faria isso. Vale revisar numa tarefa das fases.
- `docs/ARQUITETURA.md` descreve os testes do banco de forma desatualizada.
