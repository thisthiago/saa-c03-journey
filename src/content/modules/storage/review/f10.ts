/**
 * Questões da Revisão da Fase 10 da S3 Expedition (armazenamento híbrido com
 * o AWS Storage Gateway), no formato do exame SAA-C03. Fatos conferidos em
 * 16/10/2026 e 02/11/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md). As empresas
 * são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F10: ReviewSet = {
  phaseId: 's3x.f10',
  questions: [
    {
      id: 'rv:sgw.overview:protocolo',
      kind: 'decision',
      title: 'Três aplicações locais e um gateway para cada',
      prompt:
        'Uma empresa quer ligar três aplicações do data center à AWS **sem mudar as aplicações**: (1) servidores Windows gravam por **SMB** arquivos que precisam virar objetos no S3; (2) um banco usa um volume **iSCSI** e a empresa quer reduzir o armazenamento local; (3) um software de backup grava em **fitas**. Qual combinação atende?',
      concepts: [{ id: 'sgw.overview' }, { id: 'sgw.s3-file' }, { id: 'sgw.tape' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: '(1) S3 File Gateway; (2) Volume Gateway com cached volumes; (3) Tape Gateway.', correct: true, consequence: 'Cada aplicação continua usando o protocolo que conhece: SMB, iSCSI e fita virtual.' },
        { id: 'b', text: '(1) Volume Gateway; (2) S3 File Gateway; (3) Tape Gateway.', correct: false, consequence: 'Inverte os dois primeiros: o Volume Gateway fala iSCSI, e o S3 File Gateway, NFS e SMB.' },
        { id: 'c', text: '(1) FSx File Gateway; (2) Volume Gateway com stored volumes; (3) Tape Gateway.', correct: false, consequence: 'O FSx File Gateway não grava objetos no S3, e stored volumes guardam tudo no local.' },
        { id: 'd', text: '(1) S3 File Gateway; (2) Volume Gateway com stored volumes; (3) S3 File Gateway.', correct: false, consequence: 'Stored volumes não reduzem o armazenamento local, e software de fita precisa de uma biblioteca de fitas.' },
      ],
      explanation: [
        'O **Storage Gateway** liga aplicações locais à AWS pelos protocolos que elas já usam. Arquivos por NFS ou SMB que viram objetos no S3: **S3 File Gateway**. Volumes iSCSI com o local guardando só os dados mais usados: **Volume Gateway com cached volumes**. Software de backup em fita: **Tape Gateway**.',
        'O Volume Gateway não fala SMB. O FSx File Gateway dá acesso ao FSx for Windows, não ao S3. Stored volumes mantêm todo o conjunto no local. E um software de fita espera uma biblioteca de fitas.',
        '**Regra prática:** identifique o protocolo citado. NFS ou SMB apontam para o S3 File Gateway; iSCSI, para o Volume Gateway; fita, para o Tape Gateway.',
      ],
    },
    {
      id: 'rv:s3x.f10.storage-no-limite',
      kind: 'decision',
      title: 'Oitenta terabytes num storage que acabou',
      prompt:
        'Uma aplicação local usa um volume **iSCSI** de 80 TB, mas só cerca de 5 TB são acessados com frequência. O storage do data center está no limite, e a empresa quer **reduzir o armazenamento local** mantendo acesso rápido aos dados mais usados, **sem mudar a aplicação**. Qual opção atende?',
      concepts: [{ id: 'sgw.volume-cached' }, { id: 'sgw.volume-stored' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Volume Gateway com stored volumes.', correct: false, consequence: 'Stored volumes guardam os 80 TB no local; só os snapshots vão para a AWS.' },
        { id: 'b', text: 'Volume Gateway com cached volumes.', correct: true, consequence: 'Os dados primários vão para o S3, e o local guarda só os dados mais acessados.' },
        { id: 'c', text: 'S3 File Gateway, com um compartilhamento NFS.', correct: false, consequence: 'A aplicação usa iSCSI; trocar para NFS exigiria mudar a aplicação.' },
        { id: 'd', text: 'Tape Gateway, com as fitas virtuais no S3.', correct: false, consequence: 'Fitas virtuais servem a softwares de backup, não a uma aplicação que lê e grava um volume.' },
      ],
      explanation: [
        'Com **cached volumes**, o S3 guarda os dados primários, e o gateway mantém no local só os **dados mais acessados**. Os 80 TB deixam de ocupar o storage do data center, e os 5 TB mais usados continuam rápidos, pelo mesmo protocolo iSCSI.',
        'Stored volumes fazem o contrário: tudo no local, com snapshots na AWS. O S3 File Gateway troca o protocolo. E o Tape Gateway é para backup em fita.',
        '**Regra prática:** "reduzir o armazenamento local" com volumes iSCSI pede cached volumes; "baixa latência para todo o conjunto de dados", stored volumes.',
      ],
    },
    {
      id: 'rv:s3x.f10.boss.a3',
      kind: 'decision',
      title: 'A fábrica perdida e os volumes do gateway',
      prompt:
        'Uma fábrica usava o Volume Gateway com **stored volumes**, com snapshots enviados à AWS a cada 4 horas. Um incêndio destruiu a sala dos servidores. A empresa quer **voltar a operar na AWS** o mais rápido possível, a partir dos dados mais recentes que tiver. O que fazer?',
      concepts: [{ id: 'sgw.volume-stored' }, { id: 'sgw.overview' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Montar o bucket S3 onde os volumes ficam e ler os arquivos por NFS.', correct: false, consequence: 'Os snapshots não ficam como arquivos num bucket acessível: eles são snapshots do EBS.' },
        { id: 'b', text: 'Esperar um appliance novo e restaurar os volumes nele, de volta na fábrica.', correct: false, consequence: 'Funciona, mas depende de reconstruir a fábrica: não é o mais rápido para voltar a operar.' },
        { id: 'c', text: 'Recuperar as fitas virtuais da biblioteca do gateway.', correct: false, consequence: 'Fitas virtuais são do Tape Gateway; o Volume Gateway guarda snapshots.' },
        { id: 'd', text: 'Criar volumes EBS a partir dos snapshots e anexá-los a instâncias EC2.', correct: true, consequence: 'A aplicação volta no EC2 com os dados do último snapshot, de até 4 horas atrás.' },
      ],
      explanation: [
        'Os **stored volumes** guardam todos os dados no local e enviam **snapshots assíncronos** à AWS, guardados como **snapshots do EBS**. Com o local destruído, cria-se um volume EBS a partir do último snapshot e ele é anexado a uma instância EC2: a aplicação volta na AWS, com até 4 horas de perda.',
        'Os snapshots não são arquivos num bucket. Esperar um appliance novo exige a fábrica de pé. E fitas virtuais pertencem ao Tape Gateway.',
        '**Regra prática:** snapshots do Volume Gateway são snapshots do EBS e podem ser restaurados no EC2. É o caminho de recuperação de desastres do gateway.',
      ],
    },
    {
      id: 'rv:s3x.f10.link-caido',
      kind: 'decision',
      multiple: true,
      title: 'O link com a AWS caiu por algumas horas',
      prompt:
        'Uma empresa usa o Volume Gateway com **stored volumes** para o ERP e com **cached volumes** para um arquivo de projetos. O link com a AWS caiu por algumas horas. Quais leituras **continuam funcionando** durante a queda? (Escolha DUAS.)',
      concepts: [{ id: 'sgw.volume-stored' }, { id: 'sgw.volume-cached' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Leituras de qualquer dado dos stored volumes do ERP.', correct: true, consequence: 'Os stored volumes guardam todo o conjunto de dados no local.' },
        { id: 'b', text: 'Leituras de projetos antigos, que não estão no cache dos cached volumes.', correct: false, consequence: 'Esses dados estão só no S3: sem o link, não há de onde lê-los.' },
        { id: 'c', text: 'Leituras dos projetos recentes, que estão no cache dos cached volumes.', correct: true, consequence: 'Os dados lidos há pouco ficam no cache local e continuam disponíveis.' },
        { id: 'd', text: 'Restaurar no EC2 um snapshot tirado durante a queda.', correct: false, consequence: 'Sem o link, os snapshots novos não chegam à AWS.' },
        { id: 'e', text: 'Leituras dos stored volumes feitas por aplicações na AWS.', correct: false, consequence: 'Os stored volumes ficam no local; na AWS, só os snapshots já enviados.' },
      ],
      explanation: [
        'Os **stored volumes** guardam **todo o conjunto de dados no local**: sem o link, as leituras continuam. Os **cached volumes** guardam os dados primários no S3 e só os **mais acessados** no cache local: o que está no cache continua legível, o resto não.',
        'Dados fora do cache estão só no S3. Snapshots novos dependem do link. E os stored volumes não são lidos de dentro da AWS.',
        '**Regra prática:** se a aplicação precisa funcionar com o link fora, prefira stored volumes, que guardam tudo no local. Cached volumes trocam essa independência por economia de armazenamento local.',
      ],
    },
    {
      id: 'rv:s3x.f10.boss.a4',
      kind: 'decision',
      title: 'Um arquivo de uma fita de 2019',
      prompt:
        'Uma seguradora usa o Tape Gateway e arquiva as fitas virtuais antigas no **S3 Glacier Deep Archive**. Uma auditoria pede um arquivo que está numa fita de 2019, com **prazo de 24 horas**. O software de backup da empresa não encontra a fita na biblioteca. O que precisa acontecer?',
      concepts: [{ id: 'sgw.tape' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Baixar o arquivo direto do bucket do S3, pelo console.', correct: false, consequence: 'Fitas arquivadas não são lidas diretamente: não há arquivo solto num bucket para baixar.' },
        { id: 'b', text: 'Pedir uma recuperação Expedited, que devolve a fita em minutos.', correct: false, consequence: 'O Deep Archive não tem recuperação Expedited.' },
        { id: 'c', text: 'Recuperar a fita para o gateway e então restaurar.', correct: true, consequence: 'Do Deep Archive, a fita volta em geral em até 12 horas, dentro do prazo da auditoria.' },
        { id: 'd', text: 'Nada: fitas arquivadas continuam visíveis na biblioteca do software.', correct: false, consequence: 'Fitas arquivadas saem da biblioteca e só voltam a aparecer depois de recuperadas.' },
      ],
      explanation: [
        '**Fitas arquivadas não podem ser lidas diretamente**: primeiro é preciso **recuperá-las para o Tape Gateway**, pelo console ou pela API. Do Deep Archive, isso leva em geral até 12 horas; depois, o software de backup lê a fita e restaura o arquivo, dentro das 24 horas.',
        'Não há arquivo solto num bucket. O Deep Archive não tem Expedited. E a fita arquivada não aparece na biblioteca até ser recuperada.',
        '**Regra prática:** com o Tape Gateway, ler uma fita arquivada é um processo de dois passos: recuperar a fita (horas) e restaurar pelo software. Planeje o prazo das auditorias a partir disso.',
      ],
    },
    {
      id: 'rv:s3x.f10.prazo-das-fitas',
      kind: 'decision',
      title: 'Onde arquivar fitas com prazo de 6 horas',
      prompt:
        'Uma empresa vai arquivar no Tape Gateway as fitas virtuais de backups com mais de um ano. Elas quase nunca são lidas, mas, quando uma auditoria pede uma fita, a empresa tem **até 6 horas** para começar a restauração. Onde arquivar as fitas com o **menor custo** que cumpra o prazo?',
      concepts: [{ id: 'sgw.tape' }, { id: 'sgw.overview' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'No S3 Glacier Deep Archive, a opção mais barata.', correct: false, consequence: 'A recuperação de uma fita do Deep Archive leva em geral até 12 horas, além do prazo.' },
        { id: 'b', text: 'No S3 Glacier Flexible Retrieval.', correct: true, consequence: 'A fita volta em geral em 3 a 5 horas, dentro do prazo, com armazenamento barato.' },
        { id: 'c', text: 'Manter todas as fitas na biblioteca do gateway, sem arquivar.', correct: false, consequence: 'Cumpre o prazo, mas paga o armazenamento do S3 Standard por fitas que quase nunca são lidas.' },
        { id: 'd', text: 'No S3 Standard-IA, com leitura imediata.', correct: false, consequence: 'O Tape Gateway arquiva só no Glacier Flexible Retrieval ou no Deep Archive.' },
      ],
      explanation: [
        'O Tape Gateway arquiva fitas no **Glacier Flexible Retrieval** ou no **Deep Archive**. Do Flexible Retrieval, a fita volta em geral em **3 a 5 horas**; do Deep Archive, em até **12 horas**. Com prazo de 6 horas, a opção mais barata que cumpre é o Flexible Retrieval.',
        'O Deep Archive é mais barato, mas estoura o prazo. Manter as fitas na biblioteca paga armazenamento sem necessidade. E o Standard-IA não é destino de arquivamento do Tape Gateway.',
        '**Regra prática:** escolha o arquivo das fitas pelo prazo de recuperação. Horas pedem Glacier Flexible Retrieval; meio dia ou mais, Deep Archive.',
      ],
    },
    {
      id: 'rv:s3x.f10.gateway-na-nuvem',
      kind: 'decision',
      title: 'Compartilhamento NFS para instâncias na AWS',
      prompt:
        'Uma empresa migrou para a AWS uma aplicação que roda em seis instâncias EC2 Linux, e todas precisam ler e gravar os mesmos arquivos num **compartilhamento NFS**. Não há mais servidores no data center. Um analista propôs um S3 File Gateway numa instância EC2. Qual solução atende com o **menor esforço operacional**?',
      concepts: [{ id: 'sgw.s3-file' }, { id: 'sgw.overview' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um sistema de arquivos Amazon EFS, montado nas seis instâncias.', correct: true, consequence: 'NFS gerenciado para instâncias na AWS, sem appliance para manter.' },
        { id: 'b', text: 'Um S3 File Gateway numa instância EC2, exportando NFS às outras.', correct: false, consequence: 'Funciona, mas cria um appliance para operar, feito para ligar aplicações locais ao S3.' },
        { id: 'c', text: 'Um Volume Gateway com cached volumes, anexado às seis instâncias.', correct: false, consequence: 'O Volume Gateway entrega volumes iSCSI, não um compartilhamento NFS.' },
        { id: 'd', text: 'Um bucket S3 lido pelas instâncias como se fosse uma pasta local.', correct: false, consequence: 'O S3 é acessado por API: não oferece semântica de sistema de arquivos compartilhado.' },
      ],
      explanation: [
        'O **S3 File Gateway** existe para ligar aplicações **locais** ao S3 por NFS ou SMB. Quando todas as instâncias já estão na AWS e precisam de um compartilhamento NFS, a resposta é um sistema de arquivos gerenciado, o **Amazon EFS**, sem appliance para manter.',
        'O gateway numa instância EC2 funciona, mas acrescenta uma peça para operar. O Volume Gateway fala iSCSI. E o S3 não é um sistema de arquivos compartilhado.',
        '**Regra prática:** gateway é para o que está fora da AWS. Se o requisito é um sistema de arquivos para instâncias na AWS, pense em EFS ou FSx.',
      ],
    },
    {
      id: 'rv:s3x.f10.m1.a2',
      kind: 'decision',
      title: 'O pedido de um gateway para o FSx',
      prompt:
        'Em 2026, uma empresa que **nunca usou** o Storage Gateway quer dar aos escritórios acesso a um sistema de arquivos **Amazon FSx for Windows File Server** que fica na AWS, e um consultor recomendou o FSx File Gateway. Qual avaliação está correta?',
      concepts: [{ id: 'sgw.fsx-file' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Correta: o FSx File Gateway é a forma atual de dar acesso local ao FSx.', correct: false, consequence: 'Ele não aceita novos clientes desde 28/10/2024; a recomendação vem de material antigo.' },
        { id: 'b', text: 'Desatualizada: ele não aceita clientes novos; montar o FSx pela VPN.', correct: true, consequence: 'A empresa evita uma opção indisponível e acessa o compartilhamento SMB pela rede híbrida.' },
        { id: 'c', text: 'Desatualizada: o S3 File Gateway passou a gravar direto no FSx for Windows.', correct: false, consequence: 'O S3 File Gateway grava objetos no S3, não no FSx.' },
        { id: 'd', text: 'Correta, desde que a empresa use o Volume Gateway junto com ele.', correct: false, consequence: 'O Volume Gateway fala iSCSI e não tem relação com o acesso ao FSx.' },
      ],
      explanation: [
        'O **FSx File Gateway não está disponível para novos clientes** desde 28/10/2024; quem já usava continua usando. Para uma empresa nova, um caminho disponível é acessar o compartilhamento SMB do **FSx for Windows** pela rede híbrida, com VPN ou Direct Connect.',
        'O S3 File Gateway grava no S3, não no FSx. E o Volume Gateway não dá acesso ao FSx.',
        '**Regra prática:** questões e materiais antigos podem citar o FSx File Gateway como opção atual. Para clientes novos, ele não é mais uma resposta válida.',
      ],
    },
  ],
}
