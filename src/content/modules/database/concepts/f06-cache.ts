/**
 * Conceitos da Fase 6 — Cache e bancos especializados.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_DB_CONCEPTS: ConceptDef[] = [
  {
    id: 'cache.why',
    title: 'Cache na frente do banco',
    officialName: 'Amazon ElastiCache',
    serviceIds: ['aws.elasticache'],
    summary: 'O **ElastiCache** é um armazenamento em memória gerenciado, com **Valkey, Redis OSS ou Memcached**. Na frente de um banco, ele responde as leituras repetidas em microssegundos e tira carga do banco. Também guarda sessões de usuário e rankings.',
    facts: [
      'Há duas formas: ElastiCache Serverless, que acompanha a carga sozinho, e clusters em nós, em que você escolhe o tipo e a quantidade de nós.',
      'Num cluster em nós, a AWS cuida de hardware, patches e substituição de nós.',
    ],
    commonMistakes: ['Aumentar a classe do banco para aguentar leituras repetidas que um cache resolveria'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.cacheWhat, R.cacheValkey],
    tags: ['desempenho'],
  },
  {
    id: 'cache.engines',
    title: 'Valkey, Redis OSS ou Memcached',
    officialName: 'Comparing Valkey, Memcached, and Redis OSS',
    serviceIds: ['aws.elasticache'],
    summary: '**Memcached**: o modelo mais simples, **multithread**, só tipos simples, **sem réplicas** nem backup em clusters de nós. **Valkey e Redis OSS**: tipos complexos (listas, hashes, **sorted sets**), **pub/sub**, **réplicas com failover automático** e **backup**.',
    facts: ['Rankings em tempo real usam sorted sets do Valkey ou do Redis OSS.', 'Com o modo cluster, Valkey e Redis OSS dividem os dados em vários shards.', 'Na tabela de preços, o nó Valkey custa menos que o mesmo nó Redis OSS.'],
    commonMistakes: ['Escolher Memcached quando o cache precisa sobreviver à falha de um nó com réplica'],
    exam: { domains: ['d2', 'd3'], relevance: 'alta' },
    references: [R.cacheEngines],
    tags: ['desempenho'],
  },
  {
    id: 'cache.strategies',
    title: 'Estratégias de cache',
    officialName: 'Caching strategies: lazy loading, write-through and TTL',
    serviceIds: ['aws.elasticache'],
    summary: '**Leitura sob demanda** (lazy loading): o cache só guarda o que foi pedido; cada falta custa três idas e o dado pode ficar **desatualizado**. **Escrita direta** (write-through): cada gravação atualiza também o cache, que **nunca fica desatualizado**, mas guarda dados que ninguém lê. O **TTL** limita quanto tempo um dado fica no cache.',
    facts: ['Lazy loading aguenta a perda de um nó: o cache vai se refazendo, com mais latência.', 'Write-through com TTL reduz a memória ocupada por dados nunca lidos.', 'Combinar as duas estratégias com TTL equilibra frescor e memória.'],
    commonMistakes: ['Usar lazy loading sem TTL para dados que mudam e não podem ficar velhos'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.cacheStrategies],
    tags: ['desempenho'],
  },
  {
    id: 'nosql.documentdb',
    title: 'Amazon DocumentDB',
    officialName: 'Amazon DocumentDB (with MongoDB compatibility)',
    serviceIds: ['aws.documentdb'],
    summary: 'Banco de **documentos JSON** gerenciado, **compatível com a API do MongoDB**: aplicações que usam os drivers e ferramentas do MongoDB migram com poucas mudanças. Como o Aurora, guarda **seis cópias em três AZs** e aceita até **15 réplicas**, com failover automático.',
    commonMistakes: ['Reescrever uma aplicação MongoDB para o DynamoDB quando a meta é só sair de servidores próprios'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.docdbWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'nosql.neptune',
    title: 'Amazon Neptune',
    officialName: 'Amazon Neptune',
    serviceIds: ['aws.neptune'],
    summary: 'Banco de **grafos** gerenciado, para dados **muito conectados**: recomendações, detecção de fraude, grafos de conhecimento e segurança de rede. Aceita as linguagens **Gremlin**, **openCypher** e **SPARQL** e até **15 réplicas** de leitura.',
    commonMistakes: ['Modelar "amigos de amigos de amigos" com junções sucessivas num banco relacional'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.neptuneWhat],
    tags: ['fundamentos'],
  },
  {
    id: 'nosql.keyspaces',
    title: 'Amazon Keyspaces',
    officialName: 'Amazon Keyspaces (for Apache Cassandra)',
    serviceIds: ['aws.keyspaces'],
    summary: 'Banco **compatível com o Apache Cassandra**, **sem servidor**: roda o mesmo código e as mesmas ferramentas (CQL) da aplicação Cassandra, sem administrar nós, e escala as tabelas com o tráfego, cobrando pelo uso.',
    facts: ['Oferece modos de capacidade sob demanda e provisionado.'],
    commonMistakes: ['Manter um cluster Cassandra em instâncias EC2 só para não mudar o código da aplicação'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.keyspacesWhat, R.keyspacesCapacity],
    tags: ['fundamentos'],
  },
]
