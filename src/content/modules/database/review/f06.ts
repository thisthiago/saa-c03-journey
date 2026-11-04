/**
 * Questões da Revisão da Fase 6 de Bancos de dados (Cache e bancos
 * especializados), no formato do exame SAA-C03. Fatos conferidos em 21/10/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'db.f06',
  questions: [
    {
      id: 'rv:db.f06.m1.a4',
      kind: 'decision',
      title: 'As mesmas consultas do catálogo o dia inteiro',
      prompt:
        'Um site de receitas roda num Aurora MySQL, e a CPU do banco vive acima de 85% por causa das **mesmas consultas do catálogo**, repetidas milhares de vezes por minuto. O produto quer as páginas respondendo em **microssegundos**, e o financeiro quer a solução de **menor custo**. Qual solução atende?',
      concepts: [{ id: 'cache.why' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Dobrar a classe da instância escritora do Aurora.', correct: false, consequence: 'Paga o dobro para continuar respondendo as mesmas consultas em milissegundos.' },
        { id: 'b', text: 'Adicionar três réplicas do Aurora para as consultas.', correct: false, consequence: 'Divide a carga, mas paga três instâncias e continua em milissegundos.' },
        { id: 'c', text: 'Colocar um ElastiCache na frente do Aurora para o catálogo.', correct: true, consequence: 'As consultas repetidas saem da memória em microssegundos, e o banco volta a ter folga.' },
        { id: 'd', text: 'Mover o catálogo para o Redshift, que é mais rápido.', correct: false, consequence: 'O Redshift é para análise de grandes volumes, não para servir páginas.' },
      ],
      explanation: [
        'Leituras **repetidas** são o caso clássico de **cache**. O ElastiCache responde da memória em **microssegundos** e tira quase toda a carga do banco, por uma fração do custo de aumentar a classe ou somar réplicas.',
        'Uma classe maior e réplicas resolvem a carga, mas custam mais e continuam em milissegundos. O Redshift não serve páginas.',
        '**Regra prática:** "leituras repetidas sobrecarregam o banco" e "microssegundos" apontam para o ElastiCache; para o DynamoDB, sem mudar a lógica, o DAX.',
      ],
    },
    {
      id: 'rv:db.f06.sessoes-perdidas',
      kind: 'decision',
      title: 'Usuários deslogados quando o Auto Scaling reduz',
      prompt:
        'Uma aplicação web roda num grupo do Auto Scaling atrás de um ALB, com **sticky sessions** e as sessões guardadas **na memória de cada instância**. Sempre que o grupo remove instâncias, os usuários delas são **deslogados**. A equipe quer que **as sessões sobrevivam à remoção de instâncias**. O que fazer?',
      concepts: [{ id: 'cache.why' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Aumentar a duração do cookie das sticky sessions no ALB.', correct: false, consequence: 'O usuário continua preso à instância, e a sessão some quando ela é removida.' },
        { id: 'b', text: 'Guardar as sessões num ElastiCache compartilhado pelas instâncias.', correct: true, consequence: 'Qualquer instância lê a sessão, e a remoção de uma delas não desloga ninguém.' },
        { id: 'c', text: 'Guardar as sessões num volume de instance store de cada instância.', correct: false, consequence: 'O instance store é perdido quando a instância é encerrada, junto com as sessões.' },
        { id: 'd', text: 'Desligar a redução do Auto Scaling para não remover instâncias.', correct: false, consequence: 'Paga instâncias ociosas e as sessões ainda somem numa falha.' },
      ],
      explanation: [
        'Com a sessão **na memória da instância**, ela some quando a instância sai. Guardando as sessões num **ElastiCache compartilhado**, qualquer instância atende qualquer usuário, e o Auto Scaling pode remover instâncias à vontade.',
        'O cookie mais longo só prende o usuário por mais tempo. O instance store é perdido no encerramento. Desligar a redução paga capacidade parada e não protege de falhas.',
        '**Regra prática:** aplicação sem estado nas instâncias; sessões vão para um armazenamento compartilhado, como o ElastiCache ou o DynamoDB.',
      ],
    },
    {
      id: 'rv:db.f06.m1.a3:churn',
      kind: 'decision',
      title: 'Cache cheio de produtos que ninguém abre',
      prompt:
        'Uma loja usa **escrita direta** (write-through) no ElastiCache: cada produto gravado no banco também entra no cache, e os preços nunca aparecem desatualizados. Com 2 milhões de produtos, a **memória do cache vive cheia**, embora só 5% deles sejam abertos por semana. A equipe quer **usar menos memória** sem perder o frescor dos preços. O que fazer?',
      concepts: [{ id: 'cache.strategies' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Trocar a escrita direta pela leitura sob demanda, sem TTL.', correct: false, consequence: 'Guarda só o que é lido, mas sem TTL os preços alterados no banco ficam velhos no cache.' },
        { id: 'b', text: 'Manter a escrita direta e somar um TTL aos itens do cache.', correct: true, consequence: 'Os produtos que ninguém lê expiram, e os gravados continuam atualizados.' },
        { id: 'c', text: 'Dobrar o tamanho dos nós do cache para caber todo o catálogo.', correct: false, consequence: 'Paga mais memória para guardar produtos que quase ninguém abre.' },
        { id: 'd', text: 'Trocar o motor do cache para o Memcached, que ocupa menos memória.', correct: false, consequence: 'O motor não muda o problema: a escrita direta continua guardando tudo.' },
      ],
      explanation: [
        'A **escrita direta** mantém o cache sempre atualizado, mas **guarda dados que ninguém lê**. Somar um **TTL** faz esses itens expirarem, enquanto cada nova gravação continua atualizando o cache.',
        'A leitura sob demanda sem TTL economiza memória, mas deixa os preços velhos. Nós maiores pagam pelo desperdício. O motor não muda a estratégia.',
        '**Regra prática:** escrita direta para frescor, leitura sob demanda para guardar só o que é lido, e TTL nos dois casos para limitar memória e envelhecimento.',
      ],
    },
    {
      id: 'rv:db.f06.m1.a2',
      kind: 'decision',
      title: 'Quantas leituras ainda chegam ao banco',
      prompt:
        'Um catálogo recebe **20.000 leituras por segundo**, espalhadas de forma parecida por **50.000 produtos**. A equipe vai usar leitura sob demanda (lazy loading) com **TTL de 300 segundos**. O Aurora aguenta **2.000 leituras por segundo** com folga. A equipe precisa **estimar a carga que continua chegando ao banco**. Qual é a estimativa?',
      concepts: [{ id: 'cache.strategies' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Cerca de 20.000 por segundo, porque cada leitura passa pelo banco.', correct: false, consequence: 'Ignora o cache: só a primeira leitura de cada produto em cada TTL vai ao banco.' },
        { id: 'b', text: 'Cerca de 2.000 por segundo, porque o cache acerta 90% das leituras.', correct: false, consequence: 'Chuta uma taxa de acerto em vez de calcular pela quantidade de produtos e pelo TTL.' },
        { id: 'c', text: 'Nenhuma, porque cada produto só vai ao banco na primeira leitura.', correct: false, consequence: 'Esquece o TTL: depois de 300 segundos o item expira e a próxima leitura vai de novo ao banco.' },
        { id: 'd', text: 'Cerca de 170 por segundo: cada produto vai ao banco a cada 300 s.', correct: true, consequence: '50.000 produtos ÷ 300 s dá cerca de 167 leituras por segundo, bem abaixo do limite do Aurora.' },
      ],
      explanation: [
        'Na **leitura sob demanda**, um produto só vai ao banco quando falta no cache: na primeira leitura e de novo **a cada vez que o TTL expira**. Com 50.000 produtos e TTL de 300 s, são cerca de **167 leituras por segundo** no banco. Cada produto é lido 0,4 vez por segundo, ou 120 vezes por TTL, e só uma delas vai ao banco.',
        'Sem cache seriam 20.000. Uma taxa de acerto chutada não substitui a conta. E sem considerar o TTL, a estimativa ignora as recargas.',
        '**Regra prática:** com lazy loading, a carga no banco é cerca de "itens lidos ÷ TTL" quando cada item é lido muitas vezes por TTL.',
      ],
    },
    {
      id: 'rv:db.f06.m2.a1:thread',
      kind: 'decision',
      title: 'Cache simples em nós grandes',
      prompt:
        'Uma plataforma de anúncios quer um cache de **pares chave-valor simples** na frente do banco, em **nós grandes com muitos núcleos**, aproveitando todos eles. Se um nó falhar, a aplicação **refaz o cache a partir do banco**, então **não precisa de réplicas nem de backup**. A equipe quer o **modelo mais simples**. Qual motor do ElastiCache atende?',
      concepts: [{ id: 'cache.engines' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Valkey com modo cluster, réplicas e backup diário.', correct: false, consequence: 'Atende, mas traz réplicas e backup que a equipe disse não precisar.' },
        { id: 'b', text: 'Redis OSS com uma réplica em outra AZ e failover.', correct: false, consequence: 'Paga uma réplica que o requisito dispensa e não é o modelo mais simples.' },
        { id: 'c', text: 'Memcached, com vários nós multithread.', correct: true, consequence: 'O modelo mais simples, multithread e só com tipos simples, sem réplicas.' },
        { id: 'd', text: 'Valkey num nó só, usando sorted sets para as chaves.', correct: false, consequence: 'Sorted sets servem para rankings, não para pares chave-valor simples.' },
      ],
      explanation: [
        'O **Memcached** é o modelo mais simples: **multithread**, só com tipos simples, **sem réplicas nem backup** em clusters de nós. Quando o cache pode ser refeito a partir do banco, ele atende sem pagar por recursos sobrando.',
        'Valkey e Redis OSS trazem tipos complexos, réplicas com failover e backup, que aqui não são pedidos.',
        '**Regra prática:** "cache simples, multithread, sem réplicas" é Memcached; "alta disponibilidade", "persistência", "rankings" ou "pub/sub" é Valkey ou Redis OSS.',
      ],
    },
    {
      id: 'rv:db.f06.m2.a1:pubsub',
      kind: 'decision',
      title: 'Avisos em tempo real com cache que não pode sumir',
      prompt:
        'Um aplicativo de entregas quer usar o ElastiCache para **avisar os serviços de rastreamento por pub/sub** e guardar o status das entregas, que precisa **sobreviver à falha de um nó**, com **backup diário**. Entre as opções que atendem, a empresa quer a de **menor custo**. Qual configuração escolher?',
      concepts: [{ id: 'cache.engines' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Memcached com dois nós em AZs diferentes.', correct: false, consequence: 'O Memcached não tem pub/sub, réplicas nem backup em clusters de nós.' },
        { id: 'b', text: 'Redis OSS com uma réplica, failover automático e backup.', correct: false, consequence: 'Atende, mas o mesmo nó custa mais no Redis OSS do que no Valkey.' },
        { id: 'c', text: 'Valkey num único nó, com backup diário.', correct: false, consequence: 'Sem réplica, o status fica indisponível se o nó falhar.' },
        { id: 'd', text: 'Valkey com uma réplica, failover automático e backup.', correct: true, consequence: 'Tem pub/sub, sobrevive à falha de um nó e custa menos que o mesmo nó Redis OSS.' },
      ],
      explanation: [
        '**Pub/sub**, **réplica com failover automático** e **backup** são recursos do **Valkey** e do **Redis OSS**. Os dois atendem aos requisitos, mas, na tabela de preços, o nó Valkey custa menos que o mesmo nó Redis OSS. Com uma réplica em outra AZ, o status das entregas continua disponível se o nó principal falhar.',
        'O Memcached não tem nenhum dos três recursos. Um nó só, sem réplica, não sobrevive à falha.',
        '**Regra prática:** quando Valkey e Redis OSS atendem e o critério é custo, escolha o Valkey.',
      ],
    },
    {
      id: 'rv:db.f06.dados-maiores-que-o-no',
      kind: 'decision',
      title: 'Um cache que não cabe mais num nó',
      prompt:
        'Um cache Valkey guarda os perfis de recomendação de um streaming e já ocupa **mais memória do que o maior tipo de nó** oferece, com as **gravações crescendo** junto. O cache precisa continuar **com réplicas e failover automático**. A equipe quer **escalar a memória e as gravações** sem trocar de motor. O que fazer?',
      concepts: [{ id: 'cache.engines' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Adicionar mais réplicas de leitura ao mesmo shard.', correct: false, consequence: 'Réplicas copiam os mesmos dados: não aumentam a memória total nem a capacidade de gravação.' },
        { id: 'b', text: 'Ligar o modo cluster e dividir os dados em vários shards.', correct: true, consequence: 'Cada shard guarda uma parte dos dados e recebe parte das gravações, com as próprias réplicas.' },
        { id: 'c', text: 'Trocar para o Memcached, que suporta mais memória.', correct: false, consequence: 'Troca de motor e perde réplicas e failover, que o requisito exige.' },
        { id: 'd', text: 'Aumentar o TTL dos perfis para recarregar menos vezes.', correct: false, consequence: 'Itens durando mais ocupam ainda mais memória.' },
      ],
      explanation: [
        'Com o **modo cluster**, o Valkey e o Redis OSS **dividem os dados em vários shards**. Cada shard guarda uma parte dos dados e recebe parte das gravações, e pode ter as próprias réplicas com failover. É assim que o cache passa do tamanho de um nó.',
        'Réplicas no mesmo shard só repetem os dados. O Memcached perde réplicas e failover. Um TTL maior ocupa mais memória.',
        '**Regra prática:** para crescer além de um nó em memória e gravações, divida em shards (modo cluster); para escalar leituras, some réplicas.',
      ],
    },
    {
      id: 'rv:db.f06.boss.a2',
      kind: 'decision',
      title: 'O catálogo da empresa comprada',
      prompt:
        'Uma varejista comprou uma startup cujo catálogo usa **os drivers e as ferramentas do MongoDB**, em servidores próprios. O catálogo precisa ir para um **serviço gerenciado** na AWS, com failover automático, e a equipe quer **o mínimo de mudança no código**. Para onde levá-lo?',
      concepts: [{ id: 'nosql.documentdb' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Para o Amazon DynamoDB, remodelando os documentos em itens.', correct: false, consequence: 'Funciona com uma reescrita do acesso a dados, o oposto do mínimo de mudança.' },
        { id: 'b', text: 'Para o Amazon DocumentDB, mantendo os drivers do MongoDB.', correct: true, consequence: 'O catálogo migra com poucas mudanças, e o serviço cuida das réplicas e do failover.' },
        { id: 'c', text: 'Para o Amazon Keyspaces, que guarda documentos sem servidor.', correct: false, consequence: 'O Keyspaces é compatível com o Cassandra, não com o MongoDB.' },
        { id: 'd', text: 'Para o MongoDB em instâncias EC2, em três AZs.', correct: false, consequence: 'O código não muda, mas a equipe continua cuidando dos servidores; não é um serviço gerenciado.' },
      ],
      explanation: [
        'O **DocumentDB** é um banco de documentos JSON gerenciado, **compatível com a API do MongoDB**: a aplicação mantém drivers e ferramentas. Como o Aurora, ele guarda seis cópias em três AZs e aceita até 15 réplicas com failover automático.',
        'O DynamoDB exige remodelar o acesso. O Keyspaces é para Cassandra. O MongoDB no EC2 mantém a operação com a equipe.',
        '**Regra prática:** "migrar uma aplicação MongoDB para um serviço gerenciado com o mínimo de mudanças" é DocumentDB.',
      ],
    },
    {
      id: 'rv:db.f06.m3.a2',
      kind: 'decision',
      title: 'Autores, artigos e temas ligados entre si',
      prompt:
        'Uma editora científica mantém um **grafo de conhecimento** que liga autores, artigos, instituições e temas. Os dados estão no formato **RDF**, e os pesquisadores escrevem as consultas em **SPARQL**. A editora quer levar tudo para um **banco gerenciado**, sem reescrever as consultas. Qual serviço atende?',
      concepts: [{ id: 'nosql.neptune' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Aurora PostgreSQL, com uma tabela por tipo de ligação.', correct: false, consequence: 'As consultas em SPARQL teriam de virar SQL com junções sucessivas.' },
        { id: 'b', text: 'Amazon DocumentDB, com um documento por autor e seus artigos.', correct: false, consequence: 'O DocumentDB guarda documentos e não executa SPARQL.' },
        { id: 'c', text: 'Amazon DynamoDB, com índices globais para cada ligação.', correct: false, consequence: 'Índices não percorrem relações em vários níveis, e o SPARQL não roda no DynamoDB.' },
        { id: 'd', text: 'Amazon Neptune, com os dados RDF e as consultas em SPARQL.', correct: true, consequence: 'O Neptune é um banco de grafos gerenciado que aceita SPARQL, Gremlin e openCypher.' },
      ],
      explanation: [
        'O **Neptune** é o banco de grafos gerenciado da AWS, para dados muito conectados, como **grafos de conhecimento**, recomendações e detecção de fraude. Ele aceita **SPARQL**, Gremlin e openCypher, então as consultas continuam as mesmas.',
        'Um banco relacional precisaria de junções sucessivas. DocumentDB e DynamoDB não percorrem relações nem executam SPARQL.',
        '**Regra prática:** "dados muito conectados", "grafo de conhecimento" ou as linguagens SPARQL, Gremlin e openCypher apontam para o Neptune.',
      ],
    },
    {
      id: 'rv:db.f06.m3.a3',
      kind: 'decision',
      title: 'Sensores gravando num Cassandra próprio',
      prompt:
        'Uma empresa de energia grava leituras de sensores num cluster **Apache Cassandra** em instâncias EC2, com o código em **CQL**. O tráfego varia muito ao longo do dia, e a equipe gasta horas por semana administrando os nós. A empresa quer **parar de administrar nós** e **pagar pelo uso**, **sem reescrever o código**. Qual solução atende?',
      concepts: [{ id: 'nosql.keyspaces' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Amazon Keyspaces, com o mesmo código CQL.', correct: true, consequence: 'O código continua o mesmo, não há nós para administrar e a cobrança acompanha o uso.' },
        { id: 'b', text: 'O Cassandra em instâncias EC2 Spot, mais baratas.', correct: false, consequence: 'Barateia as instâncias, mas a equipe continua administrando os nós, que ainda podem ser interrompidos.' },
        { id: 'c', text: 'Amazon DocumentDB, compatível com o código atual.', correct: false, consequence: 'O DocumentDB é compatível com o MongoDB, não com o Cassandra.' },
        { id: 'd', text: 'Amazon DynamoDB, reescrevendo o acesso aos dados.', correct: false, consequence: 'Atende o sem servidor, mas exige reescrever o código, o que foi descartado.' },
      ],
      explanation: [
        'O **Keyspaces** é compatível com o **Apache Cassandra** e **sem servidor**: roda o mesmo código CQL e as mesmas ferramentas, sem nós para administrar, e escala as tabelas com o tráfego, com modos sob demanda e provisionado.',
        'Instâncias Spot mantêm a administração dos nós. O DocumentDB é para MongoDB. O DynamoDB exige reescrever.',
        '**Regra prática:** "migrar uma aplicação Cassandra para um serviço sem servidor, sem reescrever o código" é o Keyspaces.',
      ],
    },
  ],
}
