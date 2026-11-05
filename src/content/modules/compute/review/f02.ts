/**
 * Questões da Revisão da Fase 2 de Computação (tipos de instância), no formato
 * do exame SAA-C03. Fatos conferidos em 20/10/2026 (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F02: ReviewSet = {
  phaseId: 'cmp.f02',
  questions: [
    {
      id: 'rv:cmp.f02.transcodificacao',
      kind: 'decision',
      title: 'Conversão de vídeo no limite',
      prompt:
        'Um serviço de conversão de vídeos roda em instâncias m7i.2xlarge. O monitoramento mostra a **CPU em 100%** durante toda a conversão, enquanto a **memória fica em 20%** e o disco quase não é usado. A empresa quer converter mais vídeos **pelo mesmo custo por hora**. Qual família de instâncias atende?',
      concepts: [{ id: 'ec2.families' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Otimizada para memória (R), de mesmo tamanho.', correct: false, consequence: 'Dá mais memória por vCPU, justamente o recurso que sobra; a CPU continuaria no limite.' },
        { id: 'b', text: 'Otimizada para computação (C), de mesmo tamanho.', correct: true, consequence: 'Dá mais CPU por GiB de memória, o recurso que limita a conversão, e em geral custa menos por hora que a M equivalente.' },
        { id: 'c', text: 'Otimizada para armazenamento (I), de mesmo tamanho.', correct: false, consequence: 'Traz discos locais rápidos, que a conversão quase não usa.' },
        { id: 'd', text: 'Burstable (T), de mesmo tamanho, no modo unlimited.', correct: false, consequence: 'Com CPU alta o tempo todo, o excedente acima da baseline é cobrado, e a T sai mais cara que uma instância fixa.' },
      ],
      explanation: [
        'O gargalo é a **CPU**: ela fica em 100% enquanto a memória sobra. A família otimizada para computação (C) dá mais vCPU por GiB de memória, então entrega mais conversão pelo mesmo gasto, sem pagar por memória ociosa.',
        'A família R aumenta o que já sobra. A família I resolve I/O em disco local, que não é o problema. E uma burstable com CPU alta o dia todo paga excedente o tempo inteiro e fica mais cara que uma fixa.',
        '**Regra prática:** leia o gargalo e escolha a família que tem mais dele por dólar: CPU, C; memória, R ou X; disco local rápido, I; nenhum se destaca, M.',
      ],
    },
    {
      id: 'rv:cmp.f02.disco-local',
      kind: 'decision',
      title: 'Banco NoSQL limitado pelo disco',
      prompt:
        'Um banco NoSQL próprio, que replica os dados entre os nós, precisa do **maior número de IOPS em disco local** com a menor latência possível. CPU e memória não são o gargalo. A equipe está comparando quatro tipos de instância de tamanho parecido. Qual tipo atende melhor?',
      concepts: [{ id: 'ec2.families' }, { id: 'ec2.type-naming' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'r7i.2xlarge', correct: false, consequence: 'Série R, otimizada para memória, e sem a letra d: não tem disco local.' },
        { id: 'b', text: 'c7gn.2xlarge', correct: false, consequence: 'Série C, de computação; o n indica rede e EBS otimizados, não disco local.' },
        { id: 'c', text: 'm7gd.2xlarge', correct: false, consequence: 'Tem instance store (a letra d), mas é de uso geral: o disco local não é o foco da série.' },
        { id: 'd', text: 'i4i.2xlarge', correct: true, consequence: 'Série I, otimizada para armazenamento, com discos NVMe locais para muitos IOPS e baixa latência.' },
      ],
      explanation: [
        'O requisito é **I/O em disco local**, com CPU e memória folgadas. A família otimizada para armazenamento, **série I**, existe para isso: discos NVMe locais de alto desempenho. Como o banco já replica os dados, a natureza temporária do instance store é aceitável.',
        'No nome, a primeira letra é a série, o número é a geração, as letras seguintes são opções e o final é o tamanho. O r7i é de memória e não tem disco local. O c7gn é de computação, com Graviton (g) e rede otimizada (n). O m7gd tem instance store pelo d, mas é uma instância de uso geral.',
        '**Regra prática:** "muito I/O em disco local" aponta para a série I. A letra d no nome indica instance store em outras séries, mas o maior desempenho de disco local fica na família de armazenamento.',
      ],
    },
    {
      id: 'rv:cmp.f02.m1.a3',
      kind: 'decision',
      title: 'Quem pode ir para o Graviton',
      prompt:
        'Uma empresa quer **reduzir o custo** de duas cargas que rodam em instâncias Intel: uma API em Java no Amazon Linux e um sistema de faturamento em .NET Framework no **Windows Server**. Um consultor sugeriu levar as duas para instâncias Graviton. Qual plano atende?',
      concepts: [{ id: 'ec2.graviton' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Migrar as duas cargas, criando uma AMI Arm para cada uma.', correct: false, consequence: 'O Graviton só aceita Linux: não existe AMI Windows para Arm que rode o faturamento.' },
        { id: 'b', text: 'Migrar só a API Java, com uma AMI Arm de 64 bits, e manter o faturamento em x86.', correct: true, consequence: 'A API roda em Linux e o Java tem versão para Arm; o faturamento continua onde o Windows é aceito.' },
        { id: 'c', text: 'Migrar as duas trocando só o tipo das instâncias paradas, sem mexer nas AMIs.', correct: false, consequence: 'As AMIs atuais são x86: não rodam em processador Arm, e o Windows continua fora do Graviton.' },
        { id: 'd', text: 'Não migrar nenhuma, porque o Graviton exige reescrever as aplicações.', correct: false, consequence: 'Não é preciso reescrever: basta software com versão para Arm, como o Java, e uma AMI arm64.' },
      ],
      explanation: [
        'Processadores Graviton são **Arm**, só aceitam **Linux** e exigem AMI Arm de 64 bits. A API em Java no Amazon Linux cumpre tudo: o Java roda em Arm e basta uma AMI arm64. O faturamento em Windows Server não pode ir, e continua em x86 (Intel ou AMD).',
        'Migrar o faturamento esbarra no sistema operacional. Trocar só o tipo esbarra na arquitetura das AMIs. E descartar o Graviton exagera o esforço: o que se exige é compatibilidade com Arm, não reescrita.',
        '**Regra prática:** Graviton é o sinal para "reduzir custo mantendo desempenho" em Linux com software compatível com Arm. Windows ou binários só x86 tiram a carga dessa opção.',
      ],
    },
    {
      id: 'rv:cmp.f02.m2.a4',
      kind: 'decision',
      title: 'Portal lento no pico da tarde',
      prompt:
        'Um portal interno roda num t3.large configurado no modo **standard** para nunca pagar excedente de CPU. A CPU média do dia fica em 15%, abaixo da baseline de 30%, mas no pico da tarde os créditos acabam e o portal fica lento. A empresa quer **acabar com a lentidão no pico** pagando **o mínimo a mais**. Qual mudança atende?',
      concepts: [{ id: 'ec2.burstable' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Trocar por um m7i.large, de mesmo tamanho e sem créditos.', correct: false, consequence: 'Acaba com a lentidão, mas paga uma instância fixa mais cara por hora para uma carga que fica abaixo da baseline quase o dia todo.' },
        { id: 'b', text: 'Criar um alarme que reinicia a instância quando os créditos acabam.', correct: false, consequence: 'Reiniciar derruba o portal e não devolve créditos: ele volta tão limitado quanto antes.' },
        { id: 'c', text: 'Mudar a instância para o modo unlimited.', correct: true, consequence: 'No pico, a CPU passa da baseline; como a média de 24 horas fica abaixo dela, em geral não há excedente a pagar.' },
        { id: 'd', text: 'Manter o modo standard e trocar por um t3.xlarge.', correct: false, consequence: 'Ganha mais créditos, mas dobra o preço por hora e continua sujeito a ficar sem créditos num pico maior.' },
      ],
      explanation: [
        'No modo **standard**, quando os créditos acabam, a CPU desce até a baseline e só volta a subir quando a instância acumula créditos de novo. No **unlimited**, ela pode passar da baseline a qualquer momento; o excedente só é cobrado se a média de 24 horas ficar acima da baseline. Com média de 15% contra baseline de 30%, o pico é pago pelos créditos do resto do dia.',
        'Uma instância fixa resolve pagando mais por hora o dia inteiro. Reiniciar não recarrega créditos. E um tamanho maior no standard paga o dobro e ainda pode travar num pico mais longo.',
        '**Regra prática:** burstable com média abaixo da baseline e picos ocasionais fica bem no modo unlimited. O standard troca cobrança extra por lentidão garantida quando os créditos acabam.',
      ],
    },
    {
      id: 'rv:cmp.f02.qual-migrar',
      kind: 'decision',
      title: 'Três burstables e a fatura do mês',
      prompt:
        'Uma empresa tem três instâncias t3.large no modo unlimited (baseline de 30%). Pela documentação da AWS, um t3.large custa o mesmo que um m5.large quando a **CPU média fica em 42,5%**. As médias de 24 horas do último mês foram: **instância A, 20%**; **instância B, 40%**; **instância C, 65%**. Para **reduzir o custo**, quais instâncias devem passar para m5.large?',
      concepts: [{ id: 'ec2.unlimited' }],
      xp: 5,
      difficulty: 3,
      domain: 'd4',
      options: [
        { id: 'a', text: 'As três, porque o modo unlimited sempre cobra excedente.', correct: false, consequence: 'O excedente só é cobrado quando a média de 24 horas passa da baseline; a instância A nem paga excedente.' },
        { id: 'b', text: 'A B e a C, porque as duas ficam acima da baseline.', correct: false, consequence: 'A B paga algum excedente, mas, abaixo de 42,5%, o t3.large ainda sai mais barato que o m5.large.' },
        { id: 'c', text: 'Só a C, a única acima do ponto de equilíbrio.', correct: true, consequence: 'Com 65% de média, o excedente passa da diferença de preço por hora, e a instância fixa fica mais barata.' },
        { id: 'd', text: 'Nenhuma, porque o unlimited nunca custa mais que uma fixa do mesmo tamanho.', correct: false, consequence: 'Acima do ponto de equilíbrio, a burstable custa mais; em 100% contínuo, cerca de 1,5 vez a fixa.' },
      ],
      explanation: [
        'No modo unlimited, a burstable cobra **excedente por vCPU-hora** quando a média de 24 horas passa da baseline. O **ponto de equilíbrio** é a média em que o preço menor por hora mais o excedente igualam o preço da fixa: no exemplo da documentação, 42,5% para t3.large contra m5.large. Só a instância C, com 65%, está acima dele.',
        'A instância A fica abaixo da baseline e não paga excedente. A B paga algum excedente, mas ainda menos que a diferença de preço por hora. E o unlimited pode custar mais que uma fixa: em 100% contínuo, cerca de 1,5 vez.',
        '**Regra prática:** baseline não é o limite de decisão; o ponto de equilíbrio é. Abaixo dele, burstable em unlimited; acima, uma instância fixa do mesmo tamanho, como M ou C.',
      ],
    },
    {
      id: 'rv:cmp.f02.estudio',
      kind: 'decision',
      title: 'Estações de edição 3D e treino de modelos',
      prompt:
        'Um estúdio de animação tem duas cargas novas: **estações de trabalho virtuais** para os artistas editarem cenas 3D com aceleração gráfica, e o **treino de modelos de ML** próprios, que a equipe já adaptou para chips da AWS e quer fazer com o **menor custo**. Qual combinação de séries atende?',
      concepts: [{ id: 'ec2.accelerated' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Série G para as estações e série Trn para o treino.', correct: true, consequence: 'A G tem GPUs para gráficos intensivos, e a Trn usa os chips Trainium, feitos para treino de ML.' },
        { id: 'b', text: 'Série P para as estações e série Inf para o treino.', correct: false, consequence: 'A P é GPU para computação acelerada, não o foco em gráficos; a Inf usa o Inferentia, feito para inferência, não para treino.' },
        { id: 'c', text: 'Série Inf para as estações e série G para o treino.', correct: false, consequence: 'A Inf não é para gráficos, e a G não usa os chips da AWS que a equipe preparou para o treino.' },
        { id: 'd', text: 'Série F para as estações e série Trn para o treino.', correct: false, consequence: 'O treino está certo, mas a F traz FPGAs para aceleração sob medida, não GPUs para edição 3D.' },
      ],
      explanation: [
        'Cada carga tem um acelerador próprio. As estações de edição 3D pedem **GPU para gráficos intensivos**: série G. O treino de ML adaptado aos chips da AWS, com menor custo, pede o **Trainium**: série Trn.',
        'A série P é GPU para computação acelerada, como treino em GPU e HPC. A Inf usa o Inferentia, voltado a servir previsões de modelos já treinados. A F traz FPGAs, para aceleração programada sob medida.',
        '**Regra prática:** gráficos, G; computação em GPU, P; inferência com chip da AWS, Inf; treino com chip da AWS, Trn; FPGA, F.',
      ],
    },
    {
      id: 'rv:cmp.f02.m3.a4',
      kind: 'decision',
      title: 'Licença que proíbe virtualização',
      prompt:
        'Uma ferramenta de análise de um laboratório tem uma licença que **só permite rodar em ambiente não virtualizado** e precisa de acesso direto a recursos do processador que uma máquina virtual não expõe. O laboratório quer rodar a ferramenta no EC2. Qual opção atende?',
      concepts: [{ id: 'ec2.nitro' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Uma instância de tamanho metal, como m7i.metal.', correct: true, consequence: 'A aplicação roda direto no servidor, sem hypervisor no caminho, o que a licença e o acesso ao processador exigem.' },
        { id: 'b', text: 'Uma instância com a opção z, de frequência alta.', correct: false, consequence: 'Ganha velocidade de processador, mas continua sendo uma máquina virtual.' },
        { id: 'c', text: 'Uma instância do maior tamanho da família, como m7i.48xlarge.', correct: false, consequence: 'Ocupa muito do servidor, mas ainda roda sobre o hypervisor: continua virtualizada.' },
        { id: 'd', text: 'Uma instância num placement group cluster.', correct: false, consequence: 'Muda onde as instâncias ficam, não o acesso ao hardware nem a virtualização.' },
      ],
      explanation: [
        'O **Nitro System** permite instâncias **bare metal**, indicadas pelo tamanho metal. Nelas, a aplicação roda direto no servidor, sem a camada de virtualização. É a resposta quando a licença exige ambiente não virtualizado ou a carga precisa de recursos de hardware de baixo nível.',
        'A opção z melhora a frequência do processador, e o maior tamanho virtualizado entrega muitos recursos, mas os dois continuam sobre o hypervisor. O placement group cluster trata de proximidade entre instâncias.',
        '**Regra prática:** "sem virtualização" ou "acesso direto ao hardware" pedem o tamanho metal. Nas instâncias Nitro virtualizadas, o desempenho já é quase o de bare metal, então a escolha do metal vem de licença ou de acesso ao hardware, não de velocidade.',
      ],
    },
    {
      id: 'rv:cmp.f02.plano-de-treino',
      kind: 'decision',
      title: 'Plano de treino distribuído com EFA',
      prompt:
        'Uma equipe de ML vai treinar um modelo em 16 instâncias compatíveis com **EFA**, com comunicação NCCL intensa entre elas. O rascunho do plano espalha as instâncias por **duas zonas de disponibilidade**, para tolerar a falha de uma, e reserva orçamento para a **taxa do EFA**. Quais ajustes o plano precisa? (Escolha DUAS.)',
      concepts: [{ id: 'ec2.enhanced-networking' }, { id: 'ec2.placement-groups' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      multiple: true,
      options: [
        { id: 'a', text: 'Juntar as instâncias numa zona, num placement group cluster.', correct: true, consequence: 'O tráfego EFA não atravessa zonas, e o cluster dá a menor latência entre as instâncias.' },
        { id: 'b', text: 'Tirar a taxa do EFA do orçamento.', correct: true, consequence: 'O EFA não tem custo adicional nas instâncias compatíveis.' },
        { id: 'c', text: 'Trocar o EFA pelo ENA, que leva a mesma latência entre zonas.', correct: false, consequence: 'O ENA é rede IP comum; sem o caminho que contorna o sistema operacional, a latência é maior e menos estável.' },
        { id: 'd', text: 'Usar um placement group spread, com cada instância num hardware distinto.', correct: false, consequence: 'O spread aceita só 7 instâncias por zona e afasta as instâncias, o oposto da baixa latência.' },
        { id: 'e', text: 'Usar instâncias burstable, para baratear o treino.', correct: false, consequence: 'Burstable não é aceita em placement group cluster, e o treino deixaria a CPU alta o tempo todo.' },
      ],
      explanation: [
        'O **EFA** dá um caminho de rede que contorna o sistema operacional, com latência baixa e estável para MPI e NCCL. Mas o tráfego EFA **não atravessa zonas** nem VPCs, então as 16 instâncias precisam ficar juntas numa zona; o **placement group cluster** completa a menor latência. E o EFA **não tem custo adicional** nas instâncias compatíveis.',
        'O ENA é a rede aprimorada comum, sem o OS-bypass do EFA. O spread separa as instâncias em hardware distinto, com limite de 7 por zona. Burstables nem entram num placement group cluster.',
        '**Regra prática:** comunicação de baixa latência entre nós de HPC ou de treino distribuído pede EFA com placement group cluster numa zona. A tolerância à falha de zona, nesse caso, vem de outra estratégia, não de espalhar o cluster.',
      ],
    },
    {
      id: 'rv:cmp.f02.racks-separados',
      kind: 'decision',
      title: 'Trinta nós e réplicas em racks diferentes',
      prompt:
        'Um cluster HDFS terá **30 nós de dados** numa zona de disponibilidade e guarda três réplicas de cada bloco. A equipe quer que as réplicas fiquem em **grupos de racks diferentes**, para que a falha de um rack não derrube todas as cópias de um bloco, e que o HDFS saiba em que grupo cada nó está. Qual configuração atende?',
      concepts: [{ id: 'ec2.placement-groups' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Um placement group spread com os 30 nós.', correct: false, consequence: 'O spread aceita até 7 instâncias em execução por zona; 30 nós numa zona não cabem.' },
        { id: 'b', text: 'Um placement group partition, com os nós distribuídos entre as partições.', correct: true, consequence: 'Cada partição fica em racks próprios, e o HDFS pode espalhar as réplicas por partições diferentes.' },
        { id: 'c', text: 'Um placement group cluster com os 30 nós.', correct: false, consequence: 'O cluster aproxima as instâncias para baixa latência, o que aumenta o risco de falhas de hardware correlacionadas.' },
        { id: 'd', text: 'Nenhum placement group: a AWS já espalha as instâncias por racks diferentes.', correct: false, consequence: 'Sem placement group, não há garantia de racks separados nem informação de partição para o HDFS.' },
      ],
      explanation: [
        'O **partition** divide as instâncias em partições, cada uma com seus próprios racks, até 7 partições por zona. Sistemas distribuídos que replicam dados, como HDFS, HBase e Cassandra, usam as partições para colocar as réplicas em racks diferentes, e a falha de um rack atinge uma partição só.',
        'O spread daria hardware distinto a cada instância, mas para no limite de 7 por zona. O cluster faz o contrário do pedido, juntando as instâncias. E sem placement group não há controle nem garantia de onde cada nó fica.',
        '**Regra prática:** muitos nós de um sistema que replica dados, com réplicas em racks diferentes, pedem partition. Poucas instâncias críticas, cada uma num hardware, pedem spread. Menor latência entre nós, cluster.',
      ],
    },
    {
      id: 'rv:cmp.f02.letras-do-nome',
      kind: 'decision',
      title: 'Lendo os nomes da tabela de preços',
      prompt:
        'Uma equipe precisa de instâncias de **uso geral**, com processador **AWS Graviton** e **disco local (instance store)** para um cache temporário. Na tabela de preços aparecem quatro tipos de mesmo tamanho. Qual deles atende aos três requisitos?',
      concepts: [{ id: 'ec2.type-naming' }],
      xp: 5,
      difficulty: 1,
      domain: 'd3',
      options: [
        { id: 'a', text: 'm7g.large', correct: false, consequence: 'Uso geral (m) e Graviton (g), mas sem a letra d: não tem instance store.' },
        { id: 'b', text: 'c7gd.large', correct: false, consequence: 'Graviton (g) e instance store (d), mas a série c é otimizada para computação, não de uso geral.' },
        { id: 'c', text: 'm7gd.large', correct: true, consequence: 'Série m (uso geral), geração 7, opções g (Graviton) e d (instance store), tamanho large.' },
        { id: 'd', text: 'c7gn.large', correct: false, consequence: 'Série de computação, e o n indica rede e EBS otimizados, não disco local.' },
      ],
      explanation: [
        'O nome se lê por partes: **série**, **geração**, **opções** e **tamanho**. Em m7gd.large, m é a série de uso geral, 7 é a geração, g é o processador Graviton, d indica volumes de instance store e large é o tamanho. É o único que cumpre os três requisitos.',
        'O m7g.large não tem a letra d. O c7gd.large tem Graviton e disco local, mas é da série de computação. O c7gn.large é de computação com rede otimizada.',
        '**Regra prática:** a primeira letra diz a família; as letras depois do número dizem opções como processador (a, g, i), disco local (d) e rede (n). O tamanho metal indica bare metal.',
      ],
    },
    {
      id: 'rv:cmp.f02.fechamento-mensal',
      kind: 'decision',
      title: 'Recomendações que ignoram o fim do mês',
      prompt:
        'Uma empresa quer reduzir instâncias superdimensionadas com recomendações baseadas no uso medido. O sistema contábil tem um **pico forte nos últimos três dias de cada mês**, e no resto do tempo fica ocioso. A equipe teme que uma análise curta recomende um tamanho que não aguente o fechamento. Qual configuração atende?',
      concepts: [{ id: 'ec2.compute-optimizer' }],
      xp: 5,
      difficulty: 2,
      domain: 'd4',
      options: [
        { id: 'a', text: 'Ativar o Compute Optimizer com a configuração padrão e seguir as recomendações.', correct: false, consequence: 'Por padrão, a análise olha os últimos 14 dias, que podem nem incluir o fechamento do mês.' },
        { id: 'b', text: 'Ativar o Compute Optimizer com as métricas avançadas de infraestrutura.', correct: true, consequence: 'A análise passa a olhar até 93 dias, cobrindo três fechamentos, e a recomendação considera os picos.' },
        { id: 'c', text: 'Reduzir as instâncias pela média de CPU dos últimos 14 dias no CloudWatch.', correct: false, consequence: 'A média de um período ocioso esconde o pico do fechamento, e o tamanho escolhido não aguentaria.' },
        { id: 'd', text: 'Ativar o Compute Optimizer com a configuração padrão e esperar 93 dias antes de olhar.', correct: false, consequence: 'Esperar não muda o período analisado: na configuração padrão, ele continua sendo de 14 dias.' },
      ],
      explanation: [
        'O **Compute Optimizer** recomenda tamanhos a partir das métricas do CloudWatch, mas precisa ser ativado e, por padrão, olha os **últimos 14 dias**. Para uma carga com pico mensal, isso é pouco. Com as **métricas avançadas de infraestrutura**, um recurso pago, a análise olha até 93 dias e enxerga vários fechamentos.',
        'Seguir a configuração padrão arrisca uma recomendação feita num período sem pico. Esperar mais tempo não amplia a janela padrão. E a média manual de um período ocioso é exatamente o erro que a equipe teme.',
        '**Regra prática:** "recomendações de tamanho com base no uso real" é o Compute Optimizer. Se a carga tem ciclos maiores que duas semanas, ligue as métricas avançadas para a análise enxergar o ciclo inteiro.',
      ],
    },
  ],
}
