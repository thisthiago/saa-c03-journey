/**
 * Tabela de preços da trilha Bancos de dados na AWS (gerada por
 * scripts/fetch-database-prices.mjs a partir da AWS Price List).
 *
 * RDS for PostgreSQL e Aurora PostgreSQL sob demanda; DynamoDB, ElastiCache e
 * Redshift na primeira faixa paga. Sem nível gratuito, impostos nem
 * transferência de dados.
 */
import table from '../content/pricing/database-prices.json'

export type CacheEngine = 'valkey' | 'redis' | 'memcached'

export interface DbClassPrice {
  vcpu: number
  memoryGiB: number
}

export interface DatabaseRegionPrices {
  label: string
  offers: Record<string, string>
  rds: {
    engine: string
    instances: Record<string, DbClassPrice & { singleAzHour: number; multiAzHour: number }>
    storage: {
      gp3: { singleAzGBMonth: number; multiAzGBMonth: number; singleAzIopsMonth: number; multiAzIopsMonth: number; singleAzThroughputMiBpsMonth: number; multiAzThroughputMiBpsMonth: number }
      io2: { singleAzGBMonth: number; multiAzGBMonth: number; singleAzIopsMonth: number; multiAzIopsMonth: number }
    }
    /** Backup acima do espaço gratuito (igual ao armazenamento provisionado). */
    backupGBMonth: number
    /** RDS Proxy, por vCPU da instância associada. */
    proxyVcpuHour: number
  }
  aurora: {
    engine: string
    instances: Record<string, DbClassPrice & { standardHour: number; ioOptimizedHour: number }>
    standard: { storageGBMonth: number; ioPerMillion: number; serverlessV2AcuHour: number }
    ioOptimized: { storageGBMonth: number; ioPerMillion: number; serverlessV2AcuHour: number }
    backupGBMonth: number
  }
  dynamodb: {
    onDemand: { readPerMillion: number; writePerMillion: number; replicatedWritePerMillion: number }
    provisioned: { rcuHour: number; wcuHour: number; replicatedWcuHour: number }
    storageGBMonth: number
    pitrGBMonth: number
    backupGBMonth: number
  }
  elasticache: { nodes: Record<string, DbClassPrice & { hour: Record<CacheEngine, number> }> }
  redshift: {
    nodes: Record<string, { hour: number }>
    managedStorageGBMonth: number
    serverlessRpuHour: number
    spectrumPerTB: number
  }
  sourceUrls: string[]
}

export interface DatabasePriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, DatabaseRegionPrices>
}

export const DATABASE_PRICES = table as unknown as DatabasePriceTable

export const DATABASE_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const DB_PRICE_DATE = DATABASE_PRICES.retrievedAt.split('-').reverse().join('/')

export function databasePrices(region: string = DATABASE_REGION): DatabaseRegionPrices {
  const r = DATABASE_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de bancos de dados: ${region}`)
  return r
}

export const RDS_CLASSES = Object.keys(databasePrices().rds.instances)
export const AURORA_CLASSES = Object.keys(databasePrices().aurora.instances)
export const CACHE_NODES = Object.keys(databasePrices().elasticache.nodes)
