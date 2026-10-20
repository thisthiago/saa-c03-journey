/**
 * Conceitos da Fase 10 — Armazenamento híbrido com AWS Storage Gateway.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const S3FILE = { title: 'What is Amazon S3 File Gateway?', url: 'https://docs.aws.amazon.com/filegateway/latest/files3/what-is-file-s3.html' }
const VGW = { title: 'What is Volume Gateway?', url: 'https://docs.aws.amazon.com/storagegateway/latest/vgw/WhatIsStorageGateway.html' }
const TGW = { title: 'What is Tape Gateway?', url: 'https://docs.aws.amazon.com/storagegateway/latest/tgw/WhatIsStorageGateway.html' }
const FSXGW = { title: 'Document history for the Amazon FSx File Gateway User Guide', url: 'https://docs.aws.amazon.com/filegateway/latest/filefsxw/DocumentHistory.html' }

export const F10_CONCEPTS: ConceptDef[] = [
  {
    id: 'sgw.overview',
    title: 'AWS Storage Gateway',
    officialName: 'AWS Storage Gateway',
    serviceIds: ['aws.storage-gateway'],
    summary: 'Um appliance (máquina virtual, hardware ou instância EC2) que liga aplicações locais ao armazenamento da AWS usando protocolos que elas já conhecem: arquivos (NFS/SMB), blocos (iSCSI) ou fitas (VTL).',
    facts: ['Pode rodar como VM em VMware ESXi, KVM, Microsoft Hyper-V ou Nutanix AHV, como appliance de hardware ou como instância Amazon EC2.'],
    exam: { domains: ['d2', 'd3'], relevance: 'alta' },
    references: [VGW, S3FILE],
    tags: ['hibrido'],
    reviewItems: [
      {
        id: 'rv:sgw.overview:protocolo',
        kind: 'decision',
        title: 'Pelo protocolo',
        prompt: 'Um servidor local precisa de um **volume em bloco iSCSI** com dados guardados na AWS. Qual família de gateway?',
        concepts: [{ id: 'sgw.overview' }],
        xp: 5,
        difficulty: 1,
        explanation: ['Disco em bloco (iSCSI) usa o Volume Gateway; arquivos (NFS/SMB), o S3 File Gateway; fitas virtuais (VTL), o Tape Gateway.'],
        options: [
          { id: 'a', text: 'Volume Gateway', correct: true, consequence: 'Cached ou stored, conforme latência e espaço local.' },
          { id: 'b', text: 'S3 File Gateway', correct: false, consequence: 'Ele oferece compartilhamentos NFS e SMB, não volumes em bloco.' },
          { id: 'c', text: 'Tape Gateway', correct: false, consequence: 'Ele emula uma biblioteca de fitas para software de backup.' },
        ],
      },
    ],
  },
  {
    id: 'sgw.s3-file',
    title: 'S3 File Gateway',
    officialName: 'Amazon S3 File Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.s3'],
    summary: 'Compartilhamentos **NFS** (v3 e 4.1) e **SMB** (2 e 3) cujos arquivos viram **objetos no S3**, com cache local. Aplicações na AWS leem os mesmos dados direto no bucket, e as políticas do S3 (lifecycle, versionamento) se aplicam.',
    exam: { domains: ['d2', 'd3'], relevance: 'alta' },
    references: [S3FILE],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.fsx-file',
    title: 'FSx File Gateway',
    officialName: 'Amazon FSx File Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.fsx'],
    summary: 'Acesso local, com cache, a compartilhamentos do Amazon FSx for Windows File Server. **Não está disponível para novos clientes desde 28/10/2024.**',
    availability: {
      kind: 'no-new-customers',
      since: '28/10/2024',
      note: 'Clientes existentes continuam usando normalmente. Para novos projetos, a AWS indica alternativas com capacidades semelhantes.',
      alternatives: ['Amazon FSx for Windows File Server acessado diretamente', 'Amazon S3 File Gateway (SMB), quando os dados podem ficar como objetos no S3'],
    },
    exam: { domains: ['d2'], relevance: 'baixa', notes: 'Questões antigas podem citar o FSx File Gateway como opção atual.' },
    references: [FSXGW],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.volume-cached',
    title: 'Volume Gateway — cached volumes',
    officialName: 'Volume Gateway cached volumes',
    serviceIds: ['aws.storage-gateway', 'aws.ebs'],
    summary: 'Volumes **iSCSI** cujos dados primários ficam no **S3**; o local guarda só os dados mais acessados. Economiza armazenamento local.',
    facts: ['Snapshots dos volumes ficam na AWS como snapshots do Amazon EBS.'],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [VGW],
    tags: ['hibrido'],
  },
  {
    id: 'sgw.volume-stored',
    title: 'Volume Gateway — stored volumes',
    officialName: 'Volume Gateway stored volumes',
    serviceIds: ['aws.storage-gateway', 'aws.ebs'],
    summary: 'Volumes **iSCSI** com **todos os dados no local** e snapshots assíncronos enviados à AWS. Baixa latência para o conjunto inteiro e cópia externa barata, que pode ser restaurada no Amazon EC2.',
    comparisons: [{ with: 'sgw.volume-cached', text: 'Stored: tudo no local, backup na AWS. Cached: tudo na AWS, só o mais usado no local.' }],
    exam: { domains: ['d2'], relevance: 'alta' },
    references: [VGW],
    tags: ['hibrido', 'recuperacao'],
  },
  {
    id: 'sgw.tape',
    title: 'Tape Gateway',
    officialName: 'Tape Gateway',
    serviceIds: ['aws.storage-gateway', 'aws.s3'],
    summary: 'Uma **biblioteca de fitas virtual (VTL)** para o software de backup existente. As fitas ficam no S3 e podem ser arquivadas em **S3 Glacier Flexible Retrieval** ou **Deep Archive**.',
    useCases: ['Substituir fitas físicas sem mudar o software de backup'],
    exam: { domains: ['d2', 'd4'], relevance: 'alta' },
    references: [TGW],
    tags: ['hibrido'],
  },
]
