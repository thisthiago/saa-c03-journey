/**
 * Fase 5 — Processamento com EMR. O que o EMR faz, os nós primário, core e
 * task, Spot em cada tipo de nó, cluster transitório ou de longa duração, EMR
 * Serverless e EMR no EKS, e a escolha entre EMR, Glue e Athena.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { EmrLabConfig } from '../../../../../simulators/emr/lab'
import type { EmrJob } from '../../../../../simulators/emr/model'
import { META } from '../meta'

export const FATURAMENTO: EmrJob = {
  id: 'faturamento',
  name: 'Faturamento da madrugada',
  description: 'Calcula a conta de luz de 2 milhões de clientes a partir das leituras dos medidores. O Spark guarda **dados intermediários no HDFS** entre as etapas.',
  batches: 96,
  deadlineHours: 6,
  usesHdfs: true,
  spotEvent: { atHour: 1, share: 0.5 },
  instanceType: 'm7g.xlarge',
  maxCore: 8,
  maxTask: 24,
  concepts: ['emr.node-types', 'emr.spot'],
}

const PERDAS: EmrJob = {
  id: 'perdas',
  name: 'Modelo de perdas na rede',
  description: 'Estima onde a rede perde energia. O job **lê e grava direto no S3**, sem depender do HDFS, e pode terminar até as 8h.',
  batches: 60,
  deadlineHours: 8,
  usesHdfs: false,
  spotEvent: { atHour: 1, share: 0.5 },
  instanceType: 'm7g.xlarge',
  maxCore: 8,
  maxTask: 16,
  concepts: ['emr.spot', 'emr.node-types'],
}

const OUVIDORIA: EmrJob = {
  id: 'ouvidoria',
  name: 'Painel da ouvidoria',
  description: 'Alimenta as tabelas do HBase que a ouvidoria consulta de manhã. O job guarda dados no HDFS, e a regulação exige que o cluster **não pare se um nó primário falhar**.',
  batches: 30,
  deadlineHours: 4,
  usesHdfs: true,
  needsHa: true,
  spotEvent: { atHour: 1, share: 0.5 },
  instanceType: 'm7g.xlarge',
  maxCore: 8,
  maxTask: 12,
  concepts: ['emr.node-types'],
}

export const VOLT_NORTE_EMR: EmrLabConfig = { jobs: [FATURAMENTO, PERDAS, OUVIDORIA] }

const OD = (count: number) => ({ count, spot: false })
const SPOT = (count: number) => ({ count, spot: true })

export const F05_ANA: PhaseDef = {
  ...META.f05,
  concepts: ['emr.what', 'emr.node-types', 'emr.spot', 'emr.transient', 'emr.serverless-eks', 'emr.vs-glue-athena'],
  availability: 'available',
  simplifications: [
    'Cada nó processa um lote por hora; a retomada de instâncias Spot acontece uma vez, na hora indicada em cada job.',
    'O preço é o On-Demand da tabela da trilha de Computação, com o desconto do Spot como premissa; a taxa do EMR fica fora.',
    'Distribuidora, jobs e volumes são fictícios.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'ana.f05.m1',
      title: 'Um cluster para a madrugada',
      type: 'mission',
      summary: 'O que o EMR faz e quando ele é a escolha certa no lugar do Glue ou do Athena.',
      briefing: {
        company: 'Distribuidora de Energia Volt Norte',
        role: 'Você cuida do processamento de dados de uma distribuidora de energia.',
        situation: 'Os medidores inteligentes mandam leituras a cada 15 minutos. Toda madrugada, um processamento em Spark calcula as contas, e outro alimenta tabelas do HBase para a ouvidoria. Hoje, tudo roda em servidores próprios que vão ser desligados.',
        objective: 'Escolher onde rodar cada processamento.',
        successCriteria: ['Saber o que o EMR oferece', 'Diferenciar EMR, Glue e Athena'],
      },
      intel: [
        { conceptId: 'emr.what', body: ['O **EMR** cria clusters de Spark, Hadoop, Hive, HBase e outras ferramentas. A AWS sobe as instâncias e instala tudo; a equipe controla a configuração. Os dados podem ficar no S3, e o HDFS do cluster some quando ele termina.'] },
        { conceptId: 'emr.vs-glue-athena', body: ['Athena para SQL sob demanda; Glue para ETL sem servidor; EMR quando é preciso controlar o cluster ou usar ferramentas como HBase e Presto.'] },
      ],
      activities: [
        {
          id: 'ana.f05.m1.a1',
          kind: 'decision',
          title: 'As tabelas do HBase',
          prompt: 'O processamento da ouvidoria grava em tabelas do HBase e usa configurações próprias do Spark. Onde ele roda?',
          concepts: [{ id: 'emr.what' }, { id: 'emr.vs-glue-athena' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O HBase e o ajuste fino do Spark pedem um cluster que a equipe controla. O EMR oferece isso; o Glue e o Athena, não.'],
          options: [
            { id: 'a', text: 'Num cluster do EMR', correct: true, consequence: 'O HBase roda no cluster, com a configuração que a equipe precisa.' },
            { id: 'b', text: 'Num job do Glue', correct: false, consequence: 'O Glue roda Spark gerenciado, sem HBase nem controle do cluster.' },
            { id: 'c', text: 'Em consultas do Athena', correct: false, consequence: 'O Athena responde SQL; não roda HBase.' },
          ],
        },
        {
          id: 'ana.f05.m1.a2',
          kind: 'classify',
          title: 'Athena, Glue ou EMR',
          prompt: 'Classifique cada necessidade pelo serviço com menos operação que a atende.',
          concepts: [{ id: 'emr.vs-glue-athena' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Consulta SQL pontual: Athena. Transformação recorrente sem servidor: Glue. Controle do cluster e ferramentas do ecossistema Hadoop: EMR.'],
          bins: [
            { id: 'athena', label: 'Athena' },
            { id: 'glue', label: 'Glue' },
            { id: 'emr', label: 'EMR' },
          ],
          items: [
            { id: 'sql', text: 'Saber quantas leituras faltaram ontem, uma vez', bin: 'athena', explanation: 'Uma consulta SQL resolve.', concepts: ['emr.vs-glue-athena'] },
            { id: 'etl', text: 'Converter as leituras do dia em Parquet, sem cuidar de servidores', bin: 'glue', explanation: 'ETL recorrente sem servidor.', concepts: ['emr.vs-glue-athena'] },
            { id: 'hbase', text: 'Manter tabelas do HBase consultadas pela ouvidoria', bin: 'emr', explanation: 'O HBase roda no cluster do EMR.', concepts: ['emr.vs-glue-athena'] },
            { id: 'tuning', text: 'Rodar o Spark com uma versão e um ajuste de memória específicos', bin: 'emr', explanation: 'Controle do cluster e das aplicações.', concepts: ['emr.vs-glue-athena'] },
          ],
        },
      ],
      debrief: { takeaways: ['EMR: Spark, Hadoop, HBase e outras ferramentas, com controle do cluster.', 'Athena para SQL sob demanda; Glue para ETL sem servidor; EMR para o resto.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f05.m2',
      title: 'Quem pode cair',
      type: 'mission',
      summary: 'Os três tipos de nó e o que acontece quando cada um some numa retomada de Spot.',
      briefing: {
        company: 'Distribuidora de Energia Volt Norte',
        role: 'Você define onde usar instâncias Spot no cluster.',
        situation: 'O financeiro quer o cluster do faturamento todo em Spot, para economizar. O faturamento guarda dados intermediários no HDFS e precisa terminar até as 6h. Na pior noite do mês, a AWS retoma metade das instâncias Spot de cada grupo depois de 1 hora.',
        objective: 'Prever o efeito da retomada em cada tipo de nó.',
        successCriteria: ['Prever a perda do primário', 'Prever a perda do HDFS', 'Saber onde o Spot é seguro'],
      },
      intel: [
        { conceptId: 'emr.node-types', body: ['**Primário**: coordena; sem ele, o cluster termina. **Core**: processa e guarda o HDFS. **Task**: só processa.'] },
        { conceptId: 'emr.spot', body: ['Para dados críticos, a AWS recomenda primário e core On-Demand e task em Spot. Perder um nó task não perde dados.'] },
      ],
      activities: [
        {
          id: 'ana.f05.m2.a1',
          kind: 'predict',
          title: 'O primário em Spot',
          prompt: 'O faturamento roda com 1 primário em Spot, 4 core On-Demand e 8 task On-Demand. O que acontece na retomada?',
          concepts: [{ id: 'emr.node-types' }, { id: 'emr.spot', weight: 0.5 }],
          xp: 40,
          difficulty: 2,
          explanation: ['O nó primário coordena o cluster. Quando ele é retomado, o cluster termina, e o job inteiro se perde.'],
          spec: { sim: 'emr', job: FATURAMENTO, cluster: { primary: SPOT(1), core: OD(4), task: OD(8) } },
          options: [
            { id: 'a', text: 'O cluster termina, e o job se perde', outcome: 'cluster-ended' },
            { id: 'b', text: 'O job continua nos nós core e task e termina no prazo', outcome: 'ok' },
            { id: 'c', text: 'O job continua, mas termina atrasado', outcome: 'late' },
          ],
        },
        {
          id: 'ana.f05.m2.a2',
          kind: 'predict',
          title: 'O core em Spot',
          prompt: 'Agora: 1 primário On-Demand, 4 core em Spot e 8 task On-Demand. O faturamento guarda dados no HDFS. O que acontece na retomada?',
          concepts: [{ id: 'emr.node-types' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Os nós core guardam o HDFS. Com metade deles retomada, parte dos dados intermediários some, e o job falha.'],
          spec: { sim: 'emr', job: FATURAMENTO, cluster: { primary: OD(1), core: SPOT(4), task: OD(8) } },
          options: [
            { id: 'a', text: 'Perde dados do HDFS, e o job falha', outcome: 'hdfs-lost' },
            { id: 'b', text: 'Só fica mais lento', outcome: 'late' },
            { id: 'c', text: 'Termina no prazo', outcome: 'ok' },
          ],
        },
        {
          id: 'ana.f05.m2.a3',
          kind: 'predict',
          title: 'O task em Spot',
          prompt: 'Por fim: 1 primário e 4 core On-Demand, mais 16 task em Spot. São 96 lotes e prazo de 6 horas. O que acontece?',
          concepts: [{ id: 'emr.spot' }, { id: 'emr.node-types', weight: 0.5 }],
          xp: 40,
          difficulty: 3,
          explanation: ['Na primeira hora, 20 nós processam 20 lotes. Depois da retomada, sobram 12 nós para 76 lotes: mais 6,3 horas. O job termina sem perder dados, mas depois do prazo; faltam nós task.'],
          spec: { sim: 'emr', job: FATURAMENTO, cluster: { primary: OD(1), core: OD(4), task: SPOT(16) } },
          options: [
            { id: 'a', text: 'Termina sem perder dados, mas depois do prazo', outcome: 'late' },
            { id: 'b', text: 'Termina no prazo', outcome: 'ok' },
            { id: 'c', text: 'Perde dados do HDFS', outcome: 'hdfs-lost' },
          ],
        },
      ],
      debrief: { takeaways: ['Primário em Spot: a retomada termina o cluster.', 'Core em Spot com HDFS: a retomada perde dados.', 'Task em Spot: só perde capacidade; dimensione com folga.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f05.m3',
      title: 'Sem cluster para cuidar',
      type: 'mission',
      summary: 'Cluster transitório ou de longa duração, EMR Serverless e EMR no EKS.',
      briefing: {
        company: 'Distribuidora de Energia Volt Norte',
        role: 'Você reduz o custo e o trabalho de operar os clusters.',
        situation: 'O cluster do faturamento fica ligado 24 horas, mas trabalha 5. Um time novo quer rodar Spark sem aprender a dimensionar clusters. E a equipe de plataforma já mantém um cluster Kubernetes no EKS para os outros sistemas.',
        objective: 'Escolher o modelo de execução certo para cada caso.',
        successCriteria: ['Usar cluster transitório', 'Conhecer EMR Serverless e EMR no EKS'],
      },
      intel: [
        { conceptId: 'emr.transient', body: ['O cluster **transitório** sobe, roda os passos e termina sozinho. O de **longa duração** fica ligado e cobrando. Com os dados no S3, terminar o cluster não perde nada.'] },
        { conceptId: 'emr.serverless-eks', body: ['O **EMR Serverless** roda Spark e Hive sem cluster para configurar. O **EMR no EKS** roda as aplicações do EMR num cluster Kubernetes que a empresa já tem.'] },
      ],
      activities: [
        {
          id: 'ana.f05.m3.a1',
          kind: 'decision',
          title: 'Cinco horas de trabalho, 24 de cobrança',
          prompt: 'O cluster do faturamento trabalha das 0h às 5h e fica ocioso o resto do dia. As entradas e saídas estão no S3. Como reduzir o custo?',
          concepts: [{ id: 'emr.transient' }],
          xp: 50,
          difficulty: 1,
          explanation: ['Um cluster transitório sobe à meia-noite, roda os passos e termina. Como os dados estão no S3, nada se perde quando ele some.'],
          options: [
            { id: 'a', text: 'Criar um cluster transitório toda noite, que termina depois do último passo', correct: true, consequence: 'Paga só as horas de trabalho.' },
            { id: 'b', text: 'Manter o cluster e reduzir o número de nós durante o dia', correct: false, consequence: 'Reduz, mas continua pagando o primário e os core parados.' },
            { id: 'c', text: 'Ligar a proteção contra término', correct: false, consequence: 'Protege contra desligamento acidental; não reduz custo.' },
          ],
        },
        {
          id: 'ana.f05.m3.a2',
          kind: 'decision',
          title: 'O time que não quer dimensionar',
          prompt: 'Um time novo quer rodar jobs Spark esporádicos sem escolher tipos de instância nem número de nós. O que oferecer?',
          concepts: [{ id: 'emr.serverless-eks' }],
          xp: 50,
          difficulty: 2,
          explanation: ['O EMR Serverless aloca os recursos de cada job e os libera no fim, sem cluster para configurar.'],
          options: [
            { id: 'a', text: 'O EMR Serverless', correct: true, consequence: 'O time envia o job, e o serviço cuida da capacidade.' },
            { id: 'b', text: 'Um cluster do EMR de longa duração só para eles', correct: false, consequence: 'Exige dimensionar e paga o cluster parado.' },
            { id: 'c', text: 'O EMR no EKS, criando um cluster Kubernetes novo', correct: false, consequence: 'Faz sentido para quem já tem EKS; aqui, só acrescenta operação.' },
          ],
        },
        {
          id: 'ana.f05.m3.a3',
          kind: 'decision',
          title: 'Quem já tem Kubernetes',
          prompt: 'A equipe de plataforma já opera um cluster EKS com folga de recursos e quer rodar os jobs Spark do EMR nele, junto com os outros sistemas. O que usar?',
          concepts: [{ id: 'emr.serverless-eks' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O EMR no EKS roda as aplicações do EMR num cluster Kubernetes existente, aproveitando os recursos e as ferramentas que a equipe já usa.'],
          options: [
            { id: 'a', text: 'O EMR no EKS', correct: true, consequence: 'Os jobs rodam no cluster que a equipe já opera.' },
            { id: 'b', text: 'Um cluster do EMR separado', correct: false, consequence: 'Funciona, mas deixa ociosa a capacidade do EKS.' },
          ],
        },
      ],
      debrief: { takeaways: ['Cluster transitório: paga só as horas de trabalho.', 'EMR Serverless: Spark sem cluster para dimensionar.', 'EMR no EKS: para quem já opera Kubernetes.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'ana.f05.boss',
      title: 'A pior noite do mês',
      type: 'boss',
      summary: 'Três jobs, uma retomada de Spot e um prazo para cada um.',
      briefing: {
        company: 'Distribuidora de Energia Volt Norte',
        role: 'Você monta os clusters da madrugada.',
        situation: 'Faturamento, modelo de perdas e painel da ouvidoria rodam em clusters transitórios. Na pior noite do mês, a AWS retoma metade das instâncias Spot de cada grupo depois de 1 hora, sem reposição.',
        objective: 'Montar o cluster de cada job para terminar no prazo, pelo menor custo.',
        successCriteria: ['Todos os jobs terminam no prazo', 'Menor custo em cada job'],
      },
      intel: [
        { conceptId: 'emr.spot', body: ['Spot onde a retomada não perde dados nem termina o cluster. Para compensar a capacidade perdida, mais nós task.'] },
        { conceptId: 'emr.node-types', body: ['O job que não guarda nada no HDFS não perde dados com core em Spot, mas ainda precisa do primário de pé.'] },
      ],
      activities: [
        {
          id: 'ana.f05.boss.a1',
          kind: 'lab',
          lab: 'emr',
          title: 'Três clusters',
          prompt: 'Para cada job, escolha quantos nós de cada tipo e quais ficam em Spot. O quadro mostra, ao vivo, o tempo, o resultado e o custo da noite.',
          concepts: [{ id: 'emr.node-types' }, { id: 'emr.spot' }],
          xp: 200,
          difficulty: 3,
          hints: ['O primário em Spot nunca sobrevive à retomada.', 'O modelo de perdas não usa o HDFS; a ouvidoria precisa de três primários.'],
          explanation: [
            'Faturamento: primário e core On-Demand, com nós task em Spot suficientes para terminar no prazo depois da retomada.',
            'Modelo de perdas: sem HDFS, os nós core também podem ficar em Spot; só o primário fica On-Demand.',
            'Ouvidoria: três primários On-Demand, core On-Demand por causa do HDFS e o restante em nós task.',
          ],
          config: VOLT_NORTE_EMR,
        },
      ],
      debrief: { takeaways: ['Primário sempre On-Demand quando o job não pode se perder.', 'Core em Spot só sem dados importantes no HDFS.', 'Task em Spot, com folga para a retomada.'] },
    },
  ],
}
