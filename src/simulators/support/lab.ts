/** Support Plan Challenge: escolher o plano adequado a cada organização. */
import type { ItemFeedback } from '../../engine/types'
import { bestPlan, formatUSD, monthlyCost, PLAN_ORDER, PLANS, planGaps, type PlanId, type SupportNeeds, type SupportScenario } from './model'

export interface SupportLabConfig {
  scenarios: SupportScenario[]
  plans: PlanId[]
}

export interface SupportLabResponse {
  choices: Record<string, PlanId | undefined>
}

export const supportLabSolution = (c: SupportLabConfig): SupportLabResponse => ({ choices: Object.fromEntries(c.scenarios.map((s) => [s.id, bestPlan(s)])) })

/** Benefícios do plano que respondem às necessidades do cenário. */
export function relevantBenefits(plan: PlanId, n: SupportNeeds): string[] {
  const p = PLANS[plan]
  const out: string[] = []
  if (n.technicalCases && p.technicalCases) out.push('casos técnicos 24/7')
  if (n.criticalWithinMin !== undefined && p.response.critical !== undefined) out.push(p.responseNote ?? '')
  if (n.prodDownWithinMin !== undefined && p.response['prod-down'] !== undefined) out.push('produção fora do ar: primeira resposta em até 1 h')
  if (n.designatedTam && p.tam === 'designated') out.push('TAM designado')
  if (n.allTrustedAdvisorChecks && p.trustedAdvisor !== 'basic') out.push('todos os checks do Trusted Advisor')
  if (n.securityIncidentResponse && p.extras.some((e) => e.includes('Security Incident Response'))) out.push('AWS Security Incident Response')
  if (n.domainSpecialists && plan === 'unified-ops') out.push('Domain Specialist Engineers e Incident Management Engineer')
  return out.filter(Boolean)
}

export function evaluateSupportLab(c: SupportLabConfig, r: SupportLabResponse) {
  const items = c.scenarios.map((s) => {
    const pick = r.choices?.[s.id]
    const best = bestPlan(s)
    const bestCost = monthlyCost(best, s.awsMonthlySpend)
    if (!pick) return { concepts: s.concepts, score: 0, fb: { id: s.id, label: `${s.name}: —`, status: 'missed', message: `Escolha um plano. O adequado é ${PLANS[best].name}.` } as ItemFeedback }
    const gaps = planGaps(pick, s.needs)
    const cost = monthlyCost(pick, s.awsMonthlySpend)
    let score = 0
    let status: ItemFeedback['status'] = 'wrong'
    let message: string
    if (pick === best) {
      score = 1
      status = 'correct'
      const cheaper = PLAN_ORDER.slice(0, PLAN_ORDER.indexOf(best)).filter((p) => c.plans.includes(p))
      const below = cheaper.length ? ` Um plano abaixo não serve: ${PLANS[cheaper[cheaper.length - 1]].name} ${planGaps(cheaper[cheaper.length - 1], s.needs).join('; ')}.` : ''
      const benefits = relevantBenefits(best, s.needs)
      message = `${benefits.length ? `Atende com: ${benefits.join(', ')}.` : 'Atende às necessidades sem custo.'} Custo estimado: ${formatUSD(bestCost)}/mês.${below}`
    } else if (gaps.length === 0) {
      score = 0.5
      status = 'partial'
      message = `Atende, mas paga por mais do que precisa: ${formatUSD(cost)}/mês contra ${formatUSD(bestCost)}/mês do ${PLANS[best].name}, que já cobre tudo o que o cenário pede. Plano mais caro não é automaticamente melhor.`
    } else {
      message = `${PLANS[pick].name} ${gaps.join('; ')}. O adequado é ${PLANS[best].name} (${formatUSD(bestCost)}/mês).`
    }
    return { concepts: s.concepts, score, fb: { id: s.id, label: `${s.name}: ${PLANS[pick].name}`, status, message } as ItemFeedback }
  })
  return { score: items.reduce((sum, x) => sum + x.score, 0) / Math.max(1, items.length), items }
}
