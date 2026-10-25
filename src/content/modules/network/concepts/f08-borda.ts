/**
 * Conceitos da Fase 8 — Entrega de conteúdo. Reaproveita edge.cloudfront,
 * edge.pop, edge.regional-edge-cache e edge.global-accelerator (Foundations).
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F08_NET_CONCEPTS: ConceptDef[] = [
  {
    id: 'cdn.oac',
    title: 'Origin access control (OAC)',
    officialName: 'CloudFront origin access control',
    serviceIds: ['aws.cloudfront', 'aws.s3'],
    summary: 'Com o **OAC**, o CloudFront **assina** as requisições ao bucket, e a política do bucket só libera o serviço `cloudfront.amazonaws.com` **daquela distribuição** (condição `AWS:SourceArn`). O bucket fica **privado**, e ninguém baixa os arquivos pulando o CloudFront.',
    commonMistakes: ['Deixar o bucket público "porque o CloudFront precisa ler"'],
    facts: [
      'A AWS recomenda o OAC no lugar da antiga origin access identity (OAI).',
      'O OAC funciona com SSE-KMS, com requisições PUT e DELETE e em todas as Regiões; a OAI não.',
      'Um bucket configurado como site estático é uma origem personalizada e não aceita OAC.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "servir arquivos de um bucket pelo CloudFront sem deixar o bucket público". A resposta é o OAC, com uma bucket policy que libera só a distribuição.',
    },
    references: [R.cfOac],
    tags: ['seguranca'],
  },
  {
    id: 'cdn.https-acm',
    title: 'HTTPS no CloudFront com certificado do ACM',
    officialName: 'SSL/TLS certificates with CloudFront',
    serviceIds: ['aws.cloudfront'],
    summary: 'Para usar o seu domínio com HTTPS no CloudFront, o certificado do **AWS Certificate Manager** precisa ser pedido ou importado na Região **us-east-1** (Norte da Virgínia), qualquer que seja a Região da origem.',
    commonMistakes: ['Criar o certificado em sa-east-1 e não encontrá-lo na lista do CloudFront'],
    facts: [
      'Para HTTPS entre o CloudFront e um balanceador de origem, o certificado do balanceador pode estar em qualquer Região.',
      'Certificados emitidos pelo ACM são renovados pelo próprio ACM.',
      'O certificado precisa cobrir o nome alternativo (o seu domínio) configurado na distribuição.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Se o certificado não aparece para a distribuição do CloudFront, ele foi criado na Região errada: precisa estar em us-east-1.',
    },
    references: [R.cfCerts],
    tags: ['seguranca'],
  },
  {
    id: 'cdn.signed',
    title: 'URLs assinadas e cookies assinados',
    officialName: 'CloudFront signed URLs and signed cookies',
    serviceIds: ['aws.cloudfront'],
    summary: 'Para conteúdo **pago ou restrito**, o CloudFront exige **URL assinada** (um arquivo, como o instalador de um aplicativo, ou clientes sem cookies) ou **cookie assinado** (vários arquivos, como todos os pedaços de um vídeo ou a área de assinantes, sem mudar as URLs).',
    facts: ['A AWS recomenda grupos de chaves confiáveis para assinar.', 'Se a requisição traz URL assinada e cookie assinado, vale a URL.', 'Restringir o acesso direto à origem (por exemplo, com OAC) evita que alguém pule a assinatura.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinais: "um arquivo para um usuário" aponta para URL assinada; "vários arquivos de uma área restrita, sem mudar as URLs", para cookie assinado. Para um bucket acessado direto, sem CloudFront, a resposta seria uma URL pré-assinada do S3.',
    },
    references: [R.cfPrivate, R.cfSignedChoice],
    tags: ['seguranca'],
  },
  {
    id: 'cdn.geo-restriction',
    title: 'Restrição geográfica',
    officialName: 'CloudFront geographic restrictions',
    serviceIds: ['aws.cloudfront'],
    summary: 'A **restrição geográfica** do CloudFront permite ou bloqueia países inteiros, com lista de permitidos ou de bloqueados, e devolve **403** para quem está fora. Vale para a **distribuição inteira**; para regras por cidade ou por arquivo, combine com um serviço de geolocalização de terceiros e URLs assinadas.',
    facts: ['A localização vem de uma base de terceiros, com precisão geral de 99,8% segundo a AWS.', 'Se o CloudFront não descobre o país, ele entrega o conteúdo.'],
    exam: {
      domains: ['d1'],
      relevance: 'media',
      notes: 'Sinal: "bloquear o acesso ao conteúdo a partir de determinados países". A resposta é a restrição geográfica do CloudFront ou uma regra de geolocalização no WAF.',
    },
    references: [R.cfGeo],
    tags: ['seguranca'],
  },
  {
    id: 'cdn.invalidation',
    title: 'Invalidação ou nomes versionados',
    officialName: 'CloudFront invalidation and versioned file names',
    serviceIds: ['aws.cloudfront'],
    summary: 'Para tirar um arquivo do cache antes do TTL, dá para **invalidar** o caminho, mas a AWS recomenda, para quem atualiza com frequência, **nomes versionados** (`app.v42.js`): não pagam invalidação, controlam a versão até no navegador do usuário e facilitam voltar atrás.',
    facts: ['A invalidação remove o objeto dos POPs e dos caches regionais.', 'Mesmo com invalidação, o usuário pode continuar vendo a versão antiga guardada no navegador ou num proxy.'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.cfInvalidation],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'cdn.edge-functions',
    title: 'CloudFront Functions × Lambda@Edge',
    officialName: 'CloudFront Functions and Lambda@Edge',
    serviceIds: ['aws.cloudfront', 'aws.lambda'],
    summary: 'As **CloudFront Functions** rodam JavaScript leve em **menos de um milissegundo**, com **milhões de requisições por segundo**, só nos eventos do usuário: cabeçalhos, redirecionamentos, normalização da chave de cache, validação de token. O **Lambda@Edge** roda Node.js ou Python por até **30 segundos**, com rede, arquivos e corpo da requisição, também nos eventos da origem.',
    commonMistakes: ['Usar Lambda@Edge para trocar um cabeçalho simples em todas as requisições'],
    facts: [
      'CloudFront Functions: até 2 MB de memória e 10 KB de código, sem acesso à rede nem ao corpo da requisição.',
      'Lambda@Edge: até 10.000 requisições por segundo por Região; até 10 GB de memória nos eventos de origem.',
      'Só o Lambda@Edge responde aos eventos de requisição e resposta da origem.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinais: "manipulação leve de cabeçalhos ou redirecionamentos em todas as requisições" aponta para as CloudFront Functions; "lógica mais pesada, com chamadas de rede ou acesso ao corpo da requisição", para o Lambda@Edge.',
    },
    references: [R.cfFunctions],
    tags: ['desempenho'],
  },
  {
    id: 'cdn.cf-vs-ga',
    title: 'CloudFront ou Global Accelerator',
    officialName: 'Choosing CloudFront or Global Accelerator',
    serviceIds: ['aws.cloudfront', 'aws.global-accelerator'],
    summary: 'O **CloudFront** guarda conteúdo HTTP e HTTPS em **cache** perto do usuário. O **Global Accelerator** dá **dois IPs anycast fixos**, leva **TCP e UDP** pela rede da AWS até o endpoint saudável e troca de Região **sem depender do cache do DNS**, mas **não guarda nada**. Jogos online, VoIP e clientes que liberam IPs fixos no firewall pedem o Global Accelerator.',
    facts: [
      'O Global Accelerator encerra a conexão TCP na borda e abre outra com o endpoint, o que reduz a latência.',
      'Endpoints do acelerador padrão: ALB, NLB, instâncias EC2 e Elastic IPs.',
      'Os IPs ficam com o acelerador enquanto ele existir; apagar o acelerador libera os IPs.',
      'O controle de tráfego por grupo de endpoints e os pesos por endpoint permitem testes e trocas graduais.',
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Questões de borda dão o tipo de tráfego: HTTP com conteúdo reaproveitável pede o CloudFront; TCP ou UDP, IPs fixos e failover rápido entre Regiões pedem o Global Accelerator.',
    },
    references: [R.gaHow],
    tags: ['desempenho', 'disponibilidade'],
  },
]
