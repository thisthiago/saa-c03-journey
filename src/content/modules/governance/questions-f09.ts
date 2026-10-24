/**
 * Questões da fase 9 (recomendações e escolha do serviço), no formato do exame
 * SAA-C03. Os fatos são os dos conceitos da trilha, conferidos em 21/10/2026
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ExamQuestion } from '../../../engine/types'

export const F09_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q.gov.ta-basic',
    concept: 'ops.trusted-advisor-checks',
    related: ['support.trusted-advisor'],
    difficulty: 1,
    domain: 'd4',
    stem: ['A Editora Palavra Viva está no plano de suporte **Basic** e abre o AWS Trusted Advisor para ver as recomendações das suas contas.'],
    question: 'O que ela encontra no console?',
    options: [
      { id: 'a', text: 'As verificações de limites de serviço e algumas de segurança e tolerância a falhas', correct: true, why: 'É o conjunto de verificações liberado no plano Basic.' },
      { id: 'b', text: 'Todas as verificações de todas as categorias, sem atualização automática', correct: false, why: 'A lista completa de verificações exige um plano de suporte pago.' },
      { id: 'c', text: 'Apenas as verificações de otimização de custo das contas', correct: false, why: 'As verificações de custo fazem parte dos planos pagos.' },
      { id: 'd', text: 'Nenhuma verificação, porque o Trusted Advisor exige um plano pago', correct: false, why: 'No plano Basic há um conjunto de verificações disponível no console.' },
    ],
    explanation: [
      'No plano **Basic**, o console do Trusted Advisor traz as verificações de **limites de serviço** e um conjunto de verificações de **segurança** e **tolerância a falhas**.',
      'Todas as verificações, inclusive as de **otimização de custo** e **desempenho**, e o acesso pela API exigem um plano de suporte pago.',
    ],
  },
  {
    id: 'q.gov.ta-org',
    concept: 'ops.trusted-advisor-checks',
    difficulty: 2,
    domain: 'd4',
    stem: ['A Rede Mercado Tropical tem oito contas numa organização com todos os recursos ativados e um plano de suporte pago na conta de gerenciamento. A segurança quer saber quais contas têm recomendações abertas de permissão de bucket do S3, sem abrir o console de cada uma.'],
    question: 'Qual a solução com menos esforço?',
    options: [
      { id: 'a', text: 'Ativar a visão da organização do Trusted Advisor e criar um relatório', correct: true, why: 'O relatório reúne as verificações das contas membro.' },
      { id: 'b', text: 'Pedir que cada conta exporte um arquivo do Trusted Advisor e juntar à mão', correct: false, why: 'É o trabalho manual que a visão da organização evita.' },
      { id: 'c', text: 'Criar um orçamento no AWS Budgets para cada conta', correct: false, why: 'O Budgets acompanha custos, não verificações de segurança.' },
      { id: 'd', text: 'Ativar o faturamento consolidado', correct: false, why: 'O faturamento consolidado não reúne as verificações do Trusted Advisor.' },
    ],
    explanation: ['A **visão da organização** do Trusted Advisor reúne as verificações de todas as contas num relatório. Ela exige o Organizations com todos os recursos ativados e um plano pago na conta de gerenciamento.'],
  },
  {
    id: 'q.gov.health-public',
    concept: 'ops.health',
    difficulty: 2,
    domain: 'd2',
    stem: ['A Distribuidora Rota Norte vê na imprensa que o Amazon S3 tem uma falha em uma Região. A diretoria quer saber se isso afeta **as contas da distribuidora** e quais recursos estão envolvidos.'],
    question: 'Onde o plantão deve olhar?',
    options: [
      { id: 'a', text: 'No AWS Health Dashboard, na parte Your account health, depois de entrar na conta', correct: true, why: 'Mostra os eventos específicos da conta, com os recursos afetados, além dos públicos.' },
      { id: 'b', text: 'Apenas na página pública Service health, que lista os recursos afetados de cada cliente', correct: false, why: 'A página pública traz só eventos públicos, sem recursos de uma conta.' },
      { id: 'c', text: 'No AWS CloudTrail, que registra os problemas dos serviços', correct: false, why: 'O CloudTrail registra chamadas de API, não problemas de serviço.' },
      { id: 'd', text: 'No AWS Config, que avisa de falhas na AWS', correct: false, why: 'O Config avalia a configuração dos recursos.' },
    ],
    explanation: ['O **Service health** é público e não pede login; o **Your account health** mostra os eventos **públicos** e os **da conta**, com os recursos afetados.'],
  },
  {
    id: 'q.gov.health-auto',
    concept: 'ops.health',
    related: ['ops.which-service'],
    difficulty: 2,
    domain: 'd2',
    stem: ['A Editora Horizonte quer **abrir automaticamente um chamado interno** quando o AWS Health publicar um evento que afete a conta, **sem alguém olhar o painel** e **sem contratar um plano de suporte pago**.'],
    question: 'Qual solução atende a esse requisito?',
    options: [
      { id: 'a', text: 'Regra do EventBridge para os eventos do Health, com alvo que abre o chamado', correct: true, why: 'Os eventos do Health chegam ao EventBridge sem custo adicional, e a regra aciona o alvo.' },
      { id: 'b', text: 'Um script que consulta a API do AWS Health de minuto em minuto', correct: false, why: 'A API do AWS Health exige um plano de suporte pago.' },
      { id: 'c', text: 'Um alarme do CloudWatch sobre uma métrica de eventos do Health', correct: false, why: 'Os eventos do Health chegam pelo EventBridge, não como métricas para alarmes.' },
      { id: 'd', text: 'Uma trilha do CloudTrail entregando os eventos do Health ao S3', correct: false, why: 'O CloudTrail registra chamadas de API, não os eventos de saúde publicados pela AWS.' },
    ],
    explanation: [
      'Os eventos do **AWS Health** que afetam a conta chegam ao **EventBridge** sem custo adicional, em qualquer plano de suporte. Uma regra filtra os eventos desejados e aciona um alvo, como uma função Lambda que abre o chamado.',
      'A **API** do AWS Health, usada para consultar eventos por programa, exige um plano de suporte pago. Reagir por eventos é o caminho que dispensa esse plano.',
    ],
  },
  {
    id: 'q.gov.quota-region',
    concept: 'ops.service-quotas',
    related: ['ops.quota-alarm'],
    difficulty: 3,
    domain: 'd2',
    stem: ['A Rede Horizonte Farma tem um ambiente de recuperação de desastres numa **segunda Região**. Na Região principal, a conta teve a **cota de instâncias aumentada**. No teste do plano, o ambiente de espera **falha ao lançar as instâncias** por limite de cota.'],
    question: 'Qual é a explicação e a correção?',
    options: [
      { id: 'a', text: 'As cotas valem por Região; pedir o mesmo aumento na Região de espera, com antecedência', correct: true, why: 'O aumento é aplicado só à Região em que foi pedido; a de espera continua com a cota padrão.' },
      { id: 'b', text: 'As cotas valem por conta; esperar a propagação do aumento para a outra Região', correct: false, why: 'As cotas de instâncias são por Região, e o aumento não se propaga sozinho.' },
      { id: 'c', text: 'O plano de suporte limita as cotas; migrar a conta para o Enterprise Support', correct: false, why: 'O plano de suporte não altera cotas de serviço.' },
      { id: 'd', text: 'As cotas valem por organização; pedir o aumento na conta de gerenciamento', correct: false, why: 'As cotas são por conta e por Região, não compartilhadas pela organização.' },
    ],
    explanation: [
      'As cotas de recursos do EC2 e da maioria dos serviços são **por conta e por Região**. Um aumento pedido numa Região não vale na outra.',
      'Por isso, um plano de recuperação de desastres precisa das mesmas cotas na Região de espera, pedidas e testadas com antecedência. Descobrir isso durante um desastre atrasa a recuperação.',
    ],
  },
  {
    id: 'q.gov.quota-multi',
    concept: 'ops.quota-alarm',
    related: ['ops.service-quotas'],
    difficulty: 3,
    domain: 'd2',
    stem: ['A Distribuidora Rota Norte abrirá **dez contas novas** numa organização com todos os recursos ativados. Cada conta nova precisa de uma **cota maior de instâncias**, e a equipe quer ser **avisada antes** de qualquer conta chegar perto do limite.'],
    question: 'Quais ações atendem aos requisitos? (Escolha DUAS.)',
    options: [
      { id: 'a', text: 'Um modelo de pedidos do Service Quotas associado à organização', correct: true, why: 'As contas novas pedem os aumentos do modelo automaticamente quando são criadas.' },
      { id: 'b', text: 'Alarmes do CloudWatch sobre o uso das cotas, com um limiar', correct: true, why: 'O alarme avisa quando o uso chega perto da cota, a tempo de pedir um aumento.' },
      { id: 'c', text: 'Um caso no Suporte pedindo o aumento para todas as contas futuras', correct: false, why: 'Pedidos de aumento valem para contas que já existem, não para contas que ainda serão criadas.' },
      { id: 'd', text: 'Um aumento de cota pedido só na conta de gerenciamento', correct: false, why: 'As cotas são por conta: o aumento na conta de gerenciamento não vale para as contas membro.' },
      { id: 'e', text: 'Um modelo de pedidos atualizado depois de as contas serem criadas', correct: false, why: 'Mudar o modelo só afeta contas criadas depois da mudança.' },
    ],
    explanation: [
      'O **modelo de pedidos** do Service Quotas guarda até 10 aumentos de cota e os aplica automaticamente às contas **novas** da organização, desde que todos os recursos do Organizations estejam ativados.',
      'Os **alarmes** do CloudWatch sobre o uso das cotas avisam antes do limite. Juntos, cobrem o começo de cada conta e o acompanhamento depois.',
    ],
  },
  {
    id: 'q.gov.ops-who',
    concept: 'ops.which-service',
    difficulty: 1,
    domain: 'd1',
    stem: ['Na Editora Palavra Viva, um bucket foi apagado numa terça-feira, **há duas semanas**. A diretoria quer saber **quem** apagou, **sem ter configurado nada de especial antes**.'],
    question: 'Qual é o caminho mais simples?',
    options: [
      { id: 'a', text: 'O histórico de eventos do AWS CloudTrail', correct: true, why: 'Guarda 90 dias de eventos de gerenciamento sem configuração, e apagar um bucket é um deles.' },
      { id: 'b', text: 'O histórico de configuração do bucket no AWS Config', correct: false, why: 'Mostra o estado e as mudanças do recurso, mas não a identidade de quem chamou a API, e só se estivesse gravando.' },
      { id: 'c', text: 'Os logs de acesso ao servidor do bucket no S3', correct: false, why: 'Teriam de ter sido ligados antes, e o cenário diz que nada foi configurado.' },
      { id: 'd', text: 'As métricas de requisições do bucket no CloudWatch', correct: false, why: 'Métricas contam requisições; não dizem quem fez cada uma.' },
    ],
    explanation: [
      'O **histórico de eventos** do CloudTrail guarda **90 dias** de eventos de gerenciamento por Região, sem custo e sem configuração. Apagar um bucket é um evento de gerenciamento, registrado com a identidade de quem fez a chamada.',
      'O **Config** responde como o recurso estava; o **CloudTrail** responde quem fez o quê.',
    ],
  },
  {
    id: 'q.gov.ops-mix',
    concept: 'ops.which-service',
    related: ['ops.health', 'ops.trusted-advisor-checks'],
    difficulty: 3,
    domain: 'd2',
    stem: ['A Rede Mercado Tropical monta o plano de plantão para cinco situações: **(1)** saber a memória livre das instâncias, **(2)** descobrir se um problema da AWS afeta a conta, **(3)** saber quem alterou um security group, **(4)** conferir se os volumes estão criptografados e **(5)** ver o que a AWS recomenda para reduzir o gasto.'],
    question: 'Quais pares de situação e serviço estão corretos? (Escolha TRÊS.)',
    options: [
      { id: 'a', text: '(1) O agente do CloudWatch, com um alarme sobre a memória', correct: true, why: 'A memória do sistema operacional chega ao CloudWatch pelo agente instalado na instância.' },
      { id: 'b', text: '(2) O AWS Health, na visão de saúde da conta', correct: true, why: 'Mostra os eventos da AWS que afetam a conta, com os recursos envolvidos.' },
      { id: 'c', text: '(4) O AWS Config, com uma regra de conformidade', correct: true, why: 'O Config avalia a configuração dos recursos com regras, como volumes sem criptografia.' },
      { id: 'd', text: '(3) O AWS Config, pelo histórico do security group', correct: false, why: 'O Config mostra o que mudou; quem fez a chamada é registrado pelo CloudTrail.' },
      { id: 'e', text: '(5) O AWS CloudTrail, pelo registro das chamadas de API', correct: false, why: 'As recomendações de economia vêm do Trusted Advisor e das ferramentas de custo, não do CloudTrail.' },
    ],
    explanation: [
      'Cada serviço de operação responde a uma pergunta. **CloudWatch**, com o agente, mede o sistema. **Health** diz se a AWS tem um problema que afeta a conta. **Config** confere a configuração com regras. **CloudTrail** registra quem fez cada chamada. **Trusted Advisor** e as ferramentas de custo recomendam melhorias.',
      'Em questões com vários serviços, associar cada um à pergunta que ele responde elimina as alternativas rapidamente.',
    ],
  },
]
