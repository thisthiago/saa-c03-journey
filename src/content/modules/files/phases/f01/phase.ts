/**
 * Fase 1 — EFS essencial. O sistema de arquivos compartilhado, Regional ou
 * One Zone, os mount targets por AZ, access points, autorização pelo IAM e
 * criptografia.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { FilesystemLabConfig } from '../../../../../simulators/filesystem/lab'
import { META } from '../meta'

export const ESCOLA_EFS: FilesystemLabConfig = {
  mode: 'access',
  workloads: [
    { id: 'uploads', label: 'Materiais dos cursos', detail: 'Apostilas e exercícios enviados pelos professores e lidos pelos servidores web.', clientAzs: ['a', 'b', 'c'], mustSurviveAz: true, concepts: ['efs.file-system-types', 'efs.mount-targets'] },
    { id: 'videos', label: 'Vídeos em conversão', detail: 'Os servidores de conversão gravam as versões de cada aula.', clientAzs: ['a', 'b'], mustSurviveAz: true, concepts: ['efs.file-system-types', 'efs.mount-targets'] },
    { id: 'dev', label: 'Ambiente de desenvolvimento', detail: 'Cópia dos materiais usada pelos programadores; é recriada a partir do repositório em minutos.', clientAzs: ['a', 'b'], mustSurviveAz: false, concepts: ['efs.file-system-types', 'efs.mount-targets'] },
    { id: 'bi', label: 'Extrações do BI', detail: 'Arquivos temporários gerados toda noite por um servidor de relatórios.', clientAzs: ['c'], mustSurviveAz: false, concepts: ['efs.file-system-types', 'efs.mount-targets'] },
  ],
}

export const F01_FIL: PhaseDef = {
  ...META.f01,
  concepts: ['storage.file', 'efs.what', 'efs.file-system-types', 'efs.mount-targets', 'efs.access-points', 'efs.iam-authorization', 'efs.encryption'],
  availability: 'available',
  simplifications: ['A escola, as cargas e as AZs (a, b e c) são fictícias.', 'Os servidores montam o sistema de arquivos pelo mount target da própria AZ quando ele existe.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'fil.f01.m1',
      title: 'Os uploads que sumiam',
      type: 'mission',
      summary: 'Quando um sistema de arquivos compartilhado resolve, e quando não serve.',
      briefing: {
        company: 'Escola Aberta',
        role: 'Você cuida da infraestrutura de uma plataforma de cursos on-line.',
        situation: 'O site roda em seis servidores Linux atrás de um balanceador. Cada professor envia a apostila para o servidor que o atendeu, e ela fica no disco daquele servidor. Os alunos atendidos pelos outros cinco recebem "arquivo não encontrado".',
        objective: 'Fazer todos os servidores enxergarem os mesmos arquivos.',
        successCriteria: ['Escolher o armazenamento compartilhado', 'Separar o que o EFS atende do que não atende'],
      },
      intel: [
        { conceptId: 'efs.what', body: ['O **EFS** é um sistema de arquivos **NFS** que vários servidores montam ao mesmo tempo, e que **cresce sozinho**: não há disco para dimensionar. Serve a EC2, contêineres e funções Lambda, mas **não** a instâncias Windows.'] },
        { conceptId: 'storage.file' },
      ],
      activities: [
        {
          id: 'fil.f01.m1.a1',
          kind: 'decision',
          title: 'Um lugar para as apostilas',
          prompt: 'Os seis servidores Linux precisam ler e gravar as mesmas apostilas, e o volume de arquivos cresce todo semestre. O que fazer?',
          concepts: [{ id: 'efs.what' }, { id: 'storage.file', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['O EFS é montado pelos seis servidores ao mesmo tempo e cresce sem que ninguém precise aumentar disco.'],
          options: [
            { id: 'a', text: 'Montar um sistema de arquivos EFS nos seis servidores', correct: true, consequence: 'Todo arquivo enviado aparece para todos os servidores, e o espaço cresce sozinho.' },
            { id: 'b', text: 'Aumentar o volume EBS de cada servidor', correct: false, consequence: 'Cada servidor continua com a sua cópia: o problema era o compartilhamento, não o espaço.' },
            { id: 'c', text: 'Ligar a afinidade de sessão no balanceador', correct: false, consequence: 'O professor e os alunos caem em servidores diferentes de qualquer jeito.' },
          ],
        },
        {
          id: 'fil.f01.m1.a2',
          kind: 'classify',
          title: 'Quem monta o EFS',
          prompt: 'Separe as cargas que podem usar o EFS das que precisam de outra solução.',
          concepts: [{ id: 'efs.what' }],
          xp: 40,
          difficulty: 1,
          explanation: ['O EFS é NFS para Linux: serve a EC2, ECS, EKS, Fargate e Lambda. Instâncias Windows não são suportadas.'],
          bins: [
            { id: 'efs', label: 'EFS atende' },
            { id: 'other', label: 'Precisa de outra solução' },
          ],
          items: [
            { id: 'web', text: 'Servidores web Linux em EC2 lendo as apostilas', bin: 'efs', explanation: 'Caso típico de NFS compartilhado.', concepts: ['efs.what'] },
            { id: 'lambda', text: 'Função Lambda que gera miniaturas das capas', bin: 'efs', explanation: 'O Lambda monta o EFS.', concepts: ['efs.what'] },
            { id: 'fargate', text: 'Contêineres no Fargate que corrigem exercícios', bin: 'efs', explanation: 'O Fargate monta o EFS.', concepts: ['efs.what'] },
            { id: 'windows', text: 'Servidor Windows do financeiro abrindo planilhas da rede', bin: 'other', explanation: 'Instâncias Windows não usam EFS; o caminho é o FSx for Windows File Server, por SMB.', concepts: ['efs.what'] },
          ],
        },
      ],
      debrief: { takeaways: ['EFS: NFS compartilhado e elástico para Linux, contêineres e Lambda.', 'Windows precisa de SMB, não de EFS.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f01.m2',
      title: 'A zona que caiu',
      type: 'mission',
      summary: 'Regional ou One Zone, e um mount target em cada AZ.',
      briefing: {
        company: 'Escola Aberta',
        role: 'Você revisa o que aconteceu numa falha de AZ.',
        situation: 'Na semana passada, a AZ a ficou fora por duas horas. O EFS era Regional, mas o mount target só existia na AZ a. Os servidores das AZs b e c, que estavam de pé, deram erro ao abrir qualquer apostila.',
        objective: 'Entender o que falhou e corrigir.',
        successCriteria: ['Prever quem perde o acesso', 'Escolher o tipo de sistema de arquivos certo para cada caso'],
      },
      intel: [
        { conceptId: 'efs.file-system-types', body: ['O **Regional** guarda os dados em **várias AZs** e continua acessível com uma fora. O **One Zone** guarda tudo em **uma AZ**: custa menos, mas fica fora (e pode perder os dados) se a AZ for perdida.'] },
        { conceptId: 'efs.mount-targets', body: ['Os servidores chegam ao EFS por um **mount target** na sub-rede. No Regional, crie **um em cada AZ** com servidores. No One Zone, existe **um só**, e quem está em outra AZ paga o acesso entre zonas.'] },
      ],
      activities: [
        {
          id: 'fil.f01.m2.a1',
          kind: 'predict',
          title: 'Um mount target só',
          prompt: 'EFS Regional com mount target só na AZ a. A AZ a fica fora. O que acontece com um servidor da AZ b?',
          concepts: [{ id: 'efs.mount-targets' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Os dados estavam salvos em várias AZs, mas o único caminho até eles ficou na AZ que caiu.'],
          spec: { sim: 'efs-access', topology: { type: 'regional', mountAzs: ['a'] }, clientAz: 'b', failedAz: 'a' },
          options: [
            { id: 'a', text: 'Perde o acesso aos arquivos', outcome: 'no-access' },
            { id: 'b', text: 'Continua acessando normalmente', outcome: 'ok' },
            { id: 'c', text: 'Acessa por outra AZ, pagando o tráfego', outcome: 'ok-cross-az' },
          ],
        },
        {
          id: 'fil.f01.m2.a2',
          kind: 'predict',
          title: 'Um mount target por AZ',
          prompt: 'Um EFS Regional tem mount targets nas AZs a, b e c, e cada servidor monta o sistema de arquivos pelo mount target da própria AZ. A AZ a fica fora. O que acontece com um servidor da AZ b?',
          concepts: [{ id: 'efs.mount-targets' }, { id: 'efs.file-system-types', weight: 0.5 }],
          xp: 40,
          difficulty: 1,
          explanation: ['O servidor usa o mount target da própria AZ, e o Regional mantém os dados disponíveis nas AZs que estão de pé.'],
          spec: { sim: 'efs-access', topology: { type: 'regional', mountAzs: ['a', 'b', 'c'] }, clientAz: 'b', failedAz: 'a' },
          options: [
            { id: 'a', text: 'Continua acessando normalmente', outcome: 'ok' },
            { id: 'b', text: 'Perde o acesso aos arquivos', outcome: 'no-access' },
            { id: 'c', text: 'Acessa por outra AZ, pagando o tráfego', outcome: 'ok-cross-az' },
          ],
        },
        {
          id: 'fil.f01.m2.a3',
          kind: 'predict',
          title: 'O One Zone e a AZ dele',
          prompt: 'Um EFS One Zone fica na AZ a. A AZ a cai. O que acontece com um servidor da AZ b que usava esse sistema de arquivos?',
          concepts: [{ id: 'efs.file-system-types' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O One Zone guarda os dados só na AZ a: com ela fora, ninguém alcança os arquivos, e eles podem até ser perdidos.'],
          spec: { sim: 'efs-access', topology: { type: 'one-zone', mountAzs: ['a'] }, clientAz: 'b', failedAz: 'a' },
          options: [
            { id: 'a', text: 'Perde o acesso aos arquivos', outcome: 'no-access' },
            { id: 'b', text: 'Acessa por outra AZ, pagando o tráfego', outcome: 'ok-cross-az' },
            { id: 'c', text: 'Continua acessando normalmente', outcome: 'ok' },
          ],
        },
        {
          id: 'fil.f01.m2.a4',
          kind: 'decision',
          title: 'O ambiente dos programadores',
          prompt: 'Os programadores usam uma cópia dos materiais que é recriada a partir do repositório em minutos. A diretoria quer cortar custos. Qual tipo de EFS usar?',
          concepts: [{ id: 'efs.file-system-types' }],
          xp: 40,
          difficulty: 2,
          explanation: ['Dados que podem ser recriados e uma carga que pode parar com a AZ são o caso do One Zone, que custa bem menos por GB.'],
          options: [
            { id: 'a', text: 'One Zone, na AZ dos servidores de desenvolvimento', correct: true, consequence: 'O custo por GB cai, e se a AZ falhar a cópia é recriada.' },
            { id: 'b', text: 'Regional, igual à produção', correct: false, consequence: 'Funciona, mas paga a redundância entre AZs por dados que podem ser recriados.' },
            { id: 'c', text: 'Um volume EBS por programador', correct: false, consequence: 'Os programadores deixam de compartilhar os mesmos arquivos.' },
          ],
        },
      ],
      debrief: { takeaways: ['Regional para produção; One Zone para o que pode ser recriado.', 'Um mount target em cada AZ com servidores.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f01.m3',
      title: 'Cada escola na sua pasta',
      type: 'mission',
      summary: 'Access points, autorização pelo IAM e criptografia.',
      briefing: {
        company: 'Escola Aberta',
        role: 'Você cuida da segurança dos arquivos.',
        situation: 'A plataforma passou a hospedar cursos de três escolas parceiras no mesmo EFS. Hoje, qualquer servidor que alcança o mount target lê e grava tudo. A auditoria também descobriu que o sistema de arquivos foi criado pela CLI, sem criptografia em repouso.',
        objective: 'Separar as escolas, dar só leitura a quem só lê e criptografar os dados.',
        successCriteria: ['Prender cada aplicação à sua pasta', 'Usar as permissões certas do IAM', 'Resolver a criptografia'],
      },
      intel: [
        { conceptId: 'efs.access-points', body: ['O **access point** impõe à aplicação um **usuário POSIX** e um **diretório raiz**: ela só enxerga a própria pasta. Com o IAM, você obriga cada aplicação a usar o seu.'] },
        { conceptId: 'efs.iam-authorization', body: ['Sem política, quem alcança o mount target tem acesso total. A **política do sistema de arquivos** libera **ClientMount** (ler), **ClientWrite** (gravar) e **ClientRootAccess** (root).'] },
        { conceptId: 'efs.encryption', body: ['A criptografia **em repouso** é escolhida **na criação** e não muda depois. A **em trânsito** é ligada ao montar, com TLS.'] },
      ],
      activities: [
        {
          id: 'fil.f01.m3.a1',
          kind: 'decision',
          title: 'Três escolas, um sistema de arquivos',
          prompt: 'Cada escola parceira roda a própria aplicação, que só pode ver a pasta da escola. Como separar sem criar três sistemas de arquivos?',
          concepts: [{ id: 'efs.access-points' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O access point fixa o diretório raiz e o usuário de cada aplicação; uma política do IAM obriga cada uma a montar pelo seu.'],
          options: [
            { id: 'a', text: 'Um access point por escola, com diretório raiz e usuário próprios, exigido pela política do IAM', correct: true, consequence: 'Cada aplicação só enxerga a pasta da sua escola.' },
            { id: 'b', text: 'Um security group por escola no mount target', correct: false, consequence: 'O security group decide quem chega à rede, não que pasta cada um vê.' },
            { id: 'c', text: 'Pedir às escolas que não abram as pastas umas das outras', correct: false, consequence: 'Combinação não é controle de acesso.' },
          ],
        },
        {
          id: 'fil.f01.m3.a2',
          kind: 'match',
          title: 'As permissões do cliente',
          prompt: 'Ligue cada necessidade à ação do EFS que a libera na política do sistema de arquivos.',
          concepts: [{ id: 'efs.iam-authorization' }],
          xp: 40,
          difficulty: 2,
          explanation: ['ClientMount dá leitura, ClientWrite dá gravação e ClientRootAccess deixa usar o root. A condição aws:SecureTransport exige TLS.'],
          leftLabel: 'Necessidade',
          rightLabel: 'Na política',
          pairs: [
            { id: 'p1', left: 'Os servidores de relatório só leem os arquivos', right: 'elasticfilesystem:ClientMount', explanation: 'Montar dá acesso de leitura.', concepts: ['efs.iam-authorization'] },
            { id: 'p2', left: 'A aplicação da escola grava as entregas dos alunos', right: 'elasticfilesystem:ClientWrite', explanation: 'Gravar exige ClientWrite.', concepts: ['efs.iam-authorization'] },
            { id: 'p3', left: 'O script de manutenção precisa agir como root', right: 'elasticfilesystem:ClientRootAccess', explanation: 'Sem ela, o root é tratado como usuário sem privilégio.', concepts: ['efs.iam-authorization'] },
            { id: 'p4', left: 'Nenhum cliente pode montar sem criptografia em trânsito', right: 'Condição aws:SecureTransport', explanation: 'Nega quem não usa TLS.', concepts: ['efs.iam-authorization', 'efs.encryption'] },
          ],
        },
        {
          id: 'fil.f01.m3.a3',
          kind: 'decision',
          title: 'Criptografar o que já existe',
          prompt: 'O sistema de arquivos foi criado sem criptografia em repouso e já tem 2 TB de apostilas. A auditoria exige criptografia. O que fazer?',
          concepts: [{ id: 'efs.encryption' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A criptografia em repouso não pode ser ligada depois. O caminho é copiar os dados para um sistema de arquivos novo, criado com criptografia, por exemplo com a replicação do EFS, e trocar a montagem.'],
          options: [
            { id: 'a', text: 'Criar um EFS novo com criptografia, replicar os dados para ele e trocar a montagem dos servidores', correct: true, consequence: 'Os dados passam a ficar criptografados com o KMS.' },
            { id: 'b', text: 'Ligar a criptografia em repouso nas configurações do sistema de arquivos atual', correct: false, consequence: 'Essa opção não existe depois da criação.' },
            { id: 'c', text: 'Montar com TLS nos servidores', correct: false, consequence: 'Protege o tráfego, não os dados guardados.' },
          ],
        },
      ],
      debrief: { takeaways: ['Access point: usuário e pasta fixos por aplicação.', 'Política do sistema de arquivos: ClientMount, ClientWrite e ClientRootAccess.', 'Criptografia em repouso só na criação.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'fil.f01.boss',
      title: 'Os arquivos da escola',
      type: 'boss',
      summary: 'Tipo e mount targets de quatro sistemas de arquivos.',
      briefing: {
        company: 'Escola Aberta',
        role: 'Você define os sistemas de arquivos antes do novo semestre.',
        situation: 'Quatro cargas usam arquivos compartilhados. Algumas não podem parar quando uma AZ cai; outras são recriadas em minutos e precisam custar pouco.',
        objective: 'Escolher o tipo e os mount targets de cada sistema de arquivos.',
        successCriteria: ['Nenhum servidor de pé perde o acesso numa falha de AZ', 'Nenhum dado recriável pago como Regional'],
      },
      intel: [{ conceptId: 'efs.mount-targets', body: ['Pergunte duas coisas a cada carga: ela pode parar se a AZ cair? Em quais AZs estão os servidores?'] }],
      activities: [
        {
          id: 'fil.f01.boss.a1',
          kind: 'lab',
          lab: 'filesystem',
          title: 'Quatro sistemas de arquivos',
          prompt: 'Para cada carga, escolha o tipo de EFS e os mount targets. Depois da verificação, cada cartão explica o que acontece numa falha de AZ.',
          concepts: [{ id: 'efs.file-system-types' }, { id: 'efs.mount-targets' }],
          xp: 200,
          difficulty: 3,
          hints: ['Se a carga precisa continuar com uma AZ fora, o tipo é Regional.', 'O One Zone só aceita um mount target.'],
          explanation: ['Materiais e vídeos: Regional com um mount target em cada AZ com servidores. Desenvolvimento e extrações do BI: One Zone, com o único mount target que ele aceita.'],
          config: ESCOLA_EFS,
        },
      ],
      debrief: { takeaways: ['Regional e um mount target por AZ para o que não pode parar.', 'One Zone para o que pode ser recriado.'] },
    },
  ],
}
