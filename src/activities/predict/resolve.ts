/** Executa o cenário no simulador correspondente e devolve o resultado real. */
import { evaluateAccess } from '../../simulators/access/model'
import { listObjects } from '../../simulators/bucket/model'
import { formatUSD, monthlyCost } from '../../simulators/cost/model'
import { regionPrices } from '../../simulators/cost/prices'
import { STORAGE_CLASSES } from '../../simulators/shared/storageClasses'
import { emptyBucket, getObject, listCurrent, replay } from '../../simulators/versioning/model'
import { simulateAll, stateAt } from '../../simulators/lifecycle/model'
import { replicate } from '../../simulators/replication/model'
import { runFlow, validateEvents } from '../../simulators/events/model'
import { evaluateRP, PAYER_LABEL } from '../../simulators/requester-pays/model'
import { bestRegion, evaluateRegion, formatMs } from '../../simulators/regions/model'
import { standardPriceIn } from '../../simulators/cost/prices'
import { failureLabel, simulateFailure, STATUS_LABEL } from '../../simulators/zones/model'
import { HOP_LABEL, simulateEdge } from '../../simulators/edge/model'
import { formatMinutes, PLANS, responseMinutes, SEVERITY_LABEL } from '../../simulators/support/model'
import { evaluate as evaluatePolicy } from '../../simulators/policy/model'
import { assumeRole } from '../../simulators/sts/model'
import { ACTION_LABEL, ASPECT_LABEL, breakeven, BURST_BASELINE, burstableHourly, monthly, stateEffects } from '../../simulators/instances/model'
import { instancePrice, usd } from '../../simulators/compute-prices'
import { needGaps, performance, validateVolume, volumeMonthly } from '../../simulators/ebs/model'
import { bestOptions, compareOptions, OPTIONS as PURCHASE_OPTIONS } from '../../simulators/purchase/model'
import { distribute, routeAlb } from '../../simulators/loadbalancer/model'
import { defaultTerminationOrder, evaluatePolicies } from '../../simulators/scaling/model'
import { simulateAccount } from '../../simulators/lambda/model'
import type { PredictSpec } from './specs'

export interface PredictResult {
  /** Chave comparada com `option.outcome`. */
  outcome: string
  /** Explicação do que o simulador fez. */
  detail: string[]
}

/** Faixas de variação usadas em "cost-change". */
export const COST_CHANGE = { upAbove: 0.02, downBelow: -0.2 } as const

export function resolvePredict(spec: PredictSpec): PredictResult {
  switch (spec.sim) {
    case 'bucket-list': {
      const res = listObjects(spec.bucket, spec.prefix, spec.delimiter)
      const count = spec.measure === 'contents' ? res.contents.length : res.commonPrefixes.length
      const shown = spec.measure === 'contents' ? res.contents.map((o) => o.key) : res.commonPrefixes
      return {
        outcome: String(count),
        detail: [
          `ListObjectsV2 com Prefix="${spec.prefix}"${spec.delimiter ? ` e Delimiter="${spec.delimiter}"` : ' sem delimitador'}`,
          `retornou ${res.contents.length} objeto(s) em Contents e ${res.commonPrefixes.length} prefixo(s) em CommonPrefixes.`,
          shown.length > 0 ? `${spec.measure === 'contents' ? 'Objetos' : 'Prefixos'}: ${shown.join(', ')}.` : '',
        ].filter(Boolean),
      }
    }
    case 'cost-change': {
      const prices = regionPrices(spec.region)
      const a = monthlyCost(spec.profile, spec.from, prices)
      const b = monthlyCost(spec.profile, spec.to, prices)
      const change = b.total / a.total - 1
      const outcome = change > COST_CHANGE.upAbove ? 'up' : change < COST_CHANGE.downBelow ? 'down' : 'flat'
      return {
        outcome,
        detail: [
          `${STORAGE_CLASSES[spec.from].name}: ${formatUSD(a.total)}/mês → ${STORAGE_CLASSES[spec.to].name}: ${formatUSD(b.total)}/mês (${change >= 0 ? '+' : ''}${Math.round(change * 100)}%).`,
          ...b.notes,
        ],
      }
    }
    case 'region': {
      const q = spec.query
      if (q.type === 'best') {
        const b = bestRegion(spec.scenario, standardPriceIn)
        return { outcome: b.code, detail: [`${b.code} (${b.fact.name}) atende aos requisitos com latência média de ${formatMs(b.weightedLatency)} (premissa do cenário).`] }
      }
      const e = evaluateRegion(spec.scenario, q.region, standardPriceIn)
      return { outcome: e.violations.length ? 'no' : 'yes', detail: e.violations.length ? e.violations.map((v) => v.message) : [`${q.region} atende aos requisitos.`, ...e.notes] }
    }
    case 'zones': {
      const r = simulateFailure(spec.topology, spec.failure)
      return { outcome: r.status, detail: [`${failureLabel(spec.failure)}: aplicação ${STATUS_LABEL[r.status].toLowerCase()} (${r.serving}/${r.required} instâncias atendendo).`, ...r.reasons] }
    }
    case 'edge': {
      const run = simulateEdge(spec.setup, spec.behaviors, spec.events)
      const last = run.requests[run.requests.length - 1]
      return { outcome: last.servedBy, detail: [`${last.method} ${last.path}: respondida por ${HOP_LABEL[last.servedBy]} (${last.hops.join(' → ')}).`, last.reason] }
    }
    case 'support': {
      const m = responseMinutes(spec.plan, spec.severity)
      const sev = SEVERITY_LABEL[spec.severity]
      return {
        outcome: m === undefined ? 'none' : String(m),
        detail: m === undefined ? [`O plano ${PLANS[spec.plan].name} não permite abrir casos técnicos: só conta, cobrança e aumento de cotas.`] : [`${PLANS[spec.plan].name}, severidade "${sev.official}": primeira resposta em até ${formatMinutes(m)}.`, 'A AWS faz todo esforço razoável para cumprir esse tempo; é prazo de primeira resposta, não de solução.'],
      }
    }
    case 'requester-pays': {
      const r = evaluateRP(spec.bucket, spec.request)
      return { outcome: spec.query === 'status' ? String(r.status) : r.requestPayer, detail: [`${r.status} · requisição: ${PAYER_LABEL[r.requestPayer]} · transferência: ${PAYER_LABEL[r.transferPayer]}.`, r.reason] }
    }
    case 'events': {
      const issues = validateEvents(spec.config, spec.destinations)
      const flow = runFlow(spec.config, spec.destinations, spec.event)
      const detail = issues.length ? ['PutBucketNotificationConfiguration rejeitado:', ...issues.map((i) => i.message)] : flow.steps
      if (spec.query.type === 'valid') return { outcome: issues.length ? 'rejected' : 'accepted', detail }
      const q = spec.query
      if (q.type === 'loop') return { outcome: flow.loop ? 'yes' : 'no', detail }
      return { outcome: flow.deliveries.some((d) => d.destination === q.destination) ? 'yes' : 'no', detail }
    }
    case 'replication': {
      const r = replicate(spec.setup, spec.event, spec.destination)
      return { outcome: r.status, detail: [`${spec.event.label} (${spec.event.key}) → ${spec.destination}: ${r.status === 'NOT_REPLICATED' ? 'não replicado' : r.status}.`, r.reason] }
    }
    case 'lifecycle': {
      const res = simulateAll(spec.datasets, spec.rules, spec.horizonDays)
      const issues = res.issues.filter((i) => i.severity === 'error').map((i) => `${i.ruleId}: ${i.message}`)
      if (spec.query.type === 'valid') {
        return { outcome: res.accepted ? 'accepted' : 'rejected', detail: res.accepted ? ['PutBucketLifecycleConfiguration aceito.'] : ['PutBucketLifecycleConfiguration rejeitado:', ...issues] }
      }
      const q = spec.query
      const i = spec.datasets.findIndex((d) => d.id === q.dataset)
      const sim = res.sims[i]
      const st = stateAt(sim, q.day)
      return {
        outcome: st,
        detail: [
          ...(res.accepted ? [] : ['A configuração foi rejeitada: nenhuma regra vale.', ...issues]),
          ...sim.events.map((e) => `Dia ${e.day}: ${e.text}`),
          `No dia ${q.day}: ${st === 'gone' ? 'excluído' : STORAGE_CLASSES[st].name}${sim.segments.find((s) => q.day >= s.from && q.day < s.to)?.noncurrent && st !== 'gone' ? ' (versão não atual, ainda cobrada)' : ''}.`,
        ],
      }
    }
    case 'versioning': {
      const { bucket, results } = replay(emptyBucket('bucket'), spec.setup)
      const steps = results.map((r) => r.message)
      const q = spec.query
      if (q.type === 'get') {
        const versions = bucket.objects[q.key] ?? []
        const vid = q.versionIndex === undefined ? undefined : versions[q.versionIndex]?.versionId
        const res = getObject(bucket, q.key, vid)
        return { outcome: res.status === 200 ? `200:${res.content}` : String(res.status), detail: [...steps, `GET ${q.key}${vid ? `?versionId=${vid}` : ''} → ${res.message}`] }
      }
      if (q.type === 'versions') {
        const n = (bucket.objects[q.key] ?? []).length
        return { outcome: String(n), detail: [...steps, `ListObjectVersions mostra ${n} versão(ões) de ${q.key} (incluindo delete markers).`] }
      }
      const n = listCurrent(bucket).length
      return { outcome: String(n), detail: [...steps, `ListObjectsV2 mostra ${n} objeto(s).`] }
    }
    case 'sts': {
      const r = assumeRole(spec.scenario, spec.role, spec.attempt)
      return { outcome: r.outcome, detail: r.trace }
    }
    case 'policy': {
      const r = evaluatePolicy(spec.scenario, spec.request)
      return { outcome: r.decision, detail: r.trace }
    }
    case 'access': {
      const d = evaluateAccess(spec.world, spec.request)
      return { outcome: d.allowed ? 'allow' : 'deny', detail: d.trace }
    }
    case 'ec2-state': {
      const e = stateEffects(spec.action)[spec.aspect]
      return { outcome: e.kept ? 'kept' : 'lost', detail: [`${ACTION_LABEL[spec.action]}: ${ASPECT_LABEL[spec.aspect]} ${e.kept ? 'é preservado' : 'não é preservado'}.`, e.note] }
    }
    case 'burst': {
      const b = monthly(burstableHourly(spec.burstable, spec.avgCpu, spec.region).total)
      const f = monthly(instancePrice(spec.fixed, spec.region).onDemandHour)
      const be = breakeven(spec.burstable, spec.fixed, spec.region)
      return {
        outcome: b < f ? 'burstable' : 'fixed',
        detail: [
          `Com CPU média de ${Math.round(spec.avgCpu * 100)}%, ${spec.burstable} custa ${usd(b)}/mês (baseline de ${Math.round(BURST_BASELINE[spec.burstable] * 100)}%, excedente cobrado por vCPU-hora) e ${spec.fixed} custa ${usd(f)}/mês.`,
          `O ponto de equilíbrio é ${Math.round(be * 1000) / 10}% de CPU média: abaixo dele, a burstable sai mais barata; acima, a fixa.`,
        ],
      }
    }
    case 'ebs': {
      const errors = validateVolume(spec.volume)
      if (errors.length) return { outcome: 'invalid', detail: [`A AWS recusaria o volume: ${errors.join('; ')}.`] }
      const gaps = needGaps(spec.volume, spec.need)
      const perf = performance(spec.volume)
      const head = `O volume entrega ${Math.round(perf.iops).toLocaleString('pt-BR')} IOPS e ${Math.round(perf.throughput)} MiB/s e custa ${usd(volumeMonthly(spec.volume))}/mês.`
      return gaps.length ? { outcome: 'short', detail: [head, `Não atende: ${gaps.join('; ')}.`] } : { outcome: 'meets', detail: [head, 'Atende a todos os requisitos da carga.'] }
    }
    case 'purchase': {
      const best = bestOptions(spec.segment, spec.options, spec.region)
      const rows = compareOptions(spec.segment, spec.options, spec.region).map((r) => `${PURCHASE_OPTIONS[r.option].short}: ${usd(r.monthly)}/mês${r.violations.length ? ` (não serve: ${r.violations.join('; ')})` : ''}`)
      return { outcome: best[0], detail: ['Custo mensal de cada opção, calculado pelo simulador:', ...rows] }
    }
    case 'alb-route': {
      const r = routeAlb(spec.listener, spec.request, (id) => spec.groups[id] ?? id)
      return { outcome: r.outcome, detail: r.trace }
    }
    case 'cross-zone': {
      const share = distribute(spec.targetsByAz, spec.crossZone)
      const pct = (v: number) => Math.round(v * 10000) / 100
      const azs = Object.keys(spec.targetsByAz)
      return {
        outcome: String(pct(share[spec.az])),
        detail: [
          `Cada nó do balanceador recebe 1/${azs.length} do tráfego.`,
          spec.crossZone ? 'Com cross-zone, cada nó distribui entre os alvos de todas as AZs.' : 'Sem cross-zone, cada nó distribui só entre os alvos da sua AZ.',
          azs.map((az) => `AZ ${az}: ${spec.targetsByAz[az]} alvo(s), ${pct(share[az]).toLocaleString('pt-BR')}% cada`).join(' · ') + '.',
        ],
      }
    }
    case 'scaling': {
      const r = evaluatePolicies(spec.group, spec.utilization, spec.policies)
      return {
        outcome: String(r.desired),
        detail: [
          `As políticas pedem ${r.asked.join(' e ')} instância(s); vence a que deixa mais capacidade.`,
          `O resultado fica entre o min (${spec.group.min}) e o max (${spec.group.max}): ${r.desired}.`,
        ],
      }
    }
    case 'asg-termination': {
      const r = defaultTerminationOrder(spec.instances, spec.template, spec.version)
      return { outcome: r.victim.id, detail: r.reasons }
    }
    case 'lambda': {
      const all = simulateAccount(spec.functions, spec.settings)
      const r = all.find((x) => x.id === spec.fn)!
      const detail = [`Precisa de ${r.needed} execuções simultâneas (requisições por segundo × duração) e tem ${r.available} disponíveis.`, ...r.notes]
      if (spec.query === 'concurrency') return { outcome: String(r.needed), detail }
      if (spec.query === 'cold-start') return { outcome: r.coldStart ? 'yes' : 'no', detail: [...detail, r.coldStart ? 'O pico passa da concorrência provisionada: ambientes novos precisam inicializar.' : 'A provisionada cobre o pico: todos os ambientes já estão inicializados.'] }
      return { outcome: r.throttled ? 'yes' : 'no', detail }
    }
    case 'cost-cheapest': {
      const prices = regionPrices(spec.region)
      const costs = spec.candidates.map((sc) => monthlyCost(spec.profile, sc, prices)).filter((c) => !spec.compliantOnly || c.violations.length === 0)
      const best = costs.reduce((x, y) => (y.total < x.total ? y : x))
      return {
        outcome: best.storageClass,
        detail: [
          'Custo mensal calculado pelo simulador:',
          spec.candidates
            .map((sc) => {
              const c = monthlyCost(spec.profile, sc, prices)
              return `${STORAGE_CLASSES[sc].shortName} ${formatUSD(c.total)}${c.violations.length ? ' (não atende aos requisitos)' : ''}`
            })
            .join(' · ') + '.',
        ],
      }
    }
  }
}
