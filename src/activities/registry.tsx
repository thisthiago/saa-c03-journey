/**
 * Componente que despacha cada tipo de atividade para sua interface.
 * Adicionar um novo `kind` = um caso aqui e outro em ui-logic.ts.
 */
import type { Evaluation } from '../engine/types'
import { BucketLab } from '../simulators/bucket/BucketLab'
import type { BucketLabResponse } from '../simulators/bucket/lab'
import { AccessLab } from '../simulators/access/AccessLab'
import type { AccessLabResponse } from '../simulators/access/lab'
import { CostLab } from '../simulators/cost/CostLab'
import { VersioningLab } from '../simulators/versioning/VersioningLab'
import { LifecycleLab } from '../simulators/lifecycle/LifecycleLab'
import { ReplicationLab } from '../simulators/replication/ReplicationLab'
import { EventsLab } from '../simulators/events/EventsLab'
import { RequesterPaysLab } from '../simulators/requester-pays/RequesterPaysLab'
import { GatewayLab } from '../simulators/gateway/GatewayLab'
import { TransferLab } from '../simulators/transfer/TransferLab'
import { ArchitectureLab } from '../simulators/architecture/ArchitectureLab'
import type { ArchitectureLabResponse } from '../simulators/architecture/lab'
import { RegionLab } from '../simulators/regions/RegionLab'
import type { RegionLabResponse } from '../simulators/regions/lab'
import { ZonesLab } from '../simulators/zones/ZonesLab'
import type { ZonesLabResponse } from '../simulators/zones/lab'
import { EdgeLab } from '../simulators/edge/EdgeLab'
import type { EdgeLabResponse } from '../simulators/edge/lab'
import { PlacementLab } from '../simulators/placement/PlacementLab'
import type { PlacementLabResponse } from '../simulators/placement/lab'
import { SupportLab } from '../simulators/support/SupportLab'
import type { SupportLabResponse } from '../simulators/support/lab'
import { ResponsibilityLab } from '../simulators/responsibility/ResponsibilityLab'
import type { ResponsibilityLabResponse } from '../simulators/responsibility/lab'
import { CredentialsLab } from '../simulators/credentials/CredentialsLab'
import type { CredentialsLabResponse } from '../simulators/credentials/lab'
import { PolicyBuilder } from '../simulators/policy/PolicyBuilder'
import type { BuilderLabResponse } from '../simulators/policy/builder'
import { PolicyLayersLab } from '../simulators/policy/PolicyLayersLab'
import type { LayersLabResponse } from '../simulators/policy/layers'
import { TrustLab } from '../simulators/sts/TrustLab'
import type { TrustLabResponse } from '../simulators/sts/lab'
import { IdentityLab } from '../simulators/identity/IdentityLab'
import type { IdentityLabResponse } from '../simulators/identity/lab'
import { OrgLab } from '../simulators/org/OrgLab'
import type { OrgLabResponse } from '../simulators/org/lab'
import type { TransferLabResponse } from '../simulators/transfer/lab'
import type { GatewayLabResponse } from '../simulators/gateway/lab'
import type { RPLabResponse } from '../simulators/requester-pays/lab'
import type { EventsLabResponse } from '../simulators/events/lab'
import type { ReplicationLabResponse } from '../simulators/replication/lab'
import type { LifecycleLabResponse } from '../simulators/lifecycle/lab'
import type { VersioningLabResponse } from '../simulators/versioning/lab'
import type { CostLabResponse } from '../simulators/cost/lab'
import type {
  ActivityResponse,
  DecisionResponse,
  EstimateResponse,
  InvestigateResponse,
  OrderResponse,
  PlacementResponse,
  PredictResponse,
} from './evaluate'
import type { ActivityDef } from './types'
import { ClassifyView, DecisionView, EstimateView, InvestigateView, MatchView, OrderView, PredictView } from './views'

interface ViewArgs {
  activity: ActivityDef
  value: ActivityResponse
  onChange: (v: ActivityResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
  seed: string
}

export function ActivityView({ activity, value, onChange, disabled, evaluation, seed }: ViewArgs) {
  const common = { disabled, evaluation, seed }
  const set = onChange as (v: unknown) => void
  switch (activity.kind) {
    case 'decision':
      return <DecisionView activity={activity} value={value as DecisionResponse} onChange={set} {...common} />
    case 'classify':
      return <ClassifyView activity={activity} value={value as PlacementResponse} onChange={set} {...common} />
    case 'match':
      return <MatchView activity={activity} value={value as PlacementResponse} onChange={set} {...common} />
    case 'order':
      return <OrderView activity={activity} value={value as OrderResponse} onChange={set} {...common} />
    case 'predict':
      return <PredictView activity={activity} value={value as PredictResponse} onChange={set} {...common} />
    case 'estimate':
      return <EstimateView activity={activity} value={value as EstimateResponse} onChange={set} {...common} />
    case 'investigate':
      return <InvestigateView activity={activity} value={value as InvestigateResponse} onChange={set} {...common} />
    case 'lab':
      switch (activity.lab) {
        case 'bucket':
          return <BucketLab config={activity.config} value={value as unknown as BucketLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'cost':
          return <CostLab config={activity.config} value={value as unknown as CostLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'access':
          return <AccessLab config={activity.config} value={value as unknown as AccessLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'versioning':
          return <VersioningLab config={activity.config} value={value as unknown as VersioningLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'lifecycle':
          return <LifecycleLab config={activity.config} value={value as unknown as LifecycleLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'replication':
          return <ReplicationLab config={activity.config} value={value as unknown as ReplicationLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'events':
          return <EventsLab config={activity.config} value={value as unknown as EventsLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'requester-pays':
          return <RequesterPaysLab config={activity.config} value={value as unknown as RPLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'gateway':
          return <GatewayLab config={activity.config} value={value as unknown as GatewayLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'transfer':
          return <TransferLab config={activity.config} value={value as unknown as TransferLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'architecture':
          return <ArchitectureLab config={activity.config} value={value as unknown as ArchitectureLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'region':
          return <RegionLab config={activity.config} value={value as unknown as RegionLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'zones':
          return <ZonesLab config={activity.config} value={value as unknown as ZonesLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'edge':
          return <EdgeLab config={activity.config} value={value as unknown as EdgeLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'placement':
          return <PlacementLab config={activity.config} value={value as unknown as PlacementLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'support':
          return <SupportLab config={activity.config} value={value as unknown as SupportLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'responsibility':
          return <ResponsibilityLab config={activity.config} value={value as unknown as ResponsibilityLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'credentials':
          return <CredentialsLab config={activity.config} value={value as unknown as CredentialsLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'policy-builder':
          return <PolicyBuilder config={activity.config} value={value as unknown as BuilderLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'policy-layers':
          return <PolicyLayersLab config={activity.config} value={value as unknown as LayersLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'trust':
          return <TrustLab config={activity.config} value={value as unknown as TrustLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'identity':
          return <IdentityLab config={activity.config} value={value as unknown as IdentityLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
        case 'org':
          return <OrgLab config={activity.config} value={value as unknown as OrgLabResponse} onChange={set} disabled={disabled} evaluation={evaluation} />
      }
  }
}

