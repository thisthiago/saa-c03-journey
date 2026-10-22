/**
 * Fase 2 — EFS: desempenho e custo. Modos de vazão e de desempenho, classes
 * de armazenamento, ciclo de vida e replicação.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FilesystemLabConfig } from '../../../../../simulators/filesystem/lab'
import { META } from '../meta'
import { CUSTO_CARGAS } from './workloads'

export const ATLANTICO_CUSTO: FilesystemLabConfig = { mode: 'cost', workloads: CUSTO_CARGAS }

const RENDER = CUSTO_CARGAS.find((w) => w.id === 'render')!.usage!
const BUILD = CUSTO_CARGAS.find((w) => w.id === 'build')!.usage!
const WIKI = CUSTO_CARGAS.find((w) => w.id === 'wiki')!.usage!

export const F02_FIL: PhaseDef = {
  ...META.f02,
  concepts: ['efs.throughput-modes', 'efs.performance-modes', 'efs.storage-classes', 'efs.lifecycle', 'efs.replication', 'dr.rpo-rto'],
  availability: 'available',
  simplifications: ['O grupo, as cargas e os volumes são fictícios.', 'Os custos usam a tabela da AWS Price List em us-east-1, sem nível gratuito nem impostos.', 'A vazão média e o pico resumem a carga de cada mês.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f02.m1',
      title: 'A conta da vazão',
      type: 'mission',
      summary: 'Elastic, Provisioned e Bursting, e o modo de desempenho.',
      briefing: {
        company: 'Grupo Atlântico',
        role: 'Você revisa os custos de armazenamento de um grupo com várias empresas.',
        situation: 'Todos os sistemas de arquivos do grupo foram criados com as opções padrão. A fila de renderização, que lê dezenas de TB por mês num ritmo constante, virou a maior linha da conta do EFS.',
        objective: 'Escolher o modo de vazão de cada carga pelo menor custo.',
        successCriteria: ['Entender como cada modo cobra', 'Prever o modo mais barato'],
      },
      intel: [
        { conceptId: 'efs.throughput-modes', body: ['**Elastic** (padrão) cobra por **GB lido e gravado**: ótimo para picos e cargas leves. **Provisioned** cobra a vazão fixa acima da base dada pelo armazenamento: ótimo para ritmo constante. **Bursting** não cobra a vazão, mas a base cresce com os dados na Standard (50 KiB/s por GiB) e as rajadas dependem de créditos.'] },
        { conceptId: 'efs.performance-modes', body: ['Use sempre **General Purpose**. O Max I/O é de geração anterior, tem mais latência e não existe com Elastic nem One Zone.'] },
      ],
      activities: [
        {
          id: 'fil.f02.m1.a1',
          kind: 'predict',
          title: 'A renderização',
          prompt: 'A fila de renderização guarda 500 GB, lê 60 TB e grava 20 TB por mês, com média de 30 MiB/s e picos de 40 MiB/s. Com tudo na Standard, qual modo de vazão sai mais barato?',
          concepts: [{ id: 'efs.throughput-modes' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com 80 TB por mês, o Elastic cobra por cada GB. O Bursting não aguenta a média (a base de 500 GB é de cerca de 24 MiB/s). O Provisioned cobra só os MiB/s acima da base.'],
          spec: { sim: 'efs-cost', usage: RENDER, lifecycle: 'none' },
          options: [
            { id: 'a', text: 'Provisioned', outcome: 'provisioned' },
            { id: 'b', text: 'Elastic', outcome: 'elastic' },
            { id: 'c', text: 'Bursting', outcome: 'bursting' },
          ],
        },
        {
          id: 'fil.f02.m1.a2',
          kind: 'predict',
          title: 'O cache de compilação',
          prompt: 'O cache de compilação tem 100 GB, lê 100 GB e grava 20 GB por mês, com média de 0,2 MiB/s e picos de 150 MiB/s nas compilações paralelas. Com tudo na Standard, qual modo sai mais barato?',
          concepts: [{ id: 'efs.throughput-modes' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Pouco volume e picos altos: o Elastic cobra centavos. O Bursting não chega a 150 MiB/s, e o Provisioned pagaria o pico o mês inteiro.'],
          spec: { sim: 'efs-cost', usage: BUILD, lifecycle: 'none' },
          options: [
            { id: 'a', text: 'Elastic', outcome: 'elastic' },
            { id: 'b', text: 'Provisioned', outcome: 'provisioned' },
            { id: 'c', text: 'Bursting', outcome: 'bursting' },
          ],
        },
        {
          id: 'fil.f02.m1.a3',
          kind: 'decision',
          title: 'O modo de desempenho',
          prompt: 'Um analista quer criar o próximo sistema de arquivos com Max I/O "para garantir desempenho". O que você responde?',
          concepts: [{ id: 'efs.performance-modes' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A AWS recomenda General Purpose para todos os sistemas de arquivos: o Max I/O é de geração anterior, tem mais latência e não funciona com Elastic.'],
          options: [
            { id: 'a', text: 'Usar General Purpose, o padrão recomendado, e acompanhar a métrica PercentIOLimit', correct: true, consequence: 'Menor latência e compatível com a vazão Elastic.' },
            { id: 'b', text: 'Usar Max I/O com vazão Elastic', correct: false, consequence: 'Essa combinação não existe.' },
            { id: 'c', text: 'Usar Max I/O com One Zone', correct: false, consequence: 'O One Zone sempre usa General Purpose.' },
          ],
        },
      ],
      debrief: { takeaways: ['Elastic: paga por GB; bom para picos.', 'Provisioned: ritmo constante e alto.', 'Bursting: depende do tamanho na Standard.', 'General Purpose sempre.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f02.m2',
      title: 'Arquivos parados',
      type: 'mission',
      summary: 'Classes de armazenamento e ciclo de vida.',
      briefing: {
        company: 'Grupo Atlântico',
        role: 'Você analisa o que está guardado nos sistemas de arquivos.',
        situation: 'No portal de contratos, 70% dos arquivos não são abertos há mais de 30 dias, e metade há mais de 90. Tudo está na classe Standard.',
        objective: 'Mover os arquivos frios para classes mais baratas sem estragar o desempenho de quem usa.',
        successCriteria: ['Escolher a classe de cada tipo de arquivo', 'Calcular a economia', 'Configurar o ciclo de vida'],
      },
      intel: [
        { conceptId: 'efs.storage-classes', body: ['**Standard**: dados ativos, abaixo de 1 ms. **Infrequent Access**: poucas leituras por trimestre. **Archive**: poucas por ano, só com Elastic e no mínimo 90 dias. As classes frias cobram cada GB lido.'] },
        { conceptId: 'efs.lifecycle', body: ['O **ciclo de vida** move pelo **último acesso**: IA depois de 30 dias e Archive depois de 90, por padrão. Um arquivo frio lido continua frio, a menos que você peça a volta para a Standard no primeiro acesso.'] },
      ],
      activities: [
        {
          id: 'fil.f02.m2.a1',
          kind: 'classify',
          title: 'Cada arquivo na sua classe',
          prompt: 'Indique a classe que combina com cada tipo de arquivo.',
          concepts: [{ id: 'efs.storage-classes' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Quanto menos o arquivo é lido, mais fria a classe. O Archive serve ao que é lido poucas vezes por ano.'],
          bins: [
            { id: 'std', label: 'Standard' },
            { id: 'ia', label: 'Infrequent Access' },
            { id: 'arc', label: 'Archive' },
          ],
          items: [
            { id: 'ativo', text: 'Contratos em negociação, abertos várias vezes por dia', bin: 'std', explanation: 'Dado ativo: precisa da menor latência.', concepts: ['efs.storage-classes'] },
            { id: 'trimestre', text: 'Contratos do ano, consultados no fechamento de cada trimestre', bin: 'ia', explanation: 'Poucas leituras por trimestre.', concepts: ['efs.storage-classes'] },
            { id: 'antigos', text: 'Contratos de cinco anos atrás, abertos só em auditorias', bin: 'arc', explanation: 'Poucas leituras por ano ou menos.', concepts: ['efs.storage-classes'] },
            { id: 'modelos', text: 'Modelos de contrato usados todo dia', bin: 'std', explanation: 'Leitura diária: no IA, cada leitura seria cobrada.', concepts: ['efs.storage-classes'] },
          ],
        },
        {
          id: 'fil.f02.m2.a2',
          kind: 'estimate',
          title: 'Quanto custa guardar',
          prompt: 'Um sistema de arquivos com vazão Elastic guarda 1.000 GB, todos na Standard (US$ 0,30 por GB-mês). Com o ciclo de vida, 800 GB vão para o Infrequent Access (US$ 0,016 por GB-mês com Elastic). Quanto passa a custar o armazenamento por mês, em dólares?',
          concepts: [{ id: 'efs.storage-classes' }, { id: 'efs.lifecycle', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['200 GB na Standard custam US$ 60, e 800 GB no IA custam US$ 12,80: total de US$ 72,80, contra US$ 300 antes. As leituras dos arquivos frios são cobradas à parte.'],
          scenario: ['Preços de us-east-1 na tabela da AWS Price List de 22/10/2026.'],
          unit: 'US$ por mês',
          min: 0,
          max: 300,
          step: 0.1,
          answer: 72.8,
          tolerance: 0.05,
        },
        {
          id: 'fil.f02.m2.a3',
          kind: 'decision',
          title: 'Arquivos frios que voltam',
          prompt: 'Na wiki interna, as páginas antigas esfriam, mas quando alguém volta a um assunto, abre dezenas de páginas pequenas em sequência e reclama da lentidão. O que ajustar no ciclo de vida?',
          concepts: [{ id: 'efs.lifecycle' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Com a volta para a Standard no primeiro acesso, a página lida deixa a classe fria e as próximas leituras têm a latência da Standard.'],
          options: [
            { id: 'a', text: 'Ligar a volta para a Standard no primeiro acesso', correct: true, consequence: 'A página lida volta à classe rápida, e as que ninguém lê continuam frias.' },
            { id: 'b', text: 'Desligar o ciclo de vida', correct: false, consequence: 'Resolve a lentidão, mas paga Standard por tudo o que ninguém lê.' },
            { id: 'c', text: 'Mandar as páginas antigas direto para o Archive', correct: false, consequence: 'A latência é a mesma do IA, e o Archive ainda cobra mais por leitura.' },
          ],
        },
        {
          id: 'fil.f02.m2.a4',
          kind: 'predict',
          title: 'O ciclo de vida e o Bursting',
          prompt: 'A wiki usa vazão Bursting e passou a mandar 10% dos arquivos para o Infrequent Access. Com 1.500 GB, média de 3 MiB/s e picos de 50 MiB/s, qual modo de vazão sai mais barato agora?',
          concepts: [{ id: 'efs.throughput-modes' }, { id: 'efs.lifecycle', weight: 0.5 }],
          xp: 50,
          difficulty: 3,
          explanation: ['Mesmo com menos dados na Standard, a base do Bursting continua acima da média e a rajada cobre o pico: ele não cobra a vazão. O Elastic cobraria cada GB lido e gravado.'],
          spec: { sim: 'efs-cost', usage: WIKI, lifecycle: 'ia' },
          options: [
            { id: 'a', text: 'Bursting', outcome: 'bursting' },
            { id: 'b', text: 'Elastic', outcome: 'elastic' },
            { id: 'c', text: 'Provisioned', outcome: 'provisioned' },
          ],
        },
      ],
      debrief: { takeaways: ['IA para poucas leituras por trimestre; Archive para poucas por ano, só com Elastic.', 'Leitura nas classes frias é cobrada.', 'Mover para o IA reduz a base do Bursting.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f02.m3',
      title: 'A Região de reserva',
      type: 'mission',
      summary: 'Replicação do EFS e o RPO.',
      briefing: {
        company: 'Grupo Atlântico',
        role: 'Você prepara a recuperação de desastres do portal de contratos.',
        situation: 'O portal de contratos precisa voltar em outra Região se a Região principal ficar fora, perdendo no máximo 30 minutos de documentos.',
        objective: 'Escolher como manter uma cópia em outra Região e entender o que ela não protege.',
        successCriteria: ['Cumprir o RPO de 30 minutos', 'Separar replicação de backup'],
      },
      intel: [
        { conceptId: 'efs.replication', body: ['A **replicação** do EFS copia os dados continuamente para outra Região, com **RPO de 15 minutos** na maioria dos casos. No desastre, você faz o failover para a réplica.'] },
        { conceptId: 'dr.rpo-rto' },
      ],
      activities: [
        {
          id: 'fil.f02.m3.a1',
          kind: 'decision',
          title: 'Perder no máximo 30 minutos',
          prompt: 'O portal pode perder no máximo 30 minutos de documentos se a Região principal ficar fora. O que configurar?',
          concepts: [{ id: 'efs.replication' }, { id: 'dr.rpo-rto' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A replicação do EFS mantém a réplica com atraso de até 15 minutos na maioria dos sistemas de arquivos, dentro do RPO pedido.'],
          options: [
            { id: 'a', text: 'Replicação do EFS para outra Região', correct: true, consequence: 'A réplica fica no máximo cerca de 15 minutos atrás, e o failover é feito para ela.' },
            { id: 'b', text: 'Backup diário com cópia para outra Região', correct: false, consequence: 'O RPO seria de até um dia.' },
            { id: 'c', text: 'Mudar o sistema de arquivos para One Zone em outra Região', correct: false, consequence: 'Muda o lugar, não cria uma segunda cópia.' },
          ],
        },
        {
          id: 'fil.f02.m3.a2',
          kind: 'decision',
          title: 'O contrato apagado',
          prompt: 'Um funcionário apagou por engano a pasta de contratos de 2024. Uma hora depois, alguém sugere recuperar a pasta pela réplica na outra Região. Funciona?',
          concepts: [{ id: 'efs.replication' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A replicação copia também as exclusões. Contra erros e exclusões, o que protege é um backup, com pontos de recuperação de antes do erro.'],
          options: [
            { id: 'a', text: 'Não: a exclusão já foi replicada; é preciso restaurar de um backup', correct: true, consequence: 'Replicação é para desastre; backup é para voltar no tempo.' },
            { id: 'b', text: 'Sim: a réplica guarda as versões antigas', correct: false, consequence: 'A réplica só segue a origem.' },
            { id: 'c', text: 'Sim, se o failover for feito em menos de 15 minutos', correct: false, consequence: 'Mesmo assim, a réplica não é uma versão antiga controlada.' },
          ],
        },
      ],
      debrief: { takeaways: ['Replicação do EFS: outra Região, RPO de cerca de 15 minutos.', 'Replicação não é backup: exclusões também são copiadas.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f02.boss',
      title: 'A conta do Grupo Atlântico',
      type: 'boss',
      summary: 'Vazão e ciclo de vida de quatro sistemas de arquivos.',
      briefing: {
        company: 'Grupo Atlântico',
        role: 'Você apresenta à diretoria o plano de redução de custos do EFS.',
        situation: 'Quatro sistemas de arquivos, quatro jeitos de usar: picos imprevisíveis, ritmo constante, muita coisa parada e arquivos pequenos relidos o tempo todo.',
        objective: 'Escolher o modo de vazão e o ciclo de vida mais baratos que atendem a cada carga.',
        successCriteria: ['Todos os sistemas de arquivos atendem à carga', 'Nenhum paga mais do que precisa'],
      },
      intel: [{ conceptId: 'efs.throughput-modes', body: ['Combine as duas escolhas: o Archive só existe com Elastic, o IA é mais barato com Elastic, e mandar dados para o IA diminui a base do Bursting e do Provisioned.'] }],
      activities: [
        {
          id: 'fil.f02.boss.a1',
          kind: 'lab',
          lab: 'filesystem',
          title: 'Quatro contas de EFS',
          prompt: 'Para cada sistema de arquivos, escolha o modo de vazão e o ciclo de vida. O custo da sua escolha aparece acima dos cartões.',
          concepts: [{ id: 'efs.throughput-modes' }, { id: 'efs.lifecycle' }, { id: 'efs.storage-classes' }],
          xp: 250,
          difficulty: 3,
          hints: ['Compare quanto cada carga lê e grava por mês com a vazão de que ela precisa.', 'Se os arquivos frios são relidos muitas vezes, o IA pode sair mais caro.'],
          explanation: ['Portal de contratos: Elastic com IA e Archive. Renderização: Provisioned, tudo na Standard. Wiki: Bursting com IA. Cache de compilação: Elastic, tudo na Standard.'],
          config: ATLANTICO_CUSTO,
        },
      ],
      debrief: { takeaways: ['Muito volume em ritmo constante pede Provisioned.', 'Picos com pouco volume pedem Elastic.', 'O ciclo de vida compensa quando os arquivos frios quase não são relidos.'] },
    },
  ],
}
