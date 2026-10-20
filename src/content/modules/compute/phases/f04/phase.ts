/**
 * Fase 4 — Opções de compra. On-Demand, Savings Plans, Reserved Instances,
 * Spot, Capacity Reservations e hardware dedicado, com os preços reais da
 * tabela da trilha.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { PurchaseLabConfig } from '../../../../../simulators/purchase/lab'
import type { PurchaseOption, Segment } from '../../../../../simulators/purchase/model'
import { OPTIONS } from '../../../../../simulators/purchase/model'
import { META } from '../meta'

const opts = (ids: PurchaseOption[]) => ids.map((id) => ({ id, text: OPTIONS[id].name, outcome: id }))

const PEAK: Segment = { id: 'peak', name: 'Pico do horário comercial', description: '', type: 'm7g.large', count: 6, hoursPerDay: 9, interruptible: false, horizonMonths: 48 }
const NIGHT: Segment = { id: 'night', name: 'Renderização noturna', description: '', type: 'c7g.xlarge', count: 10, hoursPerDay: 5, interruptible: true, horizonMonths: 48 }

const FATURA: PurchaseLabConfig = {
  options: ['on-demand', 'spot', 'compute-sp-1yr', 'compute-sp-3yr', 'ec2-sp-3yr', 'odcr'],
  segments: [
    { id: 'core', name: 'Núcleo da loja virtual', description: 'Servidores que atendem a loja 24 horas por dia há quatro anos, sem previsão de mudança.', type: 'm7g.large', count: 6, hoursPerDay: 24, interruptible: false, horizonMonths: 48, concepts: ['ec2.savings-plans', 'ec2.commitment-coverage'] },
    { id: 'peak', name: 'Reforço do horário comercial', description: 'Instâncias extras que sobem às 9h e descem às 19h, todos os dias.', type: 'm7g.large', count: 8, hoursPerDay: 10, interruptible: false, horizonMonths: 48, concepts: ['ec2.on-demand', 'ec2.commitment-coverage'] },
    { id: 'batch', name: 'Relatórios noturnos', description: 'Jobs que gravam o progresso a cada minuto e podem recomeçar de onde pararam.', type: 'c7g.xlarge', count: 10, hoursPerDay: 4, interruptible: true, horizonMonths: 48, concepts: ['ec2.spot'] },
    { id: 'api', name: 'API de catálogo', description: 'Roda 24 horas e vai virar contêineres no Fargate nos próximos meses; a empresa vai usá-la por pelo menos três anos.', type: 'm7i.large', count: 4, hoursPerDay: 24, interruptible: false, horizonMonths: 40, fargateMigration: true, concepts: ['ec2.savings-plans'] },
    { id: 'piloto', name: 'Piloto do aplicativo', description: 'Projeto experimental que roda 24 horas e será desligado ou reescrito em seis meses.', type: 't4g.medium', count: 3, hoursPerDay: 24, interruptible: false, horizonMonths: 6, concepts: ['ec2.on-demand'] },
    { id: 'evento', name: 'Capacidade da liquidação', description: 'Na liquidação anual, a loja precisa ter certeza de que conseguirá lançar 10 instâncias extras numa AZ específica.', type: 'm7g.large', count: 10, hoursPerDay: 24, interruptible: false, horizonMonths: 1, needsCapacity: true, concepts: ['ec2.capacity-reservations'] },
  ],
}

export const F04_CMP: PhaseDef = {
  ...META.f04,
  concepts: ['ec2.on-demand', 'ec2.savings-plans', 'ec2.reserved-instances', 'ec2.ri-scope', 'ec2.spot', 'ec2.spot-interruption', 'ec2.capacity-reservations', 'ec2.dedicated', 'ec2.commitment-coverage'],
  availability: 'available',
  simplifications: [
    'Preços reais da AWS Price List (Linux, us-east-1, sem pagamento antecipado). O Spot usa um desconto fixo de 70%, premissa do cenário: o preço real varia.',
    'Cada compromisso cobre exatamente as instâncias de uma parte da frota e é cobrado as 730 horas do mês.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f04.m1',
      title: 'O preço do compromisso',
      type: 'mission',
      summary: 'On-Demand, Savings Plans e Reserved Instances: desconto em troca de compromisso.',
      briefing: {
        company: 'Gráfica Papel & Tinta',
        role: 'Você é a pessoa de FinOps de uma gráfica que vende impressos pela internet.',
        situation: 'Tudo roda em On-Demand. O diretor leu que "dá para economizar até 72%" e quer comprar compromisso para todas as instâncias, inclusive as que só ligam no horário comercial.',
        objective: 'Entender o que cada compromisso cobre e quando ele compensa.',
        successCriteria: ['Associar cada opção ao que ela oferece', 'Saber o que cada Savings Plan cobre', 'Prever quando o compromisso não compensa'],
      },
      intel: [
        { conceptId: 'ec2.savings-plans', visual: 'purchase-options', body: ['**Savings Plans**: compromisso de US$/h por 1 ou 3 anos. **Compute SP** (até 66%) vale em qualquer família, Região, Fargate e Lambda. **EC2 Instance SP** (até 72%) fica preso a uma família numa Região. Nenhum cobre Spot.'] },
        { conceptId: 'ec2.reserved-instances', body: ['**Reserved Instance** é um desconto para uso com o mesmo tipo, Região, tenancy e plataforma. **Standard** só modifica; **Convertible** troca de família. Não cancela. A AWS recomenda Savings Plans no lugar de RIs.'] },
        { conceptId: 'ec2.commitment-coverage', body: ['Compromisso é cobrado **todas as horas**, use ou não. Ele compensa na base que roda 24 h; num pico de 9 h por dia, o On-Demand costuma sair mais barato.'] },
        { conceptId: 'ec2.on-demand', body: ['**On-Demand**: por segundo, sem compromisso. É a referência para todos os descontos.'] },
      ],
      activities: [
        {
          id: 'cmp.f04.m1.a1',
          kind: 'match',
          title: 'Cada opção, sua troca',
          prompt: 'Associe cada opção de compra ao que ela oferece.',
          concepts: [{ id: 'ec2.savings-plans' }, { id: 'ec2.reserved-instances', weight: 0.5 }],
          xp: 50,
          difficulty: 1,
          explanation: ['Cada desconto troca alguma coisa: compromisso de gasto (Savings Plans), compromisso com uma configuração (RIs), risco de interrupção (Spot). On-Demand não troca nada e é o preço cheio.'],
          leftLabel: 'Opção',
          rightLabel: 'O que oferece',
          pairs: [
            { id: 'od', left: 'On-Demand', right: 'Preço cheio por segundo, sem compromisso', explanation: 'A referência para os descontos.', concepts: ['ec2.on-demand'] },
            { id: 'csp', left: 'Compute Savings Plan', right: 'Desconto por gasto por hora, em qualquer família, Região, Fargate e Lambda', explanation: 'O plano mais flexível.', concepts: ['ec2.savings-plans'] },
            { id: 'esp', left: 'EC2 Instance Savings Plan', right: 'Desconto maior, preso a uma família numa Região', explanation: 'Até 72%, com qualquer tamanho, SO e tenancy da família.', concepts: ['ec2.savings-plans'] },
            { id: 'ri', left: 'Reserved Instance Standard', right: 'Desconto para um tipo, Região, tenancy e plataforma, que só pode ser modificado', explanation: 'A Convertible pode ser trocada; a Standard, não.', concepts: ['ec2.reserved-instances'] },
            { id: 'spot', left: 'Spot', right: 'Capacidade sobrando, com grande desconto, que pode ser interrompida', explanation: 'Até 90% de desconto, com aviso de 2 minutos antes da interrupção.', concepts: ['ec2.spot'] },
          ],
        },
        {
          id: 'cmp.f04.m1.a2',
          kind: 'classify',
          title: 'O plano cobre?',
          prompt: 'A gráfica tem um Compute Savings Plan e um EC2 Instance Savings Plan para a família m7g em us-east-1. Para cada uso, indique quais planos dão desconto.',
          concepts: [{ id: 'ec2.savings-plans' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O EC2 Instance SP vale para qualquer tamanho, SO e tenancy dentro da família e da Região. O Compute SP vai além: outra família, outra Região, Fargate e Lambda. Nenhum dos dois cobre Spot.'],
          bins: [
            { id: 'both', label: 'Os dois planos' },
            { id: 'compute', label: 'Só o Compute SP' },
            { id: 'none', label: 'Nenhum dos dois' },
          ],
          items: [
            { id: 'size', text: 'm7g.xlarge em us-east-1 (outro tamanho da mesma família)', bin: 'both', explanation: 'O EC2 Instance SP vale para qualquer tamanho da família.', concepts: ['ec2.savings-plans'] },
            { id: 'os', text: 'm7g.large com Windows em us-east-1', bin: 'both', explanation: 'O EC2 Instance SP independe do sistema operacional dentro da família.', concepts: ['ec2.savings-plans'] },
            { id: 'family', text: 'c7g.large em us-east-1 (outra família)', bin: 'compute', explanation: 'Mudar de família só o Compute SP acompanha.', concepts: ['ec2.savings-plans'] },
            { id: 'region', text: 'm7g.large em sa-east-1 (outra Região)', bin: 'compute', explanation: 'Mudar de Região só o Compute SP acompanha.', concepts: ['ec2.savings-plans'] },
            { id: 'fargate', text: 'Tarefas no Fargate', bin: 'compute', explanation: 'Fargate e Lambda só o Compute SP cobre.', concepts: ['ec2.savings-plans'] },
            { id: 'spot', text: 'Instâncias Spot m7g.large', bin: 'none', explanation: 'Savings Plans não se aplicam ao Spot.', concepts: ['ec2.savings-plans', 'ec2.spot'] },
          ],
        },
        {
          id: 'cmp.f04.m1.a3',
          kind: 'predict',
          title: 'Compromisso para o pico?',
          prompt: 'O diretor quer comprar compromisso para as **6 m7g.large que só ligam 9 horas por dia**, no horário comercial. Qual opção sai mais barata no mês?',
          concepts: [{ id: 'ec2.commitment-coverage' }, { id: 'ec2.savings-plans', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O compromisso é cobrado as 24 horas do dia. Com 9 horas de uso, o desconto não compensa as 15 horas pagas sem uso: o On-Demand sai mais barato.'],
          spec: { sim: 'purchase', segment: PEAK, options: ['on-demand', 'compute-sp-1yr', 'ec2-sp-3yr'] },
          options: opts(['on-demand', 'compute-sp-1yr', 'ec2-sp-3yr']),
        },
        {
          id: 'cmp.f04.m1.a4',
          kind: 'decision',
          title: 'RI ou Savings Plan?',
          prompt: 'Para a base que roda 24 horas, o diretor está em dúvida entre uma Reserved Instance Standard e um EC2 Instance Savings Plan com o mesmo prazo. Os dois têm o mesmo preço por hora para a m7g.large. O que recomendar?',
          concepts: [{ id: 'ec2.reserved-instances' }, { id: 'ec2.savings-plans', weight: 0.5 }],
          xp: 30,
          difficulty: 2,
          explanation: ['A AWS recomenda Savings Plans no lugar de Reserved Instances: mesmo desconto, e o EC2 Instance SP ainda vale para outros tamanhos, sistemas operacionais e tenancy da família.'],
          options: [
            { id: 'a', text: 'O EC2 Instance Savings Plan: mesmo desconto, com mais flexibilidade', correct: true, consequence: 'Se a gráfica trocar m7g.large por m7g.xlarge, o desconto continua.' },
            { id: 'b', text: 'A Reserved Instance Standard: ela reserva capacidade', correct: false, consequence: 'Só a RI zonal reserva capacidade; a regional, não.' },
            { id: 'c', text: 'Tanto faz: os dois têm as mesmas regras', correct: false, consequence: 'A RI fica presa ao tipo; o plano aceita qualquer tamanho da família.' },
          ],
        },
      ],
      debrief: { takeaways: ['Compute SP é o mais flexível; EC2 Instance SP dá mais desconto preso à família.', 'Savings Plans não cobrem Spot.', 'Compromisso só compensa no que roda o tempo todo.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f04.m2',
      title: 'Os dois minutos do Spot',
      type: 'mission',
      summary: 'Capacidade sobrando com desconto alto, em troca de poder ser interrompida.',
      briefing: {
        company: 'Gráfica Papel & Tinta',
        role: 'Você continua no FinOps da gráfica.',
        situation: 'A renderização dos PDFs de impressão roda de madrugada em 10 instâncias. Alguém sugeriu Spot também para o banco de pedidos, "já que o desconto é tão bom".',
        objective: 'Saber onde o Spot cabe e como reagir a uma interrupção.',
        successCriteria: ['Escolher as cargas que aceitam Spot', 'Ordenar a reação a uma interrupção', 'Prever o custo da renderização'],
      },
      intel: [
        { conceptId: 'ec2.spot', body: ['**Spot** usa capacidade sobrando, com até **90% de desconto**. A AWS pode pegar a instância de volta. Serve para cargas flexíveis e tolerantes a falhas: análises, lotes, processamento em segundo plano.'] },
        { conceptId: 'ec2.spot-interruption', body: ['Antes de interromper, a AWS emite um **aviso de 2 minutos** pelo EventBridge e pelos metadados (`spot/instance-action`). Às vezes vem antes uma **recomendação de rebalanceamento**. Com hibernação, não há os 2 minutos.'] },
      ],
      activities: [
        {
          id: 'cmp.f04.m2.a1',
          kind: 'decision',
          title: 'Onde o Spot cabe',
          prompt: 'Quais cargas da gráfica podem usar Spot? (selecione todas as adequadas)',
          concepts: [{ id: 'ec2.spot' }],
          xp: 50,
          difficulty: 2,
          multiple: true,
          explanation: ['Spot serve a cargas que aguentam ser interrompidas e retomadas: lotes que salvam o progresso, testes, processamento em segundo plano. Banco de dados e atendimento sem redundância, não.'],
          options: [
            { id: 'render', text: 'Renderização noturna de PDFs, que salva o progresso de cada página', correct: true, consequence: 'Interrompida, a renderização recomeça da última página salva.' },
            { id: 'ci', text: 'Execução dos testes automatizados a cada commit', correct: true, consequence: 'Se uma instância for interrompida, o teste roda de novo.' },
            { id: 'thumbs', text: 'Geração de miniaturas a partir de uma fila de trabalhos', correct: true, consequence: 'O trabalho interrompido volta para a fila e outra instância o faz.' },
            { id: 'db', text: 'O único servidor do banco de pedidos', correct: false, consequence: 'Uma interrupção derruba a loja e pode corromper dados em uso.' },
            { id: 'pay', text: 'O servidor que confirma os pagamentos, sem réplica', correct: false, consequence: 'Interromper no meio de um pagamento é inaceitável.' },
          ],
        },
        {
          id: 'cmp.f04.m2.a2',
          kind: 'order',
          title: 'Quando o aviso chega',
          prompt: 'Ordene o que acontece, e o que a aplicação faz, numa interrupção de Spot com comportamento terminate.',
          concepts: [{ id: 'ec2.spot-interruption' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A recomendação de rebalanceamento pode chegar antes do aviso. O aviso dá 2 minutos: tempo para parar de aceitar trabalho, salvar o estado e devolver o que estava em andamento. Depois, a instância é encerrada.'],
          steps: [
            { id: 's1', text: 'A AWS emite uma recomendação de rebalanceamento: o risco de interrupção subiu', explanation: 'É um sinal antecipado, que pode chegar antes do aviso.' },
            { id: 's2', text: 'O aviso de interrupção aparece no EventBridge e em spot/instance-action', explanation: 'A partir daqui, faltam 2 minutos.' },
            { id: 's3', text: 'A aplicação para de pegar trabalho novo e salva o progresso', explanation: 'Os 2 minutos servem para sair sem perder trabalho.' },
            { id: 's4', text: 'O trabalho que estava em andamento volta para a fila', explanation: 'Outra instância continua de onde parou.' },
            { id: 's5', text: 'A AWS encerra a instância', explanation: 'É o comportamento terminate escolhido no pedido.' },
          ],
        },
        {
          id: 'cmp.f04.m2.a3',
          kind: 'predict',
          title: 'A renderização de madrugada',
          prompt: 'A renderização usa **10 c7g.xlarge por 5 horas toda madrugada**, e o trabalho aguenta interrupções. Qual opção sai mais barata no mês?',
          concepts: [{ id: 'ec2.spot' }, { id: 'ec2.commitment-coverage', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O compromisso pagaria as 24 horas; o On-Demand paga só as 5. O Spot também paga só as 5 horas, com desconto: é o mais barato para uma carga interrompível e curta.'],
          spec: { sim: 'purchase', segment: NIGHT, options: ['on-demand', 'spot', 'compute-sp-3yr'] },
          options: opts(['on-demand', 'spot', 'compute-sp-3yr']),
        },
      ],
      debrief: { takeaways: ['Spot é para o que aguenta interrupção e recomeço.', 'O aviso dá 2 minutos; a recomendação de rebalanceamento pode chegar antes.', 'Lotes curtos e interrompíveis: Spot, não compromisso.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f04.m3',
      title: 'Capacidade e hardware só seus',
      type: 'mission',
      summary: 'Capacity Reservations, RIs zonais, Capacity Blocks e servidores dedicados.',
      briefing: {
        company: 'Gráfica Papel & Tinta',
        role: 'Você continua no FinOps da gráfica.',
        situation: 'Na última liquidação, a gráfica não conseguiu lançar instâncias numa AZ. Agora, além disso, o software de diagramação novo é licenciado por núcleo físico do servidor.',
        objective: 'Garantir capacidade quando importa e respeitar a licença.',
        successCriteria: ['Garantir capacidade para um evento', 'Escolher onde rodar o software licenciado por núcleo', 'Separar RI regional de zonal'],
      },
      intel: [
        { conceptId: 'ec2.capacity-reservations', body: ['A **Capacity Reservation** garante capacidade numa AZ, sem prazo de compromisso, e cobra o preço On-Demand usada ou não. Combinada com um Savings Plan, ganha desconto. **Capacity Blocks** reservam GPUs para ML numa data futura.'] },
        { conceptId: 'ec2.ri-scope', body: ['**RI regional**: qualquer AZ da Região e, em Linux, qualquer tamanho da família; não reserva capacidade. **RI zonal**: uma AZ e um tamanho, e reserva capacidade lá. O preço é o mesmo.'] },
        { conceptId: 'ec2.dedicated', body: ['**Dedicated Host**: servidor físico inteiro seu, cobrado por host, com visibilidade de sockets e núcleos, para licenças por socket, núcleo ou VM. **Dedicated Instance**: hardware só seu, cobrado por instância, sem visibilidade do servidor.'] },
      ],
      activities: [
        {
          id: 'cmp.f04.m3.a1',
          kind: 'decision',
          title: 'A semana da liquidação',
          prompt: 'Na semana da liquidação, a gráfica precisa ter certeza de que conseguirá lançar 10 m7g.large na AZ us-east-1a. Depois disso, não precisa mais delas. Qual opção atende?',
          concepts: [{ id: 'ec2.capacity-reservations' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A Capacity Reservation para uso imediato garante a capacidade numa AZ, sem prazo de compromisso, e pode ser cancelada depois da liquidação. Savings Plans e RIs regionais não reservam capacidade.'],
          options: [
            { id: 'a', text: 'Criar uma Capacity Reservation de 10 m7g.large em us-east-1a e cancelá-la depois da liquidação', correct: true, consequence: 'A capacidade está garantida, e a cobrança termina ao cancelar.' },
            { id: 'b', text: 'Comprar um Compute Savings Plan de 1 ano', correct: false, consequence: 'Dá desconto, mas não reserva capacidade, e prende a gráfica por um ano.' },
            { id: 'c', text: 'Comprar 10 RIs regionais de 1 ano', correct: false, consequence: 'RIs regionais não reservam capacidade.' },
            { id: 'd', text: 'Usar Spot', correct: false, consequence: 'Spot depende de capacidade sobrando: o oposto de garantia.' },
          ],
        },
        {
          id: 'cmp.f04.m3.a2',
          kind: 'decision',
          title: 'Licença por núcleo',
          prompt: 'O software de diagramação é licenciado **por núcleo físico** do servidor, e a gráfica quer usar as licenças que já tem. Onde rodar?',
          concepts: [{ id: 'ec2.dedicated' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O Dedicated Host mostra sockets e núcleos físicos e aceita licenças próprias por socket, núcleo ou VM. A Dedicated Instance não dá essa visibilidade.'],
          options: [
            { id: 'a', text: 'Num Dedicated Host', correct: true, consequence: 'Com a visibilidade dos núcleos, a gráfica conta as licenças como num servidor próprio.' },
            { id: 'b', text: 'Numa Dedicated Instance', correct: false, consequence: 'O hardware é só da gráfica, mas sem visibilidade de sockets e núcleos.' },
            { id: 'c', text: 'Numa instância comum, com tenancy compartilhada', correct: false, consequence: 'Não há como contar núcleos físicos num servidor compartilhado.' },
          ],
        },
        {
          id: 'cmp.f04.m3.a3',
          kind: 'classify',
          title: 'Regional ou zonal?',
          prompt: 'Classifique cada característica no escopo de Reserved Instance a que ela pertence.',
          concepts: [{ id: 'ec2.ri-scope' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Regional: flexível em AZ e, em Linux com tenancy padrão, em tamanho; sem capacidade. Zonal: uma AZ e um tamanho, com capacidade reservada. O preço é o mesmo.'],
          bins: [
            { id: 'regional', label: 'RI regional' },
            { id: 'zonal', label: 'RI zonal' },
          ],
          items: [
            { id: 'cap', text: 'Reserva capacidade numa AZ', bin: 'zonal', explanation: 'Só a zonal reserva capacidade.', concepts: ['ec2.ri-scope'] },
            { id: 'anyaz', text: 'O desconto vale em qualquer AZ da Região', bin: 'regional', explanation: 'A regional tem flexibilidade de AZ.', concepts: ['ec2.ri-scope'] },
            { id: 'size', text: 'O desconto vale para outros tamanhos da família (Linux, tenancy padrão)', bin: 'regional', explanation: 'Flexibilidade de tamanho é da regional.', concepts: ['ec2.ri-scope'] },
            { id: 'onesize', text: 'O desconto vale só para um tamanho específico', bin: 'zonal', explanation: 'A zonal não tem flexibilidade de tamanho.', concepts: ['ec2.ri-scope'] },
          ],
        },
        {
          id: 'cmp.f04.m3.a4',
          kind: 'decision',
          title: 'GPUs numa data marcada',
          prompt: 'Uma equipe de dados da gráfica vai treinar um modelo de ML durante uma semana, a partir do mês que vem, e precisa ter as GPUs garantidas nessa data. Qual opção foi feita para isso?',
          concepts: [{ id: 'ec2.capacity-reservations' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Capacity Blocks for ML reservam instâncias com GPU por um período definido a partir de uma data futura, para treino, ajuste fino e experimentos curtos.'],
          options: [
            { id: 'a', text: 'Capacity Blocks for ML', correct: true, consequence: 'As GPUs ficam reservadas para a semana do treino.' },
            { id: 'b', text: 'Spot com GPUs', correct: false, consequence: 'Barato, mas sem garantia de capacidade e sujeito a interrupção no meio do treino.' },
            { id: 'c', text: 'EC2 Instance Savings Plan para a família G', correct: false, consequence: 'Desconto de um a três anos, sem reservar capacidade.' },
          ],
        },
      ],
      debrief: { takeaways: ['Capacidade garantida: Capacity Reservation ou RI zonal.', 'Licença por núcleo físico: Dedicated Host.', 'GPUs numa data futura: Capacity Blocks for ML.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f04.boss',
      title: 'A fatura que dobrou',
      type: 'boss',
      summary: 'Seis partes de uma frota, seis jeitos de pagar. Corte a fatura sem quebrar nenhum requisito.',
      briefing: {
        company: 'Loja Casa & Jardim',
        role: 'Você foi contratado por uma loja virtual de decoração.',
        situation: 'A fatura do EC2 dobrou em um ano, tudo em On-Demand. A diretoria quer o menor custo possível, mas não aceita interrupções na loja, não quer compromisso com o que vai acabar e precisa de capacidade garantida na liquidação.',
        objective: 'Escolher a forma de pagar cada parte da frota.',
        successCriteria: ['Nenhum requisito quebrado', 'Custo mensal o mais baixo possível'],
      },
      intel: [
        { conceptId: 'ec2.commitment-coverage', body: ['Compromisso na base de 24 horas; On-Demand no pico e no que vai acabar; Spot no que aguenta interrupção; Capacity Reservation onde a capacidade precisa estar garantida.'] },
        { conceptId: 'ec2.savings-plans', body: ['Se a carga vai mudar de família, de Região ou para o Fargate, só o **Compute SP** acompanha. Se não vai mudar, o **EC2 Instance SP** dá mais desconto.'] },
      ],
      activities: [
        {
          id: 'cmp.f04.boss.a1',
          kind: 'lab',
          lab: 'purchase',
          title: 'Como pagar cada parte',
          prompt: 'Escolha uma opção de compra para cada parte da frota. O custo de cada opção aparece no cartão; os requisitos estão na lista.',
          concepts: [{ id: 'ec2.commitment-coverage' }, { id: 'ec2.savings-plans', weight: 0.5 }, { id: 'ec2.spot', weight: 0.5 }, { id: 'ec2.capacity-reservations', weight: 0.5 }],
          xp: 120,
          difficulty: 3,
          explanation: ['Base estável por anos: EC2 Instance SP de 3 anos. Pico de 10 horas: On-Demand. Lote interrompível: Spot. Migração para o Fargate: Compute SP. Projeto de seis meses: On-Demand. Capacidade garantida: Capacity Reservation.'],
          config: FATURA,
        },
        {
          id: 'cmp.f04.boss.a2',
          kind: 'decision',
          title: 'O tamanho do compromisso',
          prompt: 'A loja roda **6 instâncias** o tempo todo e chega a **14** no horário comercial. A diretoria quer cobrir com Savings Plan "a média, umas 10 instâncias". O que você recomenda?',
          concepts: [{ id: 'ec2.commitment-coverage' }],
          xp: 40,
          difficulty: 3,
          explanation: ['O compromisso é cobrado todas as horas. Cobrindo 10 instâncias, 4 delas ficam pagas sem uso nas 14 horas fora do pico. Cobrindo as 6 da base, todo o compromisso é usado, e o pico sai pelo preço On-Demand.'],
          options: [
            { id: 'a', text: 'Comprometer o equivalente às 6 instâncias da base e deixar o pico em On-Demand', correct: true, consequence: 'Todo o compromisso é usado o dia inteiro.' },
            { id: 'b', text: 'Comprometer o equivalente a 10 instâncias, a média do dia', correct: false, consequence: 'Fora do pico, o compromisso de 4 instâncias é pago sem uso.' },
            { id: 'c', text: 'Comprometer o equivalente a 14 instâncias, para cobrir o pico', correct: false, consequence: 'Paga 8 instâncias sem uso na maior parte do dia.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cada parte da frota tem a sua forma de pagar.', 'Comprometa a base, não a média nem o pico.', 'Requisitos vêm antes do desconto: Spot e compromissos têm condições.'] },
    },
  ],
}
