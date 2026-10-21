/**
 * Fase 9 — Escolhendo a solução de dados. O quadro de escolha, a arquitetura
 * de streaming e o data lake de ponta a ponta.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { AnaChooserLabConfig } from '../../../../../simulators/anachooser/model'
import { META } from '../meta'

export const CINCO_TIMES: AnaChooserLabConfig = {
  itemsLabel: 'Pedidos dos times',
  options: ['athena', 'glue', 'lake-formation', 'emr', 'redshift', 'opensearch', 'quick', 'firehose', 'kds', 'msk', 'comprehend', 'sagemaker'],
  items: [
    { id: 'auditoria', text: 'A auditoria consulta logs antigos no S3 duas vezes por mês', dominant: 'adhoc-sql', needs: ['adhoc-sql'], concepts: ['ana.choose'] },
    { id: 'financeiro', text: 'O financeiro roda centenas de consultas SQL por hora, sobre dados limpos, com resposta rápida', dominant: 'dw-dashboards', needs: ['dw-dashboards'], concepts: ['ana.choose', 'rs.vs-athena'] },
    { id: 'conversao', text: 'Os arquivos de vendas precisam virar Parquet toda noite, sem servidores', dominant: 'daily-etl', needs: ['daily-etl'], concepts: ['ana.choose'] },
    { id: 'hbase', text: 'A logística mantém tabelas do HBase e ajusta a configuração do Spark', dominant: 'hadoop-control', needs: ['hadoop-control'], concepts: ['ana.choose'] },
    { id: 'busca', text: 'A loja precisa de busca de produtos tolerante a erros de digitação', dominant: 'text-search', needs: ['text-search'], concepts: ['ana.choose'] },
    { id: 'diretoria', text: 'A diretoria quer painéis interativos de vendas, sem código', dominant: 'bi-dashboard', needs: ['bi-dashboard'], concepts: ['ana.choose'] },
    { id: 'colunas', text: 'O jurídico exige que o marketing não veja CPF nas tabelas do data lake', dominant: 'column-security', needs: ['column-security'], concepts: ['ana.lake-reference'] },
    { id: 'cliques', text: 'Os cliques do site devem chegar ao S3 em minutos, sem consumidor próprio', dominant: 'stream-to-s3', needs: ['stream-to-s3'], concepts: ['ana.streaming-architecture'] },
    { id: 'kafka', text: 'O time de pagamentos quer Apache Kafka sem gerenciar servidores', dominant: 'kafka-managed', needs: ['kafka-managed'], concepts: ['ana.choose'] },
    { id: 'sentimento', text: 'O atendimento quer o sentimento das avaliações, sem treinar modelo', dominant: 'ready-nlp', needs: ['ready-nlp'], concepts: ['ana.choose'] },
  ],
}

export const F09_ANA: PhaseDef = {
  ...META.f09,
  concepts: ['ana.choose', 'ana.streaming-architecture', 'ana.lake-reference', 'rs.vs-athena'],
  availability: 'available',
  simplifications: ['Cada pedido tem um requisito que decide; na prática, a arquitetura de dados combina vários serviços.', 'Empresa e pedidos são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f09.m1',
      title: 'Do evento ao painel',
      type: 'mission',
      summary: 'A arquitetura de streaming e o data lake de ponta a ponta.',
      briefing: {
        company: 'Rede de Lojas Bem Bom',
        role: 'Você desenha a arquitetura de dados de uma rede de lojas.',
        situation: 'A rede quer um caminho único para os dados: cliques e vendas chegando sem parar, arquivos de parceiros, um data lake governado e painéis para a diretoria. Cada time propôs uma peça diferente.',
        objective: 'Montar o caminho dos dados de ponta a ponta.',
        successCriteria: ['Ordenar a arquitetura de streaming', 'Situar cada peça do data lake'],
      },
      intel: [
        { conceptId: 'ana.streaming-architecture', body: ['Produtores escrevem no **Kinesis Data Streams**; consumidores em tempo real leem o fluxo; o **Firehose**, lendo o mesmo fluxo, entrega Parquet no S3; **Athena** e **Quick Sight** consultam o histórico.'] },
        { conceptId: 'ana.lake-reference', body: ['Camada bruta no S3, **Glue** para catalogar e converter, **Lake Formation** para governar, **Athena** e **EMR** para consultar e processar, **Quick Sight** para mostrar.'] },
      ],
      activities: [
        {
          id: 'ana.f09.m1.a1',
          kind: 'order',
          title: 'O caminho de uma venda',
          prompt: 'Ponha na ordem o caminho de um evento de venda, do caixa ao painel.',
          concepts: [{ id: 'ana.streaming-architecture' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O caixa grava no fluxo; o antifraude lê em tempo real; o Firehose, lendo o mesmo fluxo, entrega lotes em Parquet no S3; o Athena consulta; o Quick Sight mostra.'],
          steps: [
            { id: 'put', text: 'O caixa grava o evento no Kinesis Data Streams', explanation: 'O produtor escreve no fluxo.' },
            { id: 'fraud', text: 'O antifraude lê o evento em tempo real', explanation: 'Consumidor de baixa latência.' },
            { id: 'firehose', text: 'O Firehose, lendo o mesmo fluxo, entrega um lote em Parquet no S3', explanation: 'Entrega em microlotes, já no formato colunar.' },
            { id: 'athena', text: 'O Athena consulta as vendas do dia', explanation: 'SQL sobre o data lake.' },
            { id: 'quick', text: 'O painel do Quick Sight mostra o resultado', explanation: 'Visualização para o negócio.' },
          ],
        },
        {
          id: 'ana.f09.m1.a2',
          kind: 'match',
          title: 'Cada peça do data lake',
          prompt: 'Associe cada peça ao papel dela no data lake.',
          concepts: [{ id: 'ana.lake-reference' }],
          xp: 50,
          difficulty: 1,
          explanation: ['O S3 guarda; o Glue cataloga e transforma; o Lake Formation governa; o Athena consulta; o Quick Sight mostra.'],
          leftLabel: 'Peça',
          rightLabel: 'Papel',
          pairs: [
            { id: 's3', left: 'Amazon S3', right: 'Guarda as camadas bruta, tratada e de consumo', explanation: 'É o armazenamento do data lake.', concepts: ['ana.lake-reference'] },
            { id: 'glue', left: 'AWS Glue', right: 'Cataloga as tabelas e converte para Parquet', explanation: 'Crawlers, Data Catalog e jobs.', concepts: ['ana.lake-reference'] },
            { id: 'lf', left: 'AWS Lake Formation', right: 'Decide quem vê cada coluna e cada linha', explanation: 'Governança do data lake.', concepts: ['ana.lake-reference'] },
            { id: 'athena', left: 'Amazon Athena', right: 'Responde SQL sobre os arquivos', explanation: 'Consultas sem servidor.', concepts: ['ana.lake-reference'] },
            { id: 'quick', left: 'Amazon Quick Sight', right: 'Mostra os resultados em painéis', explanation: 'Visualização.', concepts: ['ana.lake-reference'] },
          ],
        },
      ],
      debrief: { takeaways: ['Fluxo com vários leitores no Kinesis Data Streams, e o Firehose levando ao S3.', 'Data lake: S3, Glue, Lake Formation, Athena e Quick Sight, cada um no seu papel.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f09.m2',
      title: 'O serviço com menos operação',
      type: 'mission',
      summary: 'Quando duas opções atendem, a sem servidor e com menos operação costuma ser a resposta.',
      briefing: {
        company: 'Rede de Lojas Bem Bom',
        role: 'Você revisa as propostas dos times.',
        situation: 'Cada time trouxe uma proposta. Algumas funcionam, mas exigem muito mais operação do que o pedido justifica.',
        objective: 'Trocar cada proposta pela opção mais simples que atende.',
        successCriteria: ['Preferir o sem servidor quando ele atende', 'Saber quando o controle compensa'],
      },
      intel: [{ conceptId: 'ana.choose', body: ['Quando várias opções atendem, prefira a sem servidor e com menos operação. O controle de um cluster só compensa quando o requisito pede.'] }],
      activities: [
        {
          id: 'ana.f09.m2.a1',
          kind: 'decision',
          title: 'Um cluster para duas consultas',
          prompt: 'A auditoria propôs um cluster do Redshift ligado o mês inteiro para consultar logs do S3 duas vezes por mês. O que sugerir?',
          concepts: [{ id: 'ana.choose' }, { id: 'rs.vs-athena', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Athena consulta o S3 sob demanda e cobra só o dado lido. Um data warehouse ligado o mês inteiro paga horas sem uso.'],
          options: [
            { id: 'a', text: 'Consultar os logs com o Athena', correct: true, consequence: 'Paga só as duas consultas do mês.' },
            { id: 'b', text: 'Manter o Redshift, porque é mais rápido', correct: false, consequence: 'A velocidade não compensa o custo do cluster parado.' },
          ],
        },
        {
          id: 'ana.f09.m2.a2',
          kind: 'decision',
          title: 'Spark para converter CSV',
          prompt: 'O time de vendas propôs um cluster do EMR para converter CSV em Parquet toda noite, sem nenhuma configuração especial do Spark. O que sugerir?',
          concepts: [{ id: 'ana.choose' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Glue faz o mesmo ETL em Spark sem servidor. O EMR só compensa quando é preciso controlar o cluster ou usar ferramentas que o Glue não oferece.'],
          options: [
            { id: 'a', text: 'Um job do Glue agendado', correct: true, consequence: 'Mesma conversão, sem cluster para dimensionar.' },
            { id: 'b', text: 'Manter o EMR com cluster de longa duração', correct: false, consequence: 'Paga o cluster parado e exige operação.' },
          ],
        },
      ],
      debrief: { takeaways: ['Sem requisito de controle, prefira o serviço sem servidor.', 'EMR e Redshift compensam quando o volume, a frequência ou o controle justificam.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f09.boss',
      title: 'Dez pedidos, dez serviços',
      type: 'boss',
      summary: 'Cada pedido dos times pelo serviço de dados certo.',
      briefing: {
        company: 'Rede de Lojas Bem Bom',
        role: 'Você fecha o mapa de serviços da plataforma de dados.',
        situation: 'Dez pedidos chegaram de auditoria, financeiro, logística, loja, diretoria, jurídico, marketing digital, pagamentos e atendimento.',
        objective: 'Escolher o serviço de cada pedido, com o mínimo de operação.',
        successCriteria: ['Todos os pedidos atendidos', 'A opção mais simples em cada caso'],
      },
      intel: [{ conceptId: 'ana.choose', body: ['Olhe o requisito que decide cada pedido: frequência, controle, tipo de pergunta ou de dado.'] }],
      activities: [
        {
          id: 'ana.f09.boss.a1',
          kind: 'lab',
          lab: 'ana-chooser',
          title: 'O mapa de serviços',
          prompt: 'Para cada pedido, escolha o serviço. Depois da verificação, cada cartão mostra o que a escolha atende ou não.',
          concepts: [{ id: 'ana.choose' }, { id: 'ana.streaming-architecture' }, { id: 'ana.lake-reference' }],
          xp: 200,
          difficulty: 3,
          hints: ['Consulta pontual e SQL frequente pedem serviços diferentes.', 'O Glue converte; o EMR dá controle do cluster.'],
          explanation: [
            'Auditoria: Athena. Financeiro: Redshift. Conversão: Glue. HBase: EMR. Busca: OpenSearch.',
            'Diretoria: Quick Sight. CPF: Lake Formation. Cliques: Firehose. Kafka: MSK. Sentimento: Comprehend.',
          ],
          config: CINCO_TIMES,
        },
      ],
      debrief: { takeaways: ['O requisito que decide aponta o serviço.', 'Quando várias opções atendem, a com menos operação vale mais.'] },
    },
  ],
}
