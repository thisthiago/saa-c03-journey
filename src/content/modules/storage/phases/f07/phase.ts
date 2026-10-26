/** Fase 7 — Replicação e recuperação de desastres (empresa fictícia: Nimbus Seguros). */
import type { PhaseDef } from '../../../../../engine/types'
import type { ReplicationLabConfig } from '../../../../../simulators/replication/lab'
import type { ReplEvent, ReplRule, ReplSetup } from '../../../../../simulators/replication/model'

const COMPANY = 'Nimbus Seguros'
const ROLE = 'Você lidera o plano de continuidade de negócios da seguradora.'
const MAIN = '777788889999'
const DR_ACC = '135792468024'
const SRC = 'nimbus-apolices'
const DR = 'nimbus-apolices-dr'

const ev = (id: string, label: string, kind: ReplEvent['kind'], key: string, extra: Partial<ReplEvent> = {}): ReplEvent => ({ id, label, kind, key, encryption: 'SSE-S3', ...extra })
const E = {
  put: ev('put', 'Nova apólice', 'put', 'apolices/2026/ap-77812.pdf'),
  kms: ev('kms', 'Novo laudo de sinistro', 'put', 'sinistros/2026/laudo-0931.pdf', { encryption: 'SSE-KMS' }),
  fin: ev('fin', 'Novo relatório financeiro', 'put', 'financeiro/2026/balancete-09.xlsx'),
  existing: ev('existing', 'Apólice de 2019 (anterior à replicação)', 'existing', 'apolices/2019/ap-00012.pdf'),
  dm: ev('dm', 'Apólice apagada por engano (DELETE simples)', 'delete-marker', 'apolices/2026/ap-77812.pdf'),
  delVersion: ev('delv', 'Exclusão de uma versão específica', 'delete-version', 'apolices/2026/ap-77812.pdf'),
  archived: ev('arch', 'Apólice de 2015 no Glacier Deep Archive', 'archived', 'apolices/2015/ap-00001.pdf', { storageClass: 'DEEP_ARCHIVE' }),
  lifecycle: ev('lc', 'Expiração de arquivos temporários pelo lifecycle', 'lifecycle-expire', 'temp/upload-tmp.bin'),
  tagLater: ev('tag', 'Apólice marcada com dr=sim depois do PUT', 'tag-after-put', 'apolices/2026/ap-80001.pdf'),
}

const baseRule = (p: Partial<ReplRule> = {}): ReplRule => ({ id: 'dr', enabled: true, destination: DR, deleteMarkerReplication: false, rtc: false, replicateKms: false, ...p })

const GOOD_SETUP: ReplSetup = {
  source: { name: SRC, region: 'us-east-1', account: MAIN, versioning: 'Enabled' },
  destinations: [{ name: DR, region: 'us-west-2', account: DR_ACC, versioning: 'Enabled' }],
  role: { s3: true, kmsDecrypt: true, kmsEncrypt: true },
  destPolicy: { [DR]: true },
  rules: [baseRule({ rtc: true, replicateKms: true, replicaKey: 'dest-customer' })],
}

const STATUS_OPTIONS = [
  { id: 'o1', text: 'COMPLETED: a réplica chega ao destino', outcome: 'COMPLETED' },
  { id: 'o2', text: 'Não é replicado', outcome: 'NOT_REPLICATED' },
  { id: 'o3', text: 'FAILED: a replicação tenta e falha', outcome: 'FAILED' },
]

// --- Missão 2: Disaster Recovery Mission ----------------------------------------
const M2_LAB: ReplicationLabConfig = {
  setup: {
    source: { name: SRC, region: 'us-east-1', account: MAIN, versioning: 'Unversioned' },
    destinations: [{ name: DR, region: 'us-west-2', account: DR_ACC, versioning: 'Unversioned' }],
    role: { s3: true, kmsDecrypt: false, kmsEncrypt: false },
    destPolicy: { [DR]: false },
    rules: [baseRule()],
  },
  events: [E.put, E.kms, E.dm, E.existing],
  editable: { sourceVersioning: true, destVersioning: true, role: true, destPolicy: true, rules: true },
  prefixes: ['apolices/', 'sinistros/', 'financeiro/'],
  goals: [
    { type: 'valid', why: 'Sem versionamento na origem, o S3 recusa a configuração.', concepts: ['repl.requirements'] },
    { type: 'event', event: 'put', destination: DR, expect: 'COMPLETED', why: 'Toda apólice nova precisa existir também na Região de DR.', concepts: ['repl.requirements'] },
    { type: 'event', event: 'kms', destination: DR, expect: 'COMPLETED', why: 'Laudos de sinistro (SSE-KMS) também precisam de cópia.', concepts: ['repl.kms'] },
    { type: 'rtc', destination: DR, why: 'O regulador exige RPO previsível, de no máximo 15 minutos para a grande maioria dos objetos.', concepts: ['repl.rtc'] },
    { type: 'event', event: 'dm', destination: DR, expect: 'NOT_REPLICATED', why: 'Uma exclusão acidental na origem não pode esconder o objeto também na cópia de DR.', concepts: ['repl.delete-markers'] },
    { type: 'replica-class', event: 'put', destination: DR, allowed: ['STANDARD_IA', 'GLACIER_IR'], why: 'A cópia de DR quase nunca é lida, mas precisa estar disponível na hora de um failover.', concepts: ['repl.crr-srr'] },
  ],
  solution: {
    sourceVersioning: 'Enabled',
    destVersioning: { [DR]: 'Enabled' },
    role: { s3: true, kmsDecrypt: true, kmsEncrypt: true },
    destPolicy: { [DR]: true },
    rules: [baseRule({ rtc: true, replicateKms: true, replicaKey: 'dest-customer', storageClass: 'STANDARD_IA' })],
  },
}

// --- Chefe -----------------------------------------------------------------------
const BOSS_LAB: ReplicationLabConfig = {
  setup: {
    source: { name: SRC, region: 'us-east-1', account: MAIN, versioning: 'Enabled' },
    destinations: [{ name: DR, region: 'us-west-2', account: DR_ACC, versioning: 'Enabled' }],
    role: { s3: true, kmsDecrypt: false, kmsEncrypt: false },
    destPolicy: { [DR]: true },
    rules: [baseRule({ prefix: 'apolices/', rtc: true })],
  },
  events: [E.put, E.kms, E.fin, E.dm],
  editable: { role: true, rules: true },
  prefixes: ['apolices/', 'sinistros/', 'financeiro/'],
  goals: [
    { type: 'valid', why: 'A configuração precisa continuar válida.', concepts: ['repl.requirements'] },
    { type: 'event', event: 'put', destination: DR, expect: 'COMPLETED', why: 'As apólices continuam sendo replicadas.', concepts: ['repl.crr-srr'] },
    { type: 'event', event: 'kms', destination: DR, expect: 'COMPLETED', why: 'No desastre, os laudos de sinistro não estavam em DR.', concepts: ['repl.kms'] },
    { type: 'event', event: 'fin', destination: DR, expect: 'COMPLETED', why: 'Os relatórios financeiros também ficaram de fora.', concepts: ['repl.crr-srr'] },
    { type: 'rtc', destination: DR, why: 'O RPO regulatório continua valendo.', concepts: ['repl.rtc'] },
    { type: 'event', event: 'dm', destination: DR, expect: 'NOT_REPLICATED', why: 'Exclusões acidentais não devem se propagar para a cópia de DR.', concepts: ['repl.delete-markers'] },
  ],
  solution: {
    sourceVersioning: 'Enabled',
    destVersioning: { [DR]: 'Enabled' },
    role: { s3: true, kmsDecrypt: true, kmsEncrypt: true },
    destPolicy: { [DR]: true },
    rules: [baseRule({ rtc: true, replicateKms: true, replicaKey: 'dest-customer' })],
  },
}

export const F07: PhaseDef = {
  id: 's3x.f07',
  order: 7,
  title: 'Replicação e recuperação de desastres',
  subtitle: 'CRR, SRR e RTC',
  summary: 'Desenhe a replicação entre Regiões e veja o efeito de pré-requisitos ausentes.',
  glyph: 'globe',
  color: '#ff8f5a',
  requires: ['s3x.f03', 's3x.f05'],
  recommends: ['s3x.f04'],
  concepts: ['repl.crr-srr', 'repl.requirements', 'repl.what-not', 'repl.delete-markers', 'repl.kms', 'repl.rtc', 'repl.batch', 'dr.rpo-rto'],
  availability: 'available',
  estimatedMinutes: 45,
  map: { x: 560, y: 662 },
  simplifications: [
    'O tempo de replicação não é simulado: o RTC aparece como o SLA publicado (99,9% em até 15 minutos).',
    'Permissões do papel de replicação e a bucket policy do destino aparecem como caixas de seleção.',
    'Cada regra tem um destino; prioridades entre regras sobrepostas e S3 Batch Replication não são simuladas.',
  ],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 's3x.f07.m1',
      title: 'CRR, SRR ou nenhuma?',
      type: 'mission',
      summary: 'Escolher entre replicação entre Regiões, na mesma Região ou outra solução.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `A Nimbus guarda apólices e laudos no bucket \`${SRC}\`, em us-east-1. O regulador pediu um plano de continuidade, e cada área chegou com um pedido diferente de "cópia".`,
        objective: 'Decidir, para cada pedido, se a replicação resolve e de que tipo.',
        successCriteria: ['Classificar os pedidos', 'Decidir sobre o RTC'],
      },
      intel: [
        {
          conceptId: 'repl.crr-srr',
          body: ['A replicação copia **objetos novos**, de forma assíncrona, para outro bucket: em **outra Região** (CRR) ou na **mesma** (SRR), na mesma conta ou em outra.'],
        },
        {
          conceptId: 'repl.rtc',
          body: ['**S3 RTC**: a maioria dos objetos em segundos e **99,9% em até 15 minutos**, com métricas e alertas. Use quando o RPO precisa ser previsível.'],
        },
      ],
      activities: [
        {
          id: 's3x.f07.m1.a1',
          kind: 'classify',
          title: 'Que tipo de cópia?',
          prompt: 'Classifique cada pedido.',
          concepts: [{ id: 'repl.crr-srr' }],
          xp: 60,
          difficulty: 2,
          explanation: ['CRR para geografia (DR, latência); SRR para copiar dentro da Região (agregação, contas diferentes, soberania). Recuperar exclusões e copiar dados antigos pedem outras ferramentas.'],
          bins: [
            { id: 'crr', label: 'CRR' },
            { id: 'srr', label: 'SRR' },
            { id: 'none', label: 'Outra solução' },
          ],
          items: [
            { id: 'c1', text: 'Manter as apólices disponíveis se us-east-1 ficar indisponível', bin: 'crr', explanation: 'Recuperação de desastres regional exige outra Região.', concepts: ['repl.crr-srr'] },
            { id: 'c2', text: 'Corretores na Europa precisam baixar documentos com menos latência', bin: 'crr', explanation: 'Uma cópia numa Região europeia aproxima os dados dos usuários.', concepts: ['repl.crr-srr'] },
            { id: 'c3', text: 'Juntar os logs de cinco buckets de aplicação num bucket central, na mesma Região', bin: 'srr', explanation: 'Agregação dentro da Região é um caso típico de SRR.', concepts: ['repl.crr-srr'] },
            { id: 'c4', text: 'Copiar os dados de produção para a conta de testes, sem sair da Região', bin: 'srr', explanation: 'Mesma Região, contas diferentes: é SRR, que também funciona entre contas.', concepts: ['repl.crr-srr'] },
            { id: 'c5', text: 'Recuperar uma apólice sobrescrita por engano ontem', bin: 'none', explanation: 'Isso é versionamento, não replicação.', concepts: ['repl.what-not'] },
            { id: 'c6', text: 'Copiar uma única vez os 10 anos de apólices que já existem', bin: 'none', explanation: 'A replicação só cobre objetos novos; dados existentes pedem S3 Batch Replication.', concepts: ['repl.batch'] },
          ],
        },
        {
          id: 's3x.f07.m1.a2',
          kind: 'decision',
          title: 'RPO de 15 minutos',
          prompt: 'O regulador exige que, num desastre, a Nimbus perca no máximo **15 minutos** de documentos, com evidência de monitoramento. O que configurar?',
          concepts: [{ id: 'repl.rtc' }, { id: 'dr.rpo-rto' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O S3 RTC tem SLA de 99,9% dos objetos em até 15 minutos e publica métricas e eventos de atraso — a evidência que o regulador pede.'],
          options: [
            { id: 'a', text: 'CRR com S3 Replication Time Control', correct: true, consequence: 'Replicação com SLA e métricas: o atraso é medido e alertado.', impacts: { durabilidade: 1, disponibilidade: 1 } },
            { id: 'b', text: 'CRR sem RTC: a replicação já é rápida', correct: false, consequence: 'Normalmente é, mas sem SLA nem métricas de atraso não há como comprovar o RPO.' },
            { id: 'c', text: 'Cópia noturna com S3 Batch Operations', correct: false, consequence: 'O RPO passaria a ser de até 24 horas.', impacts: { durabilidade: -1 } },
          ],
          justification: {
            prompt: 'O que o RTC acrescenta?',
            options: [
              { id: 'j1', text: 'Um SLA de tempo de replicação, com métricas e eventos quando o limite de 15 minutos é ultrapassado.', correct: true, feedback: 'Isso: previsibilidade e evidência.' },
              { id: 'j2', text: 'Replicação síncrona: o PUT só termina quando a réplica existe.', correct: false, feedback: 'A replicação do S3 é sempre assíncrona.' },
              { id: 'j3', text: 'A replicação de objetos que já existiam.', correct: false, feedback: 'Objetos existentes exigem Batch Replication.' },
            ],
          },
        },
      ],
      debrief: {
        takeaways: ['Use CRR para ter uma cópia em outra Região e SRR para copiar dentro da mesma Região.', 'Replicação cobre objetos novos — não substitui versionamento nem copia o passado.', 'Com o RTC, 99,9% dos objetos são replicados em até 15 minutos, com métricas para acompanhar.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f07.m2',
      title: 'Disaster Recovery Mission',
      type: 'mission',
      summary: 'Configurar a replicação para a conta de DR corrigindo os pré-requisitos que faltam.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: `A cópia de DR vai para \`${DR}\`, em us-west-2, numa **conta separada** (${DR_ACC}) — se a conta principal for comprometida, a cópia fica fora do alcance. Um rascunho da configuração já existe, mas nada está sendo replicado.`,
        objective: 'Fazer a replicação funcionar e atender aos requisitos do regulador.',
        successCriteria: ['Configuração aceita', 'Apólices e laudos replicados', 'RTC ligado', 'Exclusões acidentais não propagadas', 'Classe de armazenamento econômica nas réplicas'],
      },
      intel: [
        {
          conceptId: 'repl.requirements',
          body: ['Pré-requisitos: **versionamento na origem e no destino**, **papel IAM** de replicação e, entre contas, **bucket policy no destino** autorizando a conta de origem.'],
        },
        {
          conceptId: 'repl.kms',
          body: ['Objetos **SSE-KMS** exigem opt-in, uma chave para as réplicas **na Região do destino** e, no papel, kms:Decrypt (origem) e kms:Encrypt (réplicas). Entre contas, nada de chave gerenciada pela AWS.'],
        },
        {
          conceptId: 'repl.delete-markers',
          body: ['Por padrão, **delete markers não são replicados**: uma exclusão acidental na origem não esconde o objeto no destino.'],
        },
      ],
      activities: [
        {
          id: 's3x.f07.m2.a1',
          kind: 'lab',
          lab: 'replication',
          title: 'Replicação para a conta de DR',
          prompt: 'Corrija os pré-requisitos e a regra. Cada cenário à direita mostra o que aconteceria com a configuração atual.',
          concepts: [{ id: 'repl.requirements' }, { id: 'repl.kms' }, { id: 'repl.rtc' }, { id: 'repl.delete-markers' }],
          xp: 120,
          difficulty: 3,
          hints: ['Comece pelo alerta: o que o S3 exige antes de aceitar a configuração?', 'Destino em outra conta: falta autorização do lado de lá.', 'O laudo usa SSE-KMS: veja a regra e o papel de replicação.'],
          explanation: [
            'Solução: versionamento nos dois buckets, bucket policy no destino, kms:Decrypt e kms:Encrypt no papel, e a regra com RTC, opt-in de SSE-KMS (chave na Região de destino) e réplicas em Standard-IA (ou Glacier IR). Delete marker replication fica desligado.',
          ],
          config: M2_LAB,
        },
      ],
      debrief: {
        takeaways: ['A replicação exige versionamento nos dois buckets, um papel IAM e, entre contas, uma bucket policy no destino.', 'Para objetos SSE-KMS, ative a opção na regra, use uma chave na Região do destino e dê ao papel as permissões do KMS.', 'A réplica pode usar uma classe mais barata.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f07.m3',
      title: 'O que (não) é replicado',
      type: 'mission',
      summary: 'Prever, com o simulador, o que chega ao destino em situações pouco óbvias.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation: 'A replicação está funcionando. Agora a auditoria quer saber, caso a caso, o que de fato existe na conta de DR.',
        objective: 'Prever o resultado de cada cenário.',
        successCriteria: ['Prever cinco cenários', 'Escolher como copiar os dados antigos'],
      },
      intel: [
        {
          conceptId: 'repl.what-not',
          body: ['Não são replicados: objetos **anteriores** à configuração, **réplicas** de outra regra, objetos em **Glacier Flexible/Deep Archive**, **ações do lifecycle**, **DELETE com versionId** e, com filtro por tag, objetos marcados **depois** do PUT.'],
        },
      ],
      activities: [
        {
          id: 's3x.f07.m3.a1',
          kind: 'predict',
          title: 'A apólice de 2019',
          prompt: 'A apólice `apolices/2019/ap-00012.pdf` já estava no bucket quando a replicação foi configurada. O que acontece com ela?',
          concepts: [{ id: 'repl.what-not' }, { id: 'repl.batch' }],
          xp: 30,
          difficulty: 1,
          explanation: ['A replicação só cobre objetos criados depois da configuração. Para os existentes, use S3 Batch Replication.'],
          spec: { sim: 'replication', setup: GOOD_SETUP, event: E.existing, destination: DR },
          options: STATUS_OPTIONS,
        },
        {
          id: 's3x.f07.m3.a2',
          kind: 'predict',
          title: 'Excluir uma versão específica',
          prompt: 'Alguém com credenciais da conta principal executa DELETE **com versionId** numa apólice replicada. O que acontece na cópia de DR?',
          concepts: [{ id: 'repl.what-not' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Exclusões de versão específica não são replicadas: a réplica é preservada. É uma proteção contra exclusões maliciosas.'],
          spec: { sim: 'replication', setup: GOOD_SETUP, event: E.delVersion, destination: DR },
          options: [
            { id: 'o1', text: 'A versão também é excluída no destino', outcome: 'COMPLETED' },
            { id: 'o2', text: 'Nada muda no destino: a réplica é preservada', outcome: 'NOT_REPLICATED' },
            { id: 'o3', text: 'A replicação falha e fica pendente', outcome: 'FAILED' },
          ],
        },
        {
          id: 's3x.f07.m3.a3',
          kind: 'predict',
          title: 'A apólice no Deep Archive',
          prompt: 'A regra de replicação cobre `apolices/`. Uma apólice de 2015 que está no **S3 Glacier Deep Archive** vai para a conta de DR?',
          concepts: [{ id: 'repl.what-not' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Objetos em Glacier Flexible Retrieval ou Deep Archive não são replicados; seria preciso restaurar e copiar para outra classe.'],
          spec: { sim: 'replication', setup: GOOD_SETUP, event: E.archived, destination: DR },
          options: STATUS_OPTIONS,
        },
        {
          id: 's3x.f07.m3.a4',
          kind: 'predict',
          title: 'A tag que chegou atrasada',
          prompt: 'A regra replica só objetos com a tag `dr=sim`. Uma apólice foi enviada sem a tag e marcada com `dr=sim` uma hora depois. Ela será replicada?',
          concepts: [{ id: 'repl.what-not' }],
          xp: 30,
          difficulty: 3,
          explanation: ['Em regras com filtro por tag, a tag precisa estar no PutObject. Objetos marcados depois não são replicados — só com Batch Replication.'],
          spec: { sim: 'replication', setup: { ...GOOD_SETUP, rules: [baseRule({ tag: { key: 'dr', value: 'sim' } })] }, event: E.tagLater, destination: DR },
          options: STATUS_OPTIONS,
        },
        {
          id: 's3x.f07.m3.a5',
          kind: 'predict',
          title: 'O laudo sem opt-in',
          prompt: 'A regra **não** habilita a replicação de objetos SSE-KMS. Um laudo de sinistro novo, criptografado com SSE-KMS, é enviado. O que acontece?',
          concepts: [{ id: 'repl.kms' }],
          xp: 30,
          difficulty: 2,
          explanation: ['Por padrão, objetos SSE-KMS não são replicados: é preciso o opt-in SseKmsEncryptedObjects e uma chave para as réplicas.'],
          spec: { sim: 'replication', setup: { ...GOOD_SETUP, rules: [baseRule({ rtc: true })] }, event: E.kms, destination: DR },
          options: STATUS_OPTIONS,
        },
        {
          id: 's3x.f07.m3.a6',
          kind: 'decision',
          title: 'E os dez anos de apólices?',
          prompt: 'A auditoria quer que as apólices anteriores à configuração também estejam em DR. Qual é o caminho indicado?',
          concepts: [{ id: 'repl.batch' }],
          xp: 30,
          difficulty: 1,
          explanation: ['S3 Batch Replication replica objetos existentes, objetos que falharam e réplicas de outras regras.'],
          options: [
            { id: 'a', text: 'Executar um job de S3 Batch Replication.', correct: true, consequence: 'Os objetos existentes são replicados com a mesma configuração, e o job gera um relatório de conclusão.', impacts: { durabilidade: 1 } },
            { id: 'b', text: 'Apagar e recriar a configuração de replicação.', correct: false, consequence: 'Recriar a configuração não replica o passado: continua valendo só para objetos novos.' },
            { id: 'c', text: 'Esperar: a replicação alcança os objetos antigos com o tempo.', correct: false, consequence: 'Nunca vai alcançar. A replicação contínua não olha para trás.' },
          ],
        },
      ],
      debrief: {
        takeaways: ['Objetos antigos, réplicas de réplicas e arquivados não são replicados.', 'DELETE com versionId não se propaga — a réplica é preservada.', 'Para o passado e para falhas: S3 Batch Replication.'],
      },
    },
    // -----------------------------------------------------------------------
    {
      id: 's3x.f07.boss',
      title: 'Chefe: desastre regional',
      type: 'boss',
      summary: 'Avaliar o que sobreviveu a uma indisponibilidade regional, corrigir a configuração e preparar o próximo failover.',
      briefing: {
        company: COMPANY,
        role: ROLE,
        situation:
          'Simulação de crise: us-east-1 está indisponível. A replicação foi configurada em março de 2025 com uma regra só para `apolices/`, RTC ligado e sem opt-in de SSE-KMS. Nunca houve Batch Replication. A diretoria quer saber o que está disponível em us-west-2 — e o que muda daqui para a frente.',
        objective: 'Avaliar o RPO real, corrigir a configuração e preparar o failover.',
        successCriteria: ['Classificar o que está disponível em DR', 'Corrigir a configuração', 'Planejar os dados antigos', 'Preparar o failover'],
      },
      intel: [
        {
          conceptId: 'dr.rpo-rto',
          body: ['**RPO**: quanto dado se perde. **RTO**: em quanto tempo o serviço volta. A replicação reduz o RPO; o RTO depende de a aplicação, as permissões e as chaves funcionarem na outra Região.'],
        },
      ],
      activities: [
        {
          id: 's3x.f07.boss.a1',
          kind: 'classify',
          title: 'O que está em us-west-2?',
          prompt: 'O bucket `nimbus-apolices`, em us-east-1, é replicado para us-west-2 desde março de 2025, com uma regra só para `apolices/`, RTC ligado, sem opt-in de SSE-KMS e sem replicar delete markers. Nunca houve Batch Replication. Com us-east-1 fora do ar, classifique cada item.',
          concepts: [{ id: 'repl.what-not' }, { id: 'repl.kms' }],
          xp: 70,
          difficulty: 3,
          explanation: ['Só objetos novos de apolices/, sem SSE-KMS e fora de classes arquivadas, chegaram a DR. Delete markers não foram replicados, então a apólice apagada por engano continua visível no destino.'],
          bins: [
            { id: 'yes', label: 'Disponível em DR' },
            { id: 'no', label: 'Não está em DR' },
          ],
          items: [
            { id: 'd1', text: 'Apólice criada em 2026 (SSE-S3)', bin: 'yes', explanation: 'Objeto novo, coberto pela regra.', concepts: ['repl.crr-srr'] },
            { id: 'd2', text: 'Apólice de 2019, anterior à configuração', bin: 'no', explanation: 'Objetos existentes exigem Batch Replication.', concepts: ['repl.batch'] },
            { id: 'd3', text: 'Laudo de sinistro de 2026 (SSE-KMS)', bin: 'no', explanation: 'Sem opt-in, objetos SSE-KMS não são replicados.', concepts: ['repl.kms'] },
            { id: 'd4', text: 'Apólice de 2026 apagada por engano na origem (DELETE simples)', bin: 'yes', explanation: 'O delete marker não foi replicado: o objeto segue visível em DR.', concepts: ['repl.delete-markers'] },
            { id: 'd5', text: 'Apólice de 2015 no Glacier Deep Archive', bin: 'no', explanation: 'Objetos arquivados não são replicados.', concepts: ['repl.what-not'] },
            { id: 'd6', text: 'Relatório financeiro de 2026 em financeiro/', bin: 'no', explanation: 'Fora do filtro de prefixo da regra.', concepts: ['repl.crr-srr'] },
          ],
        },
        {
          id: 's3x.f07.boss.a2',
          kind: 'lab',
          lab: 'replication',
          title: 'Fechar as lacunas',
          prompt: 'Ajuste o papel de replicação e a regra para que, daqui para a frente, tudo o que importa chegue a DR.',
          concepts: [{ id: 'repl.kms' }, { id: 'repl.crr-srr' }, { id: 'repl.delete-markers' }],
          xp: 120,
          difficulty: 3,
          hints: ['O filtro por prefixo deixou financeiro/ e sinistros/ de fora.', 'Destino em outra conta: qual chave KMS pode cifrar as réplicas?'],
          explanation: ['Uma solução: regra para todo o bucket, com RTC, opt-in de SSE-KMS e chave do cliente na Região de destino; kms:Decrypt e kms:Encrypt no papel de replicação; delete marker replication desligado.'],
          config: BOSS_LAB,
        },
        {
          id: 's3x.f07.boss.a3',
          kind: 'decision',
          title: 'Os laudos e apólices que ficaram para trás',
          prompt: 'A Nimbus Seguros replica o bucket `nimbus-apolices` para uma conta de DR em outra Região. A regra de replicação, que antes não cobria laudos SSE-KMS nem relatórios, foi corrigida. Mesmo assim, os laudos SSE-KMS e os relatórios que já existiam continuam fora de DR. O que fazer?',
          concepts: [{ id: 'repl.batch' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A regra corrigida só vale para objetos novos. Um job de S3 Batch Replication leva os existentes (e os que falharam) para o destino.'],
          options: [
            { id: 'a', text: 'Rodar S3 Batch Replication para os objetos existentes.', correct: true, consequence: 'Os objetos antigos chegam a DR com a configuração corrigida.', impacts: { durabilidade: 1 } },
            { id: 'b', text: 'Nada: a nova regra já cobre tudo.', correct: false, consequence: 'A replicação contínua não olha para trás: os objetos antigos continuam só na origem.', impacts: { durabilidade: -1 } },
            { id: 'c', text: 'Ligar delete marker replication para "sincronizar" os buckets.', correct: false, consequence: 'Isso só faria exclusões acidentais se propagarem para DR.', impacts: { durabilidade: -1 } },
          ],
        },
        {
          id: 's3x.f07.boss.a4',
          kind: 'decision',
          title: 'Pronto para o failover?',
          prompt: 'O que precisa estar pronto para a aplicação funcionar em us-west-2 num desastre real? (selecione todos os adequados)',
          concepts: [{ id: 'dr.rpo-rto' }, { id: 'repl.kms' }],
          xp: 50,
          difficulty: 3,
          multiple: true,
          explanation: ['Ter os dados não basta: a aplicação precisa saber usar o bucket de DR, ter permissão nele e na chave KMS da Região de destino — e isso precisa ser testado.'],
          options: [
            { id: 'a', text: 'Permissões da aplicação no bucket de DR e na chave KMS de us-west-2', correct: true, consequence: 'Sem isso, os laudos replicados não podem ser lidos.', impacts: { disponibilidade: 1 } },
            { id: 'b', text: 'Configuração da aplicação para apontar para o bucket de DR', correct: true, consequence: 'O RTO depende de a troca ser rápida e conhecida.', impacts: { disponibilidade: 1 } },
            { id: 'c', text: 'Testes periódicos de failover', correct: true, consequence: 'Um plano nunca testado costuma falhar no dia do desastre.', impacts: { disponibilidade: 1 } },
            { id: 'd', text: 'Monitorar as métricas de replicação (atraso e falhas)', correct: true, consequence: 'O RPO real fica visível antes do desastre.', impacts: { durabilidade: 1 } },
            { id: 'e', text: 'Guardar a chave KMS das réplicas só em us-east-1, por segurança', correct: false, consequence: 'Com us-east-1 fora do ar, os dados em DR ficariam ilegíveis.', impacts: { disponibilidade: -2 } },
          ],
        },
      ],
      debrief: {
        takeaways: ['O RPO real depende do que a regra cobre: prefixos, SSE-KMS, objetos antigos e arquivados.', 'Batch Replication fecha as lacunas do passado.', 'DR exige permissões, chaves e aplicação prontas — e testadas — na outra Região.'],
      },
    },
  ],
}
