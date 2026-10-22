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
import { evaluateAlarmLab, alarmLabSolution, alarmLabInitial, type AlarmLabResponse } from '../../simulators/alarm/lab'
import { evaluateLogsLab, logsLabSolution, logsLabInitial, type LogsLabResponse } from '../../simulators/logs/lab'
import { evaluateTrailLab, trailLabSolution, trailLabInitial, type TrailLabResponse } from '../../simulators/trail/lab'
import { evaluateComplianceLab, complianceLabSolution, complianceLabInitial, type ComplianceLabResponse } from '../../simulators/compliance/lab'
import { evaluateStackLab, stackLabSolution, stackLabInitial, type StackLabResponse } from '../../simulators/stack/lab'
import { evaluateBudgetLab, budgetLabSolution, budgetLabInitial, type BudgetLabResponse } from '../../simulators/budget/lab'
import { evaluateOpsChooserLab, opsChooserSolution, type OpsChooserLabResponse } from '../../simulators/opschooser/lab'
import { evaluateVpcPlannerLab, vpcPlannerInitial, vpcPlannerSolution, type VpcPlannerLabResponse } from '../../simulators/vpcnet/planner'
import { evaluateRouteTableLab, routeTableInitial, routeTableSolution, type RouteTableLabResponse } from '../../simulators/vpcnet/routing'
import { evaluateReachLab, reachInitial, reachSolution, type ReachLabResponse } from '../../simulators/reach/lab'
import { connectSolution, evaluateConnectLab, type ConnectLabResponse } from '../../simulators/connect/lab'
import { endpointsSolution, evaluateEndpointsLab, type EndpointsLabResponse } from '../../simulators/endpoints/lab'
import { evaluateHybridLab, hybridSolution, type HybridLabResponse } from '../../simulators/hybrid/model'
import { dnsPolicySolution, evaluateDnsPolicyLab, type DnsPolicyLabResponse } from '../../simulators/dns/policy'
import { evaluateNetChooserLab, netChooserSolution, type NetChooserLabResponse } from '../../simulators/netchooser/model'
import { evaluateLakeLab, lakeInitial, lakeSolution, type LakeLabResponse } from '../../simulators/datalake/lab'
import { evaluateLakePermLab, lakePermInitial, lakePermSolution, type LakePermLabResponse } from '../../simulators/lakeperm/lab'
import { emrInitial } from '../../simulators/emr/lab'
import { evaluateEmrLab, emrSolution, type EmrLabResponse } from '../../simulators/emr/lab'
import { evaluateIngestLab, ingestSolution, type IngestLabResponse } from '../../simulators/ingest/model'
import { evaluateAiChooserLab, aiChooserSolution, type AiChooserLabResponse } from '../../simulators/aichooser/model'
import { evaluateAnaChooserLab, anaChooserSolution, type AnaChooserLabResponse } from '../../simulators/anachooser/model'
import { evaluateKmsLab, kmsInitial, kmsSolution, type KmsLabResponse } from '../../simulators/kms/lab'
import { evaluateSecretsLab, secretsSolution, type SecretsLabResponse } from '../../simulators/secrets/lab'
import { certsSolution, evaluateCertsLab, type CertsLabResponse } from '../../simulators/certs/lab'
import { evaluateFindingsLab, findingsSolution, type FindingsLabResponse } from '../../simulators/findings/lab'
import { evaluateSecChooserLab, secChooserSolution, type SecChooserLabResponse } from '../../simulators/secchooser/model'
import { evaluateQueueLab, queueSolution, type QueueLabResponse } from '../../simulators/queue/lab'
import { evaluateWorkflowLab, workflowSolution, type WorkflowLabResponse } from '../../simulators/workflow/lab'
import { evaluateApiLab, apiSolution, type ApiLabResponse } from '../../simulators/apigw/lab'
import { evaluateStreamLab, streamSolution, type StreamLabResponse } from '../../simulators/stream/lab'
import { evaluateFilterLab, filterSolution, type FilterLabResponse } from '../../simulators/eventbus/lab'
import { evaluateIntChooserLab, intChooserSolution, type IntChooserLabResponse } from '../../simulators/intchooser/model'
import { evaluateFilesystemLab, filesystemSolution, type FilesystemLabResponse } from '../../simulators/filesystem/lab'
import { evaluateFsChooserLab, fsChooserSolution, type FsChooserLabResponse } from '../../simulators/fschooser/model'
import { backupSolution, evaluateBackupLab, type BackupLabResponse } from '../../simulators/backup/lab'
import { evaluateWaReviewLab, waReviewSolution, type WaReviewLabResponse } from '../../simulators/wareview/lab'
import { drSolution, evaluateDrLab, type DrLabResponse } from '../../simulators/dr/lab'
import { evaluatePerfChooserLab, perfChooserSolution, type PerfChooserLabResponse } from '../../simulators/perfchooser/model'
import { evaluateTransferCostLab, transferCostSolution, type TransferCostLabResponse } from '../../simulators/transfercost/lab'
import { evaluateRightsizingLab, rightsizingSolution, type RightsizingLabResponse } from '../../simulators/rightsizing/lab'
import { evaluateMigrationPlanLab, migrationPlanSolution, type MigrationPlanLabResponse } from '../../simulators/migplan/lab'
import { evaluateExamReaderLab, examReaderSolution, type ExamReaderLabResponse } from '../../simulators/examreader/lab'
import { gridInitial } from '../../simulators/shared/grid'
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
    case 'alarm':
      return evaluateAlarmLab(activity.config, (response as AlarmLabResponse | undefined) ?? alarmLabInitial(activity.config))
    case 'logs':
      return evaluateLogsLab(activity.config, (response as LogsLabResponse | undefined) ?? logsLabInitial(activity.config))
    case 'trail':
      return evaluateTrailLab(activity.config, (response as TrailLabResponse | undefined) ?? trailLabInitial(activity.config))
    case 'compliance':
      return evaluateComplianceLab(activity.config, (response as ComplianceLabResponse | undefined) ?? complianceLabInitial(activity.config))
    case 'stack':
      return evaluateStackLab(activity.config, (response as StackLabResponse | undefined) ?? stackLabInitial())
    case 'budget':
      return evaluateBudgetLab(activity.config, (response as BudgetLabResponse | undefined) ?? budgetLabInitial())
    case 'ops-chooser':
      return evaluateOpsChooserLab(activity.config, (response as OpsChooserLabResponse | undefined) ?? { placements: {} })
    case 'vpc-planner':
      return evaluateVpcPlannerLab(activity.config, (response as VpcPlannerLabResponse | undefined) ?? vpcPlannerInitial())
    case 'route-table':
      return evaluateRouteTableLab(activity.config, (response as RouteTableLabResponse | undefined) ?? routeTableInitial(activity.config))
    case 'reach':
      return evaluateReachLab(activity.config, (response as ReachLabResponse | undefined) ?? reachInitial(activity.config))
    case 'connect':
      return evaluateConnectLab(activity.config, (response as ConnectLabResponse | undefined) ?? { choices: {} })
    case 'endpoints':
      return evaluateEndpointsLab(activity.config, (response as EndpointsLabResponse | undefined) ?? { choices: {} })
    case 'hybrid':
      return evaluateHybridLab(activity.config, (response as HybridLabResponse | undefined) ?? { placements: {} })
    case 'dns-policy':
      return evaluateDnsPolicyLab(activity.config, (response as DnsPolicyLabResponse | undefined) ?? { placements: {} })
    case 'net-chooser':
      return evaluateNetChooserLab(activity.config, (response as NetChooserLabResponse | undefined) ?? { placements: {} })
    case 'datalake':
      return evaluateLakeLab(activity.config, (response as LakeLabResponse | undefined) ?? lakeInitial(activity.config))
    case 'lakeperm':
      return evaluateLakePermLab(activity.config, (response as LakePermLabResponse | undefined) ?? lakePermInitial(activity.config))
    case 'emr':
      return evaluateEmrLab(activity.config, (response as EmrLabResponse | undefined) ?? emrInitial(activity.config))
    case 'ingest':
      return evaluateIngestLab(activity.config, (response as IngestLabResponse | undefined) ?? { placements: {} })
    case 'ai-chooser':
      return evaluateAiChooserLab(activity.config, (response as AiChooserLabResponse | undefined) ?? { placements: {} })
    case 'ana-chooser':
      return evaluateAnaChooserLab(activity.config, (response as AnaChooserLabResponse | undefined) ?? { placements: {} })
    case 'kms':
      return evaluateKmsLab(activity.config, (response as KmsLabResponse | undefined) ?? kmsInitial())
    case 'secrets':
      return evaluateSecretsLab(activity.config, (response as SecretsLabResponse | undefined) ?? gridInitial())
    case 'certs':
      return evaluateCertsLab(activity.config, (response as CertsLabResponse | undefined) ?? gridInitial())
    case 'findings':
      return evaluateFindingsLab(activity.config, (response as FindingsLabResponse | undefined) ?? gridInitial())
    case 'sec-chooser':
      return evaluateSecChooserLab(activity.config, (response as SecChooserLabResponse | undefined) ?? { placements: {} })
    case 'queue':
      return evaluateQueueLab(activity.config, (response as QueueLabResponse | undefined) ?? gridInitial())
    case 'workflow':
      return evaluateWorkflowLab(activity.config, (response as WorkflowLabResponse | undefined) ?? gridInitial())
    case 'apigw':
      return evaluateApiLab(activity.config, (response as ApiLabResponse | undefined) ?? gridInitial())
    case 'stream':
      return evaluateStreamLab(activity.config, (response as StreamLabResponse | undefined) ?? gridInitial())
    case 'pubsub':
    case 'eventbus':
      return evaluateFilterLab(activity.config, (response as FilterLabResponse | undefined) ?? gridInitial())
    case 'int-chooser':
      return evaluateIntChooserLab(activity.config, (response as IntChooserLabResponse | undefined) ?? { placements: {} })
    case 'filesystem':
      return evaluateFilesystemLab(activity.config, (response as FilesystemLabResponse | undefined) ?? gridInitial())
    case 'fs-chooser':
      return evaluateFsChooserLab(activity.config, (response as FsChooserLabResponse | undefined) ?? { placements: {} })
    case 'backup':
      return evaluateBackupLab(activity.config, (response as BackupLabResponse | undefined) ?? gridInitial())
    case 'wa-review':
      return evaluateWaReviewLab(activity.config, (response as WaReviewLabResponse | undefined) ?? gridInitial())
    case 'dr':
      return evaluateDrLab(activity.config, (response as DrLabResponse | undefined) ?? gridInitial())
    case 'perf-chooser':
      return evaluatePerfChooserLab(activity.config, (response as PerfChooserLabResponse | undefined) ?? { placements: {} })
    case 'transfer-cost':
      return evaluateTransferCostLab(activity.config, (response as TransferCostLabResponse | undefined) ?? gridInitial())
    case 'rightsizing':
      return evaluateRightsizingLab(activity.config, (response as RightsizingLabResponse | undefined) ?? gridInitial())
    case 'migration-plan':
      return evaluateMigrationPlanLab(activity.config, (response as MigrationPlanLabResponse | undefined) ?? gridInitial())
    case 'exam-reader':
      return evaluateExamReaderLab(activity.config, (response as ExamReaderLabResponse | undefined) ?? gridInitial())
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
    case 'alarm':
      return alarmLabSolution(activity.config)
    case 'logs':
      return logsLabSolution(activity.config)
    case 'trail':
      return trailLabSolution(activity.config)
    case 'compliance':
      return complianceLabSolution(activity.config)
    case 'stack':
      return stackLabSolution(activity.config)
    case 'budget':
      return budgetLabSolution(activity.config)
    case 'ops-chooser':
      return opsChooserSolution(activity.config)
    case 'vpc-planner':
      return vpcPlannerSolution(activity.config)
    case 'route-table':
      return routeTableSolution(activity.config)
    case 'reach':
      return reachSolution(activity.config)
    case 'connect':
      return connectSolution(activity.config)
    case 'endpoints':
      return endpointsSolution(activity.config)
    case 'hybrid':
      return hybridSolution(activity.config)
    case 'dns-policy':
      return dnsPolicySolution(activity.config)
    case 'net-chooser':
      return netChooserSolution(activity.config)
    case 'datalake':
      return lakeSolution(activity.config)
    case 'lakeperm':
      return lakePermSolution(activity.config)
    case 'emr':
      return emrSolution(activity.config)
    case 'ingest':
      return ingestSolution(activity.config)
    case 'ai-chooser':
      return aiChooserSolution(activity.config)
    case 'ana-chooser':
      return anaChooserSolution(activity.config)
    case 'kms':
      return kmsSolution(activity.config)
    case 'secrets':
      return secretsSolution(activity.config)
    case 'certs':
      return certsSolution(activity.config)
    case 'findings':
      return findingsSolution(activity.config)
    case 'sec-chooser':
      return secChooserSolution(activity.config)
    case 'queue':
      return queueSolution(activity.config)
    case 'workflow':
      return workflowSolution(activity.config)
    case 'apigw':
      return apiSolution(activity.config)
    case 'stream':
      return streamSolution(activity.config)
    case 'pubsub':
    case 'eventbus':
      return filterSolution(activity.config)
    case 'int-chooser':
      return intChooserSolution(activity.config)
    case 'filesystem':
      return filesystemSolution(activity.config)
    case 'fs-chooser':
      return fsChooserSolution(activity.config)
    case 'backup':
      return backupSolution(activity.config)
    case 'wa-review':
      return waReviewSolution(activity.config)
    case 'dr':
      return drSolution(activity.config)
    case 'perf-chooser':
      return perfChooserSolution(activity.config)
    case 'transfer-cost':
      return transferCostSolution(activity.config)
    case 'rightsizing':
      return rightsizingSolution(activity.config)
    case 'migration-plan':
      return migrationPlanSolution(activity.config)
    case 'exam-reader':
      return examReaderSolution(activity.config)
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
    case 'alarm':
      return alarmLabInitial(activity.config)
    case 'logs':
      return logsLabInitial(activity.config)
    case 'trail':
      return trailLabInitial(activity.config)
    case 'compliance':
      return complianceLabInitial(activity.config)
    case 'stack':
      return stackLabInitial()
    case 'budget':
      return budgetLabInitial()
    case 'ops-chooser':
    case 'hybrid':
    case 'dns-policy':
    case 'net-chooser':
      return { placements: {} }
    case 'vpc-planner':
      return vpcPlannerInitial()
    case 'route-table':
      return routeTableInitial(activity.config)
    case 'reach':
      return reachInitial(activity.config)
    case 'connect':
    case 'endpoints':
      return { choices: {} }
    case 'datalake':
      return lakeInitial(activity.config)
    case 'lakeperm':
      return lakePermInitial(activity.config)
    case 'emr':
      return emrInitial(activity.config)
    case 'ingest':
    case 'ai-chooser':
    case 'ana-chooser':
    case 'sec-chooser':
    case 'int-chooser':
    case 'fs-chooser':
    case 'perf-chooser':
      return { placements: {} }
    case 'kms':
      return kmsInitial()
    case 'secrets':
    case 'certs':
    case 'findings':
    case 'queue':
    case 'workflow':
    case 'apigw':
    case 'stream':
    case 'pubsub':
    case 'eventbus':
    case 'filesystem':
    case 'backup':
    case 'wa-review':
    case 'dr':
    case 'transfer-cost':
    case 'rightsizing':
    case 'migration-plan':
    case 'exam-reader':
      return gridInitial()
  }
}
