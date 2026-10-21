#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Monitoramento e governança na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas em JSON por Região:
 * - AmazonCloudWatch: métricas personalizadas, alarmes (padrão, de alta
 *   resolução, compostos), logs (ingestão, armazenamento e consultas do
 *   Logs Insights);
 * - AWSCloudTrail: cópias adicionais de eventos de gerenciamento, eventos de
 *   dados e eventos do CloudTrail Insights;
 * - AWSConfig: itens de configuração e avaliações de regras.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores. Os painéis personalizados do CloudWatch não constam
 * da Price List em massa e, por isso, não entram na tabela.
 *
 * Uso: npm run prices:governance
 * Com PRICES_CACHE=<pasta>, lê os arquivos já baixados nessa pasta
 * (cloudwatch-<região>.json, cloudtrail-<região>.json e config-<região>.json)
 * em vez de baixá-los de novo.
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
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/governance-prices.json')

/** Prefixo regional do usagetype (ex.: "SAE1-CW:AlarmMonitorUsage"); em us-east-1 ele costuma faltar. */
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

/** Dimensões sob demanda de uma oferta em JSON, já com o usagetype sem prefixo. */
async function jsonOffer(offer, code, cacheName) {
  const path = `/offers/v1.0/aws/${offer}/current/${code}/index.json`
  const data = await getJson(path, cacheName)
  const dims = []
  for (const [sku, p] of Object.entries(data.products)) {
    for (const term of Object.values(data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        dims.push({
          location: p.attributes.locationType,
          usage: baseUsage(p.attributes.usagetype),
          group: `${p.attributes.groupDescription ?? ''} ${pd.description}`,
          begin: Number(pd.beginRange),
          price: Number(pd.pricePerUnit.USD),
        })
      }
    }
  }
  /** Primeira faixa paga: a de menor início com preço acima de zero (e, se pedido, só a de grupo `group`). */
  const pick = (label, usage, group) => {
    const found = dims.filter((d) => d.usage === usage && d.price > 0 && (!d.location || d.location === 'AWS Region') && (!group || d.group.includes(group)))
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
  const cw = await jsonOffer('AmazonCloudWatch', code, `cloudwatch-${code}.json`)
  const ct = await jsonOffer('AWSCloudTrail', code, `cloudtrail-${code}.json`)
  const cfg = await jsonOffer('AWSConfig', code, `config-${code}.json`)
  return {
    label: REGIONS[code],
    offers: { AmazonCloudWatch: cw.publicationDate, AWSCloudTrail: ct.publicationDate, AWSConfig: cfg.publicationDate },
    cloudwatch: {
      customMetricMonth: cw.pick('métrica personalizada', 'CW:MetricMonitorUsage'),
      standardAlarmMonth: cw.pick('alarme padrão', 'CW:AlarmMonitorUsage'),
      highResAlarmMonth: cw.pick('alarme de alta resolução', 'CW:HighResAlarmMonitorUsage'),
      compositeAlarmMonth: cw.pick('alarme composto', 'CW:CompositeAlarmMonitorUsage'),
      logIngestGB: cw.pick('ingestão de logs (Standard)', 'DataProcessing-Bytes', 'Standard'),
      logIngestInfrequentGB: cw.pick('ingestão de logs (Infrequent Access)', 'DataProcessingIA-Bytes'),
      logStorageGBMonth: cw.pick('armazenamento de logs', 'TimedStorage-ByteHrs', 'Current version'),
      logInsightsScannedGB: cw.pick('consulta do Logs Insights', 'DataScanned-Bytes'),
    },
    cloudtrail: {
      /** Cópias adicionais de eventos de gerenciamento (a primeira cópia é gratuita). */
      extraManagementEventPer100k: round(ct.pick('evento de gerenciamento adicional', 'PaidEventsRecorded') * 1e5),
      dataEventPer100k: round(ct.pick('evento de dados', 'DataEventsRecorded') * 1e5),
      insightsEventPer100k: round(ct.pick('evento do Insights', 'InsightsEvents') * 1e5),
    },
    config: {
      configurationItem: cfg.pick('item de configuração (gravação contínua)', 'ConfigurationItemRecorded'),
      configurationItemDaily: cfg.pick('item de configuração (gravação periódica)', 'ConfigurationItemRecordedDaily'),
      ruleEvaluation: cfg.pick('avaliação de regra', 'ConfigRuleEvaluations'),
      conformancePackEvaluation: cfg.pick('avaliação de pacote de conformidade', 'ConformancePackEvaluations'),
    },
    sourceUrls: [cw.url, ct.url, cfg.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de monitoramento de ${code}… `)
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
    'Apenas a primeira faixa paga de cada item; sem nível gratuito, impostos, transferência de dados ou descontos por volume.',
    'Os painéis personalizados do CloudWatch não constam da Price List em massa e ficam de fora.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
