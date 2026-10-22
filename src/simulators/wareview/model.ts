/**
 * Revisão Well-Architected: cada achado de uma carga fictícia corresponde a
 * uma boa prática do framework que não está sendo seguida. O pilar e o nível
 * de risco vêm da página da boa prática.
 *
 * Conferido em 22/10/2026:
 * - Seis pilares: excelência operacional, segurança, confiabilidade,
 *   eficiência de desempenho, otimização de custos e sustentabilidade
 *   (https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html).
 * - Cada boa prática traz a linha "Level of risk exposed if this best practice
 *   is not established" (High, Medium ou Low). Os níveis abaixo foram lidos,
 *   um a um, nas páginas listadas em `url`.
 * - A Well-Architected Tool aponta riscos altos (HRIs) e médios (MRIs) a partir
 *   das respostas; são orientações, e o cliente deve documentar os motivos de
 *   não seguir uma boa prática
 *   (https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html).
 *
 * Simplificação: cada achado corresponde a uma única boa prática; os títulos
 * em português são resumos do AWS Quest.
 */

export type Pillar = 'ops' | 'security' | 'reliability' | 'performance' | 'cost' | 'sustainability'
export type Risk = 'high' | 'medium' | 'low'

export const PILLAR_LABEL: Record<Pillar, string> = {
  ops: 'Excelência operacional',
  security: 'Segurança',
  reliability: 'Confiabilidade',
  performance: 'Eficiência de desempenho',
  cost: 'Otimização de custos',
  sustainability: 'Sustentabilidade',
}

export const RISK_LABEL: Record<Risk, string> = { high: 'Alto', medium: 'Médio', low: 'Baixo' }

export interface BestPractice {
  id: string
  title: string
  pillar: Pillar
  risk: Risk
  url: string
}

const fw = (page: string) => `https://docs.aws.amazon.com/wellarchitected/latest/framework/${page}.html`

const LIST: BestPractice[] = [
  { id: 'OPS05-BP01', title: 'Usar controle de versão', pillar: 'ops', risk: 'high', url: fw('ops_dev_integ_version_control') },
  { id: 'SEC02-BP01', title: 'Usar mecanismos fortes de login', pillar: 'security', risk: 'high', url: fw('sec_identities_enforce_mechanisms') },
  { id: 'SEC02-BP02', title: 'Usar credenciais temporárias', pillar: 'security', risk: 'high', url: fw('sec_identities_unique') },
  { id: 'SEC08-BP02', title: 'Exigir criptografia em repouso', pillar: 'security', risk: 'high', url: fw('sec_protect_data_rest_encrypt') },
  { id: 'REL05-BP01', title: 'Degradar de forma controlada quando uma dependência falha', pillar: 'reliability', risk: 'high', url: fw('rel_mitigate_interaction_failure_graceful_degradation') },
  { id: 'REL08-BP04', title: 'Implantar com infraestrutura imutável', pillar: 'reliability', risk: 'medium', url: fw('rel_tracking_change_management_immutable_infrastructure') },
  { id: 'REL09-BP01', title: 'Identificar e fazer backup de todos os dados necessários', pillar: 'reliability', risk: 'high', url: fw('rel_backing_up_data_identified_backups_data') },
  { id: 'REL10-BP01', title: 'Implantar a carga em vários locais', pillar: 'reliability', risk: 'high', url: fw('rel_fault_isolation_multiaz_region_system') },
  { id: 'REL13-BP02', title: 'Usar estratégias de recuperação definidas para cumprir as metas', pillar: 'reliability', risk: 'high', url: fw('rel_planning_for_recovery_disaster_recovery') },
  { id: 'PERF03-BP01', title: 'Usar o armazenamento de dados feito para o padrão de acesso', pillar: 'performance', risk: 'high', url: fw('perf_data_use_purpose_built_data_store') },
  { id: 'PERF04-BP06', title: 'Escolher o local da carga pela necessidade de rede', pillar: 'performance', risk: 'medium', url: fw('perf_networking_choose_workload_location_network_requirements') },
  { id: 'COST04-BP01', title: 'Rastrear os recursos ao longo da vida', pillar: 'cost', risk: 'high', url: fw('cost_decomissioning_resources_track') },
  { id: 'COST06-BP03', title: 'Escolher tipo, tamanho e quantidade pelas métricas', pillar: 'cost', risk: 'low', url: fw('cost_type_size_number_resources_metrics') },
  { id: 'COST07-BP01', title: 'Analisar o modelo de compra de cada componente', pillar: 'cost', risk: 'high', url: fw('cost_pricing_model_analysis') },
  { id: 'SUS02-BP01', title: 'Escalar a infraestrutura dinamicamente', pillar: 'sustainability', risk: 'medium', url: fw('sus_sus_user_a2') },
]

export const BEST_PRACTICES: Record<string, BestPractice> = Object.fromEntries(LIST.map((b) => [b.id, b]))

export function bestPractice(id: string): BestPractice {
  const b = BEST_PRACTICES[id]
  if (!b) throw new Error(`Boa prática fora da tabela: ${id}`)
  return b
}

/** Ordem de ataque do plano de melhoria: riscos altos primeiro, depois médios e baixos. */
export function improvementOrder(ids: string[]): string[] {
  const rank: Record<Risk, number> = { high: 0, medium: 1, low: 2 }
  return [...ids].sort((a, b) => rank[bestPractice(a).risk] - rank[bestPractice(b).risk])
}
