/**
 * Questões da Revisão da Fase 11 da S3 Expedition (transferência de grandes
 * volumes), no formato do exame SAA-C03. Fatos conferidos em 16/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). Contas de tempo com TB decimal
 * (10^12 bytes). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F11: ReviewSet = {
  phaseId: 's3x.f11',
  questions: [
    {
      id: 'rv:s3x.f11.m1.a1',
      kind: 'decision',
      title: 'Cem terabytes em dez dias',
      prompt:
        'Uma emissora precisa levar **100 TB** de arquivos para o S3 em **até 10 dias**, usando o link de internet de **1 Gbps** que já tem. A equipe estima aproveitar cerca de **80%** da banda. Qual avaliação está correta?',
      concepts: [{ id: 'mig.network-math' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Cabe com folga: a cópia leva cerca de 1,4 dia.', correct: false, consequence: 'Esquece de converter bytes em bits: falta multiplicar o volume por 8.' },
        { id: 'b', text: 'Cabe no limite: a cópia leva cerca de 9,3 dias.', correct: false, consequence: 'Usa 100% da banda; com o aproveitamento de 80%, o tempo sobe para perto de 11,6 dias.' },
        { id: 'c', text: 'Não cabe: a cópia leva cerca de 11,6 dias.', correct: true, consequence: 'A equipe sabe, antes de começar, que precisa de mais banda ou de mais prazo.' },
        { id: 'd', text: 'Não cabe: a cópia leva cerca de 116 dias.', correct: false, consequence: 'Erra a ordem de grandeza: 1 Gbps transfere cerca de 8,6 TB por dia a 80%.' },
      ],
      explanation: [
        'Tempo ≈ volume × 8 ÷ (banda × aproveitamento). Aqui: 100 × 10^12 bytes × 8 = 8 × 10^14 bits; 1 Gbps a 80% são 8 × 10^8 bits por segundo. O resultado é 10^6 segundos, cerca de **11,6 dias**, além do prazo de 10.',
        'Esquecer o fator 8 dá 1,4 dia. Ignorar o aproveitamento dá 9,3 dias, que parece caber. E 116 dias erra a ordem de grandeza.',
        '**Regra prática:** faça a conta antes de escolher. Se a rede cabe no prazo, a resposta tende ao DataSync; se não cabe, procure mais banda, como uma conexão hospedada do Direct Connect.',
      ],
    },
    {
      id: 'rv:s3x.f11.m1.a2',
      kind: 'decision',
      title: 'A migração do fim de semana',
      prompt:
        'Uma empresa que **nunca usou a Snow Family** quer copiar **30 TB** de um servidor NFS para o S3 num fim de semana de **48 horas**. O link de internet é de **1 Gbps**, com aproveitamento de cerca de 80%, e uma conexão hospedada do Direct Connect de **10 Gbps** pode ser contratada de um parceiro para o projeto. Qual plano cumpre o prazo?',
      concepts: [{ id: 'mig.network-math' }, { id: 'mig.direct-connect' }, { id: 'mig.datasync' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'DataSync pelo link atual de 1 Gbps, que leva cerca de 40 horas.', correct: false, consequence: 'A 80% de 1 Gbps, 30 TB levam cerca de 3,5 dias, bem além das 48 horas.' },
        { id: 'b', text: 'DataSync por uma conexão hospedada do Direct Connect de 10 Gbps.', correct: true, consequence: 'A cerca de 8 Gbps úteis, os 30 TB levam por volta de 8 horas, dentro do fim de semana.' },
        { id: 'c', text: 'Pedir um Snowball Edge e enviar os 30 TB pelo correio.', correct: false, consequence: 'A Snow Family não aceita mais clientes novos.' },
        { id: 'd', text: 'Ligar o S3 Transfer Acceleration no bucket, para acelerar o link atual.', correct: false, consequence: 'O Transfer Acceleration melhora a rota de longa distância, mas não aumenta a banda de 1 Gbps.' },
      ],
      explanation: [
        'Pela conta, 30 TB são 2,4 × 10^14 bits. A 80% de 1 Gbps (8 × 10^8 bits/s), levam cerca de 300 mil segundos, uns **3,5 dias**. A 80% de 10 Gbps, cerca de 30 mil segundos, umas **8 horas**. Com uma **conexão hospedada do Direct Connect** e o **DataSync**, que usa bem um link de 10 Gbps, o prazo fica atendido.',
        'O link atual não cabe nas 48 horas. A Snow Family não aceita clientes novos. E o Transfer Acceleration não aumenta a banda do link local.',
        '**Regra prática:** quando a conta mostra que a internet não cabe no prazo, aumente a banda por um período (conexão hospedada do Direct Connect) e transfira com o DataSync.',
      ],
    },
    {
      id: 'rv:s3x.f11.boss.a3',
      kind: 'decision',
      title: 'A janela da virada é de quatro horas',
      prompt:
        'Uma empresa vai migrar 40 TB de um servidor NFS para o Amazon EFS. Os arquivos mudam o dia todo, e a **janela de virada**, com o sistema parado, é de **4 horas**, curta demais para copiar tudo. A cópia precisa ser **validada** e **preservar as permissões** dos arquivos. Qual plano atende?',
      concepts: [{ id: 'mig.datasync' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Copiar os 40 TB com o DataSync durante a janela de 4 horas.', correct: false, consequence: 'O volume inteiro não cabe na janela, mesmo com a banda toda.' },
        { id: 'b', text: 'Copiar com um script de `cp` agendado e conferir os arquivos à mão depois.', correct: false, consequence: 'Não preserva as permissões de forma confiável e deixa a validação para um trabalho manual.' },
        { id: 'c', text: 'Usar o S3 File Gateway para levar os arquivos ao EFS.', correct: false, consequence: 'O S3 File Gateway grava objetos no S3, não num sistema de arquivos EFS.' },
        { id: 'd', text: 'Copiar antes com o DataSync e rodar uma tarefa incremental final na janela.', correct: true, consequence: 'Na janela, só as mudanças desde a última cópia são transferidas, validadas e com as permissões preservadas.' },
      ],
      explanation: [
        'O **DataSync** faz **transferência incremental com validação** e preserva permissões e metadados ao copiar para o EFS. A cópia inicial roda nos dias anteriores, com o sistema funcionando; na janela, uma tarefa final leva só o que mudou.',
        'Copiar tudo na janela não cabe. Scripts não preservam permissões nem validam a cópia sozinhos. E o S3 File Gateway grava no S3.',
        '**Regra prática:** "migrar ou sincronizar grandes volumes de arquivos, com cópia incremental e validada" aponta para o DataSync.',
      ],
    },
    {
      id: 'rv:s3x.f11.migrar-e-continuar',
      kind: 'decision',
      multiple: true,
      title: 'Migrar o arquivo e manter a aplicação gravando',
      prompt:
        'Uma empresa tem duas necessidades: (1) levar de uma vez para o S3 os **200 TB do arquivo histórico** de um servidor NFS, que depois será desligado; (2) a aplicação local de digitalização **continua gravando todo dia** num compartilhamento NFS cujos arquivos precisam **chegar ao S3**. Quais serviços atendem? (Escolha DUAS.)',
      concepts: [{ id: 'mig.datasync' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'AWS DataSync para a migração do arquivo histórico.', correct: true, consequence: 'Transfere os 200 TB pela rede, com cópia validada, e termina quando o arquivo chega ao S3.' },
        { id: 'b', text: 'S3 Transfer Acceleration para a aplicação de digitalização.', correct: false, consequence: 'Acelera uploads de longa distância por API, mas a aplicação grava num compartilhamento NFS.' },
        { id: 'c', text: 'S3 File Gateway para a aplicação de digitalização.', correct: true, consequence: 'A aplicação continua gravando por NFS, e os arquivos viram objetos no S3.' },
        { id: 'd', text: 'Snowball Edge para a migração do arquivo histórico.', correct: false, consequence: 'A Snow Family não aceita mais clientes novos.' },
        { id: 'e', text: 'Volume Gateway com stored volumes para a aplicação de digitalização.', correct: false, consequence: 'O Volume Gateway fala iSCSI e não grava os arquivos como objetos no S3.' },
      ],
      explanation: [
        'São dois problemas diferentes. A **migração única** do arquivo histórico pede o **DataSync**, que transfere grandes volumes pela rede e termina com o servidor desligado. A aplicação que **continua acessando** um compartilhamento NFS local e precisa que os arquivos cheguem ao S3 pede o **S3 File Gateway**.',
        'O Transfer Acceleration não oferece NFS. A Snow Family não aceita clientes novos. E o Volume Gateway entrega volumes iSCSI, não arquivos no S3.',
        '**Regra prática:** DataSync é para mover ou sincronizar dados; Storage Gateway é para aplicações locais que continuam usando os dados depois.',
      ],
    },
    {
      id: 'rv:s3x.f11.m1.a3',
      kind: 'decision',
      title: 'Computação na borda para quem chega agora',
      prompt:
        'Uma fábrica que **nunca usou a Snow Family** quer processar, no próprio local, os dados das máquinas da linha de produção, com hardware **gerenciado pela AWS** e as mesmas APIs da AWS. Um consultor recomendou o Snowball Edge Compute Optimized. A fábrica tem uma boa conexão com a Região. Qual opção atende?',
      concepts: [{ id: 'mig.snow-legacy' }, { id: 'mig.outposts' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Pedir o Snowball Edge Compute Optimized, como o consultor recomendou.', correct: false, consequence: 'A Snow Family não oferece mais dispositivos a clientes novos.' },
        { id: 'b', text: 'Uma Local Zone na cidade mais próxima da fábrica.', correct: false, consequence: 'A Local Zone fica perto, mas fora da fábrica: o processamento não seria no local.' },
        { id: 'c', text: 'AWS Outposts servers instalados na fábrica.', correct: true, consequence: 'Hardware da AWS no local, gerenciado por ela, com as mesmas APIs: a alternativa indicada ao Snowball Edge Compute Optimized.' },
        { id: 'd', text: 'Reservar o AWS Data Transfer Terminal para processar os dados lá.', correct: false, consequence: 'O Data Transfer Terminal é um local para enviar dados à AWS, não para processá-los.' },
      ],
      explanation: [
        'A **Snow Family não aceita mais clientes novos**. Para computação no local, com hardware gerenciado pela AWS e as mesmas APIs, a alternativa indicada é o **AWS Outposts**, em servidores (2U) ou racks (42U).',
        'A Local Zone fica fora da fábrica. O Data Transfer Terminal é para transferência de dados, não para processamento.',
        '**Regra prática:** materiais antigos citam Snowball e Snowmobile. Para clientes novos, transferência vai para DataSync (com mais banda, se for preciso) e computação na borda vai para o Outposts.',
      ],
    },
    {
      id: 'rv:s3x.f11.discos-proprios',
      kind: 'decision',
      title: 'Discos cheios e um link lento',
      prompt:
        'Uma produtora de cinema tem **500 TB** em discos próprios e um link de internet lento. Ela tem **Enterprise Support**, nunca usou a Snow Family e topa levar os discos fisicamente a um local da AWS para enviar os dados por uma conexão de alta velocidade. Qual opção atende?',
      concepts: [{ id: 'mig.transfer-terminal' }, { id: 'mig.snow-legacy' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Reservar o Data Transfer Terminal e levar os discos.', correct: true, consequence: 'Os dados vão para a AWS por uma conexão de alta velocidade, a partir dos discos da produtora.' },
        { id: 'b', text: 'Pedir um Snowmobile para os 500 TB.', correct: false, consequence: 'A Snow Family, que incluía o Snowmobile, não atende clientes novos.' },
        { id: 'c', text: 'Ligar o S3 Transfer Acceleration e enviar pelo link atual.', correct: false, consequence: 'Não aumenta a banda: com o link lento, a cópia continuaria demorando demais.' },
        { id: 'd', text: 'Enviar os discos pelo correio para um data center da AWS.', correct: false, consequence: 'A AWS não oferece receber discos do cliente pelo correio como serviço atual.' },
      ],
      explanation: [
        'O **AWS Data Transfer Terminal** é um local físico, reservado pelo console, onde o cliente leva os **próprios dispositivos** e envia os dados à AWS por uma conexão de alta velocidade. No momento, ele está disponível só para clientes do **Enterprise Support**, como a produtora.',
        'A Snow Family não atende clientes novos. O Transfer Acceleration não aumenta a banda. E receber discos pelo correio não é um serviço atual da AWS.',
        '**Regra prática:** com discos próprios e Enterprise Support, o Data Transfer Terminal é uma alternativa ao link lento. Sem isso, a saída é aumentar a banda por um período e usar o DataSync.',
      ],
    },
    {
      id: 'rv:s3x.f11.m3.a3',
      kind: 'decision',
      title: 'Uploads lentos ao lado da Região',
      prompt:
        'O escritório de uma agência em São Paulo envia vídeos para um bucket em sa-east-1, na mesma cidade. Os envios são lentos, e o monitoramento mostra o **link de 100 Mbps do escritório saturado** o dia todo. Alguém sugere ligar o S3 Transfer Acceleration. Qual avaliação está correta?',
      concepts: [{ id: 's3.transfer-acceleration' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Resolve: o Transfer Acceleration dobra a banda disponível do escritório.', correct: false, consequence: 'Ele não muda a banda do link local, que é o gargalo.' },
        { id: 'b', text: 'Resolve: as edge locations aceitam os envios mais rápido que a Região.', correct: false, consequence: 'A Região está na mesma cidade: a rota já é curta, e o link continua saturado.' },
        { id: 'c', text: 'Resolve, desde que os vídeos sejam enviados com multipart upload.', correct: false, consequence: 'O multipart ajuda a paralelizar e retomar, mas não cria banda num link saturado.' },
        { id: 'd', text: 'Não resolve: o gargalo é a banda do link local, não a distância.', correct: true, consequence: 'A agência passa a avaliar mais banda, em vez de pagar por uma aceleração que não ajuda.' },
      ],
      explanation: [
        'O **S3 Transfer Acceleration** usa as edge locations do CloudFront para melhorar a **rota de longa distância** até o bucket. Ele **não aumenta a banda do link local**. Com o escritório na mesma cidade da Região e o link saturado, o gargalo é a banda, e a aceleração não ajuda.',
        'Nenhuma opção de transferência cria banda num link cheio, nem o multipart upload. O que resolve é aumentar a banda do escritório.',
        '**Regra prática:** "uploads de longa distância" e "usuários no mundo todo enviando para um bucket central" apontam para o Transfer Acceleration. Link local saturado pede mais banda.',
      ],
    },
  ],
}
