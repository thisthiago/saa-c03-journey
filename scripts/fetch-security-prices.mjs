#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Segurança e proteção de dados
 * na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas por Região:
 * - awskms (JSON): chave gerenciada pelo cliente por mês (por versão do
 *   material) e requisições simétricas;
 * - AWSSecretsManager (JSON): segredo por mês e chamadas de API;
 * - CloudHSM (JSON): HSM por hora (geração atual).
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores. GuardDuty, Inspector, Macie e Security Hub não
 * entram: a cobrança deles depende do volume analisado e fica como premissa
 * de cada cenário.
 *
 * Uso: npm run prices:security
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
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/security-prices.json')

/** Prefixos regionais do usagetype: o KMS usa "us-east-1-", os outros "USE1-". */
const PREFIXES = { 'us-east-1': ['USE1-', 'us-east-1-'], 'sa-east-1': ['SAE1-', 'sa-east-1-'] }
let prefixes = []
const baseUsage = (u = '') => {
  const p = prefixes.find((x) => u.startsWith(x))
  return p ? u.slice(p.length) : u
}

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
async function jsonOffer(offer, code) {
  const path = `/offers/v1.0/aws/${offer}/current/${code}/index.json`
  const data = await getJson(path, `${offer}-${code}.json`)
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
  prefixes = PREFIXES[code]
  const kms = await jsonOffer('awskms', code)
  const sm = await jsonOffer('AWSSecretsManager', code)
  const hsm = await jsonOffer('CloudHSM', code)
  return {
    label: REGIONS[code],
    offers: { awskms: kms.publicationDate, AWSSecretsManager: sm.publicationDate, CloudHSM: hsm.publicationDate },
    kms: {
      /** Por chave gerenciada pelo cliente (por versão do material, até a segunda rotação) e por mês. */
      keyMonth: kms.pick('chave gerenciada pelo cliente', 'KMS-Keys'),
      request: kms.pick('requisição simétrica', 'KMS-Requests'),
    },
    secretsManager: {
      secretMonth: sm.pick('segredo por mês', 'AWSSecretsManager-Secrets'),
      apiRequest: sm.pick('chamada de API', 'AWSSecretsManagerAPIRequest'),
    },
    cloudHsm: {
      hsmHour: hsm.pick('HSM por hora', 'CloudHSMv2Usage'),
    },
    sourceUrls: [kms.url, sm.url, hsm.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de segurança de ${code}… `)
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
    'O KMS cobra cada chave gerenciada pelo cliente por mês; a cobrança cresce na primeira e na segunda rotação e para de crescer depois.',
    'GuardDuty, Inspector, Macie e Security Hub não entram na tabela: a cobrança deles depende do volume analisado.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
