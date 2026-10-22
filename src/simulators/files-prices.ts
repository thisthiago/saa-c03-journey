/**
 * Tabela de preços da trilha Arquivos e backup na AWS (gerada por
 * scripts/fetch-files-prices.mjs a partir da AWS Price List).
 *
 * EFS (classes de armazenamento, leitura das classes frias, vazão Elastic e
 * Provisioned), FSx (armazenamento e vazão de cada tipo), AWS Backup
 * (backups do EFS, cópia entre Regiões e restauração) e Transfer Family
 * (protocolo por hora e dados), na primeira faixa paga. Sem nível gratuito,
 * impostos nem descontos por volume.
 */
import table from '../content/pricing/files-prices.json'

export interface FilesRegionPrices {
  label: string
  offers: Record<string, string>
  /** Armazenamento por GB-mês; leituras e vazão Elastic por GB; Provisioned por MiB/s-mês. */
  efs: {
    standard: number
    standardOneZone: number
    ia: number
    iaElastic: number
    iaOneZone: number
    archive: number
    iaRead: number
    archiveRead: number
    elasticRead: number
    elasticWrite: number
    provisionedMiBpsMonth: number
  }
  /** Armazenamento por GB-mês e vazão por MBps-mês. */
  fsx: {
    windows: { ssdSingleAz: number; ssdMultiAz: number; hddSingleAz: number; hddMultiAz: number; throughputSingleAz: number; throughputMultiAz: number }
    lustre: { scratchSsd: number; persistentSsd125: number; persistentHdd12: number }
    ontap: { ssdSingleAz: number; ssdMultiAz: number; capacityPoolSingleAz: number; capacityPoolMultiAz: number; throughputSingleAz: number; throughputMultiAz: number }
    openzfs: { ssdSingleAz: number; ssdMultiAz: number; throughputSingleAz: number; throughputMultiAz: number }
  }
  /** Backups do EFS por GB-mês; cópia e restauração por GB; teste por ponto de recuperação. */
  backup: { efsWarm: number; efsCold: number; efsCrossRegion: number; efsRestoreWarm: number; efsRestoreCold: number; restoreTest: number }
  /** Protocolo por hora; dados por GB. */
  transfer: { protocolHour: number; uploadGB: number; downloadGB: number }
  sourceUrls: string[]
}

export interface FilesPriceTable {
  source: string
  sourceDocs: string
  retrievedAt: string
  currency: 'USD'
  notes: string[]
  regions: Record<string, FilesRegionPrices>
}

export const FILES_PRICES = table as unknown as FilesPriceTable

export const FILES_REGION = 'us-east-1'

/** Data da tabela no formato dd/mm/aaaa, para os selos da interface. */
export const FILES_PRICE_DATE = FILES_PRICES.retrievedAt.split('-').reverse().join('/')

export function filesPrices(region: string = FILES_REGION): FilesRegionPrices {
  const r = FILES_PRICES.regions[region]
  if (!r) throw new Error(`Região sem preços de arquivos e backup: ${region}`)
  return r
}
