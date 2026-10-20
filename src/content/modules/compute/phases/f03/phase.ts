/**
 * Fase 3 — EBS e instance store. Escolher o volume pela métrica que limita a
 * carga e pelo preço, protegê-lo com snapshots e criptografia, e saber quando
 * o disco local da instância basta.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { VolumesLabConfig } from '../../../../../simulators/ebs/lab'
import { META } from '../meta'
import { EBS_OPTIONS } from '../shared'

const VOLUMES: VolumesLabConfig = {
  workloads: [
    { id: 'boot', name: 'Volume de boot do servidor web', description: 'Sistema operacional e aplicação. Pouco acesso a disco depois do boot.', need: { minGiB: 30, iops: 1000, throughput: 50, boot: true }, concepts: ['ebs.gp3'] },
    { id: 'db', name: 'Banco PostgreSQL de pedidos', description: 'Muitas operações pequenas de leitura e escrita o dia inteiro.', need: { minGiB: 500, iops: 12000, throughput: 300 }, concepts: ['ebs.gp3', 'ebs.performance'] },
    { id: 'logs', name: 'Processamento de logs', description: 'Arquivos grandes lidos do começo ao fim, uma vez por hora.', need: { minGiB: 4000, iops: 200, throughput: 400 }, concepts: ['ebs.hdd', 'ebs.performance'] },
    { id: 'arquivo', name: 'Arquivo de digitalizações antigas', description: 'Consultado poucas vezes por mês, sempre em leituras sequenciais.', need: { minGiB: 8000, iops: 50, throughput: 100 }, concepts: ['ebs.hdd'] },
    { id: 'sap', name: 'ERP crítico', description: 'O banco do ERP não pode perder dados e precisa de latência baixa e constante.', need: { minGiB: 1000, iops: 40000, throughput: 1000, highDurability: true }, concepts: ['ebs.io2'] },
  ],
}

export const F03_CMP: PhaseDef = {
  ...META.f03,
  concepts: ['ebs.volume', 'ebs.gp3', 'ebs.gp2', 'ebs.io2', 'ebs.hdd', 'ebs.performance', 'ebs.multi-attach', 'ebs.snapshots', 'ebs.encryption', 'ec2.instance-store'],
  availability: 'available',
  simplifications: [
    'Custos com o preço por mês da AWS Price List em us-east-1: armazenamento, IOPS e throughput provisionados, sem snapshots nem transferência.',
    'st1 e sc1 entregam o throughput máximo do tipo em qualquer tamanho, e o burst do gp2 não conta no desempenho.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f03.m1',
      title: 'Que disco é esse?',
      type: 'mission',
      summary: 'SSD ou HDD, IOPS ou throughput: os tipos de volume e o que cada um entrega.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você cuida da infraestrutura de um hospital que está levando seus sistemas para a AWS.',
        situation: 'O fornecedor do sistema de prontuários pediu "o disco mais rápido que existir" para tudo. A diretora financeira quer saber se é mesmo necessário.',
        objective: 'Escolher o tipo de volume pela métrica que limita cada carga.',
        successCriteria: ['Classificar cada carga num tipo de volume', 'Prever se uma configuração é aceita', 'Saber quando migrar de gp2 para gp3'],
      },
      intel: [
        { conceptId: 'ebs.volume', visual: 'ebs-types', body: ['O **volume EBS** é um disco em blocos que existe independente da instância. Ele fica numa AZ e só se anexa a instâncias da mesma AZ. Tipo, tamanho e IOPS mudam com o volume em uso.'] },
        { conceptId: 'ebs.performance', body: ['**IOPS**: operações por segundo, o que pesa em bancos. **Throughput**: MiB por segundo, o que pesa em leituras longas e sequenciais. SSDs (gp3, io2) são feitos para IOPS; HDDs (st1, sc1), para throughput.'] },
        { conceptId: 'ebs.gp3', body: ['**gp3**: o SSD mais barato, com **3.000 IOPS e 125 MiB/s** inclusos em qualquer tamanho. Dá para provisionar mais IOPS (até 500 por GiB) e throughput (até 0,25 MiB/s por IOPS) sem aumentar o disco.'] },
        { conceptId: 'ebs.io2', body: ['**io2 Block Express**: até 256.000 IOPS, latência abaixo de 500 µs e **durabilidade de 99,999%**, para bancos críticos. Vai a 1.000 IOPS por GiB.'] },
        { conceptId: 'ebs.hdd', body: ['**st1** e **sc1** são HDDs para dados grandes e sequenciais. O sc1 é o mais barato. Nenhum dos dois serve de volume de boot.'] },
      ],
      activities: [
        {
          id: 'cmp.f03.m1.a1',
          kind: 'classify',
          title: 'Cada carga no seu disco',
          prompt: 'Classifique cada carga do hospital no tipo de volume mais adequado.',
          concepts: [{ id: 'ebs.performance' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Para a maioria das cargas, gp3. Para bancos críticos com latência baixa e constante, io2. Para leituras sequenciais grandes, st1. Para dados frios ao menor custo, sc1.'],
          bins: [
            { id: 'gp3', label: 'gp3' },
            { id: 'io2', label: 'io2 Block Express' },
            { id: 'st1', label: 'st1' },
            { id: 'sc1', label: 'sc1' },
          ],
          items: [
            { id: 'boot', text: 'Volume de boot dos servidores do portal', bin: 'gp3', explanation: 'Volumes de boot pedem SSD; o gp3 é o mais barato.', concepts: ['ebs.gp3'] },
            { id: 'intranet', text: 'Banco pequeno da intranet, com uso moderado', bin: 'gp3', explanation: 'Os 3.000 IOPS inclusos do gp3 bastam.', concepts: ['ebs.gp3'] },
            { id: 'pront', text: 'Banco Oracle dos prontuários, crítico e sensível a latência', bin: 'io2', explanation: 'io2: latência abaixo de 500 µs e 99,999% de durabilidade.', concepts: ['ebs.io2', 'ebs.performance'] },
            { id: 'pacs', text: 'Leitura sequencial de lotes de exames de imagem para análise', bin: 'st1', explanation: 'Throughput alto em leitura sequencial: st1.', concepts: ['ebs.hdd', 'ebs.performance'] },
            { id: 'antigo', text: 'Cópia de exames de 15 anos atrás, lida uma vez por ano', bin: 'sc1', explanation: 'Dado frio e sequencial: sc1, o volume mais barato.', concepts: ['ebs.hdd'] },
          ],
        },
        {
          id: 'cmp.f03.m1.a2',
          kind: 'predict',
          title: 'O pedido do fornecedor',
          prompt: 'O fornecedor quer um **gp3 de 20 GiB com 12.000 IOPS** para um índice de busca. A AWS aceita essa configuração?',
          concepts: [{ id: 'ebs.gp3' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O gp3 aceita até 500 IOPS por GiB. Com 20 GiB, o máximo é 10.000 IOPS. Para 12.000, o volume precisa de pelo menos 24 GiB.'],
          spec: { sim: 'ebs', volume: { type: 'gp3', sizeGiB: 20, iops: 12000, throughput: 125 }, need: { minGiB: 20, iops: 12000, throughput: 100 } },
          options: EBS_OPTIONS,
        },
        {
          id: 'cmp.f03.m1.a3',
          kind: 'predict',
          title: 'O gp2 herdado',
          prompt: 'Um sistema antigo usa um **gp2 de 500 GiB** e precisa de **3.000 IOPS** constantes. O volume atende?',
          concepts: [{ id: 'ebs.gp2' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O gp2 entrega 3 IOPS por GiB: 500 GiB dão 1.500 IOPS de baseline. O burst até 3.000 dura só enquanto houver créditos de I/O.'],
          spec: { sim: 'ebs', volume: { type: 'gp2', sizeGiB: 500 }, need: { minGiB: 500, iops: 3000, throughput: 100 } },
          options: EBS_OPTIONS,
        },
        {
          id: 'cmp.f03.m1.a4',
          kind: 'predict',
          title: 'Boot no disco barato',
          prompt: 'Para economizar, alguém propôs um **st1 de 500 GiB** como volume de boot de um servidor. Atende?',
          concepts: [{ id: 'ebs.hdd' }],
          xp: 30,
          difficulty: 1,
          explanation: ['st1 e sc1 não servem de volume de boot. Volumes de boot ficam em SSD.'],
          spec: { sim: 'ebs', volume: { type: 'st1', sizeGiB: 500 }, need: { minGiB: 30, iops: 100, throughput: 50, boot: true } },
          options: EBS_OPTIONS,
        },
        {
          id: 'cmp.f03.m1.a5',
          kind: 'decision',
          title: 'Trocar sem desligar',
          prompt: 'O hospital tem 40 volumes gp2 em produção. Como passar para gp3 e economizar?',
          concepts: [{ id: 'ebs.volume' }, { id: 'ebs.gp3', weight: 0.5 }],
          xp: 30,
          difficulty: 2,
          explanation: ['Com Elastic Volumes, o tipo do volume muda com a instância rodando. O gp3 custa 20% menos por GiB e entrega 3.000 IOPS em qualquer tamanho.'],
          options: [
            { id: 'a', text: 'Modificar o tipo de cada volume para gp3 com Elastic Volumes, sem parar as instâncias', correct: true, consequence: 'A troca acontece em produção, sem janela de manutenção.' },
            { id: 'b', text: 'Parar cada instância, fazer snapshot, criar um gp3 e trocar o disco', correct: false, consequence: 'Funciona, mas com parada e trabalho desnecessários.' },
            { id: 'c', text: 'Não dá: o tipo de um volume é fixo depois de criado', correct: false, consequence: 'Volumes atuais aceitam mudança de tipo, tamanho e IOPS em uso.' },
          ],
        },
      ],
      debrief: { takeaways: ['Escolha pela métrica que limita: IOPS para bancos, throughput para leitura sequencial.', 'gp3 é o padrão: 3.000 IOPS e 125 MiB/s em qualquer tamanho.', 'HDD nunca é boot.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f03.m2',
      title: 'Disco certo, preço certo',
      type: 'mission',
      summary: 'Configure tipo, tamanho, IOPS e throughput de cada volume pelo menor custo que atende.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você continua na infraestrutura do hospital.',
        situation: 'Você ganhou a discussão: nada de "o disco mais rápido para tudo". Agora a diretora quer ver o desenho de cada volume com o custo mensal.',
        objective: 'Configurar cinco volumes que atendem às cargas pelo menor custo.',
        successCriteria: ['Nenhuma carga sem os IOPS e o throughput que pede', 'Custo o mais perto possível do mínimo'],
      },
      intel: [
        { conceptId: 'ebs.gp3', body: ['No **gp3**, IOPS acima de 3.000 e throughput acima de 125 MiB/s são cobrados à parte. Para o throughput, são necessários IOPS suficientes: até 0,25 MiB/s por IOPS.'] },
        { conceptId: 'ebs.io2', body: ['No **io2**, você paga o GiB e cada IOPS provisionado. Ele se justifica quando a carga pede latência abaixo de 1 ms ou a durabilidade de 99,999%.'] },
        { conceptId: 'ebs.hdd', body: ['**st1** e **sc1** cobram só o GiB, a partir de 125 GiB. Para volumes grandes e sequenciais, costumam ser os mais baratos.'] },
      ],
      activities: [
        {
          id: 'cmp.f03.m2.a1',
          kind: 'lab',
          lab: 'volumes',
          title: 'Cinco volumes para o hospital',
          prompt: 'Configure um volume para cada carga. Os preços mudam conforme você ajusta tamanho, IOPS e throughput.',
          concepts: [{ id: 'ebs.gp3' }, { id: 'ebs.io2', weight: 0.5 }, { id: 'ebs.hdd', weight: 0.5 }, { id: 'ebs.performance', weight: 0.5 }],
          xp: 110,
          difficulty: 3,
          explanation: ['gp3 com os IOPS e o throughput provisionados atende à maioria das cargas pelo menor preço. io2 fica para o que é crítico. HDDs ganham em volumes grandes e sequenciais.'],
          config: VOLUMES,
        },
      ],
      debrief: { takeaways: ['No gp3, desempenho se compra sem aumentar o disco.', 'io2 quando a latência ou a durabilidade justificam o preço.', 'HDD barateia dados grandes e sequenciais.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f03.m3',
      title: 'Cópias e cadeados',
      type: 'mission',
      summary: 'Snapshots, criptografia, Multi-Attach e o lugar do instance store.',
      briefing: {
        company: 'Hospital Vida Plena',
        role: 'Você continua na infraestrutura do hospital.',
        situation: 'A auditoria pediu três coisas: backup dos volumes, todos os discos cifrados e um plano para subir o sistema em outra Região. O fornecedor ainda quer um disco compartilhado por dois servidores.',
        objective: 'Proteger os volumes e saber o que cada recurso faz.',
        successCriteria: ['Ordenar a cópia de um volume para outra Região', 'Cifrar um volume que não era cifrado', 'Saber quando Multi-Attach serve'],
      },
      intel: [
        { conceptId: 'ebs.snapshots', body: ['O **snapshot** é uma cópia incremental do volume: grava só os blocos que mudaram. Fica no S3, em buckets que você não acessa, e restaura um volume em qualquer AZ da Região. Pode ser copiado para outra Região. A AWS não faz backup automático: crie snapshots.'] },
        { conceptId: 'ebs.encryption', body: ['A **criptografia por padrão** é ligada por Região: a partir dela, todo volume novo e toda cópia de snapshot saem cifrados. Volumes antigos continuam como estavam: para cifrá-los, snapshot, cópia cifrada e volume novo.'] },
        { conceptId: 'ebs.multi-attach', body: ['**Multi-Attach**: um io1 ou io2 anexado a até 16 instâncias Nitro da mesma AZ. A aplicação precisa de um sistema de arquivos de cluster para coordenar as escritas. Não serve de boot.'] },
        { conceptId: 'ec2.instance-store', body: ['O **instance store** é o disco local da instância: rápido, incluído no preço e temporário. Serve para cache e para dados replicados em outros nós.'] },
      ],
      activities: [
        {
          id: 'cmp.f03.m3.a1',
          kind: 'order',
          title: 'O banco em outra Região',
          prompt: 'Ordene os passos para ter uma cópia do volume do banco, cifrada, numa instância de outra Região.',
          concepts: [{ id: 'ebs.snapshots' }, { id: 'ebs.encryption', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['O snapshot captura o volume; a cópia leva o snapshot para a outra Região (e pode cifrá-lo com uma chave de lá); o volume novo nasce do snapshot numa AZ da Região de destino e é anexado a uma instância na mesma AZ.'],
          steps: [
            { id: 's1', text: 'Criar um snapshot do volume do banco', explanation: 'O snapshot é a cópia pontual do volume.' },
            { id: 's2', text: 'Copiar o snapshot para a outra Região, cifrando com uma chave do KMS de lá', explanation: 'A cópia leva o snapshot para outra Região e pode escolher a chave.' },
            { id: 's3', text: 'Criar um volume a partir do snapshot copiado, numa AZ da Região de destino', explanation: 'O snapshot restaura em qualquer AZ da Região.' },
            { id: 's4', text: 'Anexar o volume a uma instância na mesma AZ', explanation: 'Volume e instância precisam estar na mesma AZ.' },
          ],
        },
        {
          id: 'cmp.f03.m3.a2',
          kind: 'classify',
          title: 'Verdade sobre snapshots',
          prompt: 'Classifique cada afirmação.',
          concepts: [{ id: 'ebs.snapshots' }],
          xp: 50,
          difficulty: 2,
          explanation: ['Snapshots são incrementais, ficam no S3 sem acesso direto pelo console do S3, restauram em qualquer AZ da Região e não são criados automaticamente pela AWS.'],
          bins: [
            { id: 'true', label: 'Correta' },
            { id: 'false', label: 'Incorreta' },
          ],
          items: [
            { id: 'inc', text: 'Cada snapshot grava só os blocos que mudaram desde o anterior', bin: 'true', explanation: 'Snapshots são incrementais.', concepts: ['ebs.snapshots'] },
            { id: 'az', text: 'O volume restaurado precisa ficar na mesma AZ do volume original', bin: 'false', explanation: 'O snapshot restaura em qualquer AZ da Região.', concepts: ['ebs.snapshots'] },
            { id: 's3', text: 'Os snapshots aparecem como objetos num bucket do S3 da conta', bin: 'false', explanation: 'Ficam no S3, mas em buckets que você não acessa; você os gerencia pelo EC2.', concepts: ['ebs.snapshots'] },
            { id: 'auto', text: 'A AWS cria snapshots dos volumes automaticamente todos os dias', bin: 'false', explanation: 'Backup dos volumes é responsabilidade do cliente; o Data Lifecycle Manager ou o AWS Backup automatizam.', concepts: ['ebs.snapshots'] },
            { id: 'del', text: 'Apagar um snapshot antigo pode não reduzir o custo de armazenamento', bin: 'true', explanation: 'Blocos usados por outros snapshots continuam guardados.', concepts: ['ebs.snapshots'] },
          ],
        },
        {
          id: 'cmp.f03.m3.a3',
          kind: 'decision',
          title: 'O volume que nasceu sem cifra',
          prompt: 'A criptografia por padrão foi ligada hoje, mas o volume do sistema de laboratório foi criado no ano passado, sem cifra. Ele ficou cifrado?',
          concepts: [{ id: 'ebs.encryption' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A criptografia por padrão vale para volumes novos e cópias de snapshots; não muda o que já existe. Para cifrar o volume antigo, crie um snapshot, copie-o cifrado e crie um volume novo a partir da cópia.'],
          options: [
            { id: 'a', text: 'Não: é preciso fazer snapshot, copiar cifrado e criar um volume novo a partir da cópia', correct: true, consequence: 'O volume novo nasce cifrado e substitui o antigo.' },
            { id: 'b', text: 'Sim: a criptografia por padrão cifra os volumes existentes da Região', correct: false, consequence: 'Ela não tem efeito sobre volumes e snapshots que já existem.' },
            { id: 'c', text: 'Sim, depois de reiniciar a instância', correct: false, consequence: 'Reiniciar não muda a criptografia de um volume.' },
          ],
        },
        {
          id: 'cmp.f03.m3.a4',
          kind: 'decision',
          title: 'Um disco para dois servidores',
          prompt: 'O fornecedor quer que dois servidores do sistema de laudos, na mesma AZ, gravem no mesmo disco ao mesmo tempo. O software usa um sistema de arquivos de cluster. Qual configuração serve?',
          concepts: [{ id: 'ebs.multi-attach' }],
          xp: 40,
          difficulty: 3,
          explanation: ['Multi-Attach existe só em io1 e io2, para até 16 instâncias Nitro na mesma AZ. Com um sistema de arquivos de cluster, as escritas ficam coordenadas.'],
          options: [
            { id: 'a', text: 'Um volume io2 com Multi-Attach, anexado aos dois servidores', correct: true, consequence: 'Os dois servidores leem e gravam o mesmo volume, e o sistema de arquivos de cluster coordena as escritas.' },
            { id: 'b', text: 'Um gp3 com Multi-Attach', correct: false, consequence: 'O gp3 não tem Multi-Attach.' },
            { id: 'c', text: 'Um io2 com Multi-Attach usado como volume de boot dos dois', correct: false, consequence: 'Volumes com Multi-Attach não podem ser de boot.' },
            { id: 'd', text: 'O instance store de um servidor compartilhado com o outro', correct: false, consequence: 'O instance store é local e não pode ser anexado a outra instância.' },
          ],
        },
      ],
      debrief: { takeaways: ['Snapshot: incremental, restaura em qualquer AZ da Região, copia para outras Regiões.', 'Criptografia por padrão vale para o que é criado depois.', 'Multi-Attach: io1 ou io2, mesma AZ, sistema de arquivos de cluster.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'cmp.f03.boss',
      title: 'Banco lento às 9h',
      type: 'boss',
      summary: 'Todo dia, às 9h20, o sistema de agendamento trava. Descubra o motivo no CloudWatch.',
      briefing: {
        company: 'Clínica Sorriso Pleno',
        role: 'Você foi chamado por uma rede de clínicas odontológicas.',
        situation: 'O sistema de agendamento roda bem de madrugada e trava todo dia por volta das 9h20, quando as recepções abrem. A instância tem CPU sobrando. Alguém sugeriu trocar por uma instância maior.',
        objective: 'Achar o gargalo e corrigir pelo menor custo.',
        successCriteria: ['Apontar as evidências nas métricas', 'Identificar a causa', 'Escolher as correções que funcionam'],
      },
      intel: [
        { conceptId: 'ebs.gp2', body: ['No **gp2**, a baseline é 3 IOPS por GiB. Abaixo de 1 TiB, o volume faz burst até 3.000 IOPS gastando créditos; a métrica **BurstBalance** mostra o saldo.'] },
        { conceptId: 'ebs.gp3', body: ['O **gp3** entrega 3.000 IOPS fixos em qualquer tamanho e aceita mais IOPS sem crescer o disco.'] },
      ],
      activities: [
        {
          id: 'cmp.f03.boss.a1',
          kind: 'investigate',
          title: 'As métricas da manhã',
          prompt: 'Examine a configuração e as métricas do volume do banco.',
          concepts: [{ id: 'ebs.gp2' }, { id: 'ebs.gp3', weight: 0.5 }, { id: 'ebs.performance', weight: 0.5 }],
          xp: 90,
          difficulty: 3,
          explanation: ['O gp2 de 200 GiB tem baseline de 600 IOPS. De manhã, a carga pede uns 2.500 IOPS: o volume gasta os créditos no burst e, quando o BurstBalance chega a zero, cai para 600 IOPS. A fila de I/O cresce e o banco trava. CPU não é o gargalo.'],
          artifacts: [
            {
              id: 'cfg',
              title: 'Configuração',
              format: 'table',
              lines: [
                { id: 'c1', text: 'instância m7i.large · CPU média às 9h30: 22%', isIssue: false, explanation: 'CPU sobrando: uma instância maior não resolveria.' },
                { id: 'c2', text: 'volume do banco: gp2 de 200 GiB', isIssue: true, explanation: 'Baseline de 3 × 200 = 600 IOPS.' },
              ],
            },
            {
              id: 'cw',
              title: 'CloudWatch, terça-feira',
              format: 'log',
              lines: [
                { id: 'l1', text: '08:00 · VolumeReadOps+WriteOps ≈ 400/s · BurstBalance 100%', isIssue: false, explanation: 'Antes da abertura, a carga fica abaixo da baseline.' },
                { id: 'l2', text: '09:00 · operações ≈ 2.500/s · BurstBalance 58%', isIssue: true, explanation: 'Acima da baseline, o volume gasta créditos para fazer burst.' },
                { id: 'l3', text: '09:20 · BurstBalance 0% · operações limitadas a 600/s · VolumeQueueLength 64', isIssue: true, explanation: 'Sem créditos, o volume volta aos 600 IOPS e as operações enfileiram.' },
                { id: 'l4', text: '09:21 · aplicação: timeout ao gravar agendamento', isIssue: true, explanation: 'O efeito visível do disco limitado.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'r1', text: 'O gp2 esgota os créditos de I/O e volta à baseline de 600 IOPS', correct: true, feedback: 'Isso: o burst segura o começo da manhã, e depois o volume fica limitado à baseline.' },
              { id: 'r2', text: 'A instância está sem CPU', correct: false, feedback: 'A CPU está em 22%.' },
              { id: 'r3', text: 'O volume atingiu o limite de 16.000 IOPS do gp2', correct: false, feedback: 'Ele não passa de 2.500 operações por segundo; o limite que pegou foi a baseline de 600.' },
            ],
          },
          remediations: {
            prompt: 'Que correções resolvem? (selecione todas as adequadas)',
            options: [
              { id: 'f1', text: 'Mudar o volume para gp3, com Elastic Volumes, mantendo os 3.000 IOPS inclusos', correct: true, feedback: 'O gp3 entrega 3.000 IOPS fixos, sem créditos, e custa menos por GiB. A troca acontece com o volume em uso.' },
              { id: 'f2', text: 'Aumentar o gp2 para 1.000 GiB', correct: true, feedback: 'Funciona: 1.000 GiB dão 3.000 IOPS de baseline. Mas paga cinco vezes mais armazenamento do que precisa.' },
              { id: 'f3', text: 'Trocar a instância por uma m7i.2xlarge', correct: false, feedback: 'Mais CPU não muda os IOPS do volume.' },
              { id: 'f4', text: 'Mudar o volume para st1', correct: false, feedback: 'HDD é feito para throughput sequencial, não para muitas operações pequenas de um banco.' },
            ],
          },
        },
        {
          id: 'cmp.f03.boss.a2',
          kind: 'predict',
          title: 'Confirmando a correção',
          prompt: 'A proposta final é um **gp3 de 200 GiB com 4.000 IOPS e 125 MiB/s**, para ter folga sobre os 2.500 IOPS do pico. A carga também precisa de 100 MiB/s. O volume atende?',
          concepts: [{ id: 'ebs.gp3' }],
          xp: 40,
          difficulty: 2,
          explanation: ['200 GiB aceitam até 100.000 IOPS pela regra de 500 por GiB (limitado a 80.000), e 125 MiB/s já vêm inclusos. A configuração é válida e atende.'],
          spec: { sim: 'ebs', volume: { type: 'gp3', sizeGiB: 200, iops: 4000, throughput: 125 }, need: { minGiB: 200, iops: 2500, throughput: 100 } },
          options: EBS_OPTIONS,
        },
      ],
      debrief: { takeaways: ['Lentidão de disco aparece em fila de I/O e BurstBalance, não em CPU.', 'gp2 esgota créditos; gp3 entrega IOPS fixos.', 'Comprar IOPS no gp3 é mais barato que aumentar o disco.'] },
    },
  ],
}
