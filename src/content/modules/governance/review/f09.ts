/**
 * Questões da Revisão da Fase 9 de Monitoramento e governança (Recomendações e
 * escolha), no formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F09: ReviewSet = {
  phaseId: 'gov.f09',
  questions: [
    {
      id: 'rv:gov.f09.m1.a1',
      kind: 'decision',
      title: 'Duas verificações no plano Basic',
      prompt:
        'Uma startup está no plano de suporte **Basic** e quer usar o **Trusted Advisor** para duas coisas: descobrir **snapshots do EBS públicos** e encontrar **instâncias do EC2 quase sem uso**, para cortar custos. Ela só quer pagar um plano de suporte **se for necessário**. Qual é a avaliação correta?',
      concepts: [{ id: 'ops.trusted-advisor-checks' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'As duas verificações aparecem no Basic, sem custo.', correct: false, consequence: 'O Basic não traz as verificações de otimização de custo, como a de instâncias ociosas.' },
        { id: 'b', text: 'Nenhuma aparece: o Trusted Advisor exige um plano pago.', correct: false, consequence: 'O Basic tem um conjunto de verificações, entre elas a de snapshots públicos.' },
        { id: 'c', text: 'Os snapshots aparecem no Basic; as instâncias ociosas, só no pago.', correct: true, consequence: 'A verificação de segurança já está no Basic; a de custo pede o plano pago.' },
        { id: 'd', text: 'As instâncias aparecem no Basic; os snapshots, só no plano pago.', correct: false, consequence: 'É o contrário: snapshots públicos estão no Basic, e as verificações de custo, não.' },
      ],
      explanation: [
        'No plano **Basic**, o Trusted Advisor mostra todas as verificações de **limites de serviço** e algumas de **segurança e tolerância a falhas**, como **snapshots públicos do EBS e do RDS**, permissões de buckets do S3 e MFA na conta raiz. As verificações de **otimização de custo**, como instâncias quase sem uso, exigem um **plano de suporte pago**.',
        'Dizer que as duas aparecem ignora que custo fica fora do Basic. Dizer que nenhuma aparece esquece o conjunto gratuito. A inversão troca as categorias: a gratuita é a de segurança.',
        '**Regra prática:** no Basic, o Trusted Advisor dá limites de serviço e um punhado de verificações de segurança; recomendações de custo pedem um plano pago.',
      ],
    },
    {
      id: 'rv:gov.f09.m1.a2',
      kind: 'decision',
      title: 'Avisos automáticos quando uma verificação muda',
      prompt:
        'Uma empresa no plano **Basic** quer que a equipe receba um aviso **automático** sempre que uma verificação do **Trusted Advisor** mudar de estado, e que um painel próprio leia os resultados **por API**, sem ninguém abrir o console. Qual é o requisito para isso?',
      concepts: [{ id: 'ops.trusted-advisor-checks' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Criar uma regra do EventBridge, que já recebe os eventos no Basic.', correct: false, consequence: 'O monitoramento das verificações pelo EventBridge faz parte dos planos pagos.' },
        { id: 'b', text: 'Chamar a API do Trusted Advisor, liberada em todos os planos.', correct: false, consequence: 'A API do Trusted Advisor exige um plano de suporte pago.' },
        { id: 'c', text: 'Contratar um plano de suporte pago para a conta.', correct: true, consequence: 'O plano pago libera a API e o monitoramento das verificações pelo EventBridge.' },
        { id: 'd', text: 'Atualizar as verificações à mão no console toda manhã.', correct: false, consequence: 'É manual e não alimenta o painel por API, que são os dois requisitos.' },
      ],
      explanation: [
        'A **API do Trusted Advisor** e o **monitoramento do estado das verificações pelo Amazon EventBridge** estão disponíveis nos **planos de suporte pagos**. Sem eles, a conta fica com o console e o conjunto de verificações do Basic, que não se atualiza sozinho.',
        'A regra do EventBridge e a chamada à API supõem recursos que o Basic não tem. Atualizar à mão é exatamente o trabalho que a empresa quer evitar e não entrega dados para o painel.',
        '**Regra prática:** "Trusted Advisor por API ou com avisos automáticos" pede um plano de suporte pago.',
      ],
    },
    {
      id: 'rv:gov.f09.m1.a3',
      kind: 'decision',
      title: 'A visão da organização que não pode ser ativada',
      prompt:
        'Uma rede de lojas tem 12 contas numa organização criada **só com o faturamento consolidado**. A conta de gerenciamento já tem um **plano de suporte pago**. Ao tentar ativar a **visão da organização do Trusted Advisor**, para ver as verificações de todas as contas num relatório, a equipe não consegue. O que falta, com o **menor esforço**?',
      concepts: [{ id: 'ops.trusted-advisor-checks' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Contratar um plano pago em cada uma das 12 contas.', correct: false, consequence: 'O plano pago exigido é o da conta de gerenciamento, que já existe.' },
        { id: 'b', text: 'Ativar todos os recursos do AWS Organizations.', correct: true, consequence: 'Com todos os recursos ativados, a conta de gerenciamento pode ativar a visão da organização.' },
        { id: 'c', text: 'Criar um agregador do AWS Config para as 12 contas.', correct: false, consequence: 'O agregador junta dados do Config, não as verificações do Trusted Advisor.' },
        { id: 'd', text: 'Abrir o Trusted Advisor na Região us-east-1.', correct: false, consequence: 'A Região não é o problema; o modo da organização é.' },
      ],
      explanation: [
        'A **visão da organização** do Trusted Advisor reúne as verificações de todas as contas e gera relatórios por conta. Ela exige uma organização com **todos os recursos ativados** e um **plano pago na conta de gerenciamento**. Uma organização só com faturamento consolidado não atende ao primeiro requisito.',
        'Planos pagos em todas as contas não resolvem o modo da organização. O agregador do Config é outro serviço, e a Região não muda a exigência.',
        '**Regra prática:** recursos que olham a organização inteira, como a visão do Trusted Advisor, pedem o Organizations com todos os recursos ativados.',
      ],
    },
    {
      id: 'rv:gov.f09.categoria',
      kind: 'decision',
      title: 'Por onde começar a lista de recomendações',
      prompt:
        'Com um plano de suporte pago, a equipe recebeu dezenas de recomendações do Trusted Advisor. Depois de uma queda, a diretoria pede para atacar primeiro os itens que **reduzem o risco de indisponibilidade**, como bancos sem réplica em outra zona e volumes sem snapshots recentes. Qual **categoria** filtrar?',
      concepts: [{ id: 'ops.trusted-advisor-checks' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desempenho.', correct: false, consequence: 'Trata de capacidade e velocidade, não de sobreviver a falhas.' },
        { id: 'b', text: 'Tolerância a falhas.', correct: true, consequence: 'É a categoria das verificações de redundância e de backup.' },
        { id: 'c', text: 'Limites de serviço.', correct: false, consequence: 'Avisa de cotas perto do fim, um risco diferente da falta de redundância.' },
        { id: 'd', text: 'Excelência operacional.', correct: false, consequence: 'Reúne práticas de operação; a redundância fica em tolerância a falhas.' },
      ],
      explanation: [
        'O Trusted Advisor agrupa as verificações em **seis categorias**: otimização de custo, desempenho, segurança, **tolerância a falhas**, limites de serviço e excelência operacional. Banco sem réplica em outra zona e volumes sem snapshots são riscos de **disponibilidade**, que ficam em tolerância a falhas.',
        'Desempenho trata de capacidade e velocidade. Limites de serviço avisa de cotas perto do fim. Excelência operacional cobre práticas de operação, sem foco na redundância.',
        '**Regra prática:** sem réplica, sem backup ou numa zona só é tolerância a falhas; recurso parado é custo; acesso aberto é segurança.',
      ],
    },
    {
      id: 'rv:gov.f09.eventos-publicos',
      kind: 'decision',
      title: 'Os avisos de saúde que nunca chegaram',
      prompt:
        'A equipe configurou as **notificações gerenciadas do AWS User Notifications** e recebe por e-mail os eventos do **AWS Health** que citam os recursos da conta. Mas, durante uma **falha geral do S3** na Região que ela usa, nenhum aviso chegou. A equipe quer receber também esse tipo de evento. O que fazer?',
      concepts: [{ id: 'ops.health' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Contratar um plano de suporte pago para receber os eventos públicos.', correct: false, consequence: 'O plano pago libera a API do Health; os eventos chegam ao EventBridge em qualquer plano.' },
        { id: 'b', text: 'Criar uma regra do EventBridge para os eventos do Health.', correct: true, consequence: 'Os eventos públicos chegam pela regra, sem custo adicional.' },
        { id: 'c', text: 'Assinar a página pública Service health por e-mail.', correct: false, consequence: 'A página pública não envia avisos; ela mostra o estado dos serviços e o histórico.' },
        { id: 'd', text: 'Ligar as notificações gerenciadas em todas as Regiões.', correct: false, consequence: 'O problema não é a Região: as notificações gerenciadas não incluem eventos públicos.' },
      ],
      explanation: [
        'O AWS Health tem **eventos da conta**, que citam os recursos afetados, e **eventos públicos**, que valem para todos. Os públicos **não chegam pelas notificações gerenciadas** do User Notifications: para recebê-los, é preciso uma **regra do EventBridge** ou uma notificação configurada pelo usuário. Os eventos do Health chegam ao EventBridge **sem custo adicional**, em qualquer plano.',
        'O plano pago serve para a API do Health, não para receber eventos. A página pública só mostra o estado. Mudar de Região não muda o tipo de evento coberto.',
        '**Regra prática:** para reagir sozinho a eventos do Health, inclusive os públicos, use uma regra do EventBridge.',
      ],
    },
    {
      id: 'rv:gov.f09.m2.a4',
      kind: 'decision',
      title: 'Os eventos de 40 contas para a equipe de operação',
      prompt:
        'Uma empresa tem **40 contas** numa organização com todos os recursos ativados. A equipe de operação trabalha numa **conta membro** e precisa ver os eventos do **AWS Health** de todas as contas num lugar só. A política interna **restringe o acesso à conta de gerenciamento**. Qual solução exige o **menor esforço**?',
      concepts: [{ id: 'ops.health' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Dar à equipe de operação acesso à conta de gerenciamento.', correct: false, consequence: 'Funciona, mas fere a política de restringir a conta de gerenciamento.' },
        { id: 'b', text: 'Uma regra do EventBridge em cada conta, enviando os eventos à conta da equipe.', correct: false, consequence: 'Funciona, mas são 40 regras para criar e manter, e contas novas exigem mais trabalho.' },
        { id: 'c', text: 'A visão da organização do Health, com a conta da equipe como delegada.', correct: true, consequence: 'A equipe vê os eventos de todas as contas sem entrar na conta de gerenciamento.' },
        { id: 'd', text: 'A visão da organização do Trusted Advisor, com um relatório semanal.', correct: false, consequence: 'O Trusted Advisor traz recomendações, não os eventos da AWS que afetam as contas.' },
      ],
      explanation: [
        'Com o Organizations (todos os recursos ativados), a **visão da organização do AWS Health** mostra os eventos de **todas as contas** num lugar só, com filtros por conta, Região e serviço, por até 90 dias. A AWS recomenda **delegar o acesso a uma conta membro**, mantendo a conta de gerenciamento restrita.',
        'Abrir a conta de gerenciamento fere a política. As 40 regras funcionam, mas dão mais trabalho. O Trusted Advisor responde a outra pergunta: o que a AWS recomenda, e não o que a AWS está passando.',
        '**Regra prática:** "eventos do Health de todas as contas, sem usar a conta de gerenciamento" é a visão da organização com um administrador delegado.',
      ],
    },
    {
      id: 'rv:gov.f09.m3.a1',
      kind: 'decision',
      title: 'O triplo de instâncias daqui a três semanas',
      prompt:
        'Uma loja virtual roda numa Região só e prevê **triplicar o número de instâncias** na Black Friday, daqui a **três semanas**. O uso atual já está perto da **cota de vCPUs** sob demanda da conta. A empresa quer **evitar falhas de lançamento** no dia. O que fazer?',
      concepts: [{ id: 'ops.service-quotas' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Pedir o aumento no Service Quotas já, na Região usada.', correct: true, consequence: 'O pedido tem tempo para ser analisado, e a cota maior estará valendo no dia.' },
        { id: 'b', text: 'Pedir o aumento na véspera, com atendimento prioritário.', correct: false, consequence: 'Pedidos de aumento não recebem prioridade, e os grandes levam tempo.' },
        { id: 'c', text: 'Confiar no Auto Scaling, que sobe a cota quando precisa.', correct: false, consequence: 'O Auto Scaling lança instâncias dentro da cota; não a aumenta.' },
        { id: 'd', text: 'Pedir o aumento em todas as Regiões, menos na usada.', correct: false, consequence: 'A cota de vCPUs vale por Região; o pedido tem de ser na Região onde a loja roda.' },
      ],
      explanation: [
        'O **Service Quotas** mostra as cotas, se são ajustáveis, e recebe os **pedidos de aumento**. Pedidos pequenos costumam ser aprovados automaticamente; os **maiores vão para o Suporte** e levam tempo. Por isso o pedido deve sair **com antecedência**, na **Região** em que a carga vai crescer.',
        'Pedidos de aumento não têm atendimento prioritário. O Auto Scaling respeita a cota, não a muda. Pedir em outras Regiões não ajuda a Região usada.',
        '**Regra prática:** crescimento previsto pede aumento de cota com antecedência, na Região certa; não espere o erro de limite.',
      ],
    },
    {
      id: 'rv:gov.f09.m3.a2',
      kind: 'decision',
      title: 'Uma cota marcada como não ajustável',
      prompt:
        'Um novo serviço interno vai precisar de **mais recursos de um tipo** do que a cota permite. No **Service Quotas**, a coluna de ajustável mostra que essa cota é **não ajustável**. O lançamento está marcado para o mês que vem. Qual caminho atende?',
      concepts: [{ id: 'ops.service-quotas' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Pedir o aumento pelo Service Quotas e aguardar o Suporte.', correct: false, consequence: 'O pedido de aumento só existe para cotas ajustáveis.' },
        { id: 'b', text: 'Mudar o desenho para respeitar o limite da cota.', correct: true, consequence: 'A arquitetura passa a caber no máximo definido pelo serviço.' },
        { id: 'c', text: 'Esperar 30 dias de uso, quando a cota passa a ser ajustável.', correct: false, consequence: 'Não existe essa regra; a cota continua não ajustável.' },
        { id: 'd', text: 'Abrir um caso de prioridade alta para liberar a exceção.', correct: false, consequence: 'Uma cota não ajustável tem um máximo fixo; a urgência não muda isso.' },
      ],
      explanation: [
        'A coluna de ajustável mostra se a cota pode ser aumentada, e em que nível. Uma cota **não ajustável** tem um **máximo definido pelo serviço**: não há pedido de aumento, e a saída é **redesenhar** a solução, por exemplo dividindo a carga em mais recursos, contas ou Regiões.',
        'O pedido pelo Service Quotas e o caso no Suporte supõem uma cota ajustável. A ideia de virar ajustável com o tempo não existe.',
        '**Regra prática:** cota ajustável se resolve com pedido antecipado; cota não ajustável se resolve com arquitetura.',
      ],
    },
    {
      id: 'rv:gov.f09.nova-regiao',
      kind: 'decision',
      title: 'Os pedidos de cota para abrir uma segunda Região',
      prompt:
        'Na Região atual, a empresa já teve aprovados três aumentos: **VPCs por Região**, **funções do IAM por conta** e **vCPUs de instâncias sob demanda**. Agora vai abrir uma **segunda Região**, na mesma conta, com o mesmo tamanho de ambiente, e quer evitar erros de limite. Quais pedidos são necessários? (Escolha DUAS.)',
      concepts: [{ id: 'ops.service-quotas' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'O aumento de VPCs por Região, na nova Região.', correct: true, consequence: 'É uma cota de Região: o aumento da Região atual não vale na nova.' },
        { id: 'b', text: 'O aumento de vCPUs sob demanda, na nova Região.', correct: true, consequence: 'A cota de vCPUs também vale por Região e precisa de pedido próprio.' },
        { id: 'c', text: 'O aumento de funções do IAM, na nova Região.', correct: false, consequence: 'É uma cota da conta: o aumento aprovado já vale na conta inteira.' },
        { id: 'd', text: 'Os três aumentos de novo, na Região atual.', correct: false, consequence: 'Os aumentos da Região atual continuam valendo; pedir de novo não muda nada.' },
        { id: 'e', text: 'A cópia automática das cotas entre Regiões, no console.', correct: false, consequence: 'Não existe cópia de cotas entre Regiões; cada cota de Região tem pedido próprio.' },
      ],
      explanation: [
        'Uma cota vale para a **conta** ou para uma **Região**. O número de **funções do IAM** é uma cota **da conta**, já aumentada para a conta inteira. **VPCs por Região** e **vCPUs** sob demanda são cotas **de Região**: o aumento da Região atual não vale na nova, e cada uma precisa de um pedido lá, com antecedência.',
        'Repetir o pedido de funções do IAM é desnecessário, e pedir de novo na Região atual não muda nada. Não há cópia automática de cotas entre Regiões.',
        '**Regra prática:** ao abrir uma Região nova, refaça os pedidos das cotas de Região; as cotas de conta, como as do IAM, já valem.',
      ],
    },
    {
      id: 'rv:gov.f09.m3.a3',
      kind: 'decision',
      title: 'Um aviso aos 80% do limite de vCPUs',
      prompt:
        'O plantão quer receber um aviso no tópico do SNS da equipe quando o uso da **cota de vCPUs** sob demanda passar de **80%**, a tempo de pedir aumento. Quer fazer isso com os **recursos nativos** da AWS, sem scripts. Qual solução atende?',
      concepts: [{ id: 'ops.quota-alarm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um orçamento de uso no Budgets com alerta a 80%.', correct: false, consequence: 'O Budgets acompanha custo e uso cobrado, não a utilização de uma cota.' },
        { id: 'b', text: 'Uma regra do AWS Config sobre o número de instâncias.', correct: false, consequence: 'O Config avalia a configuração dos recursos, não a porcentagem de uma cota em uso.' },
        { id: 'c', text: 'Um alarme do CloudWatch na cota, criado pelo Service Quotas.', correct: true, consequence: 'O alarme dispara no limiar escolhido e avisa o tópico do SNS.' },
        { id: 'd', text: 'Um monitor do Cost Anomaly Detection para o EC2.', correct: false, consequence: 'Ele procura gastos fora do padrão, não uso perto do limite da cota.' },
      ],
      explanation: [
        'Nas cotas que oferecem o recurso, o console do **Service Quotas** cria um **alarme do CloudWatch** com o **limiar escolhido**, como 80% da cota. Uma ação de notificação no alarme, por exemplo um tópico do **SNS**, avisa a equipe a tempo de pedir o aumento.',
        'Budgets e Cost Anomaly Detection olham gastos, não cotas. O Config avalia configurações e não mede a porcentagem de uma cota em uso.',
        '**Regra prática:** "avise antes de a cota acabar" é um alarme do CloudWatch criado no Service Quotas.',
      ],
    },
    {
      id: 'rv:gov.f09.m3.a5',
      kind: 'decision',
      title: 'O modelo de pedidos alterado e as contas antigas',
      prompt:
        'Uma organização usa um **modelo de pedidos** do Service Quotas, que pede 500 de uma cota para cada conta nova. A equipe mudou o modelo para **1.000** e esperava que as **dez contas que já existem** passassem a ter 1.000, o que não aconteceu. O que fazer para as contas existentes?',
      concepts: [{ id: 'ops.quota-alarm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Desativar e reativar a associação do modelo.', correct: false, consequence: 'Desativar faz as contas novas voltarem ao valor padrão; as existentes não mudam.' },
        { id: 'b', text: 'Pedir o aumento no Service Quotas de cada conta existente.', correct: true, consequence: 'As contas existentes recebem o pedido normal; o modelo cuida das novas.' },
        { id: 'c', text: 'Esperar a próxima conta ser criada, que propaga o valor.', correct: false, consequence: 'O modelo vale para cada conta nova, sem propagar nada às antigas.' },
        { id: 'd', text: 'Mudar a organização para só faturamento consolidado.', correct: false, consequence: 'O modelo exige todos os recursos ativados; sem eles, nem as contas novas são atendidas.' },
      ],
      explanation: [
        'O **modelo de pedidos** pede os aumentos **quando cada conta nova é criada**. **Mudar o modelo não altera as cotas das contas que já existem**: para elas, o aumento é pedido normalmente no Service Quotas.',
        'Desativar a associação só faz as contas novas receberem os valores padrão. Criar outra conta não propaga nada. O modelo exige o Organizations com todos os recursos ativados, e voltar ao faturamento consolidado o desligaria.',
        '**Regra prática:** modelo de pedidos é para contas novas; contas existentes pedem aumento uma a uma.',
      ],
    },
    {
      id: 'rv:gov.f09.m4.a2',
      kind: 'decision',
      title: 'O site fora do ar desde ontem',
      prompt:
        'Um security group foi alterado ontem e o site parou. A equipe quer saber **quem fez a alteração** e **como a regra estava antes**, para desfazer exatamente o que mudou. O CloudTrail e o AWS Config já estão ligados na conta. Quais serviços respondem às duas perguntas? (Escolha DUAS.)',
      concepts: [{ id: 'ops.which-service' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'O CloudTrail, para ver quem fez a chamada de API.', correct: true, consequence: 'Ele registra quem chamou, quando e de onde.' },
        { id: 'b', text: 'O AWS Config, para ver a configuração antes e depois.', correct: true, consequence: 'A linha do tempo do recurso mostra a regra anterior.' },
        { id: 'c', text: 'O CloudWatch, para ver as métricas do security group.', correct: false, consequence: 'O CloudWatch mede desempenho; não guarda quem alterou nem a configuração anterior.' },
        { id: 'd', text: 'O Trusted Advisor, para ver a lista de alterações.', correct: false, consequence: 'Ele traz recomendações, não o histórico de alterações.' },
        { id: 'e', text: 'O AWS Health, para ver os eventos da conta.', correct: false, consequence: 'O Health mostra problemas da AWS, não alterações feitas pela equipe.' },
      ],
      explanation: [
        'O **CloudTrail** registra **quem fez a chamada de API**, quando e de onde. O **AWS Config** guarda a **configuração do recurso** ao longo do tempo, com o estado antes e depois. Juntos, eles mostram a ação e o estado, e a equipe desfaz exatamente a mudança.',
        'O CloudWatch mede desempenho. O Trusted Advisor recomenda. O Health avisa de problemas da AWS. Nenhum deles guarda quem alterou nem a regra anterior.',
        '**Regra prática:** "quem fez" é CloudTrail; "como estava" é Config.',
      ],
    },
    {
      id: 'rv:gov.f09.m4.a1:spend',
      kind: 'decision',
      title: 'Quanto cada serviço custou no trimestre',
      prompt:
        'Na reunião de resultados, a diretoria pergunta **quais serviços da AWS mais gastaram em cada mês do último trimestre**, separados por conta. Ninguém configurou nada além do padrão, e a resposta é para hoje. Qual serviço responde?',
      concepts: [{ id: 'ops.which-service' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O AWS Budgets.', correct: false, consequence: 'O Budgets avisa quando um limite é passado; a análise por serviço é do Cost Explorer.' },
        { id: 'b', text: 'O Cost Explorer.', correct: true, consequence: 'Ele mostra o gasto por serviço e por conta, mês a mês, nos últimos meses.' },
        { id: 'c', text: 'O CloudTrail.', correct: false, consequence: 'O CloudTrail registra chamadas de API, não gastos.' },
        { id: 'd', text: 'O Trusted Advisor.', correct: false, consequence: 'Ele recomenda economias, mas não analisa o gasto passado por serviço.' },
      ],
      explanation: [
        'O **Cost Explorer** analisa **custo e uso**, com filtros e agrupamentos por **serviço** e por **conta**, mês a mês, nos últimos meses. A interface é gratuita e responde na hora, sem configuração prévia.',
        'O Budgets avisa de limites. O CloudTrail registra chamadas de API. O Trusted Advisor recomenda onde economizar, mas não mostra o histórico de gastos.',
        '**Regra prática:** "quanto gastei e quem gastou" é Cost Explorer; "me avise ao passar do limite" é Budgets.',
      ],
    },
    {
      id: 'rv:gov.f09.boss.a2',
      kind: 'decision',
      title: 'Um painel único no CloudWatch',
      prompt:
        'Um gerente quer que o plantão use **só um painel do CloudWatch**, com as métricas e os alarmes padrão, para responder às perguntas do dia a dia. A equipe testa quatro perguntas. Qual delas esse painel **não** responde?',
      concepts: [{ id: 'ops.which-service' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A latência do balanceador passou de 500 ms?', correct: false, consequence: 'A latência é uma métrica do balanceador, e o alarme é do CloudWatch.' },
        { id: 'b', text: 'Quem apagou a tabela do DynamoDB ontem?', correct: true, consequence: 'Quem fez a chamada de API é registrado pelo CloudTrail.' },
        { id: 'c', text: 'A CPU das instâncias está alta agora?', correct: false, consequence: 'A CPU é uma métrica padrão do EC2 no CloudWatch.' },
        { id: 'd', text: 'Quantos erros 5xx a API teve na última hora?', correct: false, consequence: 'Os erros por código são métricas que o painel mostra.' },
      ],
      explanation: [
        'O **CloudWatch** responde a perguntas de **desempenho e alarmes**: latência, CPU, erros por código. **Quem apagou** um recurso é uma pergunta de **auditoria**, respondida pelo **CloudTrail**, que registra as chamadas de API.',
        'A latência do balanceador, a CPU das instâncias e os erros da API são métricas que chegam ao CloudWatch sem configuração extra.',
        '**Regra prática:** cada serviço responde a uma pergunta; ache a pergunta antes da ferramenta: desempenho é CloudWatch, autoria é CloudTrail, configuração é Config.',
      ],
    },
  ],
}
