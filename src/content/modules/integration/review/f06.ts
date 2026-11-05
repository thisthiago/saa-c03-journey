/**
 * Questões da Revisão da Fase 6 de Integração (APIs com API Gateway), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md); preços de referência da trilha. As
 * empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F06: ReviewSet = {
  phaseId: 'int.f06',
  questions: [
    {
      id: 'rv:int.f06.api-sem-servidor',
      kind: 'decision',
      title: 'Funções que viram uma API pública',
      prompt:
        'Uma startup tem a lógica do produto em **funções Lambda** e quer expô-las como uma **API pública**, com **autorização das chamadas**, **limites de requisições** e versões separadas para testes e produção, **sem servidores** para manter. Qual solução atende?',
      concepts: [{ id: 'apigw.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um Network Load Balancer na frente das funções.', correct: false, consequence: 'O NLB não tem as funções como alvo nem cuida de autorização e limites por chamada.' },
        { id: 'b', text: 'Instâncias EC2 com um proxy que chama as funções.', correct: false, consequence: 'Funciona, mas traz servidores e todo o controle de acesso para manter.' },
        { id: 'c', text: 'O Amazon API Gateway, com as funções como integração.', correct: true, consequence: 'Recebe as chamadas, autoriza, limita e encaminha às funções, com estágios por ambiente.' },
        { id: 'd', text: 'Um bucket do S3 com site estático chamando as funções.', correct: false, consequence: 'O site não é uma API e não controla quem chama as funções.' },
      ],
      explanation: [
        'O **API Gateway** recebe as chamadas da API e as encaminha a uma **integração**: uma função Lambda, um endpoint HTTP ou outro serviço da AWS. Ele cuida de **autorização**, **limites de uso**, versões em **estágios** e monitoramento, sem servidores. Há APIs REST, HTTP e WebSocket.',
        'NLB, proxy em EC2 e site estático não entregam esse conjunto.',
        '**Regra prática:** "expor uma API sem servidor, com Lambda, autorização e limites" é API Gateway.',
      ],
    },
    {
      id: 'rv:int.f06.m1.a2:waf',
      kind: 'decision',
      title: 'Recursos que pedem a API REST',
      prompt:
        'Uma equipe vai escolher entre **API REST** e **API HTTP** no API Gateway e quer saber quais das suas necessidades **só a API REST atende**. Quais são? (Escolha DUAS.)',
      concepts: [{ id: 'apigw.rest-vs-http' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Integração com o AWS WAF.', correct: true, consequence: 'Só a API REST se integra ao WAF; a HTTP não tem essa opção.' },
        { id: 'b', text: 'Cache das respostas no estágio.', correct: true, consequence: 'O cache do estágio existe só na API REST.' },
        { id: 'c', text: 'Integração com funções Lambda.', correct: false, consequence: 'As duas integram com funções Lambda; não decide o tipo.' },
        { id: 'd', text: 'Autorização com IAM.', correct: false, consequence: 'As duas aceitam autorização com IAM; não decide o tipo.' },
        { id: 'e', text: 'Autorizador JWT nativo.', correct: false, consequence: 'O autorizador JWT é recurso da API HTTP.' },
      ],
      explanation: [
        'A **API HTTP** é mais simples e mais barata, com **autorizador JWT**. A **API REST** tem mais recursos: **chaves de API e limites por cliente**, validação de requisição, **integração com o WAF**, **endpoint privado** e **cache**. As duas integram com Lambda e aceitam IAM.',
        'Lambda e IAM existem nas duas, e o JWT nativo é da HTTP.',
        '**Regra prática:** chaves de API, usage plans, WAF, cache ou endpoint privado exigem a API REST; sem nenhum deles, a HTTP sai mais barata.',
      ],
    },
    {
      id: 'rv:int.f06.http-mais-barata',
      kind: 'decision',
      title: 'Uma API simples com milhões de chamadas',
      prompt:
        'Uma API recebe **centenas de milhões de chamadas por mês**, encaminha tudo a funções Lambda e valida o token JWT do provedor de identidade da empresa. Ela **não precisa** de chaves de API, WAF, cache nem endpoint privado. Hoje é uma API REST. A empresa quer o **menor custo**. Qual tipo de API usar?',
      concepts: [{ id: 'apigw.rest-vs-http' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Manter a API REST, que tem mais recursos.', correct: false, consequence: 'Paga mais por chamada por recursos que a API não usa.' },
        { id: 'b', text: 'Uma API HTTP, com autorizador JWT.', correct: true, consequence: 'Atende a tudo o que a API usa, por um preço por chamada bem menor.' },
        { id: 'c', text: 'Uma API WebSocket.', correct: false, consequence: 'É para conexões bidirecionais persistentes, não para chamadas comuns.' },
        { id: 'd', text: 'Uma API REST privada.', correct: false, consequence: 'Só seria acessível de dentro da VPC, e continua com o preço da REST.' },
      ],
      explanation: [
        'Sem precisar de chaves de API, WAF, cache ou endpoint privado, a **API HTTP** atende e **sai mais barata**: na tabela de referência da trilha, cerca de US$ 1,00 por milhão de chamadas, contra US$ 3,50 na REST (primeira faixa, us-east-1). O **autorizador JWT** valida o token do provedor.',
        'A REST paga por recursos não usados. WebSocket e REST privada servem a outros casos.',
        '**Regra prática:** escolha a API REST pela necessidade de um recurso dela; sem isso, API HTTP.',
      ],
    },
    {
      id: 'rv:int.f06.m2.a1:edge',
      kind: 'decision',
      title: 'Uma API para o mundo e outra só para a VPC',
      prompt:
        'Uma empresa terá duas APIs REST: uma de **previsão do tempo pública**, chamada por clientes de **vários continentes**; e uma de **calibração de sensores**, que **não pode ser alcançada da internet**, só de dentro da VPC da fábrica. Quais tipos de endpoint atendem? (Escolha DUAS.)',
      concepts: [{ id: 'apigw.endpoint-types' }, { id: 'apigw.what' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Otimizado para borda, para a previsão pública.', correct: true, consequence: 'As chamadas passam pelos pontos de presença do CloudFront, perto dos clientes.' },
        { id: 'b', text: 'Privado, para a calibração.', correct: true, consequence: 'Só é acessível de dentro da VPC, por um endpoint de interface.' },
        { id: 'c', text: 'Regional, para a calibração.', correct: false, consequence: 'O regional é alcançável pela internet; não atende ao "só de dentro da VPC".' },
        { id: 'd', text: 'Privado, para a previsão pública.', correct: false, consequence: 'Os clientes de outros continentes não alcançariam a API.' },
        { id: 'e', text: 'Otimizado para borda, para a calibração.', correct: false, consequence: 'Fica exposto na internet, contra o requisito.' },
      ],
      explanation: [
        'O endpoint **otimizado para borda** (padrão das APIs REST) passa pelos **pontos de presença do CloudFront**, bom para clientes espalhados pelo mundo. O **regional** atende clientes na mesma Região. O **privado** só é acessível **de dentro de uma VPC**, por um endpoint de interface.',
        'Regional e borda ficam na internet. O privado não serve a clientes externos.',
        '**Regra prática:** clientes no mundo todo, borda; clientes na mesma Região, regional; só de dentro da VPC, privado.',
      ],
    },
    {
      id: 'rv:int.f06.m3.a1',
      kind: 'decision',
      title: 'Cinquenta chamadas num segundo',
      prompt:
        'O usage plan de uma rádio tem **taxa de 10 requisições por segundo** e **burst de 20**. Depois de vários segundos sem chamadas, ela faz **50 chamadas no mesmo segundo**. Quantas dessas chamadas recebem **429 Too Many Requests**?',
      concepts: [{ id: 'apigw.throttling' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: '40', correct: false, consequence: 'Considera só a taxa de 10 por segundo e ignora o balde cheio de 20.' },
        { id: 'b', text: 'Nenhuma', correct: false, consequence: 'O balde tem só 20 fichas; as 50 chamadas passam do limite.' },
        { id: 'c', text: '20', correct: false, consequence: 'Inverte a conta: 20 são as que passam, não as recusadas.' },
        { id: 'd', text: '30', correct: true, consequence: 'O balde cheio tem 20 fichas: 20 chamadas passam e 30 recebem 429.' },
      ],
      explanation: [
        'O API Gateway limita com um **balde de fichas**: a **taxa** reabastece o balde, e o **burst** é o **tamanho** dele. Depois de um período parado, o balde está cheio, com 20 fichas: as primeiras 20 chamadas passam, e as outras **30 recebem 429**.',
        'Ignorar o burst e olhar só a taxa leva a 40 recusadas; supor que tudo passa leva a zero; e 20 é o número de chamadas que passam, não o de recusadas. Nos segundos seguintes, o balde volta a encher 10 fichas por segundo.',
        '**Regra prática:** burst é quanto passa de uma vez com o balde cheio; taxa é quanto ele reabastece por segundo.',
      ],
    },
    {
      id: 'rv:int.f06.cliente-que-consome-tudo',
      kind: 'decision',
      title: 'Erros 429 para todos',
      prompt:
        'Uma API REST vendida a vários clientes começou a devolver **429** para todos durante os picos de **um único cliente**, que dispara muitas chamadas. A empresa quer que **cada cliente tenha o próprio limite**, para um não derrubar os outros. Qual solução atende?',
      concepts: [{ id: 'apigw.throttling' }, { id: 'apigw.usage-plans' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Pedir aumento do limite da conta na Região.', correct: false, consequence: 'O cliente guloso continua podendo consumir todo o limite, só que maior.' },
        { id: 'b', text: 'Baixar o limite do estágio para todos.', correct: false, consequence: 'Penaliza todos os clientes por causa de um.' },
        { id: 'c', text: 'Um usage plan por cliente.', correct: true, consequence: 'Cada cliente fica no próprio limite, e o pico de um não afeta os outros.' },
        { id: 'd', text: 'Ligar o cache do estágio.', correct: false, consequence: 'Ajuda em respostas repetidas, mas não limita o uso por cliente.' },
      ],
      explanation: [
        'Os limites valem nesta ordem: **por cliente no usage plan**, **por método no estágio** e **da conta na Região** (10.000 requisições por segundo, com burst de 5.000, por padrão). Sem limite por cliente, um só pode consumir o da conta. O **usage plan**, com uma **chave de API** por cliente, define taxa, burst e cota de cada um.',
        'Aumentar a conta adia o problema. Baixar o estágio pune todos. E cache não limita uso.',
        '**Regra prática:** "um cliente consome tudo e derruba os outros" pede usage plans por cliente.',
      ],
    },
    {
      id: 'rv:int.f06.m3.a3',
      kind: 'decision',
      title: 'A chave de API como senha',
      prompt:
        'Um time quer usar **só a chave de API** para impedir que estranhos chamem a API de calibração, que está atrás de uma API REST com usage plans. As chamadas vêm de **funções de outras contas da empresa**. Qual avaliação e ação estão corretas?',
      concepts: [{ id: 'apigw.usage-plans' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Basta a chave: sem ela, ninguém chama a API.', correct: false, consequence: 'Chaves vazam e não são tratadas como credencial de autorização.' },
        { id: 'b', text: 'Não basta: autorizar com IAM.', correct: true, consequence: 'A chave identifica o cliente no plano, e o IAM decide quem pode chamar.' },
        { id: 'c', text: 'Basta, se a chave for trocada todo mês.', correct: false, consequence: 'Trocar a chave não a transforma em autorização.' },
        { id: 'd', text: 'Não basta: trocar a chave por um usage plan sem chave.', correct: false, consequence: 'O usage plan precisa da chave para identificar o cliente, e ainda não autoriza ninguém.' },
      ],
      explanation: [
        'O **usage plan** define limites e cota por cliente, identificado por uma **chave de API**. A AWS avisa: **chave de API não é autorização**. Para controlar o acesso, use **IAM** (chamadas assinadas, bom para serviços e outras contas), **Cognito** ou um **autorizador Lambda**.',
        'A chave sozinha, trocada ou não, não protege a API. E o plano sem chave não identifica ninguém.',
        '**Regra prática:** usage plan e chave para medir e limitar; IAM, Cognito ou autorizador para decidir quem entra.',
      ],
    },
    {
      id: 'rv:int.f06.m4.a1',
      kind: 'decision',
      title: 'Cache numa API HTTP',
      prompt:
        'Uma **API HTTP** do API Gateway responde GET /previsao/{cidade} milhares de vezes por minuto, e a previsão só muda **a cada 10 minutos**. Cada chamada aciona uma função Lambda. A equipe quer **responder as chamadas repetidas sem chamar a função**, usando um recurso do próprio API Gateway. Qual caminho atende?',
      concepts: [{ id: 'apigw.cache' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Ligar o cache do estágio na API HTTP, com TTL de 600 s.', correct: false, consequence: 'A API HTTP não tem cache do estágio; o recurso é da REST.' },
        { id: 'b', text: 'Aumentar a memória da função para ela responder mais rápido.', correct: false, consequence: 'Cada chamada continua acionando a função.' },
        { id: 'c', text: 'API REST com cache, TTL de até 600 s.', correct: true, consequence: 'O cache responde as chamadas repetidas, e a previsão não fica mais velha que 10 minutos.' },
        { id: 'd', text: 'Ligar o cache numa API REST com TTL de 1 dia.', correct: false, consequence: 'O TTL máximo é de 3.600 s, e a previsão ficaria velha.' },
      ],
      explanation: [
        'Nas **APIs REST**, o **cache do estágio** guarda as respostas por um **TTL** (padrão de 300 s, **até 3.600 s**) e responde sem chamar a integração; por padrão, só os métodos **GET** usam o cache, que é cobrado por hora. A **API HTTP não tem esse cache**. Com TTL de até 600 s, a previsão nunca passa de 10 minutos.',
        'Não há cache na API HTTP. Mais memória não evita chamadas. E 1 dia passa do máximo e envelhece a previsão.',
        '**Regra prática:** "respostas que se repetem, com menos chamadas ao backend" é cache do estágio numa API REST, com TTL ajustado à mudança dos dados.',
      ],
    },
    {
      id: 'rv:int.f06.m4.a2:cognito',
      kind: 'decision',
      title: 'Quem chama e como entra',
      prompt:
        'Uma API terá três tipos de chamador: **usuários de um app de celular**, com login e senha; **funções de outra conta da AWS** da empresa; e um **parceiro** que manda um token do próprio provedor de identidade. Quais escolhas de autorização estão **corretas**? (Escolha DUAS.)',
      concepts: [{ id: 'apigw.auth' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'Amazon Cognito para os usuários do app.', correct: true, consequence: 'O Cognito cuida do login dos usuários de um app.' },
        { id: 'b', text: 'IAM para as funções da outra conta.', correct: true, consequence: 'As chamadas assinadas por uma role são a forma de autorizar serviços e contas.' },
        { id: 'c', text: 'Usuários do IAM para cada pessoa que usa o app.', correct: false, consequence: 'Usuários do IAM não são para os clientes de um app; o Cognito é.' },
        { id: 'd', text: 'Chave de API como autorização do parceiro.', correct: false, consequence: 'Chave de API não é autorização; o token do parceiro pede um autorizador.' },
        { id: 'e', text: 'Amazon Cognito para as funções da outra conta.', correct: false, consequence: 'Serviços de outras contas se autorizam com IAM, não com login de usuário.' },
      ],
      explanation: [
        'O acesso se escolhe **pelo chamador**: **IAM** (chamadas assinadas) para **outros serviços e contas**; **Amazon Cognito** para **usuários de um app**; um **autorizador Lambda** para **tokens de outro provedor**, com lógica própria. A API HTTP tem também o autorizador JWT; a REST tem políticas de recurso.',
        'Usuários do IAM não são para clientes de app, chave de API não autoriza, e Cognito não é para serviços.',
        '**Regra prática:** serviços e contas, IAM; pessoas num app, Cognito; token de terceiros, autorizador Lambda ou JWT.',
      ],
    },
    {
      id: 'rv:int.f06.autorizador-jwt',
      kind: 'decision',
      title: 'Tokens de um provedor de identidade externo',
      prompt:
        'Uma **API HTTP** recebe chamadas de usuários autenticados num **provedor de identidade externo** compatível com OpenID Connect, que emite **tokens JWT**. A empresa quer validar os tokens no API Gateway com o **menor esforço**, sem escrever código de validação. Qual autorização atende?',
      concepts: [{ id: 'apigw.auth' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Um autorizador Lambda que valida o token.', correct: false, consequence: 'Funciona, mas exige escrever e manter o código de validação.' },
        { id: 'b', text: 'O autorizador JWT da API HTTP.', correct: true, consequence: 'O API Gateway valida os tokens do provedor sem código próprio.' },
        { id: 'c', text: 'Autorização IAM com chamadas assinadas.', correct: false, consequence: 'Os usuários do provedor externo não assinam chamadas com credenciais da AWS.' },
        { id: 'd', text: 'Chave de API para cada usuário do provedor.', correct: false, consequence: 'Chave de API não é autorização e não valida o token.' },
      ],
      explanation: [
        'A **API HTTP** tem o **autorizador JWT**, que valida tokens de provedores compatíveis com OpenID Connect sem código. O **autorizador Lambda** também resolveria, com lógica própria, mas com código para manter. O **IAM** é para chamadas assinadas por serviços e contas.',
        'Chaves de API não autorizam, e os usuários externos não têm credenciais da AWS.',
        '**Regra prática:** token JWT de um provedor, numa API HTTP, é autorizador JWT; regras de validação próprias pedem um autorizador Lambda.',
      ],
    },
  ],
}
