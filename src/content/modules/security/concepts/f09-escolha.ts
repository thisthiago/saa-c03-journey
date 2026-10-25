/**
 * Conceitos da Fase 9 — Escolhendo o serviço de segurança.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_SEC_CONCEPTS: ConceptDef[] = [
  {
    id: 'sec.choose',
    title: 'Qual serviço responde',
    officialName: 'Choosing AWS security services',
    serviceIds: ['aws.guardduty', 'aws.inspector', 'aws.macie', 'aws.detective', 'aws.security-hub', 'aws.config', 'aws.cloudtrail'],
    summary: 'Cada serviço responde uma pergunta. **Quem fez o quê?** CloudTrail. **Como o recurso está configurado e estava antes?** AWS Config. **Há ameaça agora?** GuardDuty. **O que está vulnerável?** Inspector. **Onde estão os dados pessoais?** Macie. **Como chegou aqui?** Detective. **Como estou diante dos padrões?** Security Hub CSPM.',
    commonMistakes: ['Confundir o Config, que guarda configuração, com o CloudTrail, que guarda chamadas de API'],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Questões de segurança dão a pergunta e esperam o serviço: quem fez (CloudTrail), configuração (Config), ameaça (GuardDuty), vulnerabilidade (Inspector), dados pessoais (Macie), investigação (Detective) e postura (Security Hub CSPM).',
    },
    references: [R.examScope, R.shubCspm, R.gdWhat, R.inspector, R.detective],
    tags: ['seguranca'],
  },
  {
    id: 'sec.which-protection',
    title: 'Chave, segredo ou certificado',
    officialName: 'Choosing between KMS, CloudHSM, Secrets Manager, Parameter Store and ACM',
    serviceIds: ['aws.kms', 'aws.cloudhsm', 'aws.secrets-manager', 'aws.systems-manager', 'aws.acm'],
    summary: 'Proteger **dados em repouso**: KMS, e CloudHSM só se a regra pedir HSM dedicado. Guardar **senhas que precisam girar**: Secrets Manager. Guardar **configuração**, mesmo cifrada: Parameter Store. Proteger **dados em trânsito**: certificado do ACM no serviço que termina o TLS.',
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinais: "chave de criptografia" aponta para o KMS ou o CloudHSM; "senha que precisa girar", para o Secrets Manager; "configuração", para o Parameter Store; "HTTPS", para o ACM. Uma alternativa que guarda senhas no KMS ou certificados no Secrets Manager mistura as ferramentas.',
    },
    references: [R.kmsKeys, R.cloudhsm, R.smRotating, R.paramTiers, R.acmWhat],
    tags: ['seguranca'],
  },
]
