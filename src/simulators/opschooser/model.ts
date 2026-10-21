/**
 * Escolha do serviço de operação: qual serviço (ou recurso) responde a cada
 * pergunta de monitoramento, auditoria, conformidade, automação, custos e
 * recomendações, com o menor esforço.
 *
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md):
 * - CloudWatch (métricas e alarmes; agente para memória e disco): https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html
 * - CloudWatch Logs (Logs Insights, filtro de métrica): https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CloudWatchLogsConcepts.html
 * - X-Ray (rastro e mapa de serviços): https://docs.aws.amazon.com/xray/latest/devguide/aws-xray.html
 * - CloudTrail (histórico de 90 dias, trilhas, eventos de dados, organização, Insights): https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
 * - Config (histórico, relações, regras, remediação, agregador): https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html
 * - Systems Manager (Session Manager, Run Command, Patch Manager, Parameter Store): https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html
 * - CloudFormation (templates, change sets, StackSets) e Service Catalog: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
 * - Control Tower, políticas de tags e License Manager: https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html
 * - Custos (Cost Explorer, Budgets, Cost Anomaly Detection, Data Exports): https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html
 * - Trusted Advisor, Health e Service Quotas: https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html
 *
 * A "complexidade relativa" é julgamento de arquitetura do AWS Quest (esforço
 * de configuração e custo), usada só para desempatar opções que atendem aos
 * mesmos requisitos.
 */

export type OpsOption =
  | 'cw-alarm'
  | 'cw-agent'
  | 'logs-insights'
  | 'logs-metric-filter'
  | 'xray'
  | 'ct-history'
  | 'ct-trail'
  | 'ct-trail-data'
  | 'ct-org-trail'
  | 'ct-insights'
  | 'config'
  | 'config-remediation'
  | 'config-aggregator'
  | 'ssm-session'
  | 'ssm-run'
  | 'ssm-patch'
  | 'ssm-param'
  | 'cfn'
  | 'stacksets'
  | 'service-catalog'
  | 'control-tower'
  | 'tag-policy'
  | 'budgets'
  | 'cost-explorer'
  | 'anomaly'
  | 'cur'
  | 'trusted-advisor'
  | 'health'
  | 'quotas'
  | 'license-manager'

export type OpsNeed =
  | 'metric-alert'
  | 'os-metrics'
  | 'query-logs-past'
  | 'alert-on-log-pattern'
  | 'trace-request'
  | 'who-recent'
  | 'who-long'
  | 'who-data'
  | 'who-all-accounts'
  | 'unusual-api'
  | 'config-past'
  | 'compliance-check'
  | 'compliance-all-accounts'
  | 'auto-fix'
  | 'shell-no-ports'
  | 'command-at-scale'
  | 'patch-fleet'
  | 'config-outside-code'
  | 'replicate-env'
  | 'many-accounts'
  | 'self-service-approved'
  | 'governed-accounts'
  | 'standard-tags'
  | 'alert-overspend'
  | 'who-spent'
  | 'unusual-spend'
  | 'detailed-cost-s3'
  | 'aws-recommendations'
  | 'aws-problem-region'
  | 'quota-near-limit'
  | 'license-limit'

export const OPS_NEED_LABEL: Record<OpsNeed, string> = {
  'metric-alert': 'avisar quando uma métrica passar de um limite',
  'os-metrics': 'acompanhar a memória e o disco de dentro do sistema operacional',
  'query-logs-past': 'consultar os logs de ontem para descobrir uma causa',
  'alert-on-log-pattern': 'transformar linhas de um log em número e alarmar quando passarem de um limite',
  'trace-request': 'seguir uma requisição entre vários serviços e ver onde ela demora',
  'who-recent': 'saber quem fez uma ação nos últimos 90 dias, sem configurar nada',
  'who-long': 'guardar o registro de quem fez o quê por mais de 90 dias',
  'who-data': 'saber quem leu ou apagou objetos de um bucket',
  'who-all-accounts': 'registrar o que acontece em todas as contas da organização, inclusive as novas',
  'unusual-api': 'ser avisado quando o ritmo de chamadas de API fugir do normal',
  'config-past': 'ver como um recurso estava configurado no passado e quais outros recursos dependem dele',
  'compliance-check': 'conferir se os recursos seguem as regras da empresa',
  'compliance-all-accounts': 'ver a conformidade de muitas contas e Regiões num lugar só',
  'auto-fix': 'corrigir sozinho os recursos que saírem do padrão',
  'shell-no-ports': 'entrar numa instância sem abrir portas de entrada',
  'command-at-scale': 'rodar o mesmo comando em centenas de instâncias',
  'patch-fleet': 'aplicar as correções de segurança aprovadas, com relatório de conformidade',
  'config-outside-code': 'guardar configurações das aplicações fora do código',
  'replicate-env': 'recriar um ambiente inteiro a partir de um modelo, com pré-visualização das mudanças',
  'many-accounts': 'implantar o mesmo conjunto de recursos em várias contas e Regiões',
  'self-service-approved': 'deixar os times lançarem sozinhos só ambientes aprovados',
  'governed-accounts': 'criar contas novas já com os controles da organização aplicados',
  'standard-tags': 'padronizar a grafia das tags em todas as contas',
  'alert-overspend': 'ser avisado antes de o gasto do mês passar do orçamento',
  'who-spent': 'descobrir qual serviço, conta ou time gastou o aumento da fatura',
  'unusual-spend': 'ser avisado de um gasto fora do padrão, sem definir um limite fixo',
  'detailed-cost-s3': 'receber no S3 os dados mais detalhados de custo e uso',
  'aws-recommendations': 'ver as recomendações da AWS de custo, segurança, desempenho e tolerância a falhas',
  'aws-problem-region': 'saber se um problema da AWS está afetando a minha conta e a minha Região',
  'quota-near-limit': 'ser avisado quando o uso chega perto da cota de um serviço',
  'license-limit': 'impedir o uso de mais licenças do que o contrato permite',
}

export interface OpsOptionInfo {
  name: string
  summary: string
  meets: OpsNeed[]
  limits: string[]
  /** 1 (mais simples e barato) a 5. Julgamento de arquitetura, só para desempate. */
  complexity: number
}

export const OPS_OPTIONS: Record<OpsOption, OpsOptionInfo> = {
  'cw-alarm': { name: 'Alarme do CloudWatch', summary: 'Vigia uma métrica e avisa ou age quando ela passa de um limite.', meets: ['metric-alert'], limits: ['Só vê as métricas que existem: memória e disco do sistema operacional exigem o agente.'], complexity: 2 },
  'cw-agent': { name: 'Agente do CloudWatch com alarme', summary: 'Envia memória, disco e logs de dentro da instância; o alarme vigia essas métricas.', meets: ['metric-alert', 'os-metrics'], limits: ['Exige instalar e configurar o agente em cada instância.'], complexity: 3 },
  'logs-insights': { name: 'CloudWatch Logs Insights', summary: 'Consulta os logs já guardados, depois do fato, cobrando por GB lido.', meets: ['query-logs-past'], limits: ['É uma consulta sob demanda: não alarma sozinha.'], complexity: 2 },
  'logs-metric-filter': { name: 'Filtro de métrica e alarme', summary: 'Transforma as linhas de log que casam com um padrão em uma métrica, e um alarme vigia a métrica.', meets: ['alert-on-log-pattern'], limits: ['Só conta eventos novos e só existe na classe Standard.'], complexity: 3 },
  xray: { name: 'AWS X-Ray', summary: 'Segue uma requisição pelos serviços e mostra o tempo e os erros de cada um.', meets: ['trace-request'], limits: ['A aplicação precisa ser instrumentada, e a amostragem limita o que é rastreado.'], complexity: 3 },
  'ct-history': { name: 'Histórico de eventos do CloudTrail', summary: '90 dias de eventos de gerenciamento, por Região, sem custo e sem configuração.', meets: ['who-recent'], limits: ['Não guarda mais de 90 dias nem mostra eventos de dados.'], complexity: 1 },
  'ct-trail': { name: 'Trilha do CloudTrail', summary: 'Entrega os eventos de gerenciamento ao S3, onde ficam pelo tempo que você quiser.', meets: ['who-recent', 'who-long'], limits: ['Uma trilha comum não registra eventos de dados nem outras contas.'], complexity: 2 },
  'ct-trail-data': { name: 'Trilha com eventos de dados', summary: 'Uma trilha que também registra o que se faz dentro dos recursos, como ler ou apagar objetos do S3.', meets: ['who-recent', 'who-long', 'who-data'], limits: ['Os eventos de dados são cobrados por evento.'], complexity: 3 },
  'ct-org-trail': { name: 'Trilha da organização', summary: 'Uma trilha criada na conta de gerenciamento que registra todas as contas, inclusive as novas.', meets: ['who-recent', 'who-long', 'who-all-accounts'], limits: ['Só a conta de gerenciamento (ou um administrador delegado) a cria.'], complexity: 3 },
  'ct-insights': { name: 'CloudTrail Insights', summary: 'Descobre a linha de base de chamadas e de erros e avisa quando o ritmo foge dela.', meets: ['unusual-api'], limits: ['Tem cobrança por evento analisado.'], complexity: 3 },
  config: { name: 'AWS Config', summary: 'Guarda como cada recurso estava configurado, as relações entre eles e confere a configuração com regras.', meets: ['config-past', 'compliance-check'], limits: ['Mostra o estado, não quem fez a chamada, e vale por conta e Região.'], complexity: 2 },
  'config-remediation': { name: 'Config com remediação automática', summary: 'Regras do Config ligadas a documentos de automação do Systems Manager que corrigem o que saiu do padrão.', meets: ['config-past', 'compliance-check', 'auto-fix'], limits: ['Automatize só correções simples e seguras.'], complexity: 3 },
  'config-aggregator': { name: 'Config com agregador', summary: 'Reúne a configuração e a conformidade de várias contas e Regiões numa visão somente leitura.', meets: ['config-past', 'compliance-check', 'compliance-all-accounts'], limits: ['O agregador só lê: não implanta regras.'], complexity: 3 },
  'ssm-session': { name: 'Session Manager', summary: 'Shell interativo sem portas de entrada, bastion nem chaves SSH.', meets: ['shell-no-ports'], limits: ['A instância precisa ser um nó gerenciado.'], complexity: 2 },
  'ssm-run': { name: 'Run Command', summary: 'Executa comandos nos nós remotamente e em escala.', meets: ['command-at-scale'], limits: ['Executa uma vez: não mantém um estado.'], complexity: 2 },
  'ssm-patch': { name: 'Patch Manager', summary: 'Aplica as correções aprovadas por um patch baseline e mostra a conformidade dos patches.', meets: ['patch-fleet'], limits: ['Conformidade com o baseline não prova que o nó seja seguro.'], complexity: 2 },
  'ssm-param': { name: 'Parameter Store', summary: 'Guarda configurações como parâmetros nomeados, com SecureString para valores criptografados.', meets: ['config-outside-code'], limits: ['Para segredos com rotação, o Secrets Manager é mais indicado.'], complexity: 2 },
  cfn: { name: 'CloudFormation', summary: 'Descreve os recursos num template, cria a stack e mostra o efeito de uma atualização com change sets.', meets: ['replicate-env'], limits: ['Uma stack vale para uma conta e uma Região.'], complexity: 2 },
  stacksets: { name: 'CloudFormation StackSets', summary: 'Implanta stacks em várias contas e Regiões numa operação só.', meets: ['replicate-env', 'many-accounts'], limits: ['Exige a conta administradora e o modelo de permissões.'], complexity: 3 },
  'service-catalog': { name: 'Service Catalog', summary: 'Catálogo de produtos aprovados que os times lançam sozinhos, com restrições.', meets: ['self-service-approved'], limits: ['Alguém precisa montar e manter os produtos e os portfólios.'], complexity: 3 },
  'control-tower': { name: 'Control Tower', summary: 'Monta uma landing zone e cria contas com o Account Factory já com os controles aplicados.', meets: ['governed-accounts'], limits: ['Os controles preventivos não valem para a conta de gerenciamento.'], complexity: 4 },
  'tag-policy': { name: 'Política de tags', summary: 'Padroniza chaves e valores das tags, e pode impedir marcações fora do padrão.', meets: ['standard-tags'], limits: ['Não exige que o recurso tenha a tag.'], complexity: 2 },
  budgets: { name: 'AWS Budgets', summary: 'Orçamentos com alertas sobre o valor real e o previsto, e ações opcionais.', meets: ['alert-overspend'], limits: ['Atualiza até três vezes por dia e precisa de um limite fixo.'], complexity: 2 },
  'cost-explorer': { name: 'Cost Explorer', summary: 'Mostra custo e uso dos últimos 13 meses, por serviço, conta ou tag, e prevê 18 meses.', meets: ['who-spent'], limits: ['A divisão por tag exige tags ativadas.'], complexity: 1 },
  anomaly: { name: 'Cost Anomaly Detection', summary: 'Acha gastos fora do padrão com aprendizado de máquina, sem limite fixo.', meets: ['unusual-spend'], limits: ['Pode levar até 24 horas para detectar.'], complexity: 2 },
  cur: { name: 'Data Exports (CUR 2.0)', summary: 'Entrega no S3 os dados mais detalhados de custo e uso.', meets: ['detailed-cost-s3'], limits: ['A análise fica por sua conta, com o Athena ou outra ferramenta.'], complexity: 3 },
  'trusted-advisor': { name: 'Trusted Advisor', summary: 'Recomendações da AWS de custo, desempenho, segurança, tolerância a falhas e limites de serviço.', meets: ['aws-recommendations'], limits: ['Todas as verificações exigem um plano de suporte pago.'], complexity: 1 },
  health: { name: 'AWS Health Dashboard', summary: 'Eventos da AWS que afetam a sua conta e a sua Região, e o estado público dos serviços.', meets: ['aws-problem-region'], limits: ['A API exige um plano de suporte pago; o painel e o EventBridge são gratuitos.'], complexity: 1 },
  quotas: { name: 'Service Quotas', summary: 'Mostra as cotas, pede aumento e permite alarmes do CloudWatch quando o uso chega perto do limite.', meets: ['quota-near-limit'], limits: ['Os aumentos levam tempo para serem analisados.'], complexity: 2 },
  'license-manager': { name: 'AWS License Manager', summary: 'Conta licenças por vCPU, núcleo, soquete ou máquina e aplica limites rígidos ou flexíveis.', meets: ['license-limit'], limits: ['Exige configurar as regras de cada licença.'], complexity: 3 },
}

export interface OpsItem {
  id: string
  text: string
  /** Requisito que decide o caso. */
  dominant: OpsNeed
  /** Todos os requisitos rígidos (inclui o dominante). */
  needs: OpsNeed[]
  concepts?: string[]
}

export function unmetOpsNeeds(item: OpsItem, opt: OpsOption): OpsNeed[] {
  return item.needs.filter((n) => !OPS_OPTIONS[opt].meets.includes(n))
}

/** Melhor opção: atende a todos os requisitos com a menor complexidade. Lança erro se não for única. */
export function bestOpsOption(item: OpsItem, options: OpsOption[]): OpsOption {
  const ok = options.filter((o) => unmetOpsNeeds(item, o).length === 0).sort((a, b) => OPS_OPTIONS[a].complexity - OPS_OPTIONS[b].complexity)
  if (ok.length === 0) throw new Error(`Item ${item.id}: nenhuma opção atende`)
  if (ok[1] && OPS_OPTIONS[ok[1]].complexity === OPS_OPTIONS[ok[0]].complexity) throw new Error(`Item ${item.id}: empate entre ${ok[0]} e ${ok[1]}`)
  return ok[0]
}

export interface OpsVerdict {
  score: number
  status: 'correct' | 'partial' | 'wrong' | 'missed'
  message: string
}

export function judgeOpsChoice(item: OpsItem, pick: OpsOption | undefined, options: OpsOption[]): OpsVerdict {
  const best = bestOpsOption(item, options)
  const bestName = OPS_OPTIONS[best].name
  if (!pick) return { score: 0, status: 'missed', message: `Sem escolha. O requisito que decide é ${OPS_NEED_LABEL[item.dominant]}: ${bestName}.` }
  if (pick === best) return { score: 1, status: 'correct', message: `O requisito que decide é ${OPS_NEED_LABEL[item.dominant]}. ${OPS_OPTIONS[best].summary}` }
  const missing = unmetOpsNeeds(item, pick)
  if (missing.length === 0) return { score: 0.5, status: 'partial', message: `Funciona, mas dá mais trabalho ou custa mais do que o caso pede. ${OPS_OPTIONS[pick].limits[0]} ${bestName} atende com menos.` }
  return { score: 0, status: 'wrong', message: `${OPS_OPTIONS[pick].name} não atende: ${missing.map((n) => OPS_NEED_LABEL[n]).join('; ')}. A opção adequada é ${bestName}.` }
}
