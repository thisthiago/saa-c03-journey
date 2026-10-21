/** Desafio final — Central de Operações (empresa fictícia: Atlas Transportes). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const ATLAS: ArchitectureLabConfig = {
  title: 'Relatório da Central de Operações',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  groups: [{ id: 'sobra', title: 'Custo ou esforço além do que o requisito pede' }],
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 21/10/2026.',
  steps: [
    {
      id: 'alarmes',
      title: 'Alarmes dos servidores',
      intro: 'A **Atlas Transportes** roda o rastreio de entregas em instâncias EC2. Na semana passada, uma instância ficou sem memória e travou sem ninguém perceber. O serviço de rastreio publica um batimento a cada minuto, e a diretoria quer ser avisada se ele parar.',
      questions: [
        {
          id: 'metrica',
          prompt: 'Como acompanhar a memória das instâncias?',
          options: [
            { id: 'agente', label: 'Instalar o agente do CloudWatch e criar um alarme sobre a métrica de memória usada', scores: { resiliente: 1, requisitos: 1, desempenho: 1 }, consequence: 'A memória do sistema operacional chega ao CloudWatch, e o alarme avisa antes de a instância travar.', concepts: ['cw.agent', 'cw.alarm'] },
            { id: 'padrao', label: 'Criar um alarme sobre as métricas prontas do EC2', scores: { resiliente: 0.3, requisitos: 0.2, desempenho: 0.4 }, consequence: 'As métricas prontas não incluem a memória, e o alarme olha só a CPU, que estava normal.', whyNot: 'A memória e o disco do sistema operacional só chegam ao CloudWatch com o agente.', concepts: ['cw.agent'] },
            { id: 'arquivo', label: 'Um script que grava a memória num arquivo da instância, lido por quem lembrar', scores: { resiliente: 0.1, requisitos: 0.2, desempenho: 0.3 }, consequence: 'Ninguém é avisado: o arquivo só ajuda quem já suspeita do problema.', whyNot: 'Sem métrica e sem alarme, o problema só é visto depois de causar dano.', concepts: ['cw.alarm'] },
          ],
        },
        {
          id: 'ausentes',
          prompt: 'Como o alarme do batimento deve tratar os pontos que não chegam?',
          options: [
            { id: 'breaching', label: 'Tratar o dado ausente como violando o limite', scores: { resiliente: 1, requisitos: 1 }, consequence: 'Se o serviço parar de enviar o batimento, o alarme dispara em vez de ficar calado.', concepts: ['cw.missing-data'] },
            { id: 'notbreaching', label: 'Tratar o dado ausente como bom', scores: { resiliente: 0.1, requisitos: 0.1 }, consequence: 'O serviço pode ter parado de vez, e o alarme continua verde.', whyNot: 'Quando o dado deveria chegar sempre, a ausência é o sinal do problema.', concepts: ['cw.missing-data'] },
            { id: 'missing', label: 'Deixar o tratamento padrão, que vira sem dados suficientes', scores: { resiliente: 0.5, requisitos: 0.5 }, consequence: 'O alarme muda para sem dados suficientes, um estado que não aciona o aviso de alarme.', whyNot: 'Para um batimento que precisa chegar sempre, tratar a ausência como violação avisa mais depressa.', concepts: ['cw.missing-data'] },
          ],
        },
      ],
    },
    {
      id: 'logs',
      title: 'Logs e erros',
      intro: 'Os logs da aplicação chegam ao CloudWatch Logs, e o auditor exige guardá-los por um ano. A equipe também quer ser avisada quando as linhas de erro passarem de 20 por minuto, e consulta o histórico de vez em quando para investigar.',
      questions: [
        {
          id: 'retencao',
          prompt: 'Qual retenção definir para os grupos de logs?',
          group: 'sobra',
          options: [
            { id: 'um-ano', label: 'Retenção de 365 dias', scores: { custo: 1, requisitos: 1, seguro: 1 }, consequence: 'Os logs ficam pelo prazo do auditor, e o que passa disso é apagado.', concepts: ['logs.retention'] },
            { id: 'nunca', label: 'Deixar o padrão, que nunca expira', scores: { custo: 0.3, requisitos: 1, seguro: 1 }, consequence: 'Atende ao auditor, mas a cobrança de armazenamento cresce sem limite.', whyNot: 'O prazo exigido é de um ano: guardar para sempre custa mais do que o requisito pede.', concepts: ['logs.retention'] },
            { id: 'um-mes', label: 'Retenção de 30 dias', scores: { custo: 1, requisitos: 0.2, seguro: 0.3 }, consequence: 'Os logs de 11 meses atrás somem antes da auditoria.', whyNot: 'Retenção menor que o prazo da auditoria apaga evidências.', concepts: ['logs.retention'] },
          ],
        },
        {
          id: 'erros',
          prompt: 'Como ser avisado quando os erros passarem de 20 por minuto?',
          options: [
            { id: 'filtro', label: 'Grupo da classe Standard, com um filtro de métrica para a palavra ERROR e um alarme sobre a métrica', scores: { requisitos: 1, resiliente: 1, custo: 1 }, consequence: 'Cada linha de erro vira um ponto da métrica, e o alarme avisa quando passa do limite.', concepts: ['logs.metric-filter', 'logs.classes'] },
            { id: 'ia', label: 'Grupo da classe Infrequent Access, para pagar menos na ingestão, com o filtro de métrica', scores: { requisitos: 0, resiliente: 0.2, custo: 0.8 }, consequence: 'A classe Infrequent Access não aceita filtros de métrica, e o alarme nunca é criado.', whyNot: 'Filtros de métrica só funcionam na classe Standard, e a classe não muda depois que o grupo é criado.', concepts: ['logs.classes', 'logs.metric-filter'] },
            { id: 'insights', label: 'Uma consulta do Logs Insights executada à mão a cada minuto', scores: { requisitos: 0.4, resiliente: 0.3, custo: 0.4 }, consequence: 'Funciona só enquanto alguém lembrar, e a cobrança é por GB lido a cada consulta.', whyNot: 'O Logs Insights serve para perguntas depois do fato; o alarme que avisa sozinho vem de um filtro de métrica.', concepts: ['logs.insights'] },
          ],
        },
      ],
    },
    {
      id: 'auditoria',
      title: 'Auditoria das contas',
      intro: 'A Atlas tem 12 contas numa organização, e novas contas nascem todo mês. O auditor quer saber quem fez o quê em todas elas, inclusive as futuras, por sete anos, e quem leu ou apagou os contratos guardados num bucket do S3. Também exige poder provar que os registros não foram alterados.',
      questions: [
        {
          id: 'trilha',
          prompt: 'Como registrar as chamadas de API de todas as contas?',
          options: [
            { id: 'org', label: 'Uma trilha da organização, criada pela conta de gerenciamento ou por um administrador delegado, entregando os arquivos num bucket central', scores: { seguro: 1, requisitos: 1, resiliente: 1 }, consequence: 'As 12 contas e as contas novas são registradas pela mesma trilha, que as contas membro não podem apagar.', concepts: ['trail.org-trail', 'trail.trails', 'gov.delegated-admin'] },
            { id: 'por-conta', label: 'Uma trilha criada à mão em cada conta', scores: { seguro: 0.5, requisitos: 0.5, resiliente: 0.6 }, consequence: 'Funciona nas contas que alguém lembrou, mas cada conta nova nasce sem registro e cada conta membro pode alterar a própria trilha.', whyNot: 'A trilha da organização cobre as contas novas sozinha e não pode ser alterada pelas contas membro.', concepts: ['trail.org-trail'] },
            { id: 'historico', label: 'Contar com o histórico de eventos de cada conta', scores: { seguro: 0.2, requisitos: 0.1, resiliente: 0.3 }, consequence: 'O histórico guarda só 90 dias de eventos de gerenciamento, bem menos que os sete anos pedidos.', whyNot: 'Guardar por mais tempo exige uma trilha.', concepts: ['trail.event-history'] },
          ],
        },
        {
          id: 'dados',
          prompt: 'Como saber quem leu ou apagou os contratos?',
          group: 'sobra',
          options: [
            { id: 'seletor', label: 'Eventos de dados registrados só para o bucket dos contratos, com seletores avançados', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Leituras e exclusões dos contratos ficam registradas, e o custo cobre só o que importa.', concepts: ['trail.event-types'] },
            { id: 'todos', label: 'Eventos de dados registrados para todos os buckets e todas as funções', scores: { seguro: 1, requisitos: 1, custo: 0.3 }, consequence: 'Atende, mas os eventos de dados são muitos e cobrados à parte.', whyNot: 'Seletores avançados deixam registrar só os eventos de interesse e controlam o custo.', concepts: ['trail.event-types'] },
            { id: 'nenhum', label: 'Só os eventos de gerenciamento, que já vêm ligados', scores: { seguro: 0.2, requisitos: 0.2, custo: 1 }, consequence: 'Ler ou apagar um objeto é evento de dados, que não é registrado por padrão.', whyNot: 'Quem leu ou apagou objetos do S3 só aparece nos eventos de dados.', concepts: ['trail.event-types'] },
          ],
        },
        {
          id: 'integridade',
          prompt: 'Como provar que os registros não foram alterados?',
          options: [
            { id: 'validacao', label: 'Ligar a validação de integridade dos arquivos de log', scores: { seguro: 1, requisitos: 1 }, consequence: 'Os arquivos de resumo assinados permitem provar que nenhum arquivo foi alterado, apagado ou forjado.', concepts: ['trail.integrity'] },
            { id: 'sem', label: 'Confiar no bucket de destino, sem a validação', scores: { seguro: 0.3, requisitos: 0.3 }, consequence: 'Não há como provar ao auditor que os arquivos são os originais.', whyNot: 'A validação de integridade cria hashes e resumos assinados que provam a autenticidade.', concepts: ['trail.integrity'] },
          ],
        },
      ],
    },
    {
      id: 'conformidade',
      title: 'Conformidade das configurações',
      intro: 'A política da Atlas manda: nenhum security group aberto para SSH ao mundo, volumes EBS criptografados e toda conta com a tag CostCenter. O time central quer ver o estado das 12 contas num lugar só, e corrigir sozinho o SSH aberto.',
      questions: [
        {
          id: 'regras',
          prompt: 'Como conferir a política em todos os recursos?',
          options: [
            { id: 'config', label: 'AWS Config com regras gerenciadas: restricted-ssh, encrypted-volumes e required-tags', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Cada recurso recebe um resultado de conformidade, avaliado quando muda, sem escrever código.', concepts: ['cfg.rules', 'cfg.recorder'] },
            { id: 'script', label: 'Um script próprio, executado uma vez por semana, que lê as APIs das contas', scores: { seguro: 0.5, requisitos: 0.5, custo: 0.5 }, consequence: 'Funciona, mas é código para manter e só olha de semana em semana.', whyNot: 'As regras gerenciadas do Config já trazem essas verificações prontas.', concepts: ['cfg.rules'] },
            { id: 'advisor', label: 'Só as verificações do Trusted Advisor', scores: { seguro: 0.4, requisitos: 0.3, custo: 1 }, consequence: 'Traz recomendações da AWS, mas não verifica a política própria da Atlas, como a tag CostCenter.', whyNot: 'O Trusted Advisor não avalia regras escritas pela empresa.', concepts: ['support.trusted-advisor', 'cfg.vs-others'] },
          ],
        },
        {
          id: 'visao',
          prompt: 'Como ver a conformidade das 12 contas num lugar só?',
          options: [
            { id: 'agregador', label: 'Um agregador do Config na conta do time central, com as contas obtidas pelo Organizations', scores: { requisitos: 1, desempenho: 1, custo: 1 }, consequence: 'O time central vê a configuração e a conformidade de todas as contas e Regiões, sem custo adicional pelo agregador.', concepts: ['cfg.aggregator'] },
            { id: 'cada', label: 'Entrar em cada uma das 12 contas para olhar o Config', scores: { requisitos: 0.7, desempenho: 0.3, custo: 0.6 }, consequence: 'Funciona, mas cada auditoria vira uma rodada de 12 logins.', whyNot: 'O agregador reúne tudo numa visão só.', concepts: ['cfg.aggregator'] },
            { id: 'implantar', label: 'Implantar as regras em todas as contas pelo agregador', scores: { requisitos: 0, desempenho: 0.3, custo: 0.5 }, consequence: 'O agregador é somente leitura: não implanta regras nas contas de origem.', whyNot: 'Para implantar regras em várias contas, usam-se pacotes de conformidade ou o StackSets.', concepts: ['cfg.aggregator', 'cfg.conformance-packs'] },
          ],
        },
        {
          id: 'correcao',
          prompt: 'O que corrigir sozinho?',
          options: [
            { id: 'ssh', label: 'Remediação automática do SSH aberto ao mundo; nas demais regras, remediação manual e aviso à equipe', scores: { seguro: 1, resiliente: 1 }, consequence: 'A correção simples e segura acontece sozinha, e as que podem quebrar algo passam por uma pessoa.', concepts: ['cfg.remediation'] },
            { id: 'tudo', label: 'Remediação automática para todas as regras, inclusive as que mexem em volumes e bancos', scores: { seguro: 0.7, resiliente: 0.3 }, consequence: 'Uma correção automática num volume ou banco em produção pode quebrar a aplicação.', whyNot: 'Automatize só as correções simples e testadas.', concepts: ['cfg.remediation'] },
            { id: 'nenhuma', label: 'Só avisar: nenhuma remediação', scores: { seguro: 0.5, resiliente: 0.7 }, consequence: 'Um SSH aberto ao mundo pode ficar assim por dias, até alguém ler o aviso.', whyNot: 'O SSH aberto é um caso simples e seguro de corrigir automaticamente.', concepts: ['cfg.remediation'] },
          ],
        },
      ],
    },
    {
      id: 'servidores',
      title: 'Acesso e correções nos servidores',
      intro: 'Hoje a equipe entra nos servidores por SSH, com a porta 22 aberta e uma chave compartilhada. As correções de segurança são aplicadas à mão, uma instância de cada vez. Os endereços dos serviços internos estão escritos dentro do código, e mudá-los exige novo lançamento.',
      questions: [
        {
          id: 'acesso',
          prompt: 'Como a equipe deve entrar nas instâncias?',
          options: [
            { id: 'session', label: 'Session Manager, controlado por políticas do IAM, com porta 22 fechada', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'Sem portas de entrada, sem bastion e sem chaves compartilhadas, e as sessões podem ser registradas.', concepts: ['ssm.session-manager', 'ssm.managed-node'] },
            { id: 'ssh', label: 'Manter o SSH com a chave compartilhada e restringir a porta 22 ao escritório', scores: { seguro: 0.4, requisitos: 0.8, custo: 1 }, consequence: 'Reduz o risco, mas a chave continua compartilhada e a porta continua aberta.', whyNot: 'O Session Manager dispensa portas de entrada e chaves.', concepts: ['ssm.session-manager'] },
            { id: 'bastion', label: 'Um servidor bastion exposto à internet, com chaves individuais', scores: { seguro: 0.5, requisitos: 0.8, custo: 0.5 }, consequence: 'Uma máquina a mais para manter e proteger, com uma porta aberta ao mundo.', whyNot: 'O Session Manager faz o mesmo trabalho sem servidor extra.', concepts: ['ssm.session-manager'] },
          ],
        },
        {
          id: 'patch',
          prompt: 'Como aplicar as correções de segurança?',
          options: [
            { id: 'patch-manager', label: 'Patch Manager com um patch baseline próprio e uma janela de manutenção agendada', scores: { seguro: 1, requisitos: 1, custo: 1 }, consequence: 'As correções aprovadas são instaladas no horário combinado, e o relatório de conformidade mostra o que falta.', concepts: ['ssm.patch-manager'] },
            { id: 'a-mao', label: 'Continuar entrando em cada instância para aplicar as correções', scores: { seguro: 0.4, requisitos: 0.5, custo: 0.3 }, consequence: 'Instâncias esquecidas ficam sem correção, e não há relatório.', whyNot: 'O Patch Manager automatiza a aplicação e mostra a conformidade.', concepts: ['ssm.patch-manager'] },
          ],
        },
        {
          id: 'config',
          prompt: 'Onde ficam os endereços dos serviços internos?',
          group: 'sobra',
          options: [
            { id: 'padrao', label: 'Parâmetros na camada padrão do Parameter Store', scores: { requisitos: 1, custo: 1, seguro: 1 }, consequence: 'A configuração fica fora do código, muda sem novo lançamento e a camada padrão não tem custo.', concepts: ['ssm.parameter-store'] },
            { id: 'avancada', label: 'Parâmetros na camada avançada do Parameter Store', scores: { requisitos: 1, custo: 0.5, seguro: 1 }, consequence: 'Atende, pagando por recursos que o caso não usa, como políticas de parâmetro.', whyNot: 'Poucos parâmetros pequenos cabem na camada padrão.', concepts: ['ssm.parameter-store'] },
            { id: 'codigo', label: 'Continuar no código, e mudar com um novo lançamento', scores: { requisitos: 0.3, custo: 1, seguro: 0.6 }, consequence: 'Cada mudança de endereço vira uma nova versão da aplicação.', whyNot: 'Configurações fora do código mudam sem novo lançamento.', concepts: ['ssm.parameter-store'] },
          ],
        },
      ],
    },
    {
      id: 'ambientes',
      title: 'Ambientes repetíveis',
      intro: 'A Atlas monta a rede base e os papéis de acesso à mão, em cada conta nova, e já esqueceu um item duas vezes. O time quer atualizar a infraestrutura de produção com segurança. A próxima atualização muda o identificador do banco de dados.',
      questions: [
        {
          id: 'modelo',
          prompt: 'Como descrever e atualizar a infraestrutura?',
          options: [
            { id: 'cfn', label: 'Templates do CloudFormation e um change set revisado antes de cada atualização de produção', scores: { resiliente: 1, requisitos: 1, seguro: 1 }, consequence: 'O ambiente é repetível, e o change set mostra o que será alterado ou substituído antes de executar.', concepts: ['cfn.what', 'cfn.change-sets'] },
            { id: 'console', label: 'Continuar pelo console, com uma lista de conferência', scores: { resiliente: 0.3, requisitos: 0.5, seguro: 0.5 }, consequence: 'A lista ajuda, mas o esquecimento humano continua, e não há pré-visualização.', whyNot: 'O CloudFormation descreve o ambiente em um modelo e mostra o efeito das mudanças.', concepts: ['cfn.what'] },
            { id: 'direto', label: 'Templates do CloudFormation, atualizando a stack direto, sem change set', scores: { resiliente: 0.5, requisitos: 0.8, seguro: 0.7 }, consequence: 'O ambiente é repetível, mas qualquer substituição de recurso só é percebida depois de acontecer.', whyNot: 'Em produção, o change set mostra as substituições antes de executar.', concepts: ['cfn.change-sets'] },
          ],
        },
        {
          id: 'substituicao',
          prompt: 'O change set mostra que mudar o identificador do banco substitui o recurso. O que fazer?',
          options: [
            { id: 'proteger', label: 'Manter o identificador atual; se a troca for inevitável, definir UpdateReplacePolicy como Snapshot e conferir o backup antes de executar', scores: { resiliente: 1, seguro: 1, requisitos: 1 }, consequence: 'O banco antigo deixa um snapshot, e a troca não perde dados.', concepts: ['cfn.update-behaviors', 'cfn.deletion-policies'] },
            { id: 'executar', label: 'Executar o change set como está: o CloudFormation cuida dos dados', scores: { resiliente: 0, seguro: 0.4, requisitos: 0.3 }, consequence: 'O banco novo nasce vazio, e o antigo é apagado conforme a política de substituição.', whyNot: 'Na substituição, o recurso novo é um recurso diferente, com identificador novo; os dados não migram sozinhos.', concepts: ['cfn.update-behaviors'] },
          ],
        },
        {
          id: 'filiais',
          prompt: 'Como entregar a rede base e os papéis em todas as contas, inclusive as novas?',
          group: 'sobra',
          options: [
            { id: 'stackset', label: 'Um StackSet com permissões gerenciadas pelo serviço, implantando também nas contas novas da organização', scores: { requisitos: 1, resiliente: 1, custo: 1 }, consequence: 'Uma operação cria as stacks nas contas, e as contas novas recebem a base sozinhas.', concepts: ['cfn.stacksets'] },
            { id: 'manual', label: 'Criar a stack à mão em cada conta, uma de cada vez', scores: { requisitos: 0.6, resiliente: 0.4, custo: 0.4 }, consequence: 'Funciona, mas é o trabalho repetido que já causou esquecimentos.', whyNot: 'O StackSets implanta em várias contas e Regiões numa operação.', concepts: ['cfn.stacksets'] },
          ],
        },
      ],
    },
    {
      id: 'contas',
      title: 'Contas e controles',
      intro: 'A diretoria quer que cada conta nova já nasça com a base de segurança e que ninguém consiga desligar o registro de auditoria nem criar recursos fora das Regiões aprovadas. Cada time marca os recursos com a tag CostCenter, mas escreve cada um de um jeito, e há recursos sem tag.',
      questions: [
        {
          id: 'criar',
          prompt: 'Como criar as contas novas?',
          options: [
            { id: 'factory', label: 'Control Tower com o Account Factory, numa unidade organizacional com os controles aplicados', scores: { seguro: 1, requisitos: 1, desempenho: 1 }, consequence: 'Cada conta nova já nasce com a base e os controles da unidade organizacional.', concepts: ['gov.account-factory', 'gov.landing-zone'] },
            { id: 'org', label: 'Criar as contas direto no Organizations e configurar a segurança depois, à mão', scores: { seguro: 0.4, requisitos: 0.5, desempenho: 0.4 }, consequence: 'Entre a criação e a configuração, a conta existe sem a base de segurança.', whyNot: 'O Account Factory aplica os baselines e controles ao criar a conta.', concepts: ['gov.account-factory'] },
          ],
        },
        {
          id: 'controles',
          prompt: 'Como impedir que desliguem o registro e criem recursos fora das Regiões aprovadas?',
          options: [
            { id: 'preventivo', label: 'Controles preventivos, aplicados por políticas de controle de serviço, mais regras detectivas do Config para o que já existe', scores: { seguro: 1, requisitos: 1 }, consequence: 'As ações proibidas são negadas, e o que já existe fora do padrão é apontado.', concepts: ['gov.controls', 'gov.org-policies'] },
            { id: 'detectivo', label: 'Só controles detectivos', scores: { seguro: 0.4, requisitos: 0.4 }, consequence: 'O registro pode ser desligado e o recurso criado fora da Região antes de alguém ser avisado.', whyNot: 'Para impedir uma ação, é preciso um controle preventivo; o detectivo só avisa depois.', concepts: ['gov.controls'] },
          ],
        },
        {
          id: 'tags',
          prompt: 'Como padronizar a tag CostCenter e exigir que todo recurso a tenha?',
          options: [
            { id: 'ambos', label: 'Uma política de tags com imposição, mais a regra required-tags do Config', scores: { requisitos: 1, custo: 1 }, consequence: 'A política padroniza a escrita da chave e dos valores, e a regra aponta os recursos sem a tag.', concepts: ['gov.tag-policies', 'cfg.rules'] },
            { id: 'politica', label: 'Só a política de tags', scores: { requisitos: 0.5, custo: 0.6 }, consequence: 'A política não exige que o recurso tenha a tag: os recursos sem tag continuam sem dono.', whyNot: 'Exigir a presença da tag é papel de outro mecanismo, como a regra required-tags do Config.', concepts: ['gov.tag-policies'] },
            { id: 'aviso', label: 'Mandar um e-mail pedindo para escreverem do mesmo jeito', scores: { requisitos: 0.1, custo: 0.2 }, consequence: 'A grafia continua variando, e nada confere a presença da tag.', whyNot: 'Padronização sem imposição não se sustenta com muitos times.', concepts: ['gov.tag-policies'] },
          ],
        },
      ],
    },
    {
      id: 'custos',
      title: 'Custos, limites e avisos da AWS',
      intro: 'A fatura da Atlas cresceu 40% e ninguém soube dizer por quê. Na Black Friday, o ambiente principal e o de espera, em outra Região, vão precisar de bem mais instâncias, e no ano passado a conta bateu no limite de instâncias. A equipe também quer saber quando a AWS tiver um problema que afete as contas.',
      questions: [
        {
          id: 'orcamento',
          prompt: 'Como ser avisado a tempo de um gasto fora do esperado?',
          options: [
            { id: 'previsto', label: 'AWS Budgets com alerta de valor previsto a 80% do orçamento e Cost Anomaly Detection', scores: { custo: 1, requisitos: 1 }, consequence: 'O alerta previsto avisa antes de o dinheiro ser gasto, e a detecção de anomalias acha picos dentro do limite.', concepts: ['fin.budgets', 'fin.anomaly'] },
            { id: 'real', label: 'Só um alerta de valor real a 100% do orçamento', scores: { custo: 0.4, requisitos: 0.4 }, consequence: 'O aviso chega quando o dinheiro já foi gasto, e o Budgets atualiza os dados até três vezes por dia.', whyNot: 'O alerta de valor previsto avisa antes de o limite ser atingido.', concepts: ['fin.budgets'] },
            { id: 'baixo', label: 'Alerta previsto a 20% do orçamento', scores: { custo: 0.5, requisitos: 0.6 }, consequence: 'Dispara no primeiro dia de todo mês e a equipe aprende a ignorá-lo.', whyNot: 'Um limiar abaixo do gasto normal dispara à toa.', concepts: ['fin.budgets'] },
          ],
        },
        {
          id: 'tagscusto',
          prompt: 'Como saber de quem é cada parte da fatura?',
          options: [
            { id: 'ativar', label: 'Ativar a tag CostCenter como tag de alocação de custo, pela conta de gerenciamento, e analisar no Cost Explorer', scores: { custo: 1, requisitos: 1 }, consequence: 'A fatura passa a ser dividida por centro de custo, e o custo sem tag aparece como não alocado.', concepts: ['fin.cost-allocation-tags', 'fin.cost-explorer'] },
            { id: 'so-criar', label: 'Só marcar os recursos com a tag, sem ativá-la', scores: { custo: 0.3, requisitos: 0.3 }, consequence: 'A tag não aparece nos relatórios de custo sem ser ativada.', whyNot: 'As tags de alocação precisam ser ativadas no console de cobrança.', concepts: ['fin.cost-allocation-tags'] },
          ],
        },
        {
          id: 'limites',
          prompt: 'Como evitar bater no limite de instâncias na Black Friday?',
          options: [
            { id: 'antecipado', label: 'Pedir o aumento da cota no Service Quotas com antecedência, nas duas Regiões, e criar alarmes de cota', scores: { resiliente: 1, desempenho: 1, requisitos: 1 }, consequence: 'O ambiente principal e o de espera têm o limite maior antes do pico, e o alarme avisa se o uso se aproximar do teto.', concepts: ['ops.service-quotas', 'ops.quota-alarm'] },
            { id: 'principal', label: 'Pedir o aumento só na Região principal', scores: { resiliente: 0.3, desempenho: 0.7, requisitos: 0.5 }, consequence: 'O ambiente de espera, na outra Região, bate no limite quando for preciso.', whyNot: 'As cotas valem por Região: o ambiente de espera precisa do mesmo aumento.', concepts: ['ops.service-quotas'] },
            { id: 'esperar', label: 'Esperar o erro de limite aparecer e pedir o aumento na hora', scores: { resiliente: 0.1, desempenho: 0.2, requisitos: 0.2 }, consequence: 'Os aumentos levam tempo, e o site fica sem instâncias no pico.', whyNot: 'Pedidos grandes passam pelo Suporte e levam tempo.', concepts: ['ops.service-quotas'] },
          ],
        },
        {
          id: 'saude',
          prompt: 'Como saber quando um problema da AWS afeta as contas?',
          options: [
            { id: 'health', label: 'Regra do EventBridge para os eventos do AWS Health, com a visão da organização para as contas', scores: { resiliente: 1, requisitos: 1 }, consequence: 'Os eventos que afetam as contas chegam sozinhos e aparecem reunidos para toda a organização.', concepts: ['ops.health'] },
            { id: 'publica', label: 'Olhar a página pública de status quando o site ficar lento', scores: { resiliente: 0.3, requisitos: 0.4 }, consequence: 'A página pública mostra só eventos públicos, não cita os recursos das contas, e só é vista depois do incidente.', whyNot: 'Os eventos da conta estão no Your account health e no EventBridge.', concepts: ['ops.health'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'contas-sem-registro',
      when: [
        ['trilha', ['por-conta']],
        ['criar', ['org']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Contas criadas direto no Organizations e trilhas feitas conta a conta: cada conta nova nasce sem registro de auditoria e sem a base de segurança até alguém lembrar.',
      concepts: ['trail.org-trail', 'gov.account-factory'],
    },
    {
      id: 'troca-sem-rede',
      when: [
        ['modelo', ['direto']],
        ['substituicao', ['executar']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Atualizar a stack sem change set e executar a substituição do banco sem proteger os dados: o erro só aparece depois que o banco antigo já foi apagado.',
      concepts: ['cfn.change-sets', 'cfn.update-behaviors'],
    },
    {
      id: 'reativo',
      when: [
        ['limites', ['esperar', 'principal']],
        ['saude', ['publica']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'O limite de instâncias e os problemas da AWS são descobertos pelo incidente: no pico, não haverá tempo de pedir aumento nem de saber se a culpa é da AWS.',
      concepts: ['ops.service-quotas', 'ops.health'],
    },
    {
      id: 'porta-aberta',
      when: [
        ['acesso', ['ssh']],
        ['config', ['codigo']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Chave compartilhada na porta 22 aberta e endereços internos escritos no código: quem obtiver a chave entra nos servidores e vê como a aplicação se conecta.',
      concepts: ['ssm.session-manager', 'ssm.parameter-store'],
    },
  ],
}

export const FINAL_GOV: PhaseDef = {
  ...META.final,
  concepts: [
    'cw.agent',
    'cw.alarm',
    'cw.missing-data',
    'logs.retention',
    'logs.classes',
    'logs.metric-filter',
    'logs.insights',
    'trail.event-history',
    'trail.event-types',
    'trail.trails',
    'trail.org-trail',
    'trail.integrity',
    'cfg.recorder',
    'cfg.rules',
    'cfg.remediation',
    'cfg.conformance-packs',
    'cfg.aggregator',
    'cfg.vs-others',
    'support.trusted-advisor',
    'ssm.managed-node',
    'ssm.session-manager',
    'ssm.patch-manager',
    'ssm.parameter-store',
    'cfn.what',
    'cfn.change-sets',
    'cfn.update-behaviors',
    'cfn.deletion-policies',
    'cfn.stacksets',
    'gov.landing-zone',
    'gov.account-factory',
    'gov.controls',
    'gov.org-policies',
    'gov.tag-policies',
    'gov.delegated-admin',
    'fin.budgets',
    'fin.anomaly',
    'fin.cost-allocation-tags',
    'fin.cost-explorer',
    'ops.service-quotas',
    'ops.quota-alarm',
    'ops.health',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, as cargas e os números são fictícios.'],
  missions: [
    {
      id: 'gov.final.operacoes',
      title: 'Projeto Atlas Transportes',
      type: 'final',
      summary: 'Oito etapas de decisões de operação, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Atlas Transportes',
        role: 'Você é a pessoa responsável pela central de operações da transportadora.',
        situation: 'Servidores que travam sem aviso, logs para guardar por um ano, doze contas para auditar, uma política de configuração a cumprir, acessos por SSH, ambientes montados à mão, contas novas todo mês e uma fatura que cresceu sem explicação.',
        objective: 'Escolher alarmes, logs, auditoria, conformidade, acesso, ambientes, contas e controles de custo que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'ops.health', body: ['Cada pergunta de operação tem o seu serviço: **CloudWatch** mede e alarma, **CloudTrail** registra quem fez, **Config** guarda o estado e as regras, **Systems Manager** age nos servidores, **CloudFormation** repete o ambiente e as ferramentas de custo avisam do gasto. As decisões se cruzam, e o relatório aponta os conflitos.'] },
        { conceptId: 'cfg.vs-others' },
      ],
      activities: [
        {
          id: 'gov.final.operacoes.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Central de Operações',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'cw.agent' }, { id: 'logs.metric-filter' }, { id: 'trail.org-trail' }, { id: 'cfg.aggregator' }, { id: 'ssm.session-manager' }, { id: 'cfn.change-sets' }, { id: 'gov.account-factory' }, { id: 'fin.budgets' }, { id: 'ops.service-quotas' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Um mecanismo que só avisa depois não impede nada, e um que impede não prova quem agiu.'],
          explanation: [
            'Projeto de referência: agente do CloudWatch com alarme de memória e dado ausente tratado como violação no batimento; grupos da classe Standard com retenção de 365 dias e filtro de métrica com alarme para os erros; trilha da organização com eventos de dados só do bucket dos contratos e validação de integridade; Config com regras gerenciadas, agregador e remediação automática só do SSH aberto.',
            'Session Manager, Patch Manager com baseline próprio e parâmetros na camada padrão; CloudFormation com change set e UpdateReplacePolicy Snapshot no banco, StackSet com permissões gerenciadas pelo serviço; Control Tower com Account Factory, controles preventivos e detectivos, política de tags com a regra required-tags; Budgets com alerta previsto, Cost Anomaly Detection, tag de alocação ativada, cotas pedidas nas duas Regiões e eventos do Health pelo EventBridge.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: ATLAS,
        },
      ],
      debrief: { takeaways: ['Cada pergunta de operação tem o seu serviço: medir, registrar quem fez, guardar o estado, agir, repetir e vigiar o custo.', 'O que impede e o que avisa resolvem riscos diferentes, e o registro prova quem agiu.', 'Decisões se cruzam: conta nova sem a base de segurança e sem registro vira ponto cego.'] },
    },
  ],
}
