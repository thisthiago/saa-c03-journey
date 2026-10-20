/**
 * Fase 6 — Auto Scaling. Políticas, o dia inteiro de uma loja num gráfico,
 * término, saúde das instâncias e a sobrevivência à perda de uma AZ.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { ScalingLabConfig } from '../../../../../simulators/scaling/lab'
import { businessDay, simulateDay, STEPS_PER_DAY, type DayScenario, type ScalingSetup } from '../../../../../simulators/scaling/model'
import type { ZonesTopology } from '../../../../../simulators/zones/model'
import { META } from '../meta'

const LOJA: DayScenario = { demand: businessDay({ base: 300, peak: 2400, from: 9, to: 21, rampMin: 60 }), capacityPerInstance: 150, type: 'm7g.large', warmupMin: 10 }
const LOJA_SOLUTION: ScalingSetup = { min: 3, max: 30, desired: 3, policy: 'target-tracking', target: 0.7 }

/** Black Friday: às 10h a promoção abre e a demanda salta em 15 minutos. */
const BF: DayScenario = {
  demand: Array.from({ length: STEPS_PER_DAY }, (_, t) => {
    const min = t * 5
    if (min < 600) return 600
    if (min < 615) return Math.round(600 + ((4500 - 600) * (min - 600)) / 15)
    if (min < 960) return 4500
    return 1500
  }),
  capacityPerInstance: 150,
  type: 'm7g.large',
  warmupMin: 10,
}
const BF_SOLUTION: ScalingSetup = { min: 4, max: 45, desired: 4, policy: 'target-tracking', target: 0.7, scheduled: [{ hour: 9, min: 32 }, { hour: 16, min: 4 }] }

/** Orçamento: o custo da solução de referência com 15% de folga, arredondado para cima de 10 em 10. */
const budget = (sc: DayScenario, s: ScalingSetup) => Math.ceil((simulateDay(sc, s).monthlyCost * 1.15) / 10) * 10

const LOJA_LAB: ScalingLabConfig = {
  scenario: LOJA,
  maxUnmetPct: 0.01,
  maxMonthlyCost: budget(LOJA, LOJA_SOLUTION),
  policies: ['none', 'target-tracking', 'step', 'simple'],
  allowScheduled: true,
  allowPredictive: false,
  initial: { min: 3, max: 30, desired: 3, policy: 'none' },
  solution: LOJA_SOLUTION,
  concepts: { demand: ['asg.target-tracking', 'asg.group'], cost: ['asg.group'] },
}

const BF_LAB: ScalingLabConfig = {
  scenario: BF,
  maxUnmetPct: 0.003,
  maxMonthlyCost: budget(BF, BF_SOLUTION),
  policies: ['none', 'target-tracking', 'step', 'simple'],
  allowScheduled: true,
  allowPredictive: true,
  initial: { min: 4, max: 45, desired: 4, policy: 'target-tracking', target: 0.7 },
  solution: BF_SOLUTION,
  concepts: { demand: ['asg.scheduled-predictive', 'asg.target-tracking'], cost: ['asg.group'] },
}

const ZONES_INITIAL: ZonesTopology = {
  azs: ['a', 'b', 'c'],
  required: 6,
  instances: { 'web-1': 'a', 'web-2': 'a', 'web-3': 'a', 'web-4': 'a', 'web-5': 'a', 'web-6': 'a', 'web-7': undefined, 'web-8': undefined, 'web-9': undefined },
  albAzs: ['a', 'b'],
  nat: { mode: 'regional' },
  needsInternet: false,
  db: { mode: 'multi-az', primary: 'a', standby: 'b' },
}
const ZONES_SOLUTION: ZonesTopology = {
  ...ZONES_INITIAL,
  instances: Object.fromEntries(Object.keys(ZONES_INITIAL.instances).map((id, i) => [id, ['a', 'b', 'c'][i % 3]])),
  albAzs: ['a', 'b', 'c'],
}

const COUNT_OPTIONS = (ns: number[]) => ns.map((n) => ({ id: `n${n}`, text: `${n} instâncias`, outcome: String(n) }))

export const F06_CMP: PhaseDef = {
  ...META.f06,
  concepts: ['asg.group', 'asg.target-tracking', 'asg.step-simple', 'asg.multi-policies', 'asg.scheduled-predictive', 'asg.health-checks', 'asg.termination', 'asg.lifecycle-hooks', 'asg.mixed-instances', 'infra.multi-az', 'infra.static-stability', 'infra.alb-zones'],
  availability: 'available',
  simplifications: [
    'O dia da loja é simulado em passos de 5 minutos. Cada instância atende a uma quantidade fixa de requisições, e o tempo até entrar em serviço é uma premissa do cenário.',
    'O predictive usa como previsão a curva do dia anterior, igual à de hoje. Na AWS, a previsão vem do histórico de uso.',
    'Custos pelo preço On-Demand da m7g.large na tabela da trilha.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f06.m1',
      title: 'Os números do grupo',
      type: 'mission',
      summary: 'Min, max, capacidade desejada e como cada política decide quanto crescer.',
      briefing: {
        company: 'Farmácia Saúde Já',
        role: 'Você cuida da infraestrutura de uma rede de farmácias com loja virtual.',
        situation: 'A loja tem um grupo do Auto Scaling com quatro instâncias fixas desde o lançamento. O time quer políticas de escalonamento, mas está em dúvida sobre qual usar e o que acontece quando duas disparam juntas.',
        objective: 'Prever a capacidade que o grupo escolhe em cada situação.',
        successCriteria: ['Prever o resultado do target tracking', 'Respeitar min e max', 'Saber qual política vence quando duas disparam'],
      },
      intel: [
        { conceptId: 'asg.group', visual: 'asg-loop', body: ['O **grupo** tem **mínimo**, **máximo** e **capacidade desejada**, e lança as instâncias a partir de um **launch template**. Nenhuma política leva o grupo para fora do intervalo entre min e max.'] },
        { conceptId: 'asg.target-tracking', body: ['**Target tracking**: você escolhe uma métrica e um alvo (ex.: 60% de CPU), e o grupo se ajusta como um termostato. É a política que a AWS recomenda.'] },
        { conceptId: 'asg.step-simple', body: ['**Step**: degraus conforme o tamanho da violação do alarme. **Simple**: um ajuste e espera o **cooldown** (300 s por padrão). A AWS desaconselha o simple.'] },
        { conceptId: 'asg.multi-policies', body: ['Com várias políticas disparando juntas, vence a que deixa **mais capacidade**, para crescer e para encolher.'] },
      ],
      activities: [
        {
          id: 'cmp.f06.m1.a1',
          kind: 'predict',
          title: 'O termostato',
          prompt: 'O grupo tem **4 instâncias** com CPU média de **90%** e uma política de target tracking com alvo de **60%**. O max é 20. Quantas instâncias o grupo quer?',
          concepts: [{ id: 'asg.target-tracking' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para a CPU cair de 90% para 60%, a capacidade sobe na mesma proporção: 4 × 90 ÷ 60 = 6.'],
          spec: { sim: 'scaling', group: { current: 4, min: 2, max: 20 }, utilization: 0.9, policies: [{ kind: 'target-tracking', target: 0.6 }] },
          options: COUNT_OPTIONS([5, 6, 8, 20]),
        },
        {
          id: 'cmp.f06.m1.a2',
          kind: 'predict',
          title: 'Batendo no teto',
          prompt: 'O grupo tem **2 instâncias**, max **3**, e uma política que soma **3 instâncias** quando o alarme dispara. O alarme disparou. Com quantas instâncias o grupo fica?',
          concepts: [{ id: 'asg.group' }],
          xp: 30,
          difficulty: 1,
          explanation: ['Exemplo da documentação: o grupo soma só 1 instância, para não passar do max de 3.'],
          spec: { sim: 'scaling', group: { current: 2, min: 1, max: 3 }, utilization: 0.95, policies: [{ kind: 'change', add: 3 }] },
          options: COUNT_OPTIONS([2, 3, 5]),
        },
        {
          id: 'cmp.f06.m1.a3',
          kind: 'predict',
          title: 'Duas políticas ao mesmo tempo',
          prompt: 'O grupo tem **8 instâncias**. De madrugada, uma política quer **remover 3** e outra quer **remover 2** (25%). Com quantas instâncias o grupo fica?',
          concepts: [{ id: 'asg.multi-policies' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Vence a política que deixa mais capacidade, também ao encolher: o grupo remove 2 e fica com 6. Assim ele nunca remove instâncias demais.'],
          spec: { sim: 'scaling', group: { current: 8, min: 2, max: 20 }, utilization: 0.15, policies: [{ kind: 'change', add: -3 }, { kind: 'change', add: -2 }] },
          options: COUNT_OPTIONS([3, 5, 6]),
        },
        {
          id: 'cmp.f06.m1.a4',
          kind: 'classify',
          title: 'Que tipo de escalonamento?',
          prompt: 'Classifique cada necessidade no tipo de escalonamento que melhor a atende.',
          concepts: [{ id: 'asg.scheduled-predictive' }, { id: 'asg.target-tracking', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Manter uma métrica num valor: target tracking. Horário conhecido de antemão: scheduled. Padrão diário ou semanal e aplicação que demora a iniciar: predictive.'],
          bins: [
            { id: 'tt', label: 'Target tracking' },
            { id: 'sched', label: 'Scheduled' },
            { id: 'pred', label: 'Predictive' },
          ],
          items: [
            { id: 'cpu', text: 'Manter a CPU média perto de 50% o tempo todo', bin: 'tt', explanation: 'Uma métrica e um alvo: target tracking.', concepts: ['asg.target-tracking'] },
            { id: 'promo', text: 'Ter 30 instâncias prontas às 10h da próxima sexta, quando a promoção abre', bin: 'sched', explanation: 'Data e hora conhecidas: ação agendada.', concepts: ['asg.scheduled-predictive'] },
            { id: 'weekly', text: 'O tráfego sobe toda manhã de dia útil e a aplicação leva 10 minutos para iniciar', bin: 'pred', explanation: 'Padrão recorrente e inicialização lenta: o predictive sobe a capacidade antes.', concepts: ['asg.scheduled-predictive'] },
            { id: 'req', text: 'Manter cerca de 1.000 requisições por instância', bin: 'tt', explanation: 'Requisições por alvo é uma das métricas recomendadas para target tracking.', concepts: ['asg.target-tracking'] },
          ],
        },
        {
          id: 'cmp.f06.m1.a5',
          kind: 'decision',
          title: 'O grupo que demora a reagir',
          prompt: 'Outro grupo da farmácia usa **simple scaling** com o cooldown padrão. No pico, ele soma 2 instâncias e depois fica 5 minutos sem reagir, mesmo com a CPU ainda alta. O que a AWS recomenda?',
          concepts: [{ id: 'asg.step-simple' }],
          xp: 30,
          difficulty: 2,
          explanation: ['O simple scaling espera o cooldown (300 s por padrão) entre atividades. Target tracking e step scaling não esperam cooldown: usam o warmup de cada instância nova. A AWS recomenda target tracking e desaconselha o simple scaling.'],
          options: [
            { id: 'a', text: 'Trocar por target tracking, que reage sem esperar o cooldown', correct: true, consequence: 'O grupo acompanha a métrica de forma proporcional, sem pausas de 5 minutos.' },
            { id: 'b', text: 'Aumentar o cooldown para 15 minutos', correct: false, consequence: 'O grupo ficaria ainda mais tempo sem reagir.' },
            { id: 'c', text: 'Diminuir o max do grupo', correct: false, consequence: 'Limita o crescimento justamente no pico.' },
          ],
        },
      ],
      debrief: { takeaways: ['Target tracking é proporcional à métrica.', 'Nada passa do max nem fica abaixo do min.', 'Com várias políticas, vence a que deixa mais capacidade.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f06.m2',
      title: 'Um dia de loja',
      type: 'mission',
      summary: 'Configure o grupo e veja o dia inteiro: demanda, capacidade e custo.',
      briefing: {
        company: 'Farmácia Saúde Já',
        role: 'Você continua na infraestrutura da farmácia.',
        situation: 'De madrugada, a loja recebe 300 requisições por segundo; das 10h às 20h, 2.400. Com 4 instâncias fixas, o site cai todo dia às 10h. Com 17 fixas, não cai, mas a diretoria acha caro.',
        objective: 'Atender ao dia inteiro dentro do orçamento.',
        successCriteria: ['No máximo 1% da demanda sem atendimento', 'Custo dentro do orçamento'],
      },
      intel: [
        { conceptId: 'asg.target-tracking', body: ['Com target tracking, o grupo cresce quando o uso passa do alvo e encolhe quando cai. Um alvo mais baixo deixa folga para a rampa; um mais alto economiza.'] },
        { conceptId: 'asg.scheduled-predictive', body: ['Uma **ação agendada** muda min ou capacidade desejada num horário. Quando o horário do pico é conhecido, ela sobe o grupo antes da demanda chegar.'] },
      ],
      activities: [
        {
          id: 'cmp.f06.m2.a1',
          kind: 'lab',
          lab: 'scaling',
          title: 'O grupo da loja',
          prompt: 'Configure o grupo e acompanhe o dia no gráfico. O objetivo é atender à demanda dentro do orçamento.',
          concepts: [{ id: 'asg.target-tracking' }, { id: 'asg.group', weight: 0.5 }, { id: 'asg.scheduled-predictive', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          hints: ['Capacidade fixa ou é pouca de dia ou é cara de madrugada.', 'Um target tracking com alvo de 70% e max alto o bastante acompanha o pico; ações agendadas também resolvem.'],
          explanation: ['Uma solução: min 3, max 30, target tracking com alvo de 70%. Outra: ações agendadas que sobem o grupo antes das 10h e descem depois das 20h. A capacidade fixa não cabe no orçamento.'],
          config: LOJA_LAB,
        },
      ],
      debrief: { takeaways: ['O Auto Scaling troca capacidade fixa por capacidade que acompanha a demanda.', 'O max precisa permitir o pico.', 'Horário conhecido combina com ação agendada.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f06.m3',
      title: 'Saúde, término e zonas',
      type: 'mission',
      summary: 'Quem sai quando o grupo encolhe, como instâncias doentes são trocadas e o grupo em três AZs.',
      briefing: {
        company: 'Farmácia Saúde Já',
        role: 'Você continua na infraestrutura da farmácia.',
        situation: 'Ontem, uma instância travou a aplicação, mas continuou "ligada" e recebendo clientes. Além disso, todas as instâncias ficaram em duas AZs, e a diretoria quer saber o que acontece se uma cair.',
        objective: 'Fazer o grupo trocar instâncias doentes e sobreviver à perda de uma AZ.',
        successCriteria: ['Prever quem sai primeiro no scale-in', 'Ligar o health check certo', 'Distribuir o grupo entre AZs'],
      },
      intel: [
        { conceptId: 'asg.health-checks', body: ['Por padrão, o grupo olha só os **status checks do EC2**. Com o **health check do ELB** ligado, uma aplicação que não responde ao balanceador também conta como doente, e a instância é substituída.'] },
        { conceptId: 'asg.termination', body: ['Ao encolher, o grupo primeiro **equilibra as AZs**. Depois, a política padrão tira quem usa a configuração mais antiga e, por fim, quem está mais perto da próxima hora de cobrança.'] },
        { conceptId: 'asg.lifecycle-hooks', body: ['Um **lifecycle hook** pausa a instância ao entrar ou sair (1 hora por padrão): instalar software antes de receber tráfego, copiar logs antes de encerrar. O **warm pool** mantém instâncias já preparadas, paradas, para aplicações que demoram a iniciar.'] },
        { conceptId: 'infra.static-stability', body: ['**Static stability**: deixe capacidade suficiente para perder uma AZ sem depender de lançar instâncias na hora da falha.'] },
      ],
      activities: [
        {
          id: 'cmp.f06.m3.a1',
          kind: 'predict',
          title: 'Quem sai primeiro?',
          prompt: 'O grupo vai encolher uma instância. O launch template atual é **loja**, versão **3**. Qual instância a política de término padrão escolhe?',
          concepts: [{ id: 'asg.termination' }],
          xp: 40,
          difficulty: 3,
          explanation: ['A AZ a tem 3 instâncias e a b tem 2: o término começa pela AZ a, para equilibrar. Dentro dela, sai a que usa a versão mais antiga do launch template.'],
          spec: {
            sim: 'asg-termination',
            template: 'loja',
            version: 3,
            instances: [
              { id: 'i-a1', az: 'a', config: 'loja@3', minutesToNextHour: 5 },
              { id: 'i-a2', az: 'a', config: 'loja@2', minutesToNextHour: 40 },
              { id: 'i-a3', az: 'a', config: 'loja@3', minutesToNextHour: 20 },
              { id: 'i-b1', az: 'b', config: 'loja@1', minutesToNextHour: 10 },
              { id: 'i-b2', az: 'b', config: 'loja@3', minutesToNextHour: 30 },
            ],
          },
          options: [
            { id: 'a1', text: 'i-a1 (AZ a, versão 3, perto da hora de cobrança)', outcome: 'i-a1' },
            { id: 'a2', text: 'i-a2 (AZ a, versão 2)', outcome: 'i-a2' },
            { id: 'b1', text: 'i-b1 (AZ b, versão 1, a mais antiga do grupo)', outcome: 'i-b1' },
            { id: 'b2', text: 'i-b2 (AZ b, versão 3)', outcome: 'i-b2' },
          ],
        },
        {
          id: 'cmp.f06.m3.a2',
          kind: 'decision',
          title: 'A instância zumbi',
          prompt: 'Uma instância do grupo travou a aplicação: o ALB marca o alvo como doente, mas o grupo não troca a instância. O que falta?',
          concepts: [{ id: 'asg.health-checks' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Sem o health check do ELB no grupo, o Auto Scaling só olha os status checks do EC2, que continuam bons. Ligando o health check do ELB, o grupo substitui a instância que o balanceador marcou como doente.'],
          options: [
            { id: 'a', text: 'Ligar o health check do ELB no grupo do Auto Scaling', correct: true, consequence: 'A instância que o ALB marca como doente passa a ser substituída.' },
            { id: 'b', text: 'Diminuir o intervalo do health check do ALB', correct: false, consequence: 'O ALB já sabe que o alvo está doente; o grupo é que não está olhando para isso.' },
            { id: 'c', text: 'Aumentar o max do grupo', correct: false, consequence: 'Mais instâncias não tiram a instância travada do grupo.' },
          ],
        },
        {
          id: 'cmp.f06.m3.a3',
          kind: 'lab',
          lab: 'zones',
          title: 'O grupo em três AZs',
          prompt: 'O site precisa de 6 instâncias atendendo mesmo se uma AZ cair. Redistribua as instâncias do grupo e as AZs do ALB, com no máximo 9 instâncias.',
          concepts: [{ id: 'infra.multi-az' }, { id: 'infra.static-stability', weight: 0.5 }, { id: 'infra.alb-zones', weight: 0.5 }],
          xp: 100,
          difficulty: 2,
          explanation: ['Com 3 instâncias em cada uma das três AZs e o ALB habilitado nas três, perder qualquer AZ deixa 6 instâncias atendendo. É o que o Auto Scaling faz ao equilibrar o grupo entre as AZs.'],
          config: {
            initial: ZONES_INITIAL,
            solution: ZONES_SOLUTION,
            lockDb: true,
            natModes: ['regional'],
            goals: [
              { kind: 'valid', concepts: ['infra.alb-zones'] },
              { kind: 'normal-ok', concepts: ['infra.alb-zones'] },
              { kind: 'survive-az', concepts: ['infra.multi-az'] },
              { kind: 'full-capacity', concepts: ['infra.static-stability'] },
              { kind: 'max-instances', max: 9, concepts: ['infra.static-stability'] },
            ],
          },
        },
        {
          id: 'cmp.f06.m3.a4',
          kind: 'decision',
          title: 'Pronta antes de receber clientes',
          prompt: 'Cada instância nova baixa 2 GB de catálogo antes de poder atender. Hoje, ela começa a receber clientes antes de terminar e devolve erros. Qual recurso resolve?',
          concepts: [{ id: 'asg.lifecycle-hooks' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Um lifecycle hook de launch deixa a instância em espera até o script terminar e chamar complete-lifecycle-action; só então ela entra em serviço e é registrada no balanceador.'],
          options: [
            { id: 'a', text: 'Um lifecycle hook de launch, liberado quando o download termina', correct: true, consequence: 'A instância só recebe clientes depois de pronta.' },
            { id: 'b', text: 'Um cooldown maior', correct: false, consequence: 'O cooldown só atrasa novas atividades de simple scaling; não segura a instância fora do balanceador.' },
            { id: 'c', text: 'Uma política de término OldestInstance', correct: false, consequence: 'Muda quem sai no scale-in, não quando a instância entra.' },
          ],
        },
      ],
      debrief: { takeaways: ['Ligue o health check do ELB no grupo.', 'O scale-in equilibra as AZs antes de qualquer outro critério.', 'Lifecycle hook segura a instância até ela ficar pronta.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f06.boss',
      title: 'Black Friday',
      type: 'boss',
      summary: 'A promoção abre às 10h e a demanda salta em 15 minutos. O target tracking sozinho não chega a tempo.',
      briefing: {
        company: 'Loja Mundo Gamer',
        role: 'Você foi chamado por uma loja de games na semana da Black Friday.',
        situation: 'Às 10h, a promoção abre e a demanda vai de 600 para 4.500 requisições por segundo em 15 minutos. No ano passado, o target tracking subiu o grupo, mas as instâncias novas levaram 10 minutos para atender e os primeiros clientes viram erro.',
        objective: 'Ter capacidade no momento da abertura, sem pagar o pico o dia inteiro.',
        successCriteria: ['No máximo 0,3% da demanda sem atendimento', 'Custo dentro do orçamento'],
      },
      intel: [
        { conceptId: 'asg.scheduled-predictive', body: ['Quando a hora do pico é conhecida, uma **ação agendada** sobe o mínimo antes. O **predictive** aprende padrões repetidos e sobe a capacidade antes da demanda prevista.'] },
        { conceptId: 'asg.mixed-instances', body: ['Um grupo pode misturar tipos e **On-Demand com Spot**. Para o Spot, a estratégia recomendada é **price-capacity-optimized**.'] },
      ],
      activities: [
        {
          id: 'cmp.f06.boss.a1',
          kind: 'lab',
          lab: 'scaling',
          title: 'A abertura da promoção',
          prompt: 'Configure o grupo para a abertura das 10h. O gráfico mostra o dia inteiro.',
          concepts: [{ id: 'asg.scheduled-predictive' }, { id: 'asg.target-tracking', weight: 0.5 }],
          xp: 130,
          difficulty: 3,
          hints: ['O warmup é de 10 minutos e a rampa dura 15: o grupo precisa crescer antes das 10h.', 'Uma ação agendada às 9h com um mínimo alto e outra depois do pico para baixar o mínimo.'],
          explanation: ['Uma solução: target tracking com alvo de 70%, ação agendada às 9h com mínimo de 32 e outra às 16h voltando o mínimo para 4. O predictive também ajuda, mas aqui a ação agendada é a garantia para uma data conhecida.'],
          config: BF_LAB,
        },
        {
          id: 'cmp.f06.boss.a2',
          kind: 'decision',
          title: 'Spot no grupo da loja?',
          prompt: 'Para baratear a Black Friday, alguém sugeriu colocar todo o grupo em Spot com a estratégia lowest-price. A loja guarda a sessão num cache fora das instâncias. O que você recomenda?',
          concepts: [{ id: 'asg.mixed-instances' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Um grupo misto com uma base On-Demand e o excedente em Spot reduz o custo sem apostar a loja inteira em capacidade que pode ser interrompida. A AWS recomenda price-capacity-optimized e desaconselha lowest-price, que tem o maior risco de interrupção. Vários tipos de instância ampliam os pools disponíveis.'],
          options: [
            { id: 'a', text: 'Grupo misto: base On-Demand e o excedente em Spot com price-capacity-optimized e vários tipos de instância', correct: true, consequence: 'Interrupções afetam só parte do excedente, e o desconto vem onde a carga aguenta.' },
            { id: 'b', text: 'Todo o grupo em Spot com lowest-price', correct: false, consequence: 'É a estratégia com maior risco de interrupção, justamente no dia mais importante.' },
            { id: 'c', text: 'Nada de Spot: um Savings Plan de 3 anos para 45 instâncias', correct: false, consequence: 'Pagaria o pico de um dia por três anos.' },
          ],
        },
      ],
      debrief: { takeaways: ['Escalonamento reativo atrasa o warmup: pico com hora marcada pede ação agendada.', 'Depois do pico, baixe o mínimo de novo.', 'Spot no excedente, com price-capacity-optimized e vários tipos.'] },
    },
  ],
}
