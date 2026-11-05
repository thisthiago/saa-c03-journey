/**
 * Questões da Revisão da Fase 8 de Redes (entrega de conteúdo), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 'net.f08',
  questions: [
    {
      id: 'rv:net.f08.m1.a3',
      kind: 'decision',
      title: 'Folhas de estilo trocadas toda semana',
      prompt:
        'Um site entregue pelo Amazon CloudFront troca arquivos JavaScript e folhas de estilo várias vezes por semana e hoje **invalida todos os caminhos** a cada publicação. A empresa quer **parar de pagar invalidações** e garantir que nenhum visitante fique com a versão antiga, nem no navegador. Qual prática a AWS recomenda?',
      concepts: [{ id: 'cdn.invalidation' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Invalidar só os arquivos alterados, logo depois de cada publicação.', correct: false, consequence: 'Paga menos caminhos, mas continua pagando, e navegadores e proxies podem manter a versão antiga.' },
        { id: 'b', text: 'Nomes versionados, como app.v42.js, com as páginas apontando para eles.', correct: true, consequence: 'O arquivo novo nunca esteve em cache: ninguém vê o antigo, e não há invalidação a pagar.' },
        { id: 'c', text: 'Baixar o TTL desses arquivos para zero no comportamento de cache da distribuição.', correct: false, consequence: 'Toda requisição volta à origem, o site fica mais lento e a origem recebe toda a carga.' },
        { id: 'd', text: 'Manter a invalidação de todos os caminhos e avisar os visitantes por e-mail.', correct: false, consequence: 'Mantém o custo, e o navegador de quem já visitou o site pode continuar com a versão antiga.' },
      ],
      explanation: [
        'Para quem atualiza com frequência, a AWS recomenda **nomes versionados**: cada publicação gera um arquivo com nome novo (app.v42.js), e as páginas passam a apontar para ele. O arquivo novo nunca esteve em cache, então ninguém recebe a versão antiga, nem do navegador; não há invalidação a pagar, e voltar atrás é apontar para o nome anterior.',
        'Invalidar menos caminhos ainda custa e não alcança o cache dos navegadores. TTL zero tira o benefício do CloudFront. E manter a invalidação total mantém o problema.',
        '**Regra prática:** atualização frequente pede nomes versionados; a invalidação fica para emergências, quando um arquivo publicado precisa sumir dos caches antes do TTL.',
      ],
    },
    {
      id: 'rv:net.f08.boss.a2',
      kind: 'decision',
      title: 'Um preço errado no cache',
      prompt:
        'Um arquivo precos.json, sem versão no nome e com TTL de um dia, foi publicado com um **preço errado** e já está nos caches do CloudFront. As páginas que o carregam também estão em cache. A empresa precisa que **o arquivo corrigido chegue aos visitantes o quanto antes**. Qual ação atende?',
      concepts: [{ id: 'cdn.invalidation' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Corrigir o arquivo na origem e esperar o TTL de um dia vencer.', correct: false, consequence: 'O preço errado continua sendo entregue por até um dia.' },
        { id: 'b', text: 'Corrigir o arquivo na origem e invalidar o caminho /precos.json.', correct: true, consequence: 'A invalidação remove o objeto dos POPs e dos caches regionais, e a próxima requisição busca a versão corrigida.' },
        { id: 'c', text: 'Publicar precos.v2.json e esperar as páginas pegarem o nome novo.', correct: false, consequence: 'As páginas em cache continuam apontando para precos.json até o TTL delas vencer.' },
        { id: 'd', text: 'Baixar para zero o TTL do comportamento de cache dos arquivos JSON.', correct: false, consequence: 'Vale para objetos buscados daqui em diante; a cópia errada que já está em cache não sai.' },
      ],
      explanation: [
        'Esta é a emergência para a qual a **invalidação** existe: um arquivo já publicado, sem versão no nome, precisa sair dos caches antes do TTL. Invalidar /precos.json remove o objeto dos POPs e dos caches regionais, e a próxima requisição busca a versão corrigida na origem.',
        'Esperar o TTL mantém o erro no ar por um dia. Um nome novo não ajuda enquanto as páginas em cache apontam para o antigo. E mudar o TTL não remove a cópia que já está guardada.',
        '**Regra prática:** nomes versionados evitam o problema nas próximas publicações; para tirar do cache, agora, um arquivo já publicado, use a invalidação. Lembre que navegadores e proxies podem ter guardado a cópia antiga.',
      ],
    },
    {
      id: 'rv:net.f08.m2.a1',
      kind: 'decision',
      title: 'Um bucket de site estático atrás do CloudFront',
      prompt:
        'Uma distribuição do CloudFront usa como origem o **endpoint de site estático** de um bucket público. A segurança quer **bloquear o acesso público** ao bucket e garantir que os arquivos só sejam baixados **pelo CloudFront**. O site não usa redirecionamentos do S3. Qual configuração atende?',
      concepts: [{ id: 'cdn.oac' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Manter o endpoint de site estático como origem e ligar o OAC nela.', correct: false, consequence: 'Um bucket configurado como site estático é uma origem personalizada e não aceita OAC.' },
        { id: 'b', text: 'Origem no endpoint REST, com OAC e bucket policy só para a distribuição.', correct: true, consequence: 'O CloudFront assina as requisições, e o bucket, privado, só aceita aquela distribuição.' },
        { id: 'c', text: 'Manter o bucket público e esconder o nome dele nas páginas do site.', correct: false, consequence: 'Esconder o nome não é controle de acesso: quem descobrir o endereço baixa direto.' },
        { id: 'd', text: 'Bloquear o acesso público e manter o endpoint de site estático como origem.', correct: false, consequence: 'O endpoint de site estático só serve conteúdo público: o CloudFront passaria a receber erros.' },
      ],
      explanation: [
        'Com **origin access control (OAC)**, o CloudFront assina as requisições ao bucket, e a bucket policy só libera o serviço cloudfront.amazonaws.com daquela distribuição, pela condição AWS:SourceArn. Mas o OAC só funciona com o **endpoint REST** do bucket: um bucket configurado como site estático é uma origem personalizada e não o aceita. Por isso a origem precisa mudar.',
        'O endpoint de site estático não aceita OAC e só serve conteúdo público. E esconder o nome do bucket não protege nada.',
        '**Regra prática:** bucket privado atrás do CloudFront é endpoint REST com OAC e uma bucket policy que libera só a distribuição. Endpoint de site estático exige bucket público.',
      ],
    },
    {
      id: 'rv:net.f08.oac-kms',
      kind: 'decision',
      title: 'Arquivos criptografados com KMS no CloudFront',
      prompt:
        'Os arquivos de um bucket são criptografados com **SSE-KMS**, por exigência da auditoria, e a distribuição do CloudFront usa a antiga **origin access identity (OAI)**. Os visitantes recebem erro ao baixar os arquivos. A empresa quer manter o bucket privado e o **SSE-KMS**. Qual mudança atende?',
      concepts: [{ id: 'cdn.oac' }],
      xp: 5,
      difficulty: 3,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Trocar a criptografia para SSE-S3, que a OAI consegue ler.', correct: false, consequence: 'Resolve o erro, mas viola a exigência de manter o SSE-KMS.' },
        { id: 'b', text: 'Liberar a OAI na política da chave do KMS e manter o resto.', correct: false, consequence: 'A OAI não funciona com SSE-KMS; liberar a chave para ela não muda isso.' },
        { id: 'c', text: 'Migrar para OAC e liberar a distribuição na política da chave.', correct: true, consequence: 'O OAC funciona com SSE-KMS, e a chave passa a aceitar as requisições assinadas pela distribuição.' },
        { id: 'd', text: 'Tornar o bucket público só para leitura dos arquivos criptografados.', correct: false, consequence: 'Contraria a exigência de bucket privado, e o objeto continua precisando da chave para ser lido.' },
      ],
      explanation: [
        'A **OAI**, mecanismo antigo, não funciona com objetos criptografados com **SSE-KMS**; o **OAC** funciona, e é o que a AWS recomenda hoje. Na migração, além da bucket policy que libera a distribuição, a **política da chave do KMS** precisa permitir que o CloudFront use a chave em nome daquela distribuição.',
        'Trocar para SSE-S3 viola a auditoria. Liberar a chave para a OAI não supera a limitação dela. E bucket público é o oposto do pedido.',
        '**Regra prática:** SSE-KMS atrás do CloudFront pede OAC, com permissões na bucket policy e na política da chave. A OAI só aparece em configurações antigas.',
      ],
    },
    {
      id: 'rv:net.f08.m2.a2',
      kind: 'decision',
      title: 'Dois certificados para um caminho só',
      prompt:
        'Uma loja usa loja.empresa.com numa distribuição do CloudFront, cuja origem é um Application Load Balancer em **sa-east-1**. A segurança exige **HTTPS nos dois trechos**: do visitante ao CloudFront e do CloudFront ao balanceador. Os certificados virão do AWS Certificate Manager. Onde eles precisam estar? (Escolha DUAS.)',
      concepts: [{ id: 'cdn.https-acm' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      multiple: true,
      options: [
        { id: 'a', text: 'O certificado da distribuição, em us-east-1.', correct: true, consequence: 'O CloudFront só usa certificados do ACM pedidos ou importados em us-east-1.' },
        { id: 'b', text: 'O certificado da distribuição, em sa-east-1, junto da origem.', correct: false, consequence: 'Não aparece para a distribuição: a Região da origem não importa para o certificado do CloudFront.' },
        { id: 'c', text: 'O certificado do balanceador, em sa-east-1.', correct: true, consequence: 'O balanceador usa um certificado da própria Região para o HTTPS com o CloudFront.' },
        { id: 'd', text: 'O certificado do balanceador, em us-east-1, junto do da distribuição.', correct: false, consequence: 'Os certificados do ACM são regionais: o balanceador em sa-east-1 não usa um certificado de us-east-1.' },
        { id: 'e', text: 'Um único certificado em sa-east-1, usado pelos dois.', correct: false, consequence: 'O CloudFront não enxerga certificados fora de us-east-1.' },
      ],
      explanation: [
        'Cada trecho tem a sua regra. Para o visitante usar o seu domínio com HTTPS no CloudFront, o certificado do ACM precisa estar em **us-east-1**, qualquer que seja a Região da origem. Para o trecho até a origem, o **balanceador** usa um certificado da **Região dele**, sa-east-1.',
        'Um certificado da distribuição em sa-east-1 não aparece para o CloudFront. E o balanceador não usa certificado de outra Região.',
        '**Regra prática:** certificado do CloudFront fica sempre em us-east-1; certificado do balanceador fica na Região do balanceador.',
      ],
    },
    {
      id: 'rv:net.f08.m2.a3',
      kind: 'decision',
      title: 'O instalador de quem comprou',
      prompt:
        'Uma empresa vende um aplicativo e entrega o instalador, **um arquivo**, pelo CloudFront. Cada cliente que paga deve conseguir baixá-lo por **24 horas**. Muitos clientes usam gerenciadores de download que **não aceitam cookies**. Qual recurso atende?',
      concepts: [{ id: 'cdn.signed' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Cookies assinados do CloudFront, válidos por 24 horas.', correct: false, consequence: 'Os gerenciadores de download não aceitam cookies, e o acesso falharia para esses clientes.' },
        { id: 'b', text: 'Restrição geográfica liberando só os países dos clientes.', correct: false, consequence: 'Libera ou bloqueia países inteiros; não sabe quem pagou pelo aplicativo.' },
        { id: 'c', text: 'URLs assinadas do CloudFront, válidas por 24 horas.', correct: true, consequence: 'Cada cliente recebe uma URL própria para o arquivo, que funciona sem cookies e expira no prazo.' },
        { id: 'd', text: 'Uma URL fixa e secreta, enviada só aos clientes que pagaram.', correct: false, consequence: 'Uma URL que não expira pode ser repassada a qualquer um para sempre.' },
      ],
      explanation: [
        'A **URL assinada** é a escolha para **um arquivo** e para clientes que **não aceitam cookies**. Cada compra gera uma URL própria, com validade de 24 horas, e o CloudFront só entrega o instalador a quem apresentar uma URL válida.',
        'Cookies assinados servem para vários arquivos sem mudar as URLs, mas exigem cookies. A restrição geográfica não sabe quem pagou. E uma URL fixa não expira.',
        '**Regra prática:** um arquivo ou clientes sem cookies, URL assinada; muitos arquivos de uma área restrita sem mudar as URLs, cookie assinado.',
      ],
    },
    {
      id: 'rv:net.f08.assinatura-pulada',
      kind: 'decision',
      title: 'Vídeos pagos baixados por outro caminho',
      prompt:
        'Uma plataforma protege os vídeos pagos com **cookies assinados** do CloudFront. Mesmo assim, alguns vídeos estão sendo baixados por quem não assina: a análise mostrou que as requisições vão **direto ao bucket do S3**, que ainda é público. Qual mudança fecha esse caminho?',
      concepts: [{ id: 'cdn.signed' }, { id: 'cdn.oac' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Reduzir a validade dos cookies assinados para cinco minutos.', correct: false, consequence: 'Quem baixa direto do bucket nem passa pelo CloudFront, e a validade dos cookies não importa.' },
        { id: 'b', text: 'Trocar os cookies assinados por URLs assinadas.', correct: false, consequence: 'A assinatura continua só no CloudFront, e o bucket público segue aberto.' },
        { id: 'c', text: 'Ligar a restrição geográfica do CloudFront nos países do ataque.', correct: false, consequence: 'O acesso direto ao bucket não passa pelo CloudFront, e a restrição não vale para ele.' },
        { id: 'd', text: 'Tornar o bucket privado, com OAC liberando só a distribuição.', correct: true, consequence: 'O bucket passa a aceitar só o CloudFront, que exige a assinatura em cada requisição.' },
      ],
      explanation: [
        'URLs e cookies assinados controlam o acesso **no CloudFront**. Se a origem continua pública, quem descobre o endereço do bucket pula a assinatura. Restringir o acesso direto, com **OAC** e uma bucket policy que só libera a distribuição, faz toda requisição passar pelo CloudFront e, portanto, pela verificação da assinatura.',
        'Mudar a validade ou o tipo da assinatura não afeta quem vai direto ao bucket. E a restrição geográfica também só vale para quem passa pelo CloudFront.',
        '**Regra prática:** conteúdo pago no CloudFront precisa de duas proteções: a assinatura (URL ou cookie) e a origem fechada para todos, menos a distribuição.',
      ],
    },
    {
      id: 'rv:net.f08.paises-do-contrato',
      kind: 'decision',
      title: 'Três países fora do contrato',
      prompt:
        'O contrato de distribuição de um estúdio **proíbe exibir os vídeos em três países**; no resto do mundo, a exibição é livre. Os vídeos são entregues por uma distribuição do CloudFront. A empresa quer a solução de **menor esforço**, aplicada à distribuição inteira. Qual atende?',
      concepts: [{ id: 'cdn.geo-restriction' }],
      xp: 5,
      difficulty: 1,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Restrição geográfica do CloudFront, com lista de permitidos contendo os três países.', correct: false, consequence: 'Inverte a regra: só os três países proibidos conseguiriam assistir.' },
        { id: 'b', text: 'Restrição geográfica do CloudFront, com os três países na lista de bloqueados.', correct: true, consequence: 'Quem está nos três países recebe 403, e o resto do mundo assiste normalmente.' },
        { id: 'c', text: 'Geolocalização no Route 53 sem registro para os três países e sem registro padrão.', correct: false, consequence: 'Deixaria sem resposta todos os países sem registro próprio, e não só os três do contrato.' },
        { id: 'd', text: 'Cookies assinados emitidos só para visitantes fora dos três países.', correct: false, consequence: 'Exige montar a verificação de país por conta própria, muito mais esforço que um recurso pronto.' },
      ],
      explanation: [
        'A **restrição geográfica** do CloudFront permite ou bloqueia **países inteiros** e vale para a distribuição toda. Com uma **lista de bloqueados** com os três países, quem está neles recebe 403, e o resto do mundo segue assistindo.',
        'A lista de permitidos faria o contrário. A geolocalização do Route 53 sem registro padrão deixaria sem resposta muito mais países. E os cookies assinados exigiriam montar a verificação de país à parte.',
        '**Regra prática:** "bloquear países" é restrição geográfica do CloudFront (ou regra de geolocalização no WAF). Quando o país não é identificado, o CloudFront entrega o conteúdo; para regras por cidade ou por arquivo, combine um serviço de terceiros com URLs assinadas.',
      ],
    },
    {
      id: 'rv:net.f08.m3.a1',
      kind: 'decision',
      title: 'Um cabeçalho em todas as respostas',
      prompt:
        'Um portal recebe **centenas de milhares de requisições por segundo** pelo CloudFront e precisa **acrescentar cabeçalhos de segurança** a toda resposta e **redirecionar URLs antigas** para as novas. Nenhuma das duas tarefas precisa de rede nem do corpo da requisição. A empresa quer o **menor custo**. Qual solução atende?',
      concepts: [{ id: 'cdn.edge-functions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'CloudFront Functions nos eventos do visitante.', correct: true, consequence: 'Rodam JavaScript leve em menos de um milissegundo, para milhões de requisições por segundo, a custo menor.' },
        { id: 'b', text: 'Lambda@Edge nos eventos do visitante.', correct: false, consequence: 'Funciona, mas custa mais e tem limite de requisições por segundo por Região, para uma tarefa simples.' },
        { id: 'c', text: 'Lambda@Edge nos eventos da origem.', correct: false, consequence: 'Só roda quando a requisição vai à origem: respostas servidas do cache ficariam sem os cabeçalhos.' },
        { id: 'd', text: 'Uma função Lambda na Região, chamada pela origem.', correct: false, consequence: 'Só age no que chega à origem e acrescenta caminho e custo a cada requisição.' },
      ],
      explanation: [
        'Manipular cabeçalhos e redirecionar são tarefas leves, sem rede e sem corpo da requisição: o caso das **CloudFront Functions**. Elas rodam nos eventos do visitante em menos de um milissegundo, escalam para milhões de requisições por segundo e custam menos que o Lambda@Edge.',
        'O Lambda@Edge resolveria nos eventos do visitante, a um custo maior. Nos eventos da origem, ou numa Lambda chamada pela origem, as respostas vindas do cache ficariam de fora.',
        '**Regra prática:** cabeçalhos, redirecionamentos, chave de cache e validação de token em todas as requisições: CloudFront Functions. Rede, corpo da requisição ou eventos da origem: Lambda@Edge.',
      ],
    },
    {
      id: 'rv:net.f08.so-lambda-edge',
      kind: 'decision',
      title: 'O que as funções leves não fazem',
      prompt:
        'Uma equipe vai mover para a borda do CloudFront cinco tarefas que hoje rodam na origem. Ela quer usar CloudFront Functions sempre que possível e **Lambda@Edge só quando for obrigatório**. Quais tarefas **exigem o Lambda@Edge**? (Escolha DUAS.)',
      concepts: [{ id: 'cdn.edge-functions' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Redirecionar URLs antigas para as novas.', correct: false, consequence: 'Redirecionamento é caso de uso das CloudFront Functions.' },
        { id: 'b', text: 'Montar a resposta com dados buscados numa API pela rede.', correct: true, consequence: 'As CloudFront Functions não têm acesso à rede; só o Lambda@Edge faz essa chamada.' },
        { id: 'c', text: 'Validar um token JWT que chega no cabeçalho.', correct: false, consequence: 'Validação de token pelo cabeçalho está entre os casos das CloudFront Functions.' },
        { id: 'd', text: 'Ler o corpo da requisição para escolher a origem.', correct: true, consequence: 'As CloudFront Functions não acessam o corpo da requisição; o Lambda@Edge acessa.' },
        { id: 'e', text: 'Normalizar a chave de cache, ignorando parâmetros inúteis.', correct: false, consequence: 'Normalizar a chave de cache é tarefa leve, das CloudFront Functions.' },
      ],
      explanation: [
        'As **CloudFront Functions** são leves (até 2 MB de memória e 10 KB de código) e **não têm acesso à rede nem ao corpo da requisição**. Por isso, buscar dados numa API e ler o corpo para escolher a origem exigem o **Lambda@Edge**, que roda Node.js ou Python por até 30 segundos e também responde aos eventos da origem.',
        'Redirecionar, validar token pelo cabeçalho e normalizar a chave de cache são exatamente os casos para que as CloudFront Functions foram feitas.',
        '**Regra prática:** a pergunta-chave é "precisa de rede, do corpo da requisição ou de evento da origem?". Se sim, Lambda@Edge; se não, CloudFront Functions.',
      ],
    },
    {
      id: 'rv:net.f08.m3.a2',
      kind: 'decision',
      title: 'Dispositivos que só liberam IPs fixos',
      prompt:
        'Milhares de sensores industriais enviam dados por **MQTT sobre TCP** para uma aplicação em duas Regiões. As redes dos clientes só liberam **endereços IP fixos** nos firewalls, e, se uma Região falhar, os sensores devem passar à outra **sem depender do cache do DNS**. Qual serviço atende?',
      concepts: [{ id: 'cdn.cf-vs-ga' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Amazon CloudFront na frente das duas Regiões.', correct: false, consequence: 'O CloudFront trabalha com HTTP e HTTPS e não dá IPs fixos para liberar nos firewalls.' },
        { id: 'b', text: 'Failover do Route 53 entre as duas Regiões.', correct: false, consequence: 'A troca depende do cache do DNS nos clientes, e os IPs mudam conforme a Região.' },
        { id: 'c', text: 'AWS Global Accelerator na frente das duas Regiões.', correct: true, consequence: 'Dois IPs anycast fixos, TCP pela rede da AWS e troca de Região pela saúde, sem depender do DNS.' },
        { id: 'd', text: 'Um Network Load Balancer com Elastic IPs em cada Região.', correct: false, consequence: 'Dá IPs fixos por Região, mas os clientes liberariam vários, e a troca de Região dependeria do DNS.' },
      ],
      explanation: [
        'O **Global Accelerator** dá **dois IPs anycast fixos**, aceita TCP e UDP e leva o tráfego pela rede da AWS até o endpoint saudável. A troca de Região acontece pela saúde dos endpoints, **sem depender do cache do DNS** dos clientes.',
        'O CloudFront é para HTTP e HTTPS com cache. O failover do Route 53 depende do TTL e dos caches de DNS. E um NLB por Região dá IPs fixos diferentes em cada uma, sem resolver a troca entre elas.',
        '**Regra prática:** TCP ou UDP fora de HTTP, IPs fixos e failover rápido entre Regiões apontam para o Global Accelerator. Conteúdo HTTP reaproveitável aponta para o CloudFront.',
      ],
    },
    {
      id: 'rv:net.f08.imagens-pelo-mundo',
      kind: 'decision',
      title: 'Imagens baixadas no mundo todo',
      prompt:
        'Um site de receitas, com origem num bucket do S3 em sa-east-1, tem visitantes no mundo todo, e as **mesmas imagens** são baixadas milhões de vezes por HTTPS. A empresa quer **reduzir a latência** para os visitantes distantes e **a carga na origem**. Qual solução atende?',
      concepts: [{ id: 'cdn.cf-vs-ga' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'AWS Global Accelerator na frente do bucket.', correct: false, consequence: 'Acelera o caminho, mas não guarda nada: toda requisição continuaria chegando à origem.' },
        { id: 'b', text: 'S3 Transfer Acceleration no bucket de origem.', correct: false, consequence: 'Acelera transferências até o bucket, mas cada download continua sendo servido por ele.' },
        { id: 'c', text: 'Uma distribuição do Amazon CloudFront com o bucket como origem.', correct: true, consequence: 'As imagens ficam em cache perto dos visitantes, e a origem só recebe o que não está em cache.' },
        { id: 'd', text: 'Uma réplica do bucket em cada continente, com o link certo por visitante.', correct: false, consequence: 'Reduz a distância, mas multiplica armazenamento e trabalho de replicação, sem cache nenhum.' },
      ],
      explanation: [
        'Conteúdo **HTTP reaproveitável**, baixado muitas vezes, é o caso do **CloudFront**: as imagens ficam em cache nos pontos de presença, perto dos visitantes, e a origem só recebe o que ainda não está em cache. As duas metas, latência e carga na origem, são atendidas juntas.',
        'O Global Accelerator e o Transfer Acceleration aceleram o caminho, mas não guardam cópias: a origem continua atendendo cada download. Réplicas por continente custam mais e dão mais trabalho.',
        '**Regra prática:** "conteúdo estático para o mundo todo" é CloudFront. O Global Accelerator entra quando não há o que guardar em cache, como em TCP, UDP ou APIs dinâmicas com IPs fixos.',
      ],
    },
    {
      id: 'rv:net.f08.ga-mover-trafego',
      kind: 'decision',
      title: 'Uma Região nova atrás dos mesmos IPs',
      prompt:
        'Uma API atrás do AWS Global Accelerator roda em us-east-1 e acabou de ganhar uma cópia em us-west-2. Os clientes liberaram nos firewalls os **IPs do acelerador**. A empresa quer **liberar us-west-2 aos poucos**, começando com uma pequena parte do tráfego que iria para lá, **sem depender do cache do DNS** e sem mudar os IPs liberados. Qual solução atende?',
      concepts: [{ id: 'cdn.cf-vs-ga' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Ajustar o controle de tráfego do grupo de us-west-2 no acelerador atual.', correct: true, consequence: 'O grupo de us-west-2 recebe só a porcentagem definida do tráfego dele, e o resto segue para us-east-1, com os mesmos IPs.' },
        { id: 'b', text: 'Criar um segundo acelerador para us-west-2 e passar aos clientes os IPs novos.', correct: false, consequence: 'Os IPs novos teriam de ser liberados em todos os firewalls, contra o requisito.' },
        { id: 'c', text: 'Usar a política ponderada do Route 53 entre os dois balanceadores, com peso 9 para 1.', correct: false, consequence: 'Os clientes usam os IPs do acelerador, e a troca pelo DNS depende do cache.' },
        { id: 'd', text: 'Colocar o CloudFront na frente e mudar a origem aos poucos.', correct: false, consequence: 'Os clientes passariam a usar os endereços do CloudFront, que não são os IPs liberados nos firewalls.' },
      ],
      explanation: [
        'O **Global Accelerator** tem um **controle de tráfego** (traffic dial) em cada grupo de endpoints: ele define a porcentagem do tráfego direcionado àquela Região que ela de fato recebe, e o resto vai para as outras. Começando o grupo de us-west-2 num valor baixo e subindo aos poucos, a empresa libera a Região nova com os **mesmos IPs fixos** e sem depender do DNS; a mudança vale para conexões novas.',
        'Um acelerador novo traz IPs novos. O Route 53 ponderado depende do cache do DNS e não é o caminho que os clientes usam. E o CloudFront mudaria os endereços.',
        '**Regra prática:** com Global Accelerator, trocas graduais entre Regiões são feitas no próprio acelerador, pelo controle de tráfego de cada Região e pelos pesos de cada endpoint; os IPs ficam com ele enquanto ele existir.',
      ],
    },
  ],
}
