/**
 * Questões da Revisão da Fase 3 de Bancos de dados (Amazon Aurora), no formato
 * do exame SAA-C03. Fatos conferidos em 21/10/2026 e 03/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'db.f03',
  questions: [
    {
      id: 'rv:db.f03.espaco-que-nao-volta',
      kind: 'decision',
      title: 'Metade dos dados apagada e a mesma conta de armazenamento',
      prompt:
        'Um RDS for MySQL cresceu para 4 TiB com logs antigos. A equipe apagou metade dos dados, mas a **conta de armazenamento não caiu**. O banco vai continuar crescendo e encolhendo ao longo do ano, e a empresa quer **pagar só pelo espaço que os dados ocupam**, sem gerenciar o tamanho do volume. Qual solução atende?',
      concepts: [{ id: 'aur.cluster-volume' }, { id: 'aur.vs-rds' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar o storage autoscaling do RDS para ajustar o volume ao uso.', correct: false, consequence: 'O storage autoscaling só aumenta o armazenamento; ele nunca diminui o espaço alocado.' },
        { id: 'b', text: 'Reduzir o armazenamento alocado da instância para 2 TiB.', correct: false, consequence: 'O RDS não permite reduzir o armazenamento alocado de uma instância.' },
        { id: 'c', text: 'Migrar para o Aurora MySQL, cujo volume acompanha o espaço usado.', correct: true, consequence: 'O volume do cluster cresce sozinho e, nas versões com redimensionamento dinâmico, diminui quando os dados são apagados.' },
        { id: 'd', text: 'Trocar o volume gp3 por io2, que cobra pelos IOPS e não pelo tamanho.', correct: false, consequence: 'O io2 cobra pelo tamanho provisionado e também pelos IOPS: a conta subiria.' },
      ],
      explanation: [
        'No **Aurora**, os dados ficam no **volume do cluster**, que cresce sozinho e cobra o espaço usado. Nas versões com redimensionamento dinâmico, o espaço alocado **diminui quando os dados são apagados**. Isso atende a quem não quer gerenciar o tamanho do volume.',
        'No RDS, o armazenamento alocado não pode ser reduzido, e o storage autoscaling só aumenta. Trocar a classe do volume EBS não muda a cobrança pelo tamanho.',
        '**Regra prática:** "armazenamento que cresce sozinho" e "pagar só pelo espaço usado" num banco MySQL ou PostgreSQL apontam para o Aurora; no RDS, o espaço alocado só aumenta.',
      ],
    },
    {
      id: 'rv:db.f03.m1.a2',
      kind: 'decision',
      title: 'Três instâncias do Aurora e uma AZ fora do ar',
      prompt:
        'Um cluster Aurora PostgreSQL tem a escritora e duas réplicas, todas criadas em **us-east-1a**, "para ficar perto da aplicação". A AZ us-east-1a ficou fora do ar por duas horas, e o banco também. A empresa quer que, numa próxima falha de AZ, **o banco volte sozinho em menos de um minuto**. O que mudar?',
      concepts: [{ id: 'aur.replicas' }, { id: 'aur.cluster-volume' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ligar a replicação do volume do cluster para outras AZs.', correct: false, consequence: 'O volume já guarda seis cópias em três AZs; faltou uma instância fora da AZ que caiu.' },
        { id: 'b', text: 'Mover uma das réplicas para outra AZ, como us-east-1b.', correct: true, consequence: 'Numa falha da AZ da escritora, a réplica em outra AZ é promovida em segundos, lendo o mesmo volume.' },
        { id: 'c', text: 'Adicionar mais duas réplicas, também em us-east-1a.', correct: false, consequence: 'Todas na mesma AZ continuam caindo juntas; o número de réplicas não resolve.' },
        { id: 'd', text: 'Criar um snapshot por hora para restaurar em outra AZ.', correct: false, consequence: 'A restauração cria um cluster novo, exige ação da equipe e não volta em menos de um minuto.' },
      ],
      explanation: [
        'Os dados estavam a salvo: o **volume do cluster** guarda seis cópias em três AZs, mesmo com todas as instâncias numa só. O que faltou foi uma **instância em outra AZ**. Com a escritora e todas as réplicas na mesma AZ, é preciso criar instâncias em outra AZ manualmente. Com uma réplica em outra AZ, ela é promovida sozinha, em geral em menos de 60 segundos.',
        'O volume já é distribuído. Mais réplicas na mesma AZ caem juntas. E restaurar snapshot é manual e demorado.',
        '**Regra prática:** num Aurora de produção, pelo menos uma réplica em outra AZ. As cópias dos dados já estão em três AZs; as instâncias, não.',
      ],
    },
    {
      id: 'rv:db.f03.prioridade-de-promocao',
      kind: 'decision',
      title: 'O failover escolheu a réplica errada',
      prompt:
        'Um cluster Aurora MySQL tem uma escritora db.r6g.4xlarge, uma réplica **db.r6g.4xlarge** para assumir numa falha e duas réplicas **db.r6g.large** usadas só por um painel interno. No último failover, uma réplica pequena virou a escritora e o site ficou lento. A equipe quer que **a réplica grande seja sempre a escolhida**, sem causar outro failover agora. O que fazer?',
      concepts: [{ id: 'aur.replicas' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Dar prioridade 15 à réplica grande e 0 às réplicas pequenas.', correct: false, consequence: 'É o contrário: 0 é a prioridade mais alta, então as pequenas passariam a ser as preferidas.' },
        { id: 'b', text: 'Colocar as réplicas pequenas num endpoint personalizado.', correct: false, consequence: 'O endpoint personalizado direciona conexões; não muda a ordem de promoção no failover.' },
        { id: 'c', text: 'Ligar o Aurora Auto Scaling com a réplica grande como modelo.', correct: false, consequence: 'O Auto Scaling adiciona e remove leitoras pela métrica; não define qual é promovida.' },
        { id: 'd', text: 'Dar prioridade 0 à réplica grande e 15 às réplicas pequenas.', correct: true, consequence: 'A réplica grande passa a ser a primeira da fila; mudar a prioridade não causa failover.' },
      ],
      explanation: [
        'Cada réplica do Aurora tem uma **prioridade de promoção**, de **0 (mais alta) a 15**. No failover, vence a de prioridade mais alta; com a mesma prioridade, vence a maior. Dar 0 à réplica grande e 15 às pequenas garante a escolha, e **mudar a prioridade não causa failover**.',
        'Inverter os números faz o contrário. Endpoints personalizados e o Auto Scaling não mexem na ordem de promoção.',
        '**Regra prática:** quando uma réplica precisa assumir antes das outras, ajuste a prioridade de promoção: 0 é a primeira da fila.',
      ],
    },
    {
      id: 'rv:db.f03.m1.a4',
      kind: 'decision',
      title: 'Leituras que dobram no fim de novembro',
      prompt:
        'Uma loja virtual usa Aurora MySQL com uma escritora e duas réplicas. Na última semana de novembro, as **leituras das vitrines dobram**; as gravações quase não mudam. A equipe não quer **criar e apagar réplicas à mão** e quer pagar pela capacidade extra **só enquanto ela for necessária**. Qual solução atende?',
      concepts: [{ id: 'aur.replicas' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Aurora Auto Scaling para aumentar a classe da escritora no pico.', correct: false, consequence: 'O Aurora Auto Scaling só adiciona e remove réplicas; ele não muda a escritora.' },
        { id: 'b', text: 'Trocar a escritora por uma classe maior durante o mês inteiro.', correct: false, consequence: 'Paga a mais o mês todo, e as leituras continuam disputando a mesma instância.' },
        { id: 'c', text: 'Aurora Auto Scaling para as réplicas, pela CPU média das leitoras.', correct: true, consequence: 'As réplicas são adicionadas no pico e removidas depois, sem trabalho manual.' },
        { id: 'd', text: 'Criar réplicas de leitura do RDS a partir do cluster Aurora.', correct: false, consequence: 'Continua sendo criar e apagar réplicas à mão, o que a equipe quer evitar.' },
      ],
      explanation: [
        'O **Aurora Auto Scaling** adiciona e remove **réplicas** por uma métrica como a **CPU média das leitoras** ou o número de conexões. As leituras extras vão para as novas réplicas pelo endpoint de leitura, e elas somem quando a demanda cai.',
        'O Auto Scaling não aumenta a escritora. Uma classe maior o mês inteiro paga a capacidade fora do pico. Criar réplicas à mão é o que a equipe quer evitar.',
        '**Regra prática:** "escalar leituras automaticamente" no Aurora é o Aurora Auto Scaling das réplicas; a escritora continua com a classe escolhida.',
      ],
    },
    {
      id: 'rv:db.f03.m1.a3:orders',
      kind: 'decision',
      title: 'Gravações que falham depois do failover',
      prompt:
        'Uma aplicação grava pedidos e lê o catálogo num cluster Aurora com uma escritora e três réplicas. Hoje, ela usa o **endereço de uma instância** para tudo, e no último failover as gravações falharam até alguém trocar a configuração. A equipe quer que as **gravações acompanhem o failover** e que as **leituras se distribuam entre as réplicas**. Quais endpoints a aplicação deve usar? (Escolha DUAS.)',
      concepts: [{ id: 'aur.endpoints' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'O endpoint do cluster, para as gravações dos pedidos.', correct: true, consequence: 'Ele sempre aponta para a escritora atual, inclusive depois de um failover.' },
        { id: 'b', text: 'O endpoint de leitura, para as consultas do catálogo.', correct: true, consequence: 'Ele distribui as conexões entre as réplicas e acompanha as mudanças do cluster.' },
        { id: 'c', text: 'O endpoint de instância da escritora atual, para as gravações.', correct: false, consequence: 'É o que já falhou: o endpoint de instância não acompanha o failover.' },
        { id: 'd', text: 'Um endpoint personalizado com a escritora, para as gravações.', correct: false, consequence: 'Endpoints personalizados servem para agrupar instâncias escolhidas, como réplicas para relatórios, e não para seguir a escritora.' },
        { id: 'e', text: 'O endpoint de instância de uma das réplicas, para o catálogo.', correct: false, consequence: 'Todas as leituras cairiam numa só réplica, e as outras ficariam paradas.' },
      ],
      explanation: [
        'O **endpoint do cluster** sempre aponta para a escritora atual e acompanha o failover. O **endpoint de leitura** distribui as conexões entre as réplicas. Com os dois, as gravações e as leituras se ajustam sozinhas às mudanças do cluster.',
        'O endpoint de instância liga numa instância específica e não acompanha o failover; serve para diagnóstico. Endpoints personalizados agrupam instâncias escolhidas, como réplicas maiores para relatórios.',
        '**Regra prática:** grave pelo endpoint do cluster e leia pelo endpoint de leitura; endpoint de instância só para investigar uma instância.',
      ],
    },
    {
      id: 'rv:db.f03.m2.a3',
      kind: 'decision',
      title: 'Mudar a Região primária numa madrugada planejada',
      prompt:
        'Uma empresa usa um Aurora Global Database com a primária em us-east-1 e um secundário em eu-central-1. Por uma mudança de contrato, a Região primária vai passar a ser eu-central-1, numa **madrugada planejada**, com as duas Regiões saudáveis e **sem perder nenhuma gravação**. Qual operação usar?',
      concepts: [{ id: 'aur.global-database' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um failover do Global Database para eu-central-1.', correct: false, consequence: 'O failover é para uma falha na Região primária e pode perder as gravações que ainda não tinham chegado.' },
        { id: 'b', text: 'Um switchover do Global Database para eu-central-1.', correct: true, consequence: 'O switchover sincroniza o secundário antes da troca: eu-central-1 vira a primária sem perda de dados.' },
        { id: 'c', text: 'Copiar um snapshot para eu-central-1 e restaurar lá.', correct: false, consequence: 'O banco restaurado fica sem as gravações feitas depois do snapshot e exige trocar endpoints.' },
        { id: 'd', text: 'Apagar o cluster de us-east-1 para eu-central-1 assumir.', correct: false, consequence: 'Apagar a primária não promove o secundário de forma planejada e arrisca os dados.' },
      ],
      explanation: [
        'O **switchover** troca a Região primária de um Global Database **saudável**: ele sincroniza o secundário com a primária antes de qualquer mudança, então **não há perda de dados**. É a operação para mudanças planejadas.',
        'O **failover** é para recuperar depois de uma falha na Região primária, e a perda depende do atraso de replicação, em geral de segundos. Snapshot restaurado perde as gravações posteriores. Apagar a primária não é um procedimento de troca.',
        '**Regra prática:** troca planejada, sem perda, é switchover; Região primária com problema é failover.',
      ],
    },
    {
      id: 'rv:db.f03.escrita-no-secundario',
      kind: 'decision',
      title: 'Uma gravação ocasional na Região secundária',
      prompt:
        'Uma plataforma usa Aurora MySQL Global Database com a primária em us-east-1 e um secundário em ap-northeast-1, onde roda uma cópia da aplicação que **só lê**. Agora essa cópia precisa **gravar de vez em quando** as preferências do usuário. A equipe quer a **menor mudança** possível, **sem que a aplicação em Tóquio abra conexões com outra Região**. Qual solução atende?',
      concepts: [{ id: 'aur.global-database' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Gravar direto no cluster secundário, que aceita escritas próprias.', correct: false, consequence: 'Só a Região primária grava diretamente; o secundário é só de leitura.' },
        { id: 'b', text: 'Migrar as preferências para uma tabela global do DynamoDB.', correct: false, consequence: 'Funciona, mas troca o modelo de dados e reescreve parte da aplicação: não é a menor mudança.' },
        { id: 'c', text: 'Ligar o write forwarding no cluster secundário de Tóquio.', correct: true, consequence: 'O secundário encaminha as gravações para a primária, e a aplicação continua conectada em Tóquio.' },
        { id: 'd', text: 'Promover o secundário de Tóquio a um cluster independente.', correct: false, consequence: 'Tóquio passa a gravar, mas deixa de receber os dados de us-east-1, e os dois bancos se separam.' },
      ],
      explanation: [
        'No Global Database, **só a Região primária grava diretamente**. Com o **write forwarding**, um secundário encaminha as instruções de escrita para a primária, e o Aurora cuida da rede entre as Regiões. A aplicação de Tóquio continua usando o cluster local.',
        'O secundário não aceita escritas próprias. Trocar por uma tabela global do DynamoDB é uma reescrita. Promover o secundário separa os dois bancos.',
        '**Regra prática:** gravações ocasionais num secundário do Aurora Global Database apontam para o write forwarding; gravação independente em todas as Regiões é tabela global do DynamoDB.',
      ],
    },
    {
      id: 'rv:db.f03.m2.a2:dev',
      kind: 'decision',
      title: 'Bancos de desenvolvimento quase sempre parados',
      prompt:
        'Uma software house tem 12 bancos Aurora PostgreSQL de desenvolvimento, um por cliente. Cada um é usado **algumas horas por semana**, em horários imprevisíveis, e hoje roda numa instância provisionada ligada o tempo todo. A empresa quer o **menor custo**, sem a equipe ligar e desligar bancos à mão. Qual solução atende?',
      concepts: [{ id: 'aur.serverless' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Aurora serverless com capacidade mínima de 0 ACU em cada banco.', correct: true, consequence: 'Sem uso, cada banco pausa e não paga capacidade; com uso, sobe sozinho.' },
        { id: 'b', text: 'Comprar instâncias reservadas por três anos para os 12 bancos.', correct: false, consequence: 'Reserva barateia a hora, mas continua pagando 24 horas por dia por bancos quase sempre parados.' },
        { id: 'c', text: 'Ligar o Aurora Auto Scaling para remover as réplicas sem uso.', correct: false, consequence: 'O Auto Scaling mexe nas leitoras; a escritora continua ligada e cobrada o tempo todo.' },
        { id: 'd', text: 'Trocar a configuração de armazenamento para I/O-Optimized.', correct: false, consequence: 'Muda a cobrança de E/S, não a da instância parada, que é o grosso da conta.' },
      ],
      explanation: [
        'No **Aurora serverless**, você define um intervalo de capacidade em ACUs, e a cobrança é por ACU-hora. Nas versões recentes, a capacidade mínima pode ser **0 ACU**: sem uso, o banco **pausa** e não cobra capacidade. É o perfil de bancos de desenvolvimento usados poucas horas, em horários imprevisíveis.',
        'Instâncias reservadas pagam o dia inteiro. O Aurora Auto Scaling não para a escritora. E o I/O-Optimized não muda a cobrança da instância.',
        '**Regra prática:** "carga intermitente", "ambientes de desenvolvimento" e "sem gerenciar capacidade" num banco relacional apontam para o Aurora serverless.',
      ],
    },
    {
      id: 'rv:db.f03.m2.a2:orders',
      kind: 'decision',
      title: 'Banco serverless no máximo o dia inteiro',
      prompt:
        'Um sistema de pedidos usa **Aurora serverless** desde o lançamento, quando a carga era desconhecida. Um ano depois, as métricas mostram a capacidade **perto do máximo do intervalo 24 horas por dia**, com variação pequena. A empresa quer **reduzir o custo** mantendo o desempenho. Qual mudança atende?',
      concepts: [{ id: 'aur.serverless' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Aumentar o máximo do intervalo de ACUs, para ter folga no pico.', correct: false, consequence: 'Dá mais folga, mas a cobrança por ACU-hora continua a mesma ou sobe.' },
        { id: 'b', text: 'Baixar o mínimo do intervalo para 0 ACU, para pausar sem uso.', correct: false, consequence: 'O banco nunca fica sem uso; pausar não acontece e a conta não muda.' },
        { id: 'c', text: 'Ligar o Aurora Auto Scaling para dividir a carga com réplicas.', correct: false, consequence: 'Réplicas atendem leituras e somam capacidade cobrada, sem baratear a escritora.' },
        { id: 'd', text: 'Trocar a escritora por uma instância provisionada do mesmo porte.', correct: true, consequence: 'Para carga alta e constante, a instância de tamanho fixo costuma sair mais barata que as ACUs.' },
      ],
      explanation: [
        'O Aurora serverless compensa quando a carga **varia**. Para carga **alta e constante**, uma **instância provisionada** do mesmo porte costuma sair mais barata. Um mesmo cluster pode misturar instâncias serverless e provisionadas, então a troca pode ser feita aos poucos.',
        'Mexer no intervalo de ACUs não muda o custo de uma carga sempre no máximo. Réplicas somam custo e não barateiam a escritora.',
        '**Regra prática:** serverless para carga imprevisível ou intermitente; carga estável e alta vai para instância provisionada.',
      ],
    },
    {
      id: 'rv:db.f03.m3.a1',
      kind: 'decision',
      title: 'Conta do Aurora dominada pela E/S',
      prompt:
        'O relatório de custos de um cluster Aurora Standard mostra a divisão da conta mensal abaixo. O banco faz muitas leituras e gravações o dia inteiro, e não há previsão de mudança. A empresa quer **reduzir o custo do Aurora** sem mudar a aplicação. Qual mudança atende?',
      exhibits: [
        {
          title: 'Custo mensal do cluster (Aurora Standard)',
          code: 'Instâncias (2 × db.r7g.xlarge)   38%\nArmazenamento (800 GB)            7%\nRequisições de E/S                55%',
        },
      ],
      concepts: [{ id: 'aur.io-optimized' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar a configuração de armazenamento para Aurora I/O-Optimized.', correct: true, consequence: 'A E/S deixa de ser cobrada; instância e armazenamento ficam mais caros, mas a E/S era mais da metade da conta.' },
        { id: 'b', text: 'Trocar as instâncias por Aurora serverless com mínimo de 0 ACU.', correct: false, consequence: 'O banco trabalha o dia inteiro, e a E/S continua sendo cobrada por requisição.' },
        { id: 'c', text: 'Adicionar réplicas para dividir as leituras entre mais instâncias.', correct: false, consequence: 'As requisições de E/S continuam as mesmas, e as réplicas somam custo de instância.' },
        { id: 'd', text: 'Reduzir o armazenamento alocado do cluster para 500 GB.', correct: false, consequence: 'O volume do Aurora cobra o espaço usado; não há tamanho alocado para reduzir, e o armazenamento é só 7% da conta.' },
      ],
      explanation: [
        'No **Aurora Standard**, cada milhão de requisições de E/S é cobrado. No **I/O-Optimized**, não há cobrança de E/S, e instância e armazenamento custam mais. A AWS indica o I/O-Optimized quando a E/S passa de **25% do gasto** com o Aurora; aqui ela é 55%.',
        'Serverless não elimina a cobrança de E/S de um banco que trabalha o dia todo. Réplicas não diminuem as requisições. E o volume do Aurora já cobra só o espaço usado.',
        '**Regra prática:** "a cobrança de E/S é a maior parte do custo do Aurora" aponta para o I/O-Optimized. Dá para trocar para ele uma vez a cada 30 dias e voltar a qualquer momento.',
      ],
    },
    {
      id: 'rv:db.f03.m3.a3',
      kind: 'decision',
      title: 'Uma atualização errada no Aurora PostgreSQL',
      prompt:
        'Há 20 minutos, uma atualização sem WHERE zerou o estoque de todos os produtos num cluster **Aurora PostgreSQL** com duas réplicas e backup automático de 7 dias. Alguém sugeriu "rebobinar o cluster". A equipe precisa **recuperar o estoque de antes do erro**. Qual caminho funciona?',
      concepts: [{ id: 'aur.backtrack-clone' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Fazer o Backtrack do cluster para um minuto antes da atualização.', correct: false, consequence: 'O Backtrack só existe no Aurora MySQL, e precisa ser ligado na criação do cluster.' },
        { id: 'b', text: 'Promover uma das réplicas do Aurora a escritora.', correct: false, consequence: 'As réplicas leem o mesmo volume: a atualização errada está nelas também.' },
        { id: 'c', text: 'Criar um clone do cluster e copiar o estoque dele.', correct: false, consequence: 'O clone parte dos dados de agora, já com o estoque zerado.' },
        { id: 'd', text: 'Restaurar para um minuto antes do erro e copiar o estoque.', correct: true, consequence: 'A restauração cria um cluster novo com os dados de antes, de onde a equipe copia o estoque.' },
      ],
      explanation: [
        'O **Backtrack**, que rebobina o próprio cluster em minutos, **não existe no Aurora PostgreSQL**: só no Aurora MySQL, ligado na criação. Aqui, o caminho é a **restauração para um ponto no tempo**, que cria um cluster novo com os dados de um minuto antes do erro; a equipe copia o estoque de volta.',
        'As réplicas compartilham o volume e já têm o erro. O clone também parte do estado atual.',
        '**Regra prática:** "desfazer um erro em minutos, sem restaurar" no Aurora MySQL é o Backtrack; no Aurora PostgreSQL, a resposta é a restauração para um ponto no tempo. Para criar em minutos um ambiente de testes com dados reais, o clone.',
      ],
    },
    {
      id: 'rv:db.f03.boss.a2',
      kind: 'decision',
      title: 'Banco interno pequeno com orçamento apertado',
      prompt:
        'Um sistema interno de reservas de salas usa **MariaDB**, com 20 GB de dados e poucos usuários. O time vai levá-lo para um banco gerenciado na AWS com o **menor custo**, **sem mudar o motor**, e aceita **alguns minutos de parada** numa falha. Qual opção atende?',
      concepts: [{ id: 'aur.vs-rds' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Aurora MySQL com uma escritora e uma réplica em outra AZ.', correct: false, consequence: 'O Aurora não roda MariaDB, e a réplica paga um failover em segundos que ninguém pediu.' },
        { id: 'b', text: 'Amazon RDS for MariaDB numa instância pequena, Single-AZ.', correct: true, consequence: 'O motor continua o mesmo, gerenciado, pelo menor custo para o tamanho e a tolerância a parada.' },
        { id: 'c', text: 'Aurora Global Database com um secundário em outra Região.', correct: false, consequence: 'Paga dois clusters por recuperação entre Regiões, e o Aurora não roda MariaDB.' },
        { id: 'd', text: 'Amazon RDS for MariaDB num cluster Multi-AZ, com três instâncias.', correct: false, consequence: 'O cluster Multi-AZ existe para MySQL e PostgreSQL, e três instâncias passam do necessário.' },
      ],
      explanation: [
        'O Aurora é compatível com **MySQL e PostgreSQL**. Para **MariaDB**, para os motores comerciais e para bancos pequenos em que o custo pesa mais, a escolha é o **RDS**. Como a empresa aceita minutos de parada, uma instância Single-AZ pequena atende pelo menor custo.',
        'As opções com Aurora mudariam o motor e pagariam disponibilidade que não foi pedida. O cluster Multi-AZ do RDS é só para MySQL e PostgreSQL.',
        '**Regra prática:** Oracle, SQL Server, Db2 ou MariaDB eliminam o Aurora. Com MySQL ou PostgreSQL, "failover rápido", "muitas réplicas", "várias Regiões" e "capacidade automática" apontam para o Aurora.',
      ],
    },
    {
      id: 'rv:db.f03.leitoras-que-assumem',
      kind: 'decision',
      title: 'PostgreSQL com leituras que crescem e failover curto',
      prompt:
        'Um aplicativo de mobilidade usa PostgreSQL. Ele precisa de **failover em menos de um minuto**, de cópias de leitura que **também assumam a escrita** numa falha, e de um número de leitoras que **acompanhe a demanda sozinho**, podendo passar de 10 nos horários de pico. Qual solução atende?',
      concepts: [{ id: 'aur.vs-rds' }, { id: 'aur.replicas' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon RDS for PostgreSQL num cluster Multi-AZ, com dois leitores.', correct: false, consequence: 'O cluster Multi-AZ tem dois leitores fixos; não passa de 10 nem cresce com a demanda.' },
        { id: 'b', text: 'Amazon RDS for PostgreSQL Multi-AZ, com 12 réplicas de leitura.', correct: false, consequence: 'As réplicas do RDS não assumem sozinhas numa falha e são criadas e removidas à mão.' },
        { id: 'c', text: 'Amazon Aurora PostgreSQL com réplicas e Aurora Auto Scaling.', correct: true, consequence: 'As réplicas leem o mesmo volume, assumem a escrita em segundos e são adicionadas pela demanda.' },
        { id: 'd', text: 'Amazon RDS for PostgreSQL Multi-AZ, com um RDS Proxy na frente.', correct: false, consequence: 'O proxy ajuda nas conexões durante o failover, mas não cria leitoras.' },
      ],
      explanation: [
        'O **Aurora** junta os três requisitos: até 15 **réplicas** que atendem leituras e **assumem a escrita** num failover, em geral em menos de 60 segundos, e o **Aurora Auto Scaling**, que adiciona e remove réplicas pela demanda.',
        'O cluster Multi-AZ do RDS tem dois leitores fixos. As réplicas de leitura do RDS não assumem sozinhas nem escalam sozinhas. O RDS Proxy não cria capacidade de leitura.',
        '**Regra prática:** com MySQL ou PostgreSQL, "muitas réplicas", "failover em segundos" e "escalar leituras automaticamente" apontam para o Aurora.',
      ],
    },
  ],
}
