/**
 * Questões da Revisão da Fase 8 de Monitoramento e governança (Custos e
 * orçamentos), no formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'gov.f08',
  questions: [
    {
      id: 'rv:gov.f08.m1.a1',
      kind: 'decision',
      title: 'Cinco contas e cinco faturas',
      prompt:
        'Uma rede de farmácias tem **cinco contas AWS**, cada uma pagando a própria fatura. O financeiro quer **simplificar o pagamento** e **pagar menos** com o uso que já existe, sem mudar nenhuma carga de trabalho. Ao colocar as contas numa organização com faturamento consolidado, quais benefícios a rede passa a ter? (Escolha DUAS.)',
      concepts: [{ id: 'fin.consolidated-billing' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      multiple: true,
      options: [
        { id: 'a', text: 'Uma fatura só, paga pela conta de gerenciamento.', correct: true, consequence: 'A conta de gerenciamento paga as cobranças de todas as contas membro.' },
        { id: 'b', text: 'O uso somado das contas para descontos por volume e compromissos.', correct: true, consequence: 'Os níveis de preço e os descontos de RIs e Savings Plans passam a valer para o conjunto.' },
        { id: 'c', text: 'Um plano de suporte Business gratuito para todas as contas.', correct: false, consequence: 'O faturamento consolidado não inclui planos de suporte.' },
        { id: 'd', text: 'A compra automática de Reserved Instances para o uso estável.', correct: false, consequence: 'Nada é comprado sozinho; os compromissos continuam sendo escolha da empresa.' },
        { id: 'e', text: 'Um desconto fixo de 10% por usar o recurso.', correct: false, consequence: 'O recurso é gratuito e não dá desconto próprio; a economia vem do uso somado.' },
      ],
      explanation: [
        'Com o **faturamento consolidado**, a **conta de gerenciamento paga** as cobranças de todas as contas membro, numa fatura só. O **uso é somado**, o que divide entre as contas os **descontos por volume**, de Reserved Instances e de Savings Plans. O recurso **não custa nada a mais**.',
        'Ele não dá suporte gratuito, não compra compromissos sozinho e não tem desconto próprio.',
        '**Regra prática:** "uma fatura para várias contas" e "aproveitar os descontos por volume" apontam para o faturamento consolidado do Organizations.',
      ],
    },
    {
      id: 'rv:gov.f08.m1.a2',
      kind: 'decision',
      title: 'Uma conta membro querendo pagar a própria fatura',
      prompt:
        'Depois da criação da organização, o gerente de uma **conta membro** recebeu um documento de "fatura" da conta dele e quer **pagá-lo direto**, pelo cartão da unidade, para fechar o orçamento local. O financeiro central quer manter a cobrança **centralizada**. O que explicar ao gerente?',
      concepts: [{ id: 'fin.consolidated-billing' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ele pode pagar a fatura da conta membro, e a conta de gerenciamento é reembolsada.', correct: false, consequence: 'As faturas das contas membro são só informativas; quem paga é a conta de gerenciamento.' },
        { id: 'b', text: 'A fatura dele é só informativa; quem paga é a conta de gerenciamento.', correct: true, consequence: 'O gerente usa o documento para acompanhar o gasto, e a cobrança continua centralizada.' },
        { id: 'c', text: 'Ele precisa sair da organização para receber a cobrança no cartão.', correct: false, consequence: 'Sair da organização perderia os descontos combinados, sem necessidade.' },
        { id: 'd', text: 'A fatura dele já inclui os descontos finais e não muda depois.', correct: false, consequence: 'A conta de gerenciamento pode redistribuir os descontos de volume e de compromissos.' },
      ],
      explanation: [
        'Numa organização, **as faturas das contas membro são só informativas**. Quem paga é a **conta de gerenciamento**, que vê o gasto de cada conta e pode **redistribuir os descontos** de volume e de compromissos.',
        'Pagar direto, sair da organização ou tratar o valor como final ignoram como o faturamento consolidado funciona.',
        '**Regra prática:** numa organização, a fatura de verdade é a da conta de gerenciamento; as das contas membro servem para acompanhar.',
      ],
    },
    {
      id: 'rv:gov.f08.volume-somado',
      kind: 'decision',
      title: 'Seis contas e o mesmo preço por GB',
      prompt:
        'Seis contas de uma empresa guardam cerca de **40 TB cada uma no S3 Standard**, e cada conta paga o **preço da primeira faixa** da tabela, porque nenhuma passa sozinha dos 50 TB. A empresa quer **pagar menos pelo mesmo armazenamento**, sem mover dados nem mudar de classe. Qual solução atende?',
      concepts: [{ id: 'fin.consolidated-billing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Comprar um Savings Plan de computação para o armazenamento.', correct: false, consequence: 'Savings Plans de computação não cobrem armazenamento do S3.' },
        { id: 'b', text: 'Mover todos os dados para os buckets de uma única conta.', correct: false, consequence: 'Funciona para o preço, mas move dados, o que a empresa quer evitar.' },
        { id: 'c', text: 'Juntar as contas numa organização com faturamento consolidado.', correct: true, consequence: 'O uso somado, 240 TB, passa a ser cobrado pelas faixas mais baratas da tabela.' },
        { id: 'd', text: 'Ligar as tags de alocação de custo nas seis contas.', correct: false, consequence: 'Tags dividem a fatura; não mudam o preço por GB.' },
      ],
      explanation: [
        'No **faturamento consolidado**, o **uso das contas é somado** para os descontos por volume. Com 240 TB somados, o armazenamento passa pelas faixas mais baratas da tabela do S3, sem mover dados.',
        'Savings Plans de computação não cobrem S3. Mover dados foge do requisito. Tags organizam, não barateiam.',
        '**Regra prática:** contas separadas pagando faixas de preço separadas perdem os descontos por volume; a organização soma o uso.',
      ],
    },
    {
      id: 'rv:gov.f08.m1.a3:prioritized',
      kind: 'decision',
      title: 'Um Savings Plan que deve servir primeiro à unidade que pagou',
      prompt:
        'A unidade de varejo comprou um **Savings Plan** numa das suas contas. A diretoria quer que o desconto beneficie **primeiro as contas da unidade de varejo** e, se sobrar, **as outras contas da organização**, sem desperdiçar capacidade. Qual configuração de compartilhamento atende?',
      concepts: [{ id: 'fin.discount-sharing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Compartilhamento em toda a organização, sem grupos.', correct: false, consequence: 'Depois da dona, as sobras vão para qualquer conta, sem prioridade para o varejo.' },
        { id: 'b', text: 'Um grupo restrito com as contas do varejo.', correct: false, consequence: 'Nada sai do grupo, mesmo com capacidade sobrando: haveria desperdício.' },
        { id: 'c', text: 'Desligar o compartilhamento na conta dona.', correct: false, consequence: 'O desconto ficaria só na conta dona, e o resto do varejo pagaria preço cheio.' },
        { id: 'd', text: 'Um grupo priorizado com as contas do varejo.', correct: true, consequence: 'Depois da dona, o desconto vai às contas do grupo e, por fim, às outras.' },
      ],
      explanation: [
        'A conta de gerenciamento controla o **compartilhamento** de RIs e Savings Plans. Em **toda a organização**, as sobras vão a qualquer conta depois da dona. Num **grupo priorizado**, vão primeiro às contas do grupo e, por fim, às demais. Num **grupo restrito**, nada sai do grupo.',
        'Sem grupos não há prioridade. O restrito desperdiça. Desligar prende o desconto na conta dona.',
        '**Regra prática:** prioridade sem desperdício é grupo priorizado; isolamento total, aceitando desperdício, é grupo restrito.',
      ],
    },
    {
      id: 'rv:gov.f08.m1.a3:restricted',
      kind: 'decision',
      title: 'Uma unidade que não pode subsidiar as outras',
      prompt:
        'Uma holding tem uma unidade de saúde com **orçamento regulado**: por exigência do órgão regulador, os descontos dos Savings Plans comprados por ela **não podem beneficiar contas de outras unidades**, mesmo que sobre capacidade. As contas da própria unidade devem continuar se beneficiando. Qual configuração atende?',
      concepts: [{ id: 'fin.discount-sharing' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Um grupo restrito com as contas da unidade de saúde.', correct: true, consequence: 'O desconto beneficia a dona e as contas do grupo, e nada sai dele.' },
        { id: 'b', text: 'Um grupo priorizado com as contas da unidade de saúde.', correct: false, consequence: 'As sobras acabariam indo para as outras unidades.' },
        { id: 'c', text: 'Compartilhamento em toda a organização.', correct: false, consequence: 'As sobras iriam para qualquer conta da holding.' },
        { id: 'd', text: 'Tirar a unidade de saúde da organização.', correct: false, consequence: 'Resolve o isolamento, mas perde o faturamento consolidado e os descontos somados.' },
      ],
      explanation: [
        'Num **grupo restrito**, o compromisso beneficia **a dona e só as contas do grupo**; **nada sai do grupo**, mesmo com capacidade sobrando. É o modo para isolar descontos por exigência legal ou de orçamento, aceitando o risco de desperdício.',
        'O grupo priorizado e o compartilhamento em toda a organização deixam sobras saírem. Sair da organização perde o faturamento consolidado.',
        '**Regra prática:** "nada pode sair do grupo" é grupo restrito.',
      ],
    },
    {
      id: 'rv:gov.f08.m2.a4',
      kind: 'decision',
      title: 'O gasto de cinco anos atrás',
      prompt:
        'A auditoria pede que a empresa consiga consultar o gasto de cada mês, por serviço, por **pelo menos cinco anos**. Hoje a equipe usa só a interface do **Cost Explorer**, na configuração padrão, e o analista não encontra os dados de 20 meses atrás. A empresa quer garantir esse histórico **daqui em diante**. O que fazer?',
      concepts: [{ id: 'fin.cost-explorer' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar a granularidade do Cost Explorer de mensal para diária.', correct: false, consequence: 'A granularidade muda o nível de detalhe, não o período guardado; o histórico continua curto.' },
        { id: 'b', text: 'Exportar os dados detalhados de custo para o S3 e guardá-los.', correct: true, consequence: 'Os dados ficam no S3 pelo tempo que a empresa quiser, para comparar anos depois.' },
        { id: 'c', text: 'Usar a previsão do Cost Explorer para estimar o passado.', correct: false, consequence: 'A previsão olha para os próximos 18 meses, não para trás.' },
        { id: 'd', text: 'Ligar o Cost Anomaly Detection para guardar o histórico.', correct: false, consequence: 'Ele detecta gastos fora do padrão; não guarda histórico de custos.' },
      ],
      explanation: [
        'Na configuração padrão, o **Cost Explorer** mostra até os **últimos 13 meses** e prevê os **próximos 18**. Para guardar o histórico pelo tempo que a auditoria exige, é preciso ter **guardado os dados detalhados** de custo e uso no S3, por exemplo com uma exportação do Data Exports.',
        'Trocar a granularidade só detalha o mesmo período, a previsão olha para frente e o Anomaly Detection procura gastos fora do padrão, sem guardar histórico de custos.',
        '**Regra prática:** Cost Explorer para os meses recentes e a previsão; para histórico longo e sob controle da empresa, exporte os dados para o S3.',
      ],
    },
    {
      id: 'rv:gov.f08.api-painel',
      kind: 'decision',
      title: 'Um painel interno que consulta os custos a cada minuto',
      prompt:
        'Um painel interno mostra a 20 equipes o gasto do mês por serviço. Para isso, ele chama a **API do Cost Explorer a cada minuto**, para cada equipe, e a cobrança da API passou a aparecer na fatura. A empresa quer **manter o painel com o menor custo**, sem perder informação útil. O que fazer?',
      concepts: [{ id: 'fin.cost-explorer' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ligar a granularidade horária para reduzir o número de chamadas.', correct: false, consequence: 'Mais detalhe traz mais dados, não menos chamadas; a conta da API continuaria alta.' },
        { id: 'b', text: 'Consultar a API poucas vezes ao dia e guardar o resultado.', correct: true, consequence: 'O painel lê o resultado guardado, e o número de requisições pagas cai muito.' },
        { id: 'c', text: 'Trocar o painel pela interface do console, que é gratuita.', correct: false, consequence: 'O console é gratuito, mas o requisito é manter o painel interno para as equipes.' },
        { id: 'd', text: 'Criar um alarme de faturamento do CloudWatch por equipe.', correct: false, consequence: 'Alarmes avisam quando um limite é passado; não mostram o gasto por serviço no painel.' },
      ],
      explanation: [
        'A **interface** do Cost Explorer é gratuita, mas **cada requisição paginada da API custa US$ 0,01**. Os dados de custo não mudam a cada minuto: o Cost Explorer os atualiza **pelo menos uma vez a cada 24 horas**. Consultar poucas vezes ao dia e guardar o resultado mantém o painel útil e corta quase todas as requisições.',
        'A granularidade horária aumenta o detalhe, não reduz chamadas. Voltar ao console abandona o painel, que é o requisito. Alarmes de faturamento avisam de limites, mas não entregam o gasto por serviço para exibir.',
        '**Regra prática:** a interface do Cost Explorer é gratuita e a API é cobrada por requisição; em painéis, consulte com a frequência com que os dados mudam.',
      ],
    },
    {
      id: 'rv:gov.f08.m2.a3',
      kind: 'decision',
      title: 'Quem criou os recursos antigos',
      prompt:
        'A equipe ativou a tag **createdBy**, gerada pela AWS, para saber **quem criou cada recurso** e dividir os custos. Uma semana depois, os recursos criados **nos últimos dias** aparecem com a tag, mas os **criados nos anos anteriores** não. A equipe acha que a ativação falhou. Qual é a explicação?',
      concepts: [{ id: 'fin.cost-allocation-tags' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'A ativação ainda está em andamento e leva até 30 dias.', correct: false, consequence: 'A ativação leva até cerca de 24 horas; uma semana depois, já terminou.' },
        { id: 'b', text: 'A createdBy só funciona em recursos de contas membro.', correct: false, consequence: 'O problema não é a conta, e sim a data de criação dos recursos.' },
        { id: 'c', text: 'A createdBy só é aplicada aos recursos criados depois da ativação.', correct: true, consequence: 'Os recursos antigos precisam ser marcados por outro meio.' },
        { id: 'd', text: 'A tag precisa ser ativada de novo em cada Região.', correct: false, consequence: 'A ativação é feita no console de cobrança e vale para a conta.' },
      ],
      explanation: [
        'A tag **createdBy**, da AWS, **só é aplicada a recursos criados depois de ela ser ativada**. As tags não são aplicadas a recursos criados antes de existirem. Para os recursos antigos, a marcação tem de ser feita por outro meio.',
        'A ativação leva até cerca de 24 horas, e uma semana depois ela já terminou. A tag não depende de a conta ser membro, e a ativação vale para a conta inteira, sem repetir por Região. O sintoma, só os recursos novos com a tag, aponta para a data de criação.',
        '**Regra prática:** ative as tags de alocação cedo; elas não voltam no tempo.',
      ],
    },
    {
      id: 'rv:gov.f08.boss.a2',
      kind: 'decision',
      title: 'A tag Projeto que não aparece nos relatórios de custo',
      prompt:
        'Numa organização, o administrador de uma **conta membro** marcou os recursos com a tag `Projeto` e tentou **ativá-la como tag de alocação de custo** no console de cobrança da conta dele, sem sucesso. O financeiro quer ver os custos por projeto no Cost Explorer **de todas as contas**. O que fazer?',
      concepts: [{ id: 'fin.cost-allocation-tags' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Dar ao administrador permissão de cobrança na conta membro.', correct: false, consequence: 'Numa organização, só a conta de gerenciamento ativa as tags de alocação.' },
        { id: 'b', text: 'Ativar a tag Projeto pela conta de gerenciamento.', correct: true, consequence: 'Depois da ativação, a tag aparece no Cost Explorer e nos relatórios.' },
        { id: 'c', text: 'Criar uma política de tags com a chave Projeto.', correct: false, consequence: 'Padroniza a escrita, mas não ativa a tag para alocação de custo.' },
        { id: 'd', text: 'Trocar a chave para projeto, em minúsculas.', correct: false, consequence: 'Muda a chave, que continuaria sem ativação.' },
      ],
      explanation: [
        'As **tags de alocação de custo** precisam ser **ativadas no console de cobrança** para aparecer no Cost Explorer e nos relatórios. Numa organização, **só a conta de gerenciamento** ativa as tags. A ativação pode levar até 24 horas.',
        'Permissões na conta membro não resolvem. A política de tags padroniza, não ativa. Trocar a grafia cria outra chave.',
        '**Regra prática:** dividir custos por time ou projeto é marcar os recursos e ativar as tags, pela conta de gerenciamento.',
      ],
    },
    {
      id: 'rv:gov.f08.m2.a5',
      kind: 'decision',
      title: 'Custo por recurso e por hora para análise em SQL',
      prompt:
        'O time de dados quer analisar o custo **por recurso e por hora**, com **consultas em SQL**, escolhendo só as colunas de que precisa, para cruzar com dados internos. Os gráficos do Cost Explorer não bastam. A empresa quer a forma **recomendada** pela AWS. Qual solução atende?',
      concepts: [{ id: 'fin.cur-exports' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Baixar CSVs do Cost Explorer todo dia e juntar à mão.', correct: false, consequence: 'Dá trabalho, não chega ao nível de recurso por hora e não escala.' },
        { id: 'b', text: 'Exportação CUR 2.0 no S3, consultada pelo Athena.', correct: true, consequence: 'Os dados mais detalhados chegam ao S3, com as colunas escolhidas, prontos para SQL.' },
        { id: 'c', text: 'Um orçamento do Budgets para cada recurso.', correct: false, consequence: 'Orçamentos avisam limites; não entregam dados detalhados para análise.' },
        { id: 'd', text: 'O Cost Anomaly Detection com um monitor por recurso.', correct: false, consequence: 'Detecta gastos fora do padrão; não entrega os dados de custo para SQL.' },
      ],
      explanation: [
        'Os **Cost and Usage Reports** entregam no S3 os dados de custo e uso **mais detalhados**, por hora, por recurso ou por tag. O **CUR 2.0**, no **AWS Data Exports**, é a forma recomendada, com colunas escolhidas e consultas em SQL. Os dados são atualizados pelo menos uma vez por dia.',
        'CSVs manuais não escalam. Budgets e Anomaly Detection têm outro papel.',
        '**Regra prática:** "o relatório de custo mais detalhado, por recurso, para análise em SQL" é o CUR 2.0 no Data Exports, consultado com o Athena.',
      ],
    },
    {
      id: 'rv:gov.f08.m3.a2',
      kind: 'decision',
      title: 'Em que dia o alerta de valor real dispara',
      prompt:
        'Uma conta tem um orçamento mensal de **US$ 4.000**, com um alerta de **valor real a 100%**. O gasto foi de **US$ 100 por dia até o dia 11** e passou a **US$ 220 por dia a partir do dia 12**. A diretoria quer entender **em que dia o alerta dispara**, para decidir se ele basta. Qual é a resposta?',
      concepts: [{ id: 'fin.budgets' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'No dia 12, quando o ritmo de gasto diário mudou.', correct: false, consequence: 'Esse seria o comportamento de um alerta de valor previsto, não do real.' },
        { id: 'b', text: 'No dia 30, no fechamento do mês.', correct: false, consequence: 'O alerta real dispara quando o gasto acumulado passa do limite, antes do fechamento.' },
        { id: 'c', text: 'No dia 18, quando o gasto de um só dia dobrou.', correct: false, consequence: 'O alerta olha o acumulado, não o gasto de um dia.' },
        { id: 'd', text: 'No dia 25, quando o acumulado passa do limite.', correct: true, consequence: 'Até o dia 24 são US$ 3.960; no dia 25, US$ 4.180.' },
      ],
      explanation: [
        'O **alerta de valor real** olha o que **já foi gasto**. Até o dia 11 são US$ 1.100; a US$ 220 por dia, o acumulado chega a US$ 3.960 no dia 24 e passa de US$ 4.000 no dia 25. Nesse momento, o dinheiro já foi gasto. Um alerta de **valor previsto** teria avisado logo depois da mudança de ritmo.',
        'O dia 12 é o comportamento do previsto. O alerta real não espera o fechamento nem olha o gasto de um dia.',
        '**Regra prática:** "ser avisado antes de passar do orçamento" é alerta de valor previsto; o real avisa quando o gasto já aconteceu.',
      ],
    },
    {
      id: 'rv:gov.f08.m3.a4',
      kind: 'decision',
      title: 'Parar os gastos de uma conta membro automaticamente',
      prompt:
        'Da **conta de gerenciamento**, o financeiro quer que, ao chegar a 90% do valor previsto, o orçamento de uma conta membro de laboratório **impeça novos lançamentos de instâncias EC2** nela, sem esperar alguém ler o e-mail. Qual configuração do AWS Budgets atende?',
      concepts: [{ id: 'fin.budgets' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma ação de orçamento que aplica uma SCP de negação à conta.', correct: true, consequence: 'Da conta de gerenciamento, a ação aplica a SCP, e novos lançamentos são impedidos.' },
        { id: 'b', text: 'Uma ação de orçamento que para as instâncias EC2 da conta membro.', correct: false, consequence: 'Da conta de gerenciamento, a ação não atua em instâncias EC2 de outra conta.' },
        { id: 'c', text: 'Um alerta de valor real a 90% enviado por e-mail.', correct: false, consequence: 'Só avisa, e depois que o dinheiro foi gasto.' },
        { id: 'd', text: 'Um monitor do Cost Anomaly Detection na conta membro.', correct: false, consequence: 'Avisa de gastos fora do padrão, mas não impede lançamentos.' },
      ],
      explanation: [
        'As **ações de orçamento** podem aplicar uma **política do IAM ou uma SCP**, ou atuar em instâncias EC2 e RDS, de forma automática ou depois de aprovação. **Da conta de gerenciamento**, dá para **aplicar uma SCP a outra conta**, mas **não atuar em instâncias** de outra conta.',
        'Parar instâncias de outra conta não é possível a partir da gerenciamento. Alertas e anomalias só avisam.',
        '**Regra prática:** "impedir novos gastos automaticamente" é ação de orçamento; entre contas, por SCP.',
      ],
    },
    {
      id: 'rv:gov.f08.m3.a6',
      kind: 'decision',
      title: 'Um alerta de orçamento que chegou dez horas depois',
      prompt:
        'Um alerta de orçamento de valor real chegou **cerca de 10 horas depois** de o gasto passar do limite. A equipe abriu um chamado suspeitando de falha no serviço e quer **avisos mais cedo** daqui em diante. Qual é a avaliação correta?',
      concepts: [{ id: 'fin.budgets' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'É uma falha: o Budgets avalia o gasto em tempo real.', correct: false, consequence: 'O Budgets atualiza os dados até três vezes por dia, não em tempo real.' },
        { id: 'b', text: 'É esperado; para avisar antes, usar um alerta de valor previsto.', correct: true, consequence: 'O atraso faz parte do serviço, e o previsto avisa antes de o gasto acontecer.' },
        { id: 'c', text: 'É esperado; para avisar antes, trocar o e-mail por um tópico do SNS.', correct: false, consequence: 'O canal não muda a frequência com que os dados do orçamento são atualizados.' },
        { id: 'd', text: 'É uma falha: o alerta deveria chegar em até 5 minutos.', correct: false, consequence: 'O intervalo entre atualizações costuma ser de 8 a 12 horas.' },
      ],
      explanation: [
        'As informações do **Budgets** são atualizadas **até três vezes por dia**, em geral **8 a 12 horas** depois da atualização anterior. Um atraso de 10 horas é esperado. Para avisar antes, o **alerta de valor previsto** dispara quando a projeção passa do limite, antes de o gasto acontecer.',
        'O serviço não é em tempo real. Trocar o canal não acelera os dados.',
        '**Regra prática:** orçamentos não são alarmes em tempo real; prefira o valor previsto para agir antes.',
      ],
    },
    {
      id: 'rv:gov.f08.m3.a5',
      kind: 'decision',
      title: 'Um monitor de anomalias criado ontem',
      prompt:
        'Depois de um susto com custos, a equipe criou **ontem à tarde** um monitor do **Cost Anomaly Detection** para todos os serviços. Hoje cedo, um serviço que a empresa usa há anos gastou cinco vezes o normal, e **nenhum aviso chegou** ainda. A equipe quer saber se configurou algo errado. Qual é a explicação mais provável?',
      concepts: [{ id: 'fin.anomaly' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'O monitor precisa de um limite em dólares para disparar.', correct: false, consequence: 'O Anomaly Detection não exige limite: ele aprende o padrão de gasto.' },
        { id: 'b', text: 'O serviço precisa de 10 dias de uso antes de ser monitorado.', correct: false, consequence: 'O serviço tem anos de histórico; a regra dos 10 dias vale para serviços novos.' },
        { id: 'c', text: 'O monitor só avisa no fechamento do mês.', correct: false, consequence: 'Ele avalia o custo cerca de três vezes por dia, sem esperar o fechamento do mês.' },
        { id: 'd', text: 'Um monitor novo leva cerca de 24 horas para começar a detectar.', correct: true, consequence: 'Nada está errado; os avisos começam depois desse prazo, com atraso de até 24 horas no uso.' },
      ],
      explanation: [
        'O **Cost Anomaly Detection** acha gastos fora do padrão **sem limites manuais**. Um **monitor novo leva cerca de 24 horas** para começar a detectar, ele roda cerca de três vezes por dia sobre o custo, com **atraso de até 24 horas** em relação ao uso, e um serviço novo precisa de 10 dias de histórico.',
        'Ele não exige limite, não espera o fechamento, e o serviço já tem histórico.',
        '**Regra prática:** "detectar gastos incomuns sem definir limites" é Cost Anomaly Detection; conte com algumas horas de atraso.',
      ],
    },
    {
      id: 'rv:gov.f08.m4.a1:export',
      kind: 'decision',
      title: 'Todas as recomendações de economia numa ferramenta própria',
      prompt:
        'O time de FinOps quer levar **as recomendações de otimização de custos** de todas as contas para a **ferramenta de BI da empresa**, onde cruza com os orçamentos internos, sem copiar recomendações à mão pelo console. Qual solução atende?',
      concepts: [{ id: 'fin.recommendations' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Uma exportação de recomendações pelo Data Exports.', correct: true, consequence: 'As recomendações do Cost Optimization Hub chegam como dados para analisar.' },
        { id: 'b', text: 'Copiar as recomendações de RIs do Cost Explorer todo mês.', correct: false, consequence: 'É manual, depende de alguém lembrar e cobre só as Reserved Instances, sem as demais recomendações.' },
        { id: 'c', text: 'Um orçamento de cobertura de Savings Plans.', correct: false, consequence: 'Acompanha a cobertura, mas não entrega as recomendações.' },
        { id: 'd', text: 'O Cost Anomaly Detection com um monitor por conta.', correct: false, consequence: 'Avisa de gastos fora do padrão; não recomenda economias.' },
      ],
      explanation: [
        'A AWS aponta onde economizar a partir do uso real: o Cost Explorer recomenda Reserved Instances, o Compute Optimizer recomenda tamanhos e tipos, e o **Data Exports** tem um **tipo de exportação para as recomendações de otimização de custos**, vindas do Cost Optimization Hub, para analisar com as próprias ferramentas.',
        'Copiar à mão não escala. Orçamentos e anomalias têm outro papel.',
        '**Regra prática:** compromissos e tamanhos se decidem pelas recomendações do uso real, não pelo que se imagina usar.',
      ],
    },
  ],
}
