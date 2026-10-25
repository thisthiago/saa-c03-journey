/**
 * Conceitos da Fase 2 — AWS Support Plans.
 * Fatos conferidos em 18/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'

const PLANS = { title: 'AWS Support Plans', url: 'https://docs.aws.amazon.com/awssupport/latest/user/aws-support-plans.html' }
const CASES = { title: 'Case management — choosing a severity', url: 'https://docs.aws.amazon.com/awssupport/latest/user/case-management.html' }
const EOS = { title: 'Developer, Business, and Enterprise On-Ramp end of support', url: 'https://docs.aws.amazon.com/awssupport/latest/user/support-plans-eos.html' }
const TA = { title: 'AWS Trusted Advisor', url: 'https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html' }
const UO = { title: 'What is AWS Unified Operations', url: 'https://docs.aws.amazon.com/awssupport/latest/user/unified-operations-intro.html' }
const PRICING = { title: 'AWS Support Plan Pricing', url: 'https://aws.amazon.com/premiumsupport/pricing/' }
const COMPARE = { title: 'Compare AWS Support Plans', url: 'https://aws.amazon.com/premiumsupport/plans/' }
const FAQ = { title: 'AWS Support FAQs', url: 'https://aws.amazon.com/premiumsupport/faqs/' }
const EC2_SLA = { title: 'Amazon Compute Service Level Agreement', url: 'https://aws.amazon.com/compute/sla/' }
const CLF = { title: 'AWS Certified Cloud Practitioner (CLF-C02) — Domain 4', url: 'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html' }

const EXAM_NOTE = 'O guia do SAA-C03 não lista planos de suporte; o tema é cobrado no Cloud Practitioner (CLF-C02, tarefa 4.3), que já cita Business Support+, Enterprise Support e Unified Operations.'
const exam = { domains: [], relevance: 'baixa', notes: EXAM_NOTE } as ConceptDef['exam']

export const F02_FOUNDATIONS_CONCEPTS: ConceptDef[] = [
  {
    id: 'support.plans',
    title: 'Planos do AWS Support',
    officialName: 'AWS Support Plans',
    serviceIds: ['aws.support'],
    summary: 'Em 18/10/2026, os planos vigentes eram **Basic**, **Business Support+**, **Enterprise Support** e **Unified Operations**. Eles diferem em casos técnicos, tempos de primeira resposta, orientação especializada e preço — o adequado é o que cobre as necessidades do negócio, não o mais caro.',
    explanation: [
      'Os planos se diferenciam pelo tipo de ajuda e pela rapidez. O Basic cobre conta, cobrança e cotas, sem casos técnicos. O Business Support+ abre casos técnicos a qualquer hora, com engajamento em menos de 30 minutos para sistema crítico fora do ar. O Enterprise Support acrescenta um TAM designado e resposta em até 15 minutos. O Unified Operations coloca especialistas da AWS acompanhando a operação, com resposta de 5 minutos.',
      'Exemplo: uma startup com um ambiente de testes não precisa de suporte técnico 24/7, e o Basic basta. Quando a mesma empresa coloca em produção um sistema que gera receita, um plano pago passa a valer pelo tempo de resposta em incidentes.',
      '**Regra prática:** escolha pela criticidade da carga e pelo tipo de ajuda necessária, não pelo plano mais completo.',
    ],
    comparisons: [
      { with: 'support.sla-vs-support', text: 'O plano de suporte muda como a AWS responde aos seus casos; ele não muda o SLA de disponibilidade dos serviços.' },
    ],
    recommendations: [
      'Revise o plano quando uma carga entrar em produção ou ficar mais crítica.',
    ],
    exam,
    references: [PLANS, COMPARE, CLF],
    tags: ['fundamentos'],
  },
  {
    id: 'support.basic',
    title: 'Basic Support',
    officialName: 'AWS Basic Support',
    serviceIds: ['aws.support', 'aws.health'],
    summary: 'Incluído para todos os clientes: atendimento 24/7 de **conta e cobrança**, pedidos de **aumento de cota**, documentação, AWS re:Post e o AWS Health Dashboard. **Não permite abrir casos técnicos.**',
    commonMistakes: [
      'Achar que é preciso um plano pago para resolver questões de cobrança ou pedir aumento de cota.',
    ],
    facts: ['No Basic, o Trusted Advisor oferece todos os checks de Service Limits e alguns de Security e Fault tolerance, com atualização manual dos checks de segurança.'],
    exam,
    references: [PLANS, CASES, TA],
    tags: ['fundamentos'],
  },
  {
    id: 'support.business-plus',
    title: 'Business Support+',
    officialName: 'AWS Business Support+',
    serviceIds: ['aws.support'],
    summary: 'Suporte técnico 24/7 por telefone, web e chat, assistente com IA generativa, casos ilimitados, **todos os checks do Trusted Advisor**, AWS Support API e ajuda com software de terceiros. Sistema crítico fora do ar: **menos de 30 minutos** de engajamento humano.',
    facts: ['Mínimo de US$ 29 por mês por conta, ou percentual do gasto (9% até US$ 10 mil; 7% até 80 mil; 5% até 250 mil; 3% acima), o que for maior — conferido em 18/10/2026.'],
    limitations: ['Não inclui TAM designado.'],
    exam,
    references: [PLANS, PRICING],
    tags: ['fundamentos'],
  },
  {
    id: 'support.enterprise',
    title: 'Enterprise Support',
    officialName: 'AWS Enterprise Support',
    serviceIds: ['aws.support'],
    summary: 'Tudo do Business Support+, mais **TAM designado**, resposta em **até 15 minutos** para sistema crítico, **AWS Security Incident Response**, revisões estratégicas e acesso ao AWS Countdown para eventos críticos.',
    facts: ['Mínimo de US$ 5 mil por mês (reduzido de US$ 15 mil), ou percentual do gasto (10% até US$ 150 mil; 7% até 500 mil; 5% até 1 milhão; 3% acima) — conferido em 18/10/2026.'],
    exam,
    references: [PLANS, PRICING, FAQ],
    tags: ['fundamentos'],
  },
  {
    id: 'support.unified-ops',
    title: 'Unified Operations',
    officialName: 'AWS Unified Operations',
    serviceIds: ['aws.support'],
    summary: 'Especialistas designados (TAM, Domain Specialist Engineers, Incident Management Engineers) atuando como extensão da equipe, com monitoramento 24/7 e resposta de **5 minutos** para incidentes críticos. Para as operações mais críticas.',
    facts: ['Mínimo de US$ 50 mil por mês, ou percentual do gasto (10% até US$ 1 milhão; 6% até 5 milhões; 5% acima) — conferido em 18/10/2026.', 'Inclui AWS Countdown Premium; compromisso mínimo de 90 dias.'],
    exam,
    references: [UO, PRICING],
    tags: ['fundamentos'],
  },
  {
    id: 'support.legacy',
    title: 'Planos antigos: Developer, Business e Enterprise On-Ramp',
    officialName: 'Developer, Business, and Enterprise On-Ramp end of support',
    serviceIds: ['aws.support'],
    summary: 'Developer e Business **não aceitam novas assinaturas desde 02/12/2025** e serão descontinuados em **01/01/2027** (a migração indicada é para o Business Support+). O **Enterprise On-Ramp** é suportado até 31/12/2026, com upgrade automático para o Enterprise Support ao longo de 2026.',
    facts: ['Os três planos antigos continuam disponíveis na Região AWS GovCloud (US).'],
    availability: {
      kind: 'no-new-customers',
      since: '02/12/2025',
      note: 'Developer e Business: sem novas assinaturas desde 02/12/2025; fim em 01/01/2027. Enterprise On-Ramp: fim em 01/01/2027, com upgrade automático para Enterprise.',
      alternatives: ['AWS Business Support+', 'AWS Enterprise Support'],
    },
    commonMistakes: ['Responder questões com base em materiais antigos que tratam Developer e Business como ofertas atuais.'],
    exam: { domains: [], relevance: 'baixa', notes: 'Materiais de estudo anteriores a dezembro de 2025 citam Developer, Business e Enterprise On-Ramp como planos atuais.' },
    references: [EOS, FAQ],
    tags: ['fundamentos'],
  },
  {
    id: 'support.case-types',
    title: 'Tipos de caso',
    officialName: 'AWS Support case types',
    serviceIds: ['aws.support'],
    summary: 'Três tipos: **conta e cobrança** e **aumento de cota** (para todos os clientes) e **técnico** (só em planos pagos). Questões de conta e cobrança não exigem plano pago.',
    exam,
    references: [CASES],
    tags: ['fundamentos'],
  },
  {
    id: 'support.severity',
    title: 'Severidade de um caso',
    officialName: 'Support case severity levels',
    serviceIds: ['aws.support'],
    summary: 'Cinco níveis, do menor ao maior: **General guidance**, **System impaired**, **Production system impaired**, **Production system down** e **Business-critical system down**. A severidade descreve o impacto no negócio.',
    recommendations: ['Use a severidade mais alta só para o que não tem contorno ou afeta diretamente a produção.'],
    exam,
    references: [CASES],
    tags: ['fundamentos'],
  },
  {
    id: 'support.response-times',
    title: 'Tempos de primeira resposta',
    officialName: 'AWS Support response times',
    serviceIds: ['aws.support'],
    summary: 'Nos planos pagos: orientação geral 24 h; sistema prejudicado 12 h; produção prejudicada 4 h; produção fora do ar 1 h; sistema crítico fora do ar: menos de 30 min (Business Support+), menos de 15 min (Enterprise) e 5 min (Unified Operations). São tempos de **primeira resposta**, não de solução.',
    facts: ['A AWS se compromete a fazer "todo esforço razoável" para responder dentro desses tempos.'],
    exam,
    references: [CASES],
    tags: ['fundamentos'],
  },
  {
    id: 'support.tam',
    title: 'Technical Account Manager',
    officialName: 'Technical Account Manager (TAM)',
    serviceIds: ['aws.support'],
    summary: 'Especialista **designado** que dá orientação estratégica e proativa, conduz revisões Well-Architected e aciona especialistas da AWS. Está no **Enterprise Support** e no **Unified Operations**.',
    exam,
    references: [PLANS, FAQ],
    tags: ['fundamentos'],
  },
  {
    id: 'support.trusted-advisor',
    title: 'AWS Trusted Advisor por plano',
    officialName: 'AWS Trusted Advisor',
    serviceIds: ['aws.trusted-advisor', 'aws.support'],
    summary: 'Recomendações de custo, desempenho, segurança, tolerância a falhas e cotas. No **Basic**, só os checks de Service Limits e alguns de segurança e tolerância a falhas; nos planos pagos, **todos os checks** e a API. **Trusted Advisor Priority**: Enterprise e Unified Operations.',
    exam: { domains: ['d4'], relevance: 'baixa', notes: EXAM_NOTE },
    references: [TA],
    tags: ['fundamentos', 'custos'],
  },
  {
    id: 'support.sla-vs-support',
    title: 'SLA do serviço × plano de suporte',
    officialName: 'Service Level Agreements vs. AWS Support',
    serviceIds: ['aws.support', 'aws.ec2'],
    summary: 'O **SLA de cada serviço** define o compromisso de disponibilidade e os **créditos** se ele não for cumprido (exemplo: EC2 com 99,99% por Região para instâncias em duas ou mais AZs). O **plano de suporte** define como e em quanto tempo a AWS responde aos seus casos. Contratar um plano maior não aumenta a disponibilidade do serviço.',
    explanation: [
      'O SLA é o compromisso de disponibilidade de cada serviço, medido mês a mês. Se a AWS não o cumpre, o cliente pede créditos que abatem cobranças futuras; o SLA não impede a falha nem cobre o prejuízo do negócio. O plano de suporte é outra coisa: define quem atende seus casos e em quanto tempo.',
      'A disponibilidade que importa é a da sua arquitetura. O próprio SLA do EC2 mostra isso: 99,5% por instância, mas 99,99% por Região quando há instâncias em duas ou mais AZs. Quem sobe a disponibilidade é o desenho com redundância, não o contrato de suporte.',
      '**Regra prática:** para aumentar a disponibilidade, mude a arquitetura; para ter ajuda mais rápida num incidente, mude o plano de suporte.',
    ],
    comparisons: [
      { with: 'infra.multi-az', text: 'O SLA regional do EC2 só vale para instâncias em duas ou mais AZs: é a implantação em várias AZs que leva à disponibilidade maior.' },
    ],
    commonMistakes: [
      'Contratar um plano de suporte maior esperando que o serviço fique mais disponível.',
    ],
    facts: ['Créditos de SLA não são reembolso em dinheiro: abatem cobranças futuras e precisam ser pedidos por um caso no Support Center.'],
    exam: {
      domains: ['d2'],
      relevance: 'media',
      notes: 'Se uma alternativa propõe melhorar a disponibilidade contratando um plano de suporte, ela é um distrator: a resposta esperada é uma mudança de arquitetura, como várias AZs, failover ou réplicas.',
    },
    references: [EC2_SLA, CASES],
    tags: ['fundamentos', 'disponibilidade'],
  },
  {
    id: 'support.pricing',
    title: 'Quanto custa o suporte',
    officialName: 'AWS Support pricing',
    serviceIds: ['aws.support'],
    summary: 'Planos pagos cobram o **maior** entre um **mínimo mensal** e um **percentual do gasto com a AWS**, em faixas decrescentes. O custo cresce com o uso: um plano superdimensionado é desperdício recorrente.',
    facts: ['Exemplo oficial: com US$ 20 mil de gasto mensal, o Business Support+ custa US$ 1,6 mil (9% de 10 mil + 7% de 10 mil).'],
    exam: { domains: ['d4'], relevance: 'baixa', notes: EXAM_NOTE },
    references: [PRICING],
    tags: ['fundamentos', 'custos'],
    reviewItems: [
      {
        id: 'rv:support.pricing:minimo',
        kind: 'decision',
        title: 'Mínimo ou percentual?',
        prompt: 'Uma empresa gasta US$ 10 mil por mês com a AWS e contrata o **Enterprise Support** (mínimo de US$ 5 mil ou 10% até US$ 150 mil). Quanto paga de suporte?',
        concepts: [{ id: 'support.pricing' }],
        xp: 5,
        difficulty: 2,
        explanation: ['10% de US$ 10 mil = US$ 1 mil, abaixo do mínimo. Vale o maior: US$ 5 mil por mês.'],
        options: [
          { id: 'a', text: 'US$ 5 mil (o mínimo, que é maior que 10% do gasto)', correct: true, consequence: 'Para esse gasto, o suporte custa metade da conta da AWS: precisa haver necessidade real de TAM e resposta em 15 minutos.' },
          { id: 'b', text: 'US$ 1 mil (10% do gasto)', correct: false, consequence: 'O percentual fica abaixo do mínimo mensal; vale o maior dos dois.' },
          { id: 'c', text: 'US$ 15 mil', correct: false, consequence: 'Esse era o mínimo anterior; em 18/10/2026 o mínimo era US$ 5 mil.' },
        ],
      },
    ],
  },
]
