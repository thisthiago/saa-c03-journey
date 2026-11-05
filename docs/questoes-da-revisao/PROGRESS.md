# Questões da Revisão: andamento

## PONTO DE RETOMADA

- Piloto aprovado pelo usuário em 02/11/2026 ("segue com as revisões das questões"). Parte 2 em andamento: Foundations.
- Feito: Foundations inteira em 02/11/2026: `fnd.f01` (20 questões), `fnd.f02` (8) e `fnd.f03` (10). typecheck, lint, `npm test` (597) e os 3 e2e da Revisão verdes.
- S3 Expedition concluída em 02/11/2026 (11 fases, 102 questões). typecheck, lint, `npm test` (609) e os 3 e2e da Revisão verdes.
- IAM e Access Management concluída em 02/11/2026 (8 fases, 87 questões). typecheck, lint, `npm test` (609) e os 3 e2e da Revisão verdes. Dificuldade no total voltou a 24/51/25.
- Computação na AWS concluída em 03/11/2026 (9 fases, 110 questões; a F6 é do piloto). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total caiu para d1 41%, d2 22%, d3 19% e d4 18%. Itens escritos à mão de `f04-compra.ts` e `f05-elb.ts` avaliados e retirados.
- 03/11/2026: o PR #16 (confiança e limite de 30 itens por dia) foi mergeado nesta branch; nada muda no formato das questões.
- Bancos de dados na AWS concluída em 03/11/2026 (9 fases, 107 questões). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total: d1 34%, d2 24%, d3 23% e d4 19%. Itens escritos à mão de `f01-rds.ts` e `f09-migracao.ts` avaliados e retirados.
- Monitoramento e governança na AWS concluída em 04/11/2026 (9 fases, 128 questões). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total: d1 33%, d2 25%, d3 22% e d4 20%. Itens escritos à mão de `f04-config.ts` e `f05-ssm.ts` avaliados e retirados. Próxima trilha: Redes (sem a F5). Continuar puxando d2, d3 e d4.
- Redes na AWS concluída em 04/11/2026 (9 fases, 112 questões; a F5 é do piloto). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total: d1 33%, d2 27%, d3 21% e d4 19%; dificuldade 24/52/24; 11% de resposta múltipla. Próxima trilha: Análise de dados (primeira fase do módulo analytics). Puxar d3 e d4, que ficaram abaixo da meta.
- Análise de dados e serviços de IA na AWS concluída em 04/11/2026 (9 fases, 94 questões). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total: d1 31%, d2 25%, d3 24% e d4 20%; dificuldade 25/51/24; 11% de resposta múltipla. Itens escritos à mão de `f02-glue.ts`, `f04-lakeformation.ts` e `f09-escolha.ts` avaliados e retirados. Fatos que mudam com o tempo (Regiões do MSK Serverless e do Device Farm, idiomas do Comprehend) não são cobrados. Próxima trilha: Segurança (primeira fase do módulo security).
- Segurança e proteção de dados na AWS concluída em 04/11/2026 (9 fases, 87 questões). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes. Domínio no total: d1 35%, d2 24%, d3 22% e d4 19%; dificuldade 25/51/24; 12% de resposta múltipla. Itens escritos à mão de `security/concepts/f01-kms.ts` e `f08-resposta.ts` avaliados e retirados. Próxima trilha: Integração (primeira fase do módulo integration). O d1 passou da meta (30%): nas trilhas que faltam (Integração, Arquivos e Arquitetura), priorizar d2, d3 e d4.
- Integração e mensageria na AWS concluída em 04/11/2026 (9 fases, 76 questões). typecheck, lint, `npm test` (620) e os 5 e2e da Revisão verdes; numa das execuções, o teste "toda atividade pode ser concluída com 100%" falhou uma vez e passou nas duas seguintes, sem mudança (instável sob carga, não relacionado às questões da Revisão). Domínio no total: d1 33%, d2 28%, d3 21% e d4 18%. Próxima trilha: Arquivos e backup (primeira fase do módulo files). Priorizar d3 e d4.
- Arquivos e backup na AWS concluída em 05/11/2026 (7 fases, 55 questões). typecheck, lint, `npm test` e os e2e da Revisão verdes. Domínio no total: d1 32%, d2 27%, d3 22% e d4 19%; dificuldade 25/51/24; 13% de resposta múltipla. Fatos novos conferidos (EFS, FSx, Transfer Family e AWS Backup) registrados na VERIFICACAO; itens que cobravam Vault Lock e a política de backup do Organizations, conceitos de outras trilhas, foram reconstruídos. Próxima trilha: Arquitetura e otimização (primeira fase do módulo architecture), a última antes do fechamento. Priorizar d3 e d4.
- Arquitetura e otimização na AWS concluída em 05/11/2026 (9 fases, 91 questões). Com ela, as 101 fases têm questões próprias: 1.079 questões no total, cobrindo os 1.945 itens antigos (740 reformulados e 1.205 reconstruídos). Distribuição final: dificuldade 24/52/24; domínios d1 30%, d2 29%, d3 22% e d4 19%; 13% de resposta múltipla. Itens que cobravam conceitos de outras trilhas (Snow Family, Data Transfer Terminal, Session Manager, Route 53, health checks) foram reconstruídos sobre os conceitos da própria fase.
- Fechamento em 05/11/2026: `deriveReviewItems`, a cópia automática das atividades e o campo `reviewItems` dos conceitos saíram do motor; o fixture dos testes ganhou um conjunto próprio; novo teste exige questões da Revisão em toda fase disponível que não é final; CONTEUDO, ARQUITETURA, README e EXECUTAR atualizados (1.079 questões de revisão).
- Antes de retomar:
  - ler o PLAN e o DECISIONS;
  - conferir `git status` na branch `revisao/questoes-da-revisao`;
  - rodar `check.mjs all` e `progress.mjs`.

## Andamento

<!-- andamento:início -->
| Trilha | Fases migradas | Questões novas | Itens antigos | Aprovadas | Reformuladas | Reconstruídas |
|---|---|---|---|---|---|---|
| AWS Foundations | 3 de 3 | 38 | 97 | 0 | 18 | 79 |
| S3 Expedition | 11 de 11 | 101 | 228 | 0 | 66 | 162 |
| IAM e Access Management | 8 de 8 | 87 | 210 | 0 | 71 | 139 |
| Computação na AWS | 9 de 9 | 110 | 190 | 0 | 31 | 159 |
| Bancos de dados na AWS | 9 de 9 | 107 | 191 | 0 | 73 | 118 |
| Monitoramento e governança na AWS | 9 de 9 | 121 | 298 | 0 | 106 | 192 |
| Redes na AWS | 9 de 9 | 112 | 138 | 0 | 61 | 77 |
| Análise de dados e serviços de IA na AWS | 9 de 9 | 94 | 119 | 0 | 68 | 51 |
| Segurança e proteção de dados na AWS | 9 de 9 | 87 | 112 | 0 | 67 | 45 |
| Integração e mensageria na AWS | 9 de 9 | 76 | 115 | 0 | 58 | 57 |
| Arquivos e backup na AWS | 7 de 7 | 55 | 88 | 0 | 46 | 42 |
| Arquitetura e otimização na AWS | 9 de 9 | 91 | 159 | 0 | 75 | 84 |
| **Total** | **101 de 101** | **1079** | **1945** | **0** | **740** | **1205** |
<!-- andamento:fim -->

## Piloto (29/10/2026)

| Fase | Questões | Resposta múltipla | Itens antigos | Reformulados | Reconstruídos |
|---|---|---|---|---|---|
| `s3x.f02` Classes de armazenamento e custos | 12 | 1 | 24 | 5 | 19 |
| `net.f05` Acesso privado a serviços | 6 | 2 | 16 | 3 | 13 |
| `cmp.f06` Auto Scaling | 9 | 1 | 12 | 3 | 9 |
| **Total** | **27** | **4** | **52** | **11** | **41** |

Nenhum item antigo foi aprovado sem mudança: todos tinham 2 ou 3 alternativas, dependiam do contexto da missão ou repetiam uma decisão do Banco.

- **Distribuição das 27 questões:**
  - dificuldade 19% fácil, 48% média e 33% difícil;
  - domínios d1 11%, d2 33%, d3 15% e d4 41%; as trilhas de IAM e Segurança devem levar o d1 para perto dos 30% do exame;
  - 15% de resposta múltipla;
  - a correta é a mais longa em 4 das 23 questões de resposta única.
- **Validação:** typecheck, lint, testes de conteúdo e do motor, e os três e2e da Revisão (`tests/e2e/smoke.spec.ts`), todos verdes.
- **Item escrito à mão migrado:** `rv:s3.storage-class-analysis:quando`, que saiu de `storage/concepts/f02-classes.ts`.
