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
import { describeTopology, FAILURE_LABEL as DB_FAILURE_LABEL, formatSeconds, LOSS_LABEL, simulateFailure as simulateDbFailure } from '../../simulators/rdsha/model'
import { CONSISTENCY_LABEL, hotPartition, MODE_LABEL, neededCapacity, onDemandMonthly, provisionedMonthly, readUnits, writeUnits, cheaperMode } from '../../simulators/dynamo/model'
import { auroraMonthly, cheaperStorageConfig, ioShare, STORAGE_CONFIG_LABEL } from '../../simulators/aurora/model'
import { cacheMetrics, describeCache } from '../../simulators/cachedb/model'
import { MISSING_LABEL, stateFromPoints, type PointCat } from '../../simulators/alarm/model'
import { matchFilter } from '../../simulators/logs/model'
import { FOUND_LABEL, foundIn } from '../../simulators/trail/model'
import { evaluateRule, RULES } from '../../simulators/compliance/model'
import { EFFECT_LABEL as CFN_EFFECT_LABEL, planUpdate } from '../../simulators/stack/model'
import { METHOD_LABEL, NEEDS_INBOUND_PORT, notManagedReasons } from '../../simulators/ssm/model'
import { dailyTotals, firstAlertDay } from '../../simulators/budget/model'
import { blockProblems, lookupRoute, overlaps, parseCidr, usableIps, type Cidr } from '../../simulators/vpcnet/model'
import { OUTCOME_LABEL as REACH_LABEL, traceFlow } from '../../simulators/reach/model'
import { reaches } from '../../simulators/connect/model'
import { resolveDns } from '../../simulators/dns/model'
import { describeLayout, formatSize, layoutMonthly, scannedGB } from '../../simulators/datalake/model'
import { describeGrant, visibleColumns, visibleRows } from '../../simulators/lakeperm/model'
import { describeCluster, runJob } from '../../simulators/emr/model'
import { kmsDecide } from '../../simulators/kms/model'
import { loginOutcome } from '../../simulators/secrets/model'
import { placement as certPlacement, renewal as certRenewal } from '../../simulators/certs/model'
import { fifoAccept, runMessage } from '../../simulators/queue/model'
import { matches, patternText } from '../../simulators/eventbus/pattern'
import { runTask } from '../../simulators/workflow/model'
import { effectiveLimit, throttle } from '../../simulators/apigw/model'
import { hotShard, LIMIT_LABEL, shardsNeeded } from '../../simulators/stream/model'
import { cheapestEfs, clientAccess, fmtUsd, THROUGHPUT_LABEL } from '../../simulators/filesystem/model'
import { filesPrices } from '../../simulators/files-prices'
import { fsxFailure } from '../../simulators/fsx/model'
import { FREQUENCY_HOURS, planProblem, survives } from '../../simulators/backup/model'
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
    case 'rds-failure': {
      const r = simulateDbFailure(spec.topology, spec.failure)
      const detail = [
        `${describeTopology(spec.topology)}, diante de ${DB_FAILURE_LABEL[spec.failure]}: ${r.how}.`,
        `${LOSS_LABEL[r.loss][0].toUpperCase()}${LOSS_LABEL[r.loss].slice(1)}${Number.isFinite(r.downtime) ? `; cerca de ${formatSeconds(r.downtime)} sem escritas` : ''}.`,
      ]
      return { outcome: spec.query === 'loss' ? r.loss : r.recovery, detail }
    }
    case 'ddb-units': {
      const units = spec.op === 'read' ? readUnits(spec.itemKB, spec.consistency ?? 'eventual') : writeUnits(spec.itemKB, spec.transactional)
      const kind = spec.op === 'read' ? `leitura ${CONSISTENCY_LABEL[spec.consistency ?? 'eventual']}` : `escrita${spec.transactional ? ' transacional' : ''}`
      const block = spec.op === 'read' ? 4 : 1
      return {
        outcome: String(units),
        detail: [`Uma ${kind} de um item de ${spec.itemKB.toLocaleString('pt-BR')} KB arredonda o tamanho para ${Math.ceil(spec.itemKB / block) * block} KB e consome ${units.toLocaleString('pt-BR')} unidade(s).`],
      }
    }
    case 'ddb-hot': {
      const per = spec.op === 'read' ? readUnits(spec.itemKB, spec.consistency ?? 'eventual') : writeUnits(spec.itemKB)
      const r = hotPartition(spec.keys, spec.perSecond, per, spec.op)
      return {
        outcome: r.throttled ? 'yes' : 'no',
        detail: [
          `O valor "${r.hottest.value}" recebe ${Math.round(r.hottest.units).toLocaleString('pt-BR')} unidades de ${spec.op === 'read' ? 'leitura' : 'escrita'} por segundo.`,
          `Uma partição entrega no máximo ${r.limit.toLocaleString('pt-BR')}: ${r.throttled ? 'o excedente sofre throttling, mesmo com a tabela folgada no total' : 'cabe na partição'}.`,
        ],
      }
    }
    case 'ddb-mode': {
      const n = neededCapacity(spec.load)
      const od = onDemandMonthly(spec.load, spec.region).total
      const prov = provisionedMonthly(n.rcu, n.wcu, spec.region).total
      const best = cheaperMode(spec.load, spec.region)
      return {
        outcome: best,
        detail: [
          `${MODE_LABEL['on-demand']}: US$ ${od.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/mês, pagando cada requisição pela média do mês.`,
          `${MODE_LABEL.provisioned}: US$ ${prov.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/mês, reservando ${n.rcu.toLocaleString('pt-BR')} RCU e ${n.wcu.toLocaleString('pt-BR')} WCU para cobrir o pico.`,
        ],
      }
    }
    case 'aurora-io': {
      const s = auroraMonthly(spec.cluster, 'standard', spec.region)
      const o = auroraMonthly(spec.cluster, 'io-optimized', spec.region)
      return {
        outcome: cheaperStorageConfig(spec.cluster, spec.region),
        detail: [
          `${STORAGE_CONFIG_LABEL.standard}: US$ ${s.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/mês, dos quais ${Math.round(ioShare(spec.cluster, spec.region) * 100)}% são E/S.`,
          `${STORAGE_CONFIG_LABEL['io-optimized']}: US$ ${o.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/mês, sem cobrança de E/S e com instância e armazenamento mais caros.`,
        ],
      }
    }
    case 'cache': {
      const m = cacheMetrics(spec.load, spec.config)
      const detail = [
        `${describeCache(spec.config)}: ${Math.round(m.hitRate * 1000) / 10}% de acertos, ${Math.round(m.dbReadsPerSec).toLocaleString('pt-BR')} leituras por segundo no banco.`,
        Number.isFinite(m.maxStaleSec) ? (m.maxStaleSec > 0 ? `Um dado alterado no banco pode aparecer desatualizado por até ${m.maxStaleSec} s.` : 'O cache não mostra dados desatualizados.') : 'Sem TTL e sem escrita direta, um dado alterado no banco fica desatualizado no cache até sair dele.',
      ]
      if (spec.query === 'stale') return { outcome: m.maxStaleSec > 0 ? 'yes' : 'no', detail }
      return { outcome: m.dbReadsPerSec <= (spec.maxDbReads ?? 0) ? 'yes' : 'no', detail }
    }
    case 'alarm-state': {
      const cats: PointCat[] = spec.points.split(' ').map((c) => (c === '0' ? 'ok' : c === 'X' ? 'breach' : 'missing'))
      const state = stateFromPoints(cats, spec.n, spec.m, spec.missing, spec.prev ?? 'OK')
      const real = cats.filter((c) => c !== 'missing').length
      return {
        outcome: state,
        detail: [
          `Alarme de ${spec.m} em ${spec.n} pontos. Os cinco pontos mais recentes, do mais antigo ao mais novo: ${spec.points}.`,
          `Pontos reais no intervalo: ${real}. Dados ausentes: ${MISSING_LABEL[spec.missing]}.`,
          `Estado resultante: ${state}.`,
        ],
      }
    }
    case 'trail-found': {
      const found = foundIn(spec.event, spec.trails, spec.account)
      return { outcome: found, detail: [`${spec.event.text}: ${FOUND_LABEL[found].toLowerCase()}.`, spec.event.kind === 'management' ? `Evento de gerenciamento de ${spec.event.ageDays} dia(s) atrás, na Região ${spec.event.region}.` : `Evento de dados, que o histórico de eventos nunca mostra.`] }
    }
    case 'config-rule': {
      const result = evaluateRule(RULES[spec.rule], spec.resource, spec.params)
      return { outcome: result, detail: [`A regra ${spec.rule} avaliou ${spec.resource.name}: ${result}.`] }
    }
    case 'budget-alert': {
      const daily = dailyTotals(spec.streams, spec.filter, spec.days)
      const day = firstAlertDay(daily, spec.limit, [spec.alert])
      const total = Math.round(daily.reduce((a, b) => a + b, 0))
      return { outcome: day === undefined ? 'never' : String(day), detail: [`Gasto do mês: cerca de US$ ${total.toLocaleString('pt-BR')}; limite de US$ ${spec.limit.toLocaleString('pt-BR')}.`, day === undefined ? 'O alerta não dispara neste mês.' : `O alerta de ${spec.alert.kind === 'actual' ? 'valor real' : 'valor previsto'} a ${spec.alert.pct}% dispara no dia ${day}.`] }
    }
    case 'ssm-port': {
      const needs = NEEDS_INBOUND_PORT[spec.method]
      return { outcome: needs ? 'yes' : 'no', detail: [`${METHOD_LABEL[spec.method]}: ${needs ? 'exige uma porta de entrada aberta, na instância ou num servidor intermediário.' : 'não exige nenhuma porta de entrada: a instância é que se conecta ao serviço, por saída.'}`] }
    }
    case 'ssm-managed': {
      const reasons = notManagedReasons(spec.node)
      return { outcome: reasons.length ? 'not-managed' : 'managed', detail: reasons.length ? ['A instância não aparece como nó gerenciado:', ...reasons.map((r) => `${r}.`)] : ['O agente está rodando, tem permissões e alcança o serviço: a instância é um nó gerenciado.'] }
    }
    case 'cfn-effect': {
      const plan = planUpdate(spec.current, spec.next).find((p) => p.id === spec.resource)
      if (!plan) throw new Error(`Recurso ${spec.resource} não existe nos modelos`)
      return { outcome: plan.effect, detail: [`${spec.resource}: ${CFN_EFFECT_LABEL[plan.effect].toLowerCase()}.`, plan.why] }
    }
    case 'log-filter': {
      const yes = matchFilter(spec.pattern, spec.line)
      return { outcome: yes ? 'yes' : 'no', detail: [`O padrão ${spec.pattern} ${yes ? 'conta' : 'não conta'} a linha ${spec.line}.`] }
    }
    case 'cidr': {
      const q = spec.query
      if (q.type === 'usable') {
        const c = parseCidr(q.cidr) as Cidr
        return { outcome: String(usableIps(c.prefix)), detail: [`${q.cidr} tem ${2 ** (32 - c.prefix)} endereços. A AWS reserva os quatro primeiros e o último, e sobram ${usableIps(c.prefix)}.`] }
      }
      if (q.type === 'valid') {
        const vpc = q.vpc ? (parseCidr(q.vpc) as Cidr) : undefined
        const pb = blockProblems(q.cidr, q.kind, vpc)
        return { outcome: pb.length ? 'invalid' : 'valid', detail: pb.length ? [`A AWS recusa: ${pb.join('; ')}.`] : [`${q.cidr} é aceito como bloco de ${q.kind === 'vpc' ? 'VPC' : 'sub-rede'}.`] }
      }
      const yes = overlaps(parseCidr(q.a) as Cidr, parseCidr(q.b) as Cidr)
      return { outcome: yes ? 'yes' : 'no', detail: [yes ? `${q.a} e ${q.b} têm endereços em comum.` : `${q.a} e ${q.b} não têm nenhum endereço em comum.`] }
    }
    case 'route': {
      const r = lookupRoute(spec.routes, spec.destination, spec.prefixLists)
      return { outcome: r.route?.target ?? 'drop', detail: r.trace }
    }
    case 'reach': {
      const r = traceFlow(spec.world, spec.flow)
      return { outcome: r.outcome, detail: [...r.trace, `Resultado: ${REACH_LABEL[r.outcome]}.`] }
    }
    case 'connect': {
      const r = reaches(spec.nets, spec.topology, spec.from, spec.to)
      return { outcome: r.ok ? 'yes' : 'no', detail: [r.why] }
    }
    case 'dns': {
      const r = resolveDns(spec.records, spec.client)
      if (spec.query === 'share') return { outcome: String(Math.round((r.shares?.[spec.record!] ?? 0) * 10000) / 100), detail: r.trace }
      return { outcome: r.answers.length ? r.answers.join('+') : 'none', detail: r.trace }
    }
    case 'datalake': {
      const q = spec.query ? spec.table.queries.find((x) => x.id === spec.query) : undefined
      const rows = Object.entries(spec.layouts).map(([id, l]) => ({ id, l, value: q ? scannedGB(spec.table, l, q) : layoutMonthly(spec.table, l, spec.region).total }))
      const min = Math.min(...rows.map((r) => r.value))
      const winners = rows.filter((r) => r.value <= min * 1.01)
      return {
        outcome: winners.length > 1 ? 'same' : winners[0].id,
        detail: rows.map((r) => `${describeLayout(r.l, spec.table)}: ${q ? `lê ${formatSize(r.value)} em "${q.label}"` : `${usd(r.value)} por mês`}.`),
      }
    }
    case 'emr': {
      const r = runJob(spec.job, spec.cluster)
      return { outcome: r.outcome, detail: [`Cluster: ${describeCluster(spec.cluster)}.`, ...r.trace] }
    }
    case 'kms': {
      const d = kmsDecide(spec.world, spec.request)
      return { outcome: d.allowed ? 'allow' : 'deny', detail: d.trace }
    }
    case 'secrets': {
      const r = loginOutcome(spec.strategy, spec.moment, spec.reader)
      return { outcome: r.outcome, detail: [r.detail] }
    }
    case 'certs': {
      const r = spec.measure === 'renewal' ? certRenewal(spec.cert) : certPlacement(spec.cert)
      return { outcome: r.result, detail: [r.why] }
    }
    case 'queue': {
      const r = runMessage(spec.run)
      return { outcome: r.outcome, detail: r.trace }
    }
    case 'fifo': {
      const r = fifoAccept(spec.sends)
      const order = r.byGroup[spec.group] ?? []
      return { outcome: order.join('+') || 'none', detail: [r.dropped.length ? `Descartadas como repetidas dentro de 5 minutos: ${r.dropped.join(', ')}.` : 'Nenhuma mensagem repetida dentro de 5 minutos.', `Ordem no grupo ${spec.group}: ${order.join(', ') || 'nenhuma'}.`] }
    }
    case 'eventbus': {
      const ok = !spec.pattern || matches(spec.pattern, spec.event)
      return { outcome: ok ? 'yes' : 'no', detail: [spec.pattern ? `Padrão: ${patternText(spec.pattern)}.` : 'Sem padrão: tudo passa.', ok ? 'Todos os campos do padrão casam com o evento.' : 'Pelo menos um campo do padrão não casa com o evento.'] }
    }
    case 'workflow': {
      const r = runTask(spec.task, spec.handling)
      return { outcome: r.outcome, detail: r.trace }
    }
    case 'apigw': {
      const lim = effectiveLimit(...spec.limits)
      const r = throttle(spec.demand, lim)
      return { outcome: String(r.throttled), detail: [`Limite efetivo: ${lim.rate} req/s com burst de ${lim.burst}.`, r.throttled ? `${r.throttled} requisições recebem 429.` : 'Nenhuma requisição recebe 429.'] }
    }
    case 'stream': {
      if (spec.measure === 'hot') {
        const h = hotShard(spec.load.writeMBps, spec.hotKeyShare ?? 0)
        return { outcome: h.overloaded ? 'yes' : 'no', detail: [`A chave quente leva ${h.mbps.toLocaleString('pt-BR')} MB/s a um só shard, que aceita 1 MB/s.`] }
      }
      const n = shardsNeeded(spec.load, spec.mode)
      return { outcome: String(n.shards), detail: [`Quem decide é ${LIMIT_LABEL[n.limit]}.`] }
    }
    case 'lakeperm': {
      const detail = spec.grants.length ? spec.grants.map((g) => `Concessão: ${describeGrant(spec.table, g)}.`) : ['Nenhuma concessão.']
      if (spec.measure === 'rows') {
        const rows = visibleRows(spec.table, spec.grants)
        return { outcome: String(rows), detail: [...detail, `O analista vê ${rows} de ${spec.table.rows.length} linhas.`] }
      }
      const sees = visibleColumns(spec.table, spec.grants).has(spec.column!)
      return { outcome: sees ? 'yes' : 'no', detail: [...detail, sees ? 'A coluna aparece para o analista.' : 'A coluna fica oculta para o analista.'] }
    }
    case 'efs-access': {
      const r = clientAccess(spec.topology, spec.clientAz, spec.failedAz)
      return { outcome: r.outcome, detail: [r.why] }
    }
    case 'efs-cost': {
      const { best, all } = cheapestEfs(spec.usage, filesPrices(spec.region).efs, undefined, [spec.lifecycle])
      return {
        outcome: best.mode,
        detail: all.map((x) => `${THROUGHPUT_LABEL[x.mode]}: ${!x.cost.valid || !x.cost.meets ? x.cost.reason : `${fmtUsd(x.cost.total)} por mês`}`),
      }
    }
    case 'fsx-failure': {
      const r = fsxFailure(spec.deployment, spec.event)
      return { outcome: r.outcome, detail: [r.why] }
    }
    case 'backup': {
      const problem = planProblem(spec.plan)
      if (spec.query.type === 'valid') return { outcome: problem ? 'rejected' : 'accepted', detail: [problem ?? 'O plano cumpre as regras de frequência, retenção e armazenamento frio.'] }
      if (problem) throw new Error(`Plano inválido na previsão: ${problem}`)
      if (spec.query.type === 'rpo') {
        const h = FREQUENCY_HOURS[spec.plan.frequency]
        return { outcome: String(h), detail: [h === 0 ? 'O backup contínuo permite restaurar qualquer momento dentro da retenção.' : `Entre dois backups passam ${h} horas: no pior caso, perdem-se ${h} horas de dados.`] }
      }
      const r = survives(spec.plan, spec.query.disaster)
      return { outcome: r.ok ? 'yes' : 'no', detail: [r.why] }
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
