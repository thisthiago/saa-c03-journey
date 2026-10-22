/**
 * Fase 7 — Streaming. Fila ou stream, Kinesis Data Streams (reaproveita
 * kds.streams), chave de partição e shard quente, enhanced fan-out, e a
 * entrega com Data Firehose e o Kafka no MSK (reaproveita fh.delivery,
 * fh.parquet e msk.kafka).
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { StreamLabConfig } from '../../../../../simulators/stream/lab'
import { META } from '../meta'

export const FROTA_STREAMS: StreamLabConfig = {
  shardOptions: [1, 2, 4, 8, 16],
  streams: [
    { id: 'gps', label: 'Posição GPS dos caminhões', writeMBps: 1.5, recordsPerSec: 6000, consumers: 1, lowLatency: false, concepts: ['kds.streams'] },
    { id: 'motor', label: 'Sensores do motor', writeMBps: 3, recordsPerSec: 2000, consumers: 2, lowLatency: false, concepts: ['kds.streams'] },
    { id: 'freio', label: 'Alertas de freada brusca', writeMBps: 1, recordsPerSec: 800, consumers: 6, lowLatency: false, concepts: ['kds.streams', 'kds.enhanced-fanout'] },
    { id: 'colisao', label: 'Detecção de colisão', writeMBps: 2, recordsPerSec: 1500, consumers: 3, lowLatency: true, concepts: ['kds.enhanced-fanout'] },
  ],
}

export const F07_INT: PhaseDef = {
  ...META.f07,
  concepts: ['int.queue-vs-stream', 'kds.streams', 'kds.partition-key', 'kds.enhanced-fanout', 'fh.delivery', 'fh.parquet', 'msk.kafka'],
  availability: 'available',
  simplifications: ['A frota, os sensores e os volumes são fictícios.', 'No laboratório, os dados se espalham por igual entre os shards.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'int.f07.m1',
      title: 'Fila ou stream',
      type: 'mission',
      summary: 'A diferença entre fila e stream.',
      briefing: {
        company: 'Frota Conectada',
        role: 'Você monta a ingestão de dados de uma frota de caminhões.',
        situation: 'Cada caminhão manda leituras a cada segundo. O painel ao vivo, o antifraude de combustível e o data lake querem os mesmos dados. O time propôs uma fila SQS.',
        objective: 'Decidir entre fila e stream.',
        successCriteria: ['Separar trabalho distribuído de dados lidos por vários'],
      },
      intel: [
        { conceptId: 'int.queue-vs-stream', body: ['Na **fila**, cada mensagem vai para **um** consumidor e é apagada. No **stream**, os dados ficam pelo prazo de retenção, **vários** consumidores leem os mesmos registros e podem **reler**.'] },
        { conceptId: 'kds.streams', body: ['O **Kinesis Data Streams** divide o stream em **shards**: cada um aceita **1 MB/s ou 1.000 registros por segundo** de escrita e entrega **2 MB/s** de leitura.'] },
      ],
      activities: [
        {
          id: 'int.f07.m1.a1',
          kind: 'decision',
          title: 'Três leitores',
          prompt: 'Painel, antifraude e data lake precisam das mesmas leituras, e o antifraude quer reler as últimas 24 horas quando muda a regra. O que usar?',
          concepts: [{ id: 'int.queue-vs-stream' }, { id: 'kds.streams', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O stream deixa vários consumidores lerem os mesmos registros e reler dentro da retenção. Na fila, a mensagem processada some.'],
          options: [
            { id: 'a', text: 'Um stream do Kinesis Data Streams lido pelos três', correct: true, consequence: 'Cada um lê no seu ritmo, e o antifraude relê quando precisa.' },
            { id: 'b', text: 'Uma fila SQS lida pelos três', correct: false, consequence: 'Cada leitura vai para um só dos três, e nada pode ser relido.' },
            { id: 'c', text: 'Uma fila SQS para cada um, com o caminhão enviando três vezes', correct: false, consequence: 'Triplica o envio e ainda não permite reler.' },
          ],
        },
        {
          id: 'int.f07.m1.a2',
          kind: 'classify',
          title: 'Fila ou stream',
          prompt: 'Classifique cada caso.',
          concepts: [{ id: 'int.queue-vs-stream' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Trabalho para um trabalhador: fila. Dados para vários leitores, ou para reler: stream.'],
          bins: [
            { id: 'queue', label: 'Fila' },
            { id: 'stream', label: 'Stream' },
          ],
          items: [
            { id: 'boleto', text: 'Gerar o boleto de cada frete, uma vez cada', bin: 'queue', explanation: 'Cada tarefa para um trabalhador.', concepts: ['int.queue-vs-stream'] },
            { id: 'cliques', text: 'Cliques do app lidos pelo painel e pelo modelo de recomendação', bin: 'stream', explanation: 'Os mesmos dados para dois leitores.', concepts: ['int.queue-vs-stream'] },
            { id: 'reler', text: 'Reprocessar as leituras das últimas 6 horas depois de corrigir um bug', bin: 'stream', explanation: 'O stream guarda pelo prazo de retenção.', concepts: ['int.queue-vs-stream'] },
            { id: 'pdf', text: 'Converter cada contrato enviado em PDF', bin: 'queue', explanation: 'Trabalho distribuído.', concepts: ['int.queue-vs-stream'] },
          ],
        },
      ],
      debrief: { takeaways: ['Fila: uma tarefa, um trabalhador.', 'Stream: vários leitores e releitura.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f07.m2',
      title: 'O shard que estourava',
      type: 'mission',
      summary: 'Shards, chave de partição e shard quente.',
      briefing: {
        company: 'Frota Conectada',
        role: 'Você dimensiona o stream das leituras.',
        situation: 'O stream recebe 3,5 MB/s em 2.000 registros por segundo. Mesmo com 8 shards, um deles vive estourando: a chave de partição é o código da transportadora, e uma cliente tem metade da frota.',
        objective: 'Calcular os shards e corrigir a chave.',
        successCriteria: ['Calcular os shards pela escrita', 'Achar o shard quente'],
      },
      intel: [{ conceptId: 'kds.partition-key', body: ['A **chave de partição** decide o shard. A mesma chave cai sempre no mesmo shard. Se uma chave concentra o tráfego, o shard dela estoura **1 MB/s**, por mais shards que existam.'] }],
      activities: [
        {
          id: 'int.f07.m2.a1',
          kind: 'predict',
          title: 'Quantos shards',
          prompt: 'Escrita de 3,5 MB/s em 2.000 registros por segundo, lida por uma aplicação. Quantos shards o stream provisionado precisa, no mínimo?',
          concepts: [{ id: 'kds.streams' }],
          xp: 40,
          difficulty: 1,
          explanation: ['3,5 MB/s pede 4 shards de 1 MB/s; 2.000 registros pedem só 2. Quem decide é o volume: 4.'],
          spec: { sim: 'stream', load: { writeMBps: 3.5, recordsPerSec: 2000, consumers: 1 }, mode: 'shared', measure: 'shards' },
          options: [
            { id: 'a', text: '4', outcome: '4' },
            { id: 'b', text: '2', outcome: '2' },
            { id: 'c', text: '8', outcome: '8' },
          ],
        },
        {
          id: 'int.f07.m2.a2',
          kind: 'predict',
          title: 'A transportadora grande',
          prompt: 'Com a chave de partição pelo código da transportadora, metade dos 3,5 MB/s vem de uma cliente só. O shard dessa chave fica sobrecarregado?',
          concepts: [{ id: 'kds.partition-key' }],
          xp: 50,
          difficulty: 2,
          explanation: ['1,75 MB/s de uma chave só caem num shard, que aceita 1 MB/s. Mais shards não ajudam: a chave precisa mudar.'],
          spec: { sim: 'stream', load: { writeMBps: 3.5, recordsPerSec: 2000, consumers: 1 }, mode: 'shared', measure: 'hot', hotKeyShare: 0.5 },
          options: [
            { id: 'a', text: 'Sim', outcome: 'yes' },
            { id: 'b', text: 'Não', outcome: 'no' },
          ],
        },
        {
          id: 'int.f07.m2.a3',
          kind: 'decision',
          title: 'Uma chave melhor',
          prompt: 'O antifraude precisa das leituras de cada caminhão em ordem. Qual chave de partição usar?',
          concepts: [{ id: 'kds.partition-key' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A placa do caminhão espalha o tráfego por milhares de chaves e mantém a ordem de cada caminhão, que fica sempre no mesmo shard.'],
          options: [
            { id: 'a', text: 'A placa do caminhão', correct: true, consequence: 'Tráfego espalhado e ordem por caminhão.' },
            { id: 'b', text: 'Um valor aleatório em cada registro', correct: false, consequence: 'Espalha, mas as leituras de um caminhão caem em shards diferentes e perdem a ordem.' },
            { id: 'c', text: 'A data do dia', correct: false, consequence: 'Todos os registros do dia vão para um shard só.' },
          ],
        },
      ],
      debrief: { takeaways: ['Shards pela escrita: MB/s ou registros, o que pedir mais.', 'Chave com muitos valores; a mesma chave mantém a ordem.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f07.m3',
      title: 'Muitos leitores',
      type: 'mission',
      summary: 'Leitura compartilhada e enhanced fan-out.',
      briefing: {
        company: 'Frota Conectada',
        role: 'Você ajusta a leitura do stream de alertas.',
        situation: 'Seis aplicações leem o stream de alertas de freada, e todas estão atrasadas. A detecção de colisão precisa reagir em menos de 100 ms.',
        objective: 'Escolher o modo de leitura e o número de shards.',
        successCriteria: ['Calcular a leitura compartilhada', 'Usar enhanced fan-out onde a latência importa'],
      },
      intel: [{ conceptId: 'kds.enhanced-fanout', body: ['Na leitura **compartilhada**, os consumidores dividem **2 MB/s por shard** (cerca de 200 ms). Com **enhanced fan-out**, cada consumidor tem os **próprios 2 MB/s** por shard, por push, em cerca de **70 ms**.'] }],
      activities: [
        {
          id: 'int.f07.m3.a1',
          kind: 'predict',
          title: 'Seis leitores compartilhando',
          prompt: 'O stream recebe 1 MB/s em 800 registros por segundo, e seis aplicações leem tudo na leitura compartilhada. Quantos shards são precisos?',
          concepts: [{ id: 'kds.enhanced-fanout' }, { id: 'kds.streams', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Seis leitores de 1 MB/s somam 6 MB/s de leitura; com 2 MB/s por shard, são 3 shards, embora a escrita peça só 1.'],
          spec: { sim: 'stream', load: { writeMBps: 1, recordsPerSec: 800, consumers: 6 }, mode: 'shared', measure: 'shards' },
          options: [
            { id: 'a', text: '3', outcome: '3' },
            { id: 'b', text: '1', outcome: '1' },
            { id: 'c', text: '6', outcome: '6' },
          ],
        },
        {
          id: 'int.f07.m3.a2',
          kind: 'predict',
          title: 'Com enhanced fan-out',
          prompt: 'O mesmo stream, agora com enhanced fan-out para os seis leitores. Quantos shards são precisos?',
          concepts: [{ id: 'kds.enhanced-fanout' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Cada leitor tem os próprios 2 MB/s por shard: a leitura deixa de pesar, e a escrita de 1 MB/s pede 1 shard.'],
          spec: { sim: 'stream', load: { writeMBps: 1, recordsPerSec: 800, consumers: 6 }, mode: 'efo', measure: 'shards' },
          options: [
            { id: 'a', text: '1', outcome: '1' },
            { id: 'b', text: '3', outcome: '3' },
            { id: 'c', text: '6', outcome: '6' },
          ],
        },
      ],
      debrief: { takeaways: ['Leitura compartilhada: 2 MB/s por shard divididos entre todos.', 'Enhanced fan-out: 2 MB/s por leitor e menos latência.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f07.m4',
      title: 'Até o data lake',
      type: 'mission',
      summary: 'Data Firehose e o Kafka no MSK.',
      briefing: {
        company: 'Frota Conectada',
        role: 'Você leva os dados ao data lake.',
        situation: 'Um time escreveu um consumidor que lê o stream, junta registros e grava no S3; ele cai toda semana. Outro time tem um sistema que já usa a API do Apache Kafka e não quer mudar o código.',
        objective: 'Tirar o código de entrega e acomodar o sistema Kafka.',
        successCriteria: ['Usar o Data Firehose', 'Usar o MSK para o Kafka'],
      },
      intel: [
        { conceptId: 'fh.delivery', body: ['O **Data Firehose** entrega fluxos ao S3 e a outros destinos, juntando registros em lotes, sem consumidor para operar.'] },
        { conceptId: 'msk.kafka', body: ['O **Amazon MSK** é o Apache Kafka gerenciado: o código que usa a API do Kafka continua funcionando.'] },
      ],
      activities: [
        {
          id: 'int.f07.m4.a1',
          kind: 'decision',
          title: 'O consumidor que cai',
          prompt: 'O time quer as leituras no S3, em Parquet, sem manter um consumidor próprio. O que usar?',
          concepts: [{ id: 'fh.delivery' }, { id: 'fh.parquet', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Data Firehose lê o stream, junta em lotes, converte para Parquet e grava no S3, sem código de entrega.'],
          options: [
            { id: 'a', text: 'Um Data Firehose lendo o stream, com conversão para Parquet, gravando no S3', correct: true, consequence: 'A entrega fica gerenciada.' },
            { id: 'b', text: 'Pôr o consumidor próprio em duas instâncias', correct: false, consequence: 'Continua sendo código para operar.' },
            { id: 'c', text: 'Gravar cada registro direto no S3 a partir dos caminhões', correct: false, consequence: 'Milhões de objetos pequenos, sem lote nem conversão.' },
          ],
        },
        {
          id: 'int.f07.m4.a2',
          kind: 'decision',
          title: 'O sistema que fala Kafka',
          prompt: 'O sistema de manutenção usa produtores e consumidores do Apache Kafka. Como trazê-lo para a AWS sem mudar o código?',
          concepts: [{ id: 'msk.kafka' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O MSK roda o Apache Kafka gerenciado; o código continua igual.'],
          options: [
            { id: 'a', text: 'Amazon MSK', correct: true, consequence: 'O código Kafka funciona sem mudança.' },
            { id: 'b', text: 'Kinesis Data Streams', correct: false, consequence: 'Exige reescrever produtores e consumidores para a API do Kinesis.' },
            { id: 'c', text: 'Amazon SQS', correct: false, consequence: 'Outro modelo e outra API.' },
          ],
        },
      ],
      debrief: { takeaways: ['Firehose para entregar sem código.', 'MSK para manter o Kafka.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'int.f07.boss',
      title: 'Os streams da frota',
      type: 'boss',
      summary: 'Modo de leitura e shards de quatro streams.',
      briefing: {
        company: 'Frota Conectada',
        role: 'Você dimensiona os streams antes de ligar a frota inteira.',
        situation: 'Quatro streams, cada um com volume, registros e leitores diferentes. Só a detecção de colisão tem pressa.',
        objective: 'Escolher o modo de leitura e o menor número de shards de cada stream.',
        successCriteria: ['Nenhum stream subdimensionado', 'Nenhum shard a mais'],
      },
      intel: [{ conceptId: 'kds.streams', body: ['Calcule os shards pela escrita (MB/s e registros) e pela leitura compartilhada; fique com o maior.'] }],
      activities: [
        {
          id: 'int.f07.boss.a1',
          kind: 'lab',
          lab: 'stream',
          title: 'O dimensionamento',
          prompt: 'Para cada stream, escolha o modo de leitura e os shards.',
          concepts: [{ id: 'kds.streams' }, { id: 'kds.enhanced-fanout' }],
          xp: 200,
          difficulty: 3,
          hints: ['Registros também contam: 1.000 por segundo por shard.', 'Na leitura compartilhada, some a leitura de todos os consumidores.'],
          explanation: ['GPS: compartilhada, 8 shards (6.000 registros pedem 6). Motor: compartilhada, 4. Freada: compartilhada, 4 (seis leitores pedem 3). Colisão: enhanced fan-out, 2.'],
          config: FROTA_STREAMS,
        },
      ],
      debrief: { takeaways: ['Escrita, registros e leitura: o que pedir mais decide.'] },
    },
  ],
}
