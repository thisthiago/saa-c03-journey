/**
 * Questões da Revisão da Fase 8 da S3 Expedition (eventos e integração), no
 * formato do exame SAA-C03. Fatos conferidos em 16/10/2026 e 02/11/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F08: ReviewSet = {
  phaseId: 's3x.f08',
  questions: [
    {
      id: 'rv:s3x.f08.miniaturas',
      kind: 'decision',
      title: 'Miniaturas assim que a foto chega',
      prompt:
        'Um site de classificados quer gerar a miniatura de cada foto `.jpg` enviada para o prefixo `uploads/` de um bucket **assim que ela chegar**, sem servidores consultando o bucket. Qual configuração atende com o **menor esforço**?',
      concepts: [{ id: 'ev.notifications' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma função agendada que lista o bucket a cada minuto e processa as fotos novas.', correct: false, consequence: 'É justamente consultar o bucket: atrasa até um minuto e gasta listagens à toa.' },
        { id: 'b', text: 'Notificação com prefixo `uploads/` e sufixo `.jpg` para uma Lambda.', correct: true, consequence: 'Cada foto que chega dispara a função, sem nenhum servidor consultando o bucket.' },
        { id: 'c', text: 'Uma notificação com o prefixo `uploads/*.jpg` para uma Lambda.', correct: false, consequence: 'Filtros de notificação não aceitam curingas: o certo é prefixo e sufixo separados.' },
        { id: 'd', text: 'O S3 Inventory diário, com uma função que processa a lista gerada.', correct: false, consequence: 'O inventário é diário ou semanal: as miniaturas sairiam com até um dia de atraso.' },
      ],
      explanation: [
        'As **notificações de eventos do S3** publicam eventos como ObjectCreated para Lambda, SQS, SNS ou EventBridge, com **filtros por prefixo e sufixo** da key. Uma notificação com prefixo `uploads/` e sufixo `.jpg` dispara a função a cada foto, sem consultar o bucket.',
        'Listar o bucket periodicamente é o que o requisito quer evitar. Os filtros não aceitam curingas. E o S3 Inventory é um relatório periódico, não um gatilho.',
        '**Regra prática:** "processar cada arquivo assim que chegar, sem servidores consultando o bucket" aponta para uma notificação de eventos do S3.',
      ],
    },
    {
      id: 'rv:ev.destination-permissions:fila',
      kind: 'decision',
      title: 'A notificação que o S3 não salva',
      prompt:
        'Ao configurar uma notificação de ObjectCreated de um bucket para uma fila SQS padrão, o administrador recebe um erro de validação do destino e a configuração **não é salva**. Ele tem permissão total no S3 e no SQS. O que falta?',
      concepts: [{ id: 'ev.destination-permissions' }, { id: 'ev.notifications' }],
      xp: 5,
      difficulty: 2,
      domain: 'd1',
      options: [
        { id: 'a', text: 'Uma bucket policy que permita ao SQS ler os eventos do bucket.', correct: false, consequence: 'Quem envia é o S3: a permissão precisa estar na fila, não no bucket.' },
        { id: 'b', text: 'Mais permissões no IAM para o administrador que está configurando.', correct: false, consequence: 'Ele já tem permissão total; quem precisa de permissão para publicar é o serviço S3.' },
        { id: 'c', text: 'Uma política na fila que permita ao S3 enviar mensagens.', correct: true, consequence: 'Com `sqs:SendMessage` liberado ao S3, limitado ao ARN do bucket, a configuração é aceita.' },
        { id: 'd', text: 'Trocar a fila padrão por uma fila FIFO, que aceita eventos do S3.', correct: false, consequence: 'É o contrário: filas FIFO não são aceitas como destino direto.' },
      ],
      explanation: [
        'O S3 valida o destino ao salvar a notificação. Ele precisa de permissão para **publicar no destino**: na fila ou no tópico, uma **política de recurso**; na Lambda, uma permissão de invocação. A política da fila deve liberar `sqs:SendMessage` ao serviço S3, limitada ao ARN do bucket.',
        'A bucket policy controla o acesso ao bucket, não à fila. As permissões do administrador não contam: quem envia é o S3. E filas FIFO não são destino direto.',
        '**Regra prática:** notificação recusada ao salvar costuma ser falta de permissão no destino. Confira a política da fila ou do tópico, ou a permissão da função.',
      ],
    },
    {
      id: 'rv:ev.filter-overlap:jpg',
      kind: 'decision',
      title: 'Qual configuração o bucket aceita',
      prompt:
        'Uma equipe precisa configurar duas notificações de **ObjectCreated** no mesmo bucket, cada uma para uma função diferente. Ela testou quatro propostas. Qual delas o S3 **aceita**?',
      concepts: [{ id: 'ev.filter-overlap' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Sufixo `.jpg` numa e `.png` na outra, ambas com prefixo `fotos/`.', correct: true, consequence: 'Os prefixos são iguais, mas os sufixos não se sobrepõem: nenhum objeto atende às duas.' },
        { id: 'b', text: 'Prefixo `fotos/` numa; nenhum filtro na outra, para pegar o resto.', correct: false, consequence: 'Um filtro vazio sobrepõe todos os outros para os mesmos tipos de evento.' },
        { id: 'c', text: 'Prefixo `fotos/` numa; prefixo `fotos/2026/` na outra.', correct: false, consequence: 'Os prefixos se sobrepõem: todo objeto em `fotos/2026/` também está em `fotos/`.' },
        { id: 'd', text: 'Os mesmos filtros nas duas, cada uma apontando para uma função.', correct: false, consequence: 'Filtros iguais para os mesmos eventos se sobrepõem por completo.' },
      ],
      explanation: [
        'Para os **mesmos tipos de evento**, as notificações de um bucket **não podem ter filtros que se sobreponham**. Prefixos iguais com sufixos que não se sobrepõem, como `.jpg` e `.png`, são aceitos, porque nenhum objeto atende às duas.',
        'Um filtro vazio sobrepõe todos. Um prefixo contido em outro também. E filtros iguais se sobrepõem por completo. Os mesmos filtros só são aceitos com tipos de evento diferentes, como ObjectCreated e ObjectRemoved.',
        '**Regra prática:** se dois consumidores precisam do mesmo evento, não crie duas notificações: use um tópico SNS (fan-out) ou o EventBridge.',
      ],
    },
    {
      id: 'rv:s3x.f08.m2.a2',
      kind: 'decision',
      title: 'Antivírus e indexação para o mesmo PDF',
      prompt:
        'Cada PDF novo em `contratos/` já dispara uma notificação para a fila do antivírus. Agora, a função de indexação também precisa receber **todo PDF novo de `contratos/`**, e a segunda notificação, com os mesmos filtros, foi **recusada**. A empresa quer os dois consumidores desacoplados. O que fazer?',
      concepts: [{ id: 'ev.fanout' }, { id: 'ev.filter-overlap' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Mudar a segunda notificação para o prefixo `contratos/pdf/`.', correct: false, consequence: 'Continua sobreposta a `contratos/`, e a indexação perderia os PDFs fora do novo prefixo.' },
        { id: 'b', text: 'Fazer o antivírus chamar a indexação depois de examinar cada arquivo.', correct: false, consequence: 'Funciona, mas acopla os dois: se o antivírus parar, a indexação para junto.' },
        { id: 'c', text: 'Notificar um tópico SNS assinado pela fila e pela função.', correct: true, consequence: 'O tópico entrega uma cópia do evento a cada assinante, e cada um segue no seu ritmo.' },
        { id: 'd', text: 'Apontar a indexação para a mesma fila do antivírus.', correct: false, consequence: 'Cada mensagem de uma fila é entregue a um consumidor só: cada PDF iria para um dos dois.' },
      ],
      explanation: [
        'Duas notificações com os mesmos filtros e eventos são recusadas. A saída é o **fan-out**: a notificação vai para um **tópico SNS**, e o tópico entrega uma cópia a cada assinante, a fila do antivírus e a função de indexação. O EventBridge também atenderia.',
        'Um prefixo contido em `contratos/` continua sobreposto. Encadear os consumidores os acopla. E dois consumidores lendo a mesma fila dividem as mensagens entre si, em vez de receber cada uma.',
        '**Regra prática:** "o mesmo evento para vários sistemas, desacoplados" pede SNS com fan-out para filas, ou o EventBridge.',
      ],
    },
    {
      id: 'rv:s3x.f08.mesma-fila',
      kind: 'decision',
      title: 'A auditoria que recebe metade dos vídeos',
      prompt:
        'Os eventos de vídeo novo de um bucket vão para uma fila SQS. Para aproveitar a fila, a equipe pôs **dois sistemas** lendo dela: a transcodificação e a auditoria. A auditoria reclama que **só registra parte dos vídeos**. O que explica e o que corrige?',
      concepts: [{ id: 'ev.fanout' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'A fila perde mensagens com dois consumidores: trocá-la por uma fila FIFO.', correct: false, consequence: 'A fila não perde mensagens; e filas FIFO nem são destino direto das notificações do S3.' },
        { id: 'b', text: 'Os eventos do S3 chegam em dobro: ativar a deduplicação na fila.', correct: false, consequence: 'O problema é o contrário: cada vídeo chega a um sistema só, não aos dois.' },
        { id: 'c', text: 'A auditoria é mais lenta: dar a ela mais instâncias para ler mais rápido.', correct: false, consequence: 'Mais instâncias tirariam ainda mais mensagens da transcodificação; a divisão continuaria.' },
        { id: 'd', text: 'Cada mensagem vai a um consumidor: usar SNS e uma fila por sistema.', correct: true, consequence: 'Cada sistema passa a receber todos os eventos, na própria fila e no próprio ritmo.' },
      ],
      explanation: [
        'Uma fila SQS entrega **cada mensagem a um consumidor**: com dois sistemas lendo a mesma fila, os eventos se dividem entre eles. Para cada sistema receber **todos** os eventos, use o **fan-out**: a notificação vai para um tópico SNS, e cada sistema assina com a **própria fila**.',
        'A fila não perde mensagens. Eventos duplicados acontecem, mas não explicam metade faltando. E mais instâncias de um lado só pioram a divisão.',
        '**Regra prática:** fila é para dividir trabalho entre instâncias do mesmo sistema; tópico é para entregar o mesmo evento a sistemas diferentes.',
      ],
    },
    {
      id: 'rv:s3x.f08.roteamento-por-tamanho',
      kind: 'decision',
      title: 'Arquivos grandes por um caminho, pequenos por outro',
      prompt:
        'Uma plataforma de vídeos quer que cada upload com **mais de 1 GB** inicie um fluxo no AWS Step Functions e que os uploads menores vão para uma função Lambda, **sem escrever código** para decidir o caminho. Qual solução atende?',
      concepts: [{ id: 'ev.eventbridge' }, { id: 'ev.notifications' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Duas notificações do S3, uma com filtro de tamanho maior que 1 GB e outra menor.', correct: false, consequence: 'As notificações do S3 filtram só por prefixo e sufixo da key, não por tamanho.' },
        { id: 'b', text: 'Uma Lambda que recebe todos os eventos, lê o tamanho e chama o fluxo certo.', correct: false, consequence: 'Funciona, mas é exatamente o código de decisão que o requisito quer evitar.' },
        { id: 'c', text: 'EventBridge no bucket, com duas regras que filtram pelo tamanho do objeto.', correct: true, consequence: 'Cada regra compara o tamanho no evento e entrega ao alvo certo: Step Functions ou Lambda.' },
        { id: 'd', text: 'Uma notificação para uma fila SQS FIFO, que ordena os arquivos por tamanho.', correct: false, consequence: 'Filas FIFO não são destino direto, e elas ordenam por chegada, não por tamanho.' },
      ],
      explanation: [
        'As notificações do S3 filtram só por **prefixo e sufixo**. Com o **EventBridge** habilitado no bucket, os eventos passam por **regras com filtros mais ricos**, inclusive pelos campos do evento, como o tamanho do objeto, e cada regra pode ter alvos como o Step Functions e a Lambda.',
        'Não existe filtro de tamanho nas notificações. Uma função que decide o caminho resolve, mas com o código que o requisito proíbe. E filas FIFO não são destino direto nem ordenam por tamanho.',
        '**Regra prática:** "filtros avançados", "vários destinos", "fila FIFO" ou "acionar o Step Functions" a partir de eventos do S3 apontam para o EventBridge.',
      ],
    },
    {
      id: 'rv:s3x.f08.m3.a3',
      kind: 'decision',
      title: 'O índice que volta a mostrar um arquivo apagado',
      prompt:
        'Um índice de busca é atualizado a partir dos eventos de um bucket: ObjectCreated adiciona o arquivo e ObjectRemoved o retira. Às vezes, um arquivo gravado e apagado logo em seguida **continua no índice**, porque o evento de criação chegou **depois** do de exclusão. Como o consumidor deve tratar isso?',
      concepts: [{ id: 'ev.at-least-once' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar a notificação por uma entrega direta a uma fila SQS FIFO, que garante a ordem.', correct: false, consequence: 'Filas FIFO não são destino direto das notificações do S3.' },
        { id: 'b', text: 'Esperar 5 minutos antes de processar cada evento, para eles chegarem em ordem.', correct: false, consequence: 'A espera não garante a ordem e atrasa todo o índice.' },
        { id: 'c', text: 'Guardar o sequencer do último evento de cada key e ignorar eventos com sequencer menor.', correct: true, consequence: 'Eventos atrasados de uma key são descartados, e o índice fica com o estado mais recente.' },
        { id: 'd', text: 'Processar só os eventos de exclusão e reconstruir o índice todo dia.', correct: false, consequence: 'Arquivos novos só entrariam no dia seguinte: o índice fica sempre atrasado.' },
      ],
      explanation: [
        'Os eventos do S3 chegam **pelo menos uma vez** e **sem ordem garantida**. Para ordenar eventos **de uma mesma key**, cada evento traz o **sequencer**: o consumidor guarda o maior sequencer visto por key e ignora eventos com valor menor.',
        'Filas FIFO não são destino direto. Esperas não garantem ordem. E reconstruir o índice todo dia troca um problema raro por um atraso permanente.',
        '**Regra prática:** consumidores de eventos do S3 devem ser idempotentes e, para a ordem de uma mesma key, comparar o sequencer. Ele não ordena keys diferentes.',
      ],
    },
    {
      id: 'rv:s3x.f08.m1.a3',
      kind: 'decision',
      title: 'A conta do Lambda que não para de subir',
      prompt:
        'Uma função é disparada por ObjectCreated no prefixo `entrada/` de um bucket. Ela processa cada planilha e grava o resultado em `entrada/processado/`. Desde a implantação, as invocações e a conta do Lambda **crescem sem parar**. Qual mudança corrige?',
      concepts: [{ id: 'ev.recursion' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Filtrar a notificação pelo sufixo `.xlsx`, já que o resultado também é uma planilha.', correct: false, consequence: 'O resultado também termina em `.xlsx`: o filtro continua disparando a função com o que ela grava.' },
        { id: 'b', text: 'Gravar os resultados em `saida/`, fora do prefixo que dispara a função.', correct: true, consequence: 'O que a função grava deixa de disparar a própria função, e o ciclo acaba.' },
        { id: 'c', text: 'Limitar a concorrência reservada da função a 1.', correct: false, consequence: 'Só deixa o ciclo mais lento: cada resultado ainda dispara uma nova invocação.' },
        { id: 'd', text: 'Gravar os resultados em `entrada/processado/2026/`.', correct: false, consequence: 'Continua dentro de `entrada/`: cada gravação dispara a função de novo.' },
      ],
      explanation: [
        'A função grava em `entrada/processado/`, que **está dentro do prefixo** `entrada/` que a dispara: cada resultado gera um novo evento e uma nova invocação, num **ciclo recursivo**. Gravar em `saida/`, ou em outro bucket, quebra o ciclo.',
        'O sufixo não separa entrada de saída quando os dois são planilhas. Limitar a concorrência só desacelera o ciclo. E qualquer subpasta de `entrada/` continua disparando a função.',
        '**Regra prática:** a saída de uma função disparada por eventos do S3 nunca pode cair no filtro que a dispara. Use outro bucket ou um prefixo de entrada exclusivo.',
      ],
    },
  ],
}
