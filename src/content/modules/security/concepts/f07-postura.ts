/**
 * Conceitos da Fase 7 — Postura de segurança e conformidade.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_SEC_CONCEPTS: ConceptDef[] = [
  {
    id: 'shub.cspm',
    title: 'Security Hub CSPM',
    officialName: 'AWS Security Hub Cloud Security Posture Management (CSPM)',
    serviceIds: ['aws.security-hub', 'aws.config'],
    summary: 'O **Security Hub CSPM** confere as contas contra **padrões de segurança** e gera um achado para cada **controle** que falha, como `[S3.8] S3 general purpose buckets should block public access`. Ele também **recebe os achados** do GuardDuty, do Inspector e do Macie, num formato único. Para a maioria dos controles, o **AWS Config precisa estar ligado** e gravando.',
    facts: [
      'O Security Hub CSPM só reúne achados gerados depois de ser ligado, e só na Região em que foi ligado.',
      'Ele calcula uma nota de segurança por padrão ligado.',
      'Na primeira ativação, há um teste gratuito de 30 dias.',
    ],
    commonMistakes: ['Ligar o Security Hub CSPM sem o AWS Config e esperar os achados dos controles'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.shubCspm, R.shubS3],
    tags: ['seguranca'],
  },
  {
    id: 'shub.security-hub',
    title: 'Security Hub e Security Hub CSPM',
    officialName: 'AWS Security Hub and AWS Security Hub CSPM',
    serviceIds: ['aws.security-hub'],
    summary: 'Hoje são dois serviços que se completam. O **Security Hub CSPM** (o antigo Security Hub) faz as checagens de postura. O **Security Hub** recebe esses achados, **correlaciona** com os do Inspector, do GuardDuty e do Macie para apontar as **exposições** mais críticas e oferece fluxos de resposta. A AWS recomenda ligar os dois.',
    facts: ['Sem o Security Hub CSPM ligado, o Security Hub não usa os achados de postura para apontar riscos.', 'A lista de serviços do exame cita apenas "AWS Security Hub".'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.shubBoth],
    tags: ['seguranca'],
  },
  {
    id: 'shub.standards',
    title: 'Padrões e controles',
    officialName: 'Security standards and controls',
    serviceIds: ['aws.security-hub'],
    summary: 'Um **padrão** é um conjunto de **controles**, cada um uma boa prática checada sozinha. O Security Hub CSPM oferece o **AWS Foundational Security Best Practices (FSBP)**, criado pela AWS, e padrões externos como **CIS AWS Foundations Benchmark**, **PCI DSS** e **NIST**. Ao ligar um padrão, todos os controles dele passam a rodar.',
    facts: ['Cada controle traz a regra do AWS Config usada, a gravidade e a correção recomendada.', 'Controles podem ser desligados um a um.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.shubStandards, R.shubS3],
    tags: ['seguranca'],
  },
  {
    id: 'shub.aggregation',
    title: 'Visão de várias contas e Regiões',
    officialName: 'Cross-Region aggregation and administrator accounts',
    serviceIds: ['aws.security-hub', 'aws.organizations'],
    summary: 'Com uma **conta administradora** na organização e uma **Região de agregação**, o Security Hub CSPM mostra os achados e as notas de todas as contas e Regiões ligadas num só painel. A **configuração central** liga padrões nas contas sem configurar uma por uma.',
    facts: ['Para cumprir todos os controles do CIS, o Security Hub CSPM precisa estar ligado em todas as Regiões usadas.'],
    exam: { domains: ['d1'], relevance: 'baixa' },
    references: [R.shubCspm, R.shubStandards],
    tags: ['seguranca'],
  },
  {
    id: 'artifact.what',
    title: 'AWS Artifact',
    officialName: 'AWS Artifact',
    serviceIds: ['aws.artifact'],
    summary: 'O **Artifact** é onde se baixam, **sem custo**, os relatórios de conformidade **da própria AWS**: SOC, PCI, ISO e certificações. Ele também guarda os **acordos** com a AWS. Esses documentos provam a parte da AWS; a parte da empresa ela mesma precisa documentar.',
    facts: ['O Artifact também traz documentos de fornecedores do AWS Marketplace.'],
    commonMistakes: ['Procurar no Artifact a prova de que os buckets da empresa estão cifrados'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.artifact],
    tags: ['seguranca'],
  },
  {
    id: 'sec.compliance-evidence',
    title: 'Quem prova o quê na auditoria',
    officialName: 'Compliance evidence under the shared responsibility model',
    serviceIds: ['aws.artifact', 'aws.security-hub', 'aws.config', 'aws.cloudtrail'],
    summary: 'Na auditoria, a conformidade se divide como a responsabilidade. A **parte da AWS** (data centers, hardware, serviços) se prova com os relatórios do **Artifact**. A **parte da empresa** se prova com o que ela configurou: controles do **Security Hub CSPM**, histórico e regras do **AWS Config**, trilhas do **CloudTrail**.',
    comparisons: [{ with: 'srm.model', text: 'O modelo de responsabilidade compartilhada diz quem cuida de cada camada; aqui ele diz quem traz a prova de cada camada.' }],
    exam: { domains: ['d1'], relevance: 'alta', notes: 'A tarefa 1.3 cita alinhar a tecnologia às exigências de conformidade.' },
    references: [R.artifact, R.shubCspm],
    tags: ['seguranca'],
  },
]
