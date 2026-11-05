/**
 * Questões da Revisão da Fase 2 de Monitoramento e governança (Logs e
 * rastreamento), no formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'gov.f02',
  questions: [
    {
      id: 'rv:gov.f02.m1.a1:server',
      kind: 'decision',
      title: 'Trinta servidores com as mesmas regras de log',
      prompt:
        'Uma aplicação roda em 30 instâncias EC2, e todas enviam o mesmo tipo de log ao CloudWatch Logs. Todos os logs precisam da **mesma retenção de 90 dias** e dos **mesmos filtros de métrica**, mas a equipe quer continuar sabendo **de qual servidor veio cada linha**. Como organizar?',
      concepts: [{ id: 'logs.groups' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um grupo de logs por servidor, cada um com a retenção e os filtros.', correct: false, consequence: 'Funciona, mas repete a configuração 30 vezes e a cada servidor novo.' },
        { id: 'b', text: 'Um grupo de logs só, com um fluxo de logs para cada servidor.', correct: true, consequence: 'Retenção e filtros são definidos uma vez no grupo, e cada fluxo identifica o servidor.' },
        { id: 'c', text: 'Um fluxo de logs só, com o nome do servidor no começo de cada linha.', correct: false, consequence: 'Todos os servidores escrevendo no mesmo fluxo misturam as linhas sem necessidade.' },
        { id: 'd', text: 'Um grupo de logs por dia, com todos os servidores juntos.', correct: false, consequence: 'Obriga a recriar retenção e filtros todo dia e não separa os servidores.' },
      ],
      explanation: [
        'Os eventos da mesma origem formam um **fluxo de logs**, como os logs de um servidor. Os fluxos que compartilham **retenção, filtros e permissões** ficam num **grupo de logs**, onde essas regras são definidas uma vez e valem para todos os fluxos. Não há limite de fluxos por grupo.',
        'Um grupo por servidor ou por dia repete configuração. Um fluxo único mistura as origens.',
        '**Regra prática:** grupo para as regras em comum, fluxo para cada origem.',
      ],
    },
    {
      id: 'rv:gov.f02.m1.a3',
      kind: 'decision',
      title: 'Um sistema de faturamento fora da AWS',
      prompt:
        'Um sistema de faturamento roda em **servidores Linux no data center** da empresa e grava os logs em arquivos locais. A equipe quer pesquisar e guardar esses logs no **CloudWatch Logs**, junto com os das instâncias EC2, com o **menor esforço**. Qual solução atende?',
      concepts: [{ id: 'logs.sources' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Instalar o agente do CloudWatch nos servidores e indicar os arquivos.', correct: true, consequence: 'O agente lê os arquivos e envia os eventos, também de servidores fora da AWS.' },
        { id: 'b', text: 'Criar um filtro de assinatura no grupo de logs apontando para os servidores.', correct: false, consequence: 'O filtro de assinatura envia logs do CloudWatch para outros destinos, não o contrário.' },
        { id: 'c', text: 'Instalar o daemon do X-Ray, que envia os logs junto com os rastros.', correct: false, consequence: 'O daemon do X-Ray envia segmentos de rastreamento, não arquivos de log.' },
        { id: 'd', text: 'Ligar o monitoramento detalhado do CloudWatch nos servidores.', correct: false, consequence: 'Monitoramento detalhado é do EC2 e trata de métricas, não de arquivos de log.' },
      ],
      explanation: [
        'Os logs chegam ao CloudWatch por três caminhos: a **Lambda** envia sozinha os logs das execuções; vários **serviços da AWS** entregam seus logs; e, em instâncias e servidores, o **agente do CloudWatch** lê os arquivos e os envia. O agente funciona em EC2 e em servidores fora da AWS, em Linux e Windows Server.',
        'O filtro de assinatura faz o caminho contrário. O daemon do X-Ray é para rastros. O monitoramento detalhado é de métricas do EC2.',
        '**Regra prática:** arquivos de log de servidores, na AWS ou fora dela, chegam ao CloudWatch Logs pelo agente do CloudWatch.',
      ],
    },
    {
      id: 'rv:gov.f02.m1.a5',
      kind: 'decision',
      title: 'Logs pesquisáveis por 90 dias e guardados por 7 anos',
      prompt:
        'Uma fintech guarda os logs de transações no CloudWatch Logs, com a retenção no padrão. A equipe consulta só os **últimos 90 dias**, mas a lei exige **guardar 7 anos**. A conta de armazenamento cresce todo mês. Qual solução atende com o **menor custo**?',
      concepts: [{ id: 'logs.retention' }, { id: 'logs.subscription' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Retenção de 7 anos (2557 dias) no próprio grupo de logs.', correct: false, consequence: 'Atende a lei, mas paga o armazenamento do CloudWatch Logs pelos 7 anos.' },
        { id: 'b', text: 'Mudar a classe do grupo atual para Infrequent Access.', correct: false, consequence: 'A classe não muda depois da criação e só barateia a ingestão, não o armazenamento.' },
        { id: 'c', text: 'Retenção de 90 dias e um filtro de assinatura com o Firehose para o S3.', correct: true, consequence: 'O CloudWatch guarda só o que é consultado, e o S3 guarda os 7 anos por bem menos.' },
        { id: 'd', text: 'Manter a retenção padrão e apagar os fluxos antigos à mão todo mês.', correct: false, consequence: 'Trabalho manual, e os logs apagados deixam de existir em qualquer lugar.' },
      ],
      explanation: [
        'Por padrão, os logs ficam guardados **para sempre**. A **retenção** do grupo define por quanto tempo os eventos ficam: aqui, 90 dias. Para guardar por anos a baixo custo, os logs saem do CloudWatch para o **S3**, por exemplo com um **filtro de assinatura** para o **Firehose**, que entrega no S3 quase em tempo real.',
        'Retenção de 7 anos no CloudWatch paga mais caro. A classe não muda depois da criação. Apagar à mão perde os dados.',
        '**Regra prática:** "reduzir o custo do CloudWatch Logs" é definir a retenção; o que precisa ficar anos vai para o S3 antes.',
      ],
    },
    {
      id: 'rv:gov.f02.m1.a4:d30',
      kind: 'decision',
      title: 'Eventos ainda visíveis depois do prazo',
      prompt:
        'Um grupo de logs tem **retenção de 30 dias**. Numa auditoria, o analista encontrou eventos de **31 dias atrás** e abriu um chamado dizendo que a retenção não funciona. A equipe quer responder **sem mudar a configuração** se ela estiver certa. Qual é a resposta?',
      concepts: [{ id: 'logs.retention' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'A retenção só vale para fluxos criados depois da configuração.', correct: false, consequence: 'A retenção é do grupo e vale para todos os fluxos dele.' },
        { id: 'b', text: 'A retenção conta só os dias úteis, então 30 dias são cerca de 6 semanas.', correct: false, consequence: 'A retenção conta dias corridos, e 30 dias são 30 dias de calendário.' },
        { id: 'c', text: 'A exclusão dos vencidos não é imediata e costuma levar até 72 horas.', correct: true, consequence: 'A configuração está certa; os eventos somem nos próximos dias.' },
        { id: 'd', text: 'A retenção de 30 dias não é um valor aceito e foi trocada por 60.', correct: false, consequence: 'Trinta dias é um dos valores fixos aceitos, entre 1 dia e 10 anos.' },
      ],
      explanation: [
        'A **retenção** apaga os eventos que passam do prazo, mas **não no mesmo instante**: a exclusão costuma levar **até 72 horas**. Eventos de 31 dias num grupo de 30 dias são esperados.',
        'A retenção vale para todos os fluxos do grupo, conta dias corridos, e 30 é um valor aceito, entre 1 dia e 10 anos.',
        '**Regra prática:** retenção é limpeza automática com alguma folga; não use o prazo exato como garantia de que um dado já sumiu.',
      ],
    },
    {
      id: 'rv:gov.f02.m3.a1:cheap',
      kind: 'decision',
      title: 'Um grupo novo para depuração volumosa',
      prompt:
        'Uma equipe vai criar um grupo de logs para **logs de depuração muito volumosos**, que só serão lidos **em investigações**, com consultas do **Logs Insights**. Não haverá filtros de métrica nem de assinatura nesse grupo. A empresa quer o **menor custo**. Qual configuração escolher na criação?',
      concepts: [{ id: 'logs.classes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Classe Standard, mudando para Infrequent Access depois do primeiro mês.', correct: false, consequence: 'A classe não pode ser mudada depois que o grupo é criado.' },
        { id: 'b', text: 'Classe Standard com retenção de 1 dia.', correct: false, consequence: 'Paga a ingestão mais cara e apaga os logs antes das investigações.' },
        { id: 'c', text: 'Classe Infrequent Access, consultada pelo Logs Insights.', correct: true, consequence: 'A ingestão custa menos, e o Logs Insights funciona nessa classe.' },
        { id: 'd', text: 'Classe Infrequent Access com um filtro de métrica para os erros.', correct: false, consequence: 'A Infrequent Access não aceita filtros de métrica.' },
      ],
      explanation: [
        'A classe **Infrequent Access** custa menos para **ingerir**, para logs consultados de vez em quando e investigações depois do fato. Ela não tem filtros de métrica nem de assinatura, nem Live Tail, mas aceita o **Logs Insights**. O armazenamento e as consultas custam o mesmo da Standard.',
        'A classe é escolhida na criação e não muda. Retenção de 1 dia perde os logs. A Infrequent Access não aceita filtros de métrica.',
        '**Regra prática:** "reduzir o custo de ingestão de logs consultados raramente" é Infrequent Access, se o grupo não precisar de filtros.',
      ],
    },
    {
      id: 'rv:gov.f02.m2.a4',
      kind: 'decision',
      title: 'Contar só as respostas com erro do servidor',
      prompt:
        'Uma API grava cada requisição como um log em **JSON**, como `{"status": 503, "path": "/pedidos"}`. A equipe quer um filtro de métrica que conte **só as respostas com status 500 ou maior**. Qual padrão de filtro atende?',
      concepts: [{ id: 'logs.filter-patterns' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: '{ $.status >= 500 }', correct: true, consequence: 'Compara o campo status do JSON e conta 500, 503 e qualquer outro acima.' },
        { id: 'b', text: 'status >= 500', correct: false, consequence: 'Sem chaves, o padrão é tratado como termos de texto, e não como comparação de campo.' },
        { id: 'c', text: '{ status >= 500 }', correct: false, consequence: 'Nos padrões JSON, o campo é escolhido com $., como $.status.' },
        { id: 'd', text: '?500 ?502 ?503', correct: false, consequence: 'Conta só esses três valores, e casaria com 500 em qualquer parte da linha, como no path.' },
      ],
      explanation: [
        'Em logs **JSON**, o padrão fica **entre chaves**, usa **$.** para escolher o campo e aceita comparações como >=. `{ $.status >= 500 }` conta toda resposta com status 500 ou maior.',
        'Sem chaves, o padrão vira termos de texto. Sem $., o campo não é reconhecido. Termos opcionais contam só os valores listados e em qualquer parte da linha.',
        '**Regra prática:** texto usa termos (todos obrigatórios, ou opcionais com ?) e diferencia maiúsculas; JSON usa `{ $.campo operador valor }`.',
      ],
    },
    {
      id: 'rv:gov.f02.m2.a5',
      kind: 'decision',
      title: 'Os erros de ontem e os de amanhã',
      prompt:
        'Depois de um incidente ontem, a equipe quer duas coisas: **descobrir quantos erros "PAGAMENTO_RECUSADO" aconteceram ontem** nos logs, que estão num grupo da classe Standard, e **ser avisada** se passarem de 20 por minuto daqui em diante. Quais ações atendem? (Escolha DUAS.)',
      concepts: [{ id: 'logs.metric-filter' }, { id: 'logs.insights' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Consultar os logs de ontem com o CloudWatch Logs Insights.', correct: true, consequence: 'O Logs Insights consulta os logs que já estão guardados.' },
        { id: 'b', text: 'Criar um filtro de métrica para o termo e um alarme sobre a métrica.', correct: true, consequence: 'A partir de agora, cada ocorrência vira um ponto, e o alarme avisa acima de 20 por minuto.' },
        { id: 'c', text: 'Criar o filtro de métrica e ler no gráfico dele os erros de ontem.', correct: false, consequence: 'Filtros de métrica não são retroativos: só contam eventos depois de criados.' },
        { id: 'd', text: 'Criar um filtro de assinatura para contar os erros por minuto.', correct: false, consequence: 'O filtro de assinatura envia eventos a outros destinos; contar é o papel do filtro de métrica.' },
        { id: 'e', text: 'Consultar os logs de ontem pelo painel automático do CloudWatch.', correct: false, consequence: 'Os painéis mostram métricas; a contagem nos logs guardados é do Logs Insights.' },
      ],
      explanation: [
        'O **filtro de métrica** transforma linhas que casam com um padrão em pontos de uma métrica, sobre a qual um **alarme** avisa. Mas ele **não é retroativo**: só conta eventos depois de criado. Para o que já aconteceu, a ferramenta é o **Logs Insights**, que consulta os logs guardados.',
        'O gráfico do filtro não tem o passado. O filtro de assinatura não conta. Painéis mostram métricas existentes.',
        '**Regra prática:** alerta contínuo a partir de logs é filtro de métrica com alarme; investigação do que já passou é Logs Insights.',
      ],
    },
    {
      id: 'rv:gov.f02.filtro-vale-para-o-grupo',
      kind: 'decision',
      title: 'Um alarme de timeout para uma frota inteira',
      prompt:
        'Uma API roda em 25 instâncias de um grupo do Auto Scaling, e o agente envia os logs de todas para o **mesmo grupo de logs**, um fluxo por instância. A equipe quer **um alarme** quando a palavra `TIMEOUT` aparecer mais de 10 vezes por minuto **somando todas as instâncias**, inclusive as que forem criadas depois. Qual solução atende com o **menor esforço**?',
      concepts: [{ id: 'logs.metric-filter' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um filtro de métrica por fluxo e um alarme composto com todos eles.', correct: false, consequence: 'Os fluxos mudam com o Auto Scaling, e o composto combina estados, não soma contagens.' },
        { id: 'b', text: 'Um filtro de métrica no grupo de logs e um alarme sobre a métrica criada.', correct: true, consequence: 'O filtro vale para todos os fluxos do grupo, inclusive os novos, e soma as ocorrências.' },
        { id: 'c', text: 'Uma consulta do Logs Insights agendada a cada minuto pela equipe.', correct: false, consequence: 'Exige alguém ou algo rodando consultas e pagando por GB lido a cada minuto.' },
        { id: 'd', text: 'Um filtro de assinatura para uma Lambda que conta e publica a métrica.', correct: false, consequence: 'Funciona, mas é código para manter, quando um filtro de métrica já conta.' },
      ],
      explanation: [
        'Os **filtros de métrica** são definidos no **grupo** e valem para **todos os fluxos** dele, inclusive os que surgirem depois. Um filtro só, com um alarme sobre a métrica criada, soma as ocorrências de toda a frota.',
        'Filtros por fluxo não acompanham o Auto Scaling. Consultas agendadas e Lambdas próprias são esforço para o que o filtro já faz.',
        '**Regra prática:** "gerar um alarme a partir de mensagens nos logs" é filtro de métrica com alarme, configurado no grupo.',
      ],
    },
    {
      id: 'rv:gov.f02.m3.a2',
      kind: 'decision',
      title: 'Uma pergunta sobre ontem com a conta lá em cima',
      prompt:
        'Para responder "quantos agendamentos falharam ontem?", um analista roda no **Logs Insights** uma consulta sobre os **últimos 90 dias de oito grupos de logs**, e a conta de consultas disparou. Só o grupo do agendamento tem a resposta. A empresa quer **reduzir o custo** sem perder a informação. O que fazer?',
      concepts: [{ id: 'logs.insights' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Consultar só o dia de ontem e só o grupo do agendamento.', correct: true, consequence: 'A consulta lê uma fração dos dados e custa uma fração do preço.' },
        { id: 'b', text: 'Trocar os oito grupos para a classe Infrequent Access.', correct: false, consequence: 'As consultas do Logs Insights custam o mesmo nas duas classes, e a classe não muda depois.' },
        { id: 'c', text: 'Criar um filtro de métrica e consultar o gráfico de ontem.', correct: false, consequence: 'O filtro não é retroativo: não tem os dados de ontem.' },
        { id: 'd', text: 'Reduzir a retenção dos oito grupos para 1 dia.', correct: false, consequence: 'Apaga os logs que outras investigações vão precisar, para corrigir uma consulta mal feita.' },
      ],
      explanation: [
        'O Logs Insights **cobra por GB de log lido** pela consulta. Restringir o **intervalo de tempo** e os **grupos** à pergunta reduz o custo na mesma proporção.',
        'As consultas do Logs Insights custam o mesmo nas classes Standard e Infrequent Access, e a classe nem pode ser mudada. O filtro de métrica só conta eventos depois de criado. Reduzir a retenção apaga dados que outras investigações vão precisar.',
        '**Regra prática:** no Logs Insights, consulte só os grupos e o período que a pergunta pede.',
      ],
    },
    {
      id: 'rv:gov.f02.boss.a2',
      kind: 'decision',
      title: 'Os acessos de um médico nos últimos 300 dias',
      prompt:
        'Os logs de acesso a prontuários de um hospital ficam num grupo da classe **Infrequent Access**, com retenção de 2 anos. A auditoria pede para **pesquisar os acessos de um médico nos últimos 300 dias**. A equipe quer atender **sem mover os logs**. Qual é o caminho?',
      concepts: [{ id: 'logs.insights' }, { id: 'logs.classes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Criar um filtro de métrica com o nome do médico.', correct: false, consequence: 'A Infrequent Access não aceita filtros de métrica, e eles não são retroativos.' },
        { id: 'b', text: 'Consultar o grupo com o CloudWatch Logs Insights.', correct: true, consequence: 'O Logs Insights funciona na Infrequent Access e cobra pelos GB lidos.' },
        { id: 'c', text: 'Ler os eventos com o Live Tail do console.', correct: false, consequence: 'A Infrequent Access não tem Live Tail, e ele mostra só o que chega agora.' },
        { id: 'd', text: 'Mudar a classe do grupo para Standard e pesquisar.', correct: false, consequence: 'A classe não pode ser mudada depois que o grupo é criado.' },
      ],
      explanation: [
        'A classe **Infrequent Access** não tem filtros de métrica, filtros de assinatura nem Live Tail, mas **aceita o Logs Insights**, que é a forma de ler os eventos nela. A consulta custa o mesmo que na Standard, por GB lido.',
        'O filtro de métrica não existe nessa classe e não vê o passado. O Live Tail não existe nela. A classe não muda.',
        '**Regra prática:** grupo Infrequent Access se lê pelo Logs Insights; investigações depois do fato são o caso de uso dessa classe.',
      ],
    },
    {
      id: 'rv:gov.f02.m4.a2',
      kind: 'decision',
      title: 'O tempo gasto nas chamadas ao banco',
      prompt:
        'Uma API usa API Gateway, uma função Lambda e uma tabela do DynamoDB, com o **X-Ray** ligado na API e na função. No mapa de serviços, o tempo da função aparece, mas a equipe quer ver **quanto de cada requisição é gasto nas chamadas ao DynamoDB**, que não envia segmentos ao X-Ray. O que fazer?',
      concepts: [{ id: 'xray.what' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar o X-Ray na tabela do DynamoDB, nas configurações dela.', correct: false, consequence: 'O DynamoDB não envia segmentos; o tempo das chamadas vem de quem chama.' },
        { id: 'b', text: 'Instrumentar as chamadas ao DynamoDB na função, gerando subsegmentos.', correct: true, consequence: 'Cada chamada vira um subsegmento com o tempo dela, e o DynamoDB aparece como nó no mapa.' },
        { id: 'c', text: 'Criar um filtro de métrica nos logs da função para o tempo das chamadas.', correct: false, consequence: 'Gera uma métrica sem ligar cada chamada à requisição no rastro.' },
        { id: 'd', text: 'Instalar o daemon do X-Ray numa instância EC2 ao lado da tabela.', correct: false, consequence: 'O daemon só repassa segmentos; ele já vem na Lambda, e o DynamoDB não envia nada a ele.' },
      ],
      explanation: [
        'Os **segmentos** se dividem em **subsegmentos**, com o tempo de cada chamada a outro serviço, API externa ou banco. Para serviços que **não enviam segmentos**, como o DynamoDB, o X-Ray usa os subsegmentos de quem chama para criar o nó no mapa. Instrumentar as chamadas na função mostra o tempo de cada uma no rastro.',
        'Não há X-Ray "na tabela". Um filtro de métrica não liga chamadas a requisições. O daemon já vem na Lambda e não muda o que o DynamoDB envia.',
        '**Regra prática:** "qual parte de uma arquitetura distribuída causa a latência" é X-Ray; serviços sem segmentos aparecem pelos subsegmentos de quem os chama.',
      ],
    },
    {
      id: 'rv:gov.f02.m4.a3',
      kind: 'decision',
      title: 'Todas as chamadas de pagamento no rastreamento',
      prompt:
        'O X-Ray de um e-commerce usa a **amostragem padrão** e registra só uma parte das requisições. A equipe fiscal quer **todas as chamadas de pagamento rastreadas**, e o financeiro não quer **aumentar o custo** de rastrear as outras rotas, que são 95% do tráfego. Qual solução atende?',
      concepts: [{ id: 'xray.sampling' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Desligar a amostragem em toda a aplicação.', correct: false, consequence: 'Rastreia todos os pagamentos, mas também todas as outras rotas, e o custo sobe.' },
        { id: 'b', text: 'Uma regra de amostragem para pagamentos e a padrão para o resto.', correct: true, consequence: 'Os pagamentos são todos rastreados, e o resto continua na amostragem padrão.' },
        { id: 'c', text: 'Uma anotação com o tipo da rota em cada rastro.', correct: false, consequence: 'Anotações ajudam a buscar rastros, mas não mudam quais requisições são registradas.' },
        { id: 'd', text: 'Guardar o número do pagamento nos metadados de cada segmento.', correct: false, consequence: 'Metadados não são indexados nem mudam a amostragem.' },
      ],
      explanation: [
        'Por padrão, o X-Ray registra **a primeira requisição de cada segundo e 5% das demais**. **Regras de amostragem** próprias permitem rastrear tudo numa rota, como pagamentos, e manter a amostragem padrão no resto.',
        'Desligar a amostragem em tudo encarece. Anotações servem para buscar rastros. Metadados não são indexados.',
        '**Regra prática:** rastrear 100% só do que importa é uma regra de amostragem; buscar rastros por um valor de negócio é anotação.',
      ],
    },
    {
      id: 'rv:gov.f02.m4.a4:promql',
      kind: 'decision',
      title: 'Prometheus e Grafana próprios para um cluster EKS',
      prompt:
        'Uma equipe monitora um cluster **Amazon EKS** com um servidor **Prometheus** e um **Grafana** que ela mesma instalou e opera em instâncias EC2. Os painéis e as consultas em PromQL são muito usados. A empresa quer **deixar de operar esses servidores**, mantendo as ferramentas. Qual solução atende?',
      concepts: [{ id: 'obs.managed-tools' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon Managed Service for Prometheus e Amazon Managed Grafana.', correct: true, consequence: 'As consultas em PromQL e os painéis continuam, sem servidores para a equipe operar.' },
        { id: 'b', text: 'Painéis do CloudWatch, recriando cada gráfico do Grafana.', correct: false, consequence: 'Troca as ferramentas e exige refazer painéis e consultas.' },
        { id: 'c', text: 'AWS X-Ray, com o mapa de serviços do cluster EKS.', correct: false, consequence: 'O X-Ray rastreia requisições; não substitui métricas Prometheus nem painéis Grafana.' },
        { id: 'd', text: 'Prometheus e Grafana em instâncias EC2 maiores, num grupo do Auto Scaling.', correct: false, consequence: 'A equipe continua operando os servidores.' },
      ],
      explanation: [
        'O **Amazon Managed Service for Prometheus** guarda e consulta métricas de contêineres no formato do Prometheus, compatível com o **PromQL**, sem servidor para operar. O **Amazon Managed Grafana** é o Grafana pronto, integrado ao CloudWatch, ao X-Ray e ao Prometheus gerenciado.',
        'Recriar tudo no CloudWatch troca as ferramentas. O X-Ray tem outro propósito. Servidores maiores continuam com a equipe.',
        '**Regra prática:** "já usa Prometheus e Grafana e quer deixar de operar os servidores" aponta para as versões gerenciadas.',
      ],
    },
  ],
}
