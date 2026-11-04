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
| Redes na AWS | 1 de 9 | 6 | 138 | 0 | 3 | 13 |
| Análise de dados e serviços de IA na AWS | 0 de 9 | 0 | 119 | 0 | 0 | 0 |
| Segurança e proteção de dados na AWS | 0 de 9 | 0 | 112 | 0 | 0 | 0 |
| Integração e mensageria na AWS | 0 de 9 | 0 | 115 | 0 | 0 | 0 |
| Arquivos e backup na AWS | 0 de 7 | 0 | 88 | 0 | 0 | 0 |
| Arquitetura e otimização na AWS | 0 de 9 | 0 | 159 | 0 | 0 | 0 |
| **Total** | **50 de 101** | **570** | **1945** | **0** | **368** | **862** |
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
