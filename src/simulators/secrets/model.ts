/**
 * Simulador da rotação de um segredo no AWS Secrets Manager: em cada etapa,
 * qual versão tem cada rótulo, quais senhas o banco aceita e o que acontece
 * com o login de uma aplicação que lê o segredo agora ou que guardou uma
 * cópia em cache.
 *
 * Conferido em 22/10/2026:
 * - A função de rotação tem quatro etapas: createSecret (nova versão com o
 *   rótulo AWSPENDING), setSecret (muda a senha no banco para a de
 *   AWSPENDING), testSecret (testa AWSPENDING) e finishSecret (move
 *   AWSCURRENT para a nova versão; a anterior recebe AWSPREVIOUS)
 *   (https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotate-secrets_lambda-functions.html).
 * - Usuário único: há um curto intervalo entre a troca da senha no banco e a
 *   atualização do segredo, em que o banco pode recusar a credencial.
 *   Usuários alternados: a primeira rotação clona o usuário, e cada rotação
 *   troca a senha de um dos dois; depois da rotação, as duas credenciais
 *   valem (https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotation-strategy.html).
 * - O componente de cache do Secrets Manager atualiza os segredos a cada hora
 *   por padrão
 *   (https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_cache-python.html).
 *
 * Simplificação: a aplicação com cache guardou a versão 1 antes da rotação e
 * ainda não renovou a cópia no momento perguntado.
 */

export type RotationStrategy = 'single' | 'alternating'

export const STEPS = ['before', 'createSecret', 'setSecret', 'testSecret', 'finishSecret', 'secondRotation'] as const
export type RotationMoment = (typeof STEPS)[number]

export const MOMENT_LABEL: Record<RotationMoment, string> = {
  before: 'antes da rotação',
  createSecret: 'logo depois do createSecret',
  setSecret: 'logo depois do setSecret',
  testSecret: 'logo depois do testSecret',
  finishSecret: 'logo depois do finishSecret',
  secondRotation: 'depois da rotação seguinte',
}

export const STRATEGY_LABEL: Record<RotationStrategy, string> = { single: 'usuário único', alternating: 'usuários alternados' }

export type Reader = 'fresh' | 'cached'

export const READER_LABEL: Record<Reader, string> = {
  fresh: 'aplicação que lê o segredo a cada conexão',
  cached: 'aplicação que guardou o segredo em cache antes da rotação',
}

export interface MomentState {
  /** Versão com cada rótulo. */
  labels: { AWSCURRENT: number; AWSPENDING?: number; AWSPREVIOUS?: number }
  /** Versões cujas credenciais o banco aceita. */
  dbAccepts: number[]
  /** Usuário de cada versão (no alternado, v2 é o clone). */
  user: Record<number, string>
}

/** Estado do segredo e do banco em cada momento. */
export function momentState(strategy: RotationStrategy, m: RotationMoment): MomentState {
  const user: Record<number, string> =
    strategy === 'single' ? { 1: 'app', 2: 'app', 3: 'app' } : { 1: 'app', 2: 'app_clone', 3: 'app' }
  switch (m) {
    case 'before':
      return { labels: { AWSCURRENT: 1 }, dbAccepts: [1], user }
    case 'createSecret':
      return { labels: { AWSCURRENT: 1, AWSPENDING: 2 }, dbAccepts: [1], user }
    case 'setSecret':
    case 'testSecret':
      return { labels: { AWSCURRENT: 1, AWSPENDING: 2 }, dbAccepts: strategy === 'single' ? [2] : [1, 2], user }
    case 'finishSecret':
      return { labels: { AWSCURRENT: 2, AWSPREVIOUS: 1 }, dbAccepts: strategy === 'single' ? [2] : [1, 2], user }
    case 'secondRotation':
      return { labels: { AWSCURRENT: 3, AWSPREVIOUS: 2 }, dbAccepts: strategy === 'single' ? [3] : [2, 3], user }
  }
}

export type LoginOutcome = 'ok-v1' | 'ok-v2' | 'ok-v3' | 'fail'

export const OUTCOME_LABEL: Record<LoginOutcome, string> = {
  'ok-v1': 'entra com a versão 1',
  'ok-v2': 'entra com a versão 2',
  'ok-v3': 'entra com a versão 3',
  fail: 'o banco recusa o login',
}

/** O que acontece com o login de um leitor num momento da rotação. */
export function loginOutcome(strategy: RotationStrategy, m: RotationMoment, reader: Reader): { outcome: LoginOutcome; version: number; detail: string } {
  const st = momentState(strategy, m)
  const version = reader === 'cached' ? 1 : st.labels.AWSCURRENT
  const ok = st.dbAccepts.includes(version)
  const outcome = (ok ? `ok-v${version}` : 'fail') as LoginOutcome
  const accepts = st.dbAccepts.map((v) => `versão ${v} (usuário ${st.user[v]})`).join(' e ')
  const detail = `${MOMENT_LABEL[m]}, com ${STRATEGY_LABEL[strategy]}: AWSCURRENT está na versão ${st.labels.AWSCURRENT}${st.labels.AWSPENDING ? `, AWSPENDING na versão ${st.labels.AWSPENDING}` : ''}${st.labels.AWSPREVIOUS ? `, AWSPREVIOUS na versão ${st.labels.AWSPREVIOUS}` : ''}. O banco aceita a ${accepts}. A ${READER_LABEL[reader]} usa a versão ${version}${ok ? ' e entra' : ', que o banco já não aceita'}.`
  return { outcome, version, detail }
}
