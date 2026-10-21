/**
 * Escolha do banco de dados: qual serviço (ou recurso) atende aos requisitos de
 * cada carga com o menor esforço de operação e custo.
 *
 * Fatos conferidos em 21/10/2026:
 * - RDS (seis motores, Multi-AZ): https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html
 * - Aurora (volume em três AZs, até 15 réplicas que assumem a escrita): https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html
 * - Aurora serverless (capacidade em ACUs que sobe e desce com a carga): https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html
 * - Aurora Global Database (até 10 Regiões secundárias, replicação em geral abaixo de 1 s): https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html
 * - DynamoDB (chave-valor e documentos, sem servidor, milissegundos em qualquer escala): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
 * - DynamoDB Streams (24 horas, em ordem por item): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html
 * - TTL (apaga sem consumir escrita): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
 * - DAX (microssegundos, leituras eventuais): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.html
 * - Tabelas globais (todas as réplicas gravam): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GlobalTables.html
 * - PITR (até 35 dias, por segundo): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Point-in-time-recovery.html
 * - Transações (até 100 ações, tudo ou nada): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transaction-apis.html
 * - Exportação para o S3 (sem consumir RCU): https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataExport.HowItWorks.html
 * - ElastiCache (Valkey, Redis OSS e Memcached; sorted sets para rankings): https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/SelectEngine.html
 * - DocumentDB (compatível com MongoDB): https://docs.aws.amazon.com/documentdb/latest/developerguide/what-is.html
 * - Neptune (grafos: Gremlin, openCypher e SPARQL): https://docs.aws.amazon.com/neptune/latest/userguide/intro.html
 * - Keyspaces (compatível com Cassandra, sem servidor): https://docs.aws.amazon.com/keyspaces/latest/devguide/what-is-keyspaces.html
 * - Redshift (data warehouse; Serverless cobra só quando roda): https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html
 * - Redshift Spectrum (consulta arquivos no S3 sem carregar): https://docs.aws.amazon.com/redshift/latest/dg/c-using-spectrum.html
 * - Integrações zero-ETL (Aurora, RDS e DynamoDB para o Redshift): https://docs.aws.amazon.com/redshift/latest/mgmt/zero-etl-using.html
 *
 * A "complexidade relativa" é julgamento de arquitetura do AWS Quest (esforço de
 * operação e custo), usada só para desempatar opções que atendem aos mesmos requisitos.
 */

export type DbOption =
  | 'rds'
  | 'rds-multi-az'
  | 'aurora'
  | 'aurora-serverless'
  | 'aurora-global'
  | 'dynamodb'
  | 'ddb-streams'
  | 'ddb-ttl'
  | 'dax'
  | 'ddb-global-tables'
  | 'ddb-pitr'
  | 'ddb-transactions'
  | 'ddb-export'
  | 'elasticache'
  | 'documentdb'
  | 'neptune'
  | 'keyspaces'
  | 'redshift'
  | 'redshift-serverless'
  | 'redshift-spectrum'
  | 'rds-read-replica'
  | 'zero-etl'

export type DbChoiceNeed =
  | 'relational'
  | 'commercial-engine'
  | 'survive-az'
  | 'reader-failover'
  | 'variable-capacity'
  | 'multi-region-reads'
  | 'key-value-scale'
  | 'no-servers'
  | 'react-to-changes'
  | 'expire-items'
  | 'microsecond-ddb'
  | 'multi-region-writes'
  | 'restore-to-second'
  | 'all-or-nothing'
  | 'analytics-export'
  | 'cache-relational'
  | 'leaderboard'
  | 'mongodb-compat'
  | 'graph'
  | 'cassandra-compat'
  | 'analytics-sql'
  | 'steady-heavy'
  | 'sporadic'
  | 'query-s3-in-place'
  | 'light-reports'
  | 'near-real-time-analytics'

export const DB_NEED_LABEL: Record<DbChoiceNeed, string> = {
  relational: 'SQL com junções e transações entre tabelas',
  'commercial-engine': 'motor comercial (Oracle, SQL Server ou Db2)',
  'survive-az': 'continuar no ar, sem intervenção, se uma AZ falhar',
  'reader-failover': 'várias leitoras que assumem a escrita sozinhas, em segundos, numa falha',
  'variable-capacity': 'capacidade que sobe e desce sozinha com a carga, pagando pelo uso',
  'multi-region-reads': 'leituras locais em outras Regiões, com atraso em geral abaixo de 1 segundo',
  'key-value-scale': 'acesso por chave em milissegundos, com qualquer volume',
  'no-servers': 'nenhuma instância para escolher, dimensionar ou atualizar',
  'react-to-changes': 'reagir a cada mudança de item, na ordem, quase em tempo real',
  'expire-items': 'apagar itens vencidos sozinho, sem gastar capacidade de escrita',
  'microsecond-ddb': 'leituras em microssegundos na frente do DynamoDB, sem mudar a API',
  'multi-region-writes': 'gravar em várias Regiões, com todas aceitando escritas',
  'restore-to-second': 'restaurar a tabela como estava num segundo qualquer dos últimos dias',
  'all-or-nothing': 'gravar vários itens de uma vez, tudo ou nada',
  'analytics-export': 'levar os dados para o S3, para análise, sem consumir capacidade da tabela',
  'cache-relational': 'cache em memória na frente de um banco relacional',
  leaderboard: 'rankings em tempo real, com estruturas como sorted sets',
  'mongodb-compat': 'usar a API e os drivers do MongoDB',
  graph: 'navegar relações muito conectadas (amigos de amigos, fraude, recomendações)',
  'cassandra-compat': 'usar CQL e os drivers do Apache Cassandra',
  'analytics-sql': 'consultas analíticas em SQL sobre bilhões de linhas',
  'steady-heavy': 'análises pesadas o dia inteiro, todos os dias',
  sporadic: 'análises de vez em quando, pagando só quando elas rodam',
  'query-s3-in-place': 'consultar arquivos que já estão no S3, sem carregá-los antes',
  'light-reports': 'alguns relatórios simples sobre o próprio banco de pedidos, sem pesar na escrita',
  'near-real-time-analytics': 'ver os dados do banco transacional no data warehouse quase em tempo real, sem montar um pipeline',
}

export interface DbOptionInfo {
  name: string
  summary: string
  meets: DbChoiceNeed[]
  limits: string[]
  /** 1 (mais simples e barato) a 6. Julgamento de arquitetura, só para desempate. */
  complexity: number
}

export const DB_OPTIONS: Record<DbOption, DbOptionInfo> = {
  rds: { name: 'RDS Single-AZ', summary: 'Instância gerenciada de um dos seis motores do RDS, numa única AZ.', meets: ['relational', 'commercial-engine'], limits: ['Numa falha da AZ, só volta restaurando o backup ou promovendo uma réplica.'], complexity: 1 },
  'rds-multi-az': { name: 'RDS Multi-AZ', summary: 'Instância do RDS com um standby síncrono em outra AZ e failover automático.', meets: ['relational', 'commercial-engine', 'survive-az'], limits: ['O standby não atende leituras, e o failover leva em geral de 60 a 120 s.'], complexity: 2 },
  aurora: { name: 'Amazon Aurora', summary: 'Banco compatível com MySQL e PostgreSQL, com volume em três AZs e até 15 réplicas que assumem a escrita.', meets: ['relational', 'survive-az', 'reader-failover'], limits: ['Só para MySQL e PostgreSQL; a capacidade das instâncias é fixa.'], complexity: 3 },
  'aurora-serverless': { name: 'Aurora serverless', summary: 'Aurora com capacidade em ACUs que acompanha a carga, de 0 a 256, cobrada por ACU-hora.', meets: ['relational', 'survive-az', 'reader-failover', 'variable-capacity'], limits: ['Para carga alta e constante, costuma sair mais caro que uma instância provisionada.'], complexity: 4 },
  'aurora-global': { name: 'Aurora Global Database', summary: 'Um cluster primário e até 10 secundários em outras Regiões, com replicação em geral abaixo de 1 s.', meets: ['relational', 'survive-az', 'reader-failover', 'multi-region-reads'], limits: ['Só a Região primária grava; paga instâncias e transferência em cada Região.'], complexity: 5 },
  dynamodb: { name: 'Amazon DynamoDB', summary: 'Banco NoSQL de chave-valor e documentos, sem servidor, com milissegundos em qualquer escala.', meets: ['key-value-scale', 'variable-capacity', 'survive-az', 'no-servers'], limits: ['Não faz junções entre tabelas: o acesso precisa ser desenhado pelas chaves.'], complexity: 2 },
  'ddb-streams': { name: 'DynamoDB Streams', summary: 'Registro de cada mudança de item, em ordem por item, guardado por 24 horas; aciona funções Lambda.', meets: ['react-to-changes'], limits: ['Guarda as mudanças por só 24 horas.'], complexity: 2 },
  'ddb-ttl': { name: 'TTL do DynamoDB', summary: 'Atributo com data de expiração; o DynamoDB apaga o item em geral alguns dias depois, sem consumir escrita.', meets: ['expire-items'], limits: ['A exclusão não é imediata: itens vencidos podem aparecer até serem apagados.'], complexity: 2 },
  dax: { name: 'DynamoDB Accelerator (DAX)', summary: 'Cache em memória compatível com a API do DynamoDB, com leituras eventuais em microssegundos.', meets: ['microsecond-ddb'], limits: ['Não serve para leituras fortemente consistentes nem para cargas com muitas escritas.'], complexity: 3 },
  'ddb-global-tables': { name: 'Tabelas globais do DynamoDB', summary: 'Réplicas em várias Regiões, todas aceitando leituras e escritas; conflitos resolvidos pela última escrita.', meets: ['multi-region-writes'], limits: ['Transações não valem entre Regiões.'], complexity: 3 },
  'ddb-pitr': { name: 'PITR do DynamoDB', summary: 'Backup contínuo com restauração para qualquer segundo de até 35 dias, numa tabela nova.', meets: ['restore-to-second'], limits: ['Restaura numa tabela nova, não sobre a atual.'], complexity: 2 },
  'ddb-transactions': { name: 'Transações do DynamoDB', summary: 'Até 100 ações em uma ou mais tabelas, tudo ou nada; cada item custa duas operações.', meets: ['all-or-nothing'], limits: ['Custa o dobro das operações comuns e não vale entre Regiões.'], complexity: 2 },
  'ddb-export': { name: 'Exportação para o S3', summary: 'Exporta a tabela para o S3, de qualquer momento da janela do PITR, sem consumir capacidade de leitura.', meets: ['analytics-export'], limits: ['Exige o PITR ligado.'], complexity: 2 },
  elasticache: { name: 'Amazon ElastiCache', summary: 'Cache em memória gerenciado (Valkey, Redis OSS ou Memcached), com microssegundos; sorted sets para rankings.', meets: ['cache-relational', 'leaderboard'], limits: ['A aplicação precisa decidir o que guardar no cache e quando atualizar.'], complexity: 2 },
  documentdb: { name: 'Amazon DocumentDB', summary: 'Banco de documentos JSON compatível com a API do MongoDB, com seis cópias em três AZs e até 15 réplicas.', meets: ['mongodb-compat', 'survive-az'], limits: ['Para documentos; relações muito conectadas pedem um banco de grafos.'], complexity: 3 },
  neptune: { name: 'Amazon Neptune', summary: 'Banco de grafos gerenciado, com Gremlin, openCypher e SPARQL e até 15 réplicas.', meets: ['graph', 'survive-az'], limits: ['Para grafos; não substitui um banco transacional comum.'], complexity: 3 },
  keyspaces: { name: 'Amazon Keyspaces', summary: 'Banco compatível com Apache Cassandra, sem servidor, que escala as tabelas com o tráfego.', meets: ['cassandra-compat', 'no-servers', 'variable-capacity'], limits: ['Faz sentido quando a aplicação já fala Cassandra.'], complexity: 3 },
  redshift: { name: 'Redshift provisionado', summary: 'Cluster de data warehouse em colunas, com nós que você escolhe, para análises pesadas e constantes.', meets: ['analytics-sql', 'steady-heavy'], limits: ['Paga os nós por hora, mesmo quando ninguém consulta.'], complexity: 4 },
  'redshift-serverless': { name: 'Redshift Serverless', summary: 'Data warehouse sem cluster para dimensionar, cobrado por RPU-hora só enquanto as consultas rodam.', meets: ['analytics-sql', 'sporadic'], limits: ['Para uso pesado o dia inteiro, um cluster provisionado pode sair mais barato.'], complexity: 3 },
  'redshift-spectrum': { name: 'Redshift Spectrum', summary: 'Consulta arquivos estruturados e semiestruturados no S3 a partir do Redshift, sem carregá-los em tabelas.', meets: ['analytics-sql', 'query-s3-in-place'], limits: ['Cobra por terabyte de dados lidos no S3.'], complexity: 3 },
  'rds-read-replica': { name: 'Réplica de leitura do RDS', summary: 'Cópia somente leitura do banco transacional, para tirar relatórios da primária.', meets: ['light-reports'], limits: ['Continua sendo um banco em linhas: análises sobre bilhões de linhas ficam lentas.'], complexity: 2 },
  'zero-etl': { name: 'Integração zero-ETL', summary: 'Replica dados do Aurora, do RDS ou do DynamoDB para o Redshift, sem pipeline para construir.', meets: ['analytics-sql', 'near-real-time-analytics'], limits: ['Exige um Redshift de destino e motores e versões compatíveis.'], complexity: 3 },
}

export interface DbItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: DbChoiceNeed
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: DbChoiceNeed[]
  concepts?: string[]
}

export function unmetDbNeeds(item: DbItem, opt: DbOption): DbChoiceNeed[] {
  return item.needs.filter((n) => !DB_OPTIONS[opt].meets.includes(n))
}

/** Melhor opção: atende a todos os requisitos com a menor complexidade. Lança erro se não for única. */
export function bestDbOption(item: DbItem, options: DbOption[]): DbOption {
  const ok = options.filter((o) => unmetDbNeeds(item, o).length === 0).sort((a, b) => DB_OPTIONS[a].complexity - DB_OPTIONS[b].complexity)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && DB_OPTIONS[ok[1]].complexity === DB_OPTIONS[ok[0]].complexity) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export interface DbVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message: string
}

export function judgeDbChoice(item: DbItem, pick: DbOption | undefined, options: DbOption[]): DbVerdict {
  const best = bestDbOption(item, options)
  const bestName = DB_OPTIONS[best].name
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito que decide é ${DB_NEED_LABEL[item.dominant]}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito que decide é ${DB_NEED_LABEL[item.dominant]}. ${DB_OPTIONS[best].summary}` }
  const missing = unmetDbNeeds(item, pick)
  if (missing.length === 0) return { score: 0.5, status: 'partial', message: `Funciona, mas custa ou dá mais trabalho do que o caso pede. ${DB_OPTIONS[pick].limits[0]} ${bestName} atende com menos.` }
  return { score: 0, status: 'wrong', message: `${DB_OPTIONS[pick].name} não atende: ${missing.map((n) => DB_NEED_LABEL[n]).join('; ')}. A opção adequada é ${bestName}.` }
}
