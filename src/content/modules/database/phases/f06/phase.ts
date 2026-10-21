/**
 * Fase 6 — Cache e bancos especializados. ElastiCache (motores e estratégias)
 * e os bancos para documentos, grafos e cargas compatíveis com Cassandra.
 */
import type { PhaseDef } from '../../../../../engine/types'
import { META } from '../meta'

const YES_NO = [
  { id: 'yes', text: 'Sim', outcome: 'yes' },
  { id: 'no', text: 'Não', outcome: 'no' },
]

const catalog = { readsPerSec: 20000, writesPerSec: 5, hotKeys: 50000, totalKeys: 2000000, itemKB: 4 }

export const F06_DB: PhaseDef = {
  ...META.f06,
  concepts: ['cache.why', 'cache.strategies', 'cache.engines', 'nosql.documentdb', 'nosql.neptune', 'nosql.keyspaces'],
  availability: 'available',
  simplifications: [
    'O cache é avaliado com latências fixas do cenário (0,5 ms no cache e 8 ms no banco) e uma taxa de acerto calculada pelo TTL.',
    'DocumentDB, Neptune e Keyspaces aparecem pelo tipo de dado e de acesso que pedem; tamanhos e preços ficam de fora.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'db.f06.m1',
      title: 'Cache na frente do banco',
      type: 'mission',
      summary: 'Leitura sob demanda, escrita direta e TTL.',
      briefing: {
        company: 'Feira Livre',
        role: 'Você cuida da arquitetura de um marketplace de produtores rurais.',
        situation: 'O catálogo tem 2 milhões de produtos, mas 50 mil concentram quase todas as visitas. O Aurora chega a 90% de CPU só respondendo as mesmas consultas, e a equipe quer um cache sem mostrar preços velhos por muito tempo.',
        objective: 'Escolher a estratégia de cache e o TTL pelo que cada dado pode tolerar.',
        successCriteria: ['Prever quando o cache mostra dados desatualizados', 'Calcular se o banco aguenta o que sobra', 'Escolher entre leitura sob demanda e escrita direta'],
      },
      intel: [
        { conceptId: 'cache.why', body: ['O **ElastiCache** responde as leituras repetidas em microssegundos e tira carga do banco. Funciona com **Valkey, Redis OSS ou Memcached**, em nós que você escolhe ou no modo serverless.'] },
        { conceptId: 'cache.strategies', body: ['**Leitura sob demanda**: guarda só o que foi pedido; pode ficar desatualizado. **Escrita direta**: atualiza o cache a cada gravação; nunca fica desatualizado, mas guarda dados que ninguém lê. O **TTL** limita o tempo de cada dado no cache.'] },
      ],
      activities: [
        {
          id: 'db.f06.m1.a1',
          kind: 'predict',
          title: 'Preço sem TTL',
          prompt: 'A equipe liga um cache de **leitura sob demanda**, **sem TTL**, para o catálogo. Um produtor muda o preço de um tomate no banco. Algum cliente pode ver o preço antigo?',
          concepts: [{ id: 'cache.strategies' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Na leitura sob demanda, o cache não fica sabendo das mudanças no banco. Sem TTL, o preço antigo continua no cache até ser removido por falta de memória.'],
          spec: { sim: 'cache', load: catalog, config: { strategy: 'lazy', ttlSec: 0, engine: 'valkey', node: 'cache.t4g.small', replicas: 0 }, query: 'stale' },
          options: YES_NO,
        },
        {
          id: 'db.f06.m1.a2',
          kind: 'predict',
          title: 'Com TTL de 5 minutos',
          prompt: 'Com **leitura sob demanda** e **TTL de 300 s**, as 20.000 leituras por segundo do catálogo se espalham por 50 mil produtos. As leituras que ainda chegam ao Aurora cabem nas **2.000 por segundo** que ele aguenta com folga?',
          concepts: [{ id: 'cache.strategies' }, { id: 'cache.why', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['Cada produto é lido 0,4 vez por segundo: em 300 s, 120 leituras, das quais só a primeira vai ao banco. Menos de 1% das leituras chega ao Aurora.'],
          spec: { sim: 'cache', load: catalog, config: { strategy: 'lazy', ttlSec: 300, engine: 'valkey', node: 'cache.t4g.small', replicas: 0 }, query: 'db-ok', maxDbReads: 2000 },
          options: YES_NO,
        },
        {
          id: 'db.f06.m1.a3',
          kind: 'classify',
          title: 'Sob demanda ou escrita direta',
          prompt: 'Para cada característica, indique a estratégia que ela descreve.',
          concepts: [{ id: 'cache.strategies' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Leitura sob demanda: guarda só o pedido, aguenta a perda de um nó e paga três idas a cada falta, com risco de dado velho. Escrita direta: dado sempre atual e escrita mais lenta, com memória gasta em dados que ninguém lê.'],
          bins: [
            { id: 'lazy', label: 'Leitura sob demanda' },
            { id: 'wt', label: 'Escrita direta' },
          ],
          items: [
            { id: 'only', text: 'Guarda só o que foi pedido', bin: 'lazy', explanation: 'O item entra no cache depois de uma falta.', concepts: ['cache.strategies'] },
            { id: 'trips', text: 'Cada falta custa três idas: cache, banco e gravar no cache', bin: 'lazy', explanation: 'É a penalidade da falta.', concepts: ['cache.strategies'] },
            { id: 'fresh', text: 'O dado no cache nunca fica desatualizado', bin: 'wt', explanation: 'Cada gravação atualiza o cache.', concepts: ['cache.strategies'] },
            { id: 'churn', text: 'Ocupa memória com dados que ninguém vai ler', bin: 'wt', explanation: 'Tudo o que é gravado entra no cache; o TTL ajuda a limitar.', concepts: ['cache.strategies'] },
            { id: 'node', text: 'Se um nó for substituído, a aplicação continua funcionando, só mais lenta', bin: 'lazy', explanation: 'O cache vai se refazendo a cada falta.', concepts: ['cache.strategies'] },
          ],
        },
        {
          id: 'db.f06.m1.a4',
          kind: 'decision',
          title: 'Cache ou banco maior',
          prompt: 'O financeiro sugere dobrar a classe do Aurora para aguentar as consultas do catálogo, que são sempre as mesmas. O que propor?',
          concepts: [{ id: 'cache.why' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Leituras repetidas são o caso clássico de cache: um nó pequeno do ElastiCache responde em microssegundos e tira quase toda a carga do banco, por uma fração do custo de dobrar a classe.'],
          options: [
            { id: 'a', text: 'Um ElastiCache na frente do Aurora para as consultas repetidas', correct: true, consequence: 'O Aurora volta a ter folga, e o catálogo fica mais rápido.' },
            { id: 'b', text: 'Dobrar a classe do Aurora', correct: false, consequence: 'Paga o dobro para continuar respondendo as mesmas consultas.' },
            { id: 'c', text: 'Migrar o catálogo para o Redshift', correct: false, consequence: 'O Redshift é para análise, não para servir páginas de produto.' },
          ],
        },
      ],
      debrief: { takeaways: ['Leituras repetidas pedem cache, não um banco maior.', 'Leitura sob demanda sem TTL pode mostrar dado velho por muito tempo.', 'Escrita direta mantém o cache atual; TTL controla a memória.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'db.f06.m2',
      title: 'Qual motor de cache',
      type: 'mission',
      summary: 'Valkey e Redis OSS ou Memcached.',
      briefing: {
        company: 'Feira Livre',
        role: 'Você continua na arquitetura da Feira Livre.',
        situation: 'Além do catálogo, a Feira Livre quer um ranking dos produtores mais bem avaliados, atualizado a cada avaliação, e um cache de páginas renderizadas em nós grandes. O cache do ranking não pode sumir se um nó cair.',
        objective: 'Escolher o motor de cada cache pelos recursos que ele oferece.',
        successCriteria: ['Saber o que só Valkey e Redis OSS oferecem', 'Saber quando o Memcached é a escolha', 'Proteger o cache contra a falha de um nó'],
      },
      intel: [
        { conceptId: 'cache.engines', body: ['**Memcached**: simples, **multithread**, sem réplicas. **Valkey e Redis OSS**: **sorted sets**, pub/sub, **réplicas com failover** e backup. Na tabela de preços, o Valkey sai mais barato que o Redis OSS no mesmo nó.'] },
      ],
      activities: [
        {
          id: 'db.f06.m2.a1',
          kind: 'classify',
          title: 'O que cada motor oferece',
          prompt: 'Indique o motor que oferece cada recurso.',
          concepts: [{ id: 'cache.engines' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Valkey e Redis OSS têm tipos complexos, pub/sub, réplicas com failover e backup. O Memcached é multithread e simples.'],
          bins: [
            { id: 'valkey', label: 'Valkey ou Redis OSS' },
            { id: 'memcached', label: 'Memcached' },
          ],
          items: [
            { id: 'sorted', text: 'Sorted sets para rankings', bin: 'valkey', explanation: 'O Memcached só tem tipos simples.', concepts: ['cache.engines'] },
            { id: 'replica', text: 'Réplica com failover automático', bin: 'valkey', explanation: 'O Memcached não replica.', concepts: ['cache.engines'] },
            { id: 'thread', text: 'Usar todos os núcleos de um nó grande (multithread)', bin: 'memcached', explanation: 'Valkey e Redis OSS rodam os comandos numa única thread.', concepts: ['cache.engines'] },
            { id: 'pubsub', text: 'Pub/sub para avisar outros serviços', bin: 'valkey', explanation: 'Recurso do Valkey e do Redis OSS.', concepts: ['cache.engines'] },
            { id: 'backup', text: 'Backup e restauração num cluster de nós', bin: 'valkey', explanation: 'No Memcached em nós, não há backup.', concepts: ['cache.engines'] },
          ],
        },
        {
          id: 'db.f06.m2.a2',
          kind: 'decision',
          title: 'O ranking dos produtores',
          prompt: 'O ranking dos produtores precisa ser atualizado a cada avaliação e lido milhares de vezes por segundo, e não pode sumir se um nó cair. Qual configuração?',
          concepts: [{ id: 'cache.engines' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Sorted sets do Valkey (ou do Redis OSS) mantêm o ranking ordenado no próprio cache. Uma réplica em outra AZ com failover automático evita perder o ranking se um nó cair.'],
          options: [
            { id: 'a', text: 'Valkey com sorted sets e uma réplica com failover automático', correct: true, consequence: 'O ranking fica ordenado no cache e sobrevive à falha de um nó.' },
            { id: 'b', text: 'Memcached com um nó grande', correct: false, consequence: 'Sem sorted sets e sem réplica: o ranking precisaria ser calculado na aplicação e sumiria com o nó.' },
            { id: 'c', text: 'Valkey num único nó, sem réplica', correct: false, consequence: 'O ranking some se o nó cair.' },
          ],
        },
      ],
      debrief: { takeaways: ['Rankings, pub/sub e réplicas: Valkey ou Redis OSS.', 'Objetos simples em nós grandes multithread: Memcached.', 'Cache que não pode sumir pede réplica com failover.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'db.f06.m3',
      title: 'Um banco para cada forma de dado',
      type: 'mission',
      summary: 'DocumentDB, Neptune e Keyspaces.',
      briefing: {
        company: 'Feira Livre',
        role: 'Você continua na arquitetura da Feira Livre.',
        situation: 'A Feira Livre comprou três startups: uma com o catálogo em MongoDB, outra com recomendações do tipo "quem comprou isto também comprou aquilo" e outra com sensores de estufa gravando num cluster Cassandra. Todas rodam em servidores próprios.',
        objective: 'Levar cada sistema para o banco gerenciado que fala a mesma língua.',
        successCriteria: ['Reconhecer o banco de documentos compatível com MongoDB', 'Reconhecer o banco de grafos', 'Reconhecer o banco compatível com Cassandra'],
      },
      intel: [
        { conceptId: 'nosql.documentdb', body: ['**DocumentDB**: documentos JSON, **compatível com a API do MongoDB**, seis cópias em três AZs e até 15 réplicas.'] },
        { conceptId: 'nosql.neptune', body: ['**Neptune**: banco de **grafos** para dados muito conectados, com **Gremlin, openCypher e SPARQL**.'] },
        { conceptId: 'nosql.keyspaces', body: ['**Keyspaces**: **compatível com o Apache Cassandra** (CQL), sem servidor, cobrando pelo uso.'] },
      ],
      activities: [
        {
          id: 'db.f06.m3.a1',
          kind: 'match',
          title: 'Cada startup no seu banco',
          prompt: 'Associe cada sistema ao banco gerenciado mais adequado.',
          concepts: [{ id: 'nosql.documentdb' }, { id: 'nosql.neptune' }, { id: 'nosql.keyspaces' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Cada banco especializado fala a língua de um tipo de sistema: MongoDB vai para o DocumentDB, grafos para o Neptune e Cassandra para o Keyspaces.'],
          leftLabel: 'Sistema',
          rightLabel: 'Banco gerenciado',
          pairs: [
            { id: 'mongo', left: 'Catálogo que usa os drivers do MongoDB', right: 'Amazon DocumentDB', explanation: 'Compatível com a API do MongoDB.', concepts: ['nosql.documentdb'] },
            { id: 'graph', left: 'Recomendações "quem comprou isto também comprou aquilo"', right: 'Amazon Neptune', explanation: 'Relações muito conectadas são um grafo.', concepts: ['nosql.neptune'] },
            { id: 'cassandra', left: 'Sensores gravando num cluster Cassandra com CQL', right: 'Amazon Keyspaces', explanation: 'Compatível com o Cassandra, sem administrar nós.', concepts: ['nosql.keyspaces'] },
          ],
        },
        {
          id: 'db.f06.m3.a2',
          kind: 'decision',
          title: 'Fraude entre contas',
          prompt: 'O time antifraude quer descobrir contas ligadas entre si por cartões, endereços e aparelhos em comum, até cinco níveis de distância. No banco relacional, a consulta leva minutos. O que usar?',
          concepts: [{ id: 'nosql.neptune' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Percorrer relações em vários níveis é o caso dos bancos de grafos: o Neptune guarda as ligações e as percorre com Gremlin ou openCypher, sem junções sucessivas.'],
          options: [
            { id: 'a', text: 'Amazon Neptune, com as contas e as ligações num grafo', correct: true, consequence: 'A busca por contas ligadas passa a ser uma consulta de grafo.' },
            { id: 'b', text: 'Mais réplicas de leitura no banco relacional', correct: false, consequence: 'Distribui a mesma consulta lenta por mais instâncias.' },
            { id: 'c', text: 'DynamoDB com um índice global por cartão', correct: false, consequence: 'Acha contas com o mesmo cartão, mas não percorre vários níveis de ligação.' },
          ],
        },
        {
          id: 'db.f06.m3.a3',
          kind: 'decision',
          title: 'Sair dos servidores do Cassandra',
          prompt: 'A startup dos sensores quer parar de administrar os nós do Cassandra, sem reescrever o código, que usa CQL. O que atende?',
          concepts: [{ id: 'nosql.keyspaces' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O Keyspaces é compatível com o Cassandra e sem servidor: o mesmo código e as mesmas ferramentas continuam funcionando, sem nós para administrar.'],
          options: [
            { id: 'a', text: 'Amazon Keyspaces', correct: true, consequence: 'O código CQL continua o mesmo, e os nós deixam de existir para a equipe.' },
            { id: 'b', text: 'Amazon DocumentDB', correct: false, consequence: 'O DocumentDB é compatível com MongoDB, não com Cassandra.' },
            { id: 'c', text: 'Cassandra em instâncias EC2 maiores', correct: false, consequence: 'A equipe continuaria administrando os nós.' },
          ],
        },
      ],
      debrief: { takeaways: ['MongoDB: DocumentDB. Grafos: Neptune. Cassandra: Keyspaces.', 'Relações em vários níveis pedem um banco de grafos.', 'Compatibilidade de API evita reescrever a aplicação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'db.f06.boss',
      title: 'Quatro caches, um orçamento',
      type: 'boss',
      summary: 'Estratégia, TTL, motor e nó de cada cache, pelo menor custo.',
      briefing: {
        company: 'Feira Livre',
        role: 'Você apresenta o desenho dos caches para a diretoria.',
        situation: 'Quatro caches, quatro exigências: o catálogo tolera 5 minutos de preço velho, o saldo de créditos nunca pode aparecer desatualizado, o ranking precisa de sorted sets e réplica, e as páginas renderizadas pedem nós multithread.',
        objective: 'Montar cada cache com o menor custo que atende.',
        successCriteria: ['Proteger o banco e cumprir a latência', 'Respeitar o quanto cada dado pode ficar desatualizado', 'Escolher o motor e o menor nó que comporta os dados'],
      },
      intel: [
        { conceptId: 'cache.strategies', body: ['Nada pode ficar desatualizado: escrita direta. Com escrita direta sem TTL, tudo o que é gravado vai para o cache: o TTL reduz a memória.'] },
        { conceptId: 'cache.engines', body: ['Sorted sets e réplica: Valkey ou Redis OSS. Multithread: Memcached.'] },
      ],
      activities: [
        {
          id: 'db.f06.boss.a1',
          kind: 'lab',
          lab: 'cache-sim',
          title: 'Os caches da Feira Livre',
          prompt: 'Configure os quatro caches. As métricas e o custo aparecem ao vivo, com preços reais da AWS.',
          concepts: [{ id: 'cache.strategies' }, { id: 'cache.engines' }, { id: 'cache.why', weight: 0.5 }],
          xp: 140,
          difficulty: 3,
          hints: ['Comece pelo quanto cada dado pode ficar desatualizado: isso decide a estratégia.', 'Na escrita direta, compare a memória com e sem TTL antes de escolher o nó.', 'O Valkey custa menos que o Redis OSS no mesmo nó.'],
          explanation: [
            'Catálogo: leitura sob demanda com TTL de até 300 s num nó pequeno de Valkey.',
            'Créditos: escrita direta com TTL de 300 s, Valkey com réplica; sem TTL, os 5 milhões de saldos pediriam um nó bem maior.',
            'Ranking: escrita direta (nada de ranking velho), Valkey com réplica.',
            'Páginas: Memcached num nó com memória para as páginas mais vistas.',
          ],
          config: {
            scenarios: [
              {
                id: 'catalog',
                name: 'Catálogo de produtos',
                description: 'Páginas de produto lidas o tempo todo. Um preço pode aparecer antigo por até 5 minutos.',
                load: catalog,
                need: { maxDbReadsPerSec: 2000, maxStaleSec: 300, maxLatencyMs: 2, engine: [] },
                concepts: ['cache.strategies'],
              },
              {
                id: 'credits',
                name: 'Saldo de créditos',
                description: 'O saldo de créditos de cada cliente. Nunca pode aparecer desatualizado, e o cache não pode sumir se um nó cair.',
                load: { readsPerSec: 8000, writesPerSec: 400, hotKeys: 100000, totalKeys: 5000000, itemKB: 1 },
                need: { maxDbReadsPerSec: 1000, maxStaleSec: 0, maxLatencyMs: 2, engine: ['replication'] },
                concepts: ['cache.strategies', 'cache.engines'],
              },
              {
                id: 'ranking',
                name: 'Ranking dos produtores',
                description: 'Atualizado a cada avaliação, com sorted sets. Não pode mostrar ranking velho nem sumir se um nó cair.',
                load: { readsPerSec: 5000, writesPerSec: 1000, hotKeys: 10000, totalKeys: 10000, itemKB: 0.5 },
                need: { maxDbReadsPerSec: 500, maxStaleSec: 0, maxLatencyMs: 2, engine: ['complex-types', 'replication'] },
                concepts: ['cache.engines'],
              },
              {
                id: 'pages',
                name: 'Páginas renderizadas',
                description: 'HTML das páginas mais vistas, que não mudam. Cache simples em nós grandes, que usem todos os núcleos.',
                load: { readsPerSec: 30000, writesPerSec: 0, hotKeys: 200000, totalKeys: 200000, itemKB: 20 },
                need: { maxDbReadsPerSec: 3000, maxStaleSec: 3600, maxLatencyMs: 2, engine: ['multithread'] },
                concepts: ['cache.engines'],
              },
            ],
          },
        },
        {
          id: 'db.f06.boss.a2',
          kind: 'decision',
          title: 'A startup do MongoDB',
          prompt: 'Depois dos caches, a diretoria pergunta: o catálogo da startup comprada usa os drivers do MongoDB e precisa sair dos servidores próprios com o mínimo de mudança no código. Para onde ele vai?',
          concepts: [{ id: 'nosql.documentdb' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O DocumentDB é compatível com a API do MongoDB: o catálogo migra mantendo os drivers e a maior parte do código.'],
          options: [
            { id: 'a', text: 'Amazon DocumentDB', correct: true, consequence: 'O catálogo migra mantendo os drivers do MongoDB.' },
            { id: 'b', text: 'Amazon Neptune', correct: false, consequence: 'O Neptune é um banco de grafos.' },
            { id: 'c', text: 'Amazon ElastiCache', correct: false, consequence: 'Um cache não substitui o banco do catálogo.' },
          ],
        },
      ],
      debrief: { takeaways: ['O quanto um dado pode ficar velho decide a estratégia de cache.', 'TTL na escrita direta reduz a memória e o nó.', 'O motor sai dos recursos pedidos: sorted sets e réplica, ou multithread.'] },
    },
  ],
}
