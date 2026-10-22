/**
 * Dimensionamento correto e opção de compra de uma frota: quantos tamanhos
 * reduzir pela utilização máxima medida e qual forma de pagar sai mais barata
 * sem quebrar os requisitos.
 *
 * Conferido em 22/10/2026:
 * - Instâncias com uso máximo de CPU e de memória abaixo de 40% num período de
 *   quatro semanas são candidatas a reduzir de tamanho
 *   (https://docs.aws.amazon.com/wellarchitected/latest/framework/cost_type_size_number_resources_metrics.html).
 * - Ambientes usados só em horário comercial podem ser desligados fora dele:
 *   40 horas por semana, contra 168, economizam cerca de 75%
 *   (https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/design-principles.html).
 * - Analisar cada componente: o que roda por muito tempo vai para desconto por
 *   compromisso; o que é curto e dinâmico, para Spot ou On-Demand
 *   (https://docs.aws.amazon.com/wellarchitected/latest/framework/cost_pricing_model_analysis.html).
 * - Preços: tabela de Computação (npm run prices:compute) e o desconto do Spot
 *   do modelo de compras, que é premissa do cenário.
 *
 * Premissas: depois da redução, a utilização máxima dobra a cada tamanho
 * abaixo e precisa ficar abaixo de 80%; nas famílias m, c e r, cada tamanho
 * abaixo tem metade das vCPUs e da memória.
 */
import { HOURS_PER_MONTH, instancePrice, INSTANCE_TYPES } from '../compute-prices'
import { hourlyRate } from '../purchase/model'

export type Buy = 'on-demand' | 'scheduled' | 'compute-sp-1yr' | 'spot'

export const BUY_LABEL: Record<Buy, string> = {
  'on-demand': 'On-Demand, ligada o tempo todo',
  scheduled: 'On-Demand, ligada só no horário de uso',
  'compute-sp-1yr': 'Compute Savings Plan de 1 ano',
  spot: 'Spot',
}

/** O pico de uso depois da redução precisa ficar abaixo deste valor (premissa). */
export const MAX_AFTER = 80
/** Abaixo deste uso máximo (CPU e memória) em quatro semanas, a instância é candidata a reduzir. */
export const CANDIDATE_BELOW = 40

const SIZES = ['large', 'xlarge', '2xlarge']

export interface Fleet {
  type: string
  count: number
  /** Uso máximo em quatro semanas, em %. */
  maxCpu: number
  maxMem: number
  /** Horas por semana em que a frota precisa estar ligada (168 = o tempo todo). */
  hoursPerWeek: number
  interruptible: boolean
  /** Meses até a carga acabar ou mudar por completo. */
  monthsLeft: number
}

/** Tipo um tamanho abaixo, na mesma família, com metade das vCPUs; `undefined` se não houver na tabela. */
export function smaller(type: string): string | undefined {
  const [family, size] = type.split('.')
  const i = SIZES.indexOf(size)
  if (i <= 0) return undefined
  const next = `${family}.${SIZES[i - 1]}`
  if (!INSTANCE_TYPES.includes(next)) return undefined
  return instancePrice(next).vcpu * 2 === instancePrice(type).vcpu ? next : undefined
}

/** Quantos tamanhos reduzir (0, 1 ou 2) e o tipo resultante. */
export function rightsize(f: Fleet): { steps: 0 | 1 | 2; type: string; peakAfter: number } {
  const peak = Math.max(f.maxCpu, f.maxMem)
  let type = f.type
  let steps: 0 | 1 | 2 = 0
  while (steps < 2) {
    const next = smaller(type)
    if (!next || peak * 2 ** (steps + 1) >= MAX_AFTER) break
    type = next
    steps = (steps + 1) as 1 | 2
  }
  return { steps, type, peakAfter: peak * 2 ** steps }
}

export const hoursUsed = (f: Fleet) => (f.hoursPerWeek / 168) * HOURS_PER_MONTH

/** Motivo pelo qual a opção não serve (ou `null`). */
export function buyProblem(f: Fleet, b: Buy): string | null {
  if (b === 'spot' && !f.interruptible) return 'a carga não aguenta interrupções, e o Spot pode ser interrompido com aviso de 2 minutos'
  if (b === 'compute-sp-1yr' && f.monthsLeft < 12) return `a carga acaba em ${f.monthsLeft} meses, e o compromisso é de 12`
  if (b === 'scheduled' && f.hoursPerWeek >= 168) return 'a carga precisa ficar ligada o tempo todo'
  return null
}

export function buyMonthly(f: Fleet, type: string, b: Buy): number {
  const rate = b === 'compute-sp-1yr' ? hourlyRate(type, 'compute-sp-1yr') : b === 'spot' ? hourlyRate(type, 'spot') : hourlyRate(type, 'on-demand')
  const hours = b === 'on-demand' || b === 'compute-sp-1yr' ? HOURS_PER_MONTH : hoursUsed(f)
  return Math.round(f.count * rate * hours * 100) / 100
}

/** Opção válida mais barata para o tipo já reduzido. Lança erro em empate. */
export function bestBuy(f: Fleet, type: string): Buy {
  const ok = (Object.keys(BUY_LABEL) as Buy[]).filter((b) => !buyProblem(f, b)).sort((a, b) => buyMonthly(f, type, a) - buyMonthly(f, type, b))
  if (ok.length > 1 && buyMonthly(f, type, ok[0]) === buyMonthly(f, type, ok[1])) throw new Error(`Empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}
