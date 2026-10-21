/**
 * Conceitos da Fase 9 — Recomendações e escolha do serviço.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F09_GOV_CONCEPTS: ConceptDef[] = [
  {
    id: 'ops.trusted-advisor-checks',
    title: 'Trusted Advisor na prática',
    officialName: 'AWS Trusted Advisor checks and organizational view',
    serviceIds: ['aws.trusted-advisor'],
    summary: 'O **Trusted Advisor** examina o seu ambiente e recomenda ações para **economizar**, melhorar **disponibilidade e desempenho** e **fechar brechas de segurança**. Com um plano de suporte pago, todas as verificações aparecem no console e na API, e a **visão da organização** reúne o resultado de todas as contas num relatório. No plano Basic, só há as verificações de limites de serviço e algumas de segurança e tolerância a falhas.',
    facts: [
      'As verificações do Trusted Advisor estão disponíveis para quem tem o plano Business Support+, Enterprise Support ou Unified Operations.',
      'As verificações se agrupam em seis categorias: otimização de custo, desempenho, segurança, tolerância a falhas, limites de serviço e excelência operacional.',
      'No plano Basic, o console traz todas as verificações da categoria de limites de serviço e seis das categorias de segurança e tolerância a falhas (snapshots públicos do EBS e do RDS, permissões de buckets do S3, MFA na conta raiz, portas específicas liberadas em security groups e uso do endpoint global do STS); não há atualização automática, e as de segurança precisam ser atualizadas à mão.',
      'Os planos pagos também dão acesso à API do Trusted Advisor e ao monitoramento do estado das verificações pelo Amazon EventBridge.',
      'A visão da organização reúne as verificações de todas as contas de uma organização com todos os recursos ativados, e a conta de gerenciamento precisa ter um plano pago.',
    ],
    commonMistakes: ['Esperar ver todas as verificações do Trusted Advisor numa conta com o plano Basic', 'Conferir conta por conta, em vez de usar a visão da organização'],
    exam: { domains: ['d4'], relevance: 'media' },
    references: [R.taWhat, R.taOrgView],
    tags: ['custos', 'seguranca'],
  },
  {
    id: 'ops.health',
    title: 'AWS Health: o que afeta a minha conta',
    officialName: 'AWS Health and AWS Health Dashboard',
    serviceIds: ['aws.health', 'aws.eventbridge'],
    summary: 'O **AWS Health** avisa quando uma mudança ou um problema da AWS pode afetar o que você roda. Há dois tipos de evento: os **públicos**, que valem para todo mundo (uma falha do S3 numa Região, mesmo que você não use o S3 lá), e os **específicos da conta**, que citam os seus recursos afetados. A página pública **Service health** não pede login; o **Your account health** mostra os dois tipos para quem entra na conta. Para reagir sozinho, os eventos chegam ao **EventBridge**.',
    facts: [
      'O AWS Health Dashboard é gratuito e não precisa de configuração para quem tem uma conta.',
      'Todos os clientes podem receber os eventos do AWS Health pelo Amazon EventBridge, sem custo adicional.',
      'A API do AWS Health, para integrar com sistemas próprios ou de terceiros, exige um plano Business Support+, Enterprise Support ou Unified Operations.',
      'A página Service health mostra o histórico de interrupções de serviços dos últimos 12 meses e não exige login.',
      'Os eventos públicos não chegam pelas notificações gerenciadas do AWS User Notifications: para recebê-los é preciso uma regra do EventBridge ou uma notificação configurada pelo usuário.',
      'Com o AWS Organizations (todos os recursos ativados), a visão da organização mostra os eventos de todas as contas num lugar só, por até 90 dias; recomenda-se delegar o acesso a uma conta membro.',
    ],
    commonMistakes: ['Abrir a página pública de status e concluir que a sua conta não está afetada, sem olhar o Your account health', 'Esperar que o plano Basic dê acesso à API do Health'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.healthWhat, R.healthConcepts, R.healthStatus, R.healthAggregate],
    tags: ['disponibilidade'],
  },
  {
    id: 'ops.service-quotas',
    title: 'Service Quotas',
    officialName: 'Service Quotas',
    serviceIds: ['aws.service-quotas'],
    summary: 'Cada serviço da AWS tem **cotas** (também chamadas de limites): o máximo de recursos ou ações que a sua conta pode ter, em geral **por Região**. O **Service Quotas** mostra as cotas num lugar só, informa se cada uma é **ajustável** e permite **pedir aumento**. Quando o pedido é pequeno, a aprovação costuma ser automática; os maiores passam pelo Suporte e **levam tempo**. O **valor aplicado** é o que vale depois de um aumento, no lugar do valor padrão.',
    facts: [
      'Uma cota é o número máximo de recursos ou operações que se aplica a uma conta ou a uma Região; o número de funções do IAM por conta é uma cota de conta, e o número de VPCs por Região é uma cota de Região.',
      'A coluna de ajustável mostra se a cota pode ser aumentada, e em que nível: da conta ou de um recurso.',
      'Aumentos pequenos costumam ser aprovados automaticamente; os maiores vão para o Suporte, que pode aprovar, negar ou aprovar em parte.',
      'Os pedidos de aumento não recebem atendimento prioritário; para um caso urgente ou um pedido negado, o caminho é contatar o Suporte.',
      'Depois de a conta estar ativa por um tempo, o console mostra um gráfico da utilização, que é a porcentagem da cota em uso.',
    ],
    commonMistakes: ['Esperar o limite estourar em produção para pedir aumento, sendo que o pedido leva tempo', 'Pedir aumento só numa Região e esquecer que a cota vale por Região'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.sqWhat, R.sqRequest],
    tags: ['disponibilidade'],
  },
  {
    id: 'ops.quota-alarm',
    title: 'Alarme de cota e modelo de pedidos',
    officialName: 'Service Quotas CloudWatch alarms and request templates',
    serviceIds: ['aws.service-quotas', 'aws.cloudwatch', 'aws.organizations'],
    summary: 'Para não descobrir o limite pela falha, crie um **alarme do CloudWatch** na cota: ele avisa quando o uso chega perto de um **limiar** que você escolhe, a tempo de pedir o aumento. Para contas novas de uma organização, um **modelo de pedidos** (request template) pede os aumentos sozinho quando cada conta é criada. A **Gestão automática** também monitora o uso e avisa antes de a cota acabar.',
    facts: [
      'Em quotas que oferecem esse recurso, o console permite criar um alarme do CloudWatch com um limiar escolhido; o nome do alarme precisa ser único na conta.',
      'O modelo de pedidos vale só para contas membro de uma organização com todos os recursos ativados, e não funciona com o faturamento consolidado apenas.',
      'O modelo aceita até 10 cotas e só funciona em Regiões comerciais que não exigem ativação manual.',
      'Mudar o modelo não altera as cotas de contas que já existem; só vale para as contas novas.',
      'Desativar a associação do modelo faz as contas novas receberem os valores padrão da AWS, sem apagar os pedidos do modelo.',
    ],
    commonMistakes: ['Esperar que o modelo de pedidos aumente as cotas das contas já existentes', 'Criar o ambiente de espera numa Região sem pedir lá o mesmo aumento'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.sqAlarms, R.sqTemplates],
    tags: ['disponibilidade'],
  },
  {
    id: 'ops.which-service',
    title: 'Qual serviço responde a cada pergunta',
    officialName: 'Choosing monitoring, auditing and governance services',
    serviceIds: ['aws.cloudwatch', 'aws.cloudtrail', 'aws.config', 'aws.health', 'aws.trusted-advisor', 'aws.cost-explorer', 'aws.systems-manager'],
    summary: 'Cada serviço de operação responde a **uma pergunta**. **CloudWatch**: como está o desempenho agora, e me avise. **CloudTrail**: quem fez a chamada de API. **Config**: como o recurso estava configurado e se segue as regras. **Health**: a AWS tem um problema que me afeta. **Trusted Advisor**: o que a AWS recomenda. **Cost Explorer e Budgets**: quanto gastei, quem gastou e me avise. **Systems Manager**: aja nas instâncias. **CloudFormation**: crie e mude o ambiente de forma repetível. Escolher bem é achar a pergunta antes da ferramenta.',
    facts: [
      'O CloudWatch reúne métricas, logs e alarmes; o CloudTrail registra as chamadas de API; o Config registra a configuração dos recursos e avalia regras.',
      'O AWS Health mostra eventos da AWS que afetam a conta; o Trusted Advisor traz recomendações de custo, desempenho, segurança, tolerância a falhas e limites de serviço.',
      'O Cost Explorer analisa custo e uso; o Budgets alerta ao passar de um limite; o Cost Anomaly Detection acha gastos fora do padrão.',
    ],
    commonMistakes: ['Procurar quem apagou um recurso no CloudWatch, em vez de no CloudTrail', 'Usar o CloudTrail para saber se um recurso está dentro das regras, em vez do Config'],
    exam: { domains: ['d1', 'd2', 'd4'], relevance: 'alta' },
    references: [R.cwWhat, R.trailWhat, R.cfgWhat, R.healthWhat, R.taWhat],
    tags: ['fundamentos'],
  },
]
