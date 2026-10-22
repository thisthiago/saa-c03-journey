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
import { logsLabComplete, type LogsLabResponse } from '../simulators/logs/lab'
import { stackLabComplete, type StackLabResponse } from '../simulators/stack/lab'
import { budgetLabComplete, type BudgetLabResponse } from '../simulators/budget/lab'
import { vpcPlannerComplete, type VpcPlannerLabResponse } from '../simulators/vpcnet/planner'
import { connectComplete, type ConnectLabResponse } from '../simulators/connect/lab'
import { endpointsComplete, type EndpointsLabResponse } from '../simulators/endpoints/lab'
import { secretsComplete, type SecretsLabResponse } from '../simulators/secrets/lab'
import { certsComplete, type CertsLabResponse } from '../simulators/certs/lab'
import { findingsComplete, type FindingsLabResponse } from '../simulators/findings/lab'
import { queueComplete, type QueueLabResponse } from '../simulators/queue/lab'
import { workflowComplete, type WorkflowLabResponse } from '../simulators/workflow/lab'
import { apiComplete, type ApiLabResponse } from '../simulators/apigw/lab'
import { streamComplete, type StreamLabResponse } from '../simulators/stream/lab'
import { filterComplete, type FilterLabResponse } from '../simulators/eventbus/lab'
import { filesystemComplete, type FilesystemLabResponse } from '../simulators/filesystem/lab'
import { backupComplete, type BackupLabResponse } from '../simulators/backup/lab'
import { waReviewComplete, type WaReviewLabResponse } from '../simulators/wareview/lab'
import { drComplete, type DrLabResponse } from '../simulators/dr/lab'
import { transferCostComplete, type TransferCostLabResponse } from '../simulators/transfercost/lab'
import { rightsizingComplete, type RightsizingLabResponse } from '../simulators/rightsizing/lab'
import { migrationPlanComplete, type MigrationPlanLabResponse } from '../simulators/migplan/lab'
import { examReaderComplete, type ExamReaderLabResponse } from '../simulators/examreader/lab'
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
        case 'hybrid':
        case 'dns-policy':
        case 'net-chooser':
        case 'ingest':
        case 'ai-chooser':
        case 'ana-chooser':
        case 'sec-chooser':
        case 'int-chooser':
        case 'fs-chooser':
        case 'perf-chooser':
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
        case 'ops-chooser':
        case 'compliance':
        case 'trail':
        case 'alarm':
        case 'route-table':
        case 'reach':
        case 'datalake':
        case 'lakeperm':
        case 'emr':
        case 'kms':
          return true
        case 'secrets':
          return secretsComplete(activity.config, response as unknown as SecretsLabResponse)
        case 'certs':
          return certsComplete(activity.config, response as unknown as CertsLabResponse)
        case 'findings':
          return findingsComplete(activity.config, response as unknown as FindingsLabResponse)
        case 'queue':
          return queueComplete(activity.config, response as unknown as QueueLabResponse)
        case 'workflow':
          return workflowComplete(activity.config, response as unknown as WorkflowLabResponse)
        case 'apigw':
          return apiComplete(activity.config, response as unknown as ApiLabResponse)
        case 'stream':
          return streamComplete(activity.config, response as unknown as StreamLabResponse)
        case 'pubsub':
        case 'eventbus':
          return filterComplete(activity.config, response as unknown as FilterLabResponse)
        case 'filesystem':
          return filesystemComplete(activity.config, response as unknown as FilesystemLabResponse)
        case 'backup':
          return backupComplete(activity.config, response as unknown as BackupLabResponse)
        case 'wa-review':
          return waReviewComplete(activity.config, response as unknown as WaReviewLabResponse)
        case 'dr':
          return drComplete(activity.config, response as unknown as DrLabResponse)
        case 'transfer-cost':
          return transferCostComplete(activity.config, response as unknown as TransferCostLabResponse)
        case 'rightsizing':
          return rightsizingComplete(activity.config, response as unknown as RightsizingLabResponse)
        case 'migration-plan':
          return migrationPlanComplete(activity.config, response as unknown as MigrationPlanLabResponse)
        case 'exam-reader':
          return examReaderComplete(activity.config, response as unknown as ExamReaderLabResponse)
        case 'vpc-planner':
          return vpcPlannerComplete(activity.config, response as unknown as VpcPlannerLabResponse)
        case 'connect':
          return connectComplete(activity.config, response as unknown as ConnectLabResponse)
        case 'endpoints':
          return endpointsComplete(activity.config, response as unknown as EndpointsLabResponse)
        case 'db-sizing':
          return dbSizingComplete(activity.config, response as unknown as DbSizingLabResponse)
        case 'ddb-keys':
          return ddbKeysComplete(activity.config, response as unknown as DdbKeysLabResponse)
        case 'logs':
          return logsLabComplete(activity.config, response as unknown as LogsLabResponse)
        case 'stack':
          return stackLabComplete(activity.config, response as unknown as StackLabResponse)
        case 'budget':
          return budgetLabComplete(activity.config, response as unknown as BudgetLabResponse)
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
    case 'hybrid':
    case 'dns-policy':
    case 'net-chooser':
    case 'perf-chooser':
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
    case 'logs':
      return "Escolha o padrão do filtro, a classe e a retenção de cada grupo de logs."
    case 'stack':
      return "Escolha o efeito da atualização em cada recurso."
    case 'budget':
      return "Ative as tags e configure o orçamento de cada alvo."
    case 'vpc-planner':
      return 'Escolha o bloco da VPC e preencha o bloco de cada sub-rede.'
    case 'connect':
      return 'Escolha uma topologia para cada cenário.'
    case 'endpoints':
      return 'Escolha um caminho para cada carga.'
    case 'datalake':
      return 'Escolha o formato, a compressão e a partição de cada tabela.'
    case 'lakeperm':
      return 'Escolha as concessões de cada analista.'
    case 'emr':
      return 'Monte o cluster de cada job.'
    case 'secrets':
      return 'Escolha o que acontece em cada momento da rotação.'
    case 'certs':
      return 'Responda as duas perguntas de cada certificado.'
    case 'findings':
      return 'Escolha a origem e a ação de cada achado.'
    case 'queue':
      return 'Escolha a visibilidade e a DLQ de cada consumidor.'
    case 'workflow':
      return 'Escolha o Retry e o Catch de cada passo.'
    case 'apigw':
      return 'Escolha a taxa e o burst de cada cliente.'
    case 'stream':
      return 'Escolha a leitura e os shards de cada fluxo.'
    case 'pubsub':
    case 'eventbus':
      return 'Escolha um padrão para cada destino.'
    case 'filesystem':
      return activity.config.mode === 'access' ? 'Escolha o tipo e os mount targets de cada carga.' : 'Escolha a vazão e o ciclo de vida de cada sistema de arquivos.'
    case 'backup':
      return 'Escolha a frequência, o frio, a cópia e a trava de cada recurso.'
    case 'wa-review':
      return 'Escolha o pilar e o nível de risco de cada achado.'
    case 'dr':
      return 'Escolha a estratégia e a Região de recuperação de cada sistema.'
    case 'transfer-cost':
      return 'Escolha a cobrança por GB e a mudança de cada fluxo.'
    case 'rightsizing':
      return 'Escolha o tamanho e a compra de cada frota.'
    case 'migration-plan':
      return 'Escolha a estratégia e a ferramenta de cada sistema.'
    case 'exam-reader':
      return 'Escolha o veredito e o motivo de cada alternativa.'
    default:
      return 'Responda a todas as tarefas.'
  }
}
