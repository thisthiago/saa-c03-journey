/**
 * Questões da Revisão da Fase 3 de Monitoramento e governança (CloudTrail), no
 * formato do exame SAA-C03. Fatos conferidos na trilha (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F03: ReviewSet = {
  phaseId: 'gov.f03',
  questions: [
    {
      id: 'rv:gov.f03.m1.a5:who',
      kind: 'decision',
      title: 'Um security group alterado de madrugada',
      prompt:
        'Um security group de produção foi alterado de madrugada. No evento `AuthorizeSecurityGroupIngress` do CloudTrail, a equipe de segurança quer descobrir **quem fez a chamada** e **de que endereço ela veio**. Quais campos do registro respondem a essas duas perguntas? (Escolha DUAS.)',
      concepts: [{ id: 'trail.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'userIdentity, que descreve a identidade do IAM que fez a chamada.', correct: true, consequence: 'Mostra o usuário ou a role, com a conta, que pediu a alteração.' },
        { id: 'b', text: 'sourceIPAddress, com o endereço de onde a chamada veio.', correct: true, consequence: 'Mostra o endereço IP de onde partiu a requisição feita à AWS.' },
        { id: 'c', text: 'eventName, que traz o nome da pessoa que fez a alteração.', correct: false, consequence: 'O eventName é a ação pedida, como AuthorizeSecurityGroupIngress.' },
        { id: 'd', text: 'awsRegion, que mostra a cidade de onde a pessoa acessou.', correct: false, consequence: 'O awsRegion é a Região da AWS em que a ação aconteceu.' },
        { id: 'e', text: 'eventSource, com o computador usado pela pessoa.', correct: false, consequence: 'O eventSource é o serviço chamado, como ec2.amazonaws.com.' },
      ],
      explanation: [
        'Cada evento do **CloudTrail** diz **quem** fez (**userIdentity**), **o quê** (eventName), **onde** (awsRegion), **de onde** (**sourceIPAddress**) e **quando** (eventTime). Também traz o serviço chamado (eventSource), a ferramenta usada (userAgent) e, quando há falha, o código do erro.',
        'eventName é a ação, awsRegion é a Região da AWS e eventSource é o serviço.',
        '**Regra prática:** "quem fez uma alteração" na conta é CloudTrail; como o recurso estava configurado é outra ferramenta.',
      ],
    },
    {
      id: 'rv:gov.f03.m1.a3',
      kind: 'decision',
      title: 'Um relatório apagado há cinco dias',
      prompt:
        'Alguém apagou um relatório (`DeleteObject`) de um bucket há 5 dias. A conta **nunca teve trilha** nem ligou eventos de dados. A diretoria quer saber quem foi e quer conseguir responder perguntas assim **daqui em diante**, só para esse bucket. Qual é a resposta correta?',
      concepts: [{ id: 'trail.event-types' }, { id: 'trail.event-history' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O histórico de eventos mostra quem apagou, porque guarda 90 dias.', correct: false, consequence: 'O histórico guarda só eventos de gerenciamento; DeleteObject é evento de dados.' },
        { id: 'b', text: 'Não foi registrado; ligar eventos de dados desse bucket numa trilha.', correct: true, consequence: 'O passado não foi registrado, mas as próximas leituras e exclusões do bucket serão.' },
        { id: 'c', text: 'Uma trilha criada hoje recupera os eventos de dados dos últimos 5 dias.', correct: false, consequence: 'A trilha registra a partir de quando é criada; não traz eventos passados.' },
        { id: 'd', text: 'Ligar os eventos de dados em todos os buckets da conta, por garantia.', correct: false, consequence: 'Eventos de dados são muitos e cobrados à parte; só um bucket precisa de auditoria.' },
      ],
      explanation: [
        'Ler ou apagar objetos do S3 são **eventos de dados**, que **vêm desligados** e são cobrados à parte. O **histórico de eventos** mostra só eventos de **gerenciamento** dos últimos 90 dias. Sem eventos de dados ligados, a exclusão não foi registrada. Daqui em diante, uma trilha com os eventos de dados **só desse bucket** responde a pergunta.',
        'O histórico não tem eventos de dados. Uma trilha nova não recupera o passado. Ligar em todos os buckets aumenta o custo sem necessidade.',
        '**Regra prática:** "quem leu ou apagou objetos de um bucket" exige eventos de dados ligados antes, de preferência com seletores avançados.',
      ],
    },
    {
      id: 'rv:gov.f03.boss.a2',
      kind: 'decision',
      title: 'Auditoria de exclusões num bucket muito acessado',
      prompt:
        'Um bucket de notas fiscais recebe **milhões de leituras** (`GetObject`) por dia e poucas exclusões. A auditoria quer saber **só quem apaga objetos** desse bucket. A equipe vai ligar eventos de dados numa trilha e quer o **menor custo** que atenda. Qual configuração escolher?',
      concepts: [{ id: 'trail.event-types' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Eventos de dados de todos os buckets, filtrados depois no S3.', correct: false, consequence: 'Paga por todos os eventos de dados da conta para usar uma fração.' },
        { id: 'b', text: 'Eventos de dados de leitura e gravação desse bucket.', correct: false, consequence: 'Inclui os milhões de GetObject por dia, que a auditoria não pediu.' },
        { id: 'c', text: 'Seletores avançados com só DeleteObject desse bucket.', correct: true, consequence: 'A trilha registra só as exclusões desse bucket, e a fatura acompanha.' },
        { id: 'd', text: 'Eventos de gerenciamento de gravação da conta inteira.', correct: false, consequence: 'Apagar objetos é evento de dados; os de gerenciamento não mostram isso.' },
      ],
      explanation: [
        'Eventos de dados são **muitos** e **cobrados à parte**. Os **seletores de eventos avançados** deixam registrar só os eventos de interesse, como o DeleteObject de um bucket, o que controla o custo.',
        'Registrar todos os buckets ou as leituras paga eventos que ninguém vai usar. Eventos de gerenciamento não mostram ações dentro do bucket.',
        '**Regra prática:** ligue eventos de dados só onde a auditoria pede e, com seletores avançados, só nas ações que importam.',
      ],
    },
    {
      id: 'rv:gov.f03.m1.a4',
      kind: 'decision',
      title: 'Um usuário criado há quatro meses',
      prompt:
        'A segurança encontrou um usuário do IAM desconhecido, criado **há cerca de 120 dias**. A conta **nunca teve trilha**. A equipe quer saber quem criou o usuário e quer que perguntas desse tipo possam ser respondidas **por pelo menos um ano** daqui em diante. Qual é a avaliação correta?',
      concepts: [{ id: 'trail.event-history' }, { id: 'trail.trails' }, { id: 'trail.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'O histórico de eventos mostra o evento, porque é de gerenciamento.', correct: false, consequence: 'O histórico guarda só os últimos 90 dias; 120 dias já passaram.' },
        { id: 'b', text: 'Uma trilha criada hoje traz os eventos dos últimos 12 meses.', correct: false, consequence: 'A trilha registra a partir da criação; não recupera eventos antigos.' },
        { id: 'c', text: 'Não está mais disponível; criar uma trilha que entregue no S3.', correct: true, consequence: 'Daqui em diante, os eventos ficam no S3 pelo tempo que o bucket mantiver.' },
        { id: 'd', text: 'Abrir um chamado para a AWS restaurar o histórico de 120 dias.', correct: false, consequence: 'O histórico de eventos não guarda mais que 90 dias.' },
      ],
      explanation: [
        'O **histórico de eventos** já vem em toda conta, sem custo, com os eventos de gerenciamento dos **últimos 90 dias**. Passado esse prazo, sem trilha, o evento não está mais disponível. Para guardar por mais tempo, é preciso uma **trilha**, que entrega os eventos no S3.',
        'O histórico não passa de 90 dias, e uma trilha nova não recupera o passado.',
        '**Regra prática:** até 90 dias de eventos de gerenciamento, o histórico basta; para mais tempo ou mais tipos de evento, uma trilha.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a4:keep',
      kind: 'decision',
      title: 'Registros de auditoria por sete anos',
      prompt:
        'Uma corretora precisa guardar os registros do CloudTrail de **todas as Regiões** por **sete anos**. Os registros do último ano são consultados de vez em quando; os mais antigos, quase nunca. A empresa quer o **menor custo** de armazenamento. Qual solução atende?',
      concepts: [{ id: 'trail.trails' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Depender do histórico de eventos, que já vem em toda conta.', correct: false, consequence: 'O histórico guarda 90 dias, por Região; não chega a sete anos.' },
        { id: 'b', text: 'Uma trilha de várias Regiões no S3, com lifecycle para arquivamento.', correct: true, consequence: 'Os arquivos ficam no S3 pelo tempo exigido, e os antigos vão para classes mais baratas.' },
        { id: 'c', text: 'Uma trilha em cada Região, cada uma com o seu bucket.', correct: false, consequence: 'Mais trilhas registrando os mesmos eventos de gerenciamento pagam cópias extras.' },
        { id: 'd', text: 'Uma trilha de várias Regiões no CloudWatch Logs com retenção de sete anos.', correct: false, consequence: 'Guardar sete anos no CloudWatch Logs custa mais que no S3 com lifecycle.' },
      ],
      explanation: [
        'Uma **trilha** entrega os eventos como arquivos num **bucket do S3**, onde ficam pelo tempo que você quiser. A de **várias Regiões** registra todas as Regiões habilitadas e é a recomendada. Com regras de **lifecycle**, os arquivos antigos vão para classes mais baratas.',
        'O histórico guarda 90 dias. Trilhas repetidas pagam cópias. O CloudWatch Logs é mais caro para guarda longa.',
        '**Regra prática:** "registrar todas as Regiões e guardar por anos" é trilha de várias Regiões no S3, com lifecycle.',
      ],
    },
    {
      id: 'rv:gov.f03.regiao-nova',
      kind: 'decision',
      title: 'Uma Região opcional habilitada depois da trilha',
      prompt:
        'Uma empresa tem uma **trilha de várias Regiões**, criada pelo console há dois anos. Agora ela vai **habilitar uma Região opcional** para atender clientes no Oriente Médio. A segurança quer que a atividade nessa Região **também seja registrada**, com o **menor esforço**. O que fazer?',
      concepts: [{ id: 'trail.trails' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar uma trilha nova só para a Região opcional.', correct: false, consequence: 'Duplica o registro: a trilha de várias Regiões já passa a cobrir a nova Região.' },
        { id: 'b', text: 'Recriar a trilha de várias Regiões depois de habilitar a Região.', correct: false, consequence: 'Não é preciso recriar; e recriar abre um intervalo sem registro.' },
        { id: 'c', text: 'Só habilitar a Região: a trilha passa a cobri-la sozinha.', correct: true, consequence: 'O CloudTrail cria na nova Região uma cópia da trilha de várias Regiões.' },
        { id: 'd', text: 'Mudar o bucket da trilha para um bucket na Região opcional.', correct: false, consequence: 'O bucket da trilha pode estar em qualquer Região; trocá-lo não muda o que é registrado.' },
      ],
      explanation: [
        'A **trilha de várias Regiões** registra todas as Regiões habilitadas. Depois de habilitar uma **Região opcional**, o CloudTrail cria nela uma **cópia idêntica** de cada trilha de várias Regiões, e os arquivos continuam indo ao mesmo bucket.',
        'Uma trilha extra repete eventos. Recriar a trilha é desnecessário. O bucket pode ficar em qualquer Região.',
        '**Regra prática:** prefira a trilha de várias Regiões; ela acompanha as Regiões que forem habilitadas depois.',
      ],
    },
    {
      id: 'rv:gov.f03.m2.a3',
      kind: 'decision',
      title: 'Porta 22 liberada na internet',
      prompt:
        'A segurança quer que, **logo depois** de alguém chamar `AuthorizeSecurityGroupIngress` liberando a porta 22 para a internet, uma **função Lambda** desfaça a regra. A conta já tem uma trilha de várias Regiões entregando no S3. A equipe quer reagir **o mais rápido possível**, **sem processar os arquivos de log**. Qual solução atende?',
      concepts: [{ id: 'trail.delivery' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Uma notificação do S3 que chama a Lambda a cada arquivo da trilha entregue.', correct: false, consequence: 'Os arquivos chegam em média uns 5 minutos depois, e a Lambda teria de abrir e ler cada um.' },
        { id: 'b', text: 'Uma consulta do Logs Insights agendada a cada cinco minutos.', correct: false, consequence: 'Exige enviar a trilha ao CloudWatch Logs, consultas repetidas e ainda uma ponte até a Lambda.' },
        { id: 'c', text: 'Uma regra do EventBridge para esse evento, chamando a Lambda.', correct: true, consequence: 'A Lambda recebe o evento da chamada de API, sem esperar arquivos no S3.' },
        { id: 'd', text: 'Um alarme sobre a métrica de requisições do bucket da trilha.', correct: false, consequence: 'A métrica do bucket não diz que ação foi registrada nos arquivos.' },
      ],
      explanation: [
        'Os arquivos da trilha chegam ao S3 **em média cerca de 5 minutos** depois da chamada, sem garantia. Os eventos da trilha também ficam disponíveis no **EventBridge**, onde uma regra filtra o evento e chama a **Lambda** diretamente, sem abrir arquivos.',
        'Processar os arquivos do S3 é lento e trabalhoso. Consultas agendadas são indiretas. A métrica do bucket não conhece o conteúdo dos eventos.',
        '**Regra prática:** reagir a uma chamada de API é uma regra do EventBridge; alarme sobre mensagens é CloudWatch Logs com filtro de métrica; guarda longa é S3.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a1',
      kind: 'decision',
      title: 'Um administrador querendo cortar custos',
      prompt:
        'Uma holding registra a atividade de todas as contas com uma **trilha da organização**. O administrador da conta de uma das unidades tentou **apagar essa trilha** na conta dele para reduzir custos e não conseguiu. Ele pede uma explicação antes de abrir um chamado. Qual é a explicação?',
      concepts: [{ id: 'trail.org-trail' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Falta a ele uma política IAM com cloudtrail:DeleteTrail na conta.', correct: false, consequence: 'Mesmo com a permissão, contas membro não alteram nem apagam a trilha da organização.' },
        { id: 'b', text: 'Contas membro veem a trilha da organização, mas não a alteram.', correct: true, consequence: 'Só a conta de gerenciamento ou um administrador delegado gerenciam a trilha.' },
        { id: 'c', text: 'A trilha só pode ser apagada pelo suporte da AWS.', correct: false, consequence: 'Quem gerencia a trilha da organização é a conta de gerenciamento ou um administrador delegado.' },
        { id: 'd', text: 'A trilha está na Região errada; apagando na Região do bucket, funciona.', correct: false, consequence: 'A Região não muda o fato de a conta membro não poder apagá-la.' },
      ],
      explanation: [
        'A **trilha da organização** registra a conta de gerenciamento e **todas as contas membro**, inclusive as novas. Ela é criada pela conta de gerenciamento ou por um **administrador delegado**. As contas membro **enxergam** a trilha, mas **não podem alterá-la nem apagá-la**.',
        'Nenhuma permissão na conta membro muda isso, nem a Região. O suporte da AWS não é o caminho.',
        '**Regra prática:** "registrar todas as contas, inclusive as novas, sem que elas possam desligar" é trilha da organização.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a2',
      kind: 'decision',
      title: 'Uma unidade que não consegue ler os próprios registros',
      prompt:
        'Com uma trilha da organização entregando num bucket da **conta de logs**, o gerente da conta de uma unidade tenta abrir os arquivos de log **da própria conta** e recebe acesso negado. A segurança quer liberar a leitura **só dos arquivos dessa conta**. O que fazer?',
      concepts: [{ id: 'trail.org-trail' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Criar na conta da unidade uma trilha própria com o mesmo bucket.', correct: false, consequence: 'Gera uma cópia paga dos eventos e não dá acesso aos arquivos da trilha da organização.' },
        { id: 'b', text: 'Dar ao gerente a senha do root da conta de logs.', correct: false, consequence: 'Compartilha a credencial mais poderosa da conta para resolver uma leitura.' },
        { id: 'c', text: 'Ligar a validação de integridade dos arquivos da trilha.', correct: false, consequence: 'A validação prova que os arquivos não mudaram; não concede leitura.' },
        { id: 'd', text: 'Liberar na política do bucket de logs o prefixo da unidade.', correct: true, consequence: 'O gerente lê só os arquivos da própria conta, e o resto continua protegido.' },
      ],
      explanation: [
        'Por padrão, **as contas membro não têm acesso aos arquivos** da trilha da organização no S3. O acesso é concedido por quem controla o bucket, na conta de logs, com permissões restritas ao prefixo da conta da unidade.',
        'Uma trilha própria cria cópias pagas. Compartilhar o root é inaceitável. A validação de integridade não dá acesso.',
        '**Regra prática:** a trilha da organização centraliza os registros; quem lê os arquivos é decidido nas permissões do bucket de logs.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a3',
      kind: 'decision',
      title: 'Registros que ninguém pode mexer nem apagar',
      prompt:
        'Uma auditoria externa exige duas coisas sobre os arquivos do CloudTrail no S3: **provar que nenhum arquivo foi alterado ou forjado** depois de entregue e **impedir que alguém os apague** antes de 5 anos. Quais medidas atendem? (Escolha DUAS.)',
      concepts: [{ id: 'trail.integrity' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Ligar a validação de integridade dos arquivos de log da trilha.', correct: true, consequence: 'Os resumos assinados provam que nenhum arquivo foi alterado, apagado ou forjado.' },
        { id: 'b', text: 'Ligar o S3 Object Lock no bucket, com retenção de 5 anos.', correct: true, consequence: 'Os arquivos não podem ser apagados nem sobrescritos antes do fim da retenção.' },
        { id: 'c', text: 'Ligar o CloudTrail Insights na trilha.', correct: false, consequence: 'O Insights avisa de atividade incomum; não prova integridade nem impede exclusões.' },
        { id: 'd', text: 'Enviar a trilha também ao CloudWatch Logs.', correct: false, consequence: 'Cria outra cópia, mas não prova nem protege os arquivos do S3.' },
        { id: 'e', text: 'Criar uma segunda trilha com os mesmos eventos.', correct: false, consequence: 'Paga cópias extras sem provar nada sobre os arquivos da primeira.' },
      ],
      explanation: [
        'A **validação de integridade** cria um hash de cada arquivo e, a cada hora, um **arquivo de resumo assinado**, que prova se algo foi alterado, apagado ou forjado. Ela **prova**, mas **não impede**. Para impedir a exclusão, combine com o **S3 Object Lock** ou com permissões restritas no bucket.',
        'Insights, CloudWatch Logs e uma segunda trilha não provam integridade nem impedem exclusões.',
        '**Regra prática:** "provar que os logs não foram alterados" é a validação de integridade; "impedir a exclusão" é Object Lock.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a4:anomaly',
      kind: 'decision',
      title: 'Picos de chamadas sem saber qual é o normal',
      prompt:
        'A segurança quer ser avisada quando o **número de chamadas de API de gravação** na conta **fugir do normal**, como um script que de repente cria centenas de recursos. Ninguém sabe dizer qual é o volume normal para definir um limite. A conta tem uma trilha com eventos de gerenciamento. Qual solução atende?',
      concepts: [{ id: 'trail.insights' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um alarme do CloudWatch com limite fixo de 100 chamadas por minuto.', correct: false, consequence: 'Exige um limite que ninguém sabe definir e ignora as variações normais.' },
        { id: 'b', text: 'Ligar o CloudTrail Insights na trilha, para a taxa de chamadas.', correct: true, consequence: 'O Insights aprende a linha de base e gera um evento quando o ritmo foge dela.' },
        { id: 'c', text: 'Ligar a validação de integridade dos arquivos da trilha.', correct: false, consequence: 'Prova que os arquivos não mudaram; não analisa o ritmo das chamadas.' },
        { id: 'd', text: 'Consultar o histórico de eventos todas as manhãs.', correct: false, consequence: 'É manual, chega tarde e ainda depende de alguém saber o que é normal.' },
      ],
      explanation: [
        'O **CloudTrail Insights** descobre a **linha de base** da taxa de chamadas de API e da taxa de erros e gera um evento quando o ritmo atual foge dela, **sem você definir limites**. Ele precisa estar ligado na trilha, que deve registrar os eventos correspondentes, e tem cobrança à parte.',
        'Um limite fixo exige saber o normal. A validação de integridade e a consulta manual não detectam anomalias.',
        '**Regra prática:** "atividade de API incomum, sem definir limites" é o CloudTrail Insights.',
      ],
    },
    {
      id: 'rv:gov.f03.m3.a4:sql',
      kind: 'decision',
      title: 'Uma pergunta sobre a semana passada',
      prompt:
        'Um analista precisa descobrir **quem apagou uma tabela do DynamoDB na semana passada** numa conta, uma pergunta pontual. Ele propôs criar um **CloudTrail Lake** com um event data store para consultar em SQL. A empresa quer a resposta com o **menor custo**. Qual é a recomendação?',
      concepts: [{ id: 'trail.lake' }, { id: 'trail.event-history' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Criar o CloudTrail Lake e consultar o evento em SQL.', correct: false, consequence: 'Funciona, mas paga ingestão, armazenamento e consulta para uma pergunta que o histórico já responde.' },
        { id: 'b', text: 'Criar uma trilha nova com eventos de dados da tabela.', correct: false, consequence: 'Apagar a tabela é evento de gerenciamento, e uma trilha nova não traz o passado.' },
        { id: 'c', text: 'Ligar o CloudTrail Insights e esperar a linha de base.', correct: false, consequence: 'O Insights avisa de anomalias futuras; não responde quem apagou a tabela.' },
        { id: 'd', text: 'Procurar o evento no histórico de eventos da Região.', correct: true, consequence: 'O histórico tem 90 dias de eventos de gerenciamento, sem custo.' },
      ],
      explanation: [
        'Apagar uma tabela é um **evento de gerenciamento**, e a semana passada está dentro dos **90 dias do histórico de eventos**, que já vem em toda conta e não tem custo de consulta. O **CloudTrail Lake** serve a auditorias com muitas perguntas sobre eventos de várias contas e anos, e cobra ingestão, armazenamento e consultas.',
        'Uma trilha nova não traz o passado. O Insights não responde perguntas sobre eventos específicos.',
        '**Regra prática:** pergunta pontual dos últimos 90 dias é histórico de eventos; consultas em SQL sobre muitas contas e anos, CloudTrail Lake.',
      ],
    },
  ],
}
