#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada usada pelo simulador de custos.
 *
 * Fonte: AWS Price List Bulk API (ofertas AmazonS3, AmazonS3GlacierDeepArchive
 * e AWSDataTransfer). Extrai apenas a primeira faixa de preço de cada item,
 * para as Regiões listadas em REGIONS (e o S3 Standard das COMPARE_REGIONS). Se algum preço não for encontrado, o
 * script falha — ele nunca inventa valores.
 *
 * Uso: npm run prices:update
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://pricing.us-east-1.amazonaws.com'
const REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'sa-east-1': 'América do Sul (São Paulo)',
}
/**
 * Regiões usadas na trilha AWS Foundations para comparar custos entre Regiões.
 * Delas só se extraem o S3 Standard e a transferência para a internet.
 */
const COMPARE_REGIONS = {
  'us-east-1': 'US East (N. Virginia)',
  'sa-east-1': 'South America (São Paulo)',
  'mx-central-1': 'Mexico (Central)',
  'eu-west-1': 'Europe (Ireland)',
  'eu-west-3': 'Europe (Paris)',
  'eu-central-1': 'Europe (Frankfurt)',
  'eu-south-2': 'Europe (Spain)',
}
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/s3-prices.json')

async function getJson(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`)
  return res.json()
}

async function loadOffer(offer, region) {
  const idx = await getJson(`/offers/v1.0/aws/${offer}/current/region_index.json`)
  const r = idx.regions[region]
  if (!r) throw new Error(`Oferta ${offer} sem a Região ${region}`)
  const data = await getJson(r.currentVersionUrl)
  return { data, publicationDate: data.publicationDate, url: BASE + r.currentVersionUrl }
}

/** Remove o prefixo regional do usagetype (ex.: "SAE1-TimedStorage-ByteHrs", "EU-TimedStorage-ByteHrs"). */
const baseUsage = (u = '') => u.replace(/^[A-Z]{2,4}\d?-/, '')

function dims(offer) {
  const out = []
  for (const [sku, p] of Object.entries(offer.data.products)) {
    for (const term of Object.values(offer.data.terms.OnDemand?.[sku] ?? {})) {
      for (const pd of Object.values(term.priceDimensions)) {
        out.push({ usage: baseUsage(p.attributes.usagetype), attrs: p.attributes, begin: Number(pd.beginRange), unit: pd.unit, price: Number(pd.pricePerUnit.USD), desc: pd.description })
      }
    }
  }
  return out
}

function pick(list, label, usage, { desc, begin = 0, per = 1 } = {}) {
  const found = list.filter((d) => d.usage === usage && d.begin === begin && (!desc || desc.test(d.desc)))
  if (found.length === 0) throw new Error(`Preço não encontrado: ${label} (${usage}${desc ? ` ~ ${desc}` : ''})`)
  const prices = [...new Set(found.map((f) => f.price))]
  if (prices.length > 1) throw new Error(`Preço ambíguo: ${label} → ${prices.join(', ')}`)
  return Math.round(prices[0] * per * 1e8) / 1e8
}

async function region(code) {
  const s3 = await loadOffer('AmazonS3', code)
  const gda = await loadOffer('AmazonS3GlacierDeepArchive', code)
  const dt = await loadOffer('AWSDataTransfer', code)
  const S = dims(s3)
  const G = dims(gda)
  const D = dims(dt).filter((d) => d.attrs.transferType === 'AWS Outbound' && d.attrs.toLocation === 'External' && d.attrs.fromRegionCode === code)
  const K = 1000
  return {
    label: REGIONS[code],
    offers: {
      AmazonS3: s3.publicationDate,
      AmazonS3GlacierDeepArchive: gda.publicationDate,
      AWSDataTransfer: dt.publicationDate,
    },
    storageGBMonth: {
      STANDARD: pick(S, 'Standard', 'TimedStorage-ByteHrs'),
      INTELLIGENT_TIERING: pick(S, 'INT FA', 'TimedStorage-INT-FA-ByteHrs'),
      STANDARD_IA: pick(S, 'Standard-IA', 'TimedStorage-SIA-ByteHrs'),
      ONEZONE_IA: pick(S, 'One Zone-IA', 'TimedStorage-ZIA-ByteHrs'),
      EXPRESS_ONEZONE: pick(S, 'Express One Zone', 'TimedStorage-XZ-ByteHrs'),
      GLACIER_IR: pick(S, 'Glacier IR', 'TimedStorage-GIR-ByteHrs'),
      GLACIER: pick(S, 'Glacier Flexible', 'TimedStorage-GlacierByteHrs'),
      DEEP_ARCHIVE: pick(G, 'Deep Archive', 'TimedStorage-GDA-ByteHrs'),
    },
    intelligentTiering: {
      monitoringPer1000Objects: pick(S, 'INT monitoring', 'Monitoring-Automation-INT', { per: K }),
      tierGBMonth: {
        frequent: pick(S, 'INT FA', 'TimedStorage-INT-FA-ByteHrs'),
        infrequent: pick(S, 'INT IA', 'TimedStorage-INT-IA-ByteHrs'),
        archiveInstant: pick(S, 'INT AIA', 'TimedStorage-INT-AIA-ByteHrs'),
      },
    },
    putPer1000: {
      STANDARD: pick(S, 'PUT Standard', 'Requests-Tier1', { per: K }),
      INTELLIGENT_TIERING: pick(S, 'PUT INT', 'Requests-INT-Tier1', { per: K }),
      STANDARD_IA: pick(S, 'PUT SIA', 'Requests-SIA-Tier1', { per: K }),
      ONEZONE_IA: pick(S, 'PUT ZIA', 'Requests-ZIA-Tier1', { per: K }),
      EXPRESS_ONEZONE: pick(S, 'PUT XZ', 'Requests-XZ-Tier1', { per: K }),
      GLACIER_IR: pick(S, 'PUT GIR', 'Requests-GIR-Tier1', { per: K }),
      GLACIER: pick(S, 'PUT Glacier', 'Requests-GLACIER-Tier1', { desc: /PutObject requests to Glacier/, per: K }),
      DEEP_ARCHIVE: pick(G, 'PUT GDA', 'Requests-GDA-Tier1', { desc: /PutObject requests to Glacier Deep Archive/, per: K }),
    },
    getPer1000: {
      STANDARD: pick(S, 'GET Standard', 'Requests-Tier2', { per: K }),
      INTELLIGENT_TIERING: pick(S, 'GET INT', 'Requests-INT-Tier2', { per: K }),
      STANDARD_IA: pick(S, 'GET SIA', 'Requests-SIA-Tier2', { per: K }),
      ONEZONE_IA: pick(S, 'GET ZIA', 'Requests-ZIA-Tier2', { per: K }),
      EXPRESS_ONEZONE: pick(S, 'GET XZ', 'Requests-XZ-Tier2', { per: K }),
      GLACIER_IR: pick(S, 'GET GIR', 'Requests-GIR-Tier2', { per: K }),
      GLACIER: pick(S, 'GET Glacier', 'Requests-GLACIER-Tier2', { per: K }),
      DEEP_ARCHIVE: pick(S, 'GET GDA', 'Requests-GDA-Tier2', { per: K }),
    },
    retrievalPerGB: {
      STANDARD_IA: pick(S, 'Retrieval SIA', 'Retrieval-SIA'),
      ONEZONE_IA: pick(S, 'Retrieval ZIA', 'Retrieval-ZIA'),
      GLACIER_IR: pick(S, 'Retrieval GIR', 'Retrieval-GIR'),
      EXPRESS_ONEZONE: pick(S, 'Retrieval XZ', 'Retrieval-XZ'),
      GLACIER_EXPEDITED: pick(S, 'Glacier expedited', 'Expedited-Retrieval-Bytes', { desc: /Expedited retrieval fee/ }),
      GLACIER_STANDARD: pick(S, 'Glacier standard', 'Standard-Retrieval-Bytes', { desc: /^\$[\d.]+ per GB - Standard retrieval fee$/ }),
      GLACIER_BULK: pick(S, 'Glacier bulk', 'Bulk-Retrieval-Bytes', { desc: /per GB - Bulk retrieval( fee)?$/ }),
      DEEP_ARCHIVE_STANDARD: pick(G, 'GDA standard', 'Standard-Retrieval-Bytes'),
      DEEP_ARCHIVE_BULK: pick(G, 'GDA bulk', 'Bulk-Retrieval-Bytes'),
    },
    restoreRequestPer1000: {
      GLACIER_EXPEDITED: pick(S, 'Glacier expedited req', 'Requests-Tier6', { desc: /Expedited Glacier request/, per: K }),
      // A oferta tem duas linhas "per 1,000 Glacier Requests": a maior é a restauração Standard.
      GLACIER_STANDARD: pickMax(S, 'Glacier standard req', 'Requests-Tier3', /per 1,000 Glacier Requests/, K),
      GLACIER_BULK: pick(S, 'Glacier bulk req', 'Requests-Tier5', { desc: /Bulk Glacier requests/, per: K }),
      DEEP_ARCHIVE_STANDARD: pick(G, 'GDA standard req', 'Requests-GDA-Tier3', { per: K }),
      DEEP_ARCHIVE_BULK: pick(G, 'GDA bulk req', 'Requests-GDA-Tier5', { per: K }),
    },
    transitionPer1000: {
      STANDARD_IA: pick(S, 'Transition SIA', 'Requests-Tier4', { desc: /transitions to Standard-Infrequent Access/, per: K }),
      ONEZONE_IA: pick(S, 'Transition ZIA', 'Requests-Tier4', { desc: /transitions to One Zone-Infrequent Access/, per: K }),
      INTELLIGENT_TIERING: pick(S, 'Transition INT', 'Requests-Tier4', { desc: /transitions to Intelligent Tiering/, per: K }),
      GLACIER_IR: pick(S, 'Transition GIR', 'Requests-Tier4', { desc: /transitions to Glacier Instant Retrieval/, per: K }),
      GLACIER: pick(S, 'Transition Glacier', 'Requests-GLACIER-Tier1', { desc: /PutObject requests to Glacier/, per: K }),
      DEEP_ARCHIVE: pick(G, 'Transition GDA', 'Requests-Tier3', { desc: /Lifecycle requests to Glacier Deep Archive/, per: K }),
    },
    expressUploadPerGB: pick(S, 'Upload XZ', 'Upload-XZ'),
    dataTransferOutPerGB: (() => {
      const first = D.filter((d) => d.usage === 'DataTransfer-Out-Bytes' && d.begin === 0)
      if (first.length === 0) throw new Error('Preço não encontrado: transferência para a internet')
      return first[0].price
    })(),
    sourceUrls: [s3.url, gda.url, dt.url],
  }
}

/** Entre linhas com a mesma descrição e preços diferentes, devolve a de maior preço. */
function pickMax(list, label, usage, desc, per) {
  const prices = list.filter((d) => d.usage === usage && d.begin === 0 && desc.test(d.desc)).map((d) => d.price)
  if (prices.length === 0) throw new Error(`Preço não encontrado: ${label}`)
  return Math.round(Math.max(...prices) * per * 1e8) / 1e8
}

/** Só o S3 Standard e a transferência para a internet (primeira faixa). */
async function compareRegion(code) {
  const s3 = await loadOffer('AmazonS3', code)
  const dt = await loadOffer('AWSDataTransfer', code)
  const D = dims(dt).filter((d) => d.attrs.transferType === 'AWS Outbound' && d.attrs.toLocation === 'External' && d.attrs.fromRegionCode === code)
  const first = D.filter((d) => d.usage === 'DataTransfer-Out-Bytes' && d.begin === 0)
  if (first.length === 0) throw new Error(`Preço não encontrado: transferência para a internet em ${code}`)
  return {
    label: COMPARE_REGIONS[code],
    offers: { AmazonS3: s3.publicationDate, AWSDataTransfer: dt.publicationDate },
    standardGBMonth: pick(dims(s3), `Standard ${code}`, 'TimedStorage-ByteHrs'),
    dataTransferOutPerGB: first[0].price,
    sourceUrls: [s3.url, dt.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de ${code}… `)
  regions[code] = await region(code)
  console.log('ok')
}
const compare = {}
for (const code of Object.keys(COMPARE_REGIONS)) {
  process.stdout.write(`Lendo S3 Standard de ${code}… `)
  compare[code] = await compareRegion(code)
  console.log('ok')
}
const table = {
  source: 'AWS Price List Bulk API',
  sourceDocs: 'https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/using-price-list-query-api.html',
  retrievedAt: new Date().toISOString().slice(0, 10),
  currency: 'USD',
  notes: [
    'Valores de referência para fins didáticos, extraídos da AWS Price List na data indicada.',
    'Apenas a primeira faixa de preço de cada item; sem nível gratuito, impostos ou descontos.',
    'Preços mudam: consulte https://aws.amazon.com/s3/pricing/ antes de qualquer decisão real.',
  ],
  regions,
  standardByRegion: compare,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
