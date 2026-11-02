/**
 * Questões da Revisão da Fase 2 da AWS Foundations (planos de suporte), no
 * formato do exame. O guia do SAA-C03 não lista planos de suporte (o tema é
 * do CLF-C02); as questões ficam no estilo de decisão do SAA-C03. Planos,
 * tempos de resposta e preços conferidos em 18/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'fnd.f02',
  questions: [
    {
      id: 'rv:fnd.f02.m1.a3',
      kind: 'decision',
      title: 'Um plano para cada empresa do grupo',
      prompt:
        'Um grupo tem três empresas na AWS. O laboratório gasta US$ 300 por mês num projeto experimental, sem clientes, e se vira com a documentação. A loja virtual precisa abrir **casos técnicos a qualquer hora**, e uma resposta em menos de 30 minutos para uma pane crítica basta. A processadora de pagamentos quer um **Technical Account Manager (TAM)** designado e resposta em menos de 15 minutos para uma pane crítica. Qual combinação atende com o **menor custo**?',
      concepts: [{ id: 'support.plans' }, { id: 'support.basic' }, { id: 'support.business-plus' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Unified Operations nas três empresas, para nenhuma ficar sem ajuda numa pane.', correct: false, consequence: 'Atende a todos, mas cada empresa pagaria pelo menos US$ 50 mil por mês, inclusive o laboratório que gasta US$ 300.' },
        { id: 'b', text: 'Basic no laboratório, Business Support+ na loja e Enterprise Support nos pagamentos.', correct: true, consequence: 'Cada empresa recebe o que precisa e nada além: o laboratório não paga suporte e só os pagamentos têm TAM.' },
        { id: 'c', text: 'Basic nas três empresas, abrindo casos de conta e cobrança quando houver uma pane.', correct: false, consequence: 'O Basic não abre casos técnicos: a loja e os pagamentos ficariam sem ajuda técnica numa pane.' },
        { id: 'd', text: 'Business Support+ nas três empresas, já que ele responde a panes críticas em 30 minutos.', correct: false, consequence: 'Os pagamentos ficariam sem TAM e sem a resposta em 15 minutos, e o laboratório pagaria por casos que não usa.' },
      ],
      explanation: [
        'O plano adequado é o que cobre as necessidades de cada negócio, não o mais caro. O laboratório não precisa de casos técnicos: o **Basic**, incluído para todos, basta. A loja precisa de casos técnicos 24/7 e de resposta crítica em menos de 30 minutos: **Business Support+**. Os pagamentos pedem TAM e menos de 15 minutos: **Enterprise Support**, o plano mais barato com TAM.',
        'O Unified Operations nas três empresas desperdiça dinheiro de forma recorrente. O Basic em todas deixa sem ajuda quem precisa dela. E o Business Support+ não inclui TAM.',
        '**Regra prática:** escolha o plano por empresa ou por conta, a partir do que cada uma exige (casos técnicos, tempo de resposta, TAM). Plano superdimensionado é custo que cresce junto com o gasto na AWS.',
      ],
    },
    {
      id: 'rv:support.pricing:minimo',
      kind: 'decision',
      title: 'Quanto custa o suporte da agência',
      prompt:
        'Uma agência gasta **US$ 20 mil por mês** com a AWS. Ela precisa de casos técnicos 24/7 e de resposta em até 1 hora quando a produção cair, mas **não precisa de TAM**. Com a tabela abaixo, qual plano atende com o **menor custo**, e quanto ele custa por mês?',
      exhibits: [
        {
          title: 'Preços dos planos (cobra-se o maior entre o mínimo e o percentual)',
          code: 'Business Support+   mínimo US$ 29 por conta\n                    9% dos primeiros US$ 10 mil de gasto\n                    7% do gasto entre US$ 10 mil e US$ 80 mil\n\nEnterprise Support  mínimo US$ 5 mil\n                    10% dos primeiros US$ 150 mil de gasto',
        },
      ],
      concepts: [{ id: 'support.pricing' }, { id: 'support.business-plus' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Business Support+, por US$ 1,8 mil: 9% sobre todo o gasto do mês.', correct: false, consequence: 'Aplica a primeira faixa ao gasto inteiro. Os percentuais caem por faixa: a parte acima de US$ 10 mil paga 7%.' },
        { id: 'b', text: 'Enterprise Support, por US$ 2 mil: 10% do gasto do mês.', correct: false, consequence: 'Esquece o mínimo de US$ 5 mil, que é maior que os 10%, e paga por um TAM que a agência não pediu.' },
        { id: 'c', text: 'Business Support+, por US$ 1,6 mil: 9% de 10 mil mais 7% de 10 mil.', correct: true, consequence: 'É o plano mais barato com casos técnicos 24/7 e resposta de 1 hora para produção fora do ar.' },
        { id: 'd', text: 'Enterprise Support, por US$ 5 mil: o mínimo, maior que o percentual.', correct: false, consequence: 'A conta está certa, mas o plano não: sem precisar de TAM, a agência pagaria três vezes mais.' },
      ],
      explanation: [
        'Os requisitos (casos técnicos 24/7 e resposta de 1 hora para produção fora do ar) já são atendidos pelo **Business Support+**, e a agência não precisa de TAM. O preço segue faixas: 9% dos primeiros US$ 10 mil (US$ 900) mais 7% dos US$ 10 mil seguintes (US$ 700), total de **US$ 1,6 mil**, bem acima do mínimo de US$ 29.',
        'Aplicar 9% ao gasto inteiro ignora as faixas. No Enterprise, vale o maior entre o mínimo e o percentual: US$ 5 mil, e não US$ 2 mil. Mesmo com a conta certa, ele custa três vezes mais por um TAM que ninguém pediu.',
        '**Regra prática:** nos planos pagos, calcule o percentual faixa por faixa e compare com o mínimo; vale o maior. Antes da conta, confira se o plano mais barato já atende aos requisitos.',
      ],
    },
    {
      id: 'rv:fnd.f02.m1.a2',
      kind: 'decision',
      multiple: true,
      title: 'O que a startup consegue pedir',
      prompt:
        'Uma startup está no plano **Basic**. Nesta semana, ela tem quatro pendências: uma cobrança duplicada na fatura, a necessidade de mais vCPUs do que a cota padrão permite, instâncias que perdem a conexão com o banco de tempos em tempos e uma dúvida sobre a melhor arquitetura para a próxima versão. Quais pedidos ela consegue abrir no AWS Support **sem mudar de plano**? (Escolha DUAS.)',
      concepts: [{ id: 'support.basic' }, { id: 'support.case-types' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um caso de conta e cobrança sobre a cobrança duplicada.', correct: true, consequence: 'Conta e cobrança é atendida em todos os planos, inclusive no Basic.' },
        { id: 'b', text: 'Um caso técnico sobre a perda de conexão com o banco.', correct: false, consequence: 'Casos técnicos exigem um plano pago; no Basic, restam a documentação e o re:Post.' },
        { id: 'c', text: 'Um pedido de aumento de cota de vCPUs.', correct: true, consequence: 'Pedidos de aumento de cota estão disponíveis para todos os clientes.' },
        { id: 'd', text: 'Um caso técnico de severidade "System impaired" sobre o banco.', correct: false, consequence: 'A severidade não muda o tipo do caso: continua técnico, e o Basic não abre casos técnicos.' },
        { id: 'e', text: 'Uma revisão da arquitetura com um TAM designado.', correct: false, consequence: 'TAM designado só existe no Enterprise Support e no Unified Operations.' },
      ],
      explanation: [
        'O AWS Support tem três tipos de caso. **Conta e cobrança** e **aumento de cota** estão disponíveis para todos os clientes, inclusive no Basic. **Técnico** exige um plano pago.',
        'A perda de conexão com o banco é um caso técnico, qualquer que seja a severidade escolhida. A revisão de arquitetura com TAM é do Enterprise Support para cima. No Basic, a startup pode buscar ajuda técnica na documentação e no AWS re:Post.',
        '**Regra prática:** não é preciso plano pago para resolver cobrança ou pedir aumento de cota. Plano pago é para quem precisa abrir casos técnicos.',
      ],
    },
    {
      id: 'rv:fnd.f02.boss.a3',
      kind: 'decision',
      title: 'Checkout lento numa sexta à noite',
      prompt:
        'A Pindorama Varejo tem Business Support+. Numa sexta à noite, o checkout da loja fica **lento, mas as vendas continuam** sendo concluídas. A equipe vai abrir um caso técnico. Qual severidade descreve o impacto, e qual é o tempo de **primeira resposta** que a AWS se esforça para cumprir?',
      concepts: [{ id: 'support.severity' }, { id: 'support.response-times' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Business-critical system down, com resposta em menos de 30 minutos.', correct: false, consequence: 'Exagera o impacto: essa severidade é para funções críticas indisponíveis, com o negócio em risco.' },
        { id: 'b', text: 'Production system down, com resposta em até 1 hora.', correct: false, consequence: 'O sistema não caiu: as vendas continuam, só mais lentas.' },
        { id: 'c', text: 'System impaired, com resposta em até 12 horas.', correct: false, consequence: 'Subestima o impacto: é uma função importante da produção, não uma função secundária.' },
        { id: 'd', text: 'Production system impaired, com resposta em até 4 horas.', correct: true, consequence: 'Função importante da produção degradada, mas funcionando: é exatamente essa severidade.' },
      ],
      explanation: [
        'A severidade descreve o **impacto no negócio**. O checkout é uma função importante da produção, e ele está degradado, mas funcionando: **Production system impaired**, com primeira resposta em até 4 horas nos planos pagos.',
        'Business-critical system down e Production system down são para funções fora do ar. System impaired é para funções que não são críticas. Os tempos são de primeira resposta, não de solução.',
        '**Regra prática:** escolha a severidade pelo que o usuário sente. Degradado mas funcionando é "impaired"; fora do ar é "down"; e só use a severidade crítica quando o negócio estiver em risco.',
      ],
    },
    {
      id: 'rv:fnd.f02.boss.a2',
      kind: 'decision',
      title: 'Resposta em 5 minutos para os pagamentos',
      prompt:
        'A Pindorama Pagamentos processa transações o tempo todo. A diretoria exige que, num incidente crítico, um engenheiro da AWS se engaje **em até 5 minutos** e que especialistas designados acompanhem as operações como uma extensão da equipe, com monitoramento 24/7. Qual plano atende?',
      concepts: [{ id: 'support.unified-ops' }, { id: 'support.enterprise' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Enterprise Support, com TAM designado e resposta crítica em menos de 15 minutos.', correct: false, consequence: 'Tem TAM e responde rápido, mas o compromisso é de menos de 15 minutos, não de 5.' },
        { id: 'b', text: 'Unified Operations, com especialistas designados e resposta crítica de 5 minutos.', correct: true, consequence: 'Inclui Incident Management Engineers, monitoramento 24/7 e resposta de 5 minutos a incidentes críticos.' },
        { id: 'c', text: 'Business Support+, com casos ilimitados e engajamento crítico em menos de 30 minutos.', correct: false, consequence: 'Não tem especialistas designados, e o engajamento crítico é de menos de 30 minutos.' },
        { id: 'd', text: 'Enterprise Support com o AWS Countdown, que acompanha os eventos críticos.', correct: false, consequence: 'O Countdown apoia a preparação de eventos planejados, como lançamentos; não muda o tempo de resposta a incidentes.' },
      ],
      explanation: [
        'Dois requisitos apontam para o **Unified Operations**: a resposta de **5 minutos** a incidentes críticos e os **especialistas designados** (TAM, Domain Specialist Engineers e Incident Management Engineers) atuando como extensão da equipe.',
        'O Enterprise Support responde a sistema crítico em menos de 15 minutos, e o Business Support+, em menos de 30. O AWS Countdown ajuda a preparar eventos planejados e não altera esses tempos.',
        '**Regra prática:** os tempos para sistema crítico fora do ar diferenciam os planos: menos de 30 minutos no Business Support+, menos de 15 no Enterprise e 5 minutos no Unified Operations.',
      ],
    },
    {
      id: 'rv:fnd.f02.m3.a2',
      kind: 'decision',
      title: 'O gabarito de um simulado de 2024',
      prompt:
        'Uma colega estuda com um simulado de 2024: "Uma empresa precisa do acompanhamento de um Technical Account Manager e de resposta rápida para sistemas críticos, pelo **menor custo**. Qual plano?". O gabarito diz Enterprise On-Ramp. Qual é a resposta certa com a oferta de planos de outubro de 2026?',
      concepts: [{ id: 'support.legacy' }, { id: 'support.tam' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Enterprise On-Ramp, como no gabarito, já que ele continua sendo vendido.', correct: false, consequence: 'O On-Ramp está sendo descontinuado e seus clientes vão para o Enterprise Support: não é mais a recomendação.' },
        { id: 'b', text: 'Business Support+, porque responde a sistemas críticos em menos de 30 minutos.', correct: false, consequence: 'Responde rápido, mas não inclui TAM designado, que é requisito da questão.' },
        { id: 'c', text: 'Unified Operations, porque tem o TAM e a resposta mais rápida de todos.', correct: false, consequence: 'Atende ao TAM, mas o mínimo de US$ 50 mil por mês está longe do menor custo.' },
        { id: 'd', text: 'Enterprise Support, o plano vigente mais barato com TAM designado.', correct: true, consequence: 'Com o mínimo reduzido para US$ 5 mil, é o destino dos clientes do On-Ramp e o plano mais barato com TAM.' },
      ],
      explanation: [
        'Os requisitos são **TAM designado** e **menor custo**. Na oferta vigente, o TAM começa no **Enterprise Support**, cujo mínimo caiu de US$ 15 mil para US$ 5 mil. O Enterprise On-Ramp é suportado até 31/12/2026, e seus clientes são migrados para o Enterprise Support.',
        'O gabarito de 2024 estava certo para a época, mas não é a recomendação atual. O Business Support+ não tem TAM. O Unified Operations tem, mas custa muito mais.',
        '**Regra prática:** materiais anteriores a dezembro de 2025 citam Developer, Business e Enterprise On-Ramp como planos atuais. Responda com os planos vigentes: Basic, Business Support+, Enterprise Support e Unified Operations.',
      ],
    },
    {
      id: 'rv:fnd.f02.boss.a4',
      kind: 'decision',
      title: 'A instância que caiu apesar do contrato',
      prompt:
        'A única instância EC2 do sistema de medição da Pindorama Energia ficou horas fora do ar. A empresa tem o Unified Operations e pergunta: "pagamos o plano mais completo; a AWS não garantia que isso não aconteceria?". Qual resposta explica corretamente **de onde vem a disponibilidade** do sistema?',
      concepts: [{ id: 'support.sla-vs-support' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Com o Unified Operations, o SLA do EC2 passa a ser de 100%, e a AWS devolve o prejuízo.', correct: false, consequence: 'Nenhum plano de suporte altera o SLA de um serviço, e o SLA não cobre prejuízos do negócio.' },
        { id: 'b', text: 'O plano define o atendimento; a disponibilidade vem do SLA do EC2 e da arquitetura.', correct: true, consequence: 'A empresa entende que precisa de instâncias em várias zonas e pode pedir os créditos do SLA, se couberem.' },
        { id: 'c', text: 'Os créditos do SLA chegam sozinhos, em dinheiro, na conta bancária da empresa.', correct: false, consequence: 'Créditos de SLA abatem cobranças futuras e precisam ser pedidos por um caso no Support Center.' },
        { id: 'd', text: 'O Unified Operations garante disponibilidade só para instâncias maiores que a dela.', correct: false, consequence: 'Tamanho de instância não tem relação com o plano: nenhum plano garante disponibilidade.' },
      ],
      explanation: [
        'O **plano de suporte** define como e em quanto tempo a AWS responde aos casos. A **disponibilidade** é compromisso do SLA de cada serviço: no EC2, 99,5% por instância e 99,99% por Região para instâncias em duas ou mais zonas. Uma instância única continua sendo um ponto único de falha, qualquer que seja o plano.',
        'Nenhum plano eleva o SLA de um serviço. Os créditos de SLA não são reembolso: abatem cobranças futuras e precisam ser pedidos por um caso no Support Center.',
        '**Regra prática:** alternativa que melhora a disponibilidade contratando um plano de suporte é distrator. Disponibilidade vem da arquitetura: várias zonas, failover e réplicas.',
      ],
    },
    {
      id: 'rv:fnd.f02.trusted-advisor-api',
      kind: 'decision',
      title: 'Recomendações no painel interno',
      prompt:
        'Uma empresa no plano Basic quer ver **todas as verificações do AWS Trusted Advisor** (custo, desempenho, segurança, tolerância a falhas e cotas) e consumi-las **pela API**, para exibi-las no painel interno da equipe. Ela não precisa de TAM nem de recomendações priorizadas pela equipe da conta. Qual plano atende com o **menor custo**?',
      concepts: [{ id: 'support.trusted-advisor' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Continuar no Basic, que já mostra as verificações do Trusted Advisor no console.', correct: false, consequence: 'O Basic só mostra as verificações de cotas e algumas de segurança e tolerância a falhas, e não tem a API.' },
        { id: 'b', text: 'Enterprise Support, que inclui o Trusted Advisor Priority.', correct: false, consequence: 'Atende, mas o Priority traz recomendações priorizadas que a empresa disse não precisar: custa mais sem necessidade.' },
        { id: 'c', text: 'Business Support+, que inclui todas as verificações e a API.', correct: true, consequence: 'É o plano mais barato com todas as verificações do Trusted Advisor e acesso pela API.' },
        { id: 'd', text: 'Unified Operations, o único plano com acesso ao Trusted Advisor pela API.', correct: false, consequence: 'A API já vem a partir do Business Support+; o Unified Operations custa pelo menos US$ 50 mil por mês.' },
      ],
      explanation: [
        'O requisito é ter **todas as verificações** e a **API** do Trusted Advisor pelo menor custo. Os dois vêm em qualquer plano pago, e o mais barato é o **Business Support+**.',
        'O Basic mostra só as verificações de cotas e algumas de segurança e tolerância a falhas, sem API. O Trusted Advisor Priority, com recomendações priorizadas pela equipe da conta, é do Enterprise Support e do Unified Operations, e a empresa não precisa dele.',
        '**Regra prática:** no Trusted Advisor, o Basic tem o essencial (cotas e algumas verificações); os planos pagos, todas as verificações e a API; o Priority começa no Enterprise Support.',
      ],
    },
  ],
}
