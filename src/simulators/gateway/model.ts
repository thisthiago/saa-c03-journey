/**
 * Modelo de escolha de AWS Storage Gateway: compatibilidade de protocolo, onde os dados
 * ficam e quais requisitos cada tipo atende.
 *
 * Conferido em 16/10/2026:
 *  - https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html (NFS v3/4.1, SMB 2/3; arquivos como objetos no S3)
 *  - https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html (iSCSI; cached × stored; snapshots)
 *  - https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html (fitas virtuais; arquivo em Glacier Flexible/Deep Archive)
 *  - https://docs.aws.amazon.com/filegateway/latest/filefsxw/DocumentHistory.html (FSx File Gateway sem novos clientes desde 28/10/2024)
 *
 * Simplificações: não considera tamanho de cache, banda, cotas nem o comportamento detalhado
 * durante quedas de conexão.
 */

export type GatewayChoice = 's3-file' | 'fsx-file' | 'volume-cached' | 'volume-stored' | 'tape'
export type Protocol = 'NFS' | 'SMB' | 'iSCSI' | 'VTL'

export interface GatewayInfo {
  id: GatewayChoice
  name: string
  protocols: Protocol[]
  target: string
  newCustomers: boolean
}

export const GATEWAYS: Record<GatewayChoice, GatewayInfo> = {
  's3-file': { id: 's3-file', name: 'Amazon S3 File Gateway', protocols: ['NFS', 'SMB'], target: 'Arquivos gravados como objetos no Amazon S3 (com cache local).', newCustomers: true },
  'fsx-file': { id: 'fsx-file', name: 'Amazon FSx File Gateway', protocols: ['SMB'], target: 'Compartilhamentos do Amazon FSx for Windows File Server.', newCustomers: false },
  'volume-cached': { id: 'volume-cached', name: 'Volume Gateway — cached volumes', protocols: ['iSCSI'], target: 'Dados primários no Amazon S3; só os dados mais usados ficam no cache local. Snapshots como snapshots do Amazon EBS.', newCustomers: true },
  'volume-stored': { id: 'volume-stored', name: 'Volume Gateway — stored volumes', protocols: ['iSCSI'], target: 'Todos os dados ficam no local; snapshots assíncronos vão para a AWS como snapshots do Amazon EBS.', newCustomers: true },
  tape: { id: 'tape', name: 'Tape Gateway', protocols: ['VTL'], target: 'Fitas virtuais no Amazon S3, arquivadas em S3 Glacier Flexible Retrieval ou Deep Archive.', newCustomers: true },
}

export interface Workload {
  id: string
  name: string
  description: string
  protocol: Protocol
  /** O cliente ainda não usa Storage Gateway (conta nova para o serviço). */
  newCustomer: boolean
  needs: {
    /** Baixa latência para o conjunto de dados inteiro, no local. */
    fullLocal?: boolean
    /** Pouco espaço em disco no local. */
    limitedLocal?: boolean
    /** Aplicações na AWS precisam ler os dados como objetos no S3. */
    s3Objects?: boolean
  }
  concepts?: string[]
}

export interface GatewayVerdict {
  ok: boolean
  reasons: string[]
}

export function checkGateway(w: Workload, g: GatewayChoice): GatewayVerdict {
  const info = GATEWAYS[g]
  const reasons: string[] = []
  if (!info.protocols.includes(w.protocol)) reasons.push(`${info.name} não atende ${w.protocol} (atende ${info.protocols.join(' e ')}).`)
  if (!info.newCustomers && w.newCustomer) reasons.push(`${info.name} não está disponível para novos clientes desde 28/10/2024.`)
  if (w.needs.fullLocal && g === 'volume-cached') reasons.push('Cached volumes guardam no local só os dados mais usados; o restante vem da AWS.')
  if (w.needs.limitedLocal && g === 'volume-stored') reasons.push('Stored volumes exigem espaço local para todo o conjunto de dados.')
  if (w.needs.s3Objects && g !== 's3-file') reasons.push('Só o S3 File Gateway grava os arquivos como objetos que aplicações na AWS leem direto no S3.')
  return { ok: reasons.length === 0, reasons }
}

export const PROTOCOL_LABEL: Record<Protocol, string> = { NFS: 'NFS (compartilhamento de arquivos Linux/Unix)', SMB: 'SMB (compartilhamento de arquivos Windows)', iSCSI: 'iSCSI (volumes em bloco)', VTL: 'VTL (biblioteca de fitas virtual, via iSCSI)' }
