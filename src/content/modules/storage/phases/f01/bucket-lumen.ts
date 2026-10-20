/** Bucket fictício do Estúdio Lumen usado nos laboratórios da Fase 1. */
import type { BucketData, S3ObjectData } from '../../../../../simulators/bucket/model'

const KB = 1024
const MB = 1024 * KB
const GB = 1024 * MB

function o(key: string, sizeBytes: number, contentType: string, lastModified: string, extra: Partial<S3ObjectData> = {}): S3ObjectData {
  // ETag ilustrativo derivado da key (não é um MD5 real).
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return {
    key,
    sizeBytes,
    contentType,
    lastModified,
    etag: `"${h.toString(16).padStart(8, '0')}${(h ^ 0x5bd1e995).toString(16).padStart(8, '0')}"`,
    storageClass: 'STANDARD',
    ...extra,
  }
}

export const LUMEN_BUCKET: BucketData = {
  name: 'lumen-acervo-prod',
  region: 'sa-east-1',
  accountId: '111122223333',
  objects: [
    o('site/produtos/cadeira-aurora.jpg', 245 * KB, 'image/jpeg', '2026-09-02T14:10:00Z', { userMetadata: { produto: 'cadeira-aurora' }, tags: { visibilidade: 'publica' } }),
    o('site/produtos/luminaria-sol.jpg', 312 * KB, 'image/jpeg', '2026-09-02T14:11:00Z', { userMetadata: { produto: 'luminaria-sol' }, tags: { visibilidade: 'publica' } }),
    o('site/produtos/mesa-brisa.webp', 180 * KB, 'image/webp', '2026-09-03T09:00:00Z', { userMetadata: { produto: 'mesa-brisa' }, tags: { visibilidade: 'publica' } }),
    o('ensaios/2026/casamento-ana-leo/foto-0001.raw', 48 * MB, 'application/octet-stream', '2026-08-20T21:40:00Z', { userMetadata: { cliente: 'ana-e-leo', fotografia: 'rita' } }),
    o('ensaios/2026/casamento-ana-leo/foto-0002.raw', 51 * MB, 'application/octet-stream', '2026-08-20T21:41:00Z', { userMetadata: { cliente: 'ana-e-leo', fotografia: 'rita' } }),
    o('ensaios/2026/aniversario-davi/album.zip', Math.round(2.3 * GB), 'application/zip', '2026-07-11T18:00:00Z', { userMetadata: { cliente: 'familia-davi' } }),
    o('ensaios/2025/formatura-turma-b/album.zip', Math.round(1.8 * GB), 'application/zip', '2025-12-15T10:30:00Z', { userMetadata: { cliente: 'turma-b' }, storageClass: 'STANDARD_IA' }),
    o('contratos/2026/contrato-ana-leo.pdf', 220 * KB, 'application/pdf', '2026-05-04T13:00:00Z', { userMetadata: { cliente: 'ana-e-leo' }, tags: { confidencial: 'sim' } }),
    o('contratos/2026/contrato-familia-davi.pdf', 198 * KB, 'application/pdf', '2026-06-01T16:20:00Z', { userMetadata: { cliente: 'familia-davi' }, tags: { confidencial: 'sim' } }),
    o('backups/catalogo/2026-10-15.sql.gz', 830 * MB, 'application/gzip', '2026-10-15T03:00:00Z', { tags: { retencao: '1-ano' } }),
    o('processamento/entrada/lote-0412.csv', 12 * MB, 'text/csv', '2026-10-14T22:00:00Z'),
    o('processamento/saida/lote-0412.parquet', 4 * MB, 'application/vnd.apache.parquet', '2026-10-14T22:07:00Z'),
    o('leia-me.txt', 2 * KB, 'text/plain', '2026-01-10T12:00:00Z'),
  ],
}
