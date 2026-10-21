/**
 * Escolha da solução de dados: qual serviço de análise atende a cada
 * requisito com o menor esforço.
 *
 * Conferido em 21/10/2026 (ver os modelos e conceitos das fases anteriores):
 * Athena (SQL sem servidor sobre o S3), Glue (catálogo e ETL sem servidor),
 * Lake Formation (permissões por coluna e linha), EMR (Spark e Hadoop com
 * controle do cluster), Redshift (data warehouse), OpenSearch Service (busca
 * textual e análise de logs), Quick Sight (painéis), Firehose, Kinesis Data
 * Streams e MSK (ingestão), Comprehend (texto) e SageMaker AI (modelos
 * próprios).
 */
import { choiceSolution, evaluateChoiceLab, type ChoiceCatalog, type ChoiceLabConfig, type ChoiceLabResponse } from '../shared/chooser'

export const ANA_OPTIONS: ChoiceCatalog = {
  needLabel: {
    'adhoc-sql': 'consultas SQL esporádicas sobre arquivos no S3, sem servidor',
    'daily-etl': 'transformar arquivos todos os dias sem cuidar de servidores',
    'catalog-schema': 'descobrir o esquema dos arquivos e registrar as tabelas',
    'column-security': 'esconder colunas e linhas de cada equipe no data lake',
    'hadoop-control': 'rodar Spark e HBase com configuração própria do cluster',
    'dw-dashboards': 'centenas de consultas SQL por hora sobre dados estruturados, com resposta rápida',
    'text-search': 'busca por palavras nos produtos, tolerante a erros de digitação',
    'log-analytics': 'analisar logs de aplicação quase em tempo real, com painéis',
    'bi-dashboard': 'painéis interativos para a diretoria, sem escrever código',
    'stream-to-s3': 'entregar um fluxo de eventos no S3 sem escrever consumidor',
    'stream-replay': 'vários consumidores em tempo real, com releitura dos eventos',
    'kafka-managed': 'Apache Kafka sem gerenciar servidores',
    'ready-nlp': 'sentimento das avaliações sem treinar modelo',
    'custom-ml': 'treinar e hospedar um modelo próprio',
  },
  options: {
    athena: { name: 'Amazon Athena', summary: 'SQL sem servidor sobre o S3, pago pelo dado lido.', meets: ['adhoc-sql'], limits: ['Cada consulta paga o dado lido; não é um data warehouse.'], complexity: 1 },
    glue: { name: 'AWS Glue', summary: 'Data Catalog, crawlers e jobs de ETL sem servidor.', meets: ['daily-etl', 'catalog-schema'], limits: ['Não dá controle do cluster nem roda HBase.'], complexity: 2 },
    'lake-formation': { name: 'AWS Lake Formation', summary: 'Permissões por banco, tabela, coluna e linha para todos os serviços integrados.', meets: ['column-security'], limits: ['Governa o acesso; não consulta nem transforma dados.'], complexity: 2 },
    emr: { name: 'Amazon EMR', summary: 'Clusters de Spark, Hadoop, HBase e outras ferramentas, com controle da configuração.', meets: ['hadoop-control', 'daily-etl'], limits: ['Exige dimensionar e cuidar do cluster (ou usar o EMR Serverless).'], complexity: 4 },
    redshift: { name: 'Amazon Redshift', summary: 'Data warehouse para SQL frequente e complexo sobre dados estruturados.', meets: ['dw-dashboards', 'adhoc-sql'], limits: ['Exige carregar os dados e dimensionar o warehouse.'], complexity: 4 },
    opensearch: { name: 'Amazon OpenSearch Service', summary: 'Busca textual, análise de logs e painéis com OpenSearch Dashboards.', meets: ['text-search', 'log-analytics'], limits: ['Não é o lugar para SQL analítico sobre o data lake inteiro.'], complexity: 3 },
    quick: { name: 'Amazon Quick Sight', summary: 'Painéis interativos e business intelligence, com o motor em memória SPICE.', meets: ['bi-dashboard'], limits: ['Mostra os dados; não os transforma nem os guarda como fonte.'], complexity: 2 },
    firehose: { name: 'Amazon Data Firehose', summary: 'Entrega gerenciada de fluxos no S3, no Redshift e no OpenSearch.', meets: ['stream-to-s3'], limits: ['Não guarda os eventos para releitura.'], complexity: 1.5 },
    kds: { name: 'Kinesis Data Streams', summary: 'Fluxo em shards com vários consumidores e releitura.', meets: ['stream-replay'], limits: ['Precisa de consumidores para entregar os dados.'], complexity: 3 },
    msk: { name: 'Amazon MSK', summary: 'Apache Kafka gerenciado, provisionado ou sem servidor.', meets: ['kafka-managed', 'stream-replay'], limits: ['Exige conhecer o Kafka.'], complexity: 4 },
    comprehend: { name: 'Amazon Comprehend', summary: 'Análise de texto pronta: sentimento, entidades e frases-chave.', meets: ['ready-nlp'], limits: ['Não treina modelos de outros tipos.'], complexity: 1 },
    sagemaker: { name: 'Amazon SageMaker AI', summary: 'Treinar, ajustar e hospedar modelos próprios.', meets: ['custom-ml', 'ready-nlp'], limits: ['Treinar o que um serviço pronto já faz custa tempo e equipe.'], complexity: 4 },
  },
}

export type AnaChooserLabConfig = ChoiceLabConfig
export type AnaChooserLabResponse = ChoiceLabResponse

export const anaChooserSolution = (c: AnaChooserLabConfig) => choiceSolution(ANA_OPTIONS, c)
export const evaluateAnaChooserLab = (c: AnaChooserLabConfig, r: AnaChooserLabResponse) => evaluateChoiceLab(ANA_OPTIONS, c, r)
