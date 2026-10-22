/**
 * Plano de migração de um portfólio: a estratégia (uma das sete) e a
 * ferramenta de cada sistema, a partir da característica que decide o caso.
 *
 * Conferido em 22/10/2026:
 * - Os 7 Rs e seus casos de uso: retire (sem valor de negócio, sem conexões
 *   há 90 dias), retain (residência de dados, dependências, recém-atualizado,
 *   hardware especial), rehost (sem mudar a aplicação, com o AWS Transform
 *   MGN), relocate (levar a plataforma, como VMware, para a versão na nuvem
 *   sem comprar hardware nem reescrever), repurchase (trocar por SaaS),
 *   replatform (alguma otimização, como ir para um serviço gerenciado: SQL
 *   Server para o RDS for SQL Server) e refactor (reescrever com recursos
 *   nativos da nuvem; o mais complexo e caro)
 *   (https://docs.aws.amazon.com/prescriptive-guidance/latest/large-migration-guide/migration-strategies.html).
 * - AWS Transform MGN: replicação contínua em nível de bloco, teste e corte
 *   (https://docs.aws.amazon.com/mgn/latest/ug/what-is-application-migration-service.html).
 * - DMS para bancos, DataSync para arquivos e Amazon EVS para VMware vêm das
 *   trilhas de Bancos de dados, S3 Expedition e Computação.
 *
 * Simplificação: cada sistema tem uma característica que decide; na prática,
 * a escolha pesa várias ao mesmo tempo.
 */

export type MigStrategy = 'retire' | 'retain' | 'rehost' | 'relocate' | 'repurchase' | 'replatform' | 'refactor'
export type MigTool = 'mgn' | 'dms' | 'datasync' | 'evs' | 'none'
export type MigTrait = 'unused' | 'must-stay' | 'saas' | 'as-is' | 'vmware' | 'managed-db' | 'managed-files' | 'rebuild'

export const STRATEGY_LABEL: Record<MigStrategy, string> = {
  retire: 'Retire (desativar)',
  retain: 'Retain (manter onde está)',
  rehost: 'Rehost (levar como está)',
  relocate: 'Relocate (levar a plataforma)',
  repurchase: 'Repurchase (trocar por SaaS)',
  replatform: 'Replatform (ajustar para um serviço gerenciado)',
  refactor: 'Refactor (reescrever para a nuvem)',
}

export const TOOL_LABEL: Record<MigTool, string> = {
  mgn: 'AWS Transform MGN',
  dms: 'AWS DMS',
  datasync: 'AWS DataSync',
  evs: 'Amazon EVS',
  none: 'Nenhuma ferramenta de migração',
}

export const RULES: Record<MigTrait, { strategy: MigStrategy; tool: MigTool; why: string; toolWhy: string }> = {
  unused: { strategy: 'retire', tool: 'none', why: 'Sistema sem uso nem valor de negócio é desativado: migrar só levaria o custo junto.', toolWhy: 'Nada é migrado; basta arquivar o que a empresa precisar guardar.' },
  'must-stay': { strategy: 'retain', tool: 'none', why: 'Residência de dados, hardware sem equivalente na nuvem ou investimento recente mantêm o sistema onde está, por enquanto.', toolWhy: 'O sistema fica no local nesta onda.' },
  saas: { strategy: 'repurchase', tool: 'none', why: 'Existe um SaaS que faz o mesmo: trocar a licença tradicional pelo serviço tira a infraestrutura das mãos da empresa.', toolWhy: 'Os dados vão para o SaaS com as ferramentas do fornecedor.' },
  'as-is': { strategy: 'rehost', tool: 'mgn', why: 'Levar o servidor sem mudar a aplicação, com prazo curto, é rehost; a otimização vem depois, já na AWS.', toolWhy: 'O AWS Transform MGN replica os discos em nível de bloco, lança instâncias de teste e corta em minutos.' },
  vmware: { strategy: 'relocate', tool: 'evs', why: 'Levar a plataforma VMware inteira, sem comprar hardware nem reescrever, é relocate.', toolWhy: 'O Amazon EVS roda o VMware Cloud Foundation em instâncias bare metal do EC2, dentro da VPC, sem trocar os endereços IP.' },
  'managed-db': { strategy: 'replatform', tool: 'dms', why: 'Trocar o banco autogerenciado por um serviço gerenciado, sem reescrever a aplicação, é replatform.', toolWhy: 'O AWS DMS faz a carga completa e replica as mudanças até o corte.' },
  'managed-files': { strategy: 'replatform', tool: 'datasync', why: 'Trocar o servidor de arquivos por um serviço gerenciado, como o EFS ou o FSx, sem mudar quem lê os arquivos, é replatform.', toolWhy: 'O AWS DataSync copia os arquivos pela rede, com verificação, de forma incremental.' },
  rebuild: { strategy: 'refactor', tool: 'none', why: 'Quando o monólito já impede o negócio de crescer e lançar rápido, reescrever com recursos nativos da nuvem é refactor, o caminho mais complexo e caro.', toolWhy: 'Não há ferramenta que reescreva a aplicação; o código novo é construído aos poucos.' },
}

export const decide = (t: MigTrait) => RULES[t]
