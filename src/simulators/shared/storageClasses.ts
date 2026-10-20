/**
 * Classes de armazenamento do Amazon S3 (buckets de uso geral e diretório).
 *
 * Valores conforme "Comparing the Amazon S3 storage classes"
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/storage-class-intro.html
 * (consultado em 16/10/2026).
 */
export type StorageClassId =
  | 'STANDARD'
  | 'INTELLIGENT_TIERING'
  | 'STANDARD_IA'
  | 'ONEZONE_IA'
  | 'EXPRESS_ONEZONE'
  | 'GLACIER_IR'
  | 'GLACIER'
  | 'DEEP_ARCHIVE'

export interface StorageClassInfo {
  id: StorageClassId
  name: string
  shortName: string
  /** Disponibilidade projetada (%), não o SLA. */
  availability: number
  availabilityNote?: string
  /** Quantidade de zonas de disponibilidade em que os dados são armazenados. */
  zones: '>=3' | '1'
  minStorageDays: number
  /** Tamanho mínimo faturável em KB (0 = nenhum). */
  minBillableKB: number
  /** Overhead por objeto arquivado: KB cobrados no Standard e na própria classe. */
  archiveOverheadKB?: { standard: number; self: number }
  retrievalFee: boolean
  access: 'milissegundos' | 'milissegundos (um dígito)' | 'minutos a horas' | 'horas'
  /** Exige restauração antes da leitura. */
  requiresRestore: boolean
  designedFor: string
}

export const STORAGE_CLASSES: Record<StorageClassId, StorageClassInfo> = {
  STANDARD: {
    id: 'STANDARD',
    name: 'S3 Standard',
    shortName: 'Standard',
    availability: 99.99,
    zones: '>=3',
    minStorageDays: 0,
    minBillableKB: 0,
    retrievalFee: false,
    access: 'milissegundos',
    requiresRestore: false,
    designedFor: 'Dados acessados com frequência (mais de uma vez por mês).',
  },
  INTELLIGENT_TIERING: {
    id: 'INTELLIGENT_TIERING',
    name: 'S3 Intelligent-Tiering',
    shortName: 'Intelligent-Tiering',
    availability: 99.9,
    zones: '>=3',
    minStorageDays: 0,
    minBillableKB: 0,
    retrievalFee: false,
    access: 'milissegundos',
    requiresRestore: false,
    designedFor:
      'Padrões de acesso desconhecidos ou variáveis. Cobra monitoramento por objeto; objetos < 128 KB não são monitorados e ficam sempre no tier Frequent Access.',
  },
  STANDARD_IA: {
    id: 'STANDARD_IA',
    name: 'S3 Standard-IA',
    shortName: 'Standard-IA',
    availability: 99.9,
    zones: '>=3',
    minStorageDays: 30,
    minBillableKB: 128,
    retrievalFee: true,
    access: 'milissegundos',
    requiresRestore: false,
    designedFor: 'Dados de longa duração acessados com pouca frequência (cerca de uma vez por mês).',
  },
  ONEZONE_IA: {
    id: 'ONEZONE_IA',
    name: 'S3 One Zone-IA',
    shortName: 'One Zone-IA',
    availability: 99.5,
    zones: '1',
    minStorageDays: 30,
    minBillableKB: 128,
    retrievalFee: true,
    access: 'milissegundos',
    requiresRestore: false,
    designedFor: 'Dados recriáveis e pouco acessados. Não resiste à perda física da zona de disponibilidade.',
  },
  EXPRESS_ONEZONE: {
    id: 'EXPRESS_ONEZONE',
    name: 'S3 Express One Zone',
    shortName: 'Express One Zone',
    availability: 99.95,
    zones: '1',
    minStorageDays: 0,
    minBillableKB: 0,
    retrievalFee: false,
    access: 'milissegundos (um dígito)',
    requiresRestore: false,
    designedFor:
      'Aplicações sensíveis a latência numa única zona de disponibilidade escolhida por você. Usa directory buckets.',
  },
  GLACIER_IR: {
    id: 'GLACIER_IR',
    name: 'S3 Glacier Instant Retrieval',
    shortName: 'Glacier IR',
    availability: 99.9,
    zones: '>=3',
    minStorageDays: 90,
    minBillableKB: 128,
    retrievalFee: true,
    access: 'milissegundos',
    requiresRestore: false,
    designedFor: 'Arquivo de longa duração acessado cerca de uma vez por trimestre, com leitura em milissegundos.',
  },
  GLACIER: {
    id: 'GLACIER',
    name: 'S3 Glacier Flexible Retrieval',
    shortName: 'Glacier Flexible',
    availability: 99.99,
    availabilityNote: 'após a restauração',
    zones: '>=3',
    minStorageDays: 90,
    minBillableKB: 0,
    archiveOverheadKB: { standard: 8, self: 32 },
    retrievalFee: true,
    access: 'minutos a horas',
    requiresRestore: true,
    designedFor: 'Arquivo acessado cerca de uma vez por ano, com recuperação em minutos ou horas.',
  },
  DEEP_ARCHIVE: {
    id: 'DEEP_ARCHIVE',
    name: 'S3 Glacier Deep Archive',
    shortName: 'Deep Archive',
    availability: 99.99,
    availabilityNote: 'após a restauração',
    zones: '>=3',
    minStorageDays: 180,
    minBillableKB: 0,
    archiveOverheadKB: { standard: 8, self: 32 },
    retrievalFee: true,
    access: 'horas',
    requiresRestore: true,
    designedFor: 'Arquivo acessado menos de uma vez por ano, com recuperação em horas.',
  },
}

export const STORAGE_CLASS_ORDER: StorageClassId[] = [
  'STANDARD',
  'EXPRESS_ONEZONE',
  'INTELLIGENT_TIERING',
  'STANDARD_IA',
  'ONEZONE_IA',
  'GLACIER_IR',
  'GLACIER',
  'DEEP_ARCHIVE',
]

/** Durabilidade projetada de todas as classes acima: 99,999999999% (11 noves). */
export const DESIGNED_DURABILITY = '99,999999999%'
