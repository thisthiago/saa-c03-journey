/**
 * Conceitos da Fase 6 — API Gateway.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F06_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'apigw.what',
    title: 'Amazon API Gateway',
    officialName: 'Amazon API Gateway',
    serviceIds: ['aws.api-gateway', 'aws.lambda'],
    summary: 'O **API Gateway** recebe as chamadas da API e as encaminha a uma **integração**: uma função Lambda, um endpoint HTTP ou outro serviço da AWS. Ele cuida de autorização, limites de uso, versões em **estágios** e monitoramento. Há APIs **REST**, **HTTP** e **WebSocket**.',
    explanation: [
      'Exemplo: um app de celular chama a API de pedidos. O API Gateway confere o token do Cognito, limita cada cliente a 100 requisições por segundo e encaminha as chamadas a funções Lambda; nenhum servidor fica exposto.',
    ],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'alta',
      notes: 'Sinais: "expor uma API", "API sem servidor com Lambda", "limitar requisições" e "autorizar chamadas". A resposta é o API Gateway.',
    },
    references: [R.apigwWhat],
    tags: ['integracao'],
  },
  {
    id: 'apigw.rest-vs-http',
    title: 'API REST ou HTTP',
    officialName: 'REST APIs and HTTP APIs',
    serviceIds: ['aws.api-gateway'],
    summary: 'A **API HTTP** é mais simples e **mais barata**, com autorizador JWT. A **API REST** tem mais recursos: **chaves de API e limites por cliente**, validação de requisição, integração com o **AWS WAF**, endpoint **privado** e **cache**. Escolha REST quando precisar de um desses.',
    commonMistakes: ['Escolher a API HTTP e depois descobrir que ela não tem usage plans'],
    facts: ['Preço por milhão de chamadas em us-east-1 na tabela de 22/10/2026: US$ 3,50 na REST e US$ 1,00 na HTTP (primeira faixa).'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Escolha pela necessidade: chaves de API, usage plans, WAF, cache ou endpoint privado exigem a API REST; sem nenhum desses, a API HTTP sai mais barata.',
    },
    references: [R.apigwRestVsHttp],
    tags: ['integracao', 'custos'],
  },
  {
    id: 'apigw.endpoint-types',
    title: 'Tipos de endpoint',
    officialName: 'API endpoint types',
    serviceIds: ['aws.api-gateway'],
    summary: 'O endpoint **otimizado para borda** (padrão das APIs REST) passa pelos pontos de presença do CloudFront, bom para clientes espalhados pelo mundo. O **regional** atende clientes na mesma Região. O **privado** só é acessível de dentro de uma VPC, por um endpoint de interface.',
    exam: {
      domains: ['d1', 'd3'],
      relevance: 'media',
      notes: 'Sinais: "clientes no mundo todo" apontam para o endpoint otimizado para borda; "clientes na mesma Região", para o regional; "acessível só de dentro da VPC", para o privado.',
    },
    references: [R.apigwEndpoints],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'apigw.throttling',
    title: 'Limitação de requisições',
    officialName: 'Request throttling',
    serviceIds: ['aws.api-gateway'],
    summary: 'O API Gateway limita as requisições com um **balde de tokens**: a **taxa** reabastece o balde, e o **burst** é o tamanho dele. Acima do limite, o cliente recebe **429 Too Many Requests**. O limite padrão da conta é de **10.000 requisições por segundo**, com burst de **5.000**, por Região.',
    commonMistakes: ['Deixar um único cliente consumir todo o limite da conta e derrubar os outros'],
    facts: ['Os limites valem nesta ordem: por cliente no usage plan, por método no estágio e da conta na Região.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinal: "proteger o backend de picos de requisições" ou "erros 429". A resposta envolve limites de taxa e burst no estágio e, por cliente, usage plans.',
    },
    references: [R.apigwThrottling],
    tags: ['integracao', 'disponibilidade'],
  },
  {
    id: 'apigw.usage-plans',
    title: 'Usage plans e chaves de API',
    officialName: 'Usage plans and API keys',
    serviceIds: ['aws.api-gateway'],
    summary: 'O **usage plan** define taxa, burst e **cota** (por dia, semana ou mês) para cada cliente, identificado por uma **chave de API**. A AWS avisa: chave de API **não é autorização**. Para controlar o acesso, use IAM, Cognito ou um autorizador Lambda.',
    commonMistakes: ['Usar a chave de API como única proteção da API'],
    exam: {
      domains: ['d1', 'd2'],
      relevance: 'media',
      notes: 'Sinal: "cobrar ou limitar o uso da API por cliente". A resposta são usage plans com chaves de API, combinados com uma autorização de verdade.',
    },
    references: [R.apigwUsagePlans],
    tags: ['integracao', 'seguranca'],
  },
  {
    id: 'apigw.cache',
    title: 'Cache da API',
    officialName: 'API caching',
    serviceIds: ['aws.api-gateway'],
    summary: 'Nas APIs REST, o **cache do estágio** guarda as respostas por um **TTL** (padrão de **300 s**, até **3.600 s**) e responde sem chamar a integração. Por padrão, só os métodos GET usam o cache. O cache é cobrado **por hora**, conforme o tamanho escolhido.',
    commonMistakes: ['Ligar o cache e esperar que ele acelere uma API HTTP'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinal: "reduzir a latência e as chamadas ao backend em respostas que se repetem". A resposta é o cache do estágio numa API REST.',
    },
    references: [R.apigwCache],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'apigw.auth',
    title: 'Quem pode chamar a API',
    officialName: 'Controlling access to an API',
    serviceIds: ['aws.api-gateway', 'aws.cognito'],
    summary: 'O acesso à API é controlado com **IAM** (chamadas assinadas, bom para outros serviços e contas), **Amazon Cognito** (usuários de um app) ou um **autorizador Lambda** (lógica própria, como um token de outro provedor). A API HTTP tem também o **autorizador JWT**; a REST tem **políticas de recurso**.',
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Escolha pelo chamador: outros serviços e contas pedem IAM; usuários de um app, Cognito; tokens de outro provedor, um autorizador Lambda ou JWT.',
    },
    references: [R.apigwRestVsHttp, R.apigwUsagePlans],
    tags: ['integracao', 'seguranca'],
  },
]
