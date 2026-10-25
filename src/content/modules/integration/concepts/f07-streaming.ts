/**
 * Conceitos da Fase 7 — Streaming. Reaproveita kds.streams, fh.delivery,
 * fh.parquet e msk.kafka (trilha Análise de dados).
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F07_INT_CONCEPTS: ConceptDef[] = [
  {
    id: 'kds.partition-key',
    title: 'Chave de partição e shard quente',
    officialName: 'Partition key',
    serviceIds: ['aws.kinesis-data-streams'],
    summary: 'Cada registro do Kinesis tem uma **chave de partição**; um hash MD5 dela decide o **shard**. Registros com a **mesma chave** vão sempre ao mesmo shard e ficam **em ordem** entre si. Se uma chave concentra o tráfego, o shard dela estoura o limite de **1 MB/s** de escrita, não importa quantos shards existam: é o **shard quente**.',
    commonMistakes: ['Usar a data do dia como chave de partição e mandar tudo para um shard só'],
    facts: ['Um registro tem até 1 MB.'],
    recommendations: ['Escolha uma chave com muitos valores bem distribuídos, como o ID do dispositivo, e não um valor que quase todos compartilham.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinal: "um shard recebe throttling enquanto os outros estão folgados". A resposta é uma chave de partição com mais valores distintos.',
    },
    references: [R.kdsConcepts, R.kdsLimits],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'kds.enhanced-fanout',
    title: 'Enhanced fan-out',
    officialName: 'Enhanced fan-out consumers',
    serviceIds: ['aws.kinesis-data-streams'],
    summary: 'Na leitura **compartilhada**, os consumidores dividem os **2 MB/s** de leitura de cada shard e consultam o stream (latência de cerca de 200 ms). Com **enhanced fan-out**, cada consumidor registrado recebe os **próprios 2 MB/s** por shard, por push, com latência de cerca de **70 ms**.',
    commonMistakes: ['Pendurar cinco aplicações na leitura compartilhada e ver todas atrasarem'],
    facts: ['Um stream aceita até 20 consumidores com enhanced fan-out (50 no modo On-demand Advantage).', 'O enhanced fan-out cobra a leitura dos dados e cada hora de consumidor por shard.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinal: "vários consumidores do mesmo stream disputam a leitura e atrasam". A resposta é o enhanced fan-out.',
    },
    references: [R.kdsEfo],
    tags: ['integracao', 'desempenho'],
  },
  {
    id: 'int.queue-vs-stream',
    title: 'Fila ou stream',
    officialName: 'Message queues and data streams',
    serviceIds: ['aws.sqs', 'aws.kinesis-data-streams'],
    summary: 'Na **fila**, cada mensagem vai para **um** consumidor e é **apagada** depois de processada; não dá para reler. No **stream**, os registros ficam guardados pelo prazo de retenção, **vários** consumidores leem os mesmos dados no próprio ritmo e podem **reler** desde um ponto; a ordem vale por shard.',
    commonMistakes: ['Usar SQS para alimentar três aplicações que precisam dos mesmos eventos'],
    recommendations: ['Tarefas para distribuir entre trabalhadores pedem fila; eventos que várias aplicações leem, ou que precisam ser relidos, pedem stream.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "distribuir tarefas entre trabalhadores" apontam para uma fila; "várias aplicações precisam dos mesmos eventos ou de reler o histórico", para um stream.',
    },
    references: [R.sqsWhat, R.kdsConcepts],
    tags: ['integracao'],
  },
]
