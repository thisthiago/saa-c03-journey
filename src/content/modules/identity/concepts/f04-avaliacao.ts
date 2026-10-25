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
    explanation: [
      'O fluxo fica mais fácil quando se separam as políticas em dois grupos. As que **concedem** (a política de identidade e a de recurso) são as únicas que podem dar acesso. As que **limitam** (RCPs, SCPs, permissions boundary e session policy) nunca dão acesso: elas definem o máximo possível, e um Allow nelas quer dizer apenas que a ação não está bloqueada.',
      'A avaliação começa com tudo negado, exceto para o usuário raiz. Primeiro, a AWS junta todas as políticas que se aplicam à requisição e procura um **Deny explícito**; se encontra, nega sem olhar mais nada. Sem Deny, cada camada que limita e que existe para aquele principal precisa permitir a ação, e alguma política que concede precisa ter um Allow. Há uma exceção importante na mesma conta: quando a política de recurso concede diretamente ao ARN de um usuário, a falta de Allow na identidade, no boundary ou na session policy não bloqueia.',
      'Exemplo: uma desenvolvedora tem a política `AdministratorAccess`, mas não consegue criar uma instância EC2 em `sa-east-1`. Como a identidade concede tudo, o bloqueio está numa camada que limita, por exemplo uma SCP da organização que nega as Regiões fora de uma lista. Nenhum Allow novo na identidade resolve. O efeito seria o mesmo se a SCP não tivesse um Deny, mas também não permitisse o EC2: uma camada que limita deixou a ação de fora.',
      '**Regra prática:** um Deny explícito em qualquer política encerra a avaliação. Sem Deny, o acesso exige um Allow numa política que concede e nenhuma camada que limita deixando a ação de fora.',
    ],
    comparisons: [
      { with: 'iam.policy-evaluation', text: 'É a regra básica, vista na S3 Expedition: deny implícito por padrão, e o Deny explícito sempre vence. O fluxo completo acrescenta as camadas que limitam e a ordem em que são verificadas.' },
      { with: 'org.scp', text: 'A SCP é uma das camadas que limitam: precisa permitir a ação, mas não concede nada. Para o acesso acontecer, ainda falta um Allow numa política de identidade ou de recurso.' },
      { with: 'iam.cross-account', text: 'Entre contas, a avaliação acontece dos dois lados: a política de identidade de quem pede e a política de recurso da outra conta precisam permitir.' },
    ],
    facts: [
      'Por padrão, toda requisição é negada, exceto as do usuário raiz, que tem acesso total.',
      'Na mesma conta, se a política de recurso concede ao ARN da role (e não ao da sessão), o boundary e a session policy ainda limitam o acesso.',
    ],
    commonMistakes: [
      'Achar que um Allow numa SCP ou num permissions boundary concede acesso. Essas políticas só limitam.',
      'Procurar o problema só na política de identidade quando o acesso é negado. O bloqueio pode vir de uma SCP, de uma RCP, do boundary, da session policy ou de um Deny na política de recurso.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Questões de avaliação costumam trazer um usuário com permissão ampla que mesmo assim recebe "Access Denied", ou pedem uma forma de garantir que ninguém faça algo, nem um administrador. No primeiro caso, procure o Deny explícito ou a camada que limita. No segundo, a resposta costuma ser uma SCP, que vale para todos os principais das contas-membro, inclusive o usuário raiz de cada uma, ou uma RCP, quando o limite é sobre quem acessa os recursos. Nas questões entre contas, confira os dois lados: a falta de Allow em qualquer um deles nega o acesso.',
    },
    references: [R.evalDenyAllow, R.evalLogic, R.crossAccount],
    tags: ['seguranca'],
  },
  {
    id: 'iam.same-account',
    title: 'Mesma conta: identidade ou recurso',
    officialName: 'Policy evaluation within a single account',
    serviceIds: ['aws.iam'],
    summary: 'Dentro da mesma conta, na maioria dos serviços, **basta** a política de identidade **ou** a política de recurso permitir (sem nenhum Deny). As exceções são as trust policies e as key policies do KMS.',
    explanation: [
      'Dentro da mesma conta, a política de identidade e a de recurso funcionam como dois caminhos para o mesmo destino: qualquer um deles basta, desde que nenhum Deny se aplique. Entre contas, os dois caminhos viram duas portas em sequência, e as duas precisam estar abertas.',
      'Exemplo: uma bucket policy permite `s3:GetObject` ao usuário ana, da mesma conta. Ana lê os objetos mesmo sem nenhuma política de identidade. Se ana estivesse em outra conta, ela precisaria também de uma política de identidade que permitisse.',
      '**Regra prática:** na mesma conta, um Allow basta; entre contas, são precisos dois.',
    ],
    comparisons: [
      { with: 'iam.cross-account', text: 'Entre contas, a política de identidade de quem pede e a política de recurso da outra conta precisam permitir.' },
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Cuidado com a pegadinha da mesma conta: basta um dos lados permitir, exceto nas trust policies de roles e nas key policies do KMS, que sempre precisam permitir.',
    },
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
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Se um usuário tem AdministratorAccess e mesmo assim não consegue usar uma chave KMS ou assumir uma role, procure a key policy ou a trust policy: elas precisam permitir, e a política de identidade sozinha não basta.',
    },
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
