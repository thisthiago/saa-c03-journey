/**
 * Questões da Revisão da Fase 2 de Arquivos e backup (EFS: desempenho e
 * custo), no formato do exame SAA-C03. Fatos conferidos em docs.aws.amazon.com
 * (ver docs/VERIFICACAO-DE-CONTEUDO.md). Os preços são premissas do
 * enunciado. As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'fil.f02',
  questions: [
    {
      id: 'rv:fil.f02.m1.a2',
      kind: 'decision',
      title: 'Um cache pequeno com picos altos',
      prompt:
        'O cache de compilação de um time guarda **100 GB** num EFS, lê 100 GB e grava 20 GB por mês. Quase sempre fica parado, mas, nas compilações paralelas, chega a **picos de 150 MiB/s** em horários que ninguém prevê. Qual modo de vazão atende aos picos com o **menor custo**?',
      concepts: [{ id: 'efs.throughput-modes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Provisioned, com 150 MiB/s fixos para cobrir o pico.', correct: false, consequence: 'Paga o pico o mês inteiro, inclusive nas horas em que o cache está parado.' },
        { id: 'b', text: 'Bursting, que acumula créditos enquanto o cache está parado.', correct: false, consequence: 'Com 100 GB, a rajada fica em 100 MiB/s: não chega aos 150 MiB/s pedidos.' },
        { id: 'c', text: 'Elastic, que escala sozinho e cobra por GB lido e gravado.', correct: true, consequence: 'Atende ao pico e cobra só os 120 GB que passam pelo EFS no mês.' },
        { id: 'd', text: 'Modo de desempenho Max I/O, feito para cargas muito paralelas.', correct: false, consequence: 'Modo de desempenho não define vazão e tem mais latência; não é a escolha recomendada.' },
      ],
      explanation: [
        'O critério é **pouco volume no mês e picos altos e imprevisíveis**. O modo **Elastic** escala a vazão sozinho e cobra por GB lido e gravado: com 120 GB por mês, o custo é pequeno, e os 150 MiB/s são atendidos quando aparecem.',
        'O Provisioned cobraria os 150 MiB/s o mês todo. No Bursting, a rajada é de 100 MiB/s por TiB na Standard, com mínimo de 100 MiB/s: com 100 GB, não chega a 150. Max I/O é modo de desempenho, não de vazão.',
        '**Regra prática:** picos imprevisíveis ou média baixa perto do pico pedem o Elastic; vazão alta, constante e conhecida pede o Provisioned.',
      ],
    },
    {
      id: 'rv:fil.f02.creditos-esgotados',
      kind: 'decision',
      title: 'Rápido de manhã, lento à tarde',
      prompt:
        'Um EFS de **60 GB** com vazão **Bursting** atende um processamento de imagens que lê sem parar durante o expediente. De manhã tudo corre bem; à tarde a vazão **despenca**, e o CloudWatch mostra o **BurstCreditBalance em zero**. Quais mudanças mantêm a vazão o dia inteiro? (Escolha DUAS.)',
      concepts: [{ id: 'efs.throughput-modes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Mudar a vazão do sistema de arquivos para Elastic.', correct: true, consequence: 'A vazão passa a escalar com a carga, sem depender de créditos.' },
        { id: 'b', text: 'Mudar a vazão para Provisioned, no valor que a carga usa.', correct: true, consequence: 'A vazão fica fixa no valor pedido, com ou sem créditos.' },
        { id: 'c', text: 'Ligar o ciclo de vida para mover as imagens antigas ao IA.', correct: false, consequence: 'A base do Bursting conta só a Standard: menos dados nela, menos vazão.' },
        { id: 'd', text: 'Criar o sistema de arquivos de novo com o modo Max I/O.', correct: false, consequence: 'O modo de desempenho não muda a vazão nem os créditos do Bursting.' },
        { id: 'e', text: 'Criar mais um mount target na AZ dos servidores.', correct: false, consequence: 'Só cabe um por AZ, e o limite é a vazão do sistema de arquivos, não o caminho.' },
      ],
      explanation: [
        'No **Bursting**, a vazão de base é de **50 KiB/s por GiB** guardado na Standard: com 60 GB, cerca de 3 MiB/s. As rajadas gastam **créditos**; quando eles acabam, a vazão cai para a base. Para não depender de créditos, o sistema de arquivos passa a **Elastic** (escala com a carga) ou a **Provisioned** (vazão fixa no valor pedido).',
        'Mover dados para o IA reduz ainda mais a base do Bursting. Max I/O é modo de desempenho e não acrescenta vazão. E não existe segundo mount target na mesma AZ.',
        '**Regra prática:** EFS pequeno que fica lento depois de um período de uso intenso é o fim dos créditos do Bursting; a saída é Elastic ou Provisioned.',
      ],
    },
    {
      id: 'rv:fil.f02.m1.a3',
      kind: 'decision',
      title: 'O modo de desempenho do cluster novo',
      prompt:
        'Um cluster de análise com **centenas de instâncias** vai ler em paralelo um EFS novo, com vazão **Elastic**. Um analista quer o modo **Max I/O** "por ser o mais rápido". O requisito é a **menor latência por operação**, seguindo a recomendação da AWS. Qual configuração atende?',
      concepts: [{ id: 'efs.performance-modes' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'General Purpose, acompanhando a métrica PercentIOLimit.', correct: true, consequence: 'Tem a menor latência por operação e funciona com a vazão Elastic.' },
        { id: 'b', text: 'Max I/O com vazão Elastic, para somar paralelismo e escala.', correct: false, consequence: 'Essa combinação não existe: o Max I/O não aceita a vazão Elastic.' },
        { id: 'c', text: 'Max I/O com vazão Provisioned no valor da média do cluster.', correct: false, consequence: 'Funciona, mas o Max I/O é de geração anterior e tem mais latência por operação.' },
        { id: 'd', text: 'Max I/O num EFS One Zone, na AZ onde está o cluster.', correct: false, consequence: 'O One Zone sempre usa General Purpose; o Max I/O não está disponível nele.' },
      ],
      explanation: [
        'O **General Purpose** é o padrão e tem a **menor latência por operação**; a AWS recomenda usá-lo sempre. A métrica **PercentIOLimit** do CloudWatch mostra se o sistema de arquivos está chegando perto do limite de IOPS.',
        'O **Max I/O** é de geração anterior, feito para cargas muito paralelas que toleram mais latência, e não existe com a vazão Elastic nem com o One Zone. Escolhê-lo "por ser mais rápido" troca latência por um paralelismo que o General Purpose já atende.',
        '**Regra prática:** modo de desempenho do EFS é General Purpose; Max I/O não é "mais rápido" e não combina com Elastic nem com One Zone.',
      ],
    },
    {
      id: 'rv:fil.f02.m2.a1:antigos',
      kind: 'decision',
      title: 'Contratos antigos e a classe mais barata',
      prompt:
        'Um EFS com vazão **Provisioned** guarda contratos de cinco anos atrás, abertos **só em auditorias**, poucas vezes por ano. A empresa quer movê-los para a classe **Archive** do EFS, sem mudar o caminho dos arquivos para as aplicações. Qual mudança precisa ser feita antes?',
      concepts: [{ id: 'efs.storage-classes' }, { id: 'efs.throughput-modes' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar o modo de desempenho do EFS para Max I/O.', correct: false, consequence: 'O modo de desempenho não decide as classes; e Max I/O é de geração anterior.' },
        { id: 'b', text: 'Mudar a vazão do sistema de arquivos para Elastic.', correct: true, consequence: 'Com Elastic, o ciclo de vida passa a poder mover os contratos para o Archive.' },
        { id: 'c', text: 'Copiar os contratos para um novo EFS One Zone, mais barato.', correct: false, consequence: 'Troca o caminho e a durabilidade entre AZs, e não torna o Archive disponível.' },
        { id: 'd', text: 'Ligar a replicação do EFS para um sistema de arquivos novo.', correct: false, consequence: 'A replicação cria uma cópia em outra Região; não muda as classes da origem.' },
      ],
      explanation: [
        'A classe **Archive** é para dados lidos **poucas vezes por ano** e custa menos que o Infrequent Access, mas **só existe com a vazão Elastic**. Com Provisioned ou Bursting, o ciclo de vida só leva os arquivos até o IA. Mudar a vazão para Elastic é o passo que libera o Archive, sem mudar o caminho dos arquivos.',
        'Modo de desempenho, One Zone e replicação não tornam o Archive disponível. Vale lembrar que o Archive cobra no mínimo 90 dias de armazenamento e cada arquivo como pelo menos 128 KiB.',
        '**Regra prática:** EFS Archive exige vazão Elastic; para arquivos raramente lidos com Provisioned ou Bursting, o limite é o Infrequent Access.',
      ],
    },
    {
      id: 'rv:fil.f02.m2.a3',
      kind: 'decision',
      title: 'Páginas frias que voltam a ser lidas',
      prompt:
        'Na wiki interna, guardada num EFS com ciclo de vida para o Infrequent Access em 30 dias, as páginas antigas esfriam. Quando alguém volta a um assunto, abre **dezenas de páginas em sequência** e reclama da **lentidão**. O time quer **acelerar as releituras** sem pagar Standard pelo que ninguém lê. Qual ajuste atende?',
      concepts: [{ id: 'efs.lifecycle' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Desligar o ciclo de vida e manter todas as páginas na Standard.', correct: false, consequence: 'Acaba com a lentidão, mas paga Standard pelas páginas que ninguém abre.' },
        { id: 'b', text: 'Ligar a volta para a Standard no primeiro acesso.', correct: true, consequence: 'A página lida volta para a classe rápida, e as esquecidas continuam frias.' },
        { id: 'c', text: 'Levar as páginas antigas direto para o Archive, em vez do IA.', correct: false, consequence: 'A latência continua de dezenas de milissegundos, e a leitura fica mais cara.' },
        { id: 'd', text: 'Mudar a vazão do sistema de arquivos para Provisioned.', correct: false, consequence: 'Aumenta a vazão, mas não tira as páginas da classe fria, que tem a latência maior.' },
      ],
      explanation: [
        'O ciclo de vida move os arquivos conforme o **último acesso**, e por padrão **um arquivo frio lido continua frio**: cada leitura tem a latência de dezenas de milissegundos e é cobrada por GB. Com a opção de **voltar para a Standard no primeiro acesso**, a página relida sai da classe fria, e as próximas leituras têm a latência da Standard.',
        'Desligar o ciclo de vida perde a economia. O Archive tem a mesma latência do IA e leitura mais cara. A lentidão é de latência por arquivo, não de vazão.',
        '**Regra prática:** dados frios que, quando voltam, são lidos muitas vezes pedem a volta para a Standard no primeiro acesso.',
      ],
    },
    {
      id: 'rv:fil.f02.m2.a2',
      kind: 'decision',
      title: 'Quanto custa guardar depois do ciclo de vida',
      prompt:
        'Um EFS com vazão Elastic guarda **1.000 GB**, todos na Standard, a **US$ 0,30 por GB-mês**. Com o ciclo de vida, **800 GB** que ninguém abre vão para o Infrequent Access, a **US$ 0,016 por GB-mês**. Considerando só o armazenamento, quanto o sistema de arquivos passa a **custar por mês**?',
      concepts: [{ id: 'efs.storage-classes' }, { id: 'efs.lifecycle' }],
      xp: 5,
      difficulty: 1,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Cerca de US$ 12,80, o preço dos 800 GB no IA.', correct: false, consequence: 'Esquece os 200 GB que continuam na Standard, a US$ 0,30 cada.' },
        { id: 'b', text: 'Cerca de US$ 60,00, o preço do que ficou na Standard.', correct: false, consequence: 'Esquece os 800 GB no IA, que continuam sendo cobrados.' },
        { id: 'c', text: 'Cerca de US$ 72,80, somando a Standard e o IA.', correct: true, consequence: '200 GB a US$ 0,30 e 800 GB a US$ 0,016 dão US$ 72,80, contra US$ 300 antes.' },
        { id: 'd', text: 'Cerca de US$ 300,00, porque a classe só muda o preço da leitura.', correct: false, consequence: 'A classe fria muda o preço por GB guardado; a leitura é cobrada à parte.' },
      ],
      explanation: [
        'Ficam **200 GB na Standard** (200 × US$ 0,30 = US$ 60) e **800 GB no IA** (800 × US$ 0,016 = US$ 12,80): **US$ 72,80 por mês**, contra US$ 300 antes. O Infrequent Access é para dados lidos poucas vezes por trimestre e custa uma fração da Standard por GB.',
        'Contar só uma das classes subestima a conta. A classe fria muda, sim, o preço do armazenamento; o que ela acrescenta é a **cobrança por GB lido**, que fica fora desta conta e pesa se os arquivos forem relidos com frequência.',
        '**Regra prática:** o ciclo de vida do EFS corta o custo de armazenamento dos arquivos frios, mas cada leitura neles é cobrada; arquivos relidos toda semana devem ficar na Standard.',
      ],
    },
    {
      id: 'rv:fil.f02.m3.a2',
      kind: 'decision',
      title: 'A pasta apagada uma hora atrás',
      prompt:
        'Um EFS de contratos é **replicado para outra Região** com RPO de cerca de 15 minutos. Um funcionário apagou por engano a pasta de 2024, e **uma hora depois** alguém pede para trazê-la de volta. A empresa quer **recuperar a pasta** como estava antes do erro. Qual recurso atende?',
      concepts: [{ id: 'efs.replication' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Copiar a pasta do sistema de arquivos de destino da replicação.', correct: false, consequence: 'A exclusão já foi replicada: a pasta também sumiu do destino.' },
        { id: 'b', text: 'Fazer o failover para a réplica, que ainda tem a pasta.', correct: false, consequence: 'A réplica segue a origem em minutos e não guarda versões antigas.' },
        { id: 'c', text: 'Restaurar a pasta de um backup do EFS de antes da exclusão.', correct: true, consequence: 'O ponto de recuperação guarda a pasta como estava antes do erro.' },
        { id: 'd', text: 'Mudar o sistema de arquivos para One Zone e reprocessar a réplica.', correct: false, consequence: 'Trocar o tipo não traz de volta o que foi apagado.' },
      ],
      explanation: [
        'A **replicação do EFS** mantém uma cópia sincronizada continuamente, e copia **tudo**, inclusive as exclusões. Ela protege contra a perda de uma Região, não contra erros. Para voltar a um ponto anterior, o recurso é um **backup**, com pontos de recuperação de antes do erro.',
        'Depois de uma hora, a exclusão já chegou ao destino, e o failover só leva a aplicação para uma cópia igual à origem. Mudar o tipo do sistema de arquivos não recupera dados.',
        '**Regra prática:** replicação é para desastre na Região (RPO de minutos); backup é para voltar no tempo depois de exclusão ou corrupção.',
      ],
    },
    {
      id: 'rv:fil.f02.failover-gravavel',
      kind: 'decision',
      title: 'A réplica que não aceita gravação',
      prompt:
        'Num teste de recuperação de desastre, a aplicação sobe na Região secundária e monta o EFS que é **destino da replicação**. As leituras funcionam, mas **toda gravação falha**. O plano exige que a aplicação **leia e grave** na Região secundária durante o desastre. Qual passo faltou?',
      concepts: [{ id: 'efs.replication' }],
      xp: 5,
      difficulty: 3,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Excluir a configuração de replicação do EFS.', correct: true, consequence: 'Sem a replicação, a réplica se torna gravável para a aplicação.' },
        { id: 'b', text: 'Dar ClientWrite à role da aplicação na política do EFS de destino.', correct: false, consequence: 'O destino só fica gravável quando a replicação é excluída, seja qual for a política.' },
        { id: 'c', text: 'Mudar a vazão do sistema de arquivos de destino para Provisioned.', correct: false, consequence: 'Vazão não muda permissão: o destino continua sem aceitar gravações.' },
        { id: 'd', text: 'Criar um mount target do EFS de destino em cada AZ da aplicação.', correct: false, consequence: 'O mount target é o caminho; ele já existe, já que as leituras funcionam.' },
      ],
      explanation: [
        'Enquanto a replicação está ativa, **só o serviço grava no destino**, e a aplicação apenas lê. O **failover** é excluir a configuração de replicação: a partir daí, a réplica **se torna gravável** para a aplicação. Depois do desastre, o **failback** replica as mudanças de volta para a origem.',
        'Política do IAM e mount targets não liberam gravação numa réplica que ainda está replicando. A vazão não tem relação com permissão.',
        '**Regra prática:** no failover da replicação do EFS, exclua a replicação para tornar o destino gravável; a cópia fica com o que foi sincronizado até o último sync.',
      ],
    },
  ],
}
