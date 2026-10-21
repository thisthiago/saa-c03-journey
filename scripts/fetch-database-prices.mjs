#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Bancos de dados na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais:
 * - AmazonRDS (CSV regional, lido em streaming): instâncias do RDS for
 *   PostgreSQL (Single-AZ e Multi-AZ), armazenamento gp3 e io2, backup,
 *   RDS Proxy e o Aurora PostgreSQL (instâncias, armazenamento, E/S e
 *   Serverless v2, nas configurações Standard e I/O-Optimized);
 * - AmazonElastiCache (CSV regional): nós sob demanda por motor;
 * - AmazonDynamoDB e AmazonRedshift (JSON regional).
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores.
 *
 * Uso: npm run prices:database
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (rds-<região>.csv, cache-<região>.csv, ddb-<região>.json e rs-<região>.json)
 * em vez de baixá-los de novo.
 */
import { createReadStream, existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

const BASE = 'https://pricing.us-east-1.amazonaws.com'
const REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'sa-east-1': 'América do Sul (São Paulo)',
}
/** Classes usadas nos laboratórios: precisam existir nas duas Regiões. */
const RDS_TYPES = ['db.t4g.micro', 'db.t4g.medium', 'db.m7g.large', 'db.m7g.xlarge', 'db.m7g.2xlarge', 'db.r7g.large', 'db.r7g.xlarge', 'db.r7g.2xlarge']
const AURORA_TYPES = ['db.t4g.medium', 'db.r7g.large', 'db.r7g.xlarge', 'db.r7g.2xlarge']
const CACHE_TYPES = ['cache.t4g.small', 'cache.t4g.medium', 'cache.m7g.large', 'cache.r7g.large', 'cache.r7g.xlarge']
const CACHE_ENGINES = { valkey: 'Valkey', redis: 'Redis', memcached: 'Memcached' }
const REDSHIFT_NODES = ['ra3.large', 'ra3.xlplus', 'ra3.4xlarge']
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/database-prices.json')

/** Prefixo regional do usagetype (ex.: "SAE1-InstanceUsage:db.r7g.large"); em us-east-1 ele costuma faltar. */
const PREFIX = { 'us-east-1': 'USE1-', 'sa-east-1': 'SAE1-' }
let prefix = ''
const baseUsage = (u = '') => (u.startsWith(prefix) ? u.slice(prefix.length) : u)
const round = (n) => Math.round(n * 1e10) / 1e10

async function getJson(path, cacheName) {
  if (CACHE && existsSync(join(CACHE, cacheName))) return JSON.parse(await readFile(join(CACHE, cacheName), 'utf8'))
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`)
  return res.json()
}

async function lines(path, cacheName) {
  if (CACHE && existsSync(join(CACHE, cacheName))) return createInterface({ input: createReadStream(join(CACHE, cacheName)), crlfDelay: Infinity })
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`)
  return createInterface({ input: Readable.fromWeb(res.body), crlfDelay: Infinity })
}

/** Uma linha de CSV com campos entre aspas (e aspas duplicadas dentro deles). */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else quoted = false
      } else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

/** Percorre um CSV da Price List e entrega como objeto cada linha que passa no filtro rápido (`hint`). */
async function readCsv(path, cacheName, hint, onRow) {
  const meta = {}
  let header
  for await (const line of await lines(path, cacheName)) {
    if (!header) {
      const cells = parseCsvLine(line)
      if (cells[0] === 'SKU') header = cells
      else meta[cells[0]] = cells[1]
      continue
    }
    if (!hint.test(line)) continue
    const cells = parseCsvLine(line)
    const row = {}
    header.forEach((h, i) => (row[h] = cells[i]))
    onRow(row)
  }
  if (!header) throw new Error(`CSV sem cabeçalho: ${path}`)
  return meta
}

/** Guarda um preço por chave e falha se a mesma chave aparecer com valores diferentes. */
function collector(label) {
  const values = new Map()
  return {
    set(key, price) {
      const prev = values.get(key)
      if (prev !== undefined && prev !== price) throw new Error(`Preço ambíguo: ${label} ${key} (${prev} e ${price})`)
      values.set(key, price)
    },
    get(key) {
      const v = values.get(key)
      if (v === undefined) throw new Error(`Preço não encontrado: ${label} ${key}`)
      return v
    },
  }
}

/** Itens do RDS e do Aurora lidos da oferta, além das instâncias. */
const USAGES = new Set([
  'RDS:GP3-Storage',
  'RDS:Multi-AZ-GP3-Storage',
  'RDS:GP3-PIOPS',
  'RDS:Multi-AZ-GP3-PIOPS',
  'RDS:GP3-Throughput',
  'RDS:Multi-AZ-GP3-Throughput',
  'RDS:PIOPS-Storage-IO2',
  'RDS:Multi-AZ-PIOPS-Storage-IO2',
  'RDS:IO2-PIOPS',
  'RDS:Multi-AZ-IO2-PIOPS',
  'RDS:ChargedBackupUsage',
  'RDS:ProxyUsage',
  'Aurora:StorageUsage',
  'Aurora:StorageIOUsage',
  'Aurora:ServerlessV2Usage',
  'Aurora:IO-OptimizedStorageUsage',
  'Aurora:ServerlessV2IOOptimizedUsage',
  'Aurora:BackupUsage',
])

async function rds(code) {
  const prices = collector(`RDS ${code}`)
  const specs = new Map()
  const hint = /PostgreSQL|"Any"/
  const meta = await readCsv(`/offers/v1.0/aws/AmazonRDS/current/${code}/index.csv`, `rds-${code}.csv`, hint, (r) => {
    if (r.TermType !== 'OnDemand' || r['Location Type'] !== 'AWS Region') return
    const usage = baseUsage(r.usageType)
    const price = Number(r.PricePerUnit)
    const engine = r['Database Engine']
    if (r['Product Family'] === 'Database Instance') {
      // O usagetype abrevia o tamanho (db.r7g.xl); a coluna "Instance Type" traz o nome completo.
      const kind = usage.split(':')[0]
      const type = r['Instance Type']
      if (engine === 'PostgreSQL' && RDS_TYPES.includes(type) && (kind === 'InstanceUsage' || kind === 'Multi-AZUsage')) {
        prices.set(`rds:${type}:${kind}`, price)
        specs.set(type, { vcpu: Number(r.vCPU), memoryGiB: Number(r.Memory.replace(/ GiB$/, '')) })
      }
      if (engine === 'Aurora PostgreSQL' && AURORA_TYPES.includes(type) && (kind === 'InstanceUsage' || kind === 'InstanceUsageIOOptimized')) {
        prices.set(`aurora:${type}:${kind}`, price)
        specs.set(type, { vcpu: Number(r.vCPU), memoryGiB: Number(r.Memory.replace(/ GiB$/, '')) })
      }
      return
    }
    // Armazenamento e demais itens: o valor da linha do PostgreSQL ou, se a oferta só tiver "Any", o genérico.
    if (!USAGES.has(usage) || r.StartingRange !== '0') return
    if (engine === 'PostgreSQL' || engine === 'Aurora PostgreSQL' || engine === 'Any') prices.set(`${engine}:${usage}`, price)
  })
  const pick = (usage, engine = 'PostgreSQL') => {
    try {
      return prices.get(`${engine}:${usage}`)
    } catch {
      return prices.get(`Any:${usage}`)
    }
  }
  const instances = Object.fromEntries(
    RDS_TYPES.map((t) => [t, { ...specs.get(t), singleAzHour: prices.get(`rds:${t}:InstanceUsage`), multiAzHour: prices.get(`rds:${t}:Multi-AZUsage`) }]),
  )
  const auroraInstances = Object.fromEntries(
    AURORA_TYPES.map((t) => [t, { ...specs.get(t), standardHour: prices.get(`aurora:${t}:InstanceUsage`), ioOptimizedHour: prices.get(`aurora:${t}:InstanceUsageIOOptimized`) }]),
  )
  return {
    publicationDate: meta['Publication Date'],
    url: `${BASE}/offers/v1.0/aws/AmazonRDS/current/${code}/index.csv`,
    rds: {
      engine: 'PostgreSQL',
      instances,
      storage: {
        gp3: {
          singleAzGBMonth: pick('RDS:GP3-Storage'),
          multiAzGBMonth: pick('RDS:Multi-AZ-GP3-Storage'),
          singleAzIopsMonth: pick('RDS:GP3-PIOPS'),
          multiAzIopsMonth: pick('RDS:Multi-AZ-GP3-PIOPS'),
          singleAzThroughputMiBpsMonth: pick('RDS:GP3-Throughput'),
          multiAzThroughputMiBpsMonth: pick('RDS:Multi-AZ-GP3-Throughput'),
        },
        io2: {
          singleAzGBMonth: pick('RDS:PIOPS-Storage-IO2'),
          multiAzGBMonth: pick('RDS:Multi-AZ-PIOPS-Storage-IO2'),
          singleAzIopsMonth: pick('RDS:IO2-PIOPS'),
          multiAzIopsMonth: pick('RDS:Multi-AZ-IO2-PIOPS'),
        },
      },
      backupGBMonth: pick('RDS:ChargedBackupUsage'),
      proxyVcpuHour: pick('RDS:ProxyUsage'),
    },
    aurora: {
      engine: 'Aurora PostgreSQL',
      instances: auroraInstances,
      standard: {
        storageGBMonth: pick('Aurora:StorageUsage', 'Aurora PostgreSQL'),
        ioPerMillion: round(pick('Aurora:StorageIOUsage', 'Aurora PostgreSQL') * 1e6),
        serverlessV2AcuHour: pick('Aurora:ServerlessV2Usage', 'Aurora PostgreSQL'),
      },
      ioOptimized: {
        storageGBMonth: pick('Aurora:IO-OptimizedStorageUsage', 'Aurora PostgreSQL'),
        ioPerMillion: 0,
        serverlessV2AcuHour: pick('Aurora:ServerlessV2IOOptimizedUsage', 'Aurora PostgreSQL'),
      },
      backupGBMonth: pick('Aurora:BackupUsage', 'Aurora PostgreSQL'),
    },
  }
}

async function elasticache(code) {
  const prices = collector(`ElastiCache ${code}`)
  const specs = new Map()
  const meta = await readCsv(`/offers/v1.0/aws/AmazonElastiCache/current/${code}/index.csv`, `cache-${code}.csv`, /NodeUsage:cache\./, (r) => {
    if (r.TermType !== 'OnDemand' || r['Product Family'] !== 'Cache Instance' || r['Location Type'] !== 'AWS Region') return
    const usage = baseUsage(r.usageType)
    const [kind, type] = usage.split(':')
    if (kind !== 'NodeUsage' || !CACHE_TYPES.includes(type)) return
    prices.set(`${type}:${r['Cache Engine']}`, Number(r.PricePerUnit))
    specs.set(type, { vcpu: Number(r.vCPU), memoryGiB: Number(r.Memory.replace(/ GiB$/, '')) })
  })
  const nodes = Object.fromEntries(
    CACHE_TYPES.map((t) => [t, { ...specs.get(t), hour: Object.fromEntries(Object.entries(CACHE_ENGINES).map(([k, name]) => [k, prices.get(`${t}:${name}`)])) }]),
  )
  return { publicationDate: meta['Publication Date'], url: `${BASE}/offers/v1.0/aws/AmazonElastiCache/current/${code}/index.csv`, nodes }
}

/** Dimensões sob demanda de uma oferta em JSON, já com o usagetype sem prefixo. */
async function jsonOffer(offer, code, cacheName) {
  const path = `/offers/v1.0/aws/${offer}/current/${code}/index.json`
  const data = await getJson(path, cacheName)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({ location: p.attributes.locationType, usage: baseUsage(p.attributes.usagetype), begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  /** Primeira faixa paga: a de menor início com preço acima de zero. */
  const pick = (label, usage) => {
    const found = dims.filter((d) => d.usage === usage && d.price > 0 && (!d.location || d.location === 'AWS Region'))
    if (found.length === 0) throw new Error(`Preço não encontrado: ${offer} ${label} (${usage})`)
    const first = Math.min(...found.map((f) => f.begin))
    const prices = [...new Set(found.filter((f) => f.begin === first).map((f) => f.price))]
    if (prices.length > 1) throw new Error(`Preço ambíguo: ${offer} ${label} (${prices.join(', ')})`)
    return prices[0]
  }
  return { publicationDate: data.publicationDate, url: BASE + path, pick }
}

async function region(code) {
  prefix = PREFIX[code]
  const db = await rds(code)
  const cache = await elasticache(code)
  const ddb = await jsonOffer('AmazonDynamoDB', code, `ddb-${code}.json`)
  const rs = await jsonOffer('AmazonRedshift', code, `rs-${code}.json`)
  return {
    label: REGIONS[code],
    offers: { AmazonRDS: db.publicationDate, AmazonElastiCache: cache.publicationDate, AmazonDynamoDB: ddb.publicationDate, AmazonRedshift: rs.publicationDate },
    rds: db.rds,
    aurora: db.aurora,
    dynamodb: {
      onDemand: {
        readPerMillion: round(ddb.pick('leitura sob demanda', 'ReadRequestUnits') * 1e6),
        writePerMillion: round(ddb.pick('escrita sob demanda', 'WriteRequestUnits') * 1e6),
        replicatedWritePerMillion: round(ddb.pick('escrita replicada sob demanda', 'ReplWriteRequestUnits') * 1e6),
      },
      provisioned: {
        rcuHour: ddb.pick('RCU', 'ReadCapacityUnit-Hrs'),
        wcuHour: ddb.pick('WCU', 'WriteCapacityUnit-Hrs'),
        replicatedWcuHour: ddb.pick('WCU replicada', 'ReplWriteCapacityUnit-Hrs'),
      },
      storageGBMonth: ddb.pick('armazenamento', 'TimedStorage-ByteHrs'),
      pitrGBMonth: ddb.pick('PITR', 'TimedPITRStorage-ByteHrs'),
      backupGBMonth: ddb.pick('backup sob demanda', 'TimedBackupStorage-ByteHrs'),
    },
    elasticache: { nodes: cache.nodes },
    redshift: {
      nodes: Object.fromEntries(REDSHIFT_NODES.map((n) => [n, { hour: rs.pick(n, `Node:${n}`) }])),
      managedStorageGBMonth: rs.pick('RMS', 'RMS:ra3.xlplus'),
      serverlessRpuHour: rs.pick('Serverless', 'Redshift:ServerlessUsage'),
      spectrumPerTB: rs.pick('Spectrum', 'DataScanned'),
    },
    sourceUrls: [db.url, cache.url, ddb.url, rs.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de bancos de dados de ${code}… `)
  regions[code] = await region(code)
  console.log('ok')
}
const table = {
  source: 'AWS Price List Bulk API',
  sourceDocs: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-price-list-query-api.html',
  retrievedAt: new Date().toISOString().slice(0, 10),
  currency: 'USD',
  notes: [
    'Valores de referência para fins didáticos, extraídos da AWS Price List na data indicada.',
    'RDS for PostgreSQL e Aurora PostgreSQL sob demanda; outros motores têm preços próprios.',
    'Apenas a primeira faixa paga de cada item; sem nível gratuito, impostos, transferência de dados ou descontos de reserva.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
