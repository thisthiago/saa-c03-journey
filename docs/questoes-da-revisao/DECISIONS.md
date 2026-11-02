# Questões da Revisão: decisões

## Do usuário (29/10/2026)

| Decisão | Escolha |
|---|---|
| Escopo | Só a Revisão (Revisão do dia e Treino livre). O Banco de questões e o simulado ficam como estão. |
| Fases | Não mudam: "a didática das questões da fase está dentro do esperado". A Revisão deixa de copiar as atividades. |
| Cabeçalho da rodada | O título e o nome oficial do conceito ficam escondidos até a resposta, porque entregariam a resposta de questões do tipo "qual serviço atende". |
| Volume | Todo conceito em pelo menos 1 questão; os 385 de relevância alta em 2 (cerca de 500 questões). |
| Entrega | Piloto mostrado no chat para aprovação; depois, por partes incrementais, porque a sessão pode acabar. |
| Commits | Nenhum commit, push ou PR sem pedido. Quando pedirem, usar a skill alisar-o-pelo. |

## Do projeto

| Data | Decisão | Motivo |
|---|---|---|
| 29/10/2026 | As questões são `decision`, com `domain`, e moram em `review/fNN.ts` por fase. | `decision` já tem resposta múltipla, consequência por alternativa e explicação, e a tela da Revisão já sabe mostrar. O domínio permite conferir a distribuição. |
| 29/10/2026 | A questão marca só conceitos ensinados pela primeira vez na própria fase. | A Revisão sorteia por conceito; uma questão que marcasse um conceito de fase anterior apareceria para quem ainda não fez a fase dela. |
| 29/10/2026 | Questão reformulada mantém o id do item antigo; questão nova recebe `rv:<fase>.<assunto>`. | O progresso é por conceito; o id do item só aparece em `lastReviewItemId`, que evita repetir a questão da vez anterior. Um id antigo ali é inofensivo. |
| 29/10/2026 | Uma rodada nunca repete a questão: se a escolhida para um conceito já entrou, usa outra do conceito; sem outra, pula o conceito. | Uma questão pode marcar vários conceitos; ela atualiza o domínio de todos eles. |
| 29/10/2026 | O teste "respeita o tamanho escolhido" passou a usar o primeiro conceito de cada fase. | Com questões que marcam vários conceitos, 20 conceitos da mesma fase podem ter menos de 16 questões distintas. |
| 29/10/2026 | A questão do Glacier (`s3x.f02.m3.a5`) foi reconstruída para quem já usa vaults e vai arquivar dados novos. | A versão anterior repetia a decisão do Banco (`q.s3x.deep-archive`). |

## Avisos do `check.mjs` aceitos

| Questão | Aviso | Por que fica |
|---|---|---|
| `rv:s3x.f02.backup-8-horas` | Parecida com `q.s3x.deep-archive` (0,26) | Só o vocabulário coincide. O prazo de 8 horas elimina o Deep Archive, e a resposta é o Glacier Flexible Retrieval. |
| `rv:s3x.f02.m3.a3` | Parecida com `q.s3x.deep-archive` (0,32) | A decisão é agrupar objetos pequenos antes de arquivar, não escolher a classe pelo prazo. |
| `rv:net.f05.nat-dynamodb-sqs` | Parecida com `q.arq.opt-nat` (0,26) | O Banco pergunta pelo S3 e tem uma resposta. Esta é de resposta múltipla, com o DynamoDB (endpoint de gateway) e o SQS (endpoint de interface). |
| `rv:fnd.f03.camadas-de-patch` | Parecida com `q.fnd.srm-ec2` (0,26) | O Banco pergunta só quem aplica o patch do sistema operacional no EC2. Esta divide três camadas (hypervisor, sistema operacional e aplicação) e cobra a gestão de patches como controle compartilhado. |
| `rv:s3x.f01.boss.a3` | Parecida com `q.fnd.data-residency` (0,27) | O Banco pergunta em qual Região criar os recursos. Esta parte de um bucket já criado na Região errada e cobra que Região e nome não mudam depois da criação. |
| `rv:s3x.f03.m1.a4` | Parecida com `q.arq.sec-role` (0,27) | As duas levam a uma role, mas esta parte de chaves vazadas no código e compara com rotação, variável de ambiente e usuários por instância. |
| `rv:s3x.f03.m2.a1` | Parecida com `q.s3x.kms-cross-account` (0,29) | O Banco trata da chave KMS que falta liberar. Aqui não há criptografia: falta a política da role na conta de origem. |
| `rv:s3x.f04.m3.a1` | Parecida com `q.s3x.kms-cross-account` (0,31) | O Banco é entre contas. Esta é na mesma conta e cobra que, sem a key policy delegar à conta, `kms:Decrypt` no IAM não funciona. |
| `rv:s3x.f05.m1.a2` | Parecida com `q.s3x.delete-marker` (0,30) | O Banco aceita remover o delete marker. Aqui a auditoria exige manter a exclusão no histórico, e remover o marker vira o distrator. |
| `rv:s3x.f07.m3.a3` | Parecida com `q.s3x.batch-replication` (0,31) | O Banco pergunta como copiar os objetos antigos. Esta é de resposta múltipla e cobra quais objetos ficam de fora por padrão, incluindo os do Glacier. |
| `rv:s3x.f10.storage-no-limite` | Parecida com `q.s3x.stored-volumes` (0,26) | O Banco pede baixa latência para todo o conjunto (stored volumes). Esta pede reduzir o armazenamento local (cached volumes). |
| 02/11/2026: ids novos | `rv:s3x.f06.planos-de-transicao`, `rv:s3x.f07.logs-centralizados`, `rv:s3x.f10.storage-no-limite` e `rv:s3x.f10.link-caido` | Renomeados porque imitavam itens antigos (`m1.a2`, `m1.a1`, `boss.a1`) sem ser reformulações. Um id antigo só é mantido quando a questão é a reformulação daquele item. |
| `rv:s3x.f11.m1.a3` | Parecida com `q.fnd.outposts` (0,32) | O Banco escolhe o Outposts por requisitos de local. Esta parte de uma recomendação do Snowball Edge para um cliente novo e cobra a alternativa à Snow Family. |
| `rv:iax.f02.m1.a4` | Parecida com `q.iax.root-central` (0,32) | A resposta coincide, mas o motivo cobrado é outro: o Banco parte da guarda de senhas e MFA espalhados; esta parte da exigência de MFA no root de todas as contas-membro e cobra que ela vale para contas-membro, sem dispensa por SCP. |
| `rv:iax.f03.m1.a3` | Parecida com `q.iax.arn-object` (0,39) | O Banco corrige um GetObject escrito com o ARN do bucket. Esta faz o caminho inverso (ListBucket com o ARN dos objetos) e cobra a correção de menor privilégio, sem perder o download. |
| `rv:iax.f05.m2.a3` | Parecida com `q.iax.sts-chaining` (0,31) | O Banco cobra o limite de 1 hora do encadeamento. Esta não tem encadeamento: cobra que um pedido acima do máximo da role faz a chamada falhar, sem corte para o máximo. |
| `rv:iax.f07.desligamento` | Parecida com `q.iax.identity-center` (0,32) | O Banco escolhe o Identity Center para login único em várias contas. Esta parte de usuários IAM de ex-funcionários e cobra o motivo de segurança da federação: desativar no provedor corta o acesso. |
| `rv:iax.f07.m2.a1:lab` | Parecida com `q.iax.managed-ad` (0,33) | O Banco pede um AD de verdade com trust (Managed Microsoft AD). Esta pede o menor custo sem trust nem MFA, e a resposta é o Simple AD. |
