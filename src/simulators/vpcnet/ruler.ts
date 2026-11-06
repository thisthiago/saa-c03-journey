/**
 * Régua de endereços do laboratório "Plano de endereços": o bloco da VPC vira
 * uma faixa, e cada sub-rede digitada ocupa o trecho correspondente. Sub-redes
 * que se sobrepõem vão para linhas diferentes e ficam marcadas; as que ficam
 * fora do bloco da VPC aparecem numa lista à parte.
 */
import { blockProblems, blockSize, cidrText, contains, intToIp, isCidr, lastIp, overlaps, parseCidr, usableIps, type Cidr } from './model'
import type { VpcPlannerLabConfig, VpcPlannerLabResponse } from './planner'

export type SegmentProblem = 'ok' | 'overlap' | 'small'

export interface RulerSegment {
  id: string
  name: string
  cidr: string
  /** Posição e largura em % da faixa da VPC. */
  left: number
  width: number
  /** Linha da régua (sub-redes sobrepostas ficam em linhas diferentes). */
  lane: number
  problem: SegmentProblem
  usable: number
  need: number
}

export interface RulerModel {
  vpc: string
  size: number
  ticks: { left: number; label: string }[]
  segments: RulerSegment[]
  /** Trechos com mais de uma sub-rede, em % da faixa. */
  clashes: { left: number; width: number }[]
  outside: { name: string; cidr: string }[]
  used: number
  lanes: number
}

/** Monta a régua. Devolve `null` enquanto o bloco da VPC não é um bloco aceito. */
export function rulerModel(config: VpcPlannerLabConfig, value: VpcPlannerLabResponse): RulerModel | null {
  if (!value.vpc || blockProblems(value.vpc, 'vpc').length) return null
  const vpc = parseCidr(value.vpc) as Cidr
  const size = blockSize(vpc.prefix)
  const pct = (n: number) => (n / size) * 100

  // Marcas: o bloco dividido em 4 partes iguais (ou menos, se ele for muito pequeno).
  const parts = Math.min(4, 2 ** (28 - vpc.prefix))
  const ticks = Array.from({ length: parts }, (_, i) => ({ left: (i / parts) * 100, label: intToIp(vpc.base + (i * size) / parts) }))

  const inside: { id: string; name: string; c: Cidr; need: number }[] = []
  const outside: { name: string; cidr: string }[] = []
  for (const s of config.subnets) {
    const text = (value.subnets?.[s.id] ?? '').trim()
    const c = parseCidr(text)
    if (!isCidr(c)) continue
    if (contains(vpc, c)) inside.push({ id: s.id, name: s.name, c, need: s.hosts })
    else outside.push({ name: s.name, cidr: cidrText(c) })
  }

  // Linhas: cada sub-rede vai para a primeira linha em que não encosta em outra.
  const lanesEnd: number[] = []
  const sorted = [...inside].sort((a, b) => a.c.base - b.c.base || a.c.prefix - b.c.prefix)
  const segments: RulerSegment[] = sorted.map((s) => {
    let lane = lanesEnd.findIndex((end) => end < s.c.base)
    if (lane < 0) lane = lanesEnd.length
    lanesEnd[lane] = lastIp(s.c)
    const clash = inside.some((o) => o.id !== s.id && overlaps(o.c, s.c))
    const usable = usableIps(s.c.prefix)
    return {
      id: s.id,
      name: s.name,
      cidr: cidrText(s.c),
      left: pct(s.c.base - vpc.base),
      width: pct(blockSize(s.c.prefix)),
      lane,
      problem: clash ? 'overlap' : usable < s.need ? 'small' : 'ok',
      usable,
      need: s.need,
    }
  })

  const clashes: { left: number; width: number }[] = []
  for (let i = 0; i < inside.length; i++) {
    for (let j = i + 1; j < inside.length; j++) {
      const a = inside[i].c
      const b = inside[j].c
      if (!overlaps(a, b)) continue
      const start = Math.max(a.base, b.base)
      const end = Math.min(lastIp(a), lastIp(b))
      clashes.push({ left: pct(start - vpc.base), width: pct(end - start + 1) })
    }
  }

  // Endereços cobertos por alguma sub-rede (sem contar duas vezes o que se sobrepõe).
  const covered = [...inside].map((s) => [s.c.base, lastIp(s.c)] as const).sort((a, b) => a[0] - b[0])
  let used = 0
  let cursor = -1
  for (const [a, b] of covered) {
    const from = Math.max(a, cursor + 1)
    if (b >= from) used += b - from + 1
    cursor = Math.max(cursor, b)
  }

  return { vpc: cidrText(vpc), size, ticks, segments, clashes, outside, used, lanes: Math.max(1, lanesEnd.length) }
}
