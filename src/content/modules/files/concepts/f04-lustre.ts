/**
 * Conceitos da Fase 4 — FSx for Lustre.
 * Fatos conferidos em 22/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F04_FIL_CONCEPTS: ConceptDef[] = [
  {
    id: 'lustre.what',
    title: 'FSx for Lustre',
    officialName: 'Amazon FSx for Lustre',
    serviceIds: ['aws.fsx'],
    summary: 'O **Lustre** é um sistema de arquivos paralelo feito para quando o armazenamento precisa acompanhar a computação: **aprendizado de máquina, HPC, processamento de vídeo e modelagem financeira**. Entrega latência abaixo de 1 ms, até vários TB/s e milhões de IOPS, para clientes **Linux** compatíveis com POSIX.',
    comparisons: [{ with: 'efs.what', text: 'O EFS serve a arquivos compartilhados de uso geral; o Lustre, a centenas de servidores lendo o mesmo conjunto de dados em paralelo, com vazão muito maior.' }],
    commonMistakes: ['Escolher Lustre para compartilhar arquivos de escritório com Windows'],
    facts: ['É montado por EC2, ECS e EKS (com o driver CSI).', 'Integra com o SageMaker AI, o AWS Batch e o AWS ParallelCluster.', 'Dados locais podem ser trazidos por Direct Connect ou VPN para processar na nuvem.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "HPC", "treinamento de ML", "processamento de vídeo" e "latência abaixo de 1 ms com vazão muito alta" em Linux. A resposta é o FSx for Lustre, em geral ligado a um bucket S3.',
    },
    references: [R.lustreWhat],
    tags: ['desempenho'],
  },
  {
    id: 'lustre.deployment',
    title: 'Scratch e persistente no Lustre',
    officialName: 'Scratch and persistent deployment types',
    serviceIds: ['aws.fsx'],
    summary: 'O **scratch** é para processamento **temporário**: os dados **não são replicados** e não persistem se um servidor falha (os arquivos dele dão erro). O **persistente** é para uso prolongado: os dados são **replicados na mesma AZ** e o servidor com falha é trocado em minutos. Há três classes: SSD, HDD e **Intelligent-Tiering**, elástica e indicada para a maioria das cargas.',
    commonMistakes: ['Guardar no scratch, por semanas, resultados que não foram exportados para o S3'],
    facts: ['O scratch tem base de 200 MBps por TiB e rajadas de até seis vezes isso.', 'No persistente com SSD ou HDD, os dados ficam numa AZ; no Intelligent-Tiering, são replicados entre AZs.', 'Quanto maior o scratch, mais servidores e maior a chance de falha: um scratch de 50 TiB é projetado para 93,9% de disponibilidade e durabilidade numa semana.'],
    recommendations: ['Scratch quando os dados também estão no S3 e o trabalho pode ser refeito; persistente quando o resultado só existe no sistema de arquivos ou a carga é longa.'],
    exam: {
      domains: ['d2', 'd4'],
      relevance: 'alta',
      notes: 'Sinais: "processamento temporário de curto prazo com o menor custo" apontam para o scratch; "dados de longa duração que precisam de replicação", para o persistente.',
    },
    references: [R.lustreDeploy],
    tags: ['durabilidade', 'custos'],
  },
  {
    id: 'lustre.s3-link',
    title: 'Lustre ligado ao S3',
    officialName: 'Data repository associations with Amazon S3',
    serviceIds: ['aws.fsx', 'aws.s3'],
    summary: 'Uma **associação com repositório de dados** liga uma pasta do Lustre a um bucket (ou prefixo) do S3: os **objetos aparecem como arquivos**, carregados quando lidos, e as mudanças podem ser **importadas** do S3 e **exportadas** de volta automaticamente. O S3 guarda os dados de forma durável; o Lustre dá o desempenho enquanto o trabalho roda.',
    commonMistakes: ['Copiar o bucket inteiro para os discos dos servidores de computação antes de cada treinamento'],
    facts: ['Cabem até 8 associações por sistema de arquivos.', 'O Scratch 1 não tem associações nem exportação automática.', 'Se o mesmo arquivo for alterado no Lustre e no S3 ao mesmo tempo, a aplicação precisa coordenar: o FSx não impede o conflito.'],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinal: "processar com alto desempenho dados guardados no S3". A resposta é o FSx for Lustre com uma associação com repositório de dados.',
    },
    references: [R.lustreS3, R.lustreWhat],
    tags: ['desempenho'],
  },
]
