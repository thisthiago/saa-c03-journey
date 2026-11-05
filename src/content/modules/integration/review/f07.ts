/**
 * Questões da Revisão da Fase 7 de Integração (streaming), no formato do
 * exame SAA-C03. Fatos conferidos em docs.aws.amazon.com (ver
 * docs/VERIFICACAO-DE-CONTEUDO.md). As empresas são fictícias.
 */
import type { ReviewSet } from '../../../../engine/types'

export const REVIEW_F07: ReviewSet = {
  phaseId: 'int.f07',
  questions: [
    {
      id: 'rv:int.f07.m1.a2:cliques',
      kind: 'decision',
      title: 'Fila ou stream em cada caso',
      prompt:
        'Uma transportadora tem cinco fluxos de dados e quer usar **stream** só onde ele é necessário, deixando o resto em filas. Quais opções pedem um **stream**? (Escolha DUAS.)',
      concepts: [{ id: 'int.queue-vs-stream' }],
      xp: 5,
      difficulty: 1,
      domain: 'd2',
      multiple: true,
      options: [
        { id: 'a', text: 'Cliques lidos pelo painel e pela recomendação.', correct: true, consequence: 'Os mesmos dados para dois leitores, cada um no seu ritmo.' },
        { id: 'b', text: 'Reler as últimas 6 horas após corrigir um bug.', correct: true, consequence: 'O stream guarda os registros pelo prazo de retenção e permite reler.' },
        { id: 'c', text: 'Gerar o boleto de cada frete, uma única vez.', correct: false, consequence: 'Cada tarefa para um trabalhador: é fila.' },
        { id: 'd', text: 'Converter cada contrato enviado em PDF.', correct: false, consequence: 'Trabalho distribuído entre trabalhadores: é fila.' },
        { id: 'e', text: 'Mandar o e-mail de confirmação de cada coleta.', correct: false, consequence: 'Uma tarefa por mensagem, sem releitura: é fila.' },
      ],
      explanation: [
        'Na **fila**, cada mensagem vai para **um consumidor** e é apagada depois de processada; não dá para reler. No **stream**, os registros ficam guardados pela **retenção**, **vários consumidores** leem os mesmos dados no próprio ritmo e **podem reler** desde um ponto; a ordem vale por shard.',
        'Boletos, PDFs e e-mails são tarefas a distribuir, uma vez cada: fila.',
        '**Regra prática:** distribuir tarefas entre trabalhadores é fila; várias aplicações nos mesmos eventos, ou reler o histórico, é stream.',
      ],
    },
    {
      id: 'rv:int.f07.m1.a1',
      kind: 'decision',
      title: 'Vinte trabalhadores e um stream',
      prompt:
        'Uma empresa precisa distribuir a **conversão de contratos** entre **20 trabalhadores**: cada contrato deve ser convertido **por um trabalhador, uma vez**, e a carga deve se espalhar sozinha conforme os trabalhadores ficam livres. Um arquiteto propôs um Kinesis Data Streams lido pelos 20. Qual avaliação está correta?',
      concepts: [{ id: 'int.queue-vs-stream' }],
      xp: 5,
      difficulty: 2,
      domain: 'd2',
      options: [
        { id: 'a', text: 'Correta: o stream entrega cada registro a um trabalhador só.', correct: false, consequence: 'No stream, os consumidores leem os mesmos dados; cada um veria todos os contratos.' },
        { id: 'b', text: 'Correta, desde que haja 20 shards, um por trabalhador.', correct: false, consequence: 'Prende um trabalhador a cada shard e não espalha a carga conforme quem está livre.' },
        { id: 'c', text: 'Incorreta: o caso é de fila SQS.', correct: true, consequence: 'Cada mensagem vai a um só consumidor, que a apaga depois de processar.' },
        { id: 'd', text: 'Incorreta: o certo é um tópico do SNS para os 20.', correct: false, consequence: 'O tópico entregaria cada contrato a todos os assinantes.' },
      ],
      explanation: [
        'Distribuir **tarefas** entre trabalhadores é o caso da **fila**: cada mensagem vai para **um consumidor**, que a apaga depois de processar, e o trabalhador livre pega a próxima. No **stream**, vários consumidores leem **os mesmos registros**; ele serve quando várias aplicações precisam dos mesmos dados.',
        'O stream não reparte registros entre leitores independentes, e shards fixos não equilibram a carga. O SNS entrega a todos.',
        '**Regra prática:** "um trabalho para um trabalhador" é fila; "os mesmos dados para vários leitores" é stream.',
      ],
    },
    {
      id: 'rv:int.f07.m2.a3',
      kind: 'decision',
      title: 'Ordem e espalhamento no stream',
      prompt:
        'Milhares de caminhões enviam leituras a um stream do Kinesis. O antifraude precisa das **leituras de cada caminhão em ordem**, e a escrita precisa se **espalhar pelos shards**, sem um shard sobrecarregado. Qual **chave de partição** usar?',
      concepts: [{ id: 'kds.partition-key' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Um valor aleatório em cada registro.', correct: false, consequence: 'Espalha, mas as leituras de um caminhão caem em shards diferentes e perdem a ordem.' },
        { id: 'b', text: 'A data do dia.', correct: false, consequence: 'Todos os registros do dia vão para um shard só.' },
        { id: 'c', text: 'O código da transportadora.', correct: false, consequence: 'Uma transportadora grande concentraria o tráfego num shard.' },
        { id: 'd', text: 'A placa do caminhão.', correct: true, consequence: 'Milhares de chaves espalham o tráfego, e cada caminhão fica num shard, em ordem.' },
      ],
      explanation: [
        'Cada registro tem uma **chave de partição**; um hash dela decide o **shard**. Registros com a **mesma chave** vão sempre ao **mesmo shard** e ficam **em ordem** entre si. A placa do caminhão tem milhares de valores, o que espalha a escrita, e mantém a ordem de cada caminhão.',
        'Aleatório perde a ordem. Data e transportadora concentram o tráfego em poucos shards.',
        '**Regra prática:** a chave de partição é a entidade que precisa de ordem, com muitos valores distintos.',
      ],
    },
    {
      id: 'rv:int.f07.m2.a2',
      kind: 'decision',
      title: 'Recusas que não somem',
      prompt:
        'Um stream do Kinesis usa o **código da transportadora** como chave de partição, e uma cliente grande envia sozinha cerca de **1,75 MB/s**. Um shard recusa escritas enquanto os outros ficam folgados. A equipe **dobrou o número de shards**, e as recusas **continuaram**. Qual é a correção?',
      concepts: [{ id: 'kds.partition-key' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Dobrar o número de shards outra vez.', correct: false, consequence: 'A mesma chave continua indo para um shard só, que aceita 1 MB/s.' },
        { id: 'b', text: 'Uma chave com mais valores, como o veículo.', correct: true, consequence: 'O tráfego da cliente grande se espalha por vários shards.' },
        { id: 'c', text: 'Aumentar a retenção do stream para sete dias.', correct: false, consequence: 'A retenção não muda o limite de escrita por shard.' },
        { id: 'd', text: 'Ligar o enhanced fan-out nos consumidores.', correct: false, consequence: 'Melhora a leitura, não a escrita do shard quente.' },
      ],
      explanation: [
        'Cada shard aceita **1 MB/s de escrita**. Uma **chave** que concentra 1,75 MB/s cai sempre no **mesmo shard**, que estoura o limite **não importa quantos shards existam**: é o **shard quente**. A correção é uma chave com **mais valores distintos**, que espalhe o tráfego.',
        'Mais shards, retenção e enhanced fan-out não mudam para onde a chave vai.',
        '**Regra prática:** "um shard recebe throttling enquanto os outros estão folgados" pede uma chave de partição com mais valores.',
      ],
    },
    {
      id: 'rv:int.f07.m3.a1',
      kind: 'decision',
      title: 'Seis aplicações na leitura compartilhada',
      prompt:
        'Um stream do Kinesis no modo provisionado recebe **1 MB/s** em 800 registros por segundo, e **seis aplicações** leem todos os dados na **leitura compartilhada**. Cada shard entrega até **2 MB/s de leitura**, dividida entre os consumidores. Quantos shards, no mínimo, a leitura exige?',
      concepts: [{ id: 'kds.enhanced-fanout' }],
      xp: 5,
      difficulty: 3,
      domain: 'd3',
      options: [
        { id: 'a', text: '1 shard', correct: false, consequence: 'Atende a escrita de 1 MB/s, mas não os 6 MB/s de leitura das seis aplicações.' },
        { id: 'b', text: '3 shards', correct: true, consequence: 'Seis leitores de 1 MB/s somam 6 MB/s; com 2 MB/s por shard, são 3.' },
        { id: 'c', text: '6 shards', correct: false, consequence: 'Conta 1 shard por aplicação; cada shard entrega 2 MB/s, não 1.' },
        { id: 'd', text: '12 shards', correct: false, consequence: 'Dobra a conta sem motivo e paga shards ociosos.' },
      ],
      explanation: [
        'Na **leitura compartilhada**, os consumidores **dividem os 2 MB/s de leitura de cada shard**. Seis aplicações lendo 1 MB/s somam **6 MB/s**; com 2 MB/s por shard, são **3 shards**, embora a escrita peça só 1. Com **enhanced fan-out**, cada consumidor teria os próprios 2 MB/s por shard, e 1 shard bastaria para a leitura.',
        'Um shard não dá conta da leitura; seis e doze superdimensionam.',
        '**Regra prática:** no modo provisionado, dimensione os shards pela escrita e pela leitura somada dos consumidores; com muitos leitores, compare com o enhanced fan-out.',
      ],
    },
    {
      id: 'rv:int.f07.m3.a2',
      kind: 'decision',
      title: 'Atrasos nos picos de leitura',
      prompt:
        'Cinco aplicações leem o mesmo stream do Kinesis pela **leitura compartilhada** e disputam a leitura: todas **atrasam** nos picos, e o antifraude precisa de **latência perto de 70 ms**. A empresa quer que cada aplicação leia sem competir com as outras. Qual solução atende?',
      concepts: [{ id: 'kds.enhanced-fanout' }],
      xp: 5,
      difficulty: 2,
      domain: 'd3',
      options: [
        { id: 'a', text: 'Enhanced fan-out para cada uma.', correct: true, consequence: 'Cada uma recebe os próprios 2 MB/s por shard, por push, com latência de cerca de 70 ms.' },
        { id: 'b', text: 'Aumentar a retenção do stream.', correct: false, consequence: 'Guarda os dados por mais tempo, mas não muda a disputa pela leitura.' },
        { id: 'c', text: 'Trocar o stream por uma fila SQS.', correct: false, consequence: 'Cada mensagem iria para uma só aplicação, e as outras não receberiam.' },
        { id: 'd', text: 'Reduzir a frequência de consulta de cada aplicação.', correct: false, consequence: 'Reduz a disputa, mas aumenta ainda mais a latência.' },
      ],
      explanation: [
        'Na **leitura compartilhada**, os consumidores **dividem os 2 MB/s** de cada shard e consultam o stream, com latência de cerca de 200 ms. Com **enhanced fan-out**, cada consumidor registrado recebe **os próprios 2 MB/s por shard**, **por push**, com latência de cerca de **70 ms**. O stream aceita até 20 consumidores assim, e cada hora de consumidor por shard é cobrada.',
        'Retenção não muda a leitura. Uma fila acaba com a leitura dos mesmos dados por várias aplicações. E consultar menos aumenta o atraso.',
        '**Regra prática:** "vários consumidores do mesmo stream disputam a leitura e atrasam" pede enhanced fan-out.',
      ],
    },
  ],
}
