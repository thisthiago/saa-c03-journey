/**
 * Conceitos da Fase 5 — Segurança na arquitetura. Reaproveita
 * sec.defense-in-depth, sec.at-rest-in-transit e secret.where (Segurança),
 * iam.least-privilege (S3 Expedition), iam.roles e sts.temporary-credentials
 * (IAM), gov.account-structure, trail.org-trail e ssm.session-manager
 * (Monitoramento e governança), rt.public-private, sg.reference e edgesec.waf
 * (Redes) e db.private-access (Bancos de dados).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_ARQ_CONCEPTS: ConceptDef[] = [
  {
    id: 'wa.sec-identity',
    title: 'Base de identidade forte',
    officialName: 'Implement a strong identity foundation',
    serviceIds: ['aws.iam'],
    summary: 'O primeiro princípio do pilar de segurança: **menor privilégio**, **separação de funções**, identidades **centralizadas** e o fim das **credenciais longas**. Pessoas entram por federação e máquinas usam **roles**, sempre com credenciais temporárias.',
    facts: ['Não usar credenciais temporárias (SEC02-BP02) tem risco alto.', 'Antipadrões citados pela AWS: chaves de acesso longas no código, em aplicativos móveis ou compartilhadas entre pessoas.'],
    comparisons: [{ with: 'iam.least-privilege', text: 'O menor privilégio é uma das partes da base de identidade; as outras são separar funções e eliminar credenciais longas.' }],
    commonMistakes: ['Dar às instâncias chaves de um usuário IAM em vez de uma role'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.secPrinciples, R.sec02bp02],
    tags: ['seguranca'],
  },
  {
    id: 'wa.sec-keep-away',
    title: 'Manter as pessoas longe dos dados',
    officialName: 'Keep people away from data',
    serviceIds: ['aws.systems-manager'],
    summary: 'Reduza ou elimine o **acesso direto** e o **processamento manual** dos dados: cada acesso humano é uma chance de erro, vazamento ou alteração indevida. Automatize as tarefas e dê ferramentas que mostram só o necessário.',
    recommendations: ['Troque o acesso por SSH a servidores e bancos por automação e por sessões registradas do Session Manager.'],
    commonMistakes: ['Dar a toda a equipe de suporte acesso de leitura ao banco de produção para "investigar problemas"'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.secPrinciples],
    tags: ['seguranca'],
  },
  {
    id: 'wa.sec-automate',
    title: 'Automatizar as boas práticas de segurança',
    officialName: 'Automate security best practices',
    serviceIds: ['aws.cloudformation', 'aws.config'],
    summary: 'Controles de segurança definidos **como código**, em templates versionados, são aplicados igual em todo ambiente e escalam sem trabalho manual. A **rastreabilidade** completa o ciclo: registrar e alertar sobre ações e mudanças, e investigar de forma automática.',
    facts: ['A criptografia em repouso deve ser ligada por padrão, como a criptografia padrão de novos volumes EBS na conta (SEC08-BP02, risco alto).'],
    commonMistakes: ['Configurar a segurança pelo console em cada conta e descobrir meses depois que uma ficou diferente'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.secPrinciples, R.sec08bp02],
    tags: ['seguranca'],
  },
]
