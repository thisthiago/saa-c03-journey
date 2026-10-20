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
