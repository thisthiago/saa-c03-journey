/**
 * Questões da Revisão da Fase 2 de Bancos de dados (Alta disponibilidade no
 * RDS), no formato do exame SAA-C03. Fatos conferidos em 21/10/2026 e
 * 03/11/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'db.f02',
  questions: [
    {
      id: 'rv:db.f02.m1.a2',
      kind: 'decision',
      title: 'A réplica que deveria salvar o banco',
      prompt:
        'Uma rede de academias usa um RDS for MySQL Single-AZ com uma **réplica de leitura em outra AZ**, que a equipe considera seu plano de alta disponibilidade. A nova exigência é que o banco volte a aceitar gravações **sozinho, sem intervenção da equipe**, se a AZ da primária falhar, **sem perder transações confirmadas**. Qual mudança atende?',
      concepts: [{ id: 'rds.read-replica' }, { id: 'rds.failover' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar uma segunda réplica de leitura, numa terceira AZ.', correct: false, consequence: 'Mais réplicas não mudam o fato de que nenhuma delas assume sozinha: a promoção continua manual.' },
        { id: 'b', text: 'Converter a instância primária para uma implantação Multi-AZ.', correct: true, consequence: 'O standby recebe cada gravação de forma síncrona e o RDS faz o failover sozinho, trocando o DNS do endpoint.' },
        { id: 'c', text: 'Agendar um script que promove a réplica quando a primária parar.', correct: false, consequence: 'A replicação é assíncrona: o que não tinha chegado à réplica se perde, e a aplicação ainda precisa mudar de endpoint.' },
        { id: 'd', text: 'Aumentar a retenção do backup automático para 35 dias.', correct: false, consequence: 'O backup permite restaurar numa instância nova, o que leva tempo e exige ação da equipe.' },
      ],
      explanation: [
        'Os dois requisitos, **failover automático** e **nenhuma transação confirmada perdida**, descrevem o **Multi-AZ**: o standby recebe as gravações de forma síncrona e, numa falha, o RDS aponta o endpoint para ele sem ninguém agir.',
        'A réplica de leitura é **assíncrona** e **não assume sozinha**: alguém precisa promovê-la, a aplicação precisa trocar de endpoint e os últimos segundos podem se perder. Um script de promoção não muda isso. Mais réplicas também não. E restaurar backup leva mais tempo e é manual.',
        '**Regra prática:** réplica de leitura é para escalar leituras (e, entre Regiões, para recuperação de desastre); failover automático dentro da Região é Multi-AZ.',
      ],
    },
    {
      id: 'rv:db.f02.m1.a3',
      kind: 'decision',
      title: 'Uma aplicação que demora a voltar depois do failover',
      prompt:
        'Num teste de failover de um RDS Multi-AZ, as aplicações em Python voltaram em cerca de dois minutos. Uma aplicação em **Java**, que se conecta pelo **mesmo nome DNS do endpoint**, só voltou depois de ser reiniciada. A equipe quer que ela volte sozinha no próximo failover, com **a menor mudança possível**. O que fazer?',
      concepts: [{ id: 'rds.failover' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Configurar o TTL do cache de DNS da JVM para no máximo 60 segundos.', correct: true, consequence: 'A JVM volta a consultar o nome e passa a encontrar o novo endereço do endpoint depois da troca.' },
        { id: 'b', text: 'Trocar o nome do endpoint na configuração pelo IP do standby.', correct: false, consequence: 'O IP muda de novo no próximo failover; gravar IP é exatamente o erro que o endpoint evita.' },
        { id: 'c', text: 'Criar um registro no Route 53 com o IP atual da instância primária.', correct: false, consequence: 'Um registro com IP fixo fica apontando para a instância antiga depois da troca.' },
        { id: 'd', text: 'Converter o banco para um cluster Multi-AZ, com failover mais rápido.', correct: false, consequence: 'Um failover mais curto não adianta se a JVM continua usando o endereço antigo guardado no cache.' },
      ],
      explanation: [
        'No failover, o RDS troca o registro DNS do endpoint para o standby. Como a aplicação já usa o nome, o problema está no **cache de DNS da JVM**, que pode guardar o endereço antigo por muito tempo. A AWS recomenda um **TTL de no máximo 60 segundos** em aplicações Java.',
        'Trocar o nome por um IP, fixo na configuração ou num registro próprio, quebra no próximo failover. Um cluster Multi-AZ encurta a troca, mas a JVM continuaria presa ao endereço antigo.',
        '**Regra prática:** depois de um failover, quem não volta usa IP ou guarda o DNS por tempo demais. A correção é usar o nome do endpoint e respeitar um TTL curto.',
      ],
    },
    {
      id: 'rv:db.f02.conexoes-no-failover',
      kind: 'decision',
      title: 'Conexões que caem a cada failover',
      prompt:
        'Uma plataforma de pagamentos usa RDS for PostgreSQL Multi-AZ. A cada failover, centenas de conexões abertas caem ao mesmo tempo e as aplicações enchem o log de erros até reconectar. A equipe quer **reduzir o impacto do failover nas aplicações**, mudando **apenas o endereço de conexão**. Qual solução atende?',
      concepts: [{ id: 'rds.proxy' }, { id: 'rds.failover' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Apontar as aplicações para uma réplica de leitura na mesma Região.', correct: false, consequence: 'A réplica não aceita gravações, e as conexões com ela também cairiam se ela falhasse.' },
        { id: 'b', text: 'Ligar o backup automático com retenção de 35 dias.', correct: false, consequence: 'O backup protege os dados, não as conexões abertas durante a troca para o standby.' },
        { id: 'c', text: 'Aumentar o max_connections num parameter group próprio.', correct: false, consequence: 'Permitir mais conexões não impede que todas caiam quando a primária muda.' },
        { id: 'd', text: 'Colocar um RDS Proxy na frente do banco e conectar por ele.', correct: true, consequence: 'O proxy segura as conexões dos clientes durante a troca e reconecta ao novo primário.' },
      ],
      explanation: [
        'O **RDS Proxy** mantém um pool de conexões com o banco. Num failover, ele **segura as conexões dos clientes** e passa a usar o novo primário, então as aplicações sentem bem menos a troca. A mudança na aplicação é só o endereço, que passa a ser o do proxy.',
        'Uma réplica de leitura não recebe gravações. O backup não tem relação com conexões. E aumentar o limite de conexões não evita que elas caiam juntas.',
        '**Regra prática:** "reduzir o impacto do failover" e "muitas conexões curtas" apontam para o RDS Proxy.',
      ],
    },
    {
      id: 'rv:db.f02.m4.a1',
      kind: 'decision',
      title: 'Funções Lambda, segredos e o limite de conexões',
      prompt:
        'Funções Lambda de uma seguradora acessam um RDS for MySQL numa sub-rede privada, com o usuário e a senha do banco em variáveis de ambiente. Nos picos, o banco chega ao limite de conexões. A segurança exige que **a senha do banco não fique na configuração das funções**, e a equipe quer resolver também o **limite de conexões**. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'rds.proxy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Criar um RDS Proxy com autenticação IAM e dar às funções permissão de conectar por ele.', correct: true, consequence: 'As funções se autenticam com a role delas, e o proxy reaproveita as conexões com o banco.' },
        { id: 'b', text: 'Guardar a senha do banco no Secrets Manager, de onde o proxy a busca.', correct: true, consequence: 'A senha sai da configuração das funções e fica num serviço próprio para segredos.' },
        { id: 'c', text: 'Expor o proxy na internet, para as funções não precisarem ficar na VPC.', correct: false, consequence: 'O RDS Proxy fica na VPC do banco e não pode ser acessado pela internet.' },
        { id: 'd', text: 'Criar uma réplica de leitura e dividir as funções entre as duas instâncias.', correct: false, consequence: 'As funções que gravam continuam na primária, e a senha continua nas variáveis de ambiente.' },
        { id: 'e', text: 'Trocar a classe do banco por uma maior, que aceita mais conexões.', correct: false, consequence: 'Paga mais pela instância e não tira a senha da configuração das funções.' },
      ],
      explanation: [
        'O **RDS Proxy** resolve as duas exigências. Ele pode **exigir autenticação IAM** dos clientes, então as funções se conectam com a role delas, e busca a senha do banco no **Secrets Manager**. Ao mesmo tempo, mantém um pool de conexões e protege o banco dos picos.',
        'O proxy fica na VPC do banco e não é público. Uma réplica de leitura não recebe gravações nem tira a senha das funções. Uma classe maior é cara e só adia o limite.',
        '**Regra prática:** Lambda com RDS e "muitas conexões" ou "sem senha no código" apontam para o RDS Proxy, com IAM e Secrets Manager.',
      ],
    },
    {
      id: 'rv:db.f02.copias-que-tambem-leem',
      kind: 'decision',
      title: 'Standby parado e réplicas para leitura',
      prompt:
        'Um portal de notícias usa RDS for MySQL **Multi-AZ com um standby** e **duas réplicas de leitura** para as consultas. O diretor financeiro reclama de pagar quatro instâncias. A equipe quer manter o **failover automático sem perder transações confirmadas** e as **cópias atendendo leituras**, com o **menor número de instâncias**. Qual implantação atende?',
      concepts: [{ id: 'rds.multi-az-cluster' }, { id: 'rds.read-replica' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um cluster Multi-AZ do RDS: um escritor e dois leitores em três AZs.', correct: true, consequence: 'Três instâncias fazem o papel de quatro: os leitores atendem consultas e assumem a escrita no failover.' },
        { id: 'b', text: 'Manter o Multi-AZ e apontar as consultas para o standby.', correct: false, consequence: 'No Multi-AZ com um standby, a cópia só existe para assumir numa falha e não aceita leituras.' },
        { id: 'c', text: 'Desligar o Multi-AZ e manter só as duas réplicas de leitura.', correct: false, consequence: 'As réplicas não assumem sozinhas e são assíncronas: o failover automático e os dados confirmados se perdem.' },
        { id: 'd', text: 'Manter o Multi-AZ e trocar as duas réplicas por uma maior.', correct: false, consequence: 'Continua pagando um standby parado, e as leituras perdem uma instância.' },
      ],
      explanation: [
        'O **cluster Multi-AZ** do RDS tem **um escritor e dois leitores** em três AZs. A replicação é semissíncrona: o commit espera pelo menos um leitor, então o failover não perde transações confirmadas. Os leitores atendem consultas e, num failover, um deles assume, em geral em menos de 35 segundos.',
        'O standby do Multi-AZ tradicional não atende leituras. Sem Multi-AZ, as réplicas não assumem sozinhas e podem estar segundos atrás. Trocar duas réplicas por uma maior mantém o standby parado.',
        '**Regra prática:** "failover mais rápido" e "usar as cópias de espera para leitura", com MySQL ou PostgreSQL no RDS, apontam para o cluster Multi-AZ, que não é o mesmo que um cluster do Aurora.',
      ],
    },
    {
      id: 'rv:db.f02.replica-criptografada',
      kind: 'decision',
      title: 'Réplica em outra Região de um banco criptografado',
      prompt:
        'Um banco RDS for PostgreSQL em sa-east-1 é **criptografado com uma chave do KMS**. Para recuperação de desastre, a equipe vai criar uma **réplica de leitura em us-east-1**, e a política da empresa exige que **a réplica também fique criptografada**. O que a equipe precisa indicar na criação da réplica?',
      concepts: [{ id: 'rds.cross-region-replica' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'A mesma chave do KMS da origem, que o RDS copia para a outra Região.', correct: false, consequence: 'O RDS não leva a chave da origem para a outra Região; a réplica precisa de uma chave da Região de destino.' },
        { id: 'b', text: 'Uma chave do KMS de us-east-1, que o RDS usa para criptografar a réplica.', correct: true, consequence: 'A réplica fica criptografada com uma chave da Região onde ela está.' },
        { id: 'c', text: 'Nenhuma chave: a réplica de um banco criptografado vai sem criptografia.', correct: false, consequence: 'A réplica de uma origem criptografada também é criptografada; não existe essa exceção.' },
        { id: 'd', text: 'Um snapshot manual da origem, que a réplica usa como chave de acesso.', correct: false, consequence: 'Snapshot é uma cópia do banco, não uma chave de criptografia.' },
      ],
      explanation: [
        'Uma réplica em outra Região de uma origem criptografada também é criptografada, e o RDS a criptografa com **uma chave do KMS da Região de destino**, indicada na criação.',
        'O RDS não usa a chave da origem na outra Região. A réplica não sai sem criptografia. E snapshot não tem papel de chave.',
        '**Regra prática:** sempre que um recurso criptografado vai para outra Região (réplica, cópia de snapshot), é preciso uma chave do KMS na Região de destino.',
      ],
    },
    {
      id: 'rv:db.f02.leitura-em-outro-continente',
      kind: 'decision',
      title: 'Páginas lentas para clientes de outro continente',
      prompt:
        'Um marketplace tem o banco RDS for MySQL em us-east-1. Os clientes na Europa reclamam que as páginas de catálogo, que **só leem dados**, demoram por causa da **distância até o banco**. As gravações podem continuar indo para os Estados Unidos. Qual solução **reduz a latência das leituras na Europa**?',
      concepts: [{ id: 'rds.cross-region-replica' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Converter o banco para um cluster Multi-AZ em us-east-1.', correct: false, consequence: 'As três AZs do cluster ficam na mesma Região: a distância até a Europa continua igual.' },
        { id: 'b', text: 'Colocar um RDS Proxy na frente do banco em us-east-1.', correct: false, consequence: 'O proxy reaproveita conexões, mas cada consulta continua atravessando o oceano.' },
        { id: 'c', text: 'Criar uma réplica de leitura numa Região da Europa para o catálogo.', correct: true, consequence: 'As leituras do catálogo passam a ser atendidas perto dos clientes europeus.' },
        { id: 'd', text: 'Trocar a classe do banco por uma com mais CPU e memória.', correct: false, consequence: 'O banco fica mais rápido, mas o tempo de rede até a Europa não muda.' },
      ],
      explanation: [
        'O problema é a **distância**, e só um banco perto dos usuários resolve. Uma **réplica de leitura em outra Região** atende as consultas na Europa, enquanto as gravações continuam na primária. O atraso de replicação é maior que numa réplica local, e a transferência entre Regiões é cobrada.',
        'Multi-AZ e cluster Multi-AZ ficam numa só Região. O RDS Proxy e uma classe maior não reduzem o tempo de rede.',
        '**Regra prática:** "leituras perto de usuários em outro continente" ou "recuperação de desastre em outra Região" apontam para a réplica em outra Região.',
      ],
    },
    {
      id: 'rv:db.f02.m2.a5',
      kind: 'decision',
      title: 'Um teste de promoção numa terça à tarde',
      prompt:
        'Para testar o plano de desastre, um analista quer **promover a réplica de leitura da outra Região** numa terça à tarde, gravar alguns dados de teste e, no fim do dia, "voltar a réplica a ser réplica". O plano precisa estar **correto antes do teste**. O que deve constar nele?',
      concepts: [{ id: 'rds.replica-promotion' }, { id: 'rds.cross-region-replica' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A volta é um reboot da instância promovida com a opção de failover.', correct: false, consequence: 'Reboot com failover vale para o Multi-AZ; uma instância promovida não volta a receber replicação.' },
        { id: 'b', text: 'A promoção é instantânea e não interrompe as leituras na réplica.', correct: false, consequence: 'A promoção reinicia a instância e leva alguns minutos.' },
        { id: 'c', text: 'Promover a réplica também promove as outras réplicas da mesma origem.', correct: false, consequence: 'Promover uma réplica não afeta as outras réplicas da mesma origem.' },
        { id: 'd', text: 'A promoção não tem volta: no fim do dia, uma réplica nova será criada.', correct: true, consequence: 'O teste já prevê o tempo e a transferência entre Regiões para recriar a réplica.' },
      ],
      explanation: [
        'Promover transforma a réplica num **banco independente** que aceita escritas: a replicação para, a instância reinicia e o processo leva alguns minutos. **Não tem volta.** Depois do teste, é preciso apagar a instância de teste e criar uma réplica nova, o que leva tempo e gera transferência entre Regiões.',
        'Reboot com failover é recurso do Multi-AZ. A promoção não é instantânea. E ela não afeta as outras réplicas.',
        '**Regra prática:** a promoção é manual, não tem volta e muda o endpoint; o plano de recuperação precisa incluir apontar a aplicação para o banco promovido.',
      ],
    },
    {
      id: 'rv:db.f02.boss.a2',
      kind: 'decision',
      title: 'Um erro descoberto três semanas depois',
      prompt:
        'Um sistema de faturamento usa RDS Multi-AZ com uma réplica em outra Região, **backup automático de 14 dias** e um **snapshot manual no primeiro dia de cada mês**. Hoje, dia 22, a equipe descobriu que uma atualização errada corrompeu os preços **no dia 1, logo depois do snapshot**. Qual cópia permite recuperar os preços corretos?',
      concepts: [{ id: 'rds.snapshots' }, { id: 'rds.pitr' }, { id: 'rds.automated-backups' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A restauração para um ponto no tempo do dia 1, antes do erro.', correct: false, consequence: 'O dia 1 está fora dos 14 dias de retenção; a restauração só alcança o dia 8.' },
        { id: 'b', text: 'O snapshot manual do dia 1, restaurado numa instância nova.', correct: true, consequence: 'O snapshot manual fica guardado até ser apagado e tem os preços de antes do erro.' },
        { id: 'c', text: 'A réplica em outra Região, promovida a banco independente.', correct: false, consequence: 'A réplica recebeu a atualização errada segundos depois da primária.' },
        { id: 'd', text: 'O standby do Multi-AZ, com um reboot com failover.', correct: false, consequence: 'O standby é síncrono: recebeu a atualização errada junto com a primária.' },
      ],
      explanation: [
        'Standby e réplicas **copiam o erro** como qualquer gravação. A restauração para um ponto no tempo só alcança o período de retenção do backup automático, aqui de 14 dias: o dia 1 ficou de fora. Resta o **snapshot manual**, que fica guardado até ser apagado e foi tirado antes do erro.',
        'Restaurar o snapshot cria uma instância nova, de onde a equipe copia os preços. As mudanças legítimas feitas depois do dia 1 continuam na produção.',
        '**Regra prática:** contra erro lógico, só backups ajudam. Dentro da retenção, use a restauração para um ponto no tempo; para ir além dela, só snapshots manuais ou o AWS Backup.',
      ],
    },
    {
      id: 'rv:db.f02.m3.a1',
      kind: 'decision',
      title: 'A proposta para cortar o custo dos backups',
      prompt:
        'Para economizar, um analista propõe **desligar o backup automático** (retenção 0) do banco de produção, que é RDS Multi-AZ com uma réplica de leitura: "já temos duas cópias do banco". O banco guarda pedidos de clientes, e a empresa precisa conseguir **desfazer um apagamento por engano**. Como avaliar a proposta?',
      concepts: [{ id: 'rds.automated-backups' }, { id: 'rds.pitr' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aceitar: o standby guarda a versão anterior de cada linha alterada.', correct: false, consequence: 'O standby recebe cada gravação de forma síncrona, inclusive o apagamento.' },
        { id: 'b', text: 'Aceitar: a réplica pode ser promovida a um momento anterior ao erro.', correct: false, consequence: 'A réplica recebe o apagamento segundos depois e não volta no tempo; promovê-la só para a replicação.' },
        { id: 'c', text: 'Rejeitar: só o backup automático permite voltar a antes do erro.', correct: true, consequence: 'Sem ele, não há restauração para um ponto no tempo, e a réplica de leitura exige o backup ligado na origem.' },
        { id: 'd', text: 'Aceitar: a mudança da retenção para 0 não causa nenhuma parada.', correct: false, consequence: 'Mudar a retenção de 0 para outro valor, ou o contrário, causa uma parada.' },
      ],
      explanation: [
        'O standby e a réplica copiam qualquer gravação, inclusive o apagamento. Só o **backup automático** guarda snapshots e logs de transação para **voltar a um momento anterior ao erro**. Além disso, a réplica de leitura exige o backup automático ligado na origem.',
        'Nenhuma das cópias "guarda a versão anterior". A réplica não volta no tempo. E mudar a retenção de 0 para outro valor, ou o contrário, causa uma parada.',
        '**Regra prática:** retenção 0 num banco de produção é um erro. Multi-AZ e réplicas protegem contra falhas de infraestrutura, não contra erros lógicos.',
      ],
    },
    {
      id: 'rv:db.f02.m3.a2',
      kind: 'decision',
      title: 'A restauração terminou e nada mudou',
      prompt:
        'Um script apagou a agenda de uma clínica às 14h03. A equipe fez uma **restauração para um ponto no tempo**, às 14h02, e ela terminou com sucesso. Mesmo assim, a aplicação continua mostrando a agenda vazia. A equipe precisa **devolver os agendamentos à produção**. Qual é a explicação e o próximo passo?',
      concepts: [{ id: 'rds.pitr' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A restauração sobrescreveu a instância; falta reiniciá-la para carregar os dados.', correct: false, consequence: 'A restauração não altera a instância original.' },
        { id: 'b', text: 'A restauração só vale para o dia anterior; é preciso um snapshot manual.', correct: false, consequence: 'Com os logs de transação, dá para voltar a qualquer momento da retenção, em geral até poucos minutos atrás.' },
        { id: 'c', text: 'O standby do Multi-AZ precisa assumir para a restauração aparecer.', correct: false, consequence: 'O standby recebeu o apagamento junto com a primária e não tem relação com a restauração.' },
        { id: 'd', text: 'A restauração criou uma instância nova; é preciso copiar os dados dela.', correct: true, consequence: 'A equipe copia os agendamentos da instância restaurada para a produção, ou aponta a aplicação para ela.' },
      ],
      explanation: [
        'A restauração para um ponto no tempo **cria uma instância nova**, com outro endpoint; a original continua como estava. Para os dados voltarem à aplicação, a equipe copia os agendamentos da instância restaurada para a produção ou aponta a aplicação para a nova instância.',
        'A restauração não sobrescreve nada. Ela não se limita ao dia anterior. E o standby não participa dela.',
        '**Regra prática:** restaurar no RDS (para um ponto no tempo ou de um snapshot) sempre gera uma instância nova, com endpoint próprio.',
      ],
    },
    {
      id: 'rv:db.f02.m3.a4',
      kind: 'decision',
      title: 'O backup de ontem para a auditoria',
      prompt:
        'A auditoria precisa, numa conta AWS própria, do banco **como estava no backup automático de ontem**. O banco é criptografado com uma **chave do KMS gerenciada pelo cliente**, já liberada para a conta da auditoria. No console, a opção de compartilhar não aparece para o snapshot automático. Qual é **o caminho com menos esforço**?',
      concepts: [{ id: 'rds.snapshots' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Restaurar o backup numa instância nova e dar à auditoria um usuário do banco.', correct: false, consequence: 'Funciona, mas paga uma instância a mais e não entrega uma cópia na conta da auditoria.' },
        { id: 'b', text: 'Tornar o snapshot automático público por algumas horas.', correct: false, consequence: 'Snapshot criptografado nunca pode ser público, e dados de clientes não podem ser expostos.' },
        { id: 'c', text: 'Copiar o snapshot automático, o que gera um manual, e compartilhar a cópia.', correct: true, consequence: 'A cópia é um snapshot manual, que pode ser compartilhado com a conta da auditoria.' },
        { id: 'd', text: 'Pedir à auditoria que crie uma réplica de leitura a partir da conta dela.', correct: false, consequence: 'Uma réplica não entrega o banco como estava ontem, e sim como está agora.' },
      ],
      explanation: [
        'Snapshots automáticos não podem ser compartilhados. Para entregar o backup de ontem, a equipe **copia o snapshot automático**: a cópia é um **snapshot manual**, que pode ser compartilhado com até 20 contas. Como a chave do KMS já está liberada para a auditoria, ela consegue restaurar a cópia.',
        'Restaurar e dar acesso ao banco não entrega a cópia. Snapshot criptografado nunca pode ser público. E uma réplica mostra o banco de agora, não o de ontem.',
        '**Regra prática:** para compartilhar, o snapshot precisa ser manual e, se criptografado, usar uma chave do cliente liberada para a outra conta, e não a chave padrão do RDS.',
      ],
    },
    {
      id: 'rv:db.f02.desativar-o-banco',
      kind: 'decision',
      title: 'Sistema desligado com dados para o jurídico',
      prompt:
        'Um sistema antigo vai ser desligado, mas o jurídico pode pedir os dados dele **nos próximos cinco anos**. O banco é um RDS for PostgreSQL de 200 GiB. A empresa quer guardar o banco como está hoje com o **menor custo**, aceitando esperar uma restauração se o pedido vier. O que fazer?',
      concepts: [{ id: 'rds.snapshots' }, { id: 'rds.automated-backups' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Apagar a instância marcando para reter os backups automáticos.', correct: false, consequence: 'O backup automático guarda no máximo 35 dias; não cobre cinco anos.' },
        { id: 'b', text: 'Manter a instância ligada, trocada pela menor classe disponível.', correct: false, consequence: 'Continua pagando instância e armazenamento todos os meses, sem que ninguém use o banco.' },
        { id: 'c', text: 'Apagar a instância tirando um snapshot final do banco.', correct: true, consequence: 'O snapshot fica guardado até ser apagado, e a empresa paga só pelo armazenamento dele.' },
        { id: 'd', text: 'Criar uma réplica de leitura e apagar a primária.', correct: false, consequence: 'A réplica é uma instância comum, cobrada por hora, e deixa de ser réplica sem a origem.' },
      ],
      explanation: [
        'Ao apagar uma instância, o RDS permite tirar um **snapshot final**. Um snapshot manual **fica guardado até ser apagado**, mesmo sem a instância, e o custo passa a ser só o do armazenamento. Se o jurídico pedir, a equipe restaura numa instância nova.',
        'O backup automático guarda no máximo 35 dias. Manter uma instância ou uma réplica ligada paga computação sem uso.',
        '**Regra prática:** cópia de longo prazo no RDS é snapshot manual; para automatizar a retenção de muitos snapshots, AWS Backup.',
      ],
    },
    {
      id: 'rv:db.f02.retencao-de-um-dia',
      kind: 'decision',
      title: 'A restauração que não alcança três dias atrás',
      prompt:
        'Um banco RDS foi criado por um **script da CLI**, sem indicar a retenção de backup. Três dias depois de um erro de importação, a equipe tentou restaurá-lo para **antes do erro** e viu que o ponto mais antigo disponível é de ontem. A equipe quer **evitar isso nos próximos bancos**. Qual é a causa?',
      concepts: [{ id: 'rds.automated-backups' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Bancos criados pela CLI não têm backup automático, só snapshots manuais.', correct: false, consequence: 'O backup automático vem ligado também pela CLI, só que com uma retenção menor.' },
        { id: 'b', text: 'Pela API e pela CLI, a retenção padrão é de 1 dia; pelo console, de 7.', correct: true, consequence: 'O script passa a indicar a retenção desejada, sem depender do padrão.' },
        { id: 'c', text: 'O backup automático só guarda o último dia em instâncias Single-AZ.', correct: false, consequence: 'A retenção vai até 35 dias em qualquer implantação; quem a define é a configuração.' },
        { id: 'd', text: 'A restauração para um ponto no tempo só alcança as últimas 24 horas.', correct: false, consequence: 'Ela alcança todo o período de retenção, que pode chegar a 35 dias.' },
      ],
      explanation: [
        'A retenção do backup automático vai de 0 a 35 dias. O padrão **depende de como o banco é criado**: **7 dias pelo console** e **1 dia pela API ou CLI**. Um script que não indica a retenção cria bancos que só voltam um dia.',
        'O backup automático vem ligado também pela CLI. A retenção não depende de ser Single-AZ. E a restauração alcança todo o período configurado.',
        '**Regra prática:** em scripts e templates, defina a retenção de backup explicitamente; não confie no padrão.',
      ],
    },
    {
      id: 'rv:db.f02.leu-antes-de-chegar',
      kind: 'decision',
      title: 'Compra finalizada e pedido não encontrado',
      prompt:
        'Para aliviar o banco, uma loja virtual passou **todas as leituras** para uma réplica de leitura do RDS. Desde então, alguns clientes finalizam a compra e, na página de confirmação, que lê o pedido logo em seguida, recebem "pedido não encontrado". A equipe quer **resolver sem perder o alívio** que a réplica trouxe. O que fazer?',
      concepts: [{ id: 'rds.read-replica' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ler da primária só o que acabou de ser gravado, como a confirmação.', correct: true, consequence: 'A confirmação vê o pedido na hora, e o resto das leituras continua na réplica.' },
        { id: 'b', text: 'Ligar o Multi-AZ na réplica para ela ficar síncrona com a primária.', correct: false, consequence: 'O Multi-AZ da réplica protege a réplica; a replicação a partir da primária continua assíncrona.' },
        { id: 'c', text: 'Criar mais réplicas de leitura e distribuir as consultas entre elas.', correct: false, consequence: 'Todas continuam assíncronas e podem estar segundos atrás da primária.' },
        { id: 'd', text: 'Voltar todas as leituras para a primária e apagar a réplica.', correct: false, consequence: 'Resolve a confirmação, mas devolve toda a carga à primária.' },
      ],
      explanation: [
        'A réplica é atualizada de forma **assíncrona** e pode estar alguns segundos atrás (**replica lag**). Uma página que lê o que acabou de ser gravado precisa ler da **primária**; o resto das leituras, que tolera alguns segundos de atraso, continua na réplica.',
        'Uma réplica Multi-AZ continua recebendo os dados da primária de forma assíncrona. Mais réplicas têm o mesmo atraso. Voltar tudo para a primária desfaz o alívio.',
        '**Regra prática:** réplicas servem leituras que aceitam dados de alguns segundos atrás; leia da primária o que precisa estar atualizado no mesmo instante.',
      ],
    },
  ],
}
