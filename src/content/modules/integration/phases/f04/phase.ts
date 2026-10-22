/**
 * Fase 4 — Eventos com EventBridge. Barramentos, regras e padrões, alvos,
 * eventos entre contas, arquivamento e reprocessamento, Scheduler e Pipes
 * (reaproveita ev.eventbridge).
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FilterLabConfig } from '../../../../../simulators/eventbus/lab'
import { META } from '../meta'

export const ROTA_REGRAS: FilterLabConfig = {
  items: [
    { id: 'e1', label: 'Entrega concluída em SP, carga de R$ 8.000', data: { source: 'rota.entregas', 'detail-type': 'Entrega concluida', detail: { estado: 'SP', valor: 8000 } } },
    { id: 'e2', label: 'Entrega atrasada em MG, carga de R$ 500', data: { source: 'rota.entregas', 'detail-type': 'Entrega atrasada', detail: { estado: 'MG', valor: 500 } } },
    { id: 'e3', label: 'Entrega atrasada em SP, carga de R$ 12.000', data: { source: 'rota.entregas', 'detail-type': 'Entrega atrasada', detail: { estado: 'SP', valor: 12000 } } },
    { id: 'e4', label: 'Instância EC2 parada (evento da AWS)', data: { source: 'aws.ec2', 'detail-type': 'EC2 Instance State-change Notification', detail: { state: 'stopped' } } },
  ],
  palette: [
    { id: 'entregas', pattern: { source: ['rota.entregas'] } },
    { id: 'atrasos', pattern: { 'detail-type': ['Entrega atrasada'] } },
    { id: 'atraso-caro', pattern: { 'detail-type': ['Entrega atrasada'], detail: { valor: [{ numeric: ['>=', 10000] }] } } },
    { id: 'sp', pattern: { detail: { estado: ['SP'] } } },
    { id: 'aws', pattern: { source: [{ prefix: 'aws.' }] } },
    { id: 'fora-sp', pattern: { source: ['rota.entregas'], detail: { estado: [{ 'anything-but': 'SP' }] } } },
  ],
  targets: [
    { id: 'faturamento', label: 'Faturamento', need: 'Todos os eventos de entrega, de qualquer tipo.', wants: ['e1', 'e2', 'e3'], concepts: ['eb.rules-patterns'] },
    { id: 'sac', label: 'Atendimento', need: 'Toda entrega atrasada, para avisar o cliente.', wants: ['e2', 'e3'], concepts: ['eb.rules-patterns'] },
    { id: 'seguro', label: 'Seguradora da carga', need: 'Só atrasos de cargas de R$ 10.000 ou mais.', wants: ['e3'], concepts: ['eb.rules-patterns'] },
    { id: 'regional', label: 'Filial de fora de SP', need: 'Entregas de qualquer estado, exceto SP.', wants: ['e2'], concepts: ['eb.rules-patterns'] },
    { id: 'infra', label: 'Time de infraestrutura', need: 'Os eventos que vêm dos serviços da AWS.', wants: ['e4'], concepts: ['eb.rules-patterns', 'eb.bus'] },
  ],
}

export const F04_INT: PhaseDef = {
  ...META.f04,
  concepts: ['eb.bus', 'ev.eventbridge', 'eb.rules-patterns', 'eb.targets', 'eb.cross-account', 'eb.archive-replay', 'eb.scheduler', 'eb.pipes'],
  availability: 'available',
  simplifications: ['A transportadora e os eventos são fictícios; os eventos aparecem resumidos.', 'No laboratório, cada regra tem um alvo.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f04.m1',
      title: 'Os eventos da conta',
      type: 'mission',
      summary: 'Barramento padrão, personalizado e de parceiros.',
      briefing: {
        company: 'Transportadora Rota Certa',
        role: 'Você organiza os eventos de uma transportadora.',
        situation: 'Os sistemas de entregas, de frota e de cobrança querem trocar eventos, e o time de infraestrutura quer saber quando uma instância para.',
        objective: 'Escolher onde cada tipo de evento chega.',
        successCriteria: ['Separar o barramento padrão do personalizado'],
      },
      intel: [
        { conceptId: 'eb.bus', body: ['O barramento **padrão** recebe os eventos dos **serviços da AWS**. Os eventos das aplicações da empresa vão para um barramento **personalizado**. Há também barramentos de **parceiros SaaS**.'] },
        { conceptId: 'ev.eventbridge', body: ['O **EventBridge** entrega eventos por **regras**: cada regra escolhe os eventos pelo conteúdo e manda aos alvos.'] },
      ],
      activities: [
        {
          id: 'int.f04.m1.a1',
          kind: 'classify',
          title: 'Que barramento',
          prompt: 'Diga em que barramento cada evento chega.',
          concepts: [{ id: 'eb.bus' }, { id: 'ev.eventbridge', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['Serviços da AWS publicam no barramento padrão; aplicações da empresa, num personalizado; parceiros SaaS, no barramento de parceiro.'],
          bins: [
            { id: 'default', label: 'Padrão', description: 'Eventos dos serviços da AWS.' },
            { id: 'custom', label: 'Personalizado', description: 'Eventos das aplicações da empresa.' },
            { id: 'partner', label: 'De parceiro', description: 'Eventos de um SaaS integrado.' },
          ],
          items: [
            { id: 'ec2', text: 'Uma instância EC2 mudou para stopped', bin: 'default', explanation: 'Evento de serviço da AWS.', concepts: ['eb.bus'] },
            { id: 'entrega', text: 'O sistema de entregas publica "Entrega concluída"', bin: 'custom', explanation: 'Evento da aplicação da empresa.', concepts: ['eb.bus'] },
            { id: 'saas', text: 'O sistema de atendimento SaaS avisa que abriu um chamado', bin: 'partner', explanation: 'Evento de um parceiro integrado.', concepts: ['eb.bus'] },
            { id: 'guardduty', text: 'O GuardDuty gera um achado', bin: 'default', explanation: 'Os serviços da AWS publicam no padrão.', concepts: ['eb.bus'] },
          ],
        },
      ],
      debrief: { takeaways: ['Padrão para a AWS, personalizado para as aplicações, parceiro para SaaS.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f04.m2',
      title: 'A regra que não pegava nada',
      type: 'mission',
      summary: 'Regras e padrões de evento.',
      briefing: {
        company: 'Transportadora Rota Certa',
        role: 'Você revisa as regras do barramento de entregas.',
        situation: 'A regra da seguradora não dispara nunca, e a do atendimento dispara para tudo. O evento de entrega tem "detail-type" e um "detail" com estado e valor da carga.',
        objective: 'Prever o que cada padrão pega.',
        successCriteria: ['Ler o padrão campo a campo'],
      },
      intel: [{ conceptId: 'eb.rules-patterns', body: ['O padrão tem a mesma estrutura do evento. Campos com **E**, lista com **OU**, o que o padrão não cita é ignorado. Número e texto são diferentes: **10000** não casa com **"10000"**.'] }],
      activities: [
        {
          id: 'int.f04.m2.a1',
          kind: 'predict',
          title: 'O número entre aspas',
          prompt: 'O padrão da seguradora é {"detail": {"valor": ["12000"]}}. Chega um atraso com "valor": 12000 (número). A regra dispara?',
          concepts: [{ id: 'eb.rules-patterns' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O padrão compara com o texto "12000", e o evento tem o número 12000. Não casam. Para números, use o operador numeric.'],
          spec: { sim: 'eventbus', pattern: { detail: { valor: ['12000'] } }, event: { 'detail-type': 'Entrega atrasada', detail: { estado: 'SP', valor: 12000 } } },
          options: [
            { id: 'a', text: 'Não dispara', outcome: 'no' },
            { id: 'b', text: 'Dispara', outcome: 'yes' },
          ],
        },
        {
          id: 'int.f04.m2.a2',
          kind: 'predict',
          title: 'Faixa numérica',
          prompt: 'O padrão corrigido é {"detail": {"valor": [{"numeric": [">=", 10000]}]}}. Chega um atraso de carga de 8000. A regra dispara?',
          concepts: [{ id: 'eb.rules-patterns' }],
          xp: 40,
          difficulty: 1,
          explanation: ['8000 é menor que 10000: o padrão não casa.'],
          spec: { sim: 'eventbus', pattern: { detail: { valor: [{ numeric: ['>=', 10000] }] } }, event: { 'detail-type': 'Entrega atrasada', detail: { estado: 'SP', valor: 8000 } } },
          options: [
            { id: 'a', text: 'Não dispara', outcome: 'no' },
            { id: 'b', text: 'Dispara', outcome: 'yes' },
          ],
        },
        {
          id: 'int.f04.m2.a3',
          kind: 'predict',
          title: 'O que o padrão não cita',
          prompt: 'O padrão do atendimento é {"detail-type": ["Entrega atrasada"]}. Chega um atraso em MG com carga de 500. A regra dispara?',
          concepts: [{ id: 'eb.rules-patterns' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O padrão só cita o tipo do evento; estado e valor são ignorados. O tipo casa: a regra dispara.'],
          spec: { sim: 'eventbus', pattern: { 'detail-type': ['Entrega atrasada'] }, event: { 'detail-type': 'Entrega atrasada', detail: { estado: 'MG', valor: 500 } } },
          options: [
            { id: 'a', text: 'Dispara', outcome: 'yes' },
            { id: 'b', text: 'Não dispara, porque o padrão não cita o estado', outcome: 'no' },
          ],
        },
        {
          id: 'int.f04.m2.a4',
          kind: 'predict',
          title: 'Exceto SP',
          prompt: 'O padrão da filial é {"detail": {"estado": [{"anything-but": "SP"}]}}. Chega uma entrega concluída em SP. A regra dispara?',
          concepts: [{ id: 'eb.rules-patterns' }],
          xp: 50,
          difficulty: 2,
          explanation: ['anything-but casa com qualquer valor, menos o citado. O evento é de SP: não casa.'],
          spec: { sim: 'eventbus', pattern: { detail: { estado: [{ 'anything-but': 'SP' }] } }, event: { 'detail-type': 'Entrega concluida', detail: { estado: 'SP', valor: 8000 } } },
          options: [
            { id: 'a', text: 'Não dispara', outcome: 'no' },
            { id: 'b', text: 'Dispara', outcome: 'yes' },
          ],
        },
      ],
      debrief: { takeaways: ['Campos com E, lista com OU, o resto é ignorado.', 'Número e texto não se confundem; para faixas, numeric.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f04.m3',
      title: 'Alvos, contas e replay',
      type: 'mission',
      summary: 'Alvos da regra, eventos entre contas e reprocessamento.',
      briefing: {
        company: 'Transportadora Rota Certa',
        role: 'Você conecta o barramento a outras contas e corrige um consumidor.',
        situation: 'A conta de análise, separada, quer receber os eventos de entrega. Um bug no faturamento descartou os eventos de ontem à tarde. E a regra de atrasos já tem cinco alvos, e o time quer um sexto.',
        objective: 'Mandar eventos a outra conta, reprocessar o que se perdeu e respeitar o limite de alvos.',
        successCriteria: ['Liberar o barramento da outra conta', 'Reprocessar a partir do arquivo', 'Ficar dentro de cinco alvos por regra'],
      },
      intel: [
        { conceptId: 'eb.targets', body: ['Cada regra entrega a até **cinco alvos**. Se um alvo falha depois das novas tentativas, o evento pode ir para uma **DLQ** (fila SQS padrão).'] },
        { conceptId: 'eb.cross-account', body: ['O alvo pode ser o **barramento de outra conta**. Quem recebe libera com uma **política de recurso** no barramento dele.'] },
        { conceptId: 'eb.archive-replay', body: ['O **arquivo** guarda os eventos; o **replay** os reenvia ao **mesmo barramento**, num intervalo de tempo escolhido.'] },
      ],
      activities: [
        {
          id: 'int.f04.m3.a1',
          kind: 'decision',
          title: 'A conta de análise',
          prompt: 'Como entregar os eventos de entrega ao barramento da conta de análise?',
          concepts: [{ id: 'eb.cross-account' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Uma regra na conta de origem tem como alvo o barramento da conta de análise, que permite o envio com uma política de recurso.'],
          options: [
            { id: 'a', text: 'Regra na conta de origem com alvo no barramento da conta de análise, que libera o envio na política de recurso dele', correct: true, consequence: 'Os eventos chegam lá, e as regras da conta de análise decidem o destino.' },
            { id: 'b', text: 'Copiar os eventos para um bucket e dar acesso à conta de análise', correct: false, consequence: 'Funciona com atraso e código extra; não é integração por eventos.' },
            { id: 'c', text: 'Dar às aplicações da conta de análise acesso de leitura ao barramento de origem', correct: false, consequence: 'Barramento não é lido por consulta: ele entrega por regras.' },
          ],
        },
        {
          id: 'int.f04.m3.a2',
          kind: 'decision',
          title: 'Os eventos de ontem',
          prompt: 'O barramento tem um arquivo ligado. O bug do faturamento foi corrigido. Como recuperar os eventos de ontem, das 14h às 18h?',
          concepts: [{ id: 'eb.archive-replay' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O replay reenvia ao barramento os eventos arquivados no intervalo escolhido, e as regras os entregam de novo.'],
          options: [
            { id: 'a', text: 'Fazer um replay do arquivo, das 14h às 18h de ontem', correct: true, consequence: 'O faturamento recebe de novo os eventos do período.' },
            { id: 'b', text: 'Pedir aos sistemas de origem que publiquem tudo de novo', correct: false, consequence: 'Dá trabalho e depende de cada sistema guardar o que publicou.' },
            { id: 'c', text: 'Não há como: o EventBridge não guarda eventos', correct: false, consequence: 'Com um arquivo ligado, guarda.' },
          ],
        },
        {
          id: 'int.f04.m3.a3',
          kind: 'decision',
          title: 'O sexto alvo',
          prompt: 'A regra de atrasos já entrega a cinco alvos, e um sexto sistema quer os mesmos eventos. O que fazer?',
          concepts: [{ id: 'eb.targets' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O limite é de cinco alvos por regra. Uma segunda regra com o mesmo padrão entrega ao sexto sistema.'],
          options: [
            { id: 'a', text: 'Criar uma segunda regra com o mesmo padrão para o sexto alvo', correct: true, consequence: 'Cada regra fica dentro do limite.' },
            { id: 'b', text: 'Adicionar o sexto alvo na mesma regra', correct: false, consequence: 'A regra aceita até cinco alvos.' },
          ],
        },
      ],
      debrief: { takeaways: ['Até cinco alvos por regra; DLQ para o alvo que falha.', 'Entre contas: política de recurso no barramento de destino.', 'Arquivo e replay recuperam eventos.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f04.m4',
      title: 'Agenda e encanamento',
      type: 'mission',
      summary: 'EventBridge Scheduler e Pipes.',
      briefing: {
        company: 'Transportadora Rota Certa',
        role: 'Você simplifica integrações pequenas.',
        situation: 'O time quer lembrar 300 mil motoristas da revisão do caminhão, cada um numa data. E um fluxo lê uma fila SQS e chama o Step Functions com um código feito à mão.',
        objective: 'Escolher entre Scheduler, Pipes e regras.',
        successCriteria: ['Associar cada caso ao recurso'],
      },
      intel: [
        { conceptId: 'eb.scheduler', body: ['O **Scheduler** cria **milhões** de agendamentos, únicos ou recorrentes, chamando mais de 270 serviços. As regras agendadas ficaram como recurso legado.'] },
        { conceptId: 'eb.pipes', body: ['O **Pipe** liga **uma origem a um alvo**, com **filtro** e **enriquecimento** opcionais, sem código de integração.'] },
      ],
      activities: [
        {
          id: 'int.f04.m4.a1',
          kind: 'match',
          title: 'Cada caso, um recurso',
          prompt: 'Associe cada caso ao recurso do EventBridge.',
          concepts: [{ id: 'eb.scheduler' }, { id: 'eb.pipes' }, { id: 'eb.rules-patterns', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Datas individuais em massa: Scheduler. Uma origem para um alvo: Pipe. Vários interessados por conteúdo: regras no barramento.'],
          leftLabel: 'Caso',
          rightLabel: 'Recurso',
          pairs: [
            { id: 'revisao', left: 'Lembrar cada um de 300 mil motoristas na data da revisão dele', right: 'EventBridge Scheduler', explanation: 'Milhões de agendamentos individuais.', concepts: ['eb.scheduler'] },
            { id: 'fila-sfn', left: 'Ler uma fila SQS, descartar mensagens de teste e iniciar um fluxo do Step Functions', right: 'EventBridge Pipes', explanation: 'Origem, filtro e alvo, ponto a ponto.', concepts: ['eb.pipes'] },
            { id: 'atrasos', left: 'Avisar três sistemas sempre que uma entrega atrasar', right: 'Regra no barramento', explanation: 'Padrão por conteúdo e vários alvos.', concepts: ['eb.rules-patterns'] },
          ],
        },
      ],
      debrief: { takeaways: ['Scheduler para agendamentos em massa.', 'Pipes para ligar uma origem a um alvo.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f04.boss',
      title: 'O barramento da transportadora',
      type: 'boss',
      summary: 'Um padrão de evento para cada regra.',
      briefing: {
        company: 'Transportadora Rota Certa',
        role: 'Você monta as regras do barramento.',
        situation: 'Cinco times querem eventos diferentes. Os eventos de teste do dia mostram o que chega.',
        objective: 'Escolher, para cada time, o padrão que pega exatamente os eventos dele.',
        successCriteria: ['Cada time recebe tudo o que precisa', 'Nenhum recebe o que não precisa'],
      },
      intel: [{ conceptId: 'eb.rules-patterns', body: ['Teste cada padrão contra os quatro eventos antes de escolher.'] }],
      activities: [
        {
          id: 'int.f04.boss.a1',
          kind: 'lab',
          lab: 'eventbus',
          title: 'As regras do barramento',
          prompt: 'Para cada time, escolha o padrão da regra.',
          concepts: [{ id: 'eb.rules-patterns' }, { id: 'eb.bus', weight: 0.5 }],
          xp: 200,
          difficulty: 3,
          hints: ['O padrão "sp" pega também a entrega concluída.', 'Os eventos da AWS têm source começando com "aws.".'],
          explanation: ['Faturamento: source rota.entregas. Atendimento: tipo Entrega atrasada. Seguradora: atraso com valor de 10.000 ou mais. Filial: entregas fora de SP. Infraestrutura: source com prefixo aws.'],
          config: ROTA_REGRAS,
        },
      ],
      debrief: { takeaways: ['Um padrão por necessidade, conferido contra eventos reais.'] },
    },
  ],
}
