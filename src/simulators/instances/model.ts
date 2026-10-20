/**
 * Instâncias EC2: leitura do nome do tipo, o que sobrevive a cada ação do
 * ciclo de vida, custo das burstable em modo unlimited e escolha do tipo que
 * atende a uma carga pelo menor preço.
 *
 * Conferido em 20/10/2026:
 * - Nomes (série, geração, opções e tamanho): https://docs.aws.amazon.com/ec2/latest/instancetypes/instance-type-names.html
 * - Estados, cobrança e diferenças entre reboot, stop, hibernate e terminate:
 *   https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html
 * - Créditos, baseline por tipo e modo unlimited (excedente cobrado por
 *   vCPU-hora quando a média de 24 h passa da baseline; ponto de equilíbrio
 *   t3.large × m5.large de 42,5% com os preços da página):
 *   https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
 *   e https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-unlimited-mode-concepts.html
 * - Graviton só roda Linux: https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html
 *
 * Simplificações: a carga cabe se vCPU e memória bastam (sem rede, disco ou
 * benchmark); a CPU média é a da carga sobre os vCPUs do tipo; preços
 * On-Demand de Linux, 730 horas por mês.
 */
import { computePrices, HOURS_PER_MONTH, instancePrice, type Arch } from '../compute-prices'

// ---------------------------------------------------------------------------
// Leitura do nome

export type Category = 'general' | 'compute' | 'memory' | 'storage' | 'accelerated' | 'hpc'

export const CATEGORY_LABEL: Record<Category, string> = {
  general: 'Uso geral',
  compute: 'Otimizada para computação',
  memory: 'Otimizada para memória',
  storage: 'Otimizada para armazenamento',
  accelerated: 'Computação acelerada',
  hpc: 'Computação de alto desempenho',
}

/** Séries da documentação, das mais longas para as mais curtas (para casar "inf" antes de "i"). */
export const SERIES: { prefix: string; label: string; category: Category }[] = [
  { prefix: 'hpc', label: 'Computação de alto desempenho', category: 'hpc' },
  { prefix: 'inf', label: 'AWS Inferentia (inferência de ML)', category: 'accelerated' },
  { prefix: 'trn', label: 'AWS Trainium (treino de ML)', category: 'accelerated' },
  { prefix: 'mac', label: 'macOS', category: 'general' },
  { prefix: 'im', label: 'Armazenamento (1 vCPU para 4 GiB)', category: 'storage' },
  { prefix: 'is', label: 'Armazenamento (1 vCPU para 6 GiB)', category: 'storage' },
  { prefix: 'vt', label: 'Transcodificação de vídeo', category: 'accelerated' },
  { prefix: 'a', label: 'Processadores AWS Graviton (geração antiga)', category: 'general' },
  { prefix: 'c', label: 'Otimizada para computação', category: 'compute' },
  { prefix: 'd', label: 'Armazenamento denso', category: 'storage' },
  { prefix: 'f', label: 'FPGA', category: 'accelerated' },
  { prefix: 'g', label: 'Gráficos (GPU)', category: 'accelerated' },
  { prefix: 'i', label: 'Otimizada para armazenamento', category: 'storage' },
  { prefix: 'm', label: 'Uso geral', category: 'general' },
  { prefix: 'p', label: 'GPU para computação acelerada', category: 'accelerated' },
  { prefix: 'r', label: 'Otimizada para memória', category: 'memory' },
  { prefix: 't', label: 'Desempenho com picos (burstable)', category: 'general' },
  { prefix: 'u', label: 'Memória muito alta', category: 'memory' },
  { prefix: 'x', label: 'Memória intensiva', category: 'memory' },
  { prefix: 'z', label: 'Memória alta com frequência alta', category: 'memory' },
]

export const OPTION_LABEL: Record<string, string> = {
  a: 'processador AMD',
  g: 'processador AWS Graviton (Arm)',
  i: 'processador Intel',
  b: 'otimizada para armazenamento em blocos (EBS)',
  d: 'com instance store',
  e: 'extra (armazenamento, memória ou memória de GPU)',
  n: 'rede e EBS otimizados',
  z: 'frequência de CPU alta',
  flex: 'instância flex',
}

export interface ParsedType {
  type: string
  series: string
  seriesLabel: string
  category: Category
  generation: number
  options: string[]
  size: string
}

export function parseInstanceType(type: string): ParsedType {
  const [family, size = ''] = type.toLowerCase().split('.')
  const [base, flex] = family.split('-')
  const s = SERIES.find((x) => base.startsWith(x.prefix) && /^\d/.test(base.slice(x.prefix.length)))
  if (!s) throw new Error(`Série desconhecida: ${type}`)
  const rest = base.slice(s.prefix.length)
  const generation = Number(rest.match(/^\d+/)![0])
  const options = rest.replace(/^\d+/, '').split('').filter(Boolean)
  if (flex === 'flex') options.push('flex')
  return { type, series: s.prefix, seriesLabel: s.label, category: s.category, generation, options, size }
}

/** Frase com a leitura completa do nome, para explicações. */
export function describeType(type: string): string {
  const p = parseInstanceType(type)
  const opts = p.options.map((o) => OPTION_LABEL[o] ?? o)
  return `${type}: série ${p.series.toUpperCase()} (${p.seriesLabel.toLowerCase()}), geração ${p.generation}${opts.length ? `, ${opts.join(', ')}` : ''}, tamanho ${p.size}`
}

// ---------------------------------------------------------------------------
// Ciclo de vida

export type InstanceAction = 'reboot' | 'stop' | 'hibernate' | 'terminate'
export type Aspect = 'host' | 'private-ip' | 'public-ip' | 'elastic-ip' | 'instance-store' | 'root-volume' | 'data-volume' | 'ram'

export const ACTION_LABEL: Record<InstanceAction, string> = { reboot: 'Reboot', stop: 'Stop', hibernate: 'Hibernate', terminate: 'Terminate' }

export const ASPECT_LABEL: Record<Aspect, string> = {
  host: 'Mesmo servidor físico',
  'private-ip': 'IPv4 privado',
  'public-ip': 'IPv4 público (automático)',
  'elastic-ip': 'Elastic IP',
  'instance-store': 'Dados do instance store',
  'root-volume': 'Volume raiz (EBS)',
  'data-volume': 'Volume EBS de dados',
  ram: 'Conteúdo da memória (RAM)',
}

export interface Effect {
  kept: boolean
  note: string
}

/** O que sobrevive a cada ação, conforme a tabela "Differences between instance states". */
export function stateEffects(action: InstanceAction): Record<Aspect, Effect> {
  const moved = 'A instância vai para outro servidor físico (às vezes fica no mesmo).'
  switch (action) {
    case 'reboot':
      return {
        host: { kept: true, note: 'A instância continua no mesmo servidor físico.' },
        'private-ip': { kept: true, note: 'O IPv4 privado continua o mesmo.' },
        'public-ip': { kept: true, note: 'No reboot, o IPv4 público continua o mesmo.' },
        'elastic-ip': { kept: true, note: 'O Elastic IP continua associado.' },
        'instance-store': { kept: true, note: 'No reboot, os dados do instance store são preservados.' },
        'root-volume': { kept: true, note: 'O volume raiz é preservado.' },
        'data-volume': { kept: true, note: 'Os volumes de dados continuam anexados.' },
        ram: { kept: false, note: 'O reboot reinicia o sistema operacional: a RAM é apagada.' },
      }
    case 'stop':
    case 'hibernate': {
      const hib = action === 'hibernate'
      return {
        host: { kept: false, note: moved },
        'private-ip': { kept: true, note: 'O IPv4 privado continua o mesmo.' },
        'public-ip': { kept: false, note: 'Ao iniciar de novo, a instância recebe outro IPv4 público.' },
        'elastic-ip': { kept: true, note: 'O Elastic IP continua associado.' },
        'instance-store': { kept: false, note: `No ${hib ? 'hibernate' : 'stop'}, os dados do instance store são apagados: os discos ficam no servidor antigo.` },
        'root-volume': { kept: true, note: 'O volume raiz (EBS) é preservado.' },
        'data-volume': { kept: true, note: 'Os volumes EBS de dados continuam anexados.' },
        ram: hib ? { kept: true, note: 'A hibernação grava a RAM no volume raiz e a recarrega ao iniciar.' } : { kept: false, note: 'No stop, a RAM é apagada. Só a hibernação a preserva.' },
      }
    }
    case 'terminate':
      return {
        host: { kept: false, note: 'A instância deixa de existir.' },
        'private-ip': { kept: false, note: 'A instância encerrada não tem mais endereço.' },
        'public-ip': { kept: false, note: 'O IPv4 público volta para o conjunto da Amazon.' },
        'elastic-ip': { kept: false, note: 'O Elastic IP é desassociado. Ele continua alocado na conta (e cobrado) até você liberá-lo.' },
        'instance-store': { kept: false, note: 'Os dados do instance store são apagados.' },
        'root-volume': { kept: false, note: 'Por padrão (DeleteOnTermination), o volume raiz é apagado no terminate.' },
        'data-volume': { kept: true, note: 'Por padrão, os outros volumes EBS são preservados no terminate.' },
        ram: { kept: false, note: 'A RAM é apagada.' },
      }
  }
}

/** Estados e cobrança de uso da instância (EBS e Elastic IP são cobrados em qualquer estado). */
export const STATE_BILLING: { state: string; billed: boolean; note: string }[] = [
  { state: 'pending', billed: false, note: 'Preparando para rodar: ainda não cobra.' },
  { state: 'running', billed: true, note: 'Cobrado por segundo, com mínimo de 1 minuto a cada início.' },
  { state: 'stopping (stop)', billed: false, note: 'A cobrança para quando o stop começa.' },
  { state: 'stopping (hibernate)', billed: true, note: 'Na hibernação, o stopping é cobrado: a RAM está sendo gravada.' },
  { state: 'stopped', billed: false, note: 'Não cobra a instância, mas cobra os volumes EBS.' },
  { state: 'terminated', billed: false, note: 'Não cobra mais a instância.' },
]

// ---------------------------------------------------------------------------
// Burstable

/** Baseline por vCPU (tabela de créditos da documentação). */
export const BURST_BASELINE: Record<string, number> = {
  't3.micro': 0.1,
  't3.medium': 0.2,
  't3.large': 0.3,
  't4g.medium': 0.2,
  't4g.large': 0.3,
}

export const isBurstable = (type: string) => type in BURST_BASELINE

/**
 * Ponto de equilíbrio da documentação: a CPU média (por vCPU) em que a
 * burstable em unlimited custa o mesmo que a fixa. Acima dele, a fixa sai
 * mais barata.
 */
export function breakevenFromPrices(baseline: number, vcpu: number, burstHour: number, fixedHour: number, creditPerVcpuHour: number): number {
  return baseline + (fixedHour - burstHour) / (creditPerVcpuHour * vcpu)
}

const creditRate = (type: string, region?: string) => computePrices(region).cpuCreditsPerVcpuHour[type.split('.')[0]]

/** Custo por hora de uma burstable em unlimited com uma CPU média sustentada (0 a 1, por vCPU). */
export function burstableHourly(type: string, avgCpu: number, region?: string): { base: number; surplus: number; total: number } {
  const p = instancePrice(type, region)
  const surplus = Math.max(0, avgCpu - BURST_BASELINE[type]) * p.vcpu * creditRate(type, region)
  return { base: p.onDemandHour, surplus, total: p.onDemandHour + surplus }
}

export function breakeven(burstType: string, fixedType: string, region?: string): number {
  const b = instancePrice(burstType, region)
  const f = instancePrice(fixedType, region)
  return breakevenFromPrices(BURST_BASELINE[burstType], b.vcpu, b.onDemandHour, f.onDemandHour, creditRate(burstType, region))
}

/** Custo por hora de qualquer tipo para uma carga com CPU média sustentada (inclui o excedente das burstable). */
export function effectiveHourly(type: string, avgCpu = 0, region?: string): number {
  return isBurstable(type) ? burstableHourly(type, avgCpu, region).total : instancePrice(type, region).onDemandHour
}

// ---------------------------------------------------------------------------
// Escolha do tipo para uma carga

export interface WorkloadNeeds {
  vcpu: number
  memoryGiB: number
  /** O software só roda nessa arquitetura (ex.: binário x86, ou Windows). */
  arch?: Arch
  windows?: boolean
  /** Precisa de GPU NVIDIA (gráficos, treino, CUDA). */
  gpu?: boolean
  /** Inferência de ML: GPU ou AWS Inferentia servem. */
  mlInference?: boolean
  /** Precisa de disco NVMe local (instance store). */
  localNvme?: boolean
  /** CPU média sustentada da carga, por vCPU (0 a 1). Pesa no custo das burstable. */
  avgCpu?: number
}

export interface Workload {
  id: string
  name: string
  description: string
  needs: WorkloadNeeds
  concepts?: string[]
}

/** O que falta para o tipo atender à carga (lista vazia: atende). */
export function gaps(type: string, n: WorkloadNeeds, region?: string): string[] {
  const p = instancePrice(type, region)
  const parsed = parseInstanceType(type)
  const out: string[] = []
  if (p.vcpu < n.vcpu) out.push(`tem ${p.vcpu} vCPU e a carga precisa de ${n.vcpu}`)
  if (p.memoryGiB < n.memoryGiB) out.push(`tem ${p.memoryGiB} GiB de memória e a carga precisa de ${n.memoryGiB}`)
  if (n.windows && p.arch === 'arm64') out.push('processadores Graviton só rodam Linux, e a carga é Windows')
  else if (n.arch && p.arch !== n.arch) out.push(n.arch === 'x86_64' ? 'o software só roda em x86 (Intel ou AMD), e este tipo é Graviton (Arm)' : 'o software foi compilado para Arm (Graviton)')
  const isGpu = parsed.series === 'g' || parsed.series === 'p'
  if (n.gpu && !isGpu) out.push('a carga precisa de GPU NVIDIA')
  if (n.mlInference && !isGpu && parsed.series !== 'inf') out.push('a carga precisa de um acelerador de inferência (GPU ou Inferentia)')
  if (n.localNvme && p.storage === 'EBS only') out.push('não tem instance store: os discos são só EBS')
  return out
}

export const monthly = (hourly: number) => hourly * HOURS_PER_MONTH

/** Custo mensal do tipo para a carga, com o excedente de créditos quando for burstable. */
export function workloadMonthly(type: string, n: WorkloadNeeds, region?: string): number {
  // A CPU média é a da carga em vCPUs: num tipo com mais vCPUs, ela se dilui.
  const p = instancePrice(type, region)
  const perVcpu = n.avgCpu === undefined ? 0 : Math.min(1, (n.avgCpu * n.vcpu) / p.vcpu)
  return monthly(effectiveHourly(type, perVcpu, region))
}

export function cheapestFit(w: Workload, candidates: string[], region?: string): string | undefined {
  return candidates
    .filter((t) => gaps(t, w.needs, region).length === 0)
    .sort((a, b) => workloadMonthly(a, w.needs, region) - workloadMonthly(b, w.needs, region))[0]
}
