#!/usr/bin/env node
/**
 * Gera a tabela de preços versionada da trilha Arquivos e backup na AWS.
 *
 * Fonte: AWS Price List Bulk API, sem credenciais, ofertas por Região:
 * - AmazonEFS (JSON): armazenamento por classe (Regional e One Zone), leitura
 *   das classes frias, vazão Elastic (leitura e gravação) e Provisioned;
 * - AmazonFSx (JSON): armazenamento e capacidade de vazão de cada tipo de
 *   FSx (Windows File Server, Lustre, NetApp ONTAP e OpenZFS);
 * - AWSBackup (JSON): armazenamento quente e frio dos backups do EFS, cópia
 *   para outra Região, restauração e teste de restauração;
 * - AWSTransfer (JSON): protocolo ligado por hora e dados enviados e baixados.
 *
 * Extrai a primeira faixa paga de cada item (o nível gratuito fica de fora).
 * Se algum preço não for encontrado (ou for ambíguo), o script falha — ele
 * nunca inventa valores.
 *
 * Uso: npm run prices:files
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
/** Região de destino da cópia de backup usada na tabela de cada Região. */
const COPY_TO = { 'us-east-1': 'sa-east-1', 'sa-east-1': 'us-east-1' }
const CACHE = process.env.PRICES_CACHE
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/pricing/files-prices.json')

const PREFIXES = { 'us-east-1': 'USE1-', 'sa-east-1': 'SAE1-' }
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

/** Dimensões sob demanda de uma oferta em JSON, com o usagetype sem o prefixo da Região e os atributos do produto. */
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
  /** Preço do usagetype, opcionalmente filtrado por atributos do produto (ex.: operation, fileSystemType). */
  const pick = (label, usage, attrs = {}) =>
    firstPaid(
      `${offer} ${label} (${usage})`,
      dims.filter((d) => d.usage === usage && Object.entries(attrs).every(([k, v]) => d.attrs[k] === v)),
    )
  return { publicationDate: data.publicationDate, url: BASE + path, pick }
}

async function region(code) {
  prefix = PREFIXES[code]
  const other = COPY_TO[code]
  const efs = await jsonOffer('AmazonEFS', code)
  const fsx = await jsonOffer('AmazonFSx', code)
  const bkp = await jsonOffer('AWSBackup', code)
  const xfer = await jsonOffer('AWSTransfer', code)
  const win = (deploymentOption, extra = {}) => ({ fileSystemType: 'Windows', deploymentOption, ...extra })
  return {
    label: REGIONS[code],
    offers: { AmazonEFS: efs.publicationDate, AmazonFSx: fsx.publicationDate, AWSBackup: bkp.publicationDate, AWSTransfer: xfer.publicationDate },
    efs: {
      /** Por GB-mês. */
      standard: efs.pick('Standard Regional', 'TimedStorage-ByteHrs'),
      standardOneZone: efs.pick('Standard One Zone', 'TimedStorage-Z-ByteHrs'),
      /** Infrequent Access com vazão Bursting ou Provisioned. */
      ia: efs.pick('Infrequent Access', 'IATimedStorage-ByteHrs'),
      /** Infrequent Access com vazão Elastic. */
      iaElastic: efs.pick('Infrequent Access com Elastic', 'IATimedStorage-ET-ByteHrs'),
      iaOneZone: efs.pick('Infrequent Access One Zone', 'IATimedStorage-Z-ByteHrs'),
      archive: efs.pick('Archive', 'ArchiveTimedStorage-ByteHrs'),
      /** Por GB lido. */
      iaRead: efs.pick('leitura do Infrequent Access', 'IADataAccess-Bytes', { operation: 'Read' }),
      archiveRead: efs.pick('leitura do Archive', 'ArchiveDataAccess-Bytes', { operation: 'Read' }),
      /** Vazão Elastic, por GB lido ou gravado. */
      elasticRead: efs.pick('Elastic, leitura', 'ETDataAccess-Bytes', { operation: 'Read' }),
      elasticWrite: efs.pick('Elastic, gravação', 'ETDataAccess-Bytes', { operation: 'Write' }),
      /** Vazão Provisioned, por MiB/s-mês acima da base incluída. */
      provisionedMiBpsMonth: efs.pick('Provisioned', 'ProvisionedTP-MiBpsHrs'),
    },
    fsx: {
      /** Armazenamento por GB-mês e capacidade de vazão por MBps-mês. */
      windows: {
        ssdSingleAz: fsx.pick('Windows SSD Single-AZ', 'Storage', win('Single-AZ', { storageType: 'SSD' })),
        ssdMultiAz: fsx.pick('Windows SSD Multi-AZ', 'Storage.MultiAZ:SSD', win('Multi-AZ')),
        hddSingleAz: fsx.pick('Windows HDD Single-AZ', 'Storage:HDD', win('Single-AZ')),
        hddMultiAz: fsx.pick('Windows HDD Multi-AZ', 'Storage.MultiAZ:HDD', win('Multi-AZ')),
        throughputSingleAz: fsx.pick('Windows vazão Single-AZ', 'ThroughputCapacity', win('Single-AZ')),
        throughputMultiAz: fsx.pick('Windows vazão Multi-AZ', 'ThroughputCapacity.MultiAZ', win('Multi-AZ')),
      },
      lustre: {
        scratchSsd: fsx.pick('Lustre scratch', 'Storage', { fileSystemType: 'Lustre', deploymentOption: 'Single-AZ' }),
        persistentSsd125: fsx.pick('Lustre persistente SSD 125 MBps/TiB', 'Storage.SSD.125', { fileSystemType: 'Lustre' }),
        persistentHdd12: fsx.pick('Lustre persistente HDD 12 MBps/TiB', 'Storage.HDD.12', { fileSystemType: 'Lustre' }),
      },
      ontap: {
        ssdSingleAz: fsx.pick('ONTAP SSD Single-AZ', 'Storage.SAZ_2N:SSD', { fileSystemType: 'ONTAP' }),
        ssdMultiAz: fsx.pick('ONTAP SSD Multi-AZ', 'Storage.MAZ:SSD', { fileSystemType: 'ONTAP' }),
        capacityPoolSingleAz: fsx.pick('ONTAP capacity pool Single-AZ', 'Storage.SAZ_2N:CPoolStd', { fileSystemType: 'ONTAP' }),
        capacityPoolMultiAz: fsx.pick('ONTAP capacity pool Multi-AZ', 'Storage.MAZ:CPoolStd', { fileSystemType: 'ONTAP' }),
        throughputSingleAz: fsx.pick('ONTAP vazão Single-AZ', 'ThroughputCapacity.SAZ_2N', { fileSystemType: 'ONTAP' }),
        throughputMultiAz: fsx.pick('ONTAP vazão Multi-AZ', 'ThroughputCapacity.MAZ', { fileSystemType: 'ONTAP' }),
      },
      openzfs: {
        ssdSingleAz: fsx.pick('OpenZFS SSD Single-AZ', 'Storage.SAZ:SSD', { fileSystemType: 'OpenZFS' }),
        ssdMultiAz: fsx.pick('OpenZFS SSD Multi-AZ', 'Storage.MAZ:SSD', { fileSystemType: 'OpenZFS' }),
        throughputSingleAz: fsx.pick('OpenZFS vazão Single-AZ', 'ThroughputCapacity.SAZ', { fileSystemType: 'OpenZFS' }),
        throughputMultiAz: fsx.pick('OpenZFS vazão Multi-AZ', 'ThroughputCapacity.MAZ', { fileSystemType: 'OpenZFS' }),
      },
    },
    backup: {
      /** Backups do EFS por GB-mês, nos cofres comuns. */
      efsWarm: bkp.pick('EFS quente', 'WarmStorage-ByteHrs-EFS', { vaulttype: 'BackupVault' }),
      efsCold: bkp.pick('EFS frio', 'ColdStorage-ByteHrs-EFS', { vaulttype: 'BackupVault' }),
      /** Cópia para outra Região, por GB copiado. */
      efsCrossRegion: bkp.pick(`cópia do EFS para ${other}`, `${PREFIXES[other].slice(0, -1)}-CrossRegion-WarmBytes-EFS`, { toRegionCode: other }),
      /** Restauração por GB restaurado. */
      efsRestoreWarm: bkp.pick('restauração do EFS quente', 'Restore-WarmBytes-EFS'),
      efsRestoreCold: bkp.pick('restauração do EFS frio', 'Restore-ColdBytes-EFS'),
      /** Teste de restauração, por ponto de recuperação testado. */
      restoreTest: bkp.pick('teste de restauração', 'RT-RecoveryPoint-FixedFee'),
    },
    transfer: {
      /** Cada protocolo ligado num servidor, por hora. */
      protocolHour: xfer.pick('protocolo por hora', 'ProtocolHours', { operation: 'SFTP:S3' }),
      uploadGB: xfer.pick('envio por GB', 'UploadBytes', { operation: 'SFTP:S3' }),
      downloadGB: xfer.pick('download por GB', 'DownloadBytes', { operation: 'SFTP:S3' }),
    },
    sourceUrls: [efs.url, fsx.url, bkp.url, xfer.url],
  }
}

const regions = {}
for (const code of Object.keys(REGIONS)) {
  process.stdout.write(`Lendo preços de arquivos e backup de ${code}… `)
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
    'O EFS Infrequent Access tem um preço com vazão Elastic e outro com vazão Bursting ou Provisioned.',
    'A vazão Provisioned do EFS cobra só o que passa da base incluída pelo armazenamento na classe Standard.',
    'Preços mudam: consulte as páginas de preço de cada serviço antes de qualquer decisão real.',
  ],
  regions,
}
await writeFile(OUT, JSON.stringify(table, null, 2) + '\n')
console.log(`Tabela gravada em ${OUT}`)
