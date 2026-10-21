/**
 * Lógica de interface por tipo de atividade (sem componentes): estado inicial,
 * verificação de resposta completa e rótulos.
 */
import type { BucketLabResponse } from '../simulators/bucket/lab'
import type { CostLabResponse } from '../simulators/cost/lab'
import { rpLabComplete, type RPLabResponse } from '../simulators/requester-pays/lab'
import { architectureComplete, type ArchitectureLabResponse } from '../simulators/architecture/lab'
import { credentialsComplete, type CredentialsLabResponse } from '../simulators/credentials/lab'
import { instancePickerComplete, type InstancePickerLabResponse } from '../simulators/instances/lab'
import { volumesComplete, type VolumesLabResponse } from '../simulators/ebs/lab'
import { purchaseComplete, type PurchaseLabResponse } from '../simulators/purchase/lab'
import { dbSizingComplete, type DbSizingLabResponse } from '../simulators/dbsize/lab'
import { ddbKeysComplete, type DdbKeysLabResponse } from '../simulators/dynamo/lab'
import { migrationComplete, type MigrationLabResponse } from '../simulators/migration/lab'
import type {
  ActivityResponse,
  DecisionResponse,
  EstimateResponse,
  InvestigateResponse,
  OrderResponse,
  PlacementResponse,
  PredictResponse,
} from './evaluate'
import { labInitialResponse } from './lab/evaluate'
import { shuffled } from './shared/util'
import type { ActivityDef } from './types'

export function initialResponse(activity: ActivityDef, seed: string): ActivityResponse {
  switch (activity.kind) {
    case 'decision':
      return { selected: [] } satisfies DecisionResponse
    case 'classify':
    case 'match':
      return { placements: {} } satisfies PlacementResponse
    case 'order': {
      const ids = activity.steps.map((st) => st.id)
      let order = shuffled(ids, seed)
      // Nunca começa já na ordem correta.
      if (order.every((id, i) => id === ids[i]) && ids.length > 1) order = [...order.slice(1), order[0]]
      return { order } satisfies OrderResponse
    }
    case 'predict':
      return { option: '' } satisfies PredictResponse
    case 'estimate': {
      const mid = activity.scale === 'log' ? Math.round(Math.sqrt(activity.min * activity.max)) : Math.round((activity.min + activity.max) / 2 / activity.step) * activity.step
      return { value: mid } satisfies EstimateResponse
    }
    case 'investigate':
      return { flagged: [], remediations: [] } satisfies InvestigateResponse
    case 'lab':
      return labInitialResponse(activity) as ActivityResponse
  }
}

/** A resposta está completa o suficiente para ser verificada? */
export function isComplete(activity: ActivityDef, response: ActivityResponse): boolean {
  switch (activity.kind) {
    case 'decision': {
      const r = response as DecisionResponse
      if (r.selected.length === 0) return false
      return !activity.justification || Boolean(r.justification)
    }
    case 'classify':
      return activity.items.every((i) => (response as PlacementResponse).placements[i.id])
    case 'match':
      return activity.pairs.every((p) => (response as PlacementResponse).placements[p.id])
    case 'order':
      return true
    case 'predict':
      return Boolean((response as PredictResponse).option)
    case 'estimate':
      return Number.isFinite((response as EstimateResponse).value)
    case 'investigate': {
      const r = response as InvestigateResponse
      return r.flagged.length > 0 && Boolean(r.rootCause) && r.remediations.length > 0
    }
    case 'lab':
      switch (activity.lab) {
        case 'bucket':
          return activity.config.tasks.every((t) => ((response as unknown as BucketLabResponse).answers?.[t.id] ?? '').trim() !== '')
        case 'cost':
          return activity.config.profiles.every((p) => Boolean((response as unknown as CostLabResponse).choices?.[p.id]))
        case 'access':
          return true
        case 'versioning':
          return ((response as unknown as { ops?: unknown[] }).ops ?? []).length > 0
        case 'lifecycle':
        case 'replication':
        case 'events':
          return true
        case 'requester-pays':
          return rpLabComplete(activity.config, response as unknown as RPLabResponse)
        case 'gateway':
          return activity.config.workloads.every((w) => Boolean((response as unknown as { choices?: Record<string, string> }).choices?.[w.id]))
        case 'transfer':
          return activity.config.scenarios.every((w) => Boolean((response as unknown as { choices?: Record<string, string> }).choices?.[w.id]))
        case 'architecture':
          return architectureComplete(activity.config, response as unknown as ArchitectureLabResponse)
        case 'region':
          return activity.config.scenarios.every((sc) => Boolean((response as unknown as { choices?: Record<string, string> }).choices?.[sc.id]))
        case 'placement':
        case 'identity':
        case 'compute-chooser':
        case 'db-chooser':
          return activity.config.items.every((i) => Boolean((response as unknown as { placements?: Record<string, string> }).placements?.[i.id]))
        case 'support':
          return activity.config.scenarios.every((sc) => Boolean((response as unknown as { choices?: Record<string, string> }).choices?.[sc.id]))
        case 'responsibility': {
          const cells = (response as unknown as { cells?: Record<string, string> }).cells ?? {}
          return activity.config.layers.every((l) => activity.config.services.every((sv) => Boolean(cells[`${l.id}:${sv}`])))
        }
        case 'zones':
        case 'edge':
        case 'policy-builder':
        case 'policy-layers':
        case 'trust':
        case 'org':
          return true
        case 'credentials':
          return credentialsComplete(activity.config, response as unknown as CredentialsLabResponse)
        case 'instance-picker':
          return instancePickerComplete(activity.config, response as unknown as InstancePickerLabResponse)
        case 'volumes':
          return volumesComplete(activity.config, response as unknown as VolumesLabResponse)
        case 'purchase':
          return purchaseComplete(activity.config, response as unknown as PurchaseLabResponse)
        case 'load-balancer':
        case 'scaling':
        case 'lambda-concurrency':
        case 'rds-ha':
        case 'cache-sim':
        case 'db-secure':
          return true
        case 'db-sizing':
          return dbSizingComplete(activity.config, response as unknown as DbSizingLabResponse)
        case 'ddb-keys':
          return ddbKeysComplete(activity.config, response as unknown as DdbKeysLabResponse)
        case 'migration':
          return migrationComplete(activity.config, response as unknown as MigrationLabResponse)
      }
  }
}

/** Mensagem exibida quando a resposta ainda está incompleta. */
export function incompleteHint(activity: ActivityDef): string {
  switch (activity.kind) {
    case 'decision':
      return activity.justification ? 'Escolha uma opção e uma justificativa.' : 'Escolha uma opção.'
    case 'classify':
    case 'match':
      return 'Posicione todos os itens.'
    case 'predict':
      return 'Escolha sua previsão.'
    case 'investigate':
      return 'Marque ao menos uma evidência, escolha a causa e as correções.'
    case 'lab':
      return labHint(activity)
    default:
      return ''
  }
}

export const KIND_LABEL: Record<ActivityDef['kind'], string> = {
  decision: 'Decisão',
  classify: 'Classificação',
  match: 'Associação',
  order: 'Sequência',
  predict: 'Previsão',
  estimate: 'Estimativa',
  investigate: 'Investigação',
  lab: 'Laboratório',
}

function labHint(activity: Extract<ActivityDef, { kind: 'lab' }>): string {
  switch (activity.lab) {
    case 'cost':
      return 'Escolha uma classe para cada perfil.'
    case 'versioning':
      return 'Execute ao menos uma operação.'
    case 'requester-pays':
      return 'Preencha as três respostas de cada requisição.'
    case 'gateway':
      return 'Escolha um gateway para cada sistema.'
    case 'transfer':
      return 'Escolha um método para cada cenário.'
    case 'region':
      return 'Escolha uma Região para cada cenário.'
    case 'placement':
    case 'identity':
    case 'compute-chooser':
    case 'db-chooser':
      return 'Posicione todos os cartões.'
    case 'support':
      return 'Escolha um plano para cada organização.'
    case 'responsibility':
      return 'Indique o responsável por todas as camadas de todos os serviços.'
    case 'architecture':
      return `Responda às perguntas das ${activity.config.steps.length} etapas.`
    case 'credentials':
      return 'Escolha ao menos uma ação para cada linha.'
    case 'instance-picker':
      return 'Escolha um tipo de instância para cada carga.'
    case 'volumes':
      return 'Configure um volume para cada carga.'
    case 'purchase':
      return 'Escolha uma opção de compra para cada parte da frota.'
    case 'db-sizing':
      return 'Configure um banco para cada carga.'
    case 'ddb-keys':
      return 'Escolha as chaves e o modo de capacidade de cada tabela.'
    case 'migration':
      return 'Escolha o tipo de tarefa do DMS de cada migração.'
    default:
      return 'Responda a todas as tarefas.'
  }
}
