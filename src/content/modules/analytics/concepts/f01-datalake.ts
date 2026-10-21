/**
 * Conceitos da Fase 1 — Data lake no S3.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F01_ANA_CONCEPTS: ConceptDef[] = [
  {
    id: 'lake.what',
    title: 'Data lake',
    officialName: 'Data lake',
    serviceIds: ['aws.s3', 'aws.athena', 'aws.glue'],
    summary: 'O **data lake** é um repositório central que guarda **todos os dados** da empresa, estruturados ou não, **no formato original**, sem definir a estrutura antes. Na AWS, o armazenamento é o **S3**, e cada ferramenta (consulta, processamento, aprendizado de máquina) lê os dados ali mesmo, separando computação e armazenamento.',
    facts: [
      'O data lake recebe dados de muitas fontes no formato original; a estrutura (o esquema) é definida na hora de ler.',
      'O data warehouse é um banco otimizado para consultas SQL sobre dados relacionais, com o esquema definido antes de gravar.',
      'A AWS diz que muitas empresas precisam dos dois, porque atendem a necessidades diferentes.',
    ],
    comparisons: [{ with: 'rs.what', text: 'O Redshift é o data warehouse: esquema definido antes, dados limpos e consultas SQL rápidas. O data lake guarda tudo no S3, inclusive o que ainda não tem uso definido.' }],
    commonMistakes: ['Achar que data lake e data warehouse são concorrentes e que a empresa precisa escolher só um'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.dataLake],
    tags: ['fundamentos'],
  },
  {
    id: 'lake.layers',
    title: 'Camadas do data lake',
    officialName: 'Data lake layers (raw, stage, analytics)',
    serviceIds: ['aws.s3', 'aws.glue'],
    summary: 'A AWS recomenda pelo menos **três camadas**, cada uma num **bucket próprio**: a **bruta** recebe os dados como chegam, de preferência no formato original e com versionamento; a **tratada** guarda os dados validados e convertidos (por exemplo, de CSV para Parquet); a **de consumo** guarda os dados agregados, prontos para cada uso.',
    facts: [
      'Com dados pessoais, a recomendação inclui mais um bucket de chegada, onde os dados são mascarados antes da camada bruta.',
      'Cada camada pode ter a própria regra de ciclo de vida; a sugestão da AWS para a camada bruta é ir para o S3 Standard-IA depois de um ano e para o Glacier depois de mais dois.',
      'Na camada tratada, um job do Glue costuma ler a camada bruta, validar, gravar em Parquet e registrar a tabela no Data Catalog.',
    ],
    commonMistakes: ['Converter e apagar os arquivos originais: sem a camada bruta, não há como reprocessar quando a regra de transformação muda'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.dataLayers],
    tags: ['fundamentos', 'custos'],
  },
  {
    id: 'lake.columnar',
    title: 'Formatos em linha e em coluna',
    officialName: 'Columnar storage formats (Apache Parquet and ORC)',
    serviceIds: ['aws.athena', 'aws.glue'],
    summary: 'CSV e JSON guardam **um registro depois do outro**: para ler uma coluna, a consulta lê o arquivo inteiro. **Parquet** e **ORC** guardam **coluna por coluna**: a consulta lê **só as colunas que usa**, comprime melhor e pula blocos usando os valores mínimo e máximo guardados no arquivo.',
    facts: [
      'Parquet e ORC permitem dividir a leitura de um arquivo entre vários leitores.',
      'O ORC costuma gerar arquivos menores; o Parquet atende a uma variedade maior de consultas complexas.',
      'A conversão de CSV ou JSON para Parquet ou ORC pode ser feita por um job do Glue ou por uma consulta CREATE TABLE AS SELECT (CTAS) no Athena.',
      'Com arquivos muito pequenos, o custo extra do formato colunar supera a vantagem.',
    ],
    commonMistakes: ['Guardar em JSON uma tabela consultada sempre pelas mesmas três colunas'],
    exam: { domains: ['d3', 'd4'], relevance: 'alta', notes: 'A tarefa 3.5 do exame cita a conversão de CSV para Parquet.' },
    references: [R.columnar, R.optimizeData],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'lake.compression',
    title: 'Compressão dos arquivos',
    officialName: 'Data compression for analytics',
    serviceIds: ['aws.athena', 'aws.s3'],
    summary: 'Comprimir os arquivos reduz o que o S3 guarda e o que o Athena lê. Como o Athena cobra **os bytes lidos antes de descomprimir**, um arquivo três vezes menor custa um terço por consulta. **GZIP** comprime bem; **ZSTD** equilibra velocidade e compressão; **Snappy** prioriza a velocidade.',
    facts: [
      'No exemplo da página de preços do Athena, 3 TB em texto custam US$ 15 por consulta; com GZIP 3:1, US$ 5.',
      'Arquivos de texto comprimidos (CSV, JSON), em geral, não podem ser lidos em paralelo: um leitor por arquivo.',
      'Para CSV e JSON, o Athena descobre a compressão pela extensão do arquivo (por exemplo, .gz).',
      'O Athena não lê arquivos .zip.',
    ],
    commonMistakes: ['Juntar todo o dia num único CSV com GZIP de vários GB: a consulta não consegue dividir a leitura'],
    exam: { domains: ['d3', 'd4'], relevance: 'media' },
    references: [R.compression, R.optimizeData, R.athenaPricing],
    tags: ['custos', 'desempenho'],
  },
  {
    id: 'lake.partitioning',
    title: 'Partições',
    officialName: 'Data partitioning',
    serviceIds: ['aws.athena', 'aws.s3', 'aws.glue'],
    summary: 'A **partição** divide a tabela em pastas por valores de uma chave, como `ano=2026/mes=10/dia=21/`. Quando a consulta filtra pela chave no **WHERE**, o Athena lê **só as pastas escolhidas**. A chave certa é a que as consultas mais usam no filtro, em geral a data.',
    facts: [
      'O formato de pastas chave=valor é o do Hive; outros formatos também funcionam, com as partições adicionadas uma a uma.',
      'Partição que a consulta não usa no filtro não reduz nada: a consulta lê a tabela inteira.',
      'Partições demais fragmentam a tabela em arquivos pequenos demais; de menos, fazem a consulta ler mais que o necessário.',
      'Sem partição, consultas sobre buckets com muitos objetos podem esbarrar no limite de requisições do S3.',
    ],
    commonMistakes: ['Particionar por hora uma tabela consultada sempre por mês', 'Particionar por uma coluna que nenhuma consulta usa no filtro'],
    exam: { domains: ['d3', 'd4'], relevance: 'alta' },
    references: [R.partitions, R.optimizeData],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'lake.small-files',
    title: 'Arquivos pequenos demais',
    officialName: 'Avoid having too many files',
    serviceIds: ['aws.athena', 'aws.s3'],
    summary: 'Muitos arquivos pequenos deixam a consulta lenta: o Athena lista cada partição e abre cada arquivo, e cada abertura tem um custo fixo. É mais rápido ler um arquivo grande que os mesmos registros espalhados em milhares de arquivos.',
    facts: [
      'O tamanho padrão do grupo de linhas do Parquet é 128 MB, e o da faixa do ORC é 64 MB; a documentação não recomenda reduzir esses valores.',
      'Mais de 1.000 arquivos numa partição piora a listagem, que traz até 1.000 objetos por vez.',
      'A saída é juntar arquivos (compactação) ou particionar menos.',
    ],
    commonMistakes: ['Gravar um arquivo por evento no data lake e consultar direto, sem juntar'],
    exam: { domains: ['d3'], relevance: 'media' },
    references: [R.optimizeData],
    tags: ['desempenho'],
  },
]
