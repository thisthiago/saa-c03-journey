/**
 * Atualização de uma stack do CloudFormation: o que acontece com cada
 * recurso (criado, atualizado sem interrupção ou com alguma interrupção,
 * substituído, removido) e o destino do recurso antigo conforme as políticas.
 *
 * Fatos conferidos em 21/10/2026:
 * - Comportamentos de atualização (sem interrupção, com alguma interrupção e substituição; o recurso novo é criado antes e o antigo, apagado por padrão): https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-update-behaviors.html
 * - Comportamento de cada propriedade, na referência de cada tipo de recurso (consulta de "Update requires"): https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-instance.html e as páginas aws-resource-rds-dbinstance, aws-resource-s3-bucket, aws-resource-dynamodb-table, aws-resource-lambda-function e aws-resource-ec2-securitygroup
 * - DeletionPolicy (Delete é o padrão; Retain, RetainExceptOnCreate e Snapshot; vale também para recurso removido do modelo; não vale para recurso substituído; o padrão de AWS::RDS::DBInstance sem DBClusterIdentifier é Snapshot; só alguns tipos aceitam Snapshot, como EC2::Volume e RDS::DBInstance): https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-deletionpolicy.html
 * - UpdateReplacePolicy (o que fazer com o recurso antigo substituído: Delete, que é o padrão, Retain ou Snapshot): https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-updatereplacepolicy.html
 *
 * Só entram propriedades cujo comportamento foi lido na referência. A página
 * do guia do usuário cita a propriedade Port do AWS::RDS::DBInstance como
 * exemplo de substituição, mas a referência a indica como "alguma
 * interrupção": como as duas fontes divergem, ela fica de fora.
 */

export type UpdateBehavior = 'none' | 'some' | 'replace'

export const BEHAVIOR_ORDER: Record<UpdateBehavior, number> = { none: 0, some: 1, replace: 2 }

export const BEHAVIOR_LABEL: Record<UpdateBehavior, string> = {
  none: 'sem interrupção',
  some: 'com alguma interrupção',
  replace: 'substituição',
}

/** Comportamento de atualização de cada propriedade conferida. */
export const CATALOG: Record<string, Record<string, UpdateBehavior>> = {
  'AWS::EC2::Instance': { InstanceType: 'some', ImageId: 'replace', AvailabilityZone: 'replace', SubnetId: 'replace', KeyName: 'replace', UserData: 'some', Tags: 'none', IamInstanceProfile: 'none' },
  'AWS::RDS::DBInstance': { DBInstanceClass: 'some', AllocatedStorage: 'none', DBInstanceIdentifier: 'replace', MasterUsername: 'replace', StorageEncrypted: 'replace', PubliclyAccessible: 'none' },
  'AWS::S3::Bucket': { BucketName: 'replace', Tags: 'none', BucketEncryption: 'none', PublicAccessBlockConfiguration: 'none' },
  'AWS::DynamoDB::Table': { TableName: 'replace', BillingMode: 'none', TimeToLiveSpecification: 'none', Tags: 'none' },
  'AWS::Lambda::Function': { FunctionName: 'replace', Runtime: 'none', MemorySize: 'none', Timeout: 'none' },
  'AWS::EC2::SecurityGroup': { GroupDescription: 'replace', GroupName: 'replace', VpcId: 'replace', Tags: 'none' },
}

export const TYPE_LABEL: Record<string, string> = {
  'AWS::EC2::Instance': 'Instância EC2',
  'AWS::RDS::DBInstance': 'Instância RDS',
  'AWS::S3::Bucket': 'Bucket S3',
  'AWS::DynamoDB::Table': 'Tabela do DynamoDB',
  'AWS::Lambda::Function': 'Função Lambda',
  'AWS::EC2::SecurityGroup': 'Security group',
}

/** Tipos que aceitam a política Snapshot (entre os do catálogo). */
export const SNAPSHOT_TYPES = new Set(['AWS::RDS::DBInstance'])

export type Policy = 'Delete' | 'Retain' | 'Snapshot' | 'RetainExceptOnCreate'

export interface StackResource {
  id: string
  type: string
  /** Propriedades que importam para a atualização. */
  props: Record<string, string | number | boolean>
  deletionPolicy?: Policy
  updateReplacePolicy?: 'Delete' | 'Retain' | 'Snapshot'
}

export type Effect = 'created' | 'unchanged' | 'none' | 'some' | 'replaced-delete' | 'replaced-retain' | 'replaced-snapshot' | 'removed-delete' | 'removed-retain' | 'removed-snapshot'

export const EFFECT_LABEL: Record<Effect, string> = {
  created: 'Criado, porque é novo no modelo',
  unchanged: 'Fica como está, sem alteração',
  none: 'Atualizado sem interrupção, com o mesmo ID físico',
  some: 'Atualizado com alguma interrupção, com o mesmo ID físico',
  'replaced-delete': 'Substituído por um recurso novo; o antigo é apagado',
  'replaced-retain': 'Substituído por um recurso novo; o antigo é mantido, fora da stack',
  'replaced-snapshot': 'Substituído por um recurso novo; o antigo é apagado depois de um snapshot',
  'removed-delete': 'Removido da stack e apagado',
  'removed-retain': 'Removido da stack e mantido na conta',
  'removed-snapshot': 'Removido da stack e apagado depois de um snapshot',
}

/** Política efetiva de exclusão: o RDS sem cluster tem Snapshot como padrão. */
export function effectiveDeletionPolicy(r: StackResource): Policy {
  if (r.deletionPolicy) return r.deletionPolicy
  return r.type === 'AWS::RDS::DBInstance' ? 'Snapshot' : 'Delete'
}

/** Problemas de configuração das políticas que a AWS recusaria. */
export function policyProblems(r: StackResource): string[] {
  const out: string[] = []
  if (r.deletionPolicy === 'Snapshot' && !SNAPSHOT_TYPES.has(r.type)) out.push(`${r.id}: ${r.type} não aceita a política Snapshot`)
  if (r.updateReplacePolicy === 'Snapshot' && !SNAPSHOT_TYPES.has(r.type)) out.push(`${r.id}: ${r.type} não aceita a política Snapshot`)
  return out
}

export interface ChangedProp {
  prop: string
  before: string | number | boolean | undefined
  after: string | number | boolean | undefined
  behavior: UpdateBehavior
}

export interface ResourcePlan {
  id: string
  type: string
  effect: Effect
  changed: ChangedProp[]
  /** Frase que explica por que o efeito é esse. */
  why: string
}

export function changedProps(before: StackResource, after: StackResource): ChangedProp[] {
  const names = [...new Set([...Object.keys(before.props), ...Object.keys(after.props)])]
  return names
    .filter((p) => before.props[p] !== after.props[p])
    .map((prop) => {
      const behavior = CATALOG[after.type]?.[prop]
      if (!behavior) throw new Error(`Propriedade sem comportamento conferido: ${after.type}.${prop}`)
      return { prop, before: before.props[prop], after: after.props[prop], behavior }
    })
}

export function planResource(before: StackResource | undefined, after: StackResource | undefined): ResourcePlan {
  if (!before && after) return { id: after.id, type: after.type, effect: 'created', changed: [], why: 'Um recurso novo no modelo é criado pela atualização.' }
  if (before && !after) {
    const pol = effectiveDeletionPolicy(before)
    const effect: Effect = pol === 'Retain' || pol === 'RetainExceptOnCreate' ? 'removed-retain' : pol === 'Snapshot' ? 'removed-snapshot' : 'removed-delete'
    const why = pol === 'Delete' ? 'O recurso saiu do modelo e a política de exclusão é a padrão, Delete: ele é apagado.' : pol === 'Snapshot' ? `O recurso saiu do modelo e a política de exclusão é Snapshot${before.deletionPolicy ? '' : ' (o padrão do RDS sem cluster)'}: o CloudFormation cria um snapshot e apaga o recurso.` : 'O recurso saiu do modelo e a política de exclusão é Retain: ele continua existindo na conta, fora da stack.'
    return { id: before.id, type: before.type, effect, changed: [], why }
  }
  if (!before || !after) throw new Error('Recurso ausente nos dois modelos')
  const changed = changedProps(before, after)
  if (changed.length === 0) return { id: after.id, type: after.type, effect: 'unchanged', changed, why: 'Nenhuma propriedade mudou: o recurso não é tocado.' }
  const worst = changed.reduce<UpdateBehavior>((w, c) => (BEHAVIOR_ORDER[c.behavior] > BEHAVIOR_ORDER[w] ? c.behavior : w), 'none')
  if (worst === 'replace') {
    const culprit = changed.find((c) => c.behavior === 'replace')!
    const pol = after.updateReplacePolicy ?? 'Delete'
    const effect: Effect = pol === 'Retain' ? 'replaced-retain' : pol === 'Snapshot' ? 'replaced-snapshot' : 'replaced-delete'
    const old = pol === 'Delete' ? 'o antigo é apagado (UpdateReplacePolicy padrão: Delete)' : pol === 'Retain' ? 'o antigo é mantido (UpdateReplacePolicy: Retain)' : 'o antigo é apagado depois de um snapshot (UpdateReplacePolicy: Snapshot)'
    return { id: after.id, type: after.type, effect, changed, why: `Mudar ${culprit.prop} exige substituição: o CloudFormation cria o recurso novo, com ID novo, e ${old}. A DeletionPolicy não vale para recursos substituídos.` }
  }
  return {
    id: after.id,
    type: after.type,
    effect: worst,
    changed,
    why: worst === 'some' ? `Mudar ${changed.filter((c) => c.behavior === 'some').map((c) => c.prop).join(' e ')} atualiza o recurso com alguma interrupção, mantendo o ID físico.` : 'Todas as propriedades mudadas são atualizadas sem interrupção, mantendo o ID físico.',
  }
}

/** Plano da atualização: um item por recurso presente em qualquer dos dois modelos. */
export function planUpdate(current: StackResource[], next: StackResource[]): ResourcePlan[] {
  const ids = [...new Set([...current.map((r) => r.id), ...next.map((r) => r.id)])]
  return ids.map((id) => planResource(current.find((r) => r.id === id), next.find((r) => r.id === id)))
}

/** Recursos perdidos com dados: substituídos ou removidos com exclusão sem snapshot, de tipos que guardam dados. */
export const DATA_TYPES = new Set(['AWS::RDS::DBInstance', 'AWS::DynamoDB::Table', 'AWS::S3::Bucket'])

export function dataLoss(p: ResourcePlan): boolean {
  return DATA_TYPES.has(p.type) && (p.effect === 'replaced-delete' || p.effect === 'removed-delete')
}
