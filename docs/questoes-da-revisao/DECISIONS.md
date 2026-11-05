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
| `rv:cmp.f03.iops-sem-crescer` | Parecida com `q.cmp.io2-critical` e `q.cmp.st1` (0,27) | Só o vocabulário de EBS coincide. Esta pede poucos IOPS a mais num volume pequeno, e a resposta é provisionar IOPS no gp3. |
| `rv:cmp.f07.arm-mais-barato` | Parecida com `q.cmp.graviton` (0,28) e `q.fil.ontap-tiering` (0,26) | O Banco trata do Graviton em instâncias EC2. Esta é a arquitetura Arm em funções Lambda, cobrada pelo GB-segundo. |
| `rv:cmp.f08.kubernetes-sem-nos` | Parecida com `q.cmp.fargate-ops` (0,31) | O Banco escolhe o Fargate no ECS. Esta parte de manifestos Kubernetes e cobra o EKS com pods no Fargate. |
| `rv:cmp.f09.urgentes-e-baratos` | Parecida com `q.cmp.batch-queue` (0,30) | O Banco cobra dependências entre jobs e Spot. Esta cobra filas com prioridade ligadas a capacidades diferentes (On-Demand e Spot). |
| `rv:cmp.f09.m1.a4:extra` e `rv:cmp.f09.parte-do-trafego` | Parecidas com `q.cmp.beanstalk-immutable` e `q.cmp.beanstalk-bluegreen` (0,27 a 0,33) | As respostas são outras políticas: rolling with additional batch (capacidade sem frota nova) e traffic splitting (parte do tráfego). |
| `rv:cmp.f09.m2.a2` | Parecida com `q.cmp.sar` (0,29) | O Banco pergunta onde publicar. Esta parte de uma aplicação já publicada e cobra a implantação a partir do repositório. |
| 03/11/2026: questões trocadas | `rv:cmp.f01.uma-zona-so`, `rv:cmp.f03.snapshot-para-auditoria`, `rv:cmp.f07.pedido-duplicado` | Saíram antes de entrar no conjunto por repetirem a decisão de `q.fnd.multi-az`, `q.db.share-snapshot` e `q.int.idempotency`. |
| `rv:db.f01.dois-bancos-dois-volumes` | Parecida com `q.db.burstable` (0,26) | O Banco escolhe a classe com burst para carga intermitente. Esta separa dois bancos com perfis de I/O diferentes em volumes de classes diferentes. |
| `rv:db.f01.m3.a4` | Parecida com `q.cmp.beanstalk-bluegreen` (0,32) | Só o nome Blue/Green coincide: aqui é a implantação Blue/Green do RDS, para atualizar a versão do motor com pouca parada. |
| `rv:db.f01.acesso-de-casa` | Distrator trocado em 03/11/2026 | O distrator do Elastic IP no RDS saiu porque a documentação não diz que é impossível associar um; entrou o acesso público por algumas horas. |
| `rv:db.f04.m3.a1` | Parecida com `q.db.ddb-hot` (0,33) | O Banco tem um valor dominante (um prédio com 70% do tráfego) e cobra o write sharding. Esta usa a data do dia como chave e cobra a troca por uma chave de muitos valores, com o sob demanda como distrator. |
| `rv:db.f07.m2.a2` | Parecida com `q.db.spectrum` (0,29) | O Banco junta histórico e tabelas num cluster. Esta cobra que vários clusters leem os mesmos arquivos ao mesmo tempo, sem cópias, com o data sharing e o zero-ETL como distratores. |
| `rv:db.f07.m3.a1` | Parecida com `q.db.zero-etl` (0,34) | O Banco parte do Aurora MySQL. Esta parte do DynamoDB, com Streams e Lambda como distrator plausível de pipeline próprio. |
| `rv:db.f08.m2.a2` | Parecida com `q.db.encrypt-existing` (0,35) | O Banco cobra o caminho do snapshot copiado. Esta acrescenta o critério de menor parada, e a resposta passa a ser a implantação Blue/Green com o ambiente verde criptografado. |
| `rv:db.f08.m2.a3` | Parecida com `q.db.iam-auth` (0,29) e `q.db.secrets-rotation` (0,27) | O motor é SQL Server, que elimina a autenticação IAM (a resposta do primeiro) e leva ao Secrets Manager por exclusão. |
| `rv:db.f09.m1.a2` | Parecida com `q.db.sct` (0,28) | O Banco pede as duas ferramentas da migração. Esta cobra o passo anterior: a avaliação de complexidade da conversão de esquema, antes de aprovar o projeto. |
| `rv:gov.f01.m3.a5` | Parecida com `q.gov.m-of-n` (0,26) | O Banco pede o M de N para ignorar picos. Esta acrescenta o limite de espera e faz comparar intervalos de avaliação (período vezes N). |
| `rv:gov.f01.m4.a3` | Parecida com `q.gov.composite` (0,26) | O Banco cria o composto para um aviso único. Esta cobra o limite das ações do composto (sem ações do EC2) e a Lambda como saída. |
| `rv:gov.f03.boss.a2` | Parecida com `q.gov.trail-data-events` (0,28) | O Banco liga os eventos de dados de um bucket. Esta cobra o seletor avançado só com DeleteObject, num bucket com milhões de leituras. |
| `rv:gov.f03.m1.a4` | Parecida com `q.gov.trail-history` (0,32) | O Banco tem o evento dentro dos 90 dias (a resposta é o histórico). Esta tem 120 dias: o evento já não existe, e a resposta é criar a trilha daqui em diante. |
| `rv:gov.f03.m3.a4:keep` | Parecida com `q.s3x.deep-archive` (0,31) | Só o vocabulário de guarda longa coincide; aqui a decisão é a trilha de várias Regiões no S3. |
| `rv:gov.f04.m1.a2` | Parecida com `q.gov.config-recording-cost` (0,26) | O Banco reduz o custo pela gravação diária. Esta exige detecção na hora, e a resposta é gravar só os tipos da política, com a gravação diária como distrator. |
| `rv:gov.f08.m3.a2` | Parecida com `q.gov.budget-forecast` (0,29) | O Banco escolhe o alerta de valor previsto. Esta dá o gasto diário e pede o dia em que o alerta de valor real dispara (o cálculo do acumulado). |
| `rv:net.f01.m3.a3` | Parecida com `q.net.eigw` (0,27) | O Banco pede a rota para só sair por IPv6 (egress-only, ensinado na F2). Esta avalia se o IPv6 com rota para o internet gateway fica exposto, sem cobrar o egress-only. |
| `rv:net.f02.m3.a2` | Parecida com `q.net.nat-per-az` (0,30) | O Banco tem um NAT só e pede o desenho. Aqui já há um NAT por zona, e o erro está nas tabelas de rotas, que mandam tudo para a zona A. |
| `rv:net.f02.nat-no-desenvolvimento` | Parecida com `q.net.nat-per-az` (0,27) | O critério é o inverso: o ambiente aceita perder a saída numa queda de zona e pede o menor custo, e a resposta é um NAT só. |
| `rv:net.f02.pilha-dupla` | Parecida com `q.net.eigw` (0,32) | O Banco pede só a rota IPv6. Esta é de resposta múltipla, com as duas famílias, e cobra que as rotas IPv4 e IPv6 são independentes. |
| `rv:net.f03.faixa-atacante` | Parecida com `q.net.nacl-order` (0,27) | O Banco já está na ACL e pede o número da regra. Esta compara as camadas (security group, ACL antes e depois da permissão, lista de clientes). |
| `rv:net.f03.m2.a1` | Parecida com `q.net.nacl-stateless` (0,32) | O Banco tem o servidor recebendo conexões e pede a saída efêmera. Aqui o servidor inicia a conexão, e a regra que falta é a de entrada. |
| `rv:net.f04.contas-da-organizacao` | Parecida com `q.net.tgw-many` (0,28) | O Banco escolhe o Transit Gateway para dezenas de VPCs e uma VPN. Esta tem VPCs em várias contas e cobra o compartilhamento pelo AWS RAM. |
| `rv:net.f06.m2.a3` | Parecida com `q.net.dx-encryption` (0,27) | O Banco tem uma dedicada de 10 Gbps e aceita as duas opções. Esta tem uma conexão hospedada, em que o MACsec vira distrator e só a VPN atende. |
| `rv:net.f06.m3.a1` | Parecida com `q.net.dx-resiliency` (0,34) | O Banco pede resistir à queda de um local (dois locais). Esta pede o SLA de 99,99%, e a resposta do Banco vira distrator (alta resiliência, 99,9%). |
| `rv:net.f07.perto-nao-e-rapido` | Parecida com `q.net.latency-routing` (0,26) | O Banco escolhe a política do zero. Esta parte de uma geolocalização mal usada e tem o registro por país como distrator. |
| `rv:net.f07.geoproximidade` | Parecida com `q.net.latency-routing` (0,29) | Só o vocabulário de Regiões coincide; a resposta é a geoproximidade, para deslocar tráfego entre recursos. |
| `rv:net.f07.m3.a3` | Parecida com `q.net.tgw-many` (0,32) | Só o vocabulário de muitas contas e Direct Connect coincide; a decisão é o endpoint de saída do Resolver com a regra compartilhada. |
| `rv:net.f08.m3.a2` | Parecida com `q.net.global-accelerator` (0,38) e `q.fnd.global-accelerator` (0,29) | A resposta coincide, mas o cenário é TCP (MQTT) em vez de UDP, e os distratores cobram o failover do Route 53 e um NLB com Elastic IPs por Região. |
| `rv:net.f09.m1.a1` | Parecida com `q.net.waf-sqli` (0,36) e `q.sec.waf-sqli` (0,26) | O Banco já tem um ALB. Aqui a aplicação está atrás de um NLB, que não aceita o WAF, e a decisão passa por trocar o balanceador. |
| `rv:net.f09.comecar-na-borda` | Parecida com `q.cmp.graviton` (0,26) | Só o vocabulário de instâncias coincide; a decisão é a arquitetura de borda contra DDoS. |
| `rv:ana.f02.m2.a2` | Parecida com `q.ana.glue-cost` (0,27) | A primeira versão repetia a conta do Banco (0,41) e foi trocada em 04/11/2026: agora cobra o mínimo de 1 minuto por execução, com o mínimo do crawler como distrator. |
| `rv:ana.f03.m1.a3` | Parecida com `q.ana.athena-billing` (0,33) | O Banco tem uma resposta (só a consulta minúscula). Esta é de resposta múltipla e acrescenta a consulta cancelada, que paga o que já leu. |
| `rv:ana.f04.m2.a1` | Parecida com `q.ana.lf-rows` (0,33) | O Banco filtra só linhas. Esta combina linhas e colunas (o CPF), e as visões com acesso à tabela original entram como distrator. |
| `rv:ana.f05.m3.a1` | Parecida com `q.ana.emr-transient` (0,26) | A resposta coincide, mas esta parte do padrão do console (longa duração) e tem as instâncias reservadas como distrator; a questão do cluster de longa duração cobre o caso oposto. |
| `rv:ana.f06.m3.a2` | Parecida com `q.ana.ingest-saas` (0,34) | O Banco pede só o Salesforce (AppFlow). Esta é de resposta múltipla e acrescenta os dados por assinatura (Data Exchange), com os serviços trocados como distratores. |
| 04/11/2026: item não migrado | `rv:ana.f06.m2.a4` | Cobrava a lista de Regiões do MSK Serverless, um fato que muda com o tempo; a Revisão não cobra disponibilidade regional. |
| `rv:ana.f07.m3.a3` | Parecida com `q.ana.quick-rls` (0,34) | A resposta coincide; esta tira o filtro do leitor e os conjuntos de dados por região como distratores, para cobrar a diferença entre filtro e restrição. |
| 04/11/2026: fatos não cobrados | `rv:ana.f08.m1.a3` e a Região do Device Farm | Idiomas da detecção de dados pessoais do Comprehend e Regiões de um serviço mudam com o tempo; a Revisão não os cobra. |
| `rv:sec.f02.cluster-em-zonas` | Parecida com `q.fnd.multi-az` (0,30) | Só o vocabulário de zonas coincide; a decisão é ter HSMs em mais de uma zona no cluster do CloudHSM. |
| `rv:sec.f03.m1.a3` | Parecida com `q.sec.secrets-vs-ps` (0,29) | O Banco tem só configurações. Esta tem valores sensíveis, e a resposta acrescenta o SecureString. |
| `rv:sec.f03.m3.a2` | Parecida com `q.sec.secrets-replica` (0,37) | A resposta coincide; esta acrescenta a chave do KMS da Região e a promoção da réplica num desastre longo. |
| `rv:sec.f04.m1.a1` | Parecida com `q.net.alias-apex` (0,26) | Só o vocabulário de domínio e ALB coincide; a decisão é o certificado público do ACM. |
| `rv:sec.f05.m2.a1` | Parecida com `q.sec.inspector` (0,29) | A resposta coincide; esta parte de uma CVE recém-publicada e cobra o fechamento do achado quando a correção aparece. |
| `rv:sec.f05.m3.a2` | Parecida com `q.gov.trail-org` (0,32) e `q.gov.cfn-stacksets` (0,27) | Só o vocabulário de organização e contas novas coincide; a decisão é o administrador delegado dos serviços de segurança. |
| `rv:int.f02.m3.a1` | Parecida com `q.int.lambda-sqs` (0,28) | O Banco é de resposta múltipla, com o lote parcial. Esta cobra só o valor recomendado da visibilidade, com o dobro do tempo limite como distrator. |
| `rv:int.f07.m2.a2` | Parecida com `q.int.hot-shard` (0,27) | A resposta coincide; esta parte de shards dobrados sem efeito e cobra por que mais shards não resolvem. |
| `rv:int.f09.m3.a1` | Parecida com `q.int.write-buffer` (0,28) | A resposta coincide; esta compara a fila com dimensionar o banco para o pico, pelo custo de um dia por mês. |
| `rv:fil.f07.m2.a2` | Parecida com `q.fil.backup-cold` (0,29) | O Banco configura o frio para o EFS. Esta é de resposta múltipla e cobra quais recursos têm frio (EFS e EBS mensal), com RDS, FSx e o backup contínuo como distratores. |
| `rv:arq.f04.m2.a2:p4` | Parecida com `q.db.dax` (0,26) | A resposta coincide; esta parte de uma meta de microssegundos sem reescrever o acesso, com o ElastiCache controlado pela aplicação e a capacidade provisionada como distratores. |
| `rv:arq.f08.m1.a2` | Parecida com `q.arq.pat-events` (0,28) | A resposta coincide; esta parte de chamadas síncronas em sequência que derrubam a reserva, com as chamadas em paralelo como distrator. |
| `rv:arq.f08.m2.a4` | Parecida com `q.db.aurora-global` (0,29) | A resposta coincide; esta cobra a escolha entre write global e write local, com as tabelas globais do DynamoDB como distrator. |
| `rv:arq.f08.m3.a2:i3` | Parecida com `q.cmp.beanstalk-bluegreen` (0,29) | Só o vocabulário de blue/green coincide; esta cobra a volta em segundos para o ambiente azul, sem o Beanstalk. |
| `rv:arq.f08.m3.a2:i5` | Parecida com `q.arq.pat-canary` (0,29) | O Banco descreve o canário; esta descreve parcelas iguais e cobra a diferença para o linear, com o canário como distrator. |
| `rv:arq.f09.m1.a1` | Parecida com `q.arq.exam-format` (0,32) | A regra coincide (em branco conta como errada); esta parte das 15 questões que não contam e da ideia de que são as difíceis. |
| `rv:arq.f09.m2.a2:p2` | Parecida com `q.s3x.standard-ia` (0,30) | Só o vocabulário de classes do S3 coincide; a resposta é a Glacier Instant Retrieval, e a questão cobra restrição e requisito decisivo. |
| `rv:arq.f09.m2.a1:i3` | Parecida com `q.arq.wa-tradeoff` (0,30) | Só o vocabulário de AZ e menor custo coincide; a decisão é a restrição de os dados não saírem da Região, que elimina as opções entre Regiões. |
