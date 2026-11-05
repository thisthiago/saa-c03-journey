/**
 * Questões da Revisão da Fase 5 de Bancos de dados (DynamoDB: recursos
 * avançados), no formato do exame SAA-C03. Fatos conferidos em 21/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F05: ReviewSet = {
  phaseId: 'db.f05',
  questions: [
    {
      id: 'rv:db.f05.m1.a1',
      kind: 'decision',
      title: 'Histórico de alterações de preço por cinco anos',
      prompt:
        'A tabela de produtos de um e-commerce fica no DynamoDB. A auditoria passou a exigir um **registro de cada alteração de preço**, com o **valor antigo e o novo**, guardado por **cinco anos**. O código que grava os produtos **não pode ser alterado**. Qual solução atende?',
      concepts: [{ id: 'ddb.streams' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Ligar o stream com NEW_AND_OLD_IMAGES e uma Lambda que grava no S3.', correct: true, consequence: 'Cada alteração chega com as duas imagens, e o S3 guarda o histórico pelo tempo exigido.' },
        { id: 'b', text: 'Ligar o stream com NEW_AND_OLD_IMAGES e consultar o próprio stream na auditoria.', correct: false, consequence: 'O stream guarda os registros por 24 horas; não serve de histórico de cinco anos.' },
        { id: 'c', text: 'Ligar o stream com KEYS_ONLY e uma Lambda que grava cada mudança no S3.', correct: false, consequence: 'Com KEYS_ONLY, o registro traz só as chaves do item, sem o preço antigo nem o novo.' },
        { id: 'd', text: 'Ligar o PITR da tabela e restaurar o dia pedido sempre que a auditoria precisar.', correct: false, consequence: 'O PITR alcança no máximo 35 dias e não lista as alterações uma a uma.' },
      ],
      explanation: [
        'O **DynamoDB Streams** registra cada criação, alteração e exclusão, de forma assíncrona e sem mudar o código que grava. Com **NEW_AND_OLD_IMAGES**, cada registro traz o item antes e depois da mudança. Uma função Lambda lê o stream e grava cada alteração no S3, que guarda pelo tempo exigido.',
        'O stream guarda só 24 horas. KEYS_ONLY não traz os valores. O PITR alcança 35 dias e restaura a tabela inteira, sem listar as alterações.',
        '**Regra prática:** "reagir a cada mudança", "auditar alterações" ou "replicar para outro sistema" apontam para o Streams com Lambda; o histórico longo vai para outro destino.',
      ],
    },
    {
      id: 'rv:db.f05.sessoes-vencidas-no-s3',
      kind: 'decision',
      title: 'Guardar as sessões que o TTL apaga',
      prompt:
        'Um aplicativo guarda sessões no DynamoDB, e o **TTL** apaga as vencidas. A equipe de dados quer uma **cópia no S3 de cada sessão apagada pelo TTL**, para estudar o uso, **sem gastar capacidade de leitura** da tabela e sem misturar com as sessões que os usuários encerram pelo botão "Sair", que apagam o item. Qual solução atende?',
      concepts: [{ id: 'ddb.streams' }, { id: 'ddb.ttl' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma Scan por hora que procura sessões vencidas e as copia antes do TTL.', correct: false, consequence: 'A Scan consome capacidade de leitura da tabela inteira a cada hora.' },
        { id: 'b', text: 'Um stream com OLD_IMAGE e uma Lambda que guarda as exclusões feitas pelo serviço.', correct: true, consequence: 'As exclusões do TTL aparecem no stream como feitas pelo serviço, com o item antigo, e ficam separadas das feitas pelo usuário.' },
        { id: 'c', text: 'Uma exportação diária da tabela para o S3, comparada com a do dia anterior.', correct: false, consequence: 'A comparação não separa as sessões apagadas pelo TTL das encerradas pelo botão "Sair".' },
        { id: 'd', text: 'Um stream com KEYS_ONLY e uma Lambda que copia todas as exclusões.', correct: false, consequence: 'Sem a imagem antiga não há sessão para copiar, e as exclusões do botão "Sair" entrariam junto.' },
      ],
      explanation: [
        'Os itens apagados pelo **TTL** aparecem no **stream** como **exclusões feitas pelo serviço**, o que os separa das exclusões feitas pela aplicação. Com **OLD_IMAGE**, o registro traz a sessão como era. Uma Lambda filtra essas exclusões e grava as sessões no S3. O stream é assíncrono e não consome a capacidade da tabela.',
        'A Scan gasta leitura. A comparação de exportações não distingue o motivo da exclusão. KEYS_ONLY não traz a sessão e não filtra a origem.',
        '**Regra prática:** para agir sobre o que o TTL apaga, leia o stream e filtre as exclusões feitas pelo serviço.',
      ],
    },
    {
      id: 'rv:db.f05.m1.a2',
      kind: 'decision',
      title: 'Sessões vencidas que continuam aparecendo',
      prompt:
        'Um aplicativo passou a usar o **TTL** do DynamoDB para apagar sessões vencidas, que antes eram apagadas por um script. Agora, de vez em quando, um usuário volta a entrar com uma sessão que **venceu há horas**. A equipe quer **impedir o uso de sessões vencidas** sem voltar ao script. O que fazer?',
      concepts: [{ id: 'ddb.ttl' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Gravar a expiração em milissegundos, para o TTL ficar mais preciso.', correct: false, consequence: 'O TTL espera segundos no formato de época Unix; em milissegundos, as datas ficam no futuro distante.' },
        { id: 'b', text: 'Ligar a leitura fortemente consistente na consulta das sessões.', correct: false, consequence: 'A leitura forte traz a última gravação; o item vencido ainda está gravado, então continua aparecendo.' },
        { id: 'c', text: 'Filtrar na leitura as sessões com expiração já passada.', correct: true, consequence: 'As sessões vencidas são ignoradas até o TTL apagá-las, o que costuma levar alguns dias.' },
        { id: 'd', text: 'Pedir à AWS que o TTL apague os itens no segundo exato da expiração.', correct: false, consequence: 'Não existe essa opção: a exclusão acontece em geral alguns dias depois.' },
      ],
      explanation: [
        'O **TTL** apaga os itens vencidos sem consumir escrita, mas **em geral alguns dias depois** da expiração. Até lá, o item ainda aparece nas consultas. A aplicação deve **filtrar na leitura** os itens já vencidos.',
        'Milissegundos quebram o TTL. A leitura forte não esconde um item que ainda existe. E não há como forçar a exclusão no segundo exato.',
        '**Regra prática:** TTL é limpeza barata, não controle de acesso; quem não pode ver item vencido filtra na leitura.',
      ],
    },
    {
      id: 'rv:db.f05.m2.a1',
      kind: 'decision',
      title: 'Onde um cache em memória vale a pena',
      prompt:
        'Uma empresa estuda colocar o **DAX** na frente de algumas tabelas do DynamoDB para **reduzir a latência de leitura**, e não quer pagar por cache que não traga ganho. As tabelas e seus padrões de acesso estão abaixo. Em quais o DAX traz ganho? (Escolha DUAS.)',
      concepts: [{ id: 'ddb.dax' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Catálogo: os mesmos 500 produtos lidos milhões de vezes, com leitura eventual.', correct: true, consequence: 'Leituras repetidas dos mesmos itens saem do cache em microssegundos.' },
        { id: 'b', text: 'Logs de acesso: muitas gravações por segundo, raramente lidos depois.', correct: false, consequence: 'Muitas escritas e dados que quase não são relidos não aproveitam o cache.' },
        { id: 'c', text: 'Saldos: lidos com leitura forte, porque precisam mostrar a última compra.', correct: false, consequence: 'O DAX não é indicado para leituras fortemente consistentes.' },
        { id: 'd', text: 'Ranking: os 100 primeiros lidos a cada abertura do jogo, com leitura eventual.', correct: true, consequence: 'Poucos itens muito relidos dão uma taxa de acerto alta no cache.' },
        { id: 'e', text: 'Relatório mensal: uma Scan de toda a tabela, uma vez por mês.', correct: false, consequence: 'Os dados são lidos uma vez e não voltam a ser pedidos: o cache não acerta.' },
      ],
      explanation: [
        'O **DAX** é um cache em memória compatível com a API do DynamoDB, que serve **leituras eventualmente consistentes** em microssegundos. Ele funciona melhor com itens **muito relidos**, com taxa de acerto acima de 90%, como o catálogo e o ranking.',
        'O DAX não é indicado para leitura forte, para cargas com muitas escritas nem para dados raramente relidos, como logs e uma Scan mensal.',
        '**Regra prática:** "microssegundos" e "leituras repetidas dos mesmos itens" numa aplicação que já usa o DynamoDB apontam para o DAX; leitura forte o elimina.',
      ],
    },
    {
      id: 'rv:db.f05.m2.a2',
      kind: 'decision',
      title: 'Proposta de cache para outro dado do jogo',
      prompt:
        'Um jogo já usa o DAX para a vitrine da loja. Alguém propõe passar também a **leitura do saldo de moedas** pelo DAX, para ganhar latência. O saldo precisa **sempre mostrar a última compra**, e hoje é lido com leitura fortemente consistente. Como avaliar a proposta?',
      concepts: [{ id: 'ddb.dax' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aprovar: o DAX deixa a leitura forte em microssegundos.', correct: false, consequence: 'O DAX acelera leituras eventuais; ele não é indicado para leituras fortemente consistentes.' },
        { id: 'b', text: 'Aprovar, com um tempo de vida de 1 segundo no cache do DAX.', correct: false, consequence: 'Mesmo com tempo curto, o cache pode devolver um saldo de antes da compra.' },
        { id: 'c', text: 'Aprovar, porque o DAX grava direto no cache e não na tabela.', correct: false, consequence: 'As escritas passam pelo DAX até o DynamoDB (write-through); a tabela continua sendo a origem.' },
        { id: 'd', text: 'Recusar: o saldo segue com leitura forte na tabela.', correct: true, consequence: 'O saldo continua sempre certo, e a vitrine continua rápida pelo cache.' },
      ],
      explanation: [
        'O DAX serve **leituras eventualmente consistentes**. Um dado que precisa refletir **a última gravação**, como um saldo, continua com **leitura forte direto na tabela**.',
        'Um tempo de vida curto não transforma o cache em leitura forte. E o DAX é write-through: grava no DynamoDB, que continua sendo a origem.',
        '**Regra prática:** DAX para o que tolera dados de alguns instantes atrás; o que precisa estar sempre atualizado é lido na tabela, com leitura forte.',
      ],
    },
    {
      id: 'rv:db.f05.boss.a2',
      kind: 'decision',
      title: 'O mesmo item alterado em dois continentes',
      prompt:
        'Um aplicativo usa uma tabela global do DynamoDB no **modo padrão**, com réplicas na Europa e na Ásia. Um usuário muda o apelido no celular, na Europa, e no computador, na Ásia, **quase no mesmo instante**. A equipe precisa **explicar ao suporte** o que acontece nesse caso. Qual é a explicação correta?',
      concepts: [{ id: 'ddb.global-tables' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A segunda gravação é recusada com erro, e o usuário tenta de novo.', correct: false, consequence: 'No modo padrão, as duas gravações são aceitas nas Regiões em que foram feitas.' },
        { id: 'b', text: 'Os dois apelidos são guardados, e o usuário escolhe um deles depois.', correct: false, consequence: 'O DynamoDB não guarda versões em conflito; um valor substitui o outro.' },
        { id: 'c', text: 'Vence a gravação mais recente, e a outra se perde nas duas Regiões.', correct: true, consequence: 'É a resolução pela última escrita (last writer wins) do modo padrão.' },
        { id: 'd', text: 'Vence a gravação da Região criada primeiro, que funciona como primária.', correct: false, consequence: 'Na tabela global não há Região primária: todas as réplicas aceitam escritas.' },
      ],
      explanation: [
        'No **modo padrão** das tabelas globais, todas as réplicas aceitam leituras e escritas, e a replicação costuma levar um segundo ou menos. Escritas simultâneas no mesmo item são resolvidas pela **última escrita** (last writer wins): a outra se perde.',
        'Não há recusa, nem versões guardadas, nem Região primária; Região primária é coisa do Aurora Global Database.',
        '**Regra prática:** tabela global no modo padrão é multiativa com "última escrita vence". Dados que não podem perder escritas concorrentes pedem outro desenho, como gravar o item numa única Região.',
      ],
    },
    {
      id: 'rv:db.f05.m2.a4:tx',
      kind: 'decision',
      title: 'Uma transação e duas Regiões',
      prompt:
        'Uma fintech usa uma tabela global do DynamoDB no modo padrão em sa-east-1 e eu-west-1. Uma transferência usa **TransactWriteItems** em sa-east-1 para debitar uma conta e creditar outra. O time de risco quer saber se, em eu-west-1, **alguém pode ler o débito antes do crédito**. Qual é a resposta correta?',
      concepts: [{ id: 'ddb.transactions' }, { id: 'ddb.global-tables' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Não: a transação é atômica em todas as Regiões da tabela global.', correct: false, consequence: 'As transações valem só na Região em que foram feitas.' },
        { id: 'b', text: 'Sim: o tudo ou nada vale só em sa-east-1; as cópias chegam separadas.', correct: true, consequence: 'O time trata em eu-west-1 a leitura de um estado intermediário, ou lê essas contas na Região da transação.' },
        { id: 'c', text: 'Não: tabelas globais recusam transações para evitar esse problema.', correct: false, consequence: 'As transações funcionam na tabela global; só não valem entre Regiões.' },
        { id: 'd', text: 'Sim, mas só se o modo de capacidade da tabela for sob demanda.', correct: false, consequence: 'O modo de capacidade não muda o alcance das transações.' },
      ],
      explanation: [
        'Uma transação do DynamoDB é tudo ou nada **na Região em que foi feita**. Numa tabela global, as gravações são replicadas para as outras Regiões **sem a garantia da transação**, e uma leitura em eu-west-1 pode ver o débito antes do crédito.',
        'As tabelas globais aceitam transações, mas elas não atravessam Regiões. O modo de capacidade não muda isso.',
        '**Regra prática:** transações valem dentro da Região; numa tabela global, quem precisa do tudo ou nada lê na Região em que a transação foi feita.',
      ],
    },
    {
      id: 'rv:db.f05.consistencia-entre-regioes',
      kind: 'decision',
      title: 'Leitura forte entre Regiões numa tabela que já existe',
      prompt:
        'Uma tabela global do DynamoDB foi criada no **modo padrão**, com réplicas em três Regiões dos Estados Unidos. Um novo requisito exige que uma leitura em qualquer Região **sempre traga a última gravação feita em qualquer outra**, com o **modo de consistência forte entre Regiões**. O que a equipe precisa fazer?',
      concepts: [{ id: 'ddb.global-tables' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar o modo de consistência da tabela atual para o forte.', correct: false, consequence: 'O modo de consistência é escolhido na criação e não muda depois.' },
        { id: 'b', text: 'Pedir leitura fortemente consistente nas consultas de cada Região.', correct: false, consequence: 'No modo padrão, a leitura forte vale dentro da Região, não para gravações feitas nas outras.' },
        { id: 'c', text: 'Adicionar uma quarta réplica, que ativa o modo forte entre Regiões.', correct: false, consequence: 'O modo forte entre Regiões exige exatamente três Regiões, e o número de réplicas não muda o modo.' },
        { id: 'd', text: 'Criar uma tabela global nova, no modo forte, e migrar os dados.', correct: true, consequence: 'O modo forte entre Regiões só é escolhido na criação, com exatamente três Regiões.' },
      ],
      explanation: [
        'As tabelas globais têm dois modos: o **padrão**, com consistência eventual entre Regiões, e o **forte entre Regiões** (MRSC), que exige **exatamente três Regiões**. O modo é **escolhido na criação e não muda depois**, então a equipe cria uma tabela nova e migra os dados.',
        'Não há troca de modo numa tabela existente. A leitura forte do modo padrão vale só dentro da Região. E uma quarta réplica não ativa nada.',
        '**Regra prática:** consistência forte entre Regiões no DynamoDB é decisão de criação, com três Regiões; no modo padrão, vale a última escrita.',
      ],
    },
    {
      id: 'rv:db.f05.m3.a1',
      kind: 'decision',
      title: 'Carga inicial de dois milhões de itens',
      prompt:
        'Para lançar um catálogo novo, a equipe precisa gravar **dois milhões de itens independentes** numa tabela do DynamoDB. Um item que falhar pode ser **regravado depois**, sem afetar os outros. O script atual usa **TransactWriteItems** em grupos de 100 e está lento e caro. Qual mudança **reduz o custo** da carga?',
      concepts: [{ id: 'ddb.transactions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Usar TransactWriteItems em grupos menores, de 10 itens.', correct: false, consequence: 'Cada item continua custando duas operações, preparar e confirmar.' },
        { id: 'b', text: 'Usar BatchWriteItem e regravar só os itens que falharem.', correct: true, consequence: 'Cada item custa uma escrita comum, e o tudo ou nada desnecessário sai da conta.' },
        { id: 'c', text: 'Usar TransactGetItems antes de cada grupo, para conferir os itens.', correct: false, consequence: 'Soma leituras transacionais, que também custam o dobro, e não barateia a escrita.' },
        { id: 'd', text: 'Usar TransactWriteItems com um token de cliente em cada grupo.', correct: false, consequence: 'O token evita gravações duplicadas em novas tentativas; não muda o custo de cada item.' },
      ],
      explanation: [
        'Numa **transação**, cada item custa **duas operações** (preparar e confirmar), mesmo quando ela é cancelada. Para gravar muitos itens de uma vez **sem precisar de tudo ou nada**, o caminho é o **BatchWriteItem**, regravando só o que falhar.',
        'Grupos menores, leituras transacionais ou tokens de cliente não mudam o custo dobrado de cada item.',
        '**Regra prática:** transação para o que precisa acontecer junto, como uma troca entre dois jogadores; carga em massa é BatchWriteItem.',
      ],
    },
    {
      id: 'rv:db.f05.compra-repetida',
      kind: 'decision',
      title: 'Uma compra gravada duas vezes depois de um timeout',
      prompt:
        'A compra de um item num jogo usa **TransactWriteItems** para debitar moedas e adicionar o item ao inventário. Quando a resposta demora, o aplicativo **repete a chamada**, e alguns jogadores foram **cobrados duas vezes**. A equipe quer que a repetição **não grave a compra de novo**, com a menor mudança. O que fazer?',
      concepts: [{ id: 'ddb.transactions' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar a transação por um BatchWriteItem com as duas gravações.', correct: false, consequence: 'O batch não é tudo ou nada: o débito poderia acontecer sem o item.' },
        { id: 'b', text: 'Ligar o DynamoDB Streams para desfazer as compras duplicadas.', correct: false, consequence: 'O stream registra a compra repetida, mas desfazê-la exige código novo e não impede a cobrança.' },
        { id: 'c', text: 'Enviar o mesmo token de cliente na original e na repetição.', correct: true, consequence: 'Dentro de 10 minutos, a repetição com o mesmo token não grava a compra outra vez.' },
        { id: 'd', text: 'Ler o saldo com leitura forte antes de repetir a transação.', correct: false, consequence: 'Ajuda a descobrir o que aconteceu, mas a repetição ainda pode gravar de novo.' },
      ],
      explanation: [
        'O **token de cliente** (client token) torna o TransactWriteItems **idempotente por 10 minutos**: repetir a chamada com o mesmo token não grava de novo. É a menor mudança para tentativas repetidas depois de um timeout.',
        'O batch perde o tudo ou nada. O stream não impede a cobrança. E a leitura antes não garante que a repetição deixe de gravar.',
        '**Regra prática:** em transações que podem ser repetidas, envie um token de cliente; ele vale por 10 minutos.',
      ],
    },
    {
      id: 'rv:db.f05.m3.a2',
      kind: 'decision',
      title: 'Um bug às 14h32 de ontem',
      prompt:
        'Um bug zerou os inventários dos jogadores às 14h32 de ontem, numa tabela do DynamoDB com **PITR ligado**. Os jogadores continuaram jogando depois disso, e as outras tabelas não foram afetadas. A equipe precisa **recuperar os inventários** de antes do bug. Qual caminho funciona?',
      concepts: [{ id: 'ddb.backup' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Restaurar com PITR para 14h31 por cima da tabela atual.', correct: false, consequence: 'A restauração sempre cria uma tabela nova; não sobrescreve a atual.' },
        { id: 'b', text: 'Ler o stream da tabela e desfazer as mudanças desde 14h32.', correct: false, consequence: 'O stream guarda só 24 horas, e desfazer as mudanças à mão é arriscado.' },
        { id: 'c', text: 'Restaurar para 14h31 numa tabela nova e copiar de volta.', correct: true, consequence: 'Os inventários voltam como estavam antes do bug, sem desfazer o resto do jogo.' },
        { id: 'd', text: 'Restaurar o backup sob demanda mais recente sobre a tabela atual.', correct: false, consequence: 'Toda restauração cria uma tabela nova, e o backup mais recente pode ser de antes de muitas mudanças.' },
      ],
      explanation: [
        'O **PITR** restaura a tabela como estava em qualquer segundo da janela, de até 35 dias, sempre **numa tabela nova**, sem afetar a original. A equipe restaura para 14h31 e copia os inventários de volta, ou aponta a aplicação para a tabela nova.',
        'Nenhuma restauração sobrescreve a tabela atual. O stream guarda 24 horas e não foi feito para desfazer mudanças.',
        '**Regra prática:** "recuperar de uma gravação errada" no DynamoDB é PITR, numa tabela nova.',
      ],
    },
    {
      id: 'rv:db.f05.janela-reiniciada',
      kind: 'decision',
      title: 'Um erro de três dias atrás sem como voltar',
      prompt:
        'Uma tabela do DynamoDB tinha **PITR com 35 dias**. Ontem, um analista desligou e religou o PITR, achando que isso reduziria a conta. Hoje, a equipe descobriu uma gravação errada de **três dias atrás** e não consegue restaurar para antes dela. A empresa quer **evitar que isso se repita**. Qual é a causa?',
      concepts: [{ id: 'ddb.backup' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desligar e religar o PITR reinicia a janela de recuperação.', correct: true, consequence: 'A janela recomeçou ontem; a empresa passa a controlar quem pode mexer no PITR.' },
        { id: 'b', text: 'O PITR só guarda as gravações feitas nas últimas 24 horas.', correct: false, consequence: 'O período vai de 1 a 35 dias; quem guarda 24 horas é o stream.' },
        { id: 'c', text: 'O PITR só restaura tabelas no modo de capacidade provisionado.', correct: false, consequence: 'O PITR funciona nos dois modos de capacidade, sob demanda e provisionado.' },
        { id: 'd', text: 'Religar o PITR trocou o período de 35 dias para o mínimo de 1.', correct: false, consequence: 'Mesmo que o período fosse mantido, a janela recomeçaria do momento em que o PITR foi religado.' },
      ],
      explanation: [
        'O PITR guarda backups contínuos por um período de 1 a 35 dias. **Desligar e religar o PITR reinicia a janela de recuperação**: o ponto mais antigo restaurável passa a ser o momento em que ele foi religado.',
        'O PITR não se limita a 24 horas nem depende do modo de capacidade. O problema não é o período configurado, e sim a janela reiniciada.',
        '**Regra prática:** não desligue o PITR para economizar; para retenção longa ou centralizada, use backups sob demanda ou o AWS Backup.',
      ],
    },
    {
      id: 'rv:db.f05.m3.a3',
      kind: 'decision',
      title: 'Análise semanal das partidas com o Athena',
      prompt:
        'O time de dados quer consultar com o **Athena**, toda semana, todas as partidas de um jogo guardadas numa tabela do DynamoDB de 2 TB. A tabela atende o jogo o dia todo, e a análise **não pode consumir capacidade de leitura** dela. O PITR ainda **não está ligado**. Qual solução atende?',
      concepts: [{ id: 'ddb.export' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma Scan semanal da tabela, gravando o resultado no S3.', correct: false, consequence: 'A Scan consome capacidade de leitura da tabela inteira e compete com o jogo.' },
        { id: 'b', text: 'Ligar o PITR e exportar a tabela para o S3 toda semana.', correct: true, consequence: 'A exportação usa os dados do PITR e não consome capacidade de leitura da tabela.' },
        { id: 'c', text: 'Um backup sob demanda semanal, consultado pelo Athena.', correct: false, consequence: 'O backup serve para restaurar uma tabela, não para ser consultado como arquivos no S3.' },
        { id: 'd', text: 'Um índice global com todos os atributos, lido pelo Athena.', correct: false, consequence: 'O índice soma escrita na tabela e não leva nada ao S3.' },
      ],
      explanation: [
        'A **exportação para o S3** copia a tabela como estava num momento da janela do PITR, de forma assíncrona e **sem consumir capacidade de leitura**. Ela **exige o PITR ligado**. Depois, o Athena consulta os arquivos no S3. Também existe a exportação incremental, só do que mudou num intervalo.',
        'A Scan compete com o jogo. O backup sob demanda não é consultável pelo Athena. Um índice global não leva dados ao S3.',
        '**Regra prática:** "analisar os dados do DynamoDB sem afetar a tabela" é a exportação para o S3, com o PITR ligado.',
      ],
    },
  ],
}
