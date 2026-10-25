/**
 * Conceitos da Fase 9 — Requester Pays e cenários especiais.
 * Fatos conferidos em 16/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const RP = { title: 'Using Requester Pays general purpose buckets', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/RequesterPaysBuckets.html' }
const DL = { title: 'Downloading objects from Requester Pays buckets', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/ObjectsinRequesterPaysBuckets.html' }
const REQ = { title: 'Requirements and considerations for replication', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-requirements.html' }
const PRICING = { title: 'Amazon S3 pricing', url: 'https://aws.amazon.com/s3/pricing/' }

export const F09_CONCEPTS: ConceptDef[] = [
  {
    id: 'rp.basics',
    title: 'Requester Pays',
    officialName: 'Requester Pays buckets',
    serviceIds: ['aws.s3'],
    summary: 'Num bucket **Requester Pays**, quem faz a requisição paga a **requisição** e o **download**; o dono continua pagando o **armazenamento**. Útil para compartilhar grandes datasets.',
    explanation: [
      'Exemplo: um instituto de pesquisa publica 200 TB de imagens de satélite para pesquisadores de outras instituições. Com Requester Pays, cada pesquisador paga as próprias requisições e downloads, e o instituto paga só o armazenamento.',
    ],
    useCases: ['Datasets públicos de pesquisa, dados geoespaciais, bases de referência'],
    facts: ['O dono do bucket sempre paga o armazenamento.', 'Requester Pays não concede acesso: o requisitante ainda precisa de permissão.'],
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Sinal: "compartilhar um grande dataset com outras contas AWS sem pagar pelos downloads delas". Se o público não tem conta AWS, o Requester Pays não serve.',
    },
    references: [RP],
    tags: ['custos'],
  },
  {
    id: 'rp.header',
    title: 'Aceitar a cobrança',
    officialName: 'x-amz-request-payer',
    serviceIds: ['aws.s3'],
    summary: 'Requisitantes precisam **aceitar a cobrança** com o cabeçalho `x-amz-request-payer` (ou `--request-payer` na CLI). Requisições **anônimas** não são aceitas — é preciso identificar quem paga.',
    facts: ['O dono do bucket não precisa enviar o cabeçalho.', 'Buckets Requester Pays não aceitam requisições anônimas nem SOAP.'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [RP, DL],
    tags: ['custos'],
  },
  {
    id: 'rp.assumed-role',
    title: 'Papel assumido',
    officialName: 'Requester Pays with assumed IAM roles',
    serviceIds: ['aws.s3', 'aws.iam'],
    summary: 'Quando o requisitante assume um **papel IAM** antes da requisição, paga a **conta dona do papel** — não a conta de quem o assumiu.',
    exam: { domains: ['d4'], relevance: 'baixa' },
    references: [RP],
    tags: ['custos'],
  },
  {
    id: 'rp.403',
    title: 'Erros 403 e restauração',
    officialName: 'Requester Pays charge details',
    serviceIds: ['aws.s3'],
    summary: 'Um **403 iniciado dentro da conta ou da organização do dono** é cobrado do dono. Em **RestoreObject**, o requisitante paga a requisição e o **dono paga a recuperação**.',
    exam: { domains: ['d4'], relevance: 'baixa' },
    references: [RP],
    tags: ['custos'],
  },
  {
    id: 'rp.limits',
    title: 'Quando não usar Requester Pays',
    officialName: 'Requester Pays limitations',
    serviceIds: ['aws.s3'],
    summary: 'Requester Pays não serve para **público anônimo** (sites, downloads abertos), não pode ser **bucket de logs** de outro bucket Requester Pays (nem o contrário) e não pode ser **destino de replicação entre contas**.',
    recommendations: ['Para distribuir conteúdo a usuários sem conta AWS, avalie Amazon CloudFront em vez de Requester Pays.'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [RP, REQ],
    tags: ['custos'],
  },
  {
    id: 's3.data-transfer',
    title: 'Transferência de dados para a internet',
    officialName: 'Data transfer out to the internet',
    serviceIds: ['aws.s3'],
    summary: 'Baixar dados do S3 pela internet é cobrado por GB (com faixas que barateiam por volume). Em datasets muito baixados, a transferência pode custar mais que o armazenamento.',
    explanation: [
      'Gravar no S3 a partir da internet não custa transferência, mas cada GB que sai para a internet é cobrado. Em sites e aplicativos com muitos downloads, essa parcela cresce junto com o sucesso do produto.',
      'Exemplo: um aplicativo distribui vídeos de 50 MB a 100 mil usuários por mês, cerca de 5 TB baixados. Mesmo que os vídeos ocupem poucos GB no bucket, a conta é dominada pela transferência.',
      '**Regra prática:** quando a conta do S3 é dominada por downloads, ataque a transferência, e não a classe de armazenamento.',
    ],
    comparisons: [
      { with: 'rp.basics', text: 'O Requester Pays passa o custo das requisições e dos downloads para quem baixa, desde que essa pessoa tenha conta AWS.' },
    ],
    exam: {
      domains: ['d4'],
      relevance: 'alta',
      notes: 'Em questões de custo com muitos downloads pela internet, trocar a classe de armazenamento não reduz a parcela que pesa. As alternativas costumam envolver o cache na borda com o CloudFront, que reduz as idas à origem, ou passar o custo ao requisitante com o Requester Pays.',
    },
    references: [PRICING],
    tags: ['custos'],
  },
]
