/**
 * Fase 6 — APIs com API Gateway. REST ou HTTP, tipos de endpoint,
 * limitação de requisições, usage plans, cache e controle de acesso.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { ApiLabConfig } from '../../../../../simulators/apigw/lab'
import { META } from '../meta'

export const CLIMA_PLANOS: ApiLabConfig = {
  rateOptions: [10, 50, 100, 200, 500],
  burstOptions: [20, 100, 200, 400, 1000],
  clients: [
    { id: 'radio', label: 'Rádio Litoral', demand: [8, 9, 7, 8], concepts: ['apigw.usage-plans', 'apigw.throttling'] },
    { id: 'agro', label: 'App Agro Campo', demand: [40, 45, 40, 50], concepts: ['apigw.usage-plans', 'apigw.throttling'] },
    { id: 'tv', label: 'TV Horizonte, com pico na hora do jornal', demand: [350, 60, 60, 60, 60, 60, 60, 60], concepts: ['apigw.usage-plans', 'apigw.throttling'] },
    { id: 'aero', label: 'Aeroclube Céu Azul', demand: [150, 150, 150, 150], concepts: ['apigw.usage-plans', 'apigw.throttling'] },
  ],
}

export const F06_INT: PhaseDef = {
  ...META.f06,
  concepts: ['apigw.what', 'apigw.rest-vs-http', 'apigw.endpoint-types', 'apigw.throttling', 'apigw.usage-plans', 'apigw.cache', 'apigw.auth'],
  availability: 'available',
  simplifications: ['A empresa de meteorologia e os clientes são fictícios.', 'No laboratório, o balde de tokens é reabastecido uma vez por segundo.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f06.m1',
      title: 'A porta da API',
      type: 'mission',
      summary: 'O API Gateway e a escolha entre REST e HTTP.',
      briefing: {
        company: 'Clima Já',
        role: 'Você publica a API de previsão do tempo de uma empresa de meteorologia.',
        situation: 'A previsão é calculada por funções Lambda. Rádios, TVs e apps vão pagar pelo acesso, cada um com um limite de chamadas por plano.',
        objective: 'Escolher o tipo de API que entrega o que o negócio precisa pelo menor custo.',
        successCriteria: ['Usar o API Gateway na frente das funções', 'Escolher entre REST e HTTP'],
      },
      intel: [
        { conceptId: 'apigw.what', body: ['O **API Gateway** recebe as chamadas e as encaminha a uma integração, como uma função Lambda, cuidando de autorização, limites e estágios.'] },
        { conceptId: 'apigw.rest-vs-http', body: ['**HTTP**: mais simples e **mais barata**. **REST**: tem **chaves de API e limites por cliente**, validação, WAF, endpoint privado e **cache**.'] },
      ],
      activities: [
        {
          id: 'int.f06.m1.a1',
          kind: 'decision',
          title: 'REST ou HTTP',
          prompt: 'Cada cliente terá uma chave e um limite de chamadas conforme o plano que contratou. Que tipo de API usar?',
          concepts: [{ id: 'apigw.rest-vs-http' }, { id: 'apigw.what', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Chaves de API e limites por cliente (usage plans) só existem na API REST.'],
          options: [
            { id: 'a', text: 'API REST, com usage plans e chaves de API', correct: true, consequence: 'Cada cliente tem o seu limite.' },
            { id: 'b', text: 'API HTTP, porque é mais barata', correct: false, consequence: 'A API HTTP não tem chaves de API nem limites por cliente.' },
            { id: 'c', text: 'Expor as funções Lambda direto, sem API Gateway', correct: false, consequence: 'Os limites por cliente teriam de ser escritos à mão.' },
          ],
        },
        {
          id: 'int.f06.m1.a2',
          kind: 'classify',
          title: 'Onde existe',
          prompt: 'Diga se cada recurso existe só na API REST ou nas duas.',
          concepts: [{ id: 'apigw.rest-vs-http' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A REST tem mais recursos; a HTTP cobre o básico com custo menor.'],
          bins: [
            { id: 'rest', label: 'Só na REST' },
            { id: 'both', label: 'Nas duas' },
          ],
          items: [
            { id: 'keys', text: 'Chaves de API e limite por cliente', bin: 'rest', explanation: 'Usage plans são da REST.', concepts: ['apigw.rest-vs-http'] },
            { id: 'cache', text: 'Cache das respostas', bin: 'rest', explanation: 'O cache é da REST.', concepts: ['apigw.rest-vs-http'] },
            { id: 'waf', text: 'Integração com o AWS WAF', bin: 'rest', explanation: 'Só a REST se integra ao WAF.', concepts: ['apigw.rest-vs-http'] },
            { id: 'lambda', text: 'Integração com funções Lambda', bin: 'both', explanation: 'As duas integram.', concepts: ['apigw.rest-vs-http'] },
            { id: 'iam', text: 'Autorização com IAM', bin: 'both', explanation: 'As duas aceitam IAM.', concepts: ['apigw.rest-vs-http'] },
          ],
        },
      ],
      debrief: { takeaways: ['REST quando precisa de usage plans, cache, WAF ou endpoint privado.', 'HTTP quando o básico basta, pagando menos.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f06.m2',
      title: 'De onde vêm os clientes',
      type: 'mission',
      summary: 'Tipos de endpoint.',
      briefing: {
        company: 'Clima Já',
        role: 'Você escolhe o endpoint de cada API.',
        situation: 'A API pública atende clientes no mundo todo. Uma API interna, de calibração dos sensores, só pode ser chamada de dentro da VPC da empresa.',
        objective: 'Escolher o tipo de endpoint de cada API.',
        successCriteria: ['Usar o endpoint certo para cada caso'],
      },
      intel: [{ conceptId: 'apigw.endpoint-types', body: ['**Otimizado para borda**: passa pelos pontos de presença do CloudFront, para clientes no mundo todo. **Regional**: clientes na mesma Região. **Privado**: só de dentro de uma VPC.'] }],
      activities: [
        {
          id: 'int.f06.m2.a1',
          kind: 'match',
          title: 'O endpoint de cada API',
          prompt: 'Associe cada API ao tipo de endpoint.',
          concepts: [{ id: 'apigw.endpoint-types' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O tipo depende de onde estão os clientes.'],
          leftLabel: 'API',
          rightLabel: 'Endpoint',
          pairs: [
            { id: 'edge', left: 'Previsão pública, chamada de vários continentes', right: 'Otimizado para borda', explanation: 'A borda do CloudFront aproxima os clientes.', concepts: ['apigw.endpoint-types'] },
            { id: 'regional', left: 'API usada só pelos servidores da própria empresa em sa-east-1', right: 'Regional', explanation: 'Os clientes estão na Região.', concepts: ['apigw.endpoint-types'] },
            { id: 'private', left: 'Calibração dos sensores, que não pode ser alcançada da internet', right: 'Privado', explanation: 'Só de dentro da VPC.', concepts: ['apigw.endpoint-types'] },
          ],
        },
      ],
      debrief: { takeaways: ['Borda para o mundo, regional para perto, privado para dentro da VPC.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f06.m3',
      title: 'O cliente guloso',
      type: 'mission',
      summary: 'Limitação de requisições e usage plans.',
      briefing: {
        company: 'Clima Já',
        role: 'Você protege a API de picos.',
        situation: 'Um app com bug passou a chamar a API 2.000 vezes por segundo, e os outros clientes começaram a receber erros. Os planos ainda não têm limites.',
        objective: 'Limitar cada cliente sem derrubar os outros.',
        successCriteria: ['Prever os 429', 'Usar usage plans', 'Não confundir chave de API com autorização'],
      },
      intel: [
        { conceptId: 'apigw.throttling', body: ['O limite é um **balde de tokens**: a **taxa** reabastece, o **burst** é o tamanho. Acima disso, **429**. A conta tem **10.000 req/s** com burst de **5.000** por Região.'] },
        { conceptId: 'apigw.usage-plans', body: ['O **usage plan** dá taxa, burst e **cota** a cada cliente, identificado pela **chave de API**. A chave **não é autorização**.'] },
      ],
      activities: [
        {
          id: 'int.f06.m3.a1',
          kind: 'predict',
          title: 'O pico da rádio',
          prompt: 'O plano da rádio tem taxa de 10 req/s e burst de 20. Num segundo, ela faz 50 chamadas; nos três seguintes, nenhuma. Quantas chamadas recebem 429?',
          concepts: [{ id: 'apigw.throttling' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O balde começa com 20 tokens: 20 chamadas passam e 30 recebem 429.'],
          spec: { sim: 'apigw', demand: [50, 0, 0, 0], limits: [{ rate: 10, burst: 20 }] },
          options: [
            { id: 'a', text: '30', outcome: '30' },
            { id: 'b', text: '40', outcome: '40' },
            { id: 'c', text: 'Nenhuma', outcome: '0' },
          ],
        },
        {
          id: 'int.f06.m3.a2',
          kind: 'predict',
          title: 'O menor limite vale',
          prompt: 'O usage plan do app dá 500 req/s com burst de 1.000, mas o método GET /previsao está limitado no estágio a 100 req/s com burst de 100. O app faz 150 chamadas por segundo durante 2 segundos. Quantas recebem 429?',
          concepts: [{ id: 'apigw.throttling' }, { id: 'apigw.usage-plans', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['Vale o menor limite entre as camadas: 100 req/s com burst de 100. Passam 100 por segundo; 50 por segundo recebem 429, 100 no total.'],
          spec: { sim: 'apigw', demand: [150, 150], limits: [{ rate: 500, burst: 1000 }, { rate: 100, burst: 100 }] },
          options: [
            { id: 'a', text: '100', outcome: '100' },
            { id: 'b', text: 'Nenhuma, porque o plano permite 500', outcome: '0' },
            { id: 'c', text: '50', outcome: '50' },
          ],
        },
        {
          id: 'int.f06.m3.a3',
          kind: 'decision',
          title: 'A chave como senha',
          prompt: 'O time quer usar só a chave de API para impedir que estranhos chamem a API de calibração. Isso basta?',
          concepts: [{ id: 'apigw.usage-plans' }, { id: 'apigw.auth', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A AWS avisa que chaves de API não servem como autorização. O controle de acesso é feito com IAM, Cognito ou autorizador Lambda.'],
          options: [
            { id: 'a', text: 'Não: a chave identifica o cliente para o plano; o acesso se controla com IAM, Cognito ou autorizador Lambda', correct: true, consequence: 'A API fica protegida por um mecanismo de autorização de verdade.' },
            { id: 'b', text: 'Sim: sem a chave, ninguém chama a API', correct: false, consequence: 'Chaves vazam e não são tratadas como credencial de autorização.' },
          ],
        },
      ],
      debrief: { takeaways: ['Balde de tokens: taxa e burst; acima, 429.', 'Vale o menor limite entre plano, método e conta.', 'Chave de API não é autorização.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f06.m4',
      title: 'Rápido e protegido',
      type: 'mission',
      summary: 'Cache e controle de acesso.',
      briefing: {
        company: 'Clima Já',
        role: 'Você reduz a carga e fecha o acesso.',
        situation: 'A previsão de cada cidade muda a cada 10 minutos, mas é calculada a cada chamada. O app do cliente final tem login próprio de usuários, e um parceiro chama de outra conta da AWS.',
        objective: 'Responder sem recalcular e escolher a autorização de cada cliente.',
        successCriteria: ['Usar o cache do estágio', 'Escolher a autorização'],
      },
      intel: [
        { conceptId: 'apigw.cache', body: ['Na API REST, o **cache do estágio** guarda respostas por um **TTL** (padrão de 300 s, até 3.600 s). Por padrão, só GET usa o cache. Cobrança **por hora**.'] },
        { conceptId: 'apigw.auth', body: ['**IAM** para serviços e outras contas. **Cognito** para usuários de um app. **Autorizador Lambda** para lógica própria.'] },
      ],
      activities: [
        {
          id: 'int.f06.m4.a1',
          kind: 'decision',
          title: 'Previsão que muda a cada 10 minutos',
          prompt: 'O GET /previsao/{cidade} é chamado milhares de vezes por minuto, e a previsão só muda a cada 10 minutos. Como cortar o custo das funções?',
          concepts: [{ id: 'apigw.cache' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O cache do estágio responde as chamadas repetidas sem chamar a função. Um TTL de 300 s mantém a previsão atual.'],
          options: [
            { id: 'a', text: 'Ligar o cache do estágio com TTL de 300 s', correct: true, consequence: 'A maioria das chamadas é respondida pelo cache.' },
            { id: 'b', text: 'Aumentar a memória das funções', correct: false, consequence: 'Cada chamada continua calculando a previsão.' },
            { id: 'c', text: 'Ligar o cache com TTL de 1 dia', correct: false, consequence: 'O TTL máximo é 3.600 s, e a previsão ficaria velha.' },
          ],
        },
        {
          id: 'int.f06.m4.a2',
          kind: 'match',
          title: 'Quem chama, como entra',
          prompt: 'Associe cada cliente ao jeito de autorizar.',
          concepts: [{ id: 'apigw.auth' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O mecanismo segue quem é o chamador.'],
          leftLabel: 'Cliente',
          rightLabel: 'Autorização',
          pairs: [
            { id: 'cognito', left: 'Usuários do app de celular, com login e senha', right: 'Amazon Cognito', explanation: 'Usuários de um app.', concepts: ['apigw.auth'] },
            { id: 'iam', left: 'Uma função de outra conta da AWS da empresa', right: 'IAM', explanation: 'Chamadas assinadas por uma role.', concepts: ['apigw.auth'] },
            { id: 'lambda', left: 'Parceiro que manda um token do provedor de identidade dele', right: 'Autorizador Lambda', explanation: 'Lógica própria para validar o token.', concepts: ['apigw.auth'] },
          ],
        },
      ],
      debrief: { takeaways: ['Cache do estágio para respostas repetidas.', 'IAM, Cognito ou autorizador Lambda, conforme quem chama.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f06.boss',
      title: 'Os planos da API',
      type: 'boss',
      summary: 'Taxa e burst de cada cliente.',
      briefing: {
        company: 'Clima Já',
        role: 'Você fecha os usage plans antes do lançamento.',
        situation: 'Quatro clientes têm padrões de uso diferentes. O financeiro quer limites justos: o uso legítimo passa, o excesso é barrado.',
        objective: 'Escolher, para cada cliente, a menor taxa e o menor burst que servem o uso legítimo sem 429.',
        successCriteria: ['Nenhum 429 no uso legítimo', 'Limites tão baixos quanto possível'],
      },
      intel: [{ conceptId: 'apigw.throttling', body: ['A taxa precisa acompanhar a média do uso; o burst precisa absorver o pico.'] }],
      activities: [
        {
          id: 'int.f06.boss.a1',
          kind: 'lab',
          lab: 'apigw',
          title: 'Os planos dos clientes',
          prompt: 'Para cada cliente, escolha a taxa e o burst do usage plan.',
          concepts: [{ id: 'apigw.throttling' }, { id: 'apigw.usage-plans' }],
          xp: 200,
          difficulty: 3,
          hints: ['O burst precisa ser pelo menos do tamanho da taxa.', 'Um pico isolado se resolve com burst; uso alto contínuo, só com taxa.'],
          explanation: ['Rádio: 10 req/s e burst 20. Agro: 50 e 100. TV: 100 e 400 (o pico de 350 cabe no balde). Aeroclube: 200 e 200 (150 por segundo sem parar pede taxa).'],
          config: CLIMA_PLANOS,
        },
      ],
      debrief: { takeaways: ['Taxa para a média, burst para o pico.'] },
    },
  ],
}
