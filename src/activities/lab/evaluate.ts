/** Avaliação dos laboratórios: verifica os objetivos sobre o estado do simulador. */
import type { ItemFeedback } from '../../engine/types'
import {
  acceptedAnswers,
  bucketLabSolution,
  isTaskCorrect,
  type BucketLabResponse,
} from '../../simulators/bucket/lab'
import { evaluateAccessLab, initialAccessResponse, type AccessLabResponse } from '../../simulators/access/lab'
import { costLabSolution, evaluateCostLab, type CostLabResponse } from '../../simulators/cost/lab'
import { evaluateVersioningLab, versioningLabSolution, type VersioningLabResponse } from '../../simulators/versioning/lab'
import { evaluateLifecycleLab, type LifecycleLabResponse } from '../../simulators/lifecycle/lab'
import { evaluateReplicationLab, initialReplicationResponse, type ReplicationLabResponse } from '../../simulators/replication/lab'
import { evaluateEventsLab, initialEventsResponse, type EventsLabResponse } from '../../simulators/events/lab'
import { evaluateRPLab, rpLabSolution, type RPLabResponse } from '../../simulators/requester-pays/lab'
import { evaluateGatewayLab, gatewayLabSolution, type GatewayLabResponse } from '../../simulators/gateway/lab'
import { evaluateTransferLab, transferLabSolution, type TransferLabResponse } from '../../simulators/transfer/lab'
import { architectureSolution, evaluateArchitectureLab, type ArchitectureLabResponse } from '../../simulators/architecture/lab'
import { evaluateRegionLab, regionLabSolution, type RegionLabResponse } from '../../simulators/regions/lab'
import { evaluateZonesLab, zonesInitial, zonesSolution, type ZonesLabResponse } from '../../simulators/zones/lab'
import { evaluateEdgeLab, type EdgeLabResponse } from '../../simulators/edge/lab'
import { evaluatePlacementLab, placementSolution, type PlacementLabResponse } from '../../simulators/placement/lab'
import { evaluateSupportLab, supportLabSolution, type SupportLabResponse } from '../../simulators/support/lab'
import { evaluateResponsibilityLab, responsibilitySolution, type ResponsibilityLabResponse } from '../../simulators/responsibility/lab'
import { credentialsSolution, evaluateCredentialsLab, type CredentialsLabResponse } from '../../simulators/credentials/lab'
import { builderInitial, evaluateBuilderLab, type BuilderLabResponse } from '../../simulators/policy/builder'
import { evaluateLayersLab, layersInitial, type LayersLabResponse } from '../../simulators/policy/layers'
import { evaluateTrustLab, trustInitial, type TrustLabResponse } from '../../simulators/sts/lab'
import { evaluateIdentityLab, identitySolution, type IdentityLabResponse } from '../../simulators/identity/lab'
import { evaluateOrgLab, orgInitial, type OrgLabResponse } from '../../simulators/org/lab'
import { evaluateInstancePickerLab, instancePickerSolution, type InstancePickerLabResponse } from '../../simulators/instances/lab'
import { evaluateVolumesLab, volumesSolution, type VolumesLabResponse } from '../../simulators/ebs/lab'
import { evaluatePurchaseLab, purchaseSolution, type PurchaseLabResponse } from '../../simulators/purchase/lab'
import { evaluateLbLab, lbInitial, type LbLabResponse } from '../../simulators/loadbalancer/lab'
import { evaluateScalingLab, type ScalingLabResponse } from '../../simulators/scaling/lab'
import { evaluateLambdaLab, type LambdaLabResponse } from '../../simulators/lambda/lab'
import { chooserSolution, evaluateChooserLab, type ChooserLabResponse } from '../../simulators/chooser/lab'
import { dbSizingSolution, evaluateDbSizingLab, type DbSizingLabResponse } from '../../simulators/dbsize/lab'
import { evaluateRdsHaLab, rdsHaInitial, rdsHaSolution, type RdsHaLabResponse } from '../../simulators/rdsha/lab'
import { ddbKeysSolution, evaluateDdbKeysLab, type DdbKeysLabResponse } from '../../simulators/dynamo/lab'
import { dbChooserSolution, evaluateDbChooserLab, type DbChooserLabResponse } from '../../simulators/dbchooser/lab'
import { cacheInitial, cacheSolution, evaluateCacheLab, type CacheLabResponse } from '../../simulators/cachedb/lab'
import { dbSecureSolution, evaluateDbSecureLab, type DbSecureLabResponse } from '../../simulators/dbsecure/lab'
import { evaluateMigrationLab, migrationInitial, migrationSolution, type MigrationLabResponse } from '../../simulators/migration/lab'
import type { LabActivity } from '../types'

export interface LabItemScore {
  concepts?: string[]
  score: number
  fb: ItemFeedback
}

export interface LabResult {
  score: number
  items: LabItemScore[]
}

export function evaluateLab(activity: LabActivity, response: unknown): LabResult {
  switch (activity.lab) {
    case 'bucket': {
      const r = (response as BucketLabResponse | undefined) ?? { answers: {} }
      const items = activity.config.tasks.map((t) => {
        const value = r.answers?.[t.id]
        const ok = isTaskCorrect(activity.config, t, value)
        const expected = acceptedAnswers(activity.config, t)
        return {
          concepts: t.concepts,
          score: ok ? 1 : 0,
          fb: {
            id: t.id,
            label: t.prompt,
            status: ok ? 'correct' : value ? 'wrong' : 'missed',
            message: ok
              ? t.explanation
              : `Resposta esperada: ${expected.length > 1 ? expected.join(' ou ') : expected[0]}. ${t.explanation}`,
          } as ItemFeedback,
        }
      })
      return { score: items.reduce((s, i) => s + i.score, 0) / Math.max(1, items.length), items }
    }
    case 'cost':
      return evaluateCostLab(activity.config, (response as CostLabResponse | undefined) ?? { choices: {} })
    case 'access':
      return evaluateAccessLab(activity.config, (response as AccessLabResponse | undefined) ?? initialAccessResponse(activity.config))
    case 'versioning':
      return evaluateVersioningLab(activity.config, (response as VersioningLabResponse | undefined) ?? { ops: [] })
    case 'lifecycle':
      return evaluateLifecycleLab(activity.config, (response as LifecycleLabResponse | undefined) ?? { rules: activity.config.initialRules })
    case 'replication':
      return evaluateReplicationLab(activity.config, (response as ReplicationLabResponse | undefined) ?? initialReplicationResponse(activity.config))
    case 'events':
      return evaluateEventsLab(activity.config, (response as EventsLabResponse | undefined) ?? initialEventsResponse(activity.config))
    case 'requester-pays':
      return evaluateRPLab(activity.config, (response as RPLabResponse | undefined) ?? { answers: {} })
    case 'gateway':
      return evaluateGatewayLab(activity.config, (response as GatewayLabResponse | undefined) ?? { choices: {} })
    case 'transfer':
      return evaluateTransferLab(activity.config, (response as TransferLabResponse | undefined) ?? { choices: {} })
    case 'architecture':
      return evaluateArchitectureLab(activity.config, (response as ArchitectureLabResponse | undefined) ?? { answers: {}, step: 0 })
    case 'region':
      return evaluateRegionLab(activity.config, (response as RegionLabResponse | undefined) ?? { choices: {} })
    case 'zones':
      return evaluateZonesLab(activity.config, (response as ZonesLabResponse | undefined) ?? zonesInitial(activity.config))
    case 'edge':
      return evaluateEdgeLab(activity.config, (response as EdgeLabResponse | undefined) ?? structuredClone(activity.config.initial))
    case 'placement':
      return evaluatePlacementLab(activity.config, (response as PlacementLabResponse | undefined) ?? { placements: {} })
    case 'support':
      return evaluateSupportLab(activity.config, (response as SupportLabResponse | undefined) ?? { choices: {} })
    case 'responsibility':
      return evaluateResponsibilityLab(activity.config, (response as ResponsibilityLabResponse | undefined) ?? { cells: {} })
    case 'credentials':
      return evaluateCredentialsLab(activity.config, (response as CredentialsLabResponse | undefined) ?? { picks: {} })
    case 'policy-builder':
      return evaluateBuilderLab(activity.config, (response as BuilderLabResponse | undefined) ?? builderInitial(activity.config))
    case 'policy-layers':
      return evaluateLayersLab(activity.config, (response as LayersLabResponse | undefined) ?? layersInitial(activity.config))
    case 'trust':
      return evaluateTrustLab(activity.config, (response as TrustLabResponse | undefined) ?? trustInitial(activity.config))
    case 'identity':
      return evaluateIdentityLab(activity.config, (response as IdentityLabResponse | undefined) ?? { placements: {} })
    case 'org':
      return evaluateOrgLab(activity.config, (response as OrgLabResponse | undefined) ?? orgInitial(activity.config))
    case 'instance-picker':
      return evaluateInstancePickerLab(activity.config, (response as InstancePickerLabResponse | undefined) ?? { picks: {} })
    case 'volumes':
      return evaluateVolumesLab(activity.config, (response as VolumesLabResponse | undefined) ?? { volumes: {} })
    case 'purchase':
      return evaluatePurchaseLab(activity.config, (response as PurchaseLabResponse | undefined) ?? { choices: {} })
    case 'load-balancer':
      return evaluateLbLab(activity.config, (response as LbLabResponse | undefined) ?? lbInitial(activity.config))
    case 'scaling':
      return evaluateScalingLab(activity.config, (response as ScalingLabResponse | undefined) ?? structuredClone(activity.config.initial))
    case 'lambda-concurrency':
      return evaluateLambdaLab(activity.config, (response as LambdaLabResponse | undefined) ?? { settings: structuredClone(activity.config.initial) })
    case 'compute-chooser':
      return evaluateChooserLab(activity.config, (response as ChooserLabResponse | undefined) ?? { placements: {} })
    case 'db-sizing':
      return evaluateDbSizingLab(activity.config, (response as DbSizingLabResponse | undefined) ?? { configs: {} })
    case 'rds-ha':
      return evaluateRdsHaLab(activity.config, (response as RdsHaLabResponse | undefined) ?? rdsHaInitial(activity.config))
    case 'ddb-keys':
      return evaluateDdbKeysLab(activity.config, (response as DdbKeysLabResponse | undefined) ?? { tables: {} })
    case 'db-chooser':
      return evaluateDbChooserLab(activity.config, (response as DbChooserLabResponse | undefined) ?? { placements: {} })
    case 'cache-sim':
      return evaluateCacheLab(activity.config, (response as CacheLabResponse | undefined) ?? cacheInitial(activity.config))
    case 'db-secure':
      return evaluateDbSecureLab(activity.config, (response as DbSecureLabResponse | undefined) ?? structuredClone(activity.config.initial))
    case 'migration':
      return evaluateMigrationLab(activity.config, (response as MigrationLabResponse | undefined) ?? migrationInitial(activity.config))
  }
}

export function labSolution(activity: LabActivity): unknown {
  switch (activity.lab) {
    case 'bucket':
      return bucketLabSolution(activity.config)
    case 'cost':
      return costLabSolution(activity.config)
    case 'access':
      return activity.config.solution
    case 'versioning':
      return versioningLabSolution(activity.config)
    case 'lifecycle':
    case 'replication':
    case 'events':
      return activity.config.solution
    case 'requester-pays':
      return rpLabSolution(activity.config)
    case 'gateway':
      return gatewayLabSolution(activity.config)
    case 'transfer':
      return transferLabSolution(activity.config)
    case 'architecture':
      return architectureSolution(activity.config)
    case 'region':
      return regionLabSolution(activity.config)
    case 'zones':
      return zonesSolution(activity.config)
    case 'edge':
      return structuredClone(activity.config.solution)
    case 'placement':
      return placementSolution(activity.config)
    case 'support':
      return supportLabSolution(activity.config)
    case 'responsibility':
      return responsibilitySolution(activity.config)
    case 'credentials':
      return credentialsSolution(activity.config)
    case 'policy-builder':
      return { statements: structuredClone(activity.config.solution) }
    case 'policy-layers':
    case 'trust':
      return structuredClone(activity.config.solution)
    case 'identity':
      return identitySolution(activity.config)
    case 'org':
      return structuredClone(activity.config.solution)
    case 'instance-picker':
      return instancePickerSolution(activity.config)
    case 'volumes':
      return volumesSolution(activity.config)
    case 'purchase':
      return purchaseSolution(activity.config)
    case 'load-balancer':
    case 'scaling':
      return structuredClone(activity.config.solution)
    case 'lambda-concurrency':
      return { settings: structuredClone(activity.config.solution) }
    case 'compute-chooser':
      return chooserSolution(activity.config)
    case 'db-sizing':
      return dbSizingSolution(activity.config)
    case 'rds-ha':
      return rdsHaSolution(activity.config)
    case 'ddb-keys':
      return ddbKeysSolution(activity.config)
    case 'db-chooser':
      return dbChooserSolution(activity.config)
    case 'cache-sim':
      return cacheSolution(activity.config)
    case 'db-secure':
      return dbSecureSolution(activity.config)
    case 'migration':
      return migrationSolution(activity.config)
  }
}

/** Estado inicial (vazio) do laboratório. Os testes garantem que ele não é aprovado. */
export function labInitialResponse(activity: LabActivity): unknown {
  switch (activity.lab) {
    case 'bucket':
      return { answers: {} }
    case 'cost':
      return { choices: {} }
    case 'access':
      return initialAccessResponse(activity.config)
    case 'versioning':
      return { ops: [] }
    case 'lifecycle':
      return { rules: structuredClone(activity.config.initialRules) }
    case 'replication':
      return initialReplicationResponse(activity.config)
    case 'events':
      return initialEventsResponse(activity.config)
    case 'requester-pays':
      return { answers: {} }
    case 'gateway':
    case 'transfer':
    case 'region':
    case 'support':
      return { choices: {} }
    case 'architecture':
      return { answers: {}, step: 0 }
    case 'zones':
      return zonesInitial(activity.config)
    case 'edge':
      return structuredClone(activity.config.initial)
    case 'placement':
      return { placements: {} }
    case 'responsibility':
      return { cells: {} }
    case 'credentials':
      return { picks: {} }
    case 'policy-builder':
      return builderInitial(activity.config)
    case 'policy-layers':
      return layersInitial(activity.config)
    case 'trust':
      return trustInitial(activity.config)
    case 'identity':
      return { placements: {} }
    case 'org':
      return orgInitial(activity.config)
    case 'instance-picker':
      return { picks: {} }
    case 'volumes':
      return { volumes: {} }
    case 'purchase':
      return { choices: {} }
    case 'load-balancer':
      return lbInitial(activity.config)
    case 'scaling':
      return structuredClone(activity.config.initial)
    case 'lambda-concurrency':
      return { settings: structuredClone(activity.config.initial) }
    case 'compute-chooser':
      return { placements: {} }
    case 'db-sizing':
      return { configs: {} }
    case 'rds-ha':
      return rdsHaInitial(activity.config)
    case 'ddb-keys':
      return { tables: {} }
    case 'db-chooser':
      return { placements: {} }
    case 'cache-sim':
      return cacheInitial(activity.config)
    case 'db-secure':
      return structuredClone(activity.config.initial)
    case 'migration':
      return migrationInitial(activity.config)
  }
}
