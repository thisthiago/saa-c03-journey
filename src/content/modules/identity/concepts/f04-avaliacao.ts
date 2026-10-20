/**
 * Conceitos da Fase 4 — Como a AWS decide.
 * Fatos conferidos em 19/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 * Reaproveita iam.policy-evaluation, iam.cross-account e kms.key-policy, da S3 Expedition.
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_IAM_CONCEPTS: ConceptDef[] = [
  {
    id: 'iam.eval-flow',
    title: 'O fluxo de avaliação',
    officialName: 'Policy evaluation logic',
    serviceIds: ['aws.iam', 'aws.organizations'],
    summary: 'A AWS procura primeiro um **Deny explícito** em todas as políticas que se aplicam. Sem Deny, exige **Allow** nas **RCPs** e nas **SCPs**; depois olha a **política de recurso**, as políticas de **identidade**, o **permissions boundary** e a **session policy**.',
    explanation: ['Por padrão tudo é negado, exceto para o usuário raiz. Uma concessão direta da política de recurso, na mesma conta, pode decidir antes da identidade.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.evalDenyAllow, R.evalLogic],
    tags: ['seguranca'],
  },
  {
    id: 'iam.same-account',
    title: 'Mesma conta: identidade ou recurso',
    officialName: 'Policy evaluation within a single account',
    serviceIds: ['aws.iam'],
    summary: 'Dentro da mesma conta, na maioria dos serviços, **basta** a política de identidade **ou** a política de recurso permitir (sem nenhum Deny). As exceções são as trust policies e as key policies do KMS.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.evalLogic, R.evalDenyAllow],
    tags: ['seguranca'],
  },
  {
    id: 'iam.grant-principal-type',
    title: 'A quem a política de recurso concede',
    officialName: 'Resource-based policies and principal types',
    serviceIds: ['aws.iam'],
    summary: 'Na mesma conta, uma concessão ao **ARN do usuário** ou ao **ARN da sessão** não é limitada por deny implícito de identidade, boundary ou session policy. Ao **ARN da role**, é limitada por **boundary e session policy**. À **conta**, é uma **delegação**: alguém ainda precisa permitir por política de identidade.',
    facts: ['O ARN da sessão tem o formato arn:aws:sts::conta:assumed-role/role/sessão.', 'Citar a conta (ou arn:aws:iam::conta:root) não restringe ao usuário raiz: delega à conta inteira.'],
    commonMistakes: ['Achar que um Principal com o ARN :root concede só ao usuário raiz'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.evalDenyAllow, R.principal],
    tags: ['seguranca'],
  },
  {
    id: 'iam.explicit-resource-required',
    title: 'Trust policies e key policies precisam permitir',
    officialName: 'Role trust policies and KMS key policies',
    serviceIds: ['aws.iam', 'aws.kms'],
    summary: 'Para assumir uma role, a **trust policy** precisa permitir o principal; para usar uma chave KMS, a **key policy** precisa permitir (diretamente ou delegando à conta). Política de identidade sozinha não basta, nem na mesma conta.',
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.evalDenyAllow, { title: 'Key policies in AWS KMS', url: 'https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html' }],
    tags: ['seguranca'],
    reviewItems: [
      {
        id: 'rv:iam.explicit-resource-required:trust',
        kind: 'decision',
        title: 'Assumir a role da mesma conta',
        prompt: 'Uma usuária tem política de identidade que permite `sts:AssumeRole` em todas as roles. A trust policy da role Admin cita só outro usuário. Ela consegue assumir a role?',
        concepts: [{ id: 'iam.explicit-resource-required' }],
        xp: 5,
        difficulty: 2,
        explanation: ['Trust policies precisam permitir o principal (diretamente ou pela conta). Identidade sozinha não basta.'],
        options: [
          { id: 'a', text: 'Não: a trust policy precisa permitir quem assume', correct: true, consequence: 'Sem a trust policy permitir, a política de identidade não basta.' },
          { id: 'b', text: 'Sim: na mesma conta, identidade ou recurso basta', correct: false, consequence: 'Essa regra tem exceções: trust policies e key policies do KMS.' },
        ],
      },
    ],
  },
]
