# Revisão didática do Codex: progresso

Atualizado em **24/10/2026**. Branch `revisao/codex`, sem commits (decisão do usuário). O plano está em [PLAN.md](PLAN.md), as decisões em [DECISIONS.md](DECISIONS.md) e o estado de cada conceito em [INVENTORY.csv](INVENTORY.csv).

## Resumo

| Situação | Conceitos |
|---|---|
| Validados | 588 |
| Preservados sem alteração | 181 |
| Reescritos, aguardando validação | 0 |
| Em andamento | 0 |
| Pendentes de revisão manual | 0 |
| Pendentes | 0 |

## Diagnóstico inicial (24/10/2026)

Medido pelo `heur.mjs` sobre os 769 conceitos:

| Problema | Conceitos |
|---|---|
| Sem explicação do mecanismo (`explanation` vazio) | 741 |
| Sem "quando usar" nem limitações | 723 |
| Sem comparação com outro conceito | 713 |
| Sem notas da prova | 709 |
| Só resumo e no máximo uma lista | 296 |
| Relevância alta e só resumo | 123 |
| Resumo com mais de 380 caracteres | 24 (14 em Governança) |
| "=" na prosa | 2 (`s3.acl`, `glue.etl-job`) |
| Comparação que aponta para um rótulo em vez de um id | 2 (`infra.local-zones`, `edge.global-accelerator`) |

Os fatos existentes são densos e foram conferidos quando as trilhas foram criadas. O problema é didático: os conceitos dizem *o que é*, mas raramente *por quê*, *quando*, *comparado com o quê* e *como reconhecer na prova*.

Por módulo, os conceitos que têm só o resumo e no máximo uma lista são: Computação 54 de 81, S3 49 de 103, IAM 45 de 68, Foundations 21 de 47, Análise 22 de 58, Segurança 25 de 54, Integração 29 de 46, Redes 21 de 69, Arquitetura 21 de 62, Bancos de dados 9 de 66, Governança 0 de 79 e Arquivos 0 de 36.

## Piloto (24/10/2026)

| Conceito | Nível | Tarefa do guia | Situação | O que mudou |
|---|---|---|---|---|
| `infra.az` | 1 | 2.2 | Reescrito | Analogia dos prédios com o limite da comparação; recursos zonais; exemplo de loja em duas AZs com static stability; regra prática AZ × Região; quando usar e limitações; comparações com Região e Local Zone; fato novo do AZ ID; notas da prova. |
| `lc.rules` | 2 | 4.1 | Reescrito | Analogia do arquivo de escritório (decide pela idade, não pelo acesso); execução assíncrona e cobrança; exemplo de logs com 30, 90 e 365 dias; comparações com Intelligent-Tiering e Storage Class Analysis; fato da bucket policy; armadilha da expiração sobre objetos antigos. |
| `iam.roles` | 2 | 1.1 | Reescrito | Analogia do crachá com sessões simultâneas; trust policy e política de permissões; exemplo do EC2 lendo o S3 com instance profile; usos; comparações com usuário IAM e trust policy; notas sobre os dois lados do acesso entre contas. |
| `sqs.visibility` | 2 | 2.1 | Reescrito | Analogia do quadro de tarefas; por que o SQS não apaga ao entregar; exemplo de conversão de vídeo; regra dos seis vezes o tempo limite do Lambda; comparações com fila com atraso, DLQ e long polling; consumidor idempotente. |
| `iam.eval-flow` | 3 | 1.1 | Reescrito | Modelo mental das políticas que concedem e das que limitam (sem analogia); passo a passo; exceção da política de recurso na mesma conta; exemplo do `AdministratorAccess` bloqueado por SCP; comparações com a regra básica, SCP e acesso entre contas; notas da prova. |

Nenhum resumo mudou. Referências novas: AZ IDs, Roles para EC2, Cross-account policy evaluation e a configuração do SQS como origem de eventos do Lambda. Os fatos novos estão em `docs/VERIFICACAO-DE-CONTEUDO.md`, na seção "Revisão didática do Codex".

Verificações:

- `check.mjs`: 5 alterados, 0 erros e os 2 avisos que já existiam antes da revisão.
- `npm run typecheck` e `npm run lint` limpos.
- `npx vitest run src/content src/engine src/features/codex`: 98 testes passando. A suíte completa da linha de base tinha 591.
- Capturas em desktop e celular sem rolagem horizontal.

Problema encontrado e corrigido: `exam.notes` é exibido como texto puro, e a marcação (crases e negrito) aparecia crua na tela. Ela foi retirada, e o `check.mjs` agora acusa erro nesse caso.

## Resultado (24/10/2026)

Os 769 conceitos passaram pelo ciclo: **588 reescritos e validados** e **181 preservados** por já estarem claros e corretos. Nenhum ficou para revisão manual. Nenhum id, arquivo, ordem ou campo protegido mudou; o `check.mjs` termina com 0 erros e 0 avisos.

| Módulo | Reescritos | Preservados |
|---|---|---|
| Foundations | 36 | 11 |
| S3 | 77 | 26 |
| IAM | 49 | 19 |
| Computação | 66 | 15 |
| Bancos de dados | 60 | 6 |
| Monitoramento e governança | 57 | 22 |
| Redes | 56 | 13 |
| Análise de dados | 43 | 15 |
| Segurança | 39 | 15 |
| Integração e mensageria | 40 | 6 |
| Arquivos e backup | 27 | 9 |
| Arquitetura e otimização | 38 | 24 |
| **Total** | **588** | **181** |

Cobertura dos campos, antes e depois:

| Campo | Antes | Depois |
|---|---|---|
| Notas da prova (`exam.notes`) | 60 | 589 |
| Explicação do mecanismo (`explanation`) | 28 | 194 |
| Exemplo prático | 0 | 149 |
| Regra prática | 0 | 108 |
| Comparações | 56 | 131 |
| Só resumo e no máximo uma lista | 296 | 119 |
| Relevância alta e só resumo | 123 | 18 |
| "=" na prosa | 2 | 0 |

O texto total dos conceitos passou de cerca de 446 mil para 666 mil caracteres. Níveis atribuídos: 451 conceitos de nível 1, 299 de nível 2 e 19 de nível 3.

**Como a profundidade se distribuiu.** O tratamento completo (imagem mental quando ajuda, mecanismo, exemplo, regra prática, comparações e notas) foi para os conceitos centrais de cada módulo, sobretudo os de relevância alta com pouco texto: Foundations, S3, IAM, Computação e os quadros de escolha. Nos módulos que já tinham fatos e erros comuns detalhados (Bancos de dados, Governança, Redes, Análise, Segurança, Integração, Arquivos e Arquitetura), a lacuna principal era ligar o conteúdo à prova, e a reescrita acrescentou sobretudo as notas da SAA-C03, com exemplos e comparações onde faltavam. Conceitos fundamentais de baixa relevância e com conteúdo correto ficaram preservados.

**Correções técnicas e de tela feitas durante a revisão:**

- `exam.notes` é exibido como texto puro; a marcação foi tirada das notas, e o `check.mjs` acusa o caso.
- A marcação não aninha: os resumos de `iam.mfa-condition` e `s3.public-policy` mostravam negrito e crases crus e foram corrigidos.
- As comparações de `infra.local-zones` e `edge.global-accelerator` apontavam para um rótulo em vez de um id e passaram a apontar para `infra.az` e `edge.cloudfront`.
- Os resumos de `s3.acl` (que tinha "=" na prosa) e dos dois conceitos acima foram os únicos alterados; nenhum deles aparece nos cartões de Conceitos-chave.
- O fato de `cmp.spectrum` que era uma regra do projeto (e não comportamento da AWS) virou a regra prática do conceito, e o "=" do cálculo de custo em `glue.etl-job` foi reescrito.

**Validação final:**

- `check.mjs` sobre os 769 conceitos: 0 erros e 0 avisos.
- `npm run typecheck` e `npm run lint` limpos.
- `npm test`: 90 arquivos e 591 testes passando.
- `npm run build` sem erros.
- `npm run e2e`: 328 testes passando.
- Capturas de 13 conceitos de todos os módulos, em desktop (1440) e celular (390), sem rolagem horizontal.

## Lotes

Um lote é um arquivo, ou uma parte de até 7 conceitos de um arquivo maior, na ordem de `MODULES`. Os conceitos do piloto são pulados dentro das faixas. São 147 lotes.

| Lote | Arquivo | Conceitos | Situação |
|---|---|---|---|
| 1 | `foundations/f01-infraestrutura (1/4)` | 6 (`infra.region` a `infra.service-scope`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 2 | `foundations/f01-infraestrutura (2/4)` | 6 (`infra.multi-az` a `infra.nat-zonal-regional`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 3 | `foundations/f01-infraestrutura (3/4)` | 5 (`infra.rds-multi-az` a `infra.outposts-service-link`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 4 | `foundations/f01-infraestrutura (4/4)` | 5 (`edge.pop` a `edge.global-accelerator`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 5 | `foundations/f02-suporte (1/2)` | 7 (`support.plans` a `support.case-types`) | validado em 24/10/2026: 2 reescritos, 5 preservados, 0 revisão manual |
| 6 | `foundations/f02-suporte (2/2)` | 6 (`support.severity` a `support.pricing`) | validado em 24/10/2026: 1 reescritos, 5 preservados, 0 revisão manual |
| 7 | `foundations/f03-responsabilidade (1/2)` | 6 (`srm.model` a `srm.ec2`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 8 | `foundations/f03-responsabilidade (2/2)` | 5 (`srm.rds` a `srm.incident`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 9 | `storage/f01-fundamentos (1/2)` | 7 (`s3.service` a `s3.object`) | validado em 24/10/2026: 5 reescritos, 2 preservados, 0 revisão manual |
| 10 | `storage/f01-fundamentos (2/2)` | 6 (`s3.object-key` a `s3.consistency`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 11 | `storage/f02-classes (1/2)` | 7 (`sc.overview` a `sc.glacier-ir`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 12 | `storage/f02-classes (2/2)` | 7 (`sc.glacier-flexible` a `glacier.vault-service`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 13 | `storage/f03-seguranca (1/2)` | 7 (`iam.authn-authz` a `iam.cross-account`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 14 | `storage/f03-seguranca (2/2)` | 6 (`s3.acl` a `macie.sensitive-data`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 15 | `storage/f04-criptografia (1/2)` | 5 (`crypto.at-rest-in-transit` a `kms.key-policy`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 16 | `storage/f04-criptografia (2/2)` | 5 (`s3.dsse-kms` a `s3.bucket-keys`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 17 | `storage/f05-versionamento (1/2)` | 5 (`s3.versioning` a `s3.restore-version`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 18 | `storage/f05-versionamento (2/2)` | 5 (`s3.versioning-suspended` a `backup.independent-copy`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 19 | `storage/f06-lifecycle (1/2)` | 4 (`lc.waterfall` a `lc.expiration`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 20 | `storage/f06-lifecycle (2/2)` | 4 (`lc.noncurrent` a `lc.conflicts`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 21 | `storage/f07-replicacao (1/2)` | 4 (`repl.crr-srr` a `repl.delete-markers`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 22 | `storage/f07-replicacao (2/2)` | 4 (`repl.kms` a `dr.rpo-rto`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 23 | `storage/f08-eventos` | 7 (`ev.notifications` a `ev.recursion`) | validado em 24/10/2026: 5 reescritos, 2 preservados, 0 revisão manual |
| 24 | `storage/f09-requester-pays` | 6 (`rp.basics` a `s3.data-transfer`) | validado em 24/10/2026: 2 reescritos, 4 preservados, 0 revisão manual |
| 25 | `storage/f10-gateway` | 6 (`sgw.overview` a `sgw.tape`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 26 | `storage/f11-transferencia` | 7 (`mig.network-math` a `s3.transfer-acceleration`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 27 | `identity/f01-identidades (1/2)` | 6 (`iam.root-user` a `iam.principal`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 28 | `identity/f01-identidades (2/2)` | 5 (`iam.long-vs-temp` a `iam.credential-report`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 29 | `identity/f02-mfa` | 6 (`iam.mfa` a `iam.mfa-condition`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 30 | `identity/f03-politicas (1/2)` | 6 (`iam.policy-elements` a `iam.policy-types`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 31 | `identity/f03-politicas (2/2)` | 5 (`iam.managed-vs-inline` a `iam.access-levels`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 32 | `identity/f04-avaliacao` | 3 (`iam.same-account` a `iam.explicit-resource-required`) | validado em 24/10/2026: 2 reescritos, 1 preservados, 0 revisão manual |
| 33 | `identity/f05-sts (1/2)` | 4 (`sts.temporary-credentials` a `sts.role-chaining`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 34 | `identity/f05-sts (2/2)` | 4 (`iam.switch-role` a `sts.session-tags`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 35 | `identity/f06-roles-pratica (1/2)` | 4 (`iam.service-role` a `iam.pass-role`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 36 | `identity/f06-roles-pratica (2/2)` | 4 (`iam.roles-anywhere` a `ram.sharing`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 37 | `identity/f07-federacao (1/2)` | 4 (`fed.federation` a `fed.identity-source`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 38 | `identity/f07-federacao (2/2)` | 4 (`fed.directory-service` a `fed.abac`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 39 | `identity/f08-guardrails (1/2)` | 6 (`org.organizations` a `iam.boundary-delegation`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 40 | `identity/f08-guardrails (2/2)` | 5 (`org.control-tower` a `iaa.policy-checks`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 41 | `compute/f01-ec2 (1/2)` | 6 (`ec2.instance` a `ec2.imds`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 42 | `compute/f01-ec2 (2/2)` | 5 (`ec2.lifecycle` a `ec2.session-manager`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 43 | `compute/f02-tipos (1/2)` | 5 (`ec2.type-naming` a `ec2.unlimited`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 44 | `compute/f02-tipos (2/2)` | 5 (`ec2.accelerated` a `ec2.compute-optimizer`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 45 | `compute/f03-ebs (1/2)` | 5 (`ebs.volume` a `ebs.hdd`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 46 | `compute/f03-ebs (2/2)` | 4 (`ebs.performance` a `ebs.encryption`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 47 | `compute/f04-compra (1/2)` | 5 (`ec2.on-demand` a `ec2.spot`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 48 | `compute/f04-compra (2/2)` | 4 (`ec2.spot-interruption` a `ec2.commitment-coverage`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 49 | `compute/f05-elb (1/2)` | 5 (`elb.alb` a `elb.target-groups`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 50 | `compute/f05-elb (2/2)` | 4 (`elb.health-checks` a `elb.stickiness`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 51 | `compute/f06-asg (1/2)` | 5 (`asg.group` a `asg.scheduled-predictive`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 52 | `compute/f06-asg (2/2)` | 4 (`asg.health-checks` a `asg.mixed-instances`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 53 | `compute/f07-lambda (1/2)` | 5 (`lambda.function` a `lambda.reserved`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 54 | `compute/f07-lambda (2/2)` | 5 (`lambda.provisioned` a `lambda.pricing`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 55 | `compute/f08-conteineres` | 7 (`ecs.basics` a `ecr.registry`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 56 | `compute/f09-escolha` | 7 (`cmp.spectrum` a `cmp.evs`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 57 | `database/f01-rds (1/2)` | 5 (`rds.what` a `rds.storage-autoscaling`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 58 | `database/f01-rds (2/2)` | 4 (`rds.parameter-group` a `rds.vs-ec2`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 59 | `database/f02-ha (1/2)` | 5 (`rds.multi-az-cluster` a `rds.replica-promotion`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 60 | `database/f02-ha (2/2)` | 4 (`rds.automated-backups` a `rds.proxy`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 61 | `database/f03-aurora (1/2)` | 4 (`aur.cluster-volume` a `aur.global-database`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 62 | `database/f03-aurora (2/2)` | 4 (`aur.serverless` a `aur.vs-rds`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 63 | `database/f04-dynamo` | 7 (`ddb.what` a `ddb.indexes`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 64 | `database/f05-dynamo-adv` | 7 (`ddb.streams` a `ddb.export`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 65 | `database/f06-cache` | 6 (`cache.why` a `nosql.keyspaces`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 66 | `database/f07-redshift` | 7 (`rs.oltp-olap` a `rs.vs-athena`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 67 | `database/f08-seguranca` | 7 (`db.encryption-at-rest` a `bkp.aws-backup`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 68 | `database/f09-migracao` | 6 (`dms.what` a `db.choosing`) | validado em 24/10/2026: 4 reescritos, 2 preservados, 0 revisão manual |
| 69 | `governance/f01-cloudwatch (1/2)` | 6 (`cw.what` a `cw.resolution-retention`) | validado em 24/10/2026: 4 reescritos, 2 preservados, 0 revisão manual |
| 70 | `governance/f01-cloudwatch (2/2)` | 6 (`cw.alarm` a `cw.dashboards`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 71 | `governance/f02-logs (1/2)` | 6 (`logs.groups` a `logs.metric-filter`) | validado em 24/10/2026: 4 reescritos, 2 preservados, 0 revisão manual |
| 72 | `governance/f02-logs (2/2)` | 5 (`logs.subscription` a `obs.managed-tools`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 73 | `governance/f03-cloudtrail (1/2)` | 5 (`trail.what` a `trail.delivery`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 74 | `governance/f03-cloudtrail (2/2)` | 4 (`trail.org-trail` a `trail.lake`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 75 | `governance/f04-config (1/2)` | 5 (`cfg.what` a `cfg.triggers`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 76 | `governance/f04-config (2/2)` | 4 (`cfg.remediation` a `cfg.vs-others`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 77 | `governance/f05-ssm (1/2)` | 5 (`ssm.what` a `ssm.patch-manager`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 78 | `governance/f05-ssm (2/2)` | 4 (`ssm.parameter-store` a `ssm.inventory-windows`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 79 | `governance/f06-iac (1/2)` | 4 (`cfn.what` a `cfn.deletion-policies`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 80 | `governance/f06-iac (2/2)` | 4 (`cfn.stacksets` a `gov.access-tools`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 81 | `governance/f07-multiconta (1/2)` | 4 (`gov.account-structure` a `gov.account-factory`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 82 | `governance/f07-multiconta (2/2)` | 4 (`gov.org-policies` a `gov.license-manager`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 83 | `governance/f08-custos (1/2)` | 4 (`fin.consolidated-billing` a `fin.budgets`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 84 | `governance/f08-custos (2/2)` | 4 (`fin.cost-allocation-tags` a `fin.recommendations`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 85 | `governance/f09-escolha` | 5 (`ops.trusted-advisor-checks` a `ops.which-service`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 86 | `network/f01-vpc` | 6 (`vpc.what` a `vpc.default-vpc`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 87 | `network/f02-rotas (1/2)` | 5 (`rt.route-table` a `rt.nat-gateway`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 88 | `network/f02-rotas (2/2)` | 4 (`rt.nat-per-az` a `rt.public-ipv4-cost`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 89 | `network/f03-seguranca (1/2)` | 4 (`sg.reference` a `sg.nacl-order`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 90 | `network/f03-seguranca (2/2)` | 4 (`sg.default-nacl` a `sg.reachability-analyzer`) | validado em 24/10/2026: 2 reescritos, 2 preservados, 0 revisão manual |
| 91 | `network/f04-conexao` | 7 (`tgw.peering` a `tgw.peering-vs-tgw`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 92 | `network/f05-endpoints` | 6 (`pl.gateway-endpoint` a `pl.nat-vs-endpoint`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 93 | `network/f06-hibrida (1/2)` | 4 (`hyb.site-to-site-vpn` a `hyb.vif`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 94 | `network/f06-hibrida (2/2)` | 4 (`hyb.dx-gateway` a `hyb.client-vpn`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 95 | `network/f07-dns (1/2)` | 5 (`dns.hosted-zones` a `dns.latency`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 96 | `network/f07-dns (2/2)` | 5 (`dns.failover` a `dns.resolver`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 97 | `network/f08-borda` | 7 (`cdn.oac` a `cdn.cf-vs-ga`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 98 | `network/f09-protecao (1/2)` | 4 (`edgesec.waf` a `edgesec.shield-standard`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 99 | `network/f09-protecao (2/2)` | 4 (`edgesec.shield-advanced` a `net.choose`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 100 | `analytics/f01-datalake` | 6 (`lake.what` a `lake.small-files`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 101 | `analytics/f02-glue (1/2)` | 4 (`glue.data-catalog` a `glue.format-conversion`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 102 | `analytics/f02-glue (2/2)` | 4 (`glue.bookmarks` a `glue.databrew`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 103 | `analytics/f03-athena` | 7 (`athena.what` a `athena.partition-projection`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 104 | `analytics/f04-lakeformation` | 7 (`lf.what` a `lf.cross-account`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 105 | `analytics/f05-emr` | 6 (`emr.what` a `emr.vs-glue-athena`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 106 | `analytics/f06-ingestao` | 7 (`ingest.patterns` a `ingest.secure`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 107 | `analytics/f07-visualizacao` | 7 (`os.what` a `ana.which-tool`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 108 | `analytics/f08-servicos-prontos` | 7 (`ai.ready-vs-custom` a `front.amplify-devicefarm`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 109 | `analytics/f09-escolha` | 3 (`ana.choose` a `ana.lake-reference`) | validado em 24/10/2026: 3 reescritos, 0 preservados, 0 revisão manual |
| 110 | `security/f01-kms` | 7 (`sec.at-rest-in-transit` a `kms.admin-vs-user`) | validado em 24/10/2026: 5 reescritos, 2 preservados, 0 revisão manual |
| 111 | `security/f02-kms-avancado` | 7 (`kms.rotation` a `hsm.kms-vs-cloudhsm`) | validado em 24/10/2026: 5 reescritos, 2 preservados, 0 revisão manual |
| 112 | `security/f03-segredos` | 7 (`secret.where` a `secret.vs-parameter-store`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 113 | `security/f04-certificados` | 7 (`acm.what` a `acm.exportable`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 114 | `security/f05-deteccao (1/2)` | 4 (`gd.what` a `insp.what`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 115 | `security/f05-deteccao (2/2)` | 4 (`insp.finding-types` a `sec.delegated-admin`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 116 | `security/f06-dados` | 6 (`sec.data-classification` a `bkp.vault-lock`) | validado em 24/10/2026: 4 reescritos, 2 preservados, 0 revisão manual |
| 117 | `security/f07-postura` | 6 (`shub.cspm` a `sec.compliance-evidence`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 118 | `security/f08-resposta` | 4 (`sec.web-threats` a `sec.containment`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 119 | `security/f09-escolha` | 2 (`sec.choose` a `sec.which-protection`) | validado em 24/10/2026: 2 reescritos, 0 preservados, 0 revisão manual |
| 120 | `integration/f01-sqs` | 5 (`int.sync-async` a `sqs.dlq`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 121 | `integration/f02-sqs-escala` | 6 (`sqs.fifo` a `sqs.partial-batch`) | validado em 24/10/2026: 4 reescritos, 2 preservados, 0 revisão manual |
| 122 | `integration/f03-sns` | 4 (`sns.what` a `sns.retries-dlq`) | validado em 24/10/2026: 4 reescritos, 0 preservados, 0 revisão manual |
| 123 | `integration/f04-eventbridge` | 7 (`eb.bus` a `eb.pipes`) | validado em 24/10/2026: 4 reescritos, 3 preservados, 0 revisão manual |
| 124 | `integration/f05-step-functions` | 5 (`sfn.what` a `sfn.integration-patterns`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 125 | `integration/f06-api-gateway` | 7 (`apigw.what` a `apigw.auth`) | validado em 24/10/2026: 7 reescritos, 0 preservados, 0 revisão manual |
| 126 | `integration/f07-streaming` | 3 (`kds.partition-key` a `int.queue-vs-stream`) | validado em 24/10/2026: 3 reescritos, 0 preservados, 0 revisão manual |
| 127 | `integration/f08-mq` | 3 (`mq.what` a `mq.vs-sqs`) | validado em 24/10/2026: 3 reescritos, 0 preservados, 0 revisão manual |
| 128 | `integration/f09-padroes` | 5 (`int.choreography-orchestration` a `int.choose`) | validado em 24/10/2026: 5 reescritos, 0 preservados, 0 revisão manual |
| 129 | `files/f01-efs` | 6 (`efs.what` a `efs.encryption`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 130 | `files/f02-efs-custo` | 5 (`efs.throughput-modes` a `efs.replication`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 131 | `files/f03-windows` | 6 (`fsx.family` a `fsxw.dedup`) | validado em 24/10/2026: 5 reescritos, 1 preservados, 0 revisão manual |
| 132 | `files/f04-lustre` | 3 (`lustre.what` a `lustre.s3-link`) | validado em 24/10/2026: 3 reescritos, 0 preservados, 0 revisão manual |
| 133 | `files/f05-ontap-zfs` | 5 (`ontap.what` a `zfs.deployment`) | validado em 24/10/2026: 2 reescritos, 3 preservados, 0 revisão manual |
| 134 | `files/f06-escolha` | 4 (`files.choose` a `xfer.identity`) | validado em 24/10/2026: 3 reescritos, 1 preservados, 0 revisão manual |
| 135 | `files/f07-backup` | 7 (`bkp.plan` a `bkp.restore-testing`) | validado em 24/10/2026: 5 reescritos, 2 preservados, 0 revisão manual |
| 136 | `architecture/f01-well-architected (1/2)` | 6 (`wa.framework` a `wa.pillar-performance`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 137 | `architecture/f01-well-architected (2/2)` | 6 (`wa.pillar-cost` a `wa.tradeoffs`) | validado em 24/10/2026: 3 reescritos, 3 preservados, 0 revisão manual |
| 138 | `architecture/f02-resiliencia` | 4 (`res.horizontal-scaling` a `res.data-plane`) | validado em 24/10/2026: 1 reescritos, 3 preservados, 0 revisão manual |
| 139 | `architecture/f03-recuperacao` | 6 (`dr.backup-restore` a `dr.replication-not-backup`) | validado em 24/10/2026: 6 reescritos, 0 preservados, 0 revisão manual |
| 140 | `architecture/f04-desempenho` | 5 (`perf.purpose-built` a `perf.experiment`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 141 | `architecture/f05-seguranca` | 3 (`wa.sec-identity` a `wa.sec-automate`) | validado em 24/10/2026: 3 reescritos, 0 preservados, 0 revisão manual |
| 142 | `architecture/f06-custos` | 7 (`opt.rightsizing` a `opt.serverless-vs-provisioned`) | validado em 24/10/2026: 6 reescritos, 1 preservados, 0 revisão manual |
| 143 | `architecture/f07-migracao (1/2)` | 5 (`mig.strategies` a `mig.relocate`) | validado em 24/10/2026: 2 reescritos, 3 preservados, 0 revisão manual |
| 144 | `architecture/f07-migracao (2/2)` | 5 (`mig.repurchase` a `mig.mgn-lifecycle`) | validado em 24/10/2026: 2 reescritos, 3 preservados, 0 revisão manual |
| 145 | `architecture/f08-padroes (1/2)` | 5 (`pat.three-tier` a `pat.strangler-fig`) | validado em 24/10/2026: 4 reescritos, 1 preservados, 0 revisão manual |
| 146 | `architecture/f08-padroes (2/2)` | 5 (`pat.multi-region` a `pat.canary-linear`) | validado em 24/10/2026: 3 reescritos, 2 preservados, 0 revisão manual |
| 147 | `architecture/f09-exame` | 5 (`exam.format` a `exam.multiple-response`) | validado em 24/10/2026: 1 reescritos, 4 preservados, 0 revisão manual |

## Ciclo de cada lote

1. Rodar `inventory.mjs --set situacao=in_progress lote=<n> -- <ids>` e marcar o lote como "em andamento" na tabela acima.
2. Rodar `dump.mjs <ids>`, ler os fatos já registrados na VERIFICACAO e reescrever os conceitos. Conferir os fatos novos na documentação oficial e registrá-los na VERIFICACAO, na seção "Revisão didática do Codex".
3. `check.mjs` sem erros.
4. `npm run typecheck`, `npm run lint` e `npx vitest run src/content src/engine src/features/codex`.
5. Captura em desktop do conceito mais longo, ao fim de cada módulo.
6. Rodar `inventory.mjs` com `validated`, `unchanged` ou `needs_review`, anotar o lote na tabela, listar os resumos alterados (que aparecem nos Conceitos-chave) e atualizar o PONTO DE RETOMADA.

## PONTO DE RETOMADA

- **Último lote validado:** 147 (`architecture/f09-exame`).
- **Próximo lote:** nenhum.
- **Próximo id não validado:** nenhum.
- **Conceitos em andamento:** nenhum.
- **Observação:** Revisão concluída em 24/10/2026: os 147 lotes estão validados e a validação final passou. Em 25/10/2026, as alterações foram commitadas na branch `revisao/codex`, um arquivo por commit, e enviadas para revisão num PR.
- **Arquivos alterados fora de commit:** nenhum.
- **Antes de continuar:** rodar `git status` e `check.mjs`; os conceitos alterados precisam estar `rewritten`, `validated` ou `needs_review` no CSV. Depois, seguir o ciclo do lote.
