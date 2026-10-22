#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Integração e mensageria na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas por Região:
 * - AWSQueueService: requisições das filas padrão e FIFO (por tipo de fila);
 * - AmazonSNS: requisições de publicação;
 * - AWSEvents: eventos personalizados, requisições do Pipes e invocações do
 *   Scheduler;
 * - AmazonStates: transições do Standard e requisições e GB-segundo do Express;
 * - AmazonApiGateway: requisições REST e HTTP e mensagens WebSocket;
 * - AmazonKinesis: shard-hora e unidades de PUT no modo provisionado;
 * - AmazonKinesisFirehose: GB ingerido.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores.
 *
 * Uso: npm run prices:integration
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (<oferta>-<região>.json) em vez de baixá-los de novo.
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
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/integration-prices.json')

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

/** Dimensões sob demanda de uma oferta, com o usagetype sem prefixo e os atributos do produto. */
async function jsonOffer(offer, code) {
  const path = `/offers/v1.0/aws/${offer}/current/${code}/index.json`
  const data = await getJson(path, `${offer}-${code}.json`)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({ usage: baseUsage(p.attributes.usagetype), attrs: p.attributes, begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  const pick = (label, test) => firstPaid(`${offer} ${label}`, dims.filter(typeof test === 'string' ? (d) => d.usage === test : test))
  return { publicationDate: data.publicationDate, url: BASE + path, pick }
}

async function region(code) {
  prefix = PREFIX[code]
  const sqs = await jsonOffer('AWSQueueService', code)
  const sns = await jsonOffer('AmazonSNS', code)
  const eb = await jsonOffer('AWSEvents', code)
  const sfn = await jsonOffer('AmazonStates', code)
  const apigw = await jsonOffer('AmazonApiGateway', code)
  const kds = await jsonOffer('AmazonKinesis', code)
  const fh = await jsonOffer('AmazonKinesisFirehose', code)
  return {
    label: REGIONS[code],
    offers: { AWSQueueService: sqs.publicationDate, AmazonSNS: sns.publicationDate, AWSEvents: eb.publicationDate, AmazonStates: sfn.publicationDate, AmazonApiGateway: apigw.publicationDate, AmazonKinesis: kds.publicationDate, AmazonKinesisFirehose: fh.publicationDate },
    sqs: {
      standardRequest: sqs.pick('requisição da fila padrão', (d) => d.attrs.queueType === 'Standard'),
      fifoRequest: sqs.pick('requisição da fila FIFO', (d) => d.attrs.queueType?.startsWith('FIFO')),
    },
    sns: { publishRequest: sns.pick('publicação', 'Requests-Tier1') },
    eventbridge: {
      customEvent: eb.pick('evento personalizado', 'Event-64K-Chunks'),
      pipesRequest: eb.pick('requisição do Pipes', 'Request-64K-Chunks'),
      schedulerInvocation: eb.pick('invocação do Scheduler', 'ScheduledInvocation'),
    },
    stepFunctions: {
      standardTransition: sfn.pick('transição do Standard', 'StateTransition'),
      expressRequest: sfn.pick('requisição do Express', 'StepFunctions-Request'),
      expressGbSecond: sfn.pick('GB-segundo do Express', 'StepFunctions-GB-Second'),
    },
    apiGateway: {
      restRequest: apigw.pick('requisição REST', 'ApiGatewayRequest'),
      httpRequest: apigw.pick('requisição HTTP', 'ApiGatewayHttpRequest'),
      websocketMessage: apigw.pick('mensagem WebSocket', 'ApiGatewayMessage'),
    },
    kinesis: {
      shardHour: kds.pick('shard-hora provisionado', 'Storage-ShardHour'),
      putPayloadUnit: kds.pick('unidade de PUT', 'PutRequestPayloadUnits'),
    },
    firehose: { gbIngested: fh.pick('GB ingerido', 'BilledBytes') },
    sourceUrls: [sqs.url, sns.url, eb.url, sfn.url, apigw.url, kds.url, fh.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de integração de ${code}… `)
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
    'Os preços são por requisição, evento, transição ou mensagem; a página de preços de cada serviço explica como os tamanhos são arredondados.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
