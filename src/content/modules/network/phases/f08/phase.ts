/**
 * Fase 8 — Entrega de conteúdo. CloudFront (cache, OAC, HTTPS com ACM em
 * us-east-1, URLs e cookies assinados, restrição geográfica, invalidação,
 * CloudFront Functions e Lambda@Edge) e a escolha entre CloudFront e Global
 * Accelerator. Reaproveita os conceitos edge.* e o laboratório de borda.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { EdgeLabConfig } from '../../../../../simulators/edge/lab'
import type { EdgeSetup } from '../../../../../simulators/edge/model'
import { META } from '../meta'

const BATUQUE_SETUP: EdgeSetup = {
  origin: { kind: 's3', region: 'sa-east-1', label: 'Bucket S3 em sa-east-1' },
  rec: { region: 'rec-europa', label: 'Regional Edge Cache na Europa' },
  popLabel: 'POP perto do ouvinte, em Lisboa',
  latency: { viewerPop: 10, popRec: 20, recOrigin: 190, popOrigin: 200 },
  popEvictAfterIdleSec: 1800,
}

export const BATUQUE_EDGE: EdgeLabConfig = {
  setup: BATUQUE_SETUP,
  ttlOptions: [0, 60, 300, 3600, 86400],
  allowInvalidation: true,
  events: [
    { at: 0, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
    { at: 4, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
    { at: 8, kind: 'request', method: 'GET', path: '/api/minha-playlist' },
    { at: 15, kind: 'request', method: 'GET', path: '/lancamentos.json' },
    { at: 40, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
    { at: 70, kind: 'request', method: 'GET', path: '/capas/choro.jpg' },
    { at: 75, kind: 'request', method: 'GET', path: '/capas/choro.jpg' },
    { at: 100, kind: 'request', method: 'GET', path: '/api/minha-playlist' },
    { at: 500, kind: 'origin-update', path: '/lancamentos.json' },
    { at: 650, kind: 'request', method: 'GET', path: '/lancamentos.json' },
    { at: 1400, kind: 'request', method: 'GET', path: '/lancamentos.json' },
    { at: 3800, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
    { at: 4000, kind: 'request', method: 'GET', path: '/lancamentos.json' },
    { at: 7400, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
  ],
  initial: {
    behaviors: [
      { pattern: '/api/*', cache: true, ttlSec: 3600 },
      { pattern: '/lancamentos.json', cache: true, ttlSec: 86400 },
      { pattern: '*', cache: false, ttlSec: 0 },
    ],
    invalidateOnUpdate: false,
  },
  solution: {
    behaviors: [
      { pattern: '/api/*', cache: false, ttlSec: 0 },
      { pattern: '/lancamentos.json', cache: true, ttlSec: 60 },
      { pattern: '*', cache: true, ttlSec: 86400 },
    ],
    invalidateOnUpdate: false,
  },
  goals: [
    { kind: 'never-cached', prefix: '/api/', concepts: ['edge.cloudfront'] },
    { kind: 'max-stale', path: '/lancamentos.json', seconds: 300, concepts: ['edge.cloudfront', 'cdn.invalidation'] },
    { kind: 'origin-max', max: 8, concepts: ['edge.cloudfront', 'edge.regional-edge-cache'] },
  ],
}

export const F08_NET: PhaseDef = {
  ...META.f08,
  concepts: ['edge.cloudfront', 'edge.pop', 'edge.regional-edge-cache', 'cdn.invalidation', 'cdn.oac', 'cdn.https-acm', 'cdn.signed', 'cdn.geo-restriction', 'cdn.edge-functions', 'edge.global-accelerator', 'cdn.cf-vs-ga'],
  availability: 'available',
  simplifications: ['O laboratório usa um POP e um cache regional, com TTL fixo por comportamento e latências ilustrativas.', 'O serviço de música e os números são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f08.m1',
      title: 'A capa que demora',
      type: 'mission',
      summary: 'Cache do CloudFront, POPs, cache regional e como atualizar arquivos.',
      briefing: {
        company: 'Streaming de Música Batuque',
        role: 'Você cuida da entrega de conteúdo de um serviço de música.',
        situation: 'Os ouvintes em Portugal reclamam que as capas dos álbuns demoram. Tudo fica num bucket em São Paulo. Quando a equipe troca o arquivo de lançamentos, alguns ouvintes ainda veem a lista antiga.',
        objective: 'Entender por onde passa cada requisição e como atualizar arquivos que estão em cache.',
        successCriteria: ['Prever quem responde a uma requisição', 'Escolher entre invalidação e nomes versionados'],
      },
      intel: [
        { conceptId: 'edge.cloudfront', body: ['O **CloudFront** responde do **POP** quando tem cópia válida; se não tem, pergunta ao **cache regional** e, por fim, à **origem**.'] },
        { conceptId: 'cdn.invalidation', body: ['Para quem atualiza com frequência, a AWS recomenda **nomes versionados** (capa.v3.jpg) em vez de invalidar a cada mudança.'] },
      ],
      activities: [
        {
          id: 'net.f08.m1.a1',
          kind: 'predict',
          title: 'A segunda requisição',
          prompt: 'Com cache de um dia para as capas, um ouvinte pede samba.jpg, e outro pede a mesma capa quatro segundos depois, pelo mesmo POP. Quem responde à segunda requisição?',
          concepts: [{ id: 'edge.cloudfront' }, { id: 'edge.pop', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['A primeira requisição foi à origem e deixou a cópia no POP e no cache regional. A segunda encontra a cópia válida no POP.'],
          spec: {
            sim: 'edge',
            setup: BATUQUE_SETUP,
            behaviors: [{ pattern: '*', cache: true, ttlSec: 86400 }],
            events: [
              { at: 0, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
              { at: 4, kind: 'request', method: 'GET', path: '/capas/samba.jpg' },
            ],
          },
          options: [
            { id: 'a', text: 'O POP, com a cópia guardada', outcome: 'pop' },
            { id: 'b', text: 'O cache regional', outcome: 'rec' },
            { id: 'c', text: 'O bucket em São Paulo', outcome: 'origin' },
          ],
        },
        {
          id: 'net.f08.m1.a2',
          kind: 'predict',
          title: 'A capa esquecida',
          prompt: 'Uma capa pouco ouvida foi pedida às 0h e só volta a ser pedida uma hora depois. O POP descarta objetos parados há mais de 30 minutos (premissa do cenário), e o TTL é de um dia. Quem responde?',
          concepts: [{ id: 'edge.regional-edge-cache' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O POP já descartou a capa pouco acessada, mas o cache regional, maior, ainda tem a cópia válida. A requisição não vai até São Paulo.'],
          spec: {
            sim: 'edge',
            setup: BATUQUE_SETUP,
            behaviors: [{ pattern: '*', cache: true, ttlSec: 86400 }],
            events: [
              { at: 0, kind: 'request', method: 'GET', path: '/capas/choro.jpg' },
              { at: 3600, kind: 'request', method: 'GET', path: '/capas/choro.jpg' },
            ],
          },
          options: [
            { id: 'a', text: 'O cache regional', outcome: 'rec' },
            { id: 'b', text: 'O POP', outcome: 'pop' },
            { id: 'c', text: 'O bucket em São Paulo', outcome: 'origin' },
          ],
        },
        {
          id: 'net.f08.m1.a3',
          kind: 'decision',
          title: 'A capa trocada',
          prompt: 'A equipe troca capas e folhas de estilo várias vezes por semana e hoje invalida tudo a cada troca. O que a AWS recomenda?',
          concepts: [{ id: 'cdn.invalidation' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Nomes versionados controlam a versão até no navegador e em proxies, não pagam invalidação e facilitam voltar atrás. A invalidação fica para emergências.'],
          options: [
            { id: 'a', text: 'Publicar arquivos com nomes versionados (capa.v3.jpg) e apontar as páginas para o nome novo', correct: true, consequence: 'O arquivo novo nunca esteve em cache, e ninguém vê o antigo.' },
            { id: 'b', text: 'Continuar invalidando tudo a cada troca', correct: false, consequence: 'Funciona nos caches do CloudFront, mas navegadores e proxies podem guardar a versão antiga.' },
            { id: 'c', text: 'Desligar o cache das capas', correct: false, consequence: 'Toda requisição volta a ir até São Paulo, e a lentidão piora.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cópia válida no POP responde na hora; o cache regional segura o que o POP descartou.', 'Para atualizações frequentes, nomes versionados; invalidação para emergências.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f08.m2',
      title: 'Música só para assinantes',
      type: 'mission',
      summary: 'OAC, HTTPS com certificado do ACM, URLs e cookies assinados e restrição geográfica.',
      briefing: {
        company: 'Streaming de Música Batuque',
        role: 'Você protege o conteúdo pago do serviço.',
        situation: 'O bucket das músicas está público "para o CloudFront conseguir ler". As faixas completas são só para assinantes, o domínio próprio precisa de HTTPS e um contrato proíbe a distribuição em alguns países.',
        objective: 'Fechar o bucket, exigir assinatura e cumprir o contrato.',
        successCriteria: ['Usar OAC', 'Saber em que Região fica o certificado', 'Escolher entre URL e cookie assinados'],
      },
      intel: [
        { conceptId: 'cdn.oac', body: ['Com **OAC**, o bucket fica **privado** e só aceita o CloudFront daquela distribuição. A AWS recomenda o OAC no lugar da antiga OAI.'] },
        { conceptId: 'cdn.https-acm', body: ['O certificado do ACM para o seu domínio no CloudFront fica em **us-east-1**.'] },
        { conceptId: 'cdn.signed', body: ['**URL assinada**: um arquivo. **Cookie assinado**: vários arquivos, sem mudar as URLs.'] },
      ],
      activities: [
        {
          id: 'net.f08.m2.a1',
          kind: 'decision',
          title: 'O bucket público',
          prompt: 'Como impedir que alguém baixe as músicas direto do bucket, pulando o CloudFront?',
          concepts: [{ id: 'cdn.oac' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com origin access control, o CloudFront assina as requisições, e a política do bucket só libera o serviço cloudfront.amazonaws.com daquela distribuição. O acesso público é removido.'],
          options: [
            { id: 'a', text: 'Bloquear o acesso público e usar origin access control, com a política do bucket liberando só a distribuição', correct: true, consequence: 'Quem tenta o bucket direto recebe acesso negado.' },
            { id: 'b', text: 'Manter o bucket público e esconder o nome dele', correct: false, consequence: 'Nome escondido não é controle de acesso.' },
            { id: 'c', text: 'Configurar o bucket como site estático e usar OAC', correct: false, consequence: 'Bucket configurado como site é origem personalizada e não aceita OAC.' },
          ],
        },
        {
          id: 'net.f08.m2.a2',
          kind: 'decision',
          title: 'O certificado sumido',
          prompt: 'A equipe pediu o certificado de musica.batuque.com no ACM em sa-east-1, mas ele não aparece na distribuição do CloudFront. Por quê?',
          concepts: [{ id: 'cdn.https-acm' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Para HTTPS entre os ouvintes e o CloudFront, o certificado do ACM precisa ser pedido ou importado em us-east-1, qualquer que seja a Região da origem.'],
          options: [
            { id: 'a', text: 'O certificado precisa estar em us-east-1', correct: true, consequence: 'Pedido em us-east-1, ele aparece para a distribuição.' },
            { id: 'b', text: 'O CloudFront só aceita certificados de terceiros', correct: false, consequence: 'A AWS recomenda justamente o ACM.' },
            { id: 'c', text: 'O certificado precisa estar na Região do bucket', correct: false, consequence: 'A Região da origem não importa para o certificado da distribuição.' },
          ],
        },
        {
          id: 'net.f08.m2.a3',
          kind: 'match',
          title: 'Cada proteção, seu caso',
          prompt: 'Associe cada necessidade ao recurso do CloudFront.',
          concepts: [{ id: 'cdn.signed' }, { id: 'cdn.geo-restriction' }, { id: 'cdn.oac' }],
          xp: 60,
          difficulty: 2,
          explanation: ['URL assinada para um arquivo, cookie assinado para muitos arquivos sem trocar as URLs, restrição geográfica para países e OAC para fechar o bucket.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Recurso',
          pairs: [
            { id: 'url', left: 'Liberar o download de um único álbum comprado', right: 'URL assinada', explanation: 'Restringe o acesso a um arquivo.', concepts: ['cdn.signed'] },
            { id: 'cookie', left: 'Liberar todas as faixas da área de assinantes sem mudar as URLs', right: 'Cookie assinado', explanation: 'Vale para vários arquivos.', concepts: ['cdn.signed'] },
            { id: 'geo', left: 'Não distribuir nos países fora do contrato', right: 'Restrição geográfica', explanation: 'Bloqueia países inteiros com 403.', concepts: ['cdn.geo-restriction'] },
            { id: 'oac', left: 'Impedir o acesso direto ao bucket', right: 'Origin access control', explanation: 'O bucket só aceita a distribuição.', concepts: ['cdn.oac'] },
          ],
        },
      ],
      debrief: { takeaways: ['OAC fecha o bucket atrás do CloudFront.', 'Certificado do CloudFront no ACM em us-east-1.', 'URL assinada para um arquivo; cookie para muitos.', 'Restrição geográfica bloqueia países inteiros.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f08.m3',
      title: 'Código na borda e IPs fixos',
      type: 'mission',
      summary: 'CloudFront Functions, Lambda@Edge e quando a resposta é o Global Accelerator.',
      briefing: {
        company: 'Streaming de Música Batuque',
        role: 'Você decide onde rodar código na borda e como servir o rádio ao vivo.',
        situation: 'A equipe quer redirecionar URLs antigas, montar respostas com dados de outro serviço e lançar um rádio ao vivo por UDP, para parceiros que só liberam IPs fixos nos firewalls.',
        objective: 'Escolher entre CloudFront Functions e Lambda@Edge e entre CloudFront e Global Accelerator.',
        successCriteria: ['Pôr cada função no lugar certo', 'Reconhecer o caso do Global Accelerator'],
      },
      intel: [
        { conceptId: 'cdn.edge-functions', body: ['**CloudFront Functions**: JavaScript leve, menos de 1 ms, eventos do usuário. **Lambda@Edge**: até 30 s, rede, arquivos e corpo da requisição, também nos eventos da origem.'] },
        { conceptId: 'cdn.cf-vs-ga', body: ['**Global Accelerator**: dois **IPs anycast fixos**, **TCP e UDP**, sem cache, troca de Região sem depender do DNS.'] },
      ],
      activities: [
        {
          id: 'net.f08.m3.a1',
          kind: 'classify',
          title: 'Functions ou Lambda@Edge',
          prompt: 'Classifique cada tarefa pelo recurso mais adequado.',
          concepts: [{ id: 'cdn.edge-functions' }],
          xp: 60,
          difficulty: 2,
          explanation: ['Tarefas leves e rápidas sobre cabeçalhos e URLs ficam nas CloudFront Functions. O que precisa de rede, corpo da requisição, bibliotecas ou eventos da origem vai para o Lambda@Edge.'],
          bins: [
            { id: 'cff', label: 'CloudFront Functions' },
            { id: 'le', label: 'Lambda@Edge' },
          ],
          items: [
            { id: 'redirect', text: 'Redirecionar URLs antigas para as novas', bin: 'cff', explanation: 'Redirecionamento é caso de uso das CloudFront Functions.', concepts: ['cdn.edge-functions'] },
            { id: 'header', text: 'Adicionar um cabeçalho de segurança a toda resposta', bin: 'cff', explanation: 'Manipular cabeçalhos é leve e rápido.', concepts: ['cdn.edge-functions'] },
            { id: 'token', text: 'Validar um token JWT no cabeçalho antes de liberar o conteúdo', bin: 'cff', explanation: 'Validação de token está entre os casos das CloudFront Functions.', concepts: ['cdn.edge-functions'] },
            { id: 'api', text: 'Montar a resposta com dados buscados em outro serviço pela rede', bin: 'le', explanation: 'Só o Lambda@Edge tem acesso à rede.', concepts: ['cdn.edge-functions'] },
            { id: 'body', text: 'Ler o corpo da requisição para decidir a origem', bin: 'le', explanation: 'Só o Lambda@Edge acessa o corpo da requisição.', concepts: ['cdn.edge-functions'] },
          ],
        },
        {
          id: 'net.f08.m3.a2',
          kind: 'decision',
          title: 'O rádio ao vivo',
          prompt: 'O rádio ao vivo usa UDP, roda em duas Regiões e os parceiros só liberam IPs fixos nos firewalls. O que colocar na frente?',
          concepts: [{ id: 'cdn.cf-vs-ga' }, { id: 'edge.global-accelerator' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Global Accelerator dá dois IPs anycast fixos, aceita UDP, leva o tráfego pela rede da AWS e troca de Região pela saúde dos endpoints. O CloudFront trabalha com HTTP e HTTPS e guarda em cache.'],
          options: [
            { id: 'a', text: 'AWS Global Accelerator', correct: true, consequence: 'IPs fixos para os parceiros, UDP e troca rápida de Região.' },
            { id: 'b', text: 'Amazon CloudFront', correct: false, consequence: 'O CloudFront não atende UDP e não dá dois IPs fixos.' },
            { id: 'c', text: 'Um Elastic IP em cada Região', correct: false, consequence: 'Os parceiros teriam de liberar vários IPs, e a troca de Região dependeria do DNS.' },
          ],
        },
      ],
      debrief: { takeaways: ['Código leve na borda: CloudFront Functions. Rede, corpo ou origem: Lambda@Edge.', 'UDP, IPs fixos e troca rápida de Região: Global Accelerator.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f08.boss',
      title: 'O cache do Batuque',
      type: 'boss',
      summary: 'Configure os comportamentos de cache para os ouvintes de Lisboa.',
      briefing: {
        company: 'Streaming de Música Batuque',
        role: 'Você ajusta a distribuição do CloudFront.',
        situation: 'Hoje, as capas não têm cache, a playlist pessoal de cada ouvinte fica em cache por uma hora e a lista de lançamentos, por um dia. Resultado: lentidão, listas antigas e o risco de um ouvinte ver a playlist de outro.',
        objective: 'Cumprir as três metas de cache.',
        successCriteria: ['Playlists nunca saem do cache', 'Lançamentos desatualizados por no máximo 5 minutos', 'No máximo 8 requisições chegam a São Paulo'],
      },
      intel: [{ conceptId: 'edge.cloudfront', body: ['Respostas personalizadas **nunca** vão para o cache. Arquivos estáticos ficam com TTL longo. Arquivos que mudam pedem TTL curto.'] }],
      activities: [
        {
          id: 'net.f08.boss.a1',
          kind: 'lab',
          lab: 'edge',
          title: 'Três comportamentos',
          prompt: 'Ajuste o cache e o TTL de cada comportamento e rode a simulação até cumprir as três metas.',
          concepts: [{ id: 'edge.cloudfront' }, { id: 'edge.regional-edge-cache' }, { id: 'cdn.invalidation' }],
          xp: 200,
          difficulty: 3,
          hints: ['/api/* é pessoal: sem cache.', 'Os lançamentos aceitam até 5 minutos de atraso: um TTL de 60 segundos atende.'],
          explanation: ['/api/* sem cache, /lancamentos.json com TTL de 60 segundos e o resto, as capas, com TTL de um dia. As playlists vêm sempre da origem, a lista nova aparece em até um minuto e as capas saem do POP ou do cache regional.'],
          config: BATUQUE_EDGE,
        },
        {
          id: 'net.f08.boss.a2',
          kind: 'decision',
          title: 'Os lançamentos de sexta',
          prompt: 'Toda sexta à meia-noite sai a lista de lançamentos, e a gravadora quer que ela apareça na hora, sem esperar o TTL. O que fazer?',
          concepts: [{ id: 'cdn.invalidation' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Publicar a lista com um nome novo (lancamentos-2026-10-23.json) e apontar o site para ele faz a mudança aparecer na hora, sem pagar invalidação e sem depender do cache dos navegadores.'],
          options: [
            { id: 'a', text: 'Publicar a lista com um nome versionado e apontar o site para o nome novo', correct: true, consequence: 'O arquivo novo nunca esteve em cache.' },
            { id: 'b', text: 'Baixar o TTL de todos os arquivos para zero', correct: false, consequence: 'Todas as capas voltam a ir até São Paulo.' },
          ],
        },
      ],
      debrief: { takeaways: ['Conteúdo pessoal sem cache; estático com TTL longo; o que muda com TTL curto ou nome versionado.'] },
    },
  ],
}
