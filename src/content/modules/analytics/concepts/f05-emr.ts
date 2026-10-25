/**
 * Conceitos da Fase 5 — Processamento com EMR.
 * Fatos conferidos em 21/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F05_ANA_CONCEPTS: ConceptDef[] = [
  {
    id: 'emr.what',
    title: 'Amazon EMR',
    officialName: 'Amazon EMR',
    serviceIds: ['aws.emr', 'aws.ec2'],
    summary: 'O **EMR** roda clusters gerenciados de **Apache Spark, Hadoop, Hive, HBase, Presto** e outras ferramentas de big data. A AWS cria as instâncias e instala o software, e a equipe controla a configuração do cluster e das aplicações.',
    explanation: [
      'Exemplo: uma empresa migra um cluster Hadoop local com jobs Spark e tabelas Hive. No EMR, os jobs rodam com poucas mudanças, os dados ficam no S3 e o cluster pode ser desligado ao fim de cada processamento.',
    ],
    facts: ['O cluster lê e grava direto no S3; a partir da versão 7.10.0, o EMR usa o conector S3A (antes, o EMRFS).', 'O HDFS do cluster é rápido, mas efêmero: some quando o cluster termina.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'As tarefas 3.2 e 3.5 do exame citam o EMR. Sinais: "Spark, Hadoop, Hive ou HBase", "migrar um cluster Hadoop local" e "controle das configurações do cluster". A resposta é o EMR; para ETL sem gerenciar cluster, o Glue.',
    },
    references: [R.emrWhat, R.emrStorage],
    tags: ['desempenho'],
  },
  {
    id: 'emr.node-types',
    title: 'Nós primário, core e task',
    officialName: 'Amazon EMR node types',
    serviceIds: ['aws.emr'],
    summary: 'O nó **primário** coordena o cluster: se ele termina, o cluster termina. Os nós **core** processam e guardam o **HDFS**: perdê-los arrisca perder dados. Os nós **task** só processam, sem HDFS: perdê-los só reduz a capacidade.',
    commonMistakes: ['Pôr os nós core em Spot num job que guarda dados intermediários no HDFS'],
    facts: ['Desde a versão 5.23.0, o cluster pode ter três nós primários, e o primário deixa de ser ponto único de falha.', 'O cluster tem um grupo de nós core, e nós task podem entrar e sair durante a execução.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Questões de custo e resiliência do EMR pedem o papel de cada nó: o primário mantém o cluster vivo, o core guarda o HDFS e o task só processa. O Spot é seguro nos nós task.',
    },
    references: [R.emrNodes, R.emrHa],
    tags: ['disponibilidade'],
  },
  {
    id: 'emr.spot',
    title: 'Spot no EMR',
    officialName: 'Spot Instances in Amazon EMR',
    serviceIds: ['aws.emr', 'aws.ec2'],
    summary: 'A AWS recomenda, para cargas com dados críticos, **primário e core On-Demand** e **task em Spot**: a retomada de um nó task não perde dados, e o EMR mantém os processos de controle dos jobs nos nós core para o job não falhar. Tudo em Spot só cabe quando o custo importa mais que uma parada súbita.',
    facts: [
      'Se o nó primário em Spot for retomado, o cluster termina.',
      'Para trocar o primário ou os core entre On-Demand e Spot, é preciso criar outro cluster; nós task podem ser adicionados com outra opção.',
      'Clusters de longa duração: primário On-Demand, core On-Demand ou misto, task em Spot ou misto.',
    ],
    exam: { domains: ['d4'], relevance: 'alta' },
    references: [R.emrSpot],
    tags: ['custos'],
  },
  {
    id: 'emr.transient',
    title: 'Cluster transitório ou de longa duração',
    officialName: 'Transient and long-running clusters',
    serviceIds: ['aws.emr'],
    summary: 'O cluster **transitório** sobe, roda os passos e **termina sozinho**, e só cobra enquanto existe. O de **longa duração** fica ligado, aceitando trabalho e cobrando, e serve a consultas interativas ou a processamentos tão frequentes que não compensa recriar o cluster.',
    commonMistakes: ['Deixar ligado o fim de semana inteiro um cluster que só roda o job da madrugada'],
    facts: ['Por padrão, o cluster criado pelo console ou pela CLI é de longa duração.', 'Com os dados no S3, o cluster transitório não perde nada ao terminar.', 'O managed scaling ajusta o número de nós do cluster conforme a carga.'],
    exam: {
      domains: ['d4'],
      relevance: 'media',
      notes: 'Sinal: "job em lote que roda uma vez por dia". A resposta é um cluster transitório, que termina ao fim dos passos, com os dados no S3.',
    },
    references: [R.emrTransient, R.emrScaling],
    tags: ['custos'],
  },
  {
    id: 'emr.serverless-eks',
    title: 'EMR Serverless e EMR no EKS',
    officialName: 'Amazon EMR Serverless and Amazon EMR on EKS',
    serviceIds: ['aws.emr', 'aws.eks'],
    summary: 'O **EMR Serverless** roda Spark e Hive **sem cluster** para configurar: ele aloca os recursos de cada job e os libera no fim. O **EMR no EKS** roda as aplicações do EMR num cluster Kubernetes que a empresa já usa, ao lado de outras cargas.',
    facts: ['No EMR Serverless, os recursos podem ser pré-inicializados para respostas em segundos.', 'O EMR no EKS permite versões diferentes das ferramentas no mesmo cluster Kubernetes.'],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Sinais: "rodar Spark sem gerenciar cluster" aponta para o EMR Serverless; "aproveitar o cluster Kubernetes que já existe", para o EMR no EKS.',
    },
    references: [R.emrServerless, R.emrEks],
    tags: ['desempenho'],
  },
  {
    id: 'emr.vs-glue-athena',
    title: 'EMR, Glue ou Athena',
    officialName: 'Choosing between Amazon EMR, AWS Glue and Amazon Athena',
    serviceIds: ['aws.emr', 'aws.glue', 'aws.athena'],
    summary: 'O **Athena** responde a consultas SQL sob demanda. O **Glue** faz ETL sem servidor, com Spark gerenciado. O **EMR** entra quando é preciso **controlar o cluster**, usar ferramentas do ecossistema Hadoop (HBase, Presto, Hive) ou ajustar o Spark a fundo.',
    recommendations: ['Comece pelo serviço com menos operação que atende: Athena para consultas, Glue para ETL; o EMR fica para o que exige controle do cluster.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Questões de processamento comparam os três pela necessidade de controle: SQL sob demanda (Athena), ETL sem servidor (Glue) e cluster configurável com o ecossistema Hadoop (EMR).',
    },
    references: [R.emrWhat, R.glueWhat, R.athenaWhat],
    tags: ['desempenho'],
  },
]
