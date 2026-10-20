/**
 * Conceitos da Fase 2 — MFA.
 * Fatos conferidos em 19/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F02_IAM_CONCEPTS: ConceptDef[] = [
  {
    id: 'iam.mfa',
    title: 'MFA (autenticação multifator)',
    officialName: 'Multi-factor authentication (MFA)',
    serviceIds: ['aws.iam'],
    summary: 'Um segundo fator além da senha: algo que você **tem** (chave de segurança, celular, token). O usuário raiz e cada usuário IAM podem registrar até **oito dispositivos** de qualquer tipo; basta um para entrar.',
    facts: ['O MFA do root vale só para o root: cada usuário IAM tem a própria configuração.', 'Com vários dispositivos registrados, perder um não exige o procedimento de recuperação da conta.'],
    recommendations: ['Registre mais de um dispositivo: um para o dia a dia e outro guardado em local seguro.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.mfa],
    tags: ['seguranca'],
  },
  {
    id: 'iam.mfa-types',
    title: 'Tipos de MFA',
    officialName: 'MFA types',
    serviceIds: ['aws.iam'],
    summary: '**Passkeys e chaves de segurança** (padrão FIDO, resistentes a phishing), **aplicativo autenticador** (código TOTP no celular) e **token de hardware TOTP** (código de seis dígitos). A AWS **não aceita mais registrar MFA por SMS**.',
    facts: [
      'Passkeys e chaves de segurança usam criptografia de chave pública e resistem a phishing, interceptação e reenvio.',
      'Passkeys e chaves de segurança só são habilitadas pelo console, não pela CLI nem pela API.',
      'Tokens de hardware TOTP precisam ser comprados nos links indicados pela AWS; tokens de outras origens não funcionam com o IAM.',
    ],
    recommendations: ['A AWS recomenda MFA resistente a phishing (passkeys e chaves de segurança) sempre que possível; o aplicativo autenticador serve como medida provisória.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.mfa],
    tags: ['seguranca'],
  },
  {
    id: 'iam.mfa-root',
    title: 'MFA obrigatório no usuário raiz',
    officialName: 'MFA enforcement for the root user',
    serviceIds: ['aws.iam'],
    summary: 'A AWS **exige MFA no usuário raiz** de todos os tipos de conta: avulsa, de gerenciamento e membro. Quem ainda não registrou precisa registrar em até 35 dias após a primeira tentativa de login.',
    facts: ['Contas-membro sem credenciais de root (acesso root centralizado) aparecem como "não aplicável" nas verificações de MFA do root.'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.mfa, R.rootBp],
    tags: ['seguranca'],
  },
  {
    id: 'iam.mfa-recovery',
    title: 'Dispositivo MFA perdido',
    officialName: 'Recovering an MFA protected identity',
    serviceIds: ['aws.iam'],
    summary: 'Com outro dispositivo registrado, entre com ele e desative o perdido. Sem nenhum: o **usuário IAM** pede a um **administrador** que desative o dispositivo; o **root** verifica o **e-mail e o telefone** da conta para entrar com fatores alternativos.',
    facts: ['O usuário IAM não consegue recuperar o MFA sozinho.', 'Depois de perder ou ter um dispositivo roubado, troque também a senha: quem pegou o dispositivo pode ter a senha.'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.mfaLost],
    tags: ['seguranca'],
  },
  {
    id: 'sts.get-session-token',
    title: 'GetSessionToken',
    officialName: 'AWS STS GetSessionToken',
    serviceIds: ['aws.sts', 'aws.iam'],
    summary: 'Troca a chave de acesso de um usuário (ou do root) mais um **código MFA** (`SerialNumber` e `TokenCode`) por **credenciais temporárias** que carregam a informação de que houve MFA.',
    facts: [
      'Duração de 15 minutos a 36 horas (padrão de 12 horas); para o root, no máximo 1 hora.',
      'Não aceita session policy.',
      'Sem MFA na chamada, as credenciais não podem chamar as APIs do IAM.',
      'O código de uma passkey ou chave de segurança não pode ser enviado às APIs do STS; com elas, use o comando `aws login`.',
    ],
    useCases: ['Usar a CLI com MFA para ações protegidas por uma condição de MFA'],
    exam: { domains: ['d1'], relevance: 'media' },
    references: [R.getSessionToken, R.stsCompare, R.mfa],
    tags: ['seguranca'],
  },
  {
    id: 'iam.mfa-condition',
    title: 'Exigindo MFA numa política',
    officialName: 'aws:MultiFactorAuthPresent',
    serviceIds: ['aws.iam'],
    summary: 'A chave `aws:MultiFactorAuthPresent` só existe em requisições feitas com **credenciais temporárias**. Com uma **chave de acesso de longo prazo**, ela **não aparece**. Num Deny, use **`BoolIfExists` igual a `false`**: assim a ausência também é negada.',
    explanation: [
      'Num Allow, `Bool` com `true` só permite quem tem MFA: sem a chave, a condição é falsa e nada é permitido.',
      'Num Deny, `Bool` com `false` não pega a chave de acesso: a chave não existe, a condição é falsa e o Deny não se aplica.',
      '`aws:MultiFactorAuthAge` informa há quantos segundos o MFA foi feito.',
    ],
    commonMistakes: ['Escrever o Deny com `Bool` e achar que bloqueou quem usa chave de acesso sem MFA'],
    exam: { domains: ['d1'], relevance: 'alta' },
    references: [R.conditionKeys, R.conditionOps, R.mfaApi],
    tags: ['seguranca'],
  },
]
