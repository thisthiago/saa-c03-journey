/**
 * Conceitos da Fase 2 — EFS: desempenho e custo.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F02_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'efs.throughput-modes',
    title: 'Modos de vazão do EFS',
    officialName: 'Elastic, Provisioned and Bursting throughput',
    serviceIds: ['aws.efs'],
    summary: '**Elastic** (padrão e recomendado) escala sozinho e cobra por **GB lido e gravado**: serve a cargas com picos imprevisíveis ou média de até 5% do pico. **Provisioned** fixa uma vazão e cobra o que passa da base dada pelo armazenamento: serve a cargas constantes e conhecidas. **Bursting** cresce com o tamanho na classe **Standard**: base de 50 KiB/s por GiB e rajadas com créditos.',
    facts: [
      'No Bursting, a rajada vai a 100 MiB/s por TiB na Standard, com mínimo de 100 MiB/s; sem créditos, a vazão cai para a base.',
      'A base do Bursting conta só os dados na classe Standard: mover arquivos para o Infrequent Access reduz a base.',
      'Depois de mudar para Provisioned ou alterar a vazão provisionada, é preciso esperar 24 horas para voltar a Elastic ou Bursting ou para reduzir o valor.',
    ],
    recommendations: ['Comece com Elastic; passe para Provisioned quando a carga for constante e a vazão Elastic sair cara.'],
    commonMistakes: ['Ficar no Bursting com um sistema de arquivos pequeno e muito lido, até os créditos acabarem', 'Pagar Elastic por uma carga que lê dezenas de TB por mês num ritmo constante'],
    exam: { domains: ['d3', 'd4'], relevance: 'alta' },
    references: [R.efsPerformance],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'efs.performance-modes',
    title: 'Modos de desempenho do EFS',
    officialName: 'General Purpose and Max I/O performance modes',
    serviceIds: ['aws.efs'],
    summary: '**General Purpose** é o padrão e tem a **menor latência** por operação; a AWS recomenda usá-lo sempre. **Max I/O** é de geração anterior, feito para cargas muito paralelas que toleram mais latência, e **não existe** com One Zone nem com vazão Elastic.',
    facts: ['A métrica PercentIOLimit do CloudWatch mostra se um sistema de arquivos General Purpose está perto do limite de IOPS.', 'As IOPS não são cobradas à parte: entram na conta da vazão.'],
    commonMistakes: ['Escolher Max I/O achando que é sempre mais rápido'],
    exam: { domains: ['d3'], relevance: 'baixa' },
    references: [R.efsPerformance],
    tags: ['desempenho'],
  },
  {
    id: 'efs.storage-classes',
    title: 'Classes de armazenamento do EFS',
    officialName: 'EFS Standard, Infrequent Access and Archive',
    serviceIds: ['aws.efs'],
    summary: '**Standard** (SSD) é para dados ativos, com latência abaixo de 1 ms. **Infrequent Access (IA)** é para dados lidos poucas vezes por trimestre, e **Archive**, poucas vezes por ano, as duas com latência de dezenas de milissegundos e **cobrança por GB lido**. Nas classes frias, cada arquivo é cobrado como no mínimo **128 KiB**.',
    facts: ['O Archive só existe com vazão Elastic e cobra no mínimo 90 dias de armazenamento.', 'Na tabela de preços, o IA custa menos com vazão Elastic do que com Bursting ou Provisioned.', 'Os metadados (nomes, donos, diretórios) ficam sempre na Standard.'],
    commonMistakes: ['Mandar para o IA arquivos que são relidos toda semana e pagar mais em leituras do que economiza em armazenamento'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.efsFeatures],
    tags: ['custos'],
  },
  {
    id: 'efs.lifecycle',
    title: 'Ciclo de vida do EFS',
    officialName: 'EFS lifecycle management',
    serviceIds: ['aws.efs'],
    summary: 'O **ciclo de vida** move os arquivos conforme o **último acesso**: para o IA (padrão: 30 dias sem acesso), para o Archive (padrão: 90 dias) e, se você pedir, de volta para a Standard **no primeiro acesso**. Por padrão, um arquivo frio lido continua frio. A política vale para o sistema de arquivos inteiro.',
    facts: ['Gravações em arquivos frios vão primeiro para a Standard e podem voltar a esfriar depois de 24 horas.', 'Listar um diretório não conta como acesso aos arquivos.'],
    comparisons: [{ with: 'efs.storage-classes', text: 'As classes são onde o dado fica; o ciclo de vida é a regra que o move entre elas.' }],
    recommendations: ['Para aplicações sensíveis à latência com muitos arquivos pequenos, use a volta para a Standard no primeiro acesso.'],
    commonMistakes: ['Esperar que o ciclo de vida do EFS mova arquivos para o S3 Glacier'],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.efsLifecycle],
    tags: ['custos'],
  },
  {
    id: 'efs.replication',
    title: 'Replicação do EFS',
    officialName: 'EFS replication',
    serviceIds: ['aws.efs'],
    summary: 'A **replicação** mantém uma cópia do sistema de arquivos em outra Região (ou na mesma), sincronizada continuamente, com **RPO de 15 minutos** para a maioria dos sistemas de arquivos. Num desastre, você faz o **failover** para a réplica e, depois, o failback.',
    facts: ['A cópia não é consistente num ponto no tempo: vale o que foi sincronizado até o último sync.', 'Sistemas de arquivos com mais de 100 milhões de arquivos ou arquivos acima de 100 GB que mudam muito podem passar dos 15 minutos.', 'A replicação também serve para criar uma cópia criptografada de um sistema de arquivos que nasceu sem criptografia.'],
    comparisons: [{ with: 'dr.rpo-rto', text: 'A replicação dá RPO de minutos; um backup diário dá RPO de até um dia.' }],
    commonMistakes: ['Tratar a réplica como backup: uma exclusão na origem também é replicada'],
    exam: { domains: ['d2'], relevance: 'media' },
    references: [R.efsReplication],
    tags: ['recuperacao'],
  },
]
