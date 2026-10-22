/**
 * Fase 3 — Tópicos com SNS. Tópicos e assinaturas, fan-out com filas SQS
 * (reaproveita ev.fanout), política de filtro, tópicos FIFO, novas
 * tentativas e DLQ da assinatura.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FilterLabConfig } from '../../../../../simulators/eventbus/lab'
import { META } from '../meta'

export const MOVIMENTO_ASSINATURAS: FilterLabConfig = {
  items: [
    { id: 'm1', label: 'Matrícula no plano anual em Campinas', data: { evento: 'matricula', plano: 'anual', cidade: 'Campinas', valor: 1200 } },
    { id: 'm2', label: 'Matrícula no plano mensal em Santos', data: { evento: 'matricula', plano: 'mensal', cidade: 'Santos', valor: 120 } },
    { id: 'c1', label: 'Cancelamento do plano mensal em Campinas', data: { evento: 'cancelamento', plano: 'mensal', cidade: 'Campinas', valor: 0 } },
    { id: 'p1', label: 'Pagamento atrasado do plano anual em Santos', data: { evento: 'pagamento-atrasado', plano: 'anual', cidade: 'Santos', valor: 1200 } },
  ],
  palette: [
    { id: 'tudo', pattern: null },
    { id: 'matriculas', pattern: { evento: ['matricula'] } },
    { id: 'anual', pattern: { plano: ['anual'] } },
    { id: 'cancel-atraso', pattern: { evento: ['cancelamento', 'pagamento-atrasado'] } },
    { id: 'campinas', pattern: { cidade: ['Campinas'] } },
    { id: 'valor-alto', pattern: { valor: [{ numeric: ['>=', 1000] }] } },
    { id: 'anual-matricula', pattern: { evento: ['matricula'], plano: ['anual'] } },
  ],
  targets: [
    { id: 'auditoria', label: 'Fila da auditoria', need: 'Guardar todas as mensagens.', wants: ['m1', 'm2', 'c1', 'p1'], concepts: ['sns.filter'] },
    { id: 'boas-vindas', label: 'Fila do kit de boas-vindas', need: 'Todas as matrículas, de qualquer plano.', wants: ['m1', 'm2'], concepts: ['sns.filter'] },
    { id: 'retencao', label: 'Fila do time de retenção', need: 'Cancelamentos e pagamentos atrasados.', wants: ['c1', 'p1'], concepts: ['sns.filter'] },
    { id: 'brinde', label: 'Fila do brinde anual', need: 'Só matrículas no plano anual.', wants: ['m1'], concepts: ['sns.filter'] },
    { id: 'campinas', label: 'Fila da unidade de Campinas', need: 'Tudo o que acontece em Campinas.', wants: ['m1', 'c1'], concepts: ['sns.filter'] },
  ],
}

export const F03_INT: PhaseDef = {
  ...META.f03,
  concepts: ['sns.what', 'ev.fanout', 'sns.filter', 'sns.fifo', 'sns.retries-dlq'],
  availability: 'available',
  simplifications: ['A rede de academias e as mensagens são fictícias.', 'No laboratório, as políticas filtram os atributos da mensagem.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f03.m1',
      title: 'Uma matrícula, quatro sistemas',
      type: 'mission',
      summary: 'Tópicos, assinaturas e o fan-out com filas.',
      briefing: {
        company: 'Academias Movimento',
        role: 'Você integra os sistemas de uma rede de academias.',
        situation: 'Cada matrícula precisa chegar ao faturamento, ao app, à catraca e ao CRM. Hoje o sistema de matrículas chama os quatro, um por um; se o CRM cai, a matrícula trava.',
        objective: 'Publicar a matrícula uma vez e entregar a todos, sem que um sistema fora do ar atrapalhe os outros.',
        successCriteria: ['Usar um tópico SNS', 'Dar uma fila a cada sistema'],
      },
      intel: [
        { conceptId: 'sns.what', body: ['O **SNS** entrega cada mensagem publicada no **tópico** a **todas as assinaturas**: filas SQS, Lambda, Firehose, HTTP, e-mail, SMS e celular. Ele **não guarda** a mensagem para leitura posterior.'] },
        { conceptId: 'ev.fanout', body: ['No **fan-out**, cada sistema assina o tópico com **a sua fila SQS**. Se um sistema cai, a mensagem espera na fila dele, e os outros seguem.'] },
      ],
      activities: [
        {
          id: 'int.f03.m1.a1',
          kind: 'decision',
          title: 'Publicar uma vez',
          prompt: 'Como entregar cada matrícula aos quatro sistemas sem que o CRM fora do ar faça a matrícula ou os outros sistemas perderem mensagens?',
          concepts: [{ id: 'ev.fanout' }, { id: 'sns.what', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O tópico entrega uma cópia a cada fila. Cada sistema consome a sua no próprio ritmo; o CRM fora do ar só acumula mensagens na fila dele.'],
          options: [
            { id: 'a', text: 'Publicar num tópico SNS assinado por uma fila SQS de cada sistema', correct: true, consequence: 'Cada sistema tem a sua cópia guardada, e ninguém espera ninguém.' },
            { id: 'b', text: 'Publicar numa única fila SQS lida pelos quatro sistemas', correct: false, consequence: 'Cada mensagem vai para um só consumidor: os outros três não recebem.' },
            { id: 'c', text: 'Publicar num tópico SNS assinado direto pelos endpoints HTTP dos quatro sistemas', correct: false, consequence: 'Funciona, mas o sistema fora do ar depende das novas tentativas do SNS, que têm limite.' },
          ],
        },
        {
          id: 'int.f03.m1.a2',
          kind: 'match',
          title: 'Quem assina o tópico',
          prompt: 'Associe cada necessidade ao tipo de assinatura.',
          concepts: [{ id: 'sns.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O SNS entrega a vários tipos de destino; cada um serve a um caso.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Assinatura',
          pairs: [
            { id: 'fila', left: 'O faturamento processa no próprio ritmo, sem perder mensagens', right: 'Fila SQS', explanation: 'A fila guarda a mensagem.', concepts: ['sns.what'] },
            { id: 'lambda', left: 'Uma função grava a matrícula no data lake', right: 'Função Lambda', explanation: 'O SNS chama a função.', concepts: ['sns.what'] },
            { id: 'sms', left: 'O aluno recebe uma mensagem de texto no celular', right: 'SMS', explanation: 'Entrega direta ao telefone.', concepts: ['sns.what'] },
            { id: 'http', left: 'O sistema de um parceiro recebe por uma URL', right: 'Endpoint HTTPS', explanation: 'O SNS faz a chamada ao endpoint.', concepts: ['sns.what'] },
          ],
        },
      ],
      debrief: { takeaways: ['Tópico: uma publicação, várias entregas.', 'Fan-out: uma fila SQS por assinante.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f03.m2',
      title: 'Cada um recebe o seu',
      type: 'mission',
      summary: 'A política de filtro da assinatura.',
      briefing: {
        company: 'Academias Movimento',
        role: 'Você ajusta quem recebe o quê.',
        situation: 'O time de retenção só quer cancelamentos, mas recebe todas as matrículas e descarta 95% das mensagens no código.',
        objective: 'Filtrar na assinatura, e não no consumidor.',
        successCriteria: ['Escrever a política de filtro', 'Prever o que cada assinatura recebe'],
      },
      intel: [{ conceptId: 'sns.filter', body: ['A **política de filtro** olha os atributos (ou o corpo) da mensagem. Campos com **E**, valores da lista com **OU**. **Sem política**, a assinatura recebe **tudo**.'] }],
      activities: [
        {
          id: 'int.f03.m2.a1',
          kind: 'predict',
          title: 'A política da retenção',
          prompt: 'A assinatura da retenção tem a política {"evento": ["cancelamento", "pagamento-atrasado"]}. Chega uma mensagem com evento "matricula", plano "mensal". A retenção recebe?',
          concepts: [{ id: 'sns.filter' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O valor "matricula" não está na lista da política: a mensagem não é entregue a essa assinatura.'],
          spec: { sim: 'eventbus', pattern: { evento: ['cancelamento', 'pagamento-atrasado'] }, event: { evento: 'matricula', plano: 'mensal' } },
          options: [
            { id: 'a', text: 'Não recebe', outcome: 'no' },
            { id: 'b', text: 'Recebe', outcome: 'yes' },
          ],
        },
        {
          id: 'int.f03.m2.a2',
          kind: 'predict',
          title: 'Dois campos na política',
          prompt: 'A política é {"evento": ["matricula"], "plano": ["anual"]}. Chega uma matrícula no plano mensal. A assinatura recebe?',
          concepts: [{ id: 'sns.filter' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Os campos da política combinam com E: o evento casa, o plano não. A mensagem não é entregue.'],
          spec: { sim: 'eventbus', pattern: { evento: ['matricula'], plano: ['anual'] }, event: { evento: 'matricula', plano: 'mensal' } },
          options: [
            { id: 'a', text: 'Não recebe', outcome: 'no' },
            { id: 'b', text: 'Recebe, porque o evento casa', outcome: 'yes' },
          ],
        },
        {
          id: 'int.f03.m2.a3',
          kind: 'predict',
          title: 'Sem política',
          prompt: 'A assinatura da auditoria não tem política de filtro. Chega um cancelamento. A auditoria recebe?',
          concepts: [{ id: 'sns.filter' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Sem política de filtro, a assinatura recebe todas as mensagens do tópico.'],
          spec: { sim: 'eventbus', pattern: null, event: { evento: 'cancelamento', plano: 'mensal' } },
          options: [
            { id: 'a', text: 'Recebe', outcome: 'yes' },
            { id: 'b', text: 'Não recebe', outcome: 'no' },
          ],
        },
      ],
      debrief: { takeaways: ['Filtrar na assinatura economiza processamento.', 'Sem política, tudo chega.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f03.m3',
      title: 'Ordem e entrega',
      type: 'mission',
      summary: 'Tópico FIFO, novas tentativas e DLQ da assinatura.',
      briefing: {
        company: 'Academias Movimento',
        role: 'Você cuida da confiabilidade das entregas.',
        situation: 'A catraca precisa receber "matrícula" antes de "bloqueio" do mesmo aluno. E o endpoint HTTP de um parceiro ficou 8 horas fora do ar, e as mensagens desse período sumiram.',
        objective: 'Manter a ordem por aluno e não perder mensagens de um assinante fora do ar.',
        successCriteria: ['Usar o tópico FIFO', 'Guardar o que não foi entregue'],
      },
      intel: [
        { conceptId: 'sns.fifo', body: ['O **tópico FIFO** mantém a ordem por grupo e deduplica, entregando a **filas SQS FIFO**.'] },
        { conceptId: 'sns.retries-dlq', body: ['Para endpoints do cliente, como HTTP, o SNS tenta **50 vezes em 6 horas**; para SQS e Lambda, **100.015 vezes em 23 dias**. Depois, a mensagem é **descartada**, a menos que a assinatura tenha uma **DLQ**.'] },
      ],
      activities: [
        {
          id: 'int.f03.m3.a1',
          kind: 'decision',
          title: 'Matrícula antes do bloqueio',
          prompt: 'A catraca precisa receber as mensagens de cada aluno na ordem em que foram publicadas. O que usar?',
          concepts: [{ id: 'sns.fifo' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Tópico FIFO com o ID do aluno como grupo, assinado pela fila SQS FIFO da catraca.'],
          options: [
            { id: 'a', text: 'Tópico SNS FIFO com o aluno como grupo, entregando à fila SQS FIFO da catraca', correct: true, consequence: 'A ordem de cada aluno é mantida do tópico até a catraca.' },
            { id: 'b', text: 'Tópico SNS padrão entregando a uma fila SQS padrão', correct: false, consequence: 'Nenhum dos dois garante ordem.' },
            { id: 'c', text: 'Tópico SNS FIFO entregando a um endpoint HTTP', correct: false, consequence: 'O tópico FIFO entrega a filas SQS.' },
          ],
        },
        {
          id: 'int.f03.m3.a2',
          kind: 'decision',
          title: 'O parceiro fora do ar',
          prompt: 'O endpoint HTTPS do parceiro ficou 8 horas fora do ar, e as mensagens se perderam. Como evitar a perda da próxima vez?',
          concepts: [{ id: 'sns.retries-dlq' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Para endpoints HTTP, o SNS desiste depois de 6 horas de tentativas. Com uma DLQ na assinatura, o que não foi entregue fica guardado numa fila SQS para reenviar depois.'],
          options: [
            { id: 'a', text: 'Configurar uma DLQ (fila SQS) na assinatura do parceiro', correct: true, consequence: 'As mensagens não entregues ficam guardadas para reenvio.' },
            { id: 'b', text: 'Publicar cada mensagem duas vezes', correct: false, consequence: 'As duas cópias se perdem do mesmo jeito.' },
            { id: 'c', text: 'Contar que o SNS tenta por 23 dias', correct: false, consequence: 'Os 23 dias valem para destinos gerenciados pela AWS, como SQS e Lambda; para HTTP, são 6 horas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Tópico FIFO com filas FIFO: ordem por grupo.', 'HTTP: 50 tentativas em 6 horas; DLQ guarda o resto.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f03.boss',
      title: 'As assinaturas da academia',
      type: 'boss',
      summary: 'Uma política de filtro para cada assinatura.',
      briefing: {
        company: 'Academias Movimento',
        role: 'Você monta as assinaturas do tópico de eventos de alunos.',
        situation: 'Cinco filas assinam o tópico, e cada uma quer só uma parte das mensagens.',
        objective: 'Escolher a política que entrega a cada fila exatamente o que ela precisa.',
        successCriteria: ['Cada fila recebe tudo o que precisa', 'Nenhuma fila recebe o que não precisa'],
      },
      intel: [{ conceptId: 'sns.filter', body: ['Leia cada política como uma pergunta: todos os campos citados casam? Se sim, a mensagem chega.'] }],
      activities: [
        {
          id: 'int.f03.boss.a1',
          kind: 'lab',
          lab: 'pubsub',
          title: 'Os filtros do tópico',
          prompt: 'Para cada fila, escolha a política de filtro. Depois da verificação, veja quantas mensagens cada uma recebe.',
          concepts: [{ id: 'sns.filter' }],
          xp: 200,
          difficulty: 3,
          hints: ['A política de valor alto pega também o pagamento atrasado de R$ 1.200.', 'O brinde quer duas condições ao mesmo tempo.'],
          explanation: ['Auditoria: sem filtro. Boas-vindas: evento matrícula. Retenção: cancelamento ou pagamento atrasado. Brinde: matrícula E plano anual. Campinas: cidade Campinas.'],
          config: MOVIMENTO_ASSINATURAS,
        },
      ],
      debrief: { takeaways: ['Uma política por assinatura, testada contra as mensagens reais.'] },
    },
  ],
}
