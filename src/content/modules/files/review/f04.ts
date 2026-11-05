/**
 * Questões da Revisão da Fase 4 de Arquivos e backup (FSx for Lustre), no
 * formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F04: ReviewSet = {
  phaseId: 'fil.f04',
  questions: [
    {
      id: 'rv:fil.f04.m1.a2:ml',
      kind: 'decision',
      title: 'O armazenamento que acompanha as GPUs',
      prompt:
        'Um laboratório treina modelos de aprendizado de máquina em dezenas de instâncias **Linux com GPU**, que leem **50 TB de imagens** em paralelo. As GPUs ficam ociosas esperando os dados: o requisito é **latência abaixo de 1 ms** e vazão de **centenas de GB/s** para todas as instâncias. Qual armazenamento atende?',
      concepts: [{ id: 'lustre.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Amazon EFS com vazão Elastic e modo General Purpose.', correct: false, consequence: 'É NFS de uso geral; não foi feito para centenas de GB/s em paralelo.' },
        { id: 'b', text: 'Amazon FSx for Lustre, montado pelas instâncias.', correct: true, consequence: 'O sistema de arquivos paralelo entrega a latência e a vazão que as GPUs pedem.' },
        { id: 'c', text: 'Amazon FSx for Windows File Server em SSD Multi-AZ.', correct: false, consequence: 'É para compartilhamentos Windows por SMB, não para HPC em Linux.' },
        { id: 'd', text: 'Um volume EBS gp3 grande, anexado a cada instância.', correct: false, consequence: 'Cada instância teria a sua cópia dos 50 TB, sem um sistema de arquivos compartilhado.' },
      ],
      explanation: [
        'O **FSx for Lustre** é um **sistema de arquivos paralelo** feito para quando o armazenamento precisa acompanhar a computação: treinamento de ML, HPC, processamento de vídeo e modelagem financeira. Entrega **latência abaixo de 1 ms**, até vários TB/s e milhões de IOPS para clientes Linux.',
        'O EFS é compartilhado, mas é de uso geral. O FSx for Windows atende escritórios por SMB. Volumes EBS por instância obrigam a copiar os dados para cada uma.',
        '**Regra prática:** "HPC", "treinamento de ML" e "latência abaixo de 1 ms com vazão muito alta" em Linux apontam para o FSx for Lustre.',
      ],
    },
    {
      id: 'rv:fil.f04.m1.a2:home',
      kind: 'decision',
      title: 'Quais cargas pedem um sistema paralelo',
      prompt:
        'Um centro de pesquisa vai organizar o armazenamento de cinco cargas Linux e quer usar o **FSx for Lustre** só onde o **desempenho paralelo** justifica; o resto fica no EFS. Quais cargas são caso de Lustre? (Escolha DUAS.)',
      concepts: [{ id: 'lustre.what' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'O alinhamento de sequências genéticas em 300 servidores ao mesmo tempo.', correct: true, consequence: 'HPC com leitura paralela em grande volume é o caso do Lustre.' },
        { id: 'b', text: 'Os diretórios pessoais dos pesquisadores no servidor de login.', correct: false, consequence: 'Uso geral, elástico e compartilhado: caso do EFS.' },
        { id: 'c', text: 'A renderização de quadros de vídeo em centenas de instâncias.', correct: true, consequence: 'Processamento de vídeo em paralelo pede a vazão do Lustre.' },
        { id: 'd', text: 'Os arquivos da wiki interna, abertos algumas vezes por dia.', correct: false, consequence: 'Pouco acesso e nada de alto desempenho: o EFS basta.' },
        { id: 'e', text: 'Os manuais dos equipamentos, consultados pelos técnicos.', correct: false, consequence: 'Leitura ocasional, sem exigência de vazão: o EFS atende.' },
      ],
      explanation: [
        'O **Lustre** se justifica quando **muitos servidores leem e gravam em paralelo** e o armazenamento precisa acompanhar a computação, como no alinhamento genético em 300 servidores e na renderização de vídeo.',
        'Diretórios pessoais, wiki e manuais são uso geral com pouco acesso: o **EFS**, elástico e compartilhado, atende com menos custo e menos decisões.',
        '**Regra prática:** Lustre para HPC, ML e vídeo em paralelo; EFS para arquivos compartilhados de uso geral em Linux.',
      ],
    },
    {
      id: 'rv:fil.f04.m1.a1',
      kind: 'decision',
      title: 'Dados que entram e saem do bucket',
      prompt:
        'Um FSx for Lustre **persistente** processa dados que chegam o dia todo num bucket S3. O time quer que **objetos novos no bucket apareçam** no sistema de arquivos e que os **resultados gravados voltem ao bucket**, tudo **sem scripts de cópia**. Qual configuração atende?',
      concepts: [{ id: 'lustre.s3-link' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um job agendado com aws s3 sync antes e depois de cada processamento.', correct: false, consequence: 'Funciona, mas é o script de cópia que o time quer evitar.' },
        { id: 'b', text: 'Associação com o bucket, com importação e exportação automáticas.', correct: true, consequence: 'Os objetos novos aparecem como arquivos, e os resultados voltam ao S3 sozinhos.' },
        { id: 'c', text: 'Um sistema de arquivos Scratch 1 ligado diretamente ao bucket.', correct: false, consequence: 'O Scratch 1 não tem associações com repositório nem exportação automática.' },
        { id: 'd', text: 'Replicação do S3 do bucket para os discos do sistema de arquivos.', correct: false, consequence: 'A replicação do S3 copia entre buckets; não grava num sistema de arquivos.' },
      ],
      explanation: [
        'Uma **associação com repositório de dados** liga uma pasta do Lustre a um bucket ou prefixo do S3. Os objetos aparecem como arquivos, **carregados quando lidos**, e as mudanças podem ser **importadas do S3 e exportadas de volta automaticamente**. O S3 guarda os dados de forma durável; o Lustre dá o desempenho.',
        'O sync agendado é justamente o script que se quer evitar. O Scratch 1 não aceita associações. A replicação do S3 trabalha entre buckets.',
        '**Regra prática:** "processar com alto desempenho dados que estão no S3" é Lustre com associação ao bucket, com importação e exportação automáticas.',
      ],
    },
    {
      id: 'rv:fil.f04.boss.a1:treino',
      kind: 'decision',
      title: 'Três dias de treino e uma falha',
      prompt:
        'Um treinamento de **três dias** relê 50 TB que estão no S3, num FSx for Lustre **scratch** ligado ao bucket. Uma falha de servidor fez o time perder dois dias de trabalho. O requisito é perder **no máximo uma hora** numa falha, com o **menor custo**. Qual mudança atende?',
      concepts: [{ id: 'lustre.deployment' }, { id: 'lustre.s3-link' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Trocar para o Lustre persistente SSD, mantendo os checkpoints nele.', correct: false, consequence: 'Protege os dados, mas paga o persistente por um trabalho que o scratch atende.' },
        { id: 'b', text: 'Criar um scratch maior, com mais servidores para dividir a carga.', correct: false, consequence: 'Mais servidores aumentam a chance de falha, e nada é exportado.' },
        { id: 'c', text: 'Manter o scratch e exportar os checkpoints ao bucket a cada hora.', correct: true, consequence: 'Numa falha, o treino recomeça do último checkpoint no S3.' },
        { id: 'd', text: 'Fazer backup diário do sistema de arquivos scratch.', correct: false, consequence: 'O scratch não tem backups, e um backup diário perderia até um dia.' },
      ],
      explanation: [
        'No **scratch**, os dados não são replicados: se um servidor falha, os arquivos dele dão erro e não voltam. Mas os dados de origem já estão no S3, e o que se perderia são os **checkpoints**. Exportá-los ao bucket **a cada hora** limita a perda a uma hora, mantendo o custo baixo do scratch.',
        'O persistente resolveria a durabilidade, mas custa mais para um trabalho de três dias. Um scratch maior tem mais servidores e falha mais. O scratch não aceita backups.',
        '**Regra prática:** scratch para trabalhos curtos e refazíveis, com origem e resultados no S3; o que não pode se perder vai para o S3 com frequência.',
      ],
    },
    {
      id: 'rv:fil.f04.m2.a3',
      kind: 'decision',
      title: 'Um projeto longo com poucos dados quentes',
      prompt:
        'Um projeto de pesquisa de **dois anos** vai usar o FSx for Lustre com **400 TB**, mas só cerca de **10%** dos dados são lidos com frequência. Os dados precisam ser **duráveis**, e o time quer o **menor custo** sem ter de **planejar a capacidade** com antecedência. Qual implantação atende?',
      concepts: [{ id: 'lustre.deployment' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Persistente com SSD, dimensionado para os 400 TB.', correct: false, consequence: 'Paga SSD por 400 TB em que 90% quase não é lido, e a capacidade é planejada.' },
        { id: 'b', text: 'Scratch, recriado sempre que o projeto precisar.', correct: false, consequence: 'O scratch não replica os dados; não serve a dois anos de dados duráveis.' },
        { id: 'c', text: 'Persistente com HDD, dimensionado para o pico previsto.', correct: false, consequence: 'É mais barato que SSD, mas exige planejar e provisionar a capacidade.' },
        { id: 'd', text: 'Persistente com a classe Intelligent-Tiering.', correct: true, consequence: 'É elástica e move os dados frios para camadas mais baratas sozinha.' },
      ],
      explanation: [
        'O **persistente** é para uso prolongado: os dados são replicados, e um servidor com falha é trocado em minutos. Dentro dele, a classe **Intelligent-Tiering** é **elástica** (cresce sem provisionar) e indicada para a maioria das cargas, com os dados frios em camadas mais baratas.',
        'SSD e HDD exigem escolher a capacidade, e o SSD paga desempenho para dados frios. O scratch não replica os dados e não serve a um projeto de dois anos.',
        '**Regra prática:** trabalho curto e refazível é scratch; uso prolongado é persistente, e o Intelligent-Tiering evita planejar capacidade.',
      ],
    },
    {
      id: 'rv:fil.f04.m2.a2',
      kind: 'decision',
      title: 'Resultados que só existem no sistema de arquivos',
      prompt:
        'Um estudo de **seis meses** grava resultados intermediários num FSx for Lustre, e eles **só existem ali** até o fim do estudo. O time aceita **alguns minutos** de parada se um servidor falhar, mas **não pode perder dados**. O volume cabe em SSD. Qual implantação atende com o **menor custo**?',
      concepts: [{ id: 'lustre.deployment' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Scratch, exportando os resultados ao S3 uma vez por noite.', correct: false, consequence: 'Uma falha durante o dia perde tudo o que mudou desde a última exportação.' },
        { id: 'b', text: 'Persistente com SSD, com os dados replicados na AZ.', correct: true, consequence: 'O servidor com falha é trocado em minutos, e os dados replicados não se perdem.' },
        { id: 'c', text: 'Scratch maior, com mais servidores dividindo os arquivos.', correct: false, consequence: 'Mais servidores sem réplica aumentam a chance de perder arquivos.' },
        { id: 'd', text: 'FSx for Windows File Server Multi-AZ, com servidor em espera.', correct: false, consequence: 'É para SMB e escritórios; não entrega o desempenho do Lustre para o estudo.' },
      ],
      explanation: [
        'No **persistente**, os dados são **replicados na mesma AZ** e o servidor com falha é **trocado em minutos**: as requisições dos clientes repetem até dar certo, e nada se perde. É o que pede um estudo longo cujos resultados só existem no sistema de arquivos.',
        'No **scratch**, a falha de um servidor faz os arquivos dele darem erro de vez, e a exportação noturna deixa uma janela de perda. Um scratch maior tem mais servidores e mais chance de falha. O FSx for Windows não é sistema de arquivos para HPC.',
        '**Regra prática:** dados que só existem no Lustre e duram meses pedem o persistente; o scratch só serve quando tudo o que importa já está no S3.',
      ],
    },
  ],
}
