/**
 * Conceitos da Fase 3 — EBS e instance store.
 * Fatos conferidos em 20/10/2026 (ver docs/VERIFICACAO-DE-CONTEUDO.md).
 */
import type { ConceptDef } from '../../../../engine/types'
import { R } from './refs'

export const F03_CMP_CONCEPTS: ConceptDef[] = [
  {
    id: 'ebs.volume',
    title: 'Volume EBS',
    officialName: 'Amazon EBS volumes',
    serviceIds: ['aws.ebs', 'aws.ec2'],
    summary: 'Um **disco em blocos** durável que você anexa a uma instância. Ele **existe independente da instância**, fica numa **Zona de Disponibilidade** e só pode ser anexado a instâncias da mesma AZ. Tamanho, tipo e IOPS podem ser alterados com o volume em uso.',
    explanation: [
      'Pense num HD externo ligado por rede à instância: se a instância é desligada ou substituída, o disco continua lá e pode ser ligado a outra. O limite da comparação: o volume só pode ser anexado a instâncias da mesma AZ; para levá-lo a outra AZ, é preciso um snapshot.',
      'Exemplo: uma instância com o banco de dados num volume EBS é encerrada por engano. Se o volume de dados estava configurado para não ser apagado no encerramento, ele continua disponível e pode ser anexado a uma instância nova na mesma AZ.',
      '**Regra prática:** o EBS é o disco persistente de uma instância numa AZ; para dados compartilhados entre AZs, use outro serviço.',
    ],
    comparisons: [
      { with: 'ec2.instance-store', text: 'O instance store é mais rápido e vem incluído no preço, mas os dados se perdem no stop. O EBS persiste e pode mudar de instância.' },
    ],
    facts: [
      'Uma instância pode ter vários volumes EBS.',
      'Com Elastic Volumes, você muda o tipo, o tamanho, os IOPS e o throughput de um volume atual sem interromper a instância.',
      'A AWS não faz backup automático dos volumes: criar snapshots é responsabilidade do cliente.',
    ],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'alta',
      notes: 'Sinais: "armazenamento persistente para uma instância", "volume de boot" e "banco de dados no EC2". O EBS é zonal: questões que exigem que instâncias de várias AZs acessem os mesmos dados apontam para o EFS.',
    },
    references: [R.ebsVolumes, R.ebsSnapshots],
    tags: ['durabilidade'],
  },
  {
    id: 'ebs.gp3',
    title: 'gp3',
    officialName: 'General Purpose SSD (gp3)',
    serviceIds: ['aws.ebs'],
    summary: 'O SSD de uso geral atual e o **SSD mais barato** do EBS. Entrega **3.000 IOPS e 125 MiB/s** inclusos em qualquer tamanho; acima disso, você paga IOPS (até 80.000) e throughput (até 2.000 MiB/s) **sem precisar aumentar o disco**.',
    facts: [
      'Até 500 IOPS por GiB e 0,25 MiB/s por IOPS provisionado.',
      'De 1 GiB a 64 TiB.',
      'O preço por GiB é 20% menor que o do gp2, e o gp3 não usa burst: sustenta o desempenho provisionado o tempo todo.',
    ],
    recommendations: ['A AWS recomenda volumes de uso geral para a maioria das cargas: comece pelo gp3 e só passe para io2 se precisar de latência abaixo de 1 ms ou de mais desempenho.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'alta',
      notes: 'Na maioria das questões de EBS, o gp3 é o ponto de partida. Ele vence o gp2 quando o requisito é ter mais IOPS sem pagar por um disco maior, e perde para o io2 quando a carga exige latência abaixo de 1 ms, durabilidade maior ou mais de 80.000 IOPS.',
    },
    references: [R.ebsGeneral, R.ebsTypes],
    tags: ['desempenho', 'custos'],
  },
  {
    id: 'ebs.gp2',
    title: 'gp2 e os créditos de I/O',
    officialName: 'General Purpose SSD (gp2)',
    serviceIds: ['aws.ebs'],
    summary: 'No gp2, o desempenho **cresce com o tamanho**: **3 IOPS por GiB**, mínimo de 100 e máximo de 16.000. Volumes abaixo de 1 TiB fazem **burst** até 3.000 IOPS gastando **créditos de I/O**; quando eles acabam, o volume volta à baseline.',
    commonMistakes: ['Aumentar um gp2 só para ganhar IOPS, quando um gp3 entrega os IOPS sem crescer o disco'],
    facts: [
      'Cada volume começa com 5,4 milhões de créditos, o bastante para 3.000 IOPS por pelo menos 30 minutos.',
      'A métrica BurstBalance do CloudWatch mostra quantos créditos restam.',
      'Throughput de 128 MiB/s até 170 GiB e de 250 MiB/s a partir de 334 GiB.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'media',
      notes: 'Se um volume gp2 fica lento depois de um período de carga alta, a causa provável é o fim dos créditos de I/O (BurstBalance em zero). A correção econômica costuma ser migrar para o gp3 com os IOPS necessários.',
    },
    references: [R.ebsGeneral],
    tags: ['desempenho'],
  },
  {
    id: 'ebs.io2',
    title: 'io2 Block Express e io1',
    officialName: 'Provisioned IOPS SSD (io2 Block Express and io1)',
    serviceIds: ['aws.ebs'],
    summary: 'SSDs de **IOPS provisionado** para bancos críticos. O **io2 Block Express** vai a **256.000 IOPS** (1.000 por GiB), 4.000 MiB/s e latência média abaixo de 500 µs, com **durabilidade de 99,999%**. O io1, mais antigo, vai a 64.000 IOPS (50 por GiB).',
    useCases: ['Oracle, SAP HANA, SQL Server e outros bancos que precisam de latência baixa e constante'],
    facts: [
      'Desde 30/04/2025, todo volume io2 é io2 Block Express.',
      'Os 256.000 IOPS exigem instâncias Nitro; nas outras, o limite prático é 32.000.',
      'Os IOPS provisionados do io2 são cobrados por faixa: até 32.000, de 32.001 a 64.000 e acima.',
    ],
    exam: {
      domains: ['d3'],
      relevance: 'alta',
      notes: 'Sinais: "banco de dados crítico", "latência abaixo de 1 ms", "mais de 80.000 IOPS" ou "durabilidade de 99,999%". A resposta é o io2 Block Express; para o resto, o gp3.',
    },
    references: [R.ebsPiops],
    tags: ['desempenho', 'durabilidade'],
  },
  {
    id: 'ebs.hdd',
    title: 'st1 e sc1 (HDD)',
    officialName: 'Throughput Optimized HDD (st1) and Cold HDD (sc1)',
    serviceIds: ['aws.ebs'],
    summary: 'Volumes **HDD** para leitura sequencial em blocos grandes, onde o que importa é **throughput**, não IOPS. **st1** (até 500 MiB/s) serve a big data, data warehouse e logs; **sc1** (até 250 MiB/s) é o mais barato, para dados pouco acessados. **Nenhum serve de volume de boot.**',
    facts: ['De 125 GiB a 16 TiB.', 'Máximo de 500 IOPS (st1) e 250 IOPS (sc1), medidos com operações de 1 MiB.'],
    exam: {
      domains: ['d3', 'd4'],
      relevance: 'media',
      notes: 'Sinais: "processamento sequencial de arquivos grandes", "big data" ou "logs" com foco em custo apontam para o st1; "dados acessados raramente" com o menor custo, para o sc1. Se o volume precisa ser de boot ou ter muitos IOPS, HDD não serve.',
    },
    references: [R.ebsHdd, R.ebsTypes],
    tags: ['custos'],
  },
  {
    id: 'ebs.performance',
    title: 'IOPS × throughput',
    officialName: 'Amazon EBS volume performance',
    serviceIds: ['aws.ebs'],
    summary: '**IOPS** é o número de operações de leitura e escrita por segundo: pesa em bancos com muitas operações pequenas. **Throughput** é o volume de dados por segundo (MiB/s): pesa em leituras sequenciais longas. Escolha o tipo pela métrica que limita a carga.',
    explanation: [
      'Exemplo: um banco transacional faz milhares de leituras pequenas por segundo, e o limite é o IOPS. Um job que lê arquivos de 1 GB do início ao fim é limitado pelo throughput.',
    ],
    facts: ['SSDs são otimizados para operações pequenas e frequentes (IOPS); HDDs, para fluxos grandes e sequenciais (throughput).'],
    exam: { domains: ['d3'], relevance: 'alta' },
    references: [R.ebsTypes],
    tags: ['desempenho'],
  },
  {
    id: 'ebs.multi-attach',
    title: 'Multi-Attach',
    officialName: 'Amazon EBS Multi-Attach',
    serviceIds: ['aws.ebs'],
    summary: 'Anexa um volume **io1 ou io2** a **até 16 instâncias Nitro da mesma AZ**, todas com leitura e escrita. A aplicação precisa coordenar as escritas (um **sistema de arquivos de cluster**): XFS e EXT4 comuns não foram feitos para isso.',
    commonMistakes: ['Usar Multi-Attach como um compartilhamento de arquivos entre servidores web; para isso, use um sistema de arquivos compartilhado como o EFS'],
    facts: ['Volumes com Multi-Attach não podem ser volume de boot.', 'Não há cobrança extra pelo Multi-Attach.', 'Instâncias Windows só aceitam Multi-Attach com io2.'],
    exam: {
      domains: ['d2', 'd3'],
      relevance: 'media',
      notes: 'Sinal: "aplicação em cluster que coordena as escritas num disco compartilhado", na mesma AZ. Para compartilhar arquivos entre servidores comuns, a resposta é o EFS.',
    },
    references: [R.ebsMulti],
    tags: ['disponibilidade'],
  },
  {
    id: 'ebs.snapshots',
    title: 'Snapshots do EBS',
    officialName: 'Amazon EBS snapshots',
    serviceIds: ['aws.ebs'],
    summary: 'Cópias **pontuais e incrementais** de um volume: só os blocos que mudaram desde o último snapshot são gravados. Ficam no S3 (em buckets que você não acessa), replicados entre as AZs da Região, e restauram um volume novo **em qualquer AZ da Região**. Podem ser copiados para outra Região.',
    explanation: [
      'Exemplo: para mover um volume de us-east-1a para us-east-1b, crie um snapshot e restaure um volume novo em us-east-1b. Para levá-lo a outra Região, copie antes o snapshot para lá.',
    ],
    useCases: ['Backup e recuperação', 'Levar um volume para outra AZ ou Região', 'Criar AMIs'],
    facts: [
      'Como os snapshots são incrementais, apagar um deles pode não reduzir o custo: os blocos que outros snapshots usam continuam guardados.',
      'O Amazon Data Lifecycle Manager e o AWS Backup automatizam a criação de snapshots.',
      'Copiar um snapshot e cifrá-lo com outra chave do KMS gera uma cópia completa, não incremental.',
    ],
    exam: {
      domains: ['d2'],
      relevance: 'alta',
      notes: 'Sinais: "backup de volumes EBS", "levar o volume para outra AZ" e "recuperação em outra Região", que pede a cópia do snapshot. Para automatizar a criação e a retenção, a resposta é o Data Lifecycle Manager ou o AWS Backup.',
    },
    references: [R.ebsSnapshots, R.ebsEncryptionDefault],
    tags: ['recuperacao', 'durabilidade'],
  },
  {
    id: 'ebs.encryption',
    title: 'Criptografia do EBS',
    officialName: 'Amazon EBS encryption',
    serviceIds: ['aws.ebs', 'aws.kms'],
    summary: 'Volumes e snapshots podem ser cifrados com o KMS (a chave gerenciada `aws/ebs` ou uma sua). A **criptografia por padrão** é uma configuração **por Região** da conta: ligada, todo volume novo e toda cópia de snapshot saem cifrados.',
    facts: [
      'A criptografia por padrão não muda volumes e snapshots que já existem.',
      'Não dá para trocar a chave de um volume ou snapshot cifrado; dá para escolher outra chave ao copiar o snapshot.',
      'Para cifrar um volume existente: snapshot, cópia cifrada do snapshot e um volume novo a partir dela.',
    ],
    exam: {
      domains: ['d1'],
      relevance: 'alta',
      notes: 'Sinal: "garantir que todos os volumes novos sejam criptografados". A resposta é a criptografia por padrão do EBS, ligada em cada Região. Para cifrar um volume que já existe, o caminho é snapshot, cópia cifrada e volume novo.',
    },
    references: [R.ebsEncryptionDefault],
    tags: ['seguranca'],
  },
]
