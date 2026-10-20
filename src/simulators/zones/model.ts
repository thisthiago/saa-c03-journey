/**
 * Resiliência entre Zonas de Disponibilidade: uma aplicação web (ALB →
 * instâncias → banco) e o que acontece quando uma AZ ou a Região falha.
 *
 * Conferido em 18/10/2026:
 * - AZs isoladas, com energia e rede próprias; static stability (6 instâncias
 *   necessárias em 3 AZs → implantar 9): https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html
 *   e https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/zonal-services.html
 * - ALB exige subnets em ao menos duas AZs; alvos em zona não habilitada não
 *   recebem tráfego: https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html
 * - NAT gateway zonal fica numa AZ; se ela cair, recursos de outras AZs que o
 *   usam perdem a saída para a internet. O regional se expande pelas AZs com
 *   workloads: https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
 *   e https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html
 * - RDS Multi-AZ: standby síncrono em outra AZ, failover automático; o standby
 *   não atende leituras: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html
 *
 * Simplificações: failover instantâneo; a AZ falha por inteiro (sem falhas
 * parciais); toda requisição precisa de uma chamada de saída à internet quando
 * `needsInternet`; capacidade proporcional ao número de instâncias.
 */

export type AZ = string
export type NatMode = 'none' | 'zonal-single' | 'zonal-per-az' | 'regional'
export type DbMode = 'single-az' | 'multi-az'
export type Failure = 'none' | 'region' | AZ

export const NAT_LABEL: Record<NatMode, string> = {
  none: 'Sem NAT gateway',
  'zonal-single': 'Um NAT gateway zonal (compartilhado)',
  'zonal-per-az': 'Um NAT gateway zonal por AZ',
  regional: 'NAT gateway regional',
}

export const DB_LABEL: Record<DbMode, string> = {
  'single-az': 'RDS Single-AZ',
  'multi-az': 'RDS Multi-AZ (primário + standby)',
}

export interface ZonesTopology {
  azs: AZ[]
  /** Instâncias necessárias para atender a carga normal. */
  required: number
  /** Instância → AZ onde foi implantada (ausente = não implantada). */
  instances: Record<string, AZ | undefined>
  albAzs: AZ[]
  nat: { mode: NatMode; az?: AZ }
  /** As requisições dependem de uma chamada de saída à internet (ex.: API de pagamentos). */
  needsInternet: boolean
  db: { mode: DbMode; primary: AZ; standby?: AZ }
}

export type AppStatus = 'available' | 'degraded' | 'down'

export interface ComponentState {
  id: string
  label: string
  az?: AZ
  state: 'ok' | 'down' | 'idle' | 'failover' | 'isolated'
  note?: string
}

export interface FailureResult {
  failure: Failure
  status: AppStatus
  serving: number
  required: number
  reasons: string[]
  components: ComponentState[]
}

export const STATUS_LABEL: Record<AppStatus, string> = { available: 'Disponível', degraded: 'Degradada', down: 'Fora do ar' }

export function failureLabel(f: Failure): string {
  return f === 'none' ? 'Operação normal' : f === 'region' ? 'Falha da Região inteira' : `Falha da AZ ${f}`
}

export function deployedCount(t: ZonesTopology): number {
  return Object.values(t.instances).filter(Boolean).length
}

export function validateZones(t: ZonesTopology): string[] {
  const errors: string[] = []
  const albZones = new Set(t.albAzs)
  if (albZones.size < 2) errors.push('O Application Load Balancer exige subnets em pelo menos duas AZs diferentes.')
  if (t.nat.mode === 'zonal-single' && !t.nat.az) errors.push('Escolha a AZ do NAT gateway zonal.')
  if (t.db.mode === 'multi-az' && (!t.db.standby || t.db.standby === t.db.primary)) errors.push('No Multi-AZ, o standby precisa ficar numa AZ diferente da do primário.')
  return errors
}

export function simulateFailure(t: ZonesTopology, failure: Failure): FailureResult {
  const healthy = (az?: AZ) => failure !== 'region' && az !== undefined && az !== failure
  const reasons: string[] = []
  const components: ComponentState[] = []

  if (failure === 'region') {
    reasons.push('A Região inteira ficou indisponível. Distribuir entre AZs não protege contra isso: seria preciso uma estratégia de recuperação de desastres em outra Região.')
  }

  // Load balancer: um nó por AZ habilitada.
  const albAlive = t.albAzs.some((az) => healthy(az))
  for (const az of t.albAzs) components.push({ id: `alb-${az}`, label: 'Nó do ALB', az, state: healthy(az) ? 'ok' : 'down' })
  if (!albAlive && failure !== 'region') reasons.push('Nenhum nó do ALB sobrou: todas as AZs habilitadas no balanceador falharam.')

  // NAT gateway.
  const egress = (az: AZ): boolean => {
    if (!t.needsInternet) return true
    switch (t.nat.mode) {
      case 'none':
        return false
      case 'regional':
        return failure !== 'region'
      case 'zonal-per-az':
        return healthy(az)
      case 'zonal-single':
        return healthy(t.nat.az)
    }
  }
  if (t.needsInternet) {
    if (t.nat.mode === 'zonal-single') components.push({ id: 'nat', label: 'NAT gateway', az: t.nat.az, state: healthy(t.nat.az) ? 'ok' : 'down' })
    if (t.nat.mode === 'zonal-per-az') for (const az of t.azs) components.push({ id: `nat-${az}`, label: 'NAT gateway', az, state: healthy(az) ? 'ok' : 'down' })
    if (t.nat.mode === 'regional') components.push({ id: 'nat', label: 'NAT gateway regional', state: failure === 'region' ? 'down' : 'ok' })
  }

  // Instâncias.
  let serving = 0
  let notInAlb = 0
  let noEgress = 0
  for (const [id, az] of Object.entries(t.instances)) {
    if (!az) continue
    if (!healthy(az)) {
      components.push({ id, label: id, az, state: 'down' })
      continue
    }
    if (!t.albAzs.includes(az)) {
      notInAlb++
      components.push({ id, label: id, az, state: 'idle', note: 'AZ não habilitada no ALB: não recebe tráfego' })
      continue
    }
    if (!egress(az)) {
      noEgress++
      components.push({ id, label: id, az, state: 'isolated', note: 'sem saída para a internet' })
      continue
    }
    serving++
    components.push({ id, label: id, az, state: 'ok' })
  }
  if (notInAlb > 0) reasons.push(`${notInAlb} instância(s) numa AZ não habilitada no ALB: estão rodando, mas não recebem tráfego.`)
  if (noEgress > 0) {
    reasons.push(
      t.nat.mode === 'none'
        ? `${noEgress} instância(s) sem NAT gateway: não conseguem chamar a API externa.`
        : t.nat.mode === 'zonal-single'
          ? `${noEgress} instância(s) perderam a saída para a internet: o único NAT gateway estava na AZ ${t.nat.az}, que falhou.`
          : `${noEgress} instância(s) sem saída para a internet.`,
    )
  }

  // Banco de dados.
  let dbUp = true
  if (t.db.mode === 'single-az') {
    dbUp = healthy(t.db.primary)
    components.push({ id: 'db', label: 'RDS (Single-AZ)', az: t.db.primary, state: dbUp ? 'ok' : 'down' })
    if (!dbUp && failure !== 'region') reasons.push(`O banco Single-AZ estava na AZ ${t.db.primary}: sem ele, a aplicação não funciona (ponto único de falha).`)
  } else {
    const p = healthy(t.db.primary)
    const sb = healthy(t.db.standby)
    dbUp = p || sb
    components.push({ id: 'db-primary', label: 'RDS primário', az: t.db.primary, state: p ? 'ok' : 'down' })
    components.push({ id: 'db-standby', label: 'RDS standby', az: t.db.standby, state: !sb ? 'down' : p ? 'idle' : 'failover', note: !p && sb ? 'promovido a primário (failover automático)' : undefined })
    if (!p && sb) reasons.push(`O primário do RDS caiu com a AZ ${t.db.primary}; o standby na AZ ${t.db.standby} assumiu automaticamente.`)
  }

  let status: AppStatus
  if (!albAlive || serving === 0 || !dbUp) status = 'down'
  else if (serving < t.required) status = 'degraded'
  else status = 'available'
  if (status === 'degraded') reasons.push(`Sobraram ${serving} de ${t.required} instâncias necessárias: a aplicação responde, mas sobrecarregada.`)
  if (status === 'down' && serving === 0 && albAlive && dbUp) reasons.push('Nenhuma instância consegue atender.')
  return { failure, status, serving, required: t.required, reasons, components }
}

/** Todas as falhas relevantes: operação normal, cada AZ e a Região. */
export function failureMatrix(t: ZonesTopology): FailureResult[] {
  return (['none', ...t.azs, 'region'] as Failure[]).map((f) => simulateFailure(t, f))
}

/** Componentes cuja AZ, sozinha, derruba a aplicação. */
export function findSpofs(t: ZonesTopology): AZ[] {
  return t.azs.filter((az) => simulateFailure(t, az).status === 'down')
}
