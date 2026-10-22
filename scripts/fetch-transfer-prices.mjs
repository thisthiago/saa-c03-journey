#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada de transferência de dados da trilha
 * Arquitetura e otimização na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais:
 * - AWSDataTransfer de us-east-1 (JSON): entrada da internet, saída para a
 *   internet, tráfego entre zonas de disponibilidade, saída para outras
 *   Regiões e saída da Região para o CloudFront (busca na origem);
 * - AmazonCloudFront (JSON, oferta global): saída do CloudFront para a
 *   internet nos Estados Unidos.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Os itens que a AWS cobra a zero (entrada da internet e busca na origem pelo
 * CloudFront) são lidos da tabela e precisam valer exatamente zero. Se algum
 * preço não for encontrado (ou for ambíguo), o script falha — ele nunca
 * inventa valores.
 *
 * Uso: npm run prices:transfer
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (transfer-us-east-1.json e cloudfront.json) em vez de baixá-los de novo.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://pricing.us-east-1.amazonaws.com'
const REGION = 'us-east-1'
const LABEL = 'US East (N. Virginia)'
/** Regiões de destino da saída entre Regiões, com o código usado no usagetype. */
const DESTINATIONS = { 'us-east-2': 'USE2', 'us-west-2': 'USW2', 'sa-east-1': 'SAE1', 'eu-west-1': 'EU' }
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/transfer-prices.json')

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

/** Item cobrado a zero: precisa existir e valer zero em todas as faixas. */
function free(label, found) {
  if (found.length === 0) throw new Error(`Preço não encontrado: ${label}`)
  if (found.some((d) => d.price !== 0)) throw new Error(`Preço deixou de ser zero: ${label}`)
  return 0
}

/** Dimensões sob demanda de uma oferta em JSON. */
async function jsonOffer(path, cacheName) {
  const data = await getJson(path, cacheName)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({ usage: p.attributes.usagetype, attrs: p.attributes, begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  const byUsage = (usage) => dims.filter((d) => d.usage === usage)
  return { publicationDate: data.publicationDate, url: BASE + path, byUsage }
}

process.stdout.write(`Lendo preços de transferência de ${REGION}… `)
const dt = await jsonOffer(`/offers/v1.0/aws/AWSDataTransfer/current/${REGION}/index.json`, `transfer-${REGION}.json`)
const cf = await jsonOffer('/offers/v1.0/aws/AmazonCloudFront/current/index.json', 'cloudfront.json')

// Em us-east-1 o usagetype da Região vem sem prefixo (ex.: "DataTransfer-Out-Bytes").
const interRegionOutPerGB = Object.fromEntries(
  Object.entries(DESTINATIONS).map(([code, short]) => [code, firstPaid(`saída para ${code}`, dt.byUsage(`USE1-${short}-AWS-Out-Bytes`))]),
)
const region = {
  label: LABEL,
  offers: { AWSDataTransfer: dt.publicationDate, AmazonCloudFront: cf.publicationDate },
  internetInPerGB: free('entrada da internet', dt.byUsage('DataTransfer-In-Bytes')),
  internetOutPerGB: firstPaid('saída para a internet', dt.byUsage('DataTransfer-Out-Bytes')),
  /** Cobrada em cada sentido. */
  interAzPerGB: firstPaid('entre zonas de disponibilidade', dt.byUsage('DataTransfer-Regional-Bytes')),
  interRegionOutPerGB,
  cloudFrontOriginFetchPerGB: free('da Região para o CloudFront', dt.byUsage('USE1-CloudFront-Out-Bytes')),
  cloudFrontOutPerGB: firstPaid('saída do CloudFront nos Estados Unidos', cf.byUsage('US-DataTransfer-Out-Bytes')),
  sourceUrls: [dt.url, cf.url],
}
console.log('ok')

const table = {
  source: 'AWS Price List Bulk API',
  sourceDocs: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-price-list-query-api.html',
  retrievedAt: new Date().toISOString().slice(0, 10),
  currency: 'USD',
  notes: [
    'Valores de referência para fins didáticos, extraídos da AWS Price List na data indicada.',
    'Apenas a primeira faixa paga de cada item; sem os 100 GB gratuitos por mês de saída para a internet, impostos ou descontos por volume.',
    'A transferência entre zonas de disponibilidade é cobrada em cada sentido; entre Regiões, só a saída da Região de origem.',
    'A saída do CloudFront usa o preço dos Estados Unidos; outras partes do mundo custam diferente.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions: { [REGION]: region },
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
