#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Análise de dados e serviços de
 * IA na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas por Região:
 * - AmazonAthena (JSON): dado lido pelas consultas SQL (por TB) e capacidade
 *   provisionada (por DPU-hora);
 * - AWSGlue (JSON): jobs de ETL (padrão, Flex e Glue 6.0 ou mais novo),
 *   crawlers e o armazenamento e as requisições do Data Catalog.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores. EMR, OpenSearch e MSK não entram: o custo deles
 * depende do tamanho do cluster e fica como premissa de cada cenário.
 *
 * Uso: npm run prices:analytics
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (athena-<região>.json e glue-<região>.json) em vez de baixá-los de novo.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://pricing.us-east-1.amazonaws.com'
const REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'sa-east-1': 'América do Sul (São Paulo)',
}
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/analytics-prices.json')

/** Prefixo regional do usagetype (ex.: "SAE1-ETL-DPU-Hour"). */
const PREFIX = { 'us-east-1': 'USE1-', 'sa-east-1': 'SAE1-' }
let prefix = ''
const baseUsage = (u = '') => (u.startsWith(prefix) ? u.slice(prefix.length) : u)

async function getJson(path, cacheName) {
  if (CACHE && existsSync(join(CACHE, cacheName))) return JSON.parse(await readFile(join(CACHE, cacheName), 'utf8'))
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`)
  return res.json()
}

/** Escolhe a primeira faixa paga entre as dimensões encontradas; falha se faltar ou for ambígua. */
function firstPaid(label, found) {
  const paid = found.filter((d) => d.price > 0)
  if (paid.length === 0) throw new Error(`Preço não encontrado: ${label}`)
  const first = Math.min(...paid.map((f) => f.begin))
  const prices = [...new Set(paid.filter((f) => f.begin === first).map((f) => f.price))]
  if (prices.length > 1) throw new Error(`Preço ambíguo: ${label} (${prices.join(', ')})`)
  return prices[0]
}

/** Dimensões sob demanda de uma oferta em JSON, já com o usagetype sem prefixo. */
async function jsonOffer(offer, code, cacheName) {
  const path = `/offers/v1.0/aws/${offer}/current/${code}/index.json`
  const data = await getJson(path, cacheName)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({ usage: baseUsage(p.attributes.usagetype), begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  const pick = (label, usage) => firstPaid(`${offer} ${label} (${usage})`, dims.filter((d) => d.usage === usage))
  return { publicationDate: data.publicationDate, url: BASE + path, pick }
}

async function region(code) {
  prefix = PREFIX[code]
  const athena = await jsonOffer('AmazonAthena', code, `athena-${code}.json`)
  const glue = await jsonOffer('AWSGlue', code, `glue-${code}.json`)
  return {
    label: REGIONS[code],
    offers: { AmazonAthena: athena.publicationDate, AWSGlue: glue.publicationDate },
    athena: {
      perTBScanned: athena.pick('dado lido pelas consultas SQL', 'DataScannedInTB'),
      provisionedDpuHour: athena.pick('capacidade provisionada', 'ReservedCapacityInDPUHours'),
    },
    glue: {
      etlDpuHour: glue.pick('job de ETL', 'ETL-DPU-Hour'),
      etlFlexDpuHour: glue.pick('job de ETL Flex', 'ETL-Flex-DPU-Hour'),
      etlDpuHourGen2: glue.pick('job de ETL no Glue 6.0 ou mais novo', 'ETL-DPU-Hour-Gen2'),
      crawlerDpuHour: glue.pick('crawler', 'Crawler-DPU-Hour'),
      /** Por objeto (banco, tabela, partição ou versão) e por mês, além do nível gratuito. */
      catalogObjectMonth: glue.pick('armazenamento do Data Catalog', 'Catalog-Storage'),
      catalogRequest: glue.pick('requisição ao Data Catalog', 'Catalog-Request'),
    },
    sourceUrls: [athena.url, glue.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de análise de dados de ${code}… `)
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
    'Apenas a primeira faixa paga de cada item; sem nível gratuito, impostos ou descontos por volume.',
    'O Athena cobra o dado lido pelas consultas; o mínimo por consulta e o arredondamento estão na página de preços do serviço.',
    'EMR, OpenSearch e MSK não entram na tabela: o custo deles depende do tamanho do cluster.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
