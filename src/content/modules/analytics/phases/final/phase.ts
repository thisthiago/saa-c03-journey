/** Desafio final — Plataforma de Dados (empresa fictícia: Lojas Praça Nova). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ArchitectureLabConfig } from '../../../../../simulators/architecture/lab'
import { META } from '../meta'

export const PRACA_NOVA: ArchitectureLabConfig = {
  title: 'Relatório da Plataforma de Dados',
  dimensions: [
    { id: 'seguro', label: 'Seguro', examDomain: 'd1' },
    { id: 'resiliente', label: 'Resiliente', examDomain: 'd2' },
    { id: 'desempenho', label: 'Alto desempenho', examDomain: 'd3' },
    { id: 'custo', label: 'Custo otimizado', examDomain: 'd4' },
    { id: 'requisitos', label: 'Atendimento aos requisitos' },
  ],
  minDimension: 0.5,
  disclaimer: 'A rubrica e os pesos são pedagógicos, definidos pelo AWS Quest. Os fatos sobre os serviços foram conferidos na documentação da AWS em 21/10/2026.',
  steps: [
    {
      id: 'lago',
      title: 'Camadas e formato do data lake',
      intro: 'As **Lojas Praça Nova** têm 300 lojas. Vendas do banco transacional, cliques do site, arquivos CSV de parceiros e avaliações de clientes vão para um data lake no S3. As consultas filtram quase sempre pela data.',
      questions: [
        {
          id: 'camadas',
          prompt: 'Como organizar o data lake?',
          options: [
            { id: 'tres', label: 'Camadas bruta, tratada e de consumo, cada uma num bucket, com os originais preservados e ciclo de vida na bruta', scores: { requisitos: 1, resiliente: 1, custo: 1, seguro: 1 }, consequence: 'Dá para reprocessar quando uma regra muda, e os originais ficam baratos com o tempo.', concepts: ['lake.layers', 'lake.what'] },
            { id: 'um-bucket', label: 'Um bucket só, com originais e convertidos misturados na mesma pasta', scores: { requisitos: 0.5, resiliente: 0.7, custo: 0.8, seguro: 0.4 }, consequence: 'Consultas e permissões ficam confusas, porque cada pasta mistura camadas.', whyNot: 'A recomendação é um bucket por camada.', concepts: ['lake.layers'] },
            { id: 'so-parquet', label: 'Converter para Parquet e apagar os originais', scores: { requisitos: 0.4, resiliente: 0.2, custo: 1, seguro: 0.8 }, consequence: 'Um erro na conversão não tem volta.', whyNot: 'Sem a camada bruta, não há como reprocessar.', concepts: ['lake.layers'] },
          ],
        },
        {
          id: 'formato',
          prompt: 'Em que formato fica a camada tratada?',
          options: [
            { id: 'parquet-data', label: 'Parquet comprimido, particionado por data', scores: { desempenho: 1, custo: 1, requisitos: 1 }, consequence: 'As consultas leem só as colunas e os dias que usam.', concepts: ['lake.columnar', 'lake.partitioning'] },
            { id: 'csv', label: 'CSV, como os parceiros enviam', scores: { desempenho: 0.3, custo: 0.2, requisitos: 0.7 }, consequence: 'Toda consulta lê o registro inteiro do período inteiro.', whyNot: 'Formato colunar e partição reduzem o dado lido.', concepts: ['lake.columnar'] },
            { id: 'por-minuto', label: 'Parquet particionado por loja, por dia e por minuto', scores: { desempenho: 0.3, custo: 0.6, requisitos: 0.7 }, consequence: 'Milhões de arquivos pequenos deixam as consultas lentas.', whyNot: 'Partição demais gera arquivos pequenos.', concepts: ['lake.small-files', 'lake.partitioning'] },
          ],
        },
      ],
    },
    {
      id: 'catalogo',
      title: 'Catálogo e transformação',
      intro: 'Toda noite chegam os arquivos do dia na camada bruta. Eles precisam virar Parquet na camada tratada e aparecer nas consultas antes das 7h.',
      questions: [
        {
          id: 'etl',
          prompt: 'Como converter os arquivos todas as noites?',
          options: [
            { id: 'glue', label: 'Job do Glue agendado, com job bookmarks', scores: { custo: 1, requisitos: 1, resiliente: 1 }, consequence: 'Sem servidor, e cada noite processa só o que é novo.', concepts: ['glue.etl-job', 'glue.bookmarks', 'glue.format-conversion'] },
            { id: 'ec2', label: 'Um script com cron numa instância EC2', scores: { custo: 0.6, requisitos: 0.7, resiliente: 0.4 }, consequence: 'Se a instância cair, a carga da noite não acontece.', whyNot: 'O Glue faz o mesmo sem servidor para manter.', concepts: ['glue.etl-job'] },
            { id: 'glue-sem-bookmark', label: 'Job do Glue que relê a pasta inteira toda noite', scores: { custo: 0.3, requisitos: 0.5, resiliente: 0.8 }, consequence: 'O job demora mais a cada dia e duplica os dados.', whyNot: 'O bookmark evita reprocessar.', concepts: ['glue.bookmarks'] },
          ],
        },
        {
          id: 'crawler',
          prompt: 'Como registrar as partições novas no catálogo?',
          options: [
            { id: 'workflow', label: 'Crawler iniciado quando o job termina com sucesso, num workflow do Glue', scores: { resiliente: 1, requisitos: 1 }, consequence: 'O dia novo aparece no catálogo assim que é gravado.', concepts: ['glue.triggers-workflows', 'glue.crawler'] },
            { id: 'horario', label: 'Crawler às 3h, por horário', scores: { resiliente: 0.4, requisitos: 0.6 }, consequence: 'Nas noites em que o job passa das 3h, o dia some das consultas.', whyNot: 'Passos dependentes se encadeiam por condição.', concepts: ['glue.triggers-workflows'] },
          ],
        },
      ],
    },
    {
      id: 'consultas',
      title: 'Consultas sob demanda',
      intro: 'Analistas de cinco áreas fazem perguntas novas todo dia. No mês passado, uma consulta sem filtro leu o ano inteiro várias vezes.',
      questions: [
        {
          id: 'athena',
          prompt: 'Como atender aos analistas?',
          options: [
            { id: 'wg', label: 'Athena com um workgroup por área e limite por consulta', scores: { custo: 1, requisitos: 1, seguro: 1 }, consequence: 'Cada área tem o próprio custo, e a consulta descontrolada é cancelada.', concepts: ['athena.what', 'athena.workgroups'] },
            { id: 'athena-livre', label: 'Athena num workgroup só, sem limites', scores: { custo: 0.4, requisitos: 0.8, seguro: 0.7 }, consequence: 'A próxima consulta sem filtro volta a ler o ano inteiro.', whyNot: 'O limite por consulta cancela o exagero.', concepts: ['athena.workgroups'] },
            { id: 'redshift', label: 'Um cluster do Redshift ligado o mês todo para as perguntas pontuais', scores: { custo: 0.3, requisitos: 0.9, seguro: 1 }, consequence: 'Paga o cluster nas horas sem consulta.', whyNot: 'Perguntas pontuais sobre o S3 são o caso do Athena.', concepts: ['rs.vs-athena'] },
          ],
        },
      ],
    },
    {
      id: 'acesso',
      title: 'Permissões por coluna e por linha',
      intro: 'As tabelas de clientes têm CPF. O marketing não pode ver dados pessoais, e cada gerente regional só vê a própria região. O catálogo cresce toda semana.',
      questions: [
        {
          id: 'permissoes',
          prompt: 'Como controlar o acesso?',
          options: [
            { id: 'lf', label: 'Lake Formation com LF-Tags por classificação e filtros de linha por região, tirando o IAMAllowedPrincipals', scores: { seguro: 1, requisitos: 1 }, consequence: 'Cada equipe vê exatamente o permitido, inclusive nas tabelas novas.', concepts: ['lf.tags', 'lf.fine-grained', 'lf.default-hybrid'] },
            { id: 'lf-padrao', label: 'Concessões no Lake Formation, mantendo a configuração padrão do IAMAllowedPrincipals', scores: { seguro: 0.2, requisitos: 0.3 }, consequence: 'As concessões não valem: todos continuam vendo tudo pelo IAM.', whyNot: 'Com o IAMAllowedPrincipals, o acesso fica só com o IAM.', concepts: ['lf.default-hybrid'] },
            { id: 'copias', label: 'Uma cópia de cada tabela por equipe, sem as colunas proibidas', scores: { seguro: 0.6, requisitos: 0.7 }, consequence: 'Multiplica os dados e os processos para manter as cópias.', whyNot: 'O Lake Formation filtra colunas e linhas sem cópia.', concepts: ['lf.fine-grained'] },
          ],
        },
      ],
    },
    {
      id: 'pesado',
      title: 'Processamento pesado',
      intro: 'Toda noite, um job Spark com bibliotecas próprias recalcula a previsão de estoque de 300 lojas. Ele guarda dados intermediários no HDFS e precisa terminar até as 6h. O custo deve ser baixo.',
      questions: [
        {
          id: 'cluster',
          prompt: 'Como rodar o job da previsão?',
          options: [
            { id: 'transitorio', label: 'Cluster transitório do EMR: primário e core On-Demand, nós task em Spot', scores: { custo: 1, resiliente: 1, desempenho: 1 }, consequence: 'Paga só as horas da noite, e a retomada de Spot só reduz a capacidade.', concepts: ['emr.spot', 'emr.transient', 'emr.node-types'] },
            { id: 'tudo-spot', label: 'Cluster do EMR todo em Spot, ligado o tempo todo', scores: { custo: 0.4, resiliente: 0.2, desempenho: 0.7 }, consequence: 'Uma retomada do primário ou dos core derruba o job, e o cluster cobra o dia inteiro.', whyNot: 'Primário e core com HDFS não devem ficar em Spot.', concepts: ['emr.spot', 'emr.transient'] },
            { id: 'sob-demanda-longo', label: 'Cluster do EMR todo On-Demand, ligado o tempo todo', scores: { custo: 0.3, resiliente: 1, desempenho: 1 }, consequence: 'Funciona, mas paga 24 horas por 4 de trabalho.', whyNot: 'O cluster transitório termina com o job.', concepts: ['emr.transient'] },
          ],
        },
      ],
    },
    {
      id: 'cliques',
      title: 'Ingestão contínua dos cliques',
      intro: 'O site gera cliques sem parar. A personalização lê os cliques em menos de um segundo, e eles também precisam chegar ao data lake em Parquet, em poucos minutos.',
      questions: [
        {
          id: 'fluxo',
          prompt: 'Como montar a ingestão dos cliques?',
          options: [
            { id: 'kds-firehose', label: 'Kinesis Data Streams lido pela personalização e pelo Firehose, que entrega Parquet no S3', scores: { requisitos: 1, desempenho: 1, custo: 1 }, consequence: 'Um fluxo só atende ao tempo real e ao data lake.', concepts: ['kds.streams', 'fh.parquet', 'ana.streaming-architecture'] },
            { id: 'so-firehose', label: 'Só o Firehose entregando no S3', scores: { requisitos: 0.4, desempenho: 0.5, custo: 1 }, consequence: 'O data lake recebe os cliques, mas a personalização fica sem tempo real.', whyNot: 'O Firehose entrega em lotes e não serve leitores em tempo real.', concepts: ['fh.delivery'] },
            { id: 'kafka-ec2', label: 'Kafka instalado em instâncias EC2', scores: { requisitos: 0.8, desempenho: 0.9, custo: 0.4, resiliente: 0.5 }, consequence: 'Funciona, mas a equipe passa a operar o Kafka.', whyNot: 'Sem aplicações Kafka existentes, o serviço gerenciado nativo é mais simples.', concepts: ['msk.kafka'] },
          ],
        },
      ],
    },
    {
      id: 'avaliacoes',
      title: 'Análise do texto das avaliações',
      intro: 'Os clientes deixam milhares de avaliações por dia. A diretoria quer saber, por loja, se elas são positivas ou negativas.',
      questions: [
        {
          id: 'texto',
          prompt: 'Como analisar o sentimento das avaliações?',
          options: [
            { id: 'comprehend', label: 'Amazon Comprehend, em lotes, gravando o resultado no data lake', scores: { requisitos: 1, custo: 1 }, consequence: 'Sentimento pronto por API, sem treinar modelo.', concepts: ['ai.text', 'ai.ready-vs-custom'] },
            { id: 'sagemaker', label: 'Treinar um modelo de sentimento no SageMaker AI', scores: { requisitos: 0.9, custo: 0.4 }, consequence: 'Funciona, mas exige equipe, treino e hospedagem.', whyNot: 'Um serviço pronto já faz análise de sentimento.', concepts: ['ai.ready-vs-custom'] },
            { id: 'textract', label: 'Amazon Textract', scores: { requisitos: 0, custo: 0.8 }, consequence: 'O Textract extrai texto de documentos; não avalia sentimento.', whyNot: 'Sentimento de textos é o Comprehend.', concepts: ['ai.vision'] },
          ],
        },
      ],
    },
    {
      id: 'painel',
      title: 'Painel para a diretoria',
      intro: 'Diretoria e gerentes regionais querem um painel que abrem toda manhã. Os dados mudam uma vez por noite, e cada gerente só vê a própria região.',
      questions: [
        {
          id: 'dashboard',
          prompt: 'Como entregar o painel?',
          options: [
            { id: 'spice-rls', label: 'Quick Sight com SPICE atualizado toda noite e segurança por linha', scores: { requisitos: 1, desempenho: 1, custo: 1, seguro: 1 }, consequence: 'O painel é rápido, consulta o Athena uma vez por dia, e cada gerente vê a própria região.', concepts: ['quick.sight', 'quick.spice', 'quick.rls'] },
            { id: 'direta', label: 'Quick Sight em consulta direta ao Athena, com filtro de região no painel', scores: { requisitos: 0.7, desempenho: 0.4, custo: 0.3, seguro: 0.4 }, consequence: 'Cada clique consulta o Athena, e o filtro é escolha do leitor.', whyNot: 'SPICE para dados que mudam pouco; segurança por linha para restringir.', concepts: ['quick.spice', 'quick.rls'] },
            { id: 'os-dash', label: 'OpenSearch Dashboards sobre os dados de vendas', scores: { requisitos: 0.4, desempenho: 0.7, custo: 0.5, seguro: 0.7 }, consequence: 'Serve para logs e busca, não para o BI de vendas.', whyNot: 'Painéis de negócio são o caso do Quick Sight.', concepts: ['os.what', 'ana.which-tool'] },
          ],
        },
      ],
    },
  ],
  rules: [
    {
      id: 'csv-direto',
      when: [
        ['formato', ['csv']],
        ['dashboard', ['direta']],
      ],
      penalty: { custo: 0.3 },
      message: 'Painel em consulta direta sobre uma camada em CSV: cada clique lê o registro inteiro do período inteiro.',
      concepts: ['quick.spice', 'lake.columnar'],
    },
    {
      id: 'misturado-aberto',
      when: [
        ['camadas', ['um-bucket']],
        ['permissoes', ['lf-padrao', 'copias']],
      ],
      penalty: { seguro: 0.3 },
      message: 'Dados brutos com CPF misturados aos tratados, sem filtros do Lake Formation em vigor: qualquer acesso ao bucket expõe os dados pessoais.',
      concepts: ['lake.layers', 'lf.default-hybrid'],
    },
    {
      id: 'sem-bruta-sem-bookmark',
      when: [
        ['camadas', ['so-parquet']],
        ['etl', ['glue-sem-bookmark']],
      ],
      penalty: { resiliente: 0.3 },
      message: 'Sem os originais e com um job que reprocessa tudo: um erro de conversão duplica e corrompe a tabela sem caminho de volta.',
      concepts: ['lake.layers', 'glue.bookmarks'],
    },
  ],
}

export const FINAL_ANA: PhaseDef = {
  ...META.final,
  concepts: [
    'lake.what',
    'lake.layers',
    'lake.columnar',
    'lake.partitioning',
    'lake.small-files',
    'glue.etl-job',
    'glue.bookmarks',
    'glue.format-conversion',
    'glue.triggers-workflows',
    'glue.crawler',
    'athena.what',
    'athena.workgroups',
    'rs.vs-athena',
    'lf.tags',
    'lf.fine-grained',
    'lf.default-hybrid',
    'emr.spot',
    'emr.transient',
    'emr.node-types',
    'kds.streams',
    'fh.parquet',
    'fh.delivery',
    'msk.kafka',
    'ana.streaming-architecture',
    'ai.text',
    'ai.ready-vs-custom',
    'ai.vision',
    'quick.sight',
    'quick.spice',
    'quick.rls',
    'os.what',
    'ana.which-tool',
    'ana.lake-reference',
  ],
  availability: 'available',
  simplifications: ['A rubrica e os pesos das dimensões são pedagógicos, definidos pelo AWS Quest.', 'A empresa, os dados e os números são fictícios.'],
  missions: [
    {
      id: 'ana.final.plataforma',
      title: 'Plataforma de Dados das Lojas Praça Nova',
      type: 'final',
      summary: 'Oito etapas de decisões de dados, cruzadas, com relatório por dimensão.',
      passThreshold: 0.7,
      briefing: {
        company: 'Lojas Praça Nova',
        role: 'Você é a pessoa responsável pela arquitetura de dados de uma rede de 300 lojas.',
        situation: 'Vendas no banco transacional, cliques chegando sem parar, arquivos CSV de parceiros, avaliações em texto livre e uma diretoria que quer um painel único, com dados pessoais protegidos e custo sob controle.',
        objective: 'Escolher camadas, transformação, consultas, permissões, processamento, ingestão, análise de texto e painel que funcionem juntos.',
        successCriteria: ['Nota geral de 70% ou mais', 'Pelo menos 50% em cada dimensão da rubrica'],
      },
      intel: [
        { conceptId: 'ana.lake-reference', body: ['Cada peça depende das outras: o formato da camada tratada pesa no custo do painel, e as permissões só valem se a configuração padrão sair. O relatório aponta esses conflitos.'] },
        { conceptId: 'ana.streaming-architecture' },
      ],
      activities: [
        {
          id: 'ana.final.plataforma.a1',
          kind: 'lab',
          lab: 'architecture',
          title: 'Plataforma de Dados',
          prompt: 'Percorra as oito etapas e envie o projeto para receber o relatório.',
          concepts: [{ id: 'lake.layers' }, { id: 'lake.columnar' }, { id: 'glue.etl-job' }, { id: 'athena.workgroups' }, { id: 'lf.fine-grained' }, { id: 'emr.spot' }, { id: 'kds.streams' }, { id: 'ai.text' }, { id: 'quick.spice' }],
          xp: 300,
          difficulty: 3,
          reviewWeakNow: true,
          hints: ['Cada requisito do enunciado de uma etapa costuma eliminar uma ou duas opções.', 'Quando duas opções atendem, a com menos operação costuma ser a melhor.'],
          explanation: [
            'Projeto de referência: três camadas em buckets próprios, Parquet particionado por data, job do Glue com bookmarks e crawler encadeado num workflow, Athena com workgroups e limite por consulta.',
            'Lake Formation com LF-Tags e filtros de linha, sem o IAMAllowedPrincipals; EMR transitório com task em Spot; Kinesis Data Streams com o Firehose entregando Parquet; Comprehend para as avaliações; Quick Sight com SPICE e segurança por linha.',
            'Os conceitos ligados às decisões erradas entram na sua revisão imediatamente.',
          ],
          config: PRACA_NOVA,
        },
      ],
      debrief: { takeaways: ['Camadas, formato colunar e partição são a base de custo e desempenho.', 'Glue e Athena sem servidor; EMR quando o job pede controle.', 'Lake Formation só protege com a configuração padrão desligada.', 'Fluxo com Kinesis e Firehose; serviço pronto de IA antes de modelo próprio; painel com SPICE.'] },
    },
  ],
}
