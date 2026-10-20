/**
 * Conceitos da Fase 11 — Transferência de grandes volumes.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const SNOW = { title: 'AWS Snowball Edge availability change', url: 'https://docs.aws.amazon.com/snowball/latest/developer-guide/snowball-edge-availability-change.html' }
const DATASYNC = { title: 'What is AWS DataSync?', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/what-is-datasync.html' }
const TIMELINES = { title: 'Estimating timelines for large migrations', url: 'https://docs.aws.amazon.com/datasync/latest/userguide/datasync-large-migration-timelines.html' }
const HOSTED = { title: 'AWS Direct Connect hosted connections', url: 'https://docs.aws.amazon.com/directconnect/latest/UserGuide/hosted_connection.html' }
const DTT = { title: 'What is Data Transfer Terminal?', url: 'https://docs.aws.amazon.com/datatransferterminal/latest/userguide/what-is-dtt.html' }
const OUTPOSTS = { title: 'What is AWS Outposts?', url: 'https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html' }
const TA = { title: 'Configuring fast, secure file transfers using Amazon S3 Transfer Acceleration', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html' }

export const F11_CONCEPTS: ConceptDef[] = [
  {
    id: 'mig.network-math',
    title: 'Quanto tempo pela rede?',
    officialName: 'Network transfer time',
    serviceIds: ['aws.datasync'],
    summary: 'Tempo ≈ volume × 8 ÷ (banda utilizável × aproveitamento). 100 TB num link de 1 Gbps com 80% de aproveitamento levam cerca de **11,6 dias**. Faça a conta antes de escolher.',
    recommendations: ['Considere quanto do link pode ser usado sem prejudicar o negócio e se os dados continuam mudando até a virada.'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [TIMELINES],
    tags: ['migracao'],
  },
  {
    id: 'mig.datasync',
    title: 'AWS DataSync',
    officialName: 'AWS DataSync',
    serviceIds: ['aws.datasync'],
    summary: 'Serviço de transferência **online** entre armazenamento local (NFS, SMB, HDFS, armazenamento de objetos), outras nuvens e serviços da AWS (S3, EFS, FSx), com transferência **incremental**, validação e criptografia.',
    facts: ['Uma única tarefa do DataSync consegue usar totalmente um link de 10 Gbps.', 'Preserva permissões e metadados ao copiar entre S3, EFS e FSx.'],
    exam: { domains: ['d3', 'd2'], relevance: 'alta' },
    references: [DATASYNC, SNOW],
    tags: ['migracao'],
  },
  {
    id: 'mig.direct-connect',
    title: 'Direct Connect para migrações',
    officialName: 'AWS Direct Connect hosted connection',
    serviceIds: ['aws.datasync'],
    summary: 'Quando o link de internet não basta, uma **conexão hospedada do AWS Direct Connect**, contratada de um parceiro pelo período do projeto, aumenta a banda e a confiabilidade da migração com DataSync.',
    exam: { domains: ['d3'], relevance: 'media' },
    references: [HOSTED, SNOW],
    tags: ['migracao'],
  },
  {
    id: 'mig.transfer-terminal',
    title: 'AWS Data Transfer Terminal',
    officialName: 'AWS Data Transfer Terminal',
    serviceIds: ['aws.datasync'],
    summary: 'Local físico, reservado pelo console, onde você leva **seus próprios dispositivos** de armazenamento e envia os dados à AWS por uma conexão de alta velocidade.',
    facts: ['No momento, o Data Transfer Terminal está disponível apenas para clientes AWS Enterprise Support.', 'O endereço da instalação é informado depois que a reserva é feita.'],
    exam: { domains: ['d3'], relevance: 'baixa', notes: 'Serviço recente; questões antigas não o mencionam.' },
    references: [DTT, SNOW],
    tags: ['migracao'],
  },
  {
    id: 'mig.snow-legacy',
    title: 'AWS Snow Family (legado)',
    officialName: 'AWS Snow Family / AWS Snowball Edge',
    serviceIds: ['aws.snowball-edge'],
    summary: 'Dispositivos físicos para transferência offline e computação na borda. **A AWS não oferece mais dispositivos da Snow Family a novos clientes**; clientes atuais continuam atendidos.',
    availability: {
      kind: 'no-new-customers',
      note: 'Clientes existentes não são afetados. A AWS recomenda avaliar as alternativas.',
      alternatives: ['AWS DataSync (online, com ou sem Direct Connect)', 'AWS Data Transfer Terminal (físico)', 'Soluções de parceiros no AWS Marketplace', 'AWS Outposts (computação na borda)'],
    },
    exam: { domains: ['d3'], relevance: 'media', notes: 'O SAA-C03 e materiais antigos citam Snowball e Snowmobile como opções; hoje, para novos clientes, use as alternativas.' },
    references: [SNOW],
    tags: ['migracao'],
  },
  {
    id: 'mig.outposts',
    title: 'AWS Outposts na borda',
    officialName: 'AWS Outposts',
    serviceIds: ['aws.datasync'],
    summary: 'Infraestrutura da AWS no local do cliente (servidores 2U ou racks 42U), gerenciada pela AWS. É a alternativa indicada ao Snowball Edge Compute Optimized para computação na borda.',
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [OUTPOSTS, SNOW],
    tags: ['hibrido'],
  },
  {
    id: 's3.transfer-acceleration',
    title: 'S3 Transfer Acceleration',
    officialName: 'Amazon S3 Transfer Acceleration',
    serviceIds: ['aws.s3', 'aws.cloudfront'],
    summary: 'Acelera uploads e downloads **de longa distância** usando as edge locations do Amazon CloudFront. Útil para clientes espalhados pelo mundo enviando para um bucket central.',
    limitations: ['Não aumenta a banda do seu link: ajuda quando a distância e a rota pela internet são o gargalo.'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [TA],
    tags: ['desempenho', 'migracao'],
  },
]
