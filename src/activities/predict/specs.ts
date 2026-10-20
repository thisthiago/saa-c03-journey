/** Cenários de predição: o simulador calcula o resultado real. */
import type { AccessRequest, AccessWorld } from '../../simulators/access/model'
import type { BucketData } from '../../simulators/bucket/model'
import type { DataProfile } from '../../simulators/cost/model'
import type { StorageClassId } from '../../simulators/shared/storageClasses'
import type { VOp } from '../../simulators/versioning/model'
import type { Dataset, LifecycleRule } from '../../simulators/lifecycle/model'
import type { ReplEvent, ReplSetup } from '../../simulators/replication/model'
import type { Destination, EventsConfig, S3Event } from '../../simulators/events/model'
import type { RPBucket, RPRequest } from '../../simulators/requester-pays/model'
import type { RegionScenario } from '../../simulators/regions/model'
import type { Failure, ZonesTopology } from '../../simulators/zones/model'
import type { Behavior, EdgeEvent, EdgeSetup } from '../../simulators/edge/model'
import type { PlanId, Severity } from '../../simulators/support/model'
import type { PolicyScenario, RequestSpec } from '../../simulators/policy/model'
import type { AssumeAttempt, RoleSettings } from '../../simulators/sts/model'

export type PredictSpec =
  | {
      sim: 'bucket-list'
      bucket: BucketData
      prefix: string
      delimiter?: string
      /** O que se pergunta: quantos objetos ou quantos prefixos comuns a listagem retorna. */
      measure: 'contents' | 'prefixes'
    }
  | {
      /** Mudar de classe: o custo mensal sobe, fica parecido ou cai bastante? */
      sim: 'cost-change'
      region: string
      profile: DataProfile
      from: StorageClassId
      to: StorageClassId
    }
  | {
      /** Qual das candidatas é a mais barata (entre as que atendem aos requisitos, se pedido)? */
      sim: 'cost-cheapest'
      region: string
      profile: DataProfile
      candidates: StorageClassId[]
      compliantOnly: boolean
    }
  | AccessPredictSpec
  | VersioningPredictSpec
  | LifecyclePredictSpec
  | { sim: 'replication'; setup: ReplSetup; event: ReplEvent; destination: string }
  /** Requester Pays: `status` → "200"/"403"; `request-payer` → owner/requester/none. */
  | { sim: 'requester-pays'; bucket: RPBucket; request: RPRequest; query: 'status' | 'request-payer' }
  /** Eventos: `valid` → accepted/rejected; `delivered` → yes/no; `loop` → yes/no. */
  | { sim: 'events'; config: EventsConfig; destinations: Destination[]; event: S3Event; query: { type: 'valid' } | { type: 'delivered'; destination: string } | { type: 'loop' } }
  /** Região: `best` → código da melhor Região; `feasible` → yes/no para `region`. */
  | { sim: 'region'; scenario: RegionScenario; query: { type: 'best' } | { type: 'feasible'; region: string } }
  /** AZs: estado da aplicação (available/degraded/down) numa falha. */
  | { sim: 'zones'; topology: ZonesTopology; failure: Failure }
  /** Borda: quem responde (pop/rec/origin) à última requisição dos eventos. */
  | { sim: 'edge'; setup: EdgeSetup; behaviors: Behavior[]; events: EdgeEvent[] }
  /** Suporte: primeira resposta em minutos ("none" = plano sem caso técnico). */
  | { sim: 'support'; plan: PlanId; severity: Severity }
  /** Motor de políticas do IAM: allow, explicit-deny ou implicit-deny. */
  | { sim: 'policy'; scenario: PolicyScenario; request: RequestSpec }
  /** AssumeRole: ok, trust-denied, caller-denied, duration-invalid ou mfa-missing. */
  | { sim: 'sts'; scenario: PolicyScenario; role: RoleSettings; attempt: AssumeAttempt }


/** Uma requisição é permitida ou negada? (resultado calculado pelo avaliador de acesso) */
export type AccessPredictSpec = { sim: 'access'; world: AccessWorld; request: AccessRequest }

export type PredictSimId = PredictSpec['sim']

/**
 * Versionamento: executa o histórico e consulta o resultado.
 * `get` → "200:<conteúdo>", "404" ou "405"; `versions` → nº de versões da key; `listed` → nº de keys na listagem.
 */
export type VersioningPredictSpec = {
  sim: 'versioning'
  setup: VOp[]
  query: { type: 'get'; key: string; /** 0 = versão mais recente. Ausente = GET sem versionId. */ versionIndex?: number } | { type: 'versions'; key: string } | { type: 'listed' }
}

/**
 * Lifecycle: `valid` → "accepted" | "rejected"; `state-at` → classe do conjunto no dia (ou "gone").
 */
export type LifecyclePredictSpec = {
  sim: 'lifecycle'
  datasets: Dataset[]
  rules: LifecycleRule[]
  horizonDays: number
  query: { type: 'valid' } | { type: 'state-at'; dataset: string; day: number }
}
