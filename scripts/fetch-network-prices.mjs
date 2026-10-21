#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Redes na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas por Região:
 * - AmazonVPC (JSON): anexo e dados processados do Transit Gateway, endpoints
 *   de interface (PrivateLink), conexão de Site-to-Site VPN, Client VPN e
 *   endereço IPv4 público em uso;
 * - AmazonEC2 (CSV regional, lido em streaming): hora e GB processado do
 *   NAT Gateway;
 * - AWSDataTransfer (JSON): transferência entre zonas de disponibilidade da
 *   mesma Região.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores. O Direct Connect cobra a porta por local de conexão,
 * e não por Região, e por isso não entra na tabela.
 *
 * Uso: npm run prices:network
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (vpc-<região>.json, ec2-<região>.csv e transfer-<região>.json) em vez de
 * baixá-los de novo.
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
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/network-prices.json')

/** Prefixo regional do usagetype (ex.: "SAE1-NatGateway-Hours"); em us-east-1 ele pode faltar. */
const PREFIX = { 'us-east-1': 'USE1-', 'sa-east-1': 'SAE1-' }
let prefix = ''
const baseUsage = (u = '') => (u.startsWith(prefix) ? u.slice(prefix.length) : u)

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
        dims.push({ usage: baseUsage(p.attributes.usagetype), text: pd.description, begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  /** Primeira faixa paga do usagetype (e, se pedido, só as dimensões cuja descrição contém `text`). */
  const pick = (label, usage, text) => firstPaid(`${offer} ${label} (${usage})`, dims.filter((d) => d.usage === usage && (!text || d.text.includes(text))))
  return { publicationDate: data.publicationDate, url: BASE + path, pick }
}

/** Hora e GB processado do NAT Gateway, lidos do CSV regional do EC2. */
async function natGateway(code) {
  const path = `/offers/v1.0/aws/AmazonEC2/current/${code}/index.csv`
  const meta = {}
  const found = { 'NatGateway-Hours': [], 'NatGateway-Bytes': [] }
  let header
  for await (const line of await lines(path, `ec2-${code}.csv`)) {
    if (!header) {
      const cells = parseCsvLine(line)
      if (cells[0] === 'SKU') header = cells
      else meta[cells[0]] = cells[1]
      continue
    }
    if (!/NatGateway-(Hours|Bytes)/.test(line)) continue
    const cells = parseCsvLine(line)
    const row = {}
    header.forEach((h, i) => (row[h] = cells[i]))
    const usage = baseUsage(row.usageType)
    if (row.TermType !== 'OnDemand' || !(usage in found)) continue
    found[usage].push({ begin: Number(row.StartingRange), price: Number(row.PricePerUnit) })
  }
  if (!header) throw new Error(`CSV sem cabeçalho: ${path}`)
  return {
    publicationDate: meta['Publication Date'],
    url: BASE + path,
    hour: firstPaid(`NAT Gateway por hora (${code})`, found['NatGateway-Hours']),
    perGB: firstPaid(`NAT Gateway por GB (${code})`, found['NatGateway-Bytes']),
  }
}

async function region(code) {
  prefix = PREFIX[code]
  const vpc = await jsonOffer('AmazonVPC', code, `vpc-${code}.json`)
  const dt = await jsonOffer('AWSDataTransfer', code, `transfer-${code}.json`)
  const nat = await natGateway(code)
  return {
    label: REGIONS[code],
    offers: { AmazonVPC: vpc.publicationDate, AmazonEC2: nat.publicationDate, AWSDataTransfer: dt.publicationDate },
    nat: { hour: nat.hour, perGB: nat.perGB },
    interfaceEndpoint: {
      /** Por endpoint e por zona de disponibilidade. */
      hourPerAz: vpc.pick('endpoint de interface por hora', 'VpcEndpoint-Hours'),
      perGB: vpc.pick('dados processados pelo endpoint de interface', 'VpcEndpoint-Bytes'),
    },
    transitGateway: {
      attachmentHour: vpc.pick('anexo de VPC ao Transit Gateway', 'TransitGateway-Hours', 'VPC Attachment'),
      perGB: vpc.pick('dados processados pelo Transit Gateway', 'TransitGateway-Bytes', 'VPC Attachment'),
    },
    vpn: {
      connectionHour: vpc.pick('conexão de Site-to-Site VPN', 'VPN-Usage-Hours:ipsec.1'),
    },
    clientVpn: {
      endpointAssociationHour: vpc.pick('associação do endpoint de Client VPN', 'ClientVPN-EndpointHours'),
      connectionHour: vpc.pick('conexão de Client VPN', 'ClientVPN-ConnectionHours'),
    },
    publicIpv4Hour: vpc.pick('IPv4 público em uso', 'PublicIPv4:InUseAddress'),
    interAzPerGB: dt.pick('transferência entre zonas de disponibilidade', 'DataTransfer-Regional-Bytes'),
    sourceUrls: [vpc.url, nat.url, dt.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de rede de ${code}… `)
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
    'A transferência entre zonas de disponibilidade é cobrada em cada sentido.',
    'O Direct Connect cobra a porta por local de conexão e a saída de dados, e não entra na tabela.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
