/**
 * Planos do AWS Support: recursos, tempos de primeira resposta e preço.
 *
 * Conferido em 18/10/2026:
 * - Planos e recursos: https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html
 * - Severidades e tempos de primeira resposta: https://docs.aws.amazon.com/awssupport/latest/user/case-management.html
 *   ("every reasonable effort" — não é garantia de resolução).
 * - Trusted Advisor por plano: https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html
 * - Fim do Developer, Business e Enterprise On-Ramp: https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html
 *   e https://aws.amazon.com/premiumsupport/faqs/
 * - Preços: https://aws.amazon.com/premiumsupport/pricing/
 *
 * Simplificações: custo calculado só pelas faixas públicas sobre o gasto
 * mensal informado (sem preços regionais especiais, sem créditos, sem
 * complementos como Countdown Premium ou Incident Detection and Response).
 */

export type PlanId = 'basic' | 'business-plus' | 'enterprise' | 'unified-ops'
export type LegacyPlanId = 'developer' | 'business' | 'enterprise-on-ramp'
export type Severity = 'general' | 'impaired' | 'prod-impaired' | 'prod-down' | 'critical'

export const SEVERITIES: Severity[] = ['general', 'impaired', 'prod-impaired', 'prod-down', 'critical']

export const SEVERITY_LABEL: Record<Severity, { name: string; official: string; description: string }> = {
  general: { name: 'Orientação geral', official: 'General guidance', description: 'Dúvida geral de desenvolvimento ou pedido de recurso.' },
  impaired: { name: 'Sistema prejudicado', official: 'System impaired', description: 'Funções não críticas se comportam de forma anormal, ou dúvida de desenvolvimento com prazo.' },
  'prod-impaired': { name: 'Produção prejudicada', official: 'Production system impaired', description: 'Funções importantes da aplicação estão prejudicadas ou degradadas.' },
  'prod-down': { name: 'Produção fora do ar', official: 'Production system down', description: 'O negócio é afetado de forma significativa; funções importantes estão indisponíveis.' },
  critical: { name: 'Sistema crítico fora do ar', official: 'Business-critical system down', description: 'O negócio está em risco; funções críticas estão indisponíveis.' },
}

export interface PlanInfo {
  name: string
  technicalCases: boolean
  channels: string
  /** Primeira resposta em minutos, por severidade (ausente = não disponível). */
  response: Partial<Record<Severity, number>>
  responseNote?: string
  trustedAdvisor: 'basic' | 'all' | 'all+priority'
  tam: 'none' | 'designated'
  extras: string[]
  /** Faixas: [limite superior do gasto em US$, percentual]. A última faixa não tem limite. */
  pricing: { minimum: number; tiers: [number, number][] } | null
}

const H = 60
const STD = { general: 24 * H, impaired: 12 * H, 'prod-impaired': 4 * H, 'prod-down': 1 * H }

export const PLANS: Record<PlanId, PlanInfo> = {
  basic: {
    name: 'Basic',
    technicalCases: false,
    channels: 'Atendimento de conta e cobrança e pedidos de aumento de cota, 24/7; documentação, whitepapers e AWS re:Post.',
    response: {},
    trustedAdvisor: 'basic',
    tam: 'none',
    extras: ['AWS Health Dashboard'],
    pricing: null,
  },
  'business-plus': {
    name: 'Business Support+',
    technicalCases: true,
    channels: 'Telefone, web e chat 24/7 com engenheiros de suporte; assistente com IA generativa; casos ilimitados abertos por qualquer usuário com permissão.',
    response: { ...STD, critical: 30 },
    responseNote: 'Sistema crítico: menos de 30 minutos de engajamento humano.',
    trustedAdvisor: 'all',
    tam: 'none',
    extras: ['AWS Support API', 'Suporte a software de terceiros comum na AWS', 'Orientação de arquitetura com especialistas'],
    pricing: { minimum: 29, tiers: [[10_000, 0.09], [80_000, 0.07], [250_000, 0.05], [Infinity, 0.03]] },
  },
  enterprise: {
    name: 'Enterprise Support',
    technicalCases: true,
    channels: 'Tudo do Business Support+, mais acesso 24/7 a engenheiros do AWS Security Incident Response.',
    response: { ...STD, critical: 15 },
    responseNote: 'Sistema crítico: menos de 15 minutos.',
    trustedAdvisor: 'all+priority',
    tam: 'designated',
    extras: ['Technical Account Manager (TAM) designado', 'AWS Security Incident Response', 'Revisões estratégicas e Well-Architected com o TAM', 'AWS Countdown (eventos críticos)', 'Trusted Advisor Priority'],
    pricing: { minimum: 5_000, tiers: [[150_000, 0.1], [500_000, 0.07], [1_000_000, 0.05], [Infinity, 0.03]] },
  },
  'unified-ops': {
    name: 'Unified Operations',
    technicalCases: true,
    channels: 'Especialistas designados atuando como extensão da equipe, nos canais preferidos do cliente, com monitoramento 24/7.',
    response: { ...STD, critical: 5 },
    responseNote: 'Sistema crítico: 5 minutos, por um Incident Management Engineer.',
    trustedAdvisor: 'all+priority',
    tam: 'designated',
    extras: ['TAM e Domain Specialist Engineers designados', 'Incident Management Engineer', 'Orientação de arquitetura de aplicações', 'Infrastructure event management', 'AWS Countdown Premium incluído', 'Revisões de workloads críticos e runbooks personalizados'],
    pricing: { minimum: 50_000, tiers: [[1_000_000, 0.1], [5_000_000, 0.06], [Infinity, 0.05]] },
  },
}

export const PLAN_ORDER: PlanId[] = ['basic', 'business-plus', 'enterprise', 'unified-ops']

export interface LegacyInfo {
  name: string
  status: string
  successor: string
}

export const LEGACY_PLANS: Record<LegacyPlanId, LegacyInfo> = {
  developer: { name: 'Developer Support', status: 'Sem novas assinaturas desde 02/12/2025; descontinuado em 01/01/2027.', successor: 'Business Support+ (ou volta ao Basic)' },
  business: { name: 'Business Support', status: 'Sem novas assinaturas desde 02/12/2025; descontinuado em 01/01/2027.', successor: 'Business Support+' },
  'enterprise-on-ramp': { name: 'Enterprise On-Ramp', status: 'Suportado até 31/12/2026; clientes migram automaticamente para o Enterprise Support ao longo de 2026.', successor: 'Enterprise Support' },
}

export const LEGACY_NOTE = 'Os três planos antigos continuam disponíveis na Região AWS GovCloud (US).'

/** Custo mensal do plano: o maior entre o mínimo e a soma das faixas sobre o gasto AWS do mês. */
export function monthlyCost(plan: PlanId, awsSpend: number): number {
  const p = PLANS[plan].pricing
  if (!p) return 0
  let rest = awsSpend
  let prev = 0
  let total = 0
  for (const [limit, pct] of p.tiers) {
    const slice = Math.max(0, Math.min(rest, limit - prev))
    total += slice * pct
    rest -= slice
    prev = limit
    if (rest <= 0) break
  }
  return Math.max(p.minimum, Math.round(total * 100) / 100)
}

export function responseMinutes(plan: PlanId, sev: Severity): number | undefined {
  return PLANS[plan].response[sev]
}

export function formatMinutes(min: number | undefined): string {
  if (min === undefined) return 'sem caso técnico'
  if (min < 60) return `${min} min`
  return `${min / 60} h`
}

export interface SupportNeeds {
  technicalCases?: boolean
  /** Primeira resposta máxima exigida para "sistema crítico fora do ar" (minutos). */
  criticalWithinMin?: number
  /** Primeira resposta máxima exigida para "produção fora do ar" (minutos). */
  prodDownWithinMin?: number
  designatedTam?: boolean
  allTrustedAdvisorChecks?: boolean
  securityIncidentResponse?: boolean
  domainSpecialists?: boolean
}

export interface SupportScenario {
  id: string
  name: string
  description: string
  /** Gasto mensal com a AWS (premissa do cenário). */
  awsMonthlySpend: number
  needs: SupportNeeds
  concepts?: string[]
}

export function planGaps(plan: PlanId, n: SupportNeeds): string[] {
  const p = PLANS[plan]
  const gaps: string[] = []
  if (n.technicalCases && !p.technicalCases) gaps.push('não permite abrir casos técnicos')
  if (n.criticalWithinMin !== undefined && (p.response.critical ?? Infinity) > n.criticalWithinMin) gaps.push(`resposta para sistema crítico é ${p.response.critical ? formatMinutes(p.response.critical) : 'inexistente'} (precisa de até ${formatMinutes(n.criticalWithinMin)})`)
  if (n.prodDownWithinMin !== undefined && (p.response['prod-down'] ?? Infinity) > n.prodDownWithinMin) gaps.push('não atende "produção fora do ar" no prazo exigido')
  if (n.designatedTam && p.tam !== 'designated') gaps.push('não inclui TAM designado')
  if (n.allTrustedAdvisorChecks && p.trustedAdvisor === 'basic') gaps.push('no Basic, o Trusted Advisor tem só os checks de cotas e alguns de segurança e tolerância a falhas')
  if (n.securityIncidentResponse && !p.extras.some((e) => e.includes('Security Incident Response'))) gaps.push('não inclui o AWS Security Incident Response')
  if (n.domainSpecialists && plan !== 'unified-ops') gaps.push('não inclui Domain Specialist Engineers nem Incident Management Engineer')
  return gaps
}

/** O plano mais barato que atende a todas as necessidades. */
export function bestPlan(s: SupportScenario): PlanId {
  const ok = PLAN_ORDER.filter((p) => planGaps(p, s.needs).length === 0).sort((a, b) => monthlyCost(a, s.awsMonthlySpend) - monthlyCost(b, s.awsMonthlySpend))
  if (ok.length === 0) throw new Error(`Cenário ${s.id}: nenhum plano atende`)
  return ok[0]
}

export function formatUSD(n: number): string {
  return `US$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
