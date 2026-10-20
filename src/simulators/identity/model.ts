/**
 * Escolha da solução de identidade: qual opção atende aos requisitos de cada
 * cenário (pessoas, diretórios, workloads, clientes de aplicativo, terceiros).
 *
 * Fatos conferidos em 19/10/2026:
 * - IAM Identity Center: https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html
 * - Fontes de identidade: https://docs.aws.amazon.com/singlesignon/latest/userguide/manage-your-identity-source.html
 * - Directory Service: https://docs.aws.amazon.com/directoryservice/latest/admin-guide/what_is.html
 * - Cognito: https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html
 * - Roles Anywhere: https://docs.aws.amazon.com/rolesanywhere/latest/userguide/introduction.html
 * - Terceiros e External ID: https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html
 * - Boas práticas: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
 *
 * A "complexidade relativa" é julgamento de arquitetura do AWS Quest, usada só
 * para desempatar opções que atendem aos mesmos requisitos.
 */

export type IdentityOption =
  | 'idc-external'
  | 'idc-directory'
  | 'iam-user'
  | 'managed-ad'
  | 'ad-connector'
  | 'simple-ad'
  | 'service-role'
  | 'roles-anywhere'
  | 'user-pool'
  | 'identity-pool'
  | 'user-and-identity-pool'
  | 'cross-account-role'

export type IdentityNeed =
  | 'workforce-sso'
  | 'existing-idp'
  | 'no-idp'
  | 'onprem-ad-no-sync'
  | 'mfa-radius'
  | 'ad-in-aws'
  | 'ad-trust'
  | 'rds-sqlserver-ad'
  | 'basic-directory'
  | 'workload-aws'
  | 'workload-outside'
  | 'app-signin'
  | 'app-aws-credentials'
  | 'guest-access'
  | 'third-party-account'
  | 'tool-keys-only'

export const NEED_LABEL: Record<IdentityNeed, string> = {
  'workforce-sso': 'login único dos funcionários em várias contas AWS',
  'existing-idp': 'manter os funcionários no provedor de identidade que a empresa já usa',
  'no-idp': 'cadastrar os funcionários sem ter um provedor de identidade',
  'onprem-ad-no-sync': 'usar o Active Directory local sem copiar usuários para a nuvem',
  'mfa-radius': 'MFA com o servidor RADIUS que a empresa já tem',
  'ad-in-aws': 'um Active Directory de verdade rodando na AWS',
  'ad-trust': 'relação de confiança (trust) com o AD local',
  'rds-sqlserver-ad': 'autenticação do Windows no RDS for SQL Server',
  'basic-directory': 'um diretório simples e barato para poucos usuários, sem MFA nem trusts',
  'workload-aws': 'credenciais para uma aplicação rodando num serviço da AWS',
  'workload-outside': 'credenciais temporárias para um servidor fora da AWS com certificados X.509',
  'app-signin': 'cadastro e login dos clientes do aplicativo',
  'app-aws-credentials': 'credenciais AWS temporárias para o aplicativo do cliente acessar recursos diretamente',
  'guest-access': 'acesso limitado para visitantes sem login',
  'third-party-account': 'um parceiro com conta AWS própria acessar a sua conta',
  'tool-keys-only': 'uma ferramenta de terceiros que só aceita chave de acesso',
}

export interface OptionInfo {
  name: string
  summary: string
  meets: IdentityNeed[]
  limits: string[]
  /** 1 (mais simples) a 4 — julgamento de arquitetura, só para desempate. */
  complexity: number
}

export const OPTIONS: Record<IdentityOption, OptionInfo> = {
  'idc-external': { name: 'IAM Identity Center + IdP externo', summary: 'Login único com o provedor da empresa (por exemplo, Okta ou Microsoft Entra ID); permission sets viram roles em cada conta.', meets: ['workforce-sso', 'existing-idp'], limits: ['É para funcionários, não para clientes de aplicativos.'], complexity: 2 },
  'idc-directory': { name: 'IAM Identity Center com diretório próprio', summary: 'Usuários e grupos criados no próprio Identity Center, com login único nas contas.', meets: ['workforce-sso', 'no-idp'], limits: ['Mantém um diretório separado do provedor que a empresa já tenha.'], complexity: 1 },
  'iam-user': { name: 'Usuário IAM com chave de acesso', summary: 'Credencial de longo prazo: exceção para quem não consegue usar credenciais temporárias.', meets: ['tool-keys-only'], limits: ['Credenciais de longo prazo precisam de rotação e não servem para pessoas nem para workloads que aceitam roles.'], complexity: 1 },
  'managed-ad': { name: 'AWS Managed Microsoft AD', summary: 'Active Directory real gerenciado pela AWS, com trust para o AD local.', meets: ['ad-in-aws', 'ad-trust', 'rds-sqlserver-ad'], limits: ['Mais caro e mais complexo que um proxy quando só se quer usar o AD local.'], complexity: 3 },
  'ad-connector': { name: 'AD Connector', summary: 'Proxy que encaminha a autenticação para o AD local, sem guardar usuários na nuvem.', meets: ['onprem-ad-no-sync', 'mfa-radius'], limits: ['Depende do AD local e não é compatível com o RDS for SQL Server.'], complexity: 2 },
  'simple-ad': { name: 'Simple AD', summary: 'Diretório de baixo custo baseado em Samba 4.', meets: ['basic-directory'], limits: ['Não tem MFA nem trusts, e não serve como fonte de identidade do IAM Identity Center.'], complexity: 1 },
  'service-role': { name: 'Role de serviço (instance profile, role de execução)', summary: 'O serviço da AWS assume a role e entrega credenciais temporárias à aplicação.', meets: ['workload-aws'], limits: ['Só para workloads que rodam em serviços da AWS.'], complexity: 1 },
  'roles-anywhere': { name: 'IAM Roles Anywhere', summary: 'Servidor fora da AWS troca um certificado X.509 por credenciais temporárias de uma role.', meets: ['workload-outside'], limits: ['Exige uma CA (própria ou AWS Private CA) e certificados nos servidores.'], complexity: 2 },
  'user-pool': { name: 'Cognito user pool', summary: 'Diretório de clientes: cadastro, login (inclusive social, SAML e OIDC) e tokens JWT.', meets: ['app-signin'], limits: ['Sozinho não entrega credenciais AWS.'], complexity: 1 },
  'identity-pool': { name: 'Cognito identity pool', summary: 'Troca um token por credenciais AWS temporárias, inclusive para visitantes.', meets: ['app-aws-credentials', 'guest-access'], limits: ['Não é um diretório: não cadastra nem autentica clientes.'], complexity: 1 },
  'user-and-identity-pool': { name: 'User pool + identity pool', summary: 'O user pool autentica e o identity pool troca o token por credenciais AWS.', meets: ['app-signin', 'app-aws-credentials', 'guest-access'], limits: ['Duas peças para configurar.'], complexity: 2 },
  'cross-account-role': { name: 'Role entre contas com External ID', summary: 'O parceiro assume uma role na sua conta, com External ID para evitar o assistente confuso.', meets: ['third-party-account'], limits: ['Só para quem tem conta AWS.'], complexity: 1 },
}

export interface IdentityItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: IdentityNeed
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: IdentityNeed[]
  concepts?: string[]
}

export function unmetNeeds(item: IdentityItem, opt: IdentityOption): IdentityNeed[] {
  return item.needs.filter((n) => !OPTIONS[opt].meets.includes(n))
}

/** Melhor opção: atende a todos os requisitos com a menor complexidade. Lança erro se não for única. */
export function bestIdentityOption(item: IdentityItem, options: IdentityOption[]): IdentityOption {
  const ok = options.filter((o) => unmetNeeds(item, o).length === 0).sort((a, b) => OPTIONS[a].complexity - OPTIONS[b].complexity)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && OPTIONS[ok[1]].complexity === OPTIONS[ok[0]].complexity) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export interface IdentityVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message: string
}

export function judgeIdentity(item: IdentityItem, pick: IdentityOption | undefined, options: IdentityOption[]): IdentityVerdict {
  const best = bestIdentityOption(item, options)
  const bestName = OPTIONS[best].name
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito que decide é ${NEED_LABEL[item.dominant]}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito que decide é ${NEED_LABEL[item.dominant]}. ${OPTIONS[best].summary}` }
  const missing = unmetNeeds(item, pick)
  if (missing.length === 0) return { score: 0.5, status: 'partial', message: `Funciona, mas é mais do que o caso pede. ${OPTIONS[pick].limits[0]} ${bestName} atende com menos peças.` }
  return { score: 0, status: 'wrong', message: `${OPTIONS[pick].name} não atende: ${missing.map((n) => NEED_LABEL[n]).join('; ')}. ${OPTIONS[pick].limits[0]} A opção adequada é ${bestName}.` }
}
