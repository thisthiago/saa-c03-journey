#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Computação na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais:
 * - AmazonEC2 (CSV regional, lido em streaming): instâncias On-Demand e
 *   Reserved Instances, créditos de CPU das burstable e volumes EBS;
 * - AWSComputeSavingsPlan (CSV regional): Compute e EC2 Instance Savings Plans;
 * - AWSLambda, AmazonECS (Fargate) e AWSELB (JSON regional).
 *
 * Extrai a primeira faixa de preço de cada item, para Linux, tenancy
 * compartilhada e sem software pré-instalado. Se algum preço não for
 * encontrado (ou for ambíguo), o script falha — ele nunca inventa valores.
 *
 * Uso: npm run prices:compute
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (ec2-<região>.csv, csp-<região>.csv, lambda-<região>.json, ecs-<região>.json
 * e elb-<região>.json) em vez de baixá-los de novo.
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
/** Tipos usados nos laboratórios: precisam existir nas duas Regiões. */
const TYPES = [
  't3.micro',
  't3.medium',
  't3.large',
  't4g.medium',
  't4g.large',
  'm5.large',
  'm7i.large',
  'm7i.xlarge',
  'm7g.large',
  'm7g.xlarge',
  'c7i.large',
  'c7i.xlarge',
  'c7g.large',
  'c7g.xlarge',
  'c7g.2xlarge',
  'r7i.large',
  'r7g.large',
  'r7g.xlarge',
  'i4i.large',
  'i4i.xlarge',
  'g5.xlarge',
  'inf2.xlarge',
]
const BURSTABLE = ['t3', 't4g']
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/compute-prices.json')

/** Prefixo regional do usagetype (ex.: "SAE1-BoxUsage:m7g.large"); em us-east-1 ele costuma faltar. */
const PREFIX = { 'us-east-1': 'USE1-', 'sa-east-1': 'SAE1-' }
let prefix = ''
/** Remove só o prefixo da Região em leitura: "TS-LoadBalancerUsage" continua inteiro. */
const baseUsage = (u = '') => (u.startsWith(prefix) ? u.slice(prefix.length) : u)
const round = (n) => Math.round(n * 1e8) / 1e8

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

/**
 * Percorre um CSV da Price List: guarda os metadados do cabeçalho e entrega
 * como objeto cada linha que passa no filtro rápido (`hint`).
 */
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

async function ec2(code) {
  const prices = collector(`EC2 ${code}`)
  const specs = new Map()
  const usages = new Set(TYPES.map((t) => `BoxUsage:${t}`))
  const hint = /BoxUsage:|CPU Credits|EBS:Volume|EBS:SnapshotUsage|EBS:SnapshotArchiveStorage/
  const meta = await readCsv(`/offers/v1.0/aws/AmazonEC2/current/${code}/index.csv`, `ec2-${code}.csv`, hint, (r) => {
    if (r['Location Type'] !== 'AWS Region') return
    const usage = baseUsage(r.usageType)
    const price = Number(r.PricePerUnit)
    if (r['Product Family'] === 'Compute Instance' && usages.has(usage)) {
      const linux = r['Operating System'] === 'Linux' && r.Tenancy === 'Shared' && r['Pre Installed S/W'] === 'NA' && r.CapacityStatus === 'Used' && r['License Model'] === 'No License required' && r.operation === 'RunInstances'
      if (!linux || r.Unit !== 'Hrs') return
      const type = r['Instance Type']
      specs.set(type, {
        vcpu: Number(r.vCPU),
        memoryGiB: Number(r.Memory.replace(/ GiB$/, '')),
        processor: r['Physical Processor'],
        arch: /Graviton/i.test(r['Physical Processor']) ? 'arm64' : 'x86_64',
        gpus: r.GPU && r.GPU !== 'NA' ? Number(r.GPU) : 0,
        storage: r.Storage,
        network: r['Network Performance'],
      })
      if (r.TermType === 'OnDemand') prices.set(`${type}:od`, price)
      if (r.TermType === 'Reserved' && r.PurchaseOption === 'No Upfront') prices.set(`${type}:ri:${r.OfferingClass}-${r.LeaseContractLength}`, price)
      return
    }
    if (r['Product Family'] === 'CPU Credits' && r['Operating System'] === 'Linux') prices.set(usage, price)
    if (['Storage', 'System Operation', 'Provisioned Throughput', 'Storage Snapshot'].includes(r['Product Family']) && r.TermType === 'OnDemand') prices.set(usage, price)
  })

  const instances = {}
  for (const type of TYPES) {
    const spec = specs.get(type)
    if (!spec) throw new Error(`Tipo de instância sem preço em ${code}: ${type}`)
    instances[type] = {
      ...spec,
      onDemandHour: prices.get(`${type}:od`),
      reservedNoUpfrontHour: {
        'standard-1yr': prices.get(`${type}:ri:standard-1yr`),
        'standard-3yr': prices.get(`${type}:ri:standard-3yr`),
        'convertible-1yr': prices.get(`${type}:ri:convertible-1yr`),
        'convertible-3yr': prices.get(`${type}:ri:convertible-3yr`),
      },
    }
  }
  const ebs = {
    gp3: {
      gbMonth: prices.get('EBS:VolumeUsage.gp3'),
      iopsMonth: prices.get('EBS:VolumeP-IOPS.gp3'),
      // A oferta cobra por GiBps-mês: divide por 1.024 para chegar ao MiB/s-mês.
      throughputMiBpsMonth: round(prices.get('EBS:VolumeP-Throughput.gp3') / 1024),
    },
    gp2: { gbMonth: prices.get('EBS:VolumeUsage.gp2') },
    io2: {
      gbMonth: prices.get('EBS:VolumeUsage.io2'),
      iopsMonthTiers: [
        { upTo: 32000, price: prices.get('EBS:VolumeP-IOPS.io2') },
        { upTo: 64000, price: prices.get('EBS:VolumeP-IOPS.io2.tier2') },
        { upTo: null, price: prices.get('EBS:VolumeP-IOPS.io2.tier3') },
      ],
    },
    io1: { gbMonth: prices.get('EBS:VolumeUsage.piops'), iopsMonth: prices.get('EBS:VolumeP-IOPS.piops') },
    st1: { gbMonth: prices.get('EBS:VolumeUsage.st1') },
    sc1: { gbMonth: prices.get('EBS:VolumeUsage.sc1') },
    snapshotGBMonth: prices.get('EBS:SnapshotUsage'),
    snapshotArchiveGBMonth: prices.get('EBS:SnapshotArchiveStorage'),
  }
  const cpuCreditsPerVcpuHour = Object.fromEntries(BURSTABLE.map((f) => [f, prices.get(`CPUCredits:${f}`)]))
  return { publicationDate: meta['Publication Date'], url: `${BASE}/offers/v1.0/aws/AmazonEC2/current/${code}/index.csv`, instances, ebs, cpuCreditsPerVcpuHour }
}

async function savingsPlans(code) {
  const idx = await getJson('/savingsPlan/v1.0/aws/AWSComputeSavingsPlan/current/region_index.json', 'csp-index.json')
  const entry = idx.regions.find((r) => r.regionCode === code)
  if (!entry) throw new Error(`Savings Plans sem a Região ${code}`)
  const path = entry.versionUrl.replace(/index\.json$/, 'index.csv')
  const rates = collector(`Savings Plans ${code}`)
  const usages = new Set([...TYPES.map((t) => `BoxUsage:${t}`), 'Fargate-vCPU-Hours:perCPU', 'Fargate-GB-Hours', 'Lambda-GB-Second'])
  const meta = await readCsv(path, `csp-${code}.csv`, /No Upfront/, (r) => {
    if (r.PurchaseOption !== 'No Upfront' || r.DiscountedRegionCode !== code) return
    const usage = baseUsage(r.DiscountedUsageType)
    if (!usages.has(usage)) return
    if (r.DiscountedServiceCode === 'AmazonEC2' && r.DiscountedOperation !== 'RunInstances') return
    const plan = r['Product Family'] === 'ComputeSavingsPlans' ? 'compute' : r['Product Family'] === 'EC2InstanceSavingsPlans' ? 'ec2instance' : null
    if (!plan) return
    rates.set(`${usage}:${plan}-${r.LeaseContractLength}yr`, Number(r.DiscountedRate))
  })
  const terms = ['compute-1yr', 'compute-3yr', 'ec2instance-1yr', 'ec2instance-3yr']
  return {
    publicationDate: meta['Publication Date'],
    url: BASE + path,
    instances: Object.fromEntries(TYPES.map((t) => [t, Object.fromEntries(terms.map((k) => [k, rates.get(`BoxUsage:${t}:${k}`)]))])),
    fargate: Object.fromEntries(['1yr', '3yr'].map((y) => [y, { vcpuHour: rates.get(`Fargate-vCPU-Hours:perCPU:compute-${y}`), gbHour: rates.get(`Fargate-GB-Hours:compute-${y}`) }])),
    lambdaGBSecond: Object.fromEntries(['1yr', '3yr'].map((y) => [y, rates.get(`Lambda-GB-Second:compute-${y}`)])),
  }
}

/** Dimensões de preço sob demanda de uma oferta em JSON, já com o usagetype sem prefixo. */
async function jsonOffer(offer, code, cacheName) {
  const idx = await getJson(`/offers/v1.0/aws/${offer}/current/region_index.json`, `${offer}-index.json`)
  const r = idx.regions[code]
  if (!r) throw new Error(`Oferta ${offer} sem a Região ${code}`)
  const data = await getJson(r.currentVersionUrl, cacheName)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({ family: p.productFamily, location: p.attributes.locationType, usage: baseUsage(p.attributes.usagetype), begin: Number(pd.beginRange), price: Number(pd.pricePerUnit.USD) })
      }
    }
  }
  const pick = (label, usage, family) => {
    const found = dims.filter((d) => d.usage === usage && d.begin === 0 && (!family || d.family === family) && (!d.location || d.location === 'AWS Region'))
    const prices = [...new Set(found.map((f) => f.price))]
    if (prices.length === 0) throw new Error(`Preço não encontrado: ${offer} ${label} (${usage})`)
    if (prices.length > 1) throw new Error(`Preço ambíguo: ${offer} ${label} (${prices.join(', ')})`)
    return prices[0]
  }
  return { publicationDate: data.publicationDate, url: BASE + r.currentVersionUrl, pick }
}

async function region(code) {
  prefix = PREFIX[code]
  const ec = await ec2(code)
  const sp = await savingsPlans(code)
  const lambda = await jsonOffer('AWSLambda', code, `lambda-${code}.json`)
  const ecs = await jsonOffer('AmazonECS', code, `ecs-${code}.json`)
  const elb = await jsonOffer('AWSELB', code, `elb-${code}.json`)
  for (const [type, rates] of Object.entries(sp.instances)) ec.instances[type].savingsPlanHour = rates
  return {
    label: REGIONS[code],
    offers: {
      AmazonEC2: ec.publicationDate,
      AWSComputeSavingsPlan: sp.publicationDate,
      AWSLambda: lambda.publicationDate,
      AmazonECS: ecs.publicationDate,
      AWSELB: elb.publicationDate,
    },
    instances: ec.instances,
    cpuCreditsPerVcpuHour: ec.cpuCreditsPerVcpuHour,
    ebs: ec.ebs,
    lambda: {
      requestPerMillion: round(lambda.pick('requisições', 'Request') * 1e6),
      gbSecond: { x86_64: lambda.pick('GB-s', 'Lambda-GB-Second'), arm64: lambda.pick('GB-s Arm', 'Lambda-GB-Second-ARM') },
      provisioned: {
        concurrencyGBSecond: lambda.pick('concorrência provisionada', 'Lambda-Provisioned-Concurrency'),
        durationGBSecond: lambda.pick('duração provisionada', 'Lambda-Provisioned-GB-Second'),
      },
      computeSavingsPlanGBSecond: sp.lambdaGBSecond,
    },
    fargate: {
      vcpuHour: { x86_64: ecs.pick('vCPU', 'Fargate-vCPU-Hours:perCPU'), arm64: ecs.pick('vCPU Arm', 'Fargate-ARM-vCPU-Hours:perCPU') },
      gbHour: { x86_64: ecs.pick('memória', 'Fargate-GB-Hours'), arm64: ecs.pick('memória Arm', 'Fargate-ARM-GB-Hours') },
      computeSavingsPlan: sp.fargate,
    },
    elb: {
      alb: { hour: elb.pick('ALB hora', 'LoadBalancerUsage', 'Load Balancer-Application'), lcuHour: elb.pick('ALB LCU', 'LCUUsage', 'Load Balancer-Application') },
      nlb: { hour: elb.pick('NLB hora', 'LoadBalancerUsage', 'Load Balancer-Network'), lcuHour: elb.pick('NLB LCU', 'LCUUsage', 'Load Balancer-Network') },
      gwlb: { hour: elb.pick('GWLB hora', 'LoadBalancerUsage', 'Load Balancer-Gateway'), lcuHour: elb.pick('GWLB LCU', 'LCUUsage', 'Load Balancer-Gateway') },
    },
    sourceUrls: [ec.url, sp.url, lambda.url, ecs.url, elb.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de computação de ${code}… `)
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
    'Linux, tenancy compartilhada, sem software pré-instalado; Reserved Instances e Savings Plans sem pagamento antecipado (No Upfront).',
    'Apenas a primeira faixa de preço de cada item; sem nível gratuito, impostos ou descontos.',
    'O preço do Spot varia e não faz parte da Price List: os laboratórios usam um desconto marcado como premissa do cenário.',
    'Preços mudam: consulte https://aws.amazon.com/ec2/pricing/ antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
