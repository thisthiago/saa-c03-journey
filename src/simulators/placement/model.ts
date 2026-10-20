/**
 * Escolha da infraestrutura: qual opção da infraestrutura global atende ao
 * requisito dominante de cada cenário (ou componente).
 *
 * Fatos conferidos em 18/10/2026:
 * - Regiões e AZs: https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/regions.html
 * - Local Zones: https://docs.aws.amazon.com/local-zones/latest/ug/how-local-zones-work.html
 * - Wavelength: https://docs.aws.amazon.com/wavelength/latest/developerguide/how-wavelengths-work.html
 * - Outposts: https://docs.aws.amazon.com/outposts/latest/userguide/what-is-outposts.html
 * - CloudFront: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/HowCloudFrontWorks.html
 * - Global Accelerator: https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html
 *
 * O "custo relativo" é julgamento de arquitetura do AWS Quest (ordem de
 * grandeza do esforço e do gasto), não um preço da AWS.
 */

export type PlacementOption = 'single-az' | 'multi-az' | 'multi-region' | 'local-zone' | 'wavelength' | 'outposts' | 'cloudfront' | 'global-accelerator'

export type Need =
  | 'ha-az'
  | 'dr-region'
  | 'metro-latency'
  | 'mobile-5g'
  | 'on-premises'
  | 'static-cache'
  | 'global-dynamic'
  | 'full-services'

export const NEED_LABEL: Record<Need, string> = {
  'ha-az': 'continuar no ar se uma AZ falhar',
  'dr-region': 'recuperar-se da perda de uma Região inteira',
  'metro-latency': 'latência de um dígito de ms para usuários de uma metrópole longe da Região',
  'mobile-5g': 'latência ultrabaixa para dispositivos na rede 5G de uma operadora',
  'on-premises': 'processar os dados dentro das instalações do cliente',
  'static-cache': 'entregar conteúdo estático em cache perto de usuários espalhados',
  'global-dynamic': 'tráfego dinâmico TCP/UDP global, com IPs fixos e failover entre Regiões',
  'full-services': 'usar a gama completa de serviços gerenciados',
}

export interface OptionInfo {
  name: string
  summary: string
  meets: Need[]
  /** Fatos verificados que justificam o que a opção atende ou não. */
  facts: string[]
  limits: string[]
  /** 1 (mais simples/barato) a 4 — julgamento de arquitetura. */
  relativeCost: number
}

export const OPTIONS: Record<PlacementOption, OptionInfo> = {
  'single-az': {
    name: 'Região, uma única AZ',
    summary: 'Tudo numa só Zona de Disponibilidade.',
    meets: ['full-services'],
    facts: ['Uma AZ é um ou mais data centers com energia e rede próprias; recursos zonais falham junto com a sua AZ.'],
    limits: ['A falha da AZ derruba tudo.'],
    relativeCost: 1,
  },
  'multi-az': {
    name: 'Região com várias AZs',
    summary: 'Componentes redundantes em duas ou mais AZs da mesma Região.',
    meets: ['ha-az', 'full-services'],
    facts: ['As AZs de uma Região são isoladas entre si, mas próximas o bastante para replicação síncrona.', 'O SLA regional do EC2 (99,99%) vale para instâncias em duas ou mais AZs.'],
    limits: ['Não protege contra a falha da Região inteira.'],
    relativeCost: 2,
  },
  'multi-region': {
    name: 'Multi-Região (DR)',
    summary: 'Uma segunda Região com cópia dos dados e capacidade de assumir.',
    meets: ['ha-az', 'dr-region', 'full-services'],
    facts: ['Regiões são isoladas; recursos não existem em outra Região sem replicação ou cópia explícita.'],
    limits: ['Mais caro e mais complexo: replicação, failover e testes de DR.'],
    relativeCost: 4,
  },
  'local-zone': {
    name: 'AWS Local Zone',
    summary: 'Extensão da Região perto de um grande centro urbano.',
    meets: ['metro-latency'],
    facts: ['Fica perto de centros populacionais e industriais; precisa ser habilitada; subnets da VPC se estendem até ela.', 'Tem conexão própria com a internet e suporta Direct Connect.'],
    limits: ['Oferece só um subconjunto dos serviços; os planos de controle ficam na Região-mãe.'],
    relativeCost: 2,
  },
  wavelength: {
    name: 'AWS Wavelength Zone',
    summary: 'Infraestrutura AWS dentro da rede 5G de uma operadora.',
    meets: ['mobile-5g'],
    facts: ['Fica na borda da rede da operadora; o tráfego dos dispositivos móveis chega pelo carrier gateway.', 'Não há conexão de entrada vinda da internet pelo carrier gateway.'],
    limits: ['Atende dispositivos na rede da operadora parceira; não é outra Região nem serve usuários de banda larga fixa em geral.'],
    relativeCost: 3,
  },
  outposts: {
    name: 'AWS Outposts',
    summary: 'Racks ou servidores da AWS instalados no local do cliente.',
    meets: ['on-premises'],
    facts: ['A AWS opera o hardware como parte de uma Região; o Outpost depende do service link com a Região.', 'Sem o service link, as instâncias continuam rodando, mas operações de controle (iniciar/parar) falham.'],
    limits: ['O cliente fornece o espaço, a energia, a rede e responde pela segurança física do local. Não é uma Região privada.'],
    relativeCost: 4,
  },
  cloudfront: {
    name: 'Amazon CloudFront (borda)',
    summary: 'CDN com cache nos POPs (edge locations) e nos Regional Edge Caches.',
    meets: ['static-cache'],
    facts: ['O usuário é atendido pelo POP de menor latência; o objeto em cache volta dali, sem ir à origem.'],
    limits: ['Não executa a aplicação nem guarda os dados de origem; a origem continua numa Região.'],
    relativeCost: 1,
  },
  'global-accelerator': {
    name: 'AWS Global Accelerator',
    summary: 'IPs estáticos anycast que levam o tráfego pela rede global da AWS até endpoints regionais.',
    meets: ['global-dynamic'],
    facts: ['Dois IPs estáticos anycast; direciona ao endpoint saudável mais adequado, inclusive em outra Região.', 'Não faz cache de conteúdo.'],
    limits: ['Não substitui o cache de uma CDN para conteúdo estático.'],
    relativeCost: 2,
  },
}

export interface PlacementItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: Need
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: Need[]
  concepts?: string[]
}

export function unmetNeeds(item: PlacementItem, opt: PlacementOption): Need[] {
  return item.needs.filter((n) => !OPTIONS[opt].meets.includes(n))
}

/** Melhor opção: atende a todos os requisitos com o menor custo relativo. Lança erro se não for única. */
export function bestOption(item: PlacementItem, options: PlacementOption[]): PlacementOption {
  const ok = options.filter((o) => unmetNeeds(item, o).length === 0).sort((a, b) => OPTIONS[a].relativeCost - OPTIONS[b].relativeCost)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && OPTIONS[ok[1]].relativeCost === OPTIONS[ok[0]].relativeCost) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export interface PlacementVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message: string
}

export function judgePlacement(item: PlacementItem, pick: PlacementOption | undefined, options: PlacementOption[]): PlacementVerdict {
  const best = bestOption(item, options)
  const bestName = OPTIONS[best].name
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito dominante é ${NEED_LABEL[item.dominant]}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito dominante é ${NEED_LABEL[item.dominant]}. ${OPTIONS[best].facts[0]}` }
  const missing = unmetNeeds(item, pick)
  if (missing.length === 0) {
    return { score: 0.5, status: 'partial', message: `Funciona, mas é mais do que o cenário pede: ${OPTIONS[pick].limits[0]} ${bestName} atende aos mesmos requisitos com menos custo e complexidade.` }
  }
  return { score: 0, status: 'wrong', message: `${OPTIONS[pick].name} não atende: ${missing.map((n) => NEED_LABEL[n]).join('; ')}. ${OPTIONS[pick].limits[0]} A opção adequada é ${bestName}.` }
}
