/**
 * Plano de migração de banco com o AWS DMS: conversão de esquema, tipo de
 * tarefa (carga completa, carga completa com captura de mudanças ou só
 * captura de mudanças) e validação dos dados.
 *
 * Fatos conferidos em 21/10/2026:
 * - Para trocar de motor, o esquema é convertido com o DMS Schema Conversion ou com o AWS SCT;
 *   o DMS migra os dados: https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html
 * - Tipos de tarefa: Migrate existing data (Full Load), Migrate existing data and replicate
 *   ongoing changes (full-load-and-cdc) e Replicate data changes only (CDC):
 *   https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Tasks.Creating.html
 * - A validação compara origem e destino, inclusive as mudanças de uma tarefa com CDC:
 *   https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Validating.html
 *
 * Premissas do cenário: carga completa a 200 GB por hora e virada final de 10 minutos.
 */

export type Engine = 'oracle' | 'sql-server' | 'mysql' | 'postgresql' | 'aurora-mysql' | 'aurora-postgresql' | 'rds-mysql' | 'rds-postgresql' | 'rds-sql-server' | 'rds-oracle'
export type SchemaTool = 'none' | 'schema-conversion'
export type TaskType = 'full-load' | 'full-load-cdc' | 'cdc-only'

export const ENGINE_LABEL: Record<Engine, string> = {
  oracle: 'Oracle no data center',
  'sql-server': 'SQL Server no data center',
  mysql: 'MySQL no data center',
  postgresql: 'PostgreSQL no data center',
  'aurora-mysql': 'Aurora MySQL',
  'aurora-postgresql': 'Aurora PostgreSQL',
  'rds-mysql': 'RDS for MySQL',
  'rds-postgresql': 'RDS for PostgreSQL',
  'rds-sql-server': 'RDS for SQL Server',
  'rds-oracle': 'RDS for Oracle',
}

/** Família do motor: a migração é homogênea quando origem e destino são da mesma família. */
export const ENGINE_FAMILY: Record<Engine, string> = {
  oracle: 'oracle',
  'rds-oracle': 'oracle',
  'sql-server': 'sql-server',
  'rds-sql-server': 'sql-server',
  mysql: 'mysql',
  'rds-mysql': 'mysql',
  'aurora-mysql': 'mysql',
  postgresql: 'postgresql',
  'rds-postgresql': 'postgresql',
  'aurora-postgresql': 'postgresql',
}

export const SCHEMA_LABEL: Record<SchemaTool, string> = { none: 'Sem conversão de esquema', 'schema-conversion': 'Converter o esquema (DMS Schema Conversion ou AWS SCT)' }
export const TASK_LABEL: Record<TaskType, string> = { 'full-load': 'Carga completa (Migrate existing data)', 'full-load-cdc': 'Carga completa e captura de mudanças (full load and CDC)', 'cdc-only': 'Só captura de mudanças (CDC)' }

export const LOAD_GB_PER_HOUR = 200
export const CUTOVER_MIN = 10

export interface MigrationScenario {
  source: Engine
  target: Engine
  sizeGB: number
  /** Minutos que o sistema pode ficar sem gravar na virada. */
  maxDowntimeMin: number
  /** O destino já recebeu a carga inicial por outro caminho (ex.: backup nativo). */
  targetPreloaded?: boolean
  /** Origem e destino precisam ficar sincronizados por semanas antes da virada. */
  parallelRun?: boolean
  /** Exige comprovar que os dados chegaram iguais. */
  mustValidate?: boolean
}

export interface MigrationPlan {
  schema: SchemaTool
  task?: TaskType
  validation: boolean
}

export const isHeterogeneous = (s: MigrationScenario) => ENGINE_FAMILY[s.source] !== ENGINE_FAMILY[s.target]

/** Minutos sem gravação na virada (Infinity = o plano não chega a migrar tudo). */
export function downtimeMin(s: MigrationScenario, task: TaskType): number {
  if (task === 'full-load') return Math.ceil((s.sizeGB / LOAD_GB_PER_HOUR) * 60)
  if (task === 'cdc-only') return s.targetPreloaded ? CUTOVER_MIN : Infinity
  return CUTOVER_MIN
}

export interface PlanCheck {
  id: 'schema' | 'task' | 'validation'
  ok: boolean
  message: string
}

export function checkPlan(s: MigrationScenario, p: MigrationPlan): PlanCheck[] {
  const het = isHeterogeneous(s)
  const schema: PlanCheck = het
    ? p.schema === 'schema-conversion'
      ? { id: 'schema', ok: true, message: `De ${ENGINE_LABEL[s.source]} para ${ENGINE_LABEL[s.target]} os motores são diferentes: tabelas, views, procedures e funções precisam ser convertidos antes de o DMS mover os dados.` }
      : { id: 'schema', ok: false, message: `Os motores são diferentes: sem converter o esquema, procedures, funções e tipos do ${ENGINE_LABEL[s.source]} não existem no destino.` }
    : { id: 'schema', ok: true, message: p.schema === 'schema-conversion' ? 'O motor é o mesmo: a conversão não muda nada, mas também não atrapalha.' : 'O motor é o mesmo: o esquema vai como está.' }

  let task: PlanCheck
  if (!p.task) task = { id: 'task', ok: false, message: 'Escolha o tipo de tarefa do DMS.' }
  else {
    const d = downtimeMin(s, p.task)
    if (s.targetPreloaded && p.task !== 'cdc-only') task = { id: 'task', ok: false, message: 'O destino já tem a carga inicial: uma nova carga completa recarregaria tudo. Basta replicar as mudanças.' }
    else if (!Number.isFinite(d)) task = { id: 'task', ok: false, message: 'Só a captura de mudanças, sem carga inicial, deixa de fora os dados que já existiam.' }
    else if (s.parallelRun && p.task === 'full-load') task = { id: 'task', ok: false, message: 'A carga completa copia uma vez e para: o destino não acompanha as mudanças durante as semanas em paralelo.' }
    else if (d > s.maxDowntimeMin) task = { id: 'task', ok: false, message: `A carga completa de ${s.sizeGB.toLocaleString('pt-BR')} GB leva cerca de ${d} minutos sem gravações, acima dos ${s.maxDowntimeMin} permitidos.` }
    else task = { id: 'task', ok: true, message: p.task === 'full-load' ? `A carga completa leva cerca de ${d} minutos, dentro da janela.` : `A virada para o banco novo leva cerca de ${d} minutos, com o destino já sincronizado.` }
  }

  const validation: PlanCheck = s.mustValidate
    ? p.validation
      ? { id: 'validation', ok: true, message: 'A validação compara origem e destino, inclusive as mudanças replicadas.' }
      : { id: 'validation', ok: false, message: 'A auditoria exige comprovar que os dados chegaram iguais: ligue a validação do DMS.' }
    : { id: 'validation', ok: true, message: p.validation ? 'Validação ligada, mesmo sem exigência.' : 'Sem exigência de comprovação.' }
  return [schema, task, validation]
}

/** Um plano que atende (o mais simples). */
export function referencePlan(s: MigrationScenario): MigrationPlan {
  const schema: SchemaTool = isHeterogeneous(s) ? 'schema-conversion' : 'none'
  for (const task of ['full-load', 'cdc-only', 'full-load-cdc'] as TaskType[]) {
    const p = { schema, task, validation: Boolean(s.mustValidate) }
    if (checkPlan(s, p).every((c) => c.ok)) return p
  }
  throw new Error('Nenhum plano atende ao cenário')
}
