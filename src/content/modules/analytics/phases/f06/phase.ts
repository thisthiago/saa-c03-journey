/**
 * Fase 6 — Ingestão e streaming no data lake. Lote, microlote e fluxo;
 * Kinesis Data Streams; Data Firehose com conversão e partição; MSK; Data
 * Exchange e AppFlow; ingestão segura.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { IngestLabConfig } from '../../../../../simulators/ingest/model'
import { META } from '../meta'

export const VAI_LA_INGEST: IngestLabConfig = {
  itemsLabel: 'Fontes de dados',
  options: ['s3-direct', 'firehose', 'kds', 'msk', 'data-exchange', 'appflow', 'datasync'],
  items: [
    { id: 'cliques', text: 'Cliques no aplicativo, que devem chegar ao data lake em Parquet em poucos minutos', dominant: 'parquet-on-arrival', needs: ['to-s3-minutes', 'parquet-on-arrival'], concepts: ['fh.parquet', 'fh.delivery'] },
    { id: 'gps', text: 'Posição dos carros, lida ao mesmo tempo pelo cálculo de preço e pelo antifraude, com releitura em caso de erro', dominant: 'many-consumers', needs: ['many-consumers', 'replay'], concepts: ['kds.streams'] },
    { id: 'pagamentos', text: 'Eventos de pagamento de um sistema comprado que só fala a API do Kafka', dominant: 'kafka-api', needs: ['kafka-api', 'replay'], concepts: ['msk.kafka'] },
    { id: 'clima', text: 'Previsão do tempo de um fornecedor de dados meteorológicos, por assinatura', dominant: 'third-party', needs: ['third-party'], concepts: ['ingest.third-party'] },
    { id: 'crm', text: 'Contas de empresas parceiras cadastradas no Salesforce', dominant: 'saas', needs: ['saas'], concepts: ['ingest.third-party'] },
    { id: 'fechamento', text: 'O arquivo de fechamento financeiro, gerado uma vez por dia por um sistema na AWS', dominant: 'daily-file', needs: ['daily-file'], concepts: ['ingest.patterns'] },
    { id: 'antigos', text: 'Dez anos de comprovantes digitalizados no servidor de arquivos do escritório', dominant: 'onprem-files', needs: ['onprem-files'], concepts: ['ingest.patterns'] },
  ],
}

export const F06_ANA: PhaseDef = {
  ...META.f06,
  concepts: ['ingest.patterns', 'kds.streams', 'fh.delivery', 'fh.parquet', 'msk.kafka', 'ingest.third-party', 'ingest.secure'],
  availability: 'available',
  simplifications: ['Cada fonte tem um requisito que decide; na prática, os serviços se combinam, como o Kinesis Data Streams com o Firehose entregando no S3.', 'Aplicativo, fontes e volumes são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f06.m1',
      title: 'Lote, microlote ou fluxo',
      type: 'mission',
      summary: 'O padrão de ingestão vem da frequência e de quanto o negócio aceita esperar.',
      briefing: {
        company: 'Aplicativo de Mobilidade Vai Lá',
        role: 'Você traz os dados do aplicativo para o data lake.',
        situation: 'O aplicativo gera cliques, posições de carros e pagamentos o tempo todo. O financeiro fecha o dia uma vez, às 23h. Hoje, tudo chega por scripts escritos às pressas, e ninguém sabe o que é urgente.',
        objective: 'Separar o que pode chegar em lote do que precisa chegar em minutos ou em segundos.',
        successCriteria: ['Classificar as fontes pelo padrão', 'Entender o buffer do Firehose'],
      },
      intel: [
        { conceptId: 'ingest.patterns', body: ['**Lote**: um arquivo de tempos em tempos. **Microlote**: pequenos lotes a cada poucos minutos. **Fluxo**: cada evento em segundos. Escolha pelo tempo que o negócio aceita esperar.'] },
        { conceptId: 'fh.delivery', body: ['O **Firehose** recebe o fluxo e entrega no S3 sem código. Ele junta os registros num **buffer** por tamanho ou por tempo, e entrega quando o primeiro limite chega.'] },
      ],
      activities: [
        {
          id: 'ana.f06.m1.a1',
          kind: 'classify',
          title: 'Quanto pode esperar',
          prompt: 'Classifique cada fonte pelo padrão de ingestão que basta.',
          concepts: [{ id: 'ingest.patterns' }],
          xp: 50,
          difficulty: 1,
          explanation: ['O padrão vem do tempo aceito: um dia aceita lote; alguns minutos aceitam microlote; segundos pedem fluxo.'],
          bins: [
            { id: 'batch', label: 'Lote' },
            { id: 'micro', label: 'Microlote' },
            { id: 'stream', label: 'Fluxo' },
          ],
          items: [
            { id: 'close', text: 'O fechamento financeiro, lido pela contabilidade no dia seguinte', bin: 'batch', explanation: 'Um dia de espera é aceito.', concepts: ['ingest.patterns'] },
            { id: 'clicks', text: 'Os cliques do aplicativo, para um painel atualizado a cada 5 minutos', bin: 'micro', explanation: 'Alguns minutos bastam.', concepts: ['ingest.patterns'] },
            { id: 'fraud', text: 'Os pagamentos, que o antifraude precisa avaliar antes de aprovar', bin: 'stream', explanation: 'A resposta precisa vir em segundos.', concepts: ['ingest.patterns'] },
            { id: 'price', text: 'As posições dos carros, para o preço dinâmico da corrida', bin: 'stream', explanation: 'O preço muda a cada instante.', concepts: ['ingest.patterns'] },
          ],
        },
        {
          id: 'ana.f06.m1.a2',
          kind: 'decision',
          title: 'O painel de 5 minutos',
          prompt: 'O Firehose entrega os cliques no S3 com buffer de 128 MiB ou 900 segundos. Num horário de pouco movimento, o painel fica 15 minutos sem dados novos. O que ajustar?',
          concepts: [{ id: 'fh.delivery' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Firehose entrega quando o primeiro limite do buffer chega. Com pouco movimento, os 128 MiB demoram, e vale o tempo de 900 segundos. Reduzir o intervalo faz a entrega acontecer antes.'],
          options: [
            { id: 'a', text: 'Reduzir o intervalo do buffer para 300 segundos', correct: true, consequence: 'Nos horários calmos, a entrega acontece a cada 5 minutos.' },
            { id: 'b', text: 'Aumentar o tamanho do buffer', correct: false, consequence: 'O limite de tamanho demoraria ainda mais.' },
            { id: 'c', text: 'Trocar o Firehose por um job do Glue diário', correct: false, consequence: 'O painel passaria a receber dados uma vez por dia.' },
          ],
        },
      ],
      debrief: { takeaways: ['Lote, microlote ou fluxo: escolha pelo tempo de espera aceito.', 'O Firehose entrega quando o primeiro limite do buffer, tamanho ou tempo, é atingido.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f06.m2',
      title: 'O fluxo das corridas',
      type: 'mission',
      summary: 'Kinesis Data Streams, shards, releitura e o MSK para quem já usa Kafka.',
      briefing: {
        company: 'Aplicativo de Mobilidade Vai Lá',
        role: 'Você monta o fluxo de posições dos carros.',
        situation: 'Cada carro manda a posição a cada 4 segundos. O cálculo de preço e o antifraude leem o mesmo fluxo, e um erro no antifraude exige reler as últimas horas. O sistema de pagamentos, comprado de um fornecedor, só sabe falar com Kafka.',
        objective: 'Escolher o fluxo de cada caso e dimensioná-lo.',
        successCriteria: ['Usar o Kinesis Data Streams para vários consumidores', 'Calcular os shards', 'Saber quando o MSK é a resposta'],
      },
      intel: [
        { conceptId: 'kds.streams', body: ['O **Kinesis Data Streams** guarda o fluxo em **shards** por 24 horas (até 365 dias). Vários consumidores leem e **releem**. Cada shard aceita até **1 MB/s ou 1.000 registros/s** de escrita.'] },
        { conceptId: 'msk.kafka', body: ['O **MSK** é o Kafka gerenciado. Aplicações que já usam a API do Kafka passam a usá-lo sem mudar o código.'] },
      ],
      activities: [
        {
          id: 'ana.f06.m2.a1',
          kind: 'decision',
          title: 'Dois leitores e releitura',
          prompt: 'O cálculo de preço e o antifraude leem as mesmas posições, em menos de um segundo, e o antifraude precisa reler as últimas horas quando falha. O que usar?',
          concepts: [{ id: 'kds.streams' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Kinesis Data Streams guarda o fluxo e deixa vários consumidores lerem e relerem. O Firehose entrega e segue, sem releitura.'],
          options: [
            { id: 'a', text: 'Kinesis Data Streams', correct: true, consequence: 'Os dois sistemas leem o mesmo fluxo, cada um no seu ritmo, com releitura.' },
            { id: 'b', text: 'Data Firehose entregando no S3', correct: false, consequence: 'Chega em lotes de minutos e não serve dois leitores em tempo real.' },
            { id: 'c', text: 'Uma fila do SQS', correct: false, consequence: 'A mensagem lida e apagada some para os outros consumidores.' },
          ],
        },
        {
          id: 'ana.f06.m2.a2',
          kind: 'estimate',
          title: 'Quantos shards',
          prompt: 'No pico, o fluxo recebe 4.000 registros por segundo, de 1 KB cada (cerca de 4 MB/s). No modo provisionado, quantos shards são necessários para a escrita?',
          concepts: [{ id: 'kds.streams' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Cada shard aceita até 1.000 registros/s e até 1 MB/s de escrita. Pelos registros, são 4 shards; pelo volume, também 4. Vale o maior dos dois: 4 shards.'],
          unit: 'shards',
          min: 1,
          max: 20,
          step: 1,
          answer: 4,
          tolerance: 0,
        },
        {
          id: 'ana.f06.m2.a3',
          kind: 'decision',
          title: 'O sistema que só fala Kafka',
          prompt: 'O sistema de pagamentos, comprado pronto, publica e consome eventos pela API do Apache Kafka. A empresa não quer manter servidores do Kafka. O que usar?',
          concepts: [{ id: 'msk.kafka' }],
          xp: 50,
          difficulty: 1,
          explanation: ['O MSK é o Kafka gerenciado pela AWS, compatível com as aplicações que usam a API do Kafka.'],
          options: [
            { id: 'a', text: 'Amazon MSK', correct: true, consequence: 'O sistema conversa com o Kafka de sempre, e a AWS cuida do cluster.' },
            { id: 'b', text: 'Kinesis Data Streams', correct: false, consequence: 'Tem API própria; o sistema comprado não fala com ela.' },
            { id: 'c', text: 'Instalar o Kafka em instâncias EC2', correct: false, consequence: 'Funciona, mas a empresa passaria a manter os servidores.' },
          ],
        },
        {
          id: 'ana.f06.m2.a4',
          kind: 'decision',
          title: 'Kafka sem servidor em São Paulo',
          prompt: 'A equipe quer o MSK Serverless, para não dimensionar o cluster, na Região de São Paulo (sa-east-1). O que dizer?',
          concepts: [{ id: 'msk.kafka' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Na lista da documentação conferida, o MSK Serverless está em algumas Regiões, como us-east-1, mas não em sa-east-1. Em São Paulo, o caminho é o MSK provisionado.'],
          options: [
            { id: 'a', text: 'O MSK Serverless não está disponível em sa-east-1; em São Paulo, use o MSK provisionado', correct: true, consequence: 'A equipe dimensiona o cluster, ou avalia outra Região.' },
            { id: 'b', text: 'O MSK Serverless está em todas as Regiões', correct: false, consequence: 'A documentação lista Regiões específicas.' },
          ],
        },
      ],
      debrief: { takeaways: ['Vários consumidores e releitura: Kinesis Data Streams.', 'Shards: o maior entre registros ÷ 1.000 e MB/s ÷ 1.', 'Quem já fala Kafka: MSK.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f06.m3',
      title: 'Pronto para o Athena',
      type: 'mission',
      summary: 'O Firehose convertendo para Parquet, os dados de terceiros e a ingestão segura.',
      briefing: {
        company: 'Aplicativo de Mobilidade Vai Lá',
        role: 'Você cuida para que os dados cheguem prontos e com segurança.',
        situation: 'Os cliques chegam em JSON, e o Athena paga caro para lê-los. O time de dados quer previsão do tempo de um fornecedor e as contas dos parceiros que estão no Salesforce. Os produtores rodam numa VPC sem saída para a internet.',
        objective: 'Fazer os dados chegarem prontos para consulta, trazer dados externos e proteger a entrada.',
        successCriteria: ['Converter na chegada', 'Escolher Data Exchange e AppFlow', 'Proteger o ponto de ingestão'],
      },
      intel: [
        { conceptId: 'fh.parquet', body: ['O Firehose converte **JSON em Parquet ou ORC** usando o esquema de uma tabela do Data Catalog, e a **partição dinâmica** grava cada registro na pasta da sua chave.'] },
        { conceptId: 'ingest.third-party', body: ['**Data Exchange**: dados de outras organizações por assinatura. **AppFlow**: dados de aplicações SaaS, como o Salesforce, sem código.'] },
        { conceptId: 'ingest.secure', body: ['Produtor com **role que só grava** no destino, **tráfego privado** por endpoints de VPC e **criptografia**.'] },
      ],
      activities: [
        {
          id: 'ana.f06.m3.a1',
          kind: 'decision',
          title: 'JSON caro',
          prompt: 'Os cliques chegam em JSON pelo Firehose, e o Athena lê o registro inteiro. Como fazê-los chegar em Parquet, sem job extra?',
          concepts: [{ id: 'fh.parquet' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O Firehose converte JSON em Parquet na entrega, usando o esquema de uma tabela do Data Catalog.'],
          options: [
            { id: 'a', text: 'Ligar a conversão de formato do Firehose, apontando para a tabela do Data Catalog', correct: true, consequence: 'O dado já chega em Parquet, pronto para o Athena.' },
            { id: 'b', text: 'Pedir ao aplicativo que mande Parquet', correct: false, consequence: 'Muda o aplicativo de cada celular, sem necessidade.' },
            { id: 'c', text: 'Converter com um crawler', correct: false, consequence: 'O crawler descobre esquemas; não converte arquivos.' },
          ],
        },
        {
          id: 'ana.f06.m3.a2',
          kind: 'match',
          title: 'De onde vem cada dado',
          prompt: 'Associe cada fonte ao serviço que a traz.',
          concepts: [{ id: 'ingest.third-party' }, { id: 'fh.delivery', weight: 0.5 }],
          xp: 50,
          difficulty: 1,
          explanation: ['Dados de outra organização por assinatura: Data Exchange. Aplicação SaaS: AppFlow. Fluxo de eventos para o S3: Firehose.'],
          leftLabel: 'Fonte',
          rightLabel: 'Serviço',
          pairs: [
            { id: 'clima', left: 'Previsão do tempo de um fornecedor, por assinatura', right: 'AWS Data Exchange', explanation: 'Dados de terceiros entregues na conta.', concepts: ['ingest.third-party'] },
            { id: 'crm', left: 'Contas de parceiros no Salesforce', right: 'Amazon AppFlow', explanation: 'Fluxo sem código a partir do SaaS.', concepts: ['ingest.third-party'] },
            { id: 'clicks', left: 'Cliques do aplicativo para o S3, em minutos', right: 'Amazon Data Firehose', explanation: 'Entrega gerenciada de fluxo.', concepts: ['fh.delivery'] },
          ],
        },
        {
          id: 'ana.f06.m3.a3',
          kind: 'decision',
          title: 'O produtor na VPC fechada',
          prompt: 'Os serviços que enviam as posições rodam numa VPC sem saída para a internet. Como eles devem escrever no Kinesis?',
          concepts: [{ id: 'ingest.secure' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Um endpoint de interface do Kinesis leva o tráfego pela rede privada, e uma role que só grava naquele fluxo limita o estrago de uma credencial vazada.'],
          options: [
            { id: 'a', text: 'Por um endpoint de interface do Kinesis, com uma role que só grava naquele fluxo', correct: true, consequence: 'O tráfego fica privado, e o produtor não lê nada.' },
            { id: 'b', text: 'Abrir saída para a internet e usar uma chave de acesso com acesso total ao Kinesis', correct: false, consequence: 'Expõe o tráfego e dá permissão demais.' },
            { id: 'c', text: 'Gravar direto no bucket do data lake, com acesso de leitura e escrita', correct: false, consequence: 'O produtor passa a poder ler o data lake inteiro.' },
          ],
        },
      ],
      debrief: { takeaways: ['Firehose converte JSON em Parquet com o esquema do Data Catalog.', 'Data Exchange para dados de terceiros; AppFlow para SaaS.', 'Ponto de ingestão: mínimo de permissão, rede privada e criptografia.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f06.boss',
      title: 'Sete fontes, sete caminhos',
      type: 'boss',
      summary: 'Cada fonte de dados do aplicativo pelo caminho mais simples que atende.',
      briefing: {
        company: 'Aplicativo de Mobilidade Vai Lá',
        role: 'Você fecha o desenho da ingestão do data lake.',
        situation: 'Sete fontes, de cliques a comprovantes antigos, ainda chegam por scripts. Cada uma tem frequência, origem e uso diferentes.',
        objective: 'Escolher o caminho de cada fonte, sem exagerar na complexidade.',
        successCriteria: ['Todas as fontes atendidas', 'O caminho mais simples em cada caso'],
      },
      intel: [
        { conceptId: 'ingest.patterns', body: ['Comece pelo mais simples que atende: gravar direto no S3, Firehose, e só então fluxos com consumidores.'] },
        { conceptId: 'kds.streams', body: ['Releitura e vários consumidores em tempo real pedem um fluxo que guarda os eventos.'] },
      ],
      activities: [
        {
          id: 'ana.f06.boss.a1',
          kind: 'lab',
          lab: 'ingest',
          title: 'O caminho de cada fonte',
          prompt: 'Para cada fonte, escolha o serviço de ingestão. Depois da verificação, cada cartão mostra o que faltou ou sobrou.',
          concepts: [{ id: 'ingest.patterns' }, { id: 'kds.streams' }, { id: 'fh.parquet' }, { id: 'msk.kafka' }, { id: 'ingest.third-party' }],
          xp: 200,
          difficulty: 3,
          hints: ['O Firehose resolve entregas em minutos no S3, inclusive em Parquet.', 'Releitura com dois leitores pede um fluxo que guarda os eventos.'],
          explanation: [
            'Cliques: Firehose com conversão para Parquet. Posições: Kinesis Data Streams. Pagamentos: MSK.',
            'Previsão do tempo: Data Exchange. Salesforce: AppFlow. Fechamento diário: gravar direto no S3. Comprovantes antigos: DataSync.',
          ],
          config: VAI_LA_INGEST,
        },
      ],
      debrief: { takeaways: ['Arquivo diário: grave direto no S3.', 'Fluxo para o S3 em minutos: Firehose.', 'Vários leitores com releitura: Kinesis Data Streams; Kafka: MSK.', 'Terceiros: Data Exchange; SaaS: AppFlow; arquivos locais: DataSync.'] },
    },
  ],
}
