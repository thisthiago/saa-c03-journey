/**
 * Fase 3 — Segurança dentro da VPC. Security groups (com estado, referência a
 * outro grupo), network ACLs (sem estado, ordem, padrão e personalizada),
 * portas efêmeras, Flow Logs e Reachability Analyzer.
 */
import type { PhaseDef } from '../../../../../engine/types'
import type { ReachLabConfig } from '../../../../../simulators/reach/lab'
import { DEFAULT_NACL, type ReachWorld } from '../../../../../simulators/reach/model'
import { META } from '../meta'

const ALL = '0.0.0.0/0'

/** Mundo usado nas previsões: sub-rede pública com o servidor web e privada com o banco. */
const SABER_WORLD = (webNaclOut = DEFAULT_NACL): ReachWorld => ({
  subnets: [
    { id: 'pub', name: 'pública', cidr: '10.50.1.0/24', public: true, naclIn: DEFAULT_NACL, naclOut: webNaclOut },
    { id: 'priv', name: 'privada', cidr: '10.50.2.0/24', naclIn: DEFAULT_NACL, naclOut: DEFAULT_NACL },
  ],
  instances: [
    { id: 'web', name: 'servidor web', subnet: 'pub', ip: '10.50.1.10', publicIp: true, sg: 'sg-web' },
    { id: 'relatorio', name: 'servidor de relatórios', subnet: 'pub', ip: '10.50.1.20', publicIp: true, sg: 'sg-rel' },
    { id: 'db', name: 'banco', subnet: 'priv', ip: '10.50.2.30', sg: 'sg-db' },
  ],
  groups: [
    { id: 'sg-web', name: 'sg-web', inbound: [{ peer: ALL, ports: [443, 443] }] },
    { id: 'sg-rel', name: 'sg-rel', inbound: [] },
    { id: 'sg-db', name: 'sg-db', inbound: [{ peer: 'sg-web', ports: [5432, 5432] }] },
  ],
})

export const SABER_LAB: ReachLabConfig = {
  world: {
    subnets: [
      { id: 'pub', name: 'pública', cidr: '10.50.1.0/24', public: true, naclIn: [], naclOut: [] },
      { id: 'priv', name: 'privada', cidr: '10.50.2.0/24', naclIn: [], naclOut: [] },
    ],
    instances: [
      { id: 'web', name: 'servidor web', subnet: 'pub', ip: '10.50.1.10', publicIp: true, sg: 'sg-web' },
      { id: 'db', name: 'banco', subnet: 'priv', ip: '10.50.2.30', sg: 'sg-db' },
    ],
    groups: [
      { id: 'sg-web', name: 'sg-web', inbound: [] },
      { id: 'sg-db', name: 'sg-db', inbound: [] },
    ],
  },
  palette: [
    { id: 'web-443', label: 'HTTPS (443) de 0.0.0.0/0', target: { kind: 'sg-in', sg: 'sg-web', rule: { peer: ALL, ports: [443, 443] } } },
    { id: 'web-22', label: 'SSH (22) de 0.0.0.0/0', target: { kind: 'sg-in', sg: 'sg-web', rule: { peer: ALL, ports: [22, 22] } } },
    { id: 'db-sg', label: 'PostgreSQL (5432) do grupo sg-web', target: { kind: 'sg-in', sg: 'sg-db', rule: { peer: 'sg-web', ports: [5432, 5432] } } },
    { id: 'db-all', label: 'PostgreSQL (5432) de 0.0.0.0/0', target: { kind: 'sg-in', sg: 'sg-db', rule: { peer: ALL, ports: [5432, 5432] } } },
    { id: 'pub-in-443', label: '100 permite TCP 443 de 0.0.0.0/0', target: { kind: 'nacl-in', subnet: 'pub', rule: { num: 100, action: 'allow', cidr: ALL, ports: [443, 443] } } },
    { id: 'pub-in-eph', label: '110 permite TCP 1024-65535 de 10.50.2.0/24', target: { kind: 'nacl-in', subnet: 'pub', rule: { num: 110, action: 'allow', cidr: '10.50.2.0/24', ports: [1024, 65535] } } },
    { id: 'pub-in-deny', label: '50 nega tudo de 198.51.100.0/24', target: { kind: 'nacl-in', subnet: 'pub', rule: { num: 50, action: 'deny', cidr: '198.51.100.0/24', ports: 'all' } } },
    { id: 'pub-in-all', label: '200 permite tudo de 0.0.0.0/0', target: { kind: 'nacl-in', subnet: 'pub', rule: { num: 200, action: 'allow', cidr: ALL, ports: 'all' } } },
    { id: 'pub-out-eph', label: '100 permite TCP 1024-65535 para 0.0.0.0/0', target: { kind: 'nacl-out', subnet: 'pub', rule: { num: 100, action: 'allow', cidr: ALL, ports: [1024, 65535] } } },
    { id: 'pub-out-db', label: '110 permite TCP 5432 para 10.50.2.0/24', target: { kind: 'nacl-out', subnet: 'pub', rule: { num: 110, action: 'allow', cidr: '10.50.2.0/24', ports: [5432, 5432] } } },
    { id: 'priv-in-db', label: '100 permite TCP 5432 de 10.50.1.0/24', target: { kind: 'nacl-in', subnet: 'priv', rule: { num: 100, action: 'allow', cidr: '10.50.1.0/24', ports: [5432, 5432] } } },
    { id: 'priv-out-eph', label: '100 permite TCP 1024-65535 para 10.50.1.0/24', target: { kind: 'nacl-out', subnet: 'priv', rule: { num: 100, action: 'allow', cidr: '10.50.1.0/24', ports: [1024, 65535] } } },
  ],
  flows: [
    { id: 'aluno', label: 'Aluno na internet abre o site (porta 443)', from: 'internet', to: 'web', port: 443, clientPort: 52000, expect: 'allow', concepts: ['ec2.security-group', 'sg.stateful-stateless', 'sg.ephemeral-ports'] },
    { id: 'ssh', label: 'Alguém na internet tenta SSH no servidor web (porta 22)', from: 'internet', to: 'web', port: 22, clientPort: 52000, expect: 'deny', concepts: ['ec2.security-group'] },
    { id: 'ataque', label: 'A faixa 198.51.100.0/24, que está atacando, abre o site (porta 443)', from: 'internet', fromIp: '198.51.100.7', to: 'web', port: 443, clientPort: 52000, expect: 'deny', concepts: ['sg.nacl', 'sg.nacl-order'] },
    { id: 'app-db', label: 'O servidor web consulta o banco (porta 5432)', from: 'web', to: 'db', port: 5432, clientPort: 40000, expect: 'allow', concepts: ['sg.reference', 'sg.stateful-stateless', 'sg.ephemeral-ports'] },
    { id: 'net-db', label: 'Alguém na internet tenta chegar ao banco (porta 5432)', from: 'internet', to: 'db', port: 5432, clientPort: 52000, expect: 'deny', concepts: ['sg.reference'] },
  ],
  initial: ['web-443', 'web-22', 'db-all', 'pub-in-all', 'pub-in-443'],
  solution: ['web-443', 'db-sg', 'pub-in-deny', 'pub-in-443', 'pub-in-eph', 'pub-out-eph', 'pub-out-db', 'priv-in-db', 'priv-out-eph'],
}

// Mundo com o mesmo atacante, para a previsão da ordem das regras.
const ORDER_WORLD = (denyNum: number): ReachWorld => {
  const w = SABER_WORLD()
  w.subnets[0].naclIn = [
    { num: 100, action: 'allow', cidr: ALL, ports: [443, 443] },
    { num: denyNum, action: 'deny', cidr: '198.51.100.0/24', ports: 'all' },
  ]
  return w
}

export const F03_NET: PhaseDef = {
  ...META.f03,
  concepts: ['ec2.security-group', 'sg.reference', 'sg.nacl', 'sg.stateful-stateless', 'sg.nacl-order', 'sg.default-nacl', 'sg.ephemeral-ports', 'sg.flow-logs', 'sg.reachability-analyzer'],
  availability: 'available',
  simplifications: ['Os fluxos são conexões TCP em IPv4; regras de IPv6 e de outros protocolos ficam de fora.', 'Escola, endereços e ataque são fictícios.'],
  missions: [
    // -----------------------------------------------------------------------
    {
      id: 'net.f03.m1',
      title: 'Quem entra no servidor',
      type: 'mission',
      summary: 'Security groups: só permissões, com estado e com referência a outro grupo.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você cuida da rede de uma plataforma de cursos online.',
        situation: 'O site recebe os alunos pela porta 443, e o banco só deveria ser acessado pelo servidor web. Um servidor de relatórios, na mesma sub-rede do site, também está tentando falar com o banco.',
        objective: 'Prever o que os security groups deixam passar e escrever a regra do banco da forma certa.',
        successCriteria: ['Saber que a resposta volta sozinha no security group', 'Usar outro grupo como origem de uma regra'],
      },
      intel: [
        { conceptId: 'ec2.security-group', body: ['O **security group** só tem regras de **permissão** e **tem estado**: se a entrada passou, a resposta volta sem outra regra.'] },
        { conceptId: 'sg.reference', body: ['A origem de uma regra pode ser **outro security group**: "o banco aceita 5432 de quem está em sg-web". Quem entra no grupo ganha o acesso, e quem sai perde.'] },
      ],
      activities: [
        {
          id: 'net.f03.m1.a1',
          kind: 'predict',
          title: 'O aluno abre o site',
          prompt: 'O sg-web permite a porta 443 de 0.0.0.0/0 e não tem regra de saída extra. As ACLs são as padrão. Um aluno abre o site. O que acontece?',
          concepts: [{ id: 'ec2.security-group' }],
          xp: 40,
          difficulty: 1,
          explanation: ['A entrada na porta 443 é permitida. Como o security group tem estado, a resposta sai sem precisar de regra de saída. As ACLs padrão permitem tudo.'],
          spec: { sim: 'reach', world: SABER_WORLD(), flow: { id: 'f', from: 'internet', to: 'web', port: 443 } },
          options: [
            { id: 'a', text: 'A conexão funciona', outcome: 'delivered' },
            { id: 'b', text: 'A resposta é bloqueada, porque falta uma regra de saída', outcome: 'nacl-response' },
            { id: 'c', text: 'O security group bloqueia a entrada', outcome: 'sg-in' },
          ],
        },
        {
          id: 'net.f03.m1.a2',
          kind: 'predict',
          title: 'O servidor de relatórios',
          prompt: 'O sg-db permite a porta 5432 só do grupo sg-web. O servidor de relatórios, que usa o grupo sg-rel e fica na mesma sub-rede do site, tenta conectar ao banco. O que acontece?',
          concepts: [{ id: 'sg.reference' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A regra referencia o grupo sg-web, e não a sub-rede. O servidor de relatórios está em outro grupo, então o security group do banco bloqueia a entrada.'],
          spec: { sim: 'reach', world: SABER_WORLD(), flow: { id: 'f', from: 'relatorio', to: 'db', port: 5432 } },
          options: [
            { id: 'a', text: 'O security group do banco bloqueia a entrada', outcome: 'sg-in' },
            { id: 'b', text: 'Funciona: está na mesma sub-rede do servidor web', outcome: 'delivered' },
            { id: 'c', text: 'Não há caminho entre as sub-redes', outcome: 'route' },
          ],
        },
        {
          id: 'net.f03.m1.a3',
          kind: 'decision',
          title: 'A regra do banco',
          prompt: 'Os servidores web sobem e descem com o Auto Scaling, e os IPs mudam o tempo todo. Como escrever a regra de entrada do banco?',
          concepts: [{ id: 'sg.reference' }, { id: 'ec2.security-group', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['Referenciar o grupo dos servidores web acompanha as instâncias que entram e saem, sem abrir o banco para mais ninguém.'],
          options: [
            { id: 'a', text: 'Porta 5432 com origem no security group dos servidores web', correct: true, consequence: 'Toda instância nova do grupo ganha acesso; as outras, não.' },
            { id: 'b', text: 'Porta 5432 com origem no bloco inteiro da VPC', correct: false, consequence: 'Funciona, mas qualquer recurso da VPC passa a alcançar o banco.' },
            { id: 'c', text: 'Uma regra de negação para todo o resto', correct: false, consequence: 'Security groups não têm regras de negação.' },
          ],
        },
      ],
      debrief: { takeaways: ['Security group só permite e tem estado.', 'Referenciar outro grupo acompanha as instâncias, sem depender de IPs.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f03.m2',
      title: 'A trava da sub-rede',
      type: 'mission',
      summary: 'Network ACLs: sem estado, em ordem numérica, a padrão e a personalizada, e as portas efêmeras.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você adiciona uma segunda camada de defesa na sub-rede do site.',
        situation: 'Uma faixa de IPs está atacando o site, e security groups não negam nada. A equipe criou uma ACL nova para a sub-rede pública e, desde então, as páginas não carregam.',
        objective: 'Escrever regras de ACL que neguem o atacante e deixem as respostas passarem.',
        successCriteria: ['Lembrar da regra de resposta', 'Ordenar negação antes da permissão', 'Saber como nasce uma ACL nova'],
      },
      intel: [
        { conceptId: 'sg.stateful-stateless', body: ['A **ACL não tem estado**: a resposta é outro pacote. Liberou 443 na entrada? Libere a **saída para as portas efêmeras** do cliente.'] },
        { conceptId: 'sg.nacl-order', body: ['As regras são lidas do **menor número para o maior**, e a **primeira** que casa decide. A negação precisa vir **antes** da permissão ampla.'] },
        { conceptId: 'sg.ephemeral-ports', body: ['Linux usa 32768-61000; Windows Server 2008 ou mais novo, 49152-65535; NAT Gateway, ELB e Lambda, **1024-65535**.'] },
      ],
      activities: [
        {
          id: 'net.f03.m2.a1',
          kind: 'predict',
          title: 'Só a porta 443',
          prompt: 'A ACL da sub-rede pública permite, na saída, só TCP 443 para 0.0.0.0/0. A entrada continua com a padrão. Um aluno abre o site, usando a porta efêmera 50000. O que acontece?',
          concepts: [{ id: 'sg.stateful-stateless' }, { id: 'sg.ephemeral-ports', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A resposta do servidor vai para a porta 50000 do aluno. A ACL não lembra da ida e não tem regra para 50000 na saída: a regra marcada com asterisco nega a resposta.'],
          spec: { sim: 'reach', world: SABER_WORLD([{ num: 100, action: 'allow', cidr: ALL, ports: [443, 443] }]), flow: { id: 'f', from: 'internet', to: 'web', port: 443, clientPort: 50000 } },
          options: [
            { id: 'a', text: 'A resposta é bloqueada pela ACL na saída da sub-rede', outcome: 'nacl-response' },
            { id: 'b', text: 'A conexão funciona: a ACL tem estado como o security group', outcome: 'delivered' },
            { id: 'c', text: 'A ACL bloqueia a entrada', outcome: 'nacl-in' },
          ],
        },
        {
          id: 'net.f03.m2.a2',
          kind: 'predict',
          title: 'A negação depois da permissão',
          prompt: 'Na entrada da ACL pública: regra 100 permite TCP 443 de 0.0.0.0/0; regra 200 nega tudo de 198.51.100.0/24. O atacante, em 198.51.100.7, abre o site. O que acontece?',
          concepts: [{ id: 'sg.nacl-order' }],
          xp: 50,
          difficulty: 2,
          explanation: ['A regra 100 casa primeiro e permite. A 200 nunca é lida. Para negar o atacante, a regra de negação precisa ter número menor que 100.'],
          spec: { sim: 'reach', world: ORDER_WORLD(200), flow: { id: 'f', from: 'internet', fromIp: '198.51.100.7', to: 'web', port: 443 } },
          options: [
            { id: 'a', text: 'A conexão funciona: a regra 100 permite antes de a 200 ser lida', outcome: 'delivered' },
            { id: 'b', text: 'A ACL bloqueia: negação sempre vence permissão', outcome: 'nacl-in' },
          ],
        },
        {
          id: 'net.f03.m2.a3',
          kind: 'classify',
          title: 'Security group ou ACL',
          prompt: 'Classifique cada característica.',
          concepts: [{ id: 'sg.nacl' }, { id: 'sg.stateful-stateless' }],
          xp: 60,
          difficulty: 1,
          explanation: ['O security group fica no recurso, só permite, avalia todas as regras e tem estado. A network ACL fica na sub-rede, permite e nega, segue a ordem dos números e não tem estado.'],
          bins: [
            { id: 'sg', label: 'Security group' },
            { id: 'nacl', label: 'Network ACL' },
          ],
          items: [
            { id: 'res', text: 'Vale para o recurso ao qual está associado', bin: 'sg', explanation: 'O security group atua no nível da instância (ou da interface).', concepts: ['ec2.security-group'] },
            { id: 'sub', text: 'Vale para tudo o que entra e sai da sub-rede', bin: 'nacl', explanation: 'A ACL atua no nível da sub-rede.', concepts: ['sg.nacl'] },
            { id: 'deny', text: 'Tem regras que negam', bin: 'nacl', explanation: 'Só a ACL tem regras de negação.', concepts: ['sg.nacl'] },
            { id: 'state', text: 'A resposta volta sozinha', bin: 'sg', explanation: 'O security group tem estado.', concepts: ['sg.stateful-stateless'] },
            { id: 'order', text: 'A primeira regra que casa, em ordem numérica, decide', bin: 'nacl', explanation: 'A ACL segue a ordem dos números.', concepts: ['sg.nacl-order'] },
          ],
        },
        {
          id: 'net.f03.m2.a4',
          kind: 'decision',
          title: 'A ACL nova',
          prompt: 'A equipe criou uma ACL personalizada, associou à sub-rede pública e não adicionou nenhuma regra. O que aconteceu com o site?',
          concepts: [{ id: 'sg.default-nacl' }],
          xp: 40,
          difficulty: 2,
          explanation: ['A ACL padrão da VPC permite tudo, mas uma ACL personalizada nova nasce só com as regras marcadas com asterisco, que negam tudo. Ao trocar a associação, a sub-rede passou a negar todo o tráfego.'],
          options: [
            { id: 'a', text: 'Saiu do ar: uma ACL personalizada nova nega tudo até receber regras', correct: true, consequence: 'É preciso criar as regras de entrada e de saída, inclusive as de resposta.' },
            { id: 'b', text: 'Nada mudou: uma ACL nova copia as regras da padrão', correct: false, consequence: 'A ACL nova não herda as regras 100 e 101 da padrão.' },
            { id: 'c', text: 'Só o SSH parou', correct: false, consequence: 'Todo o tráfego para a sub-rede passou a ser negado.' },
          ],
        },
        {
          id: 'net.f03.m2.a5',
          kind: 'decision',
          title: 'Clientes Windows',
          prompt: 'A regra de saída da ACL pública libera as respostas só para 32768-61000. Alunos com Windows 10 reclamam que o site não abre. Qual regra resolve sem abrir demais?',
          concepts: [{ id: 'sg.ephemeral-ports' }],
          xp: 50,
          difficulty: 3,
          explanation: ['Clientes Windows recentes usam 49152-65535, e a regra para em 61000. Para atender clientes variados, a AWS sugere liberar 1024-65535 na saída e negar as portas maliciosas dessa faixa com regras de número menor.'],
          options: [
            { id: 'a', text: 'Liberar a saída para 1024-65535, negando antes as portas maliciosas dessa faixa', correct: true, consequence: 'Respostas para Linux, Windows e outros clientes passam.' },
            { id: 'b', text: 'Liberar a saída só para a porta 443', correct: false, consequence: 'A resposta vai para a porta efêmera do cliente, e não para a 443.' },
            { id: 'c', text: 'Trocar a ACL por uma regra de saída no security group', correct: false, consequence: 'O security group já deixa a resposta sair; quem bloqueia é a ACL.' },
          ],
        },
      ],
      debrief: { takeaways: ['A ACL não tem estado: libere a resposta para as portas efêmeras.', 'Negação com número menor que a permissão ampla.', 'ACL personalizada nova nega tudo; a padrão permite tudo.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f03.m3',
      title: 'Por que não chega?',
      type: 'mission',
      summary: 'VPC Flow Logs e Reachability Analyzer para descobrir o que bloqueia.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você investiga uma conexão que falha sem mensagem de erro.',
        situation: 'Um parceiro diz que a integração com a escola parou. Do lado da escola, ninguém mudou nada de propósito, mas houve uma revisão das ACLs na semana passada.',
        objective: 'Usar as ferramentas certas para achar onde o tráfego para.',
        successCriteria: ['Ler um Flow Log', 'Saber quando usar o Reachability Analyzer'],
      },
      intel: [
        { conceptId: 'sg.flow-logs', body: ['Os **Flow Logs** mostram origem, destino, portas e se o tráfego foi **aceito** (ACCEPT) ou **rejeitado** (REJECT), sem o conteúdo. Vão para CloudWatch Logs, S3 ou Data Firehose.'] },
        { conceptId: 'sg.reachability-analyzer', body: ['O **Reachability Analyzer** lê a configuração, sem enviar pacotes, e aponta o **componente que bloqueia**.'] },
      ],
      activities: [
        {
          id: 'net.f03.m3.a1',
          kind: 'decision',
          title: 'Quem está sendo rejeitado',
          prompt: 'A equipe quer ver, nos últimos dias, quais conexões chegaram à sub-rede e foram rejeitadas. Qual recurso usar?',
          concepts: [{ id: 'sg.flow-logs' }],
          xp: 40,
          difficulty: 1,
          explanation: ['Os Flow Logs registram os metadados de cada fluxo, inclusive se foi aceito ou rejeitado. Precisam estar ligados antes para que haja histórico.'],
          options: [
            { id: 'a', text: 'VPC Flow Logs da sub-rede', correct: true, consequence: 'Cada registro traz origem, destino, portas e ACCEPT ou REJECT.' },
            { id: 'b', text: 'Um espelhamento de todo o conteúdo dos pacotes', correct: false, consequence: 'O problema é saber o que foi rejeitado, e o Flow Log responde isso sem guardar conteúdo.' },
            { id: 'c', text: 'O histórico da tabela de rotas', correct: false, consequence: 'A tabela de rotas não guarda registro de tráfego.' },
          ],
        },
        {
          id: 'net.f03.m3.a2',
          kind: 'decision',
          title: 'Sem gerar tráfego',
          prompt: 'Antes de ligar o parceiro de novo, a equipe quer saber se a configuração atual permite o caminho entre o servidor da escola e o endereço dele, sem enviar nenhum pacote. O que usar?',
          concepts: [{ id: 'sg.reachability-analyzer' }],
          xp: 40,
          difficulty: 2,
          explanation: ['O Reachability Analyzer analisa a configuração e mostra o caminho salto a salto ou o componente que bloqueia: security group, ACL, tabela de rotas ou balanceador.'],
          options: [
            { id: 'a', text: 'Reachability Analyzer', correct: true, consequence: 'Ele aponta o componente que bloqueia, sem enviar tráfego.' },
            { id: 'b', text: 'VPC Flow Logs', correct: false, consequence: 'Os Flow Logs registram o tráfego que já passou; sem tráfego, não há registro.' },
            { id: 'c', text: 'Abrir todas as portas por uma hora e observar', correct: false, consequence: 'Expõe a escola e não explica o problema.' },
          ],
        },
        {
          id: 'net.f03.m3.a3',
          kind: 'investigate',
          title: 'O registro de REJECT',
          prompt: 'Leia os Flow Logs da sub-rede pública, marque as linhas que explicam a falha e escolha a causa e as correções.',
          concepts: [{ id: 'sg.flow-logs' }, { id: 'sg.stateful-stateless' }, { id: 'sg.ephemeral-ports', weight: 0.5 }],
          xp: 80,
          difficulty: 3,
          explanation: ['A chamada do parceiro chega e é aceita na porta 443, mas a resposta do servidor para a porta 55012 do parceiro é rejeitada na saída. A revisão deixou a ACL de saída só com 32768-50000. Como a ACL não tem estado, a resposta precisa de regra própria para a faixa efêmera do cliente.'],
          scenario: ['Formato simplificado: horário, origem:porta, destino:porta, sentido e ação.'],
          artifacts: [
            {
              id: 'flow',
              title: 'Flow Logs da interface do servidor web',
              format: 'log',
              lines: [
                { id: 'l1', text: '10:02:01  203.0.113.80:55012  10.50.1.10:443    entrada  ACCEPT', isIssue: false, explanation: 'A requisição do parceiro chega e é aceita.' },
                { id: 'l2', text: '10:02:01  10.50.1.10:443     203.0.113.80:55012 saída   REJECT', isIssue: true, explanation: 'A resposta para a porta efêmera 55012 do parceiro é rejeitada.' },
                { id: 'l3', text: '10:03:15  198.51.100.4:61022  10.50.1.10:22     entrada  REJECT', isIssue: false, explanation: 'Uma tentativa de SSH bloqueada, como esperado.' },
                { id: 'l4', text: 'ACL de saída: 100 permite TCP 32768-50000 para 0.0.0.0/0', isIssue: true, explanation: 'A faixa para em 50000 e não cobre a porta 55012.' },
              ],
            },
          ],
          rootCause: {
            prompt: 'Qual é a causa?',
            options: [
              { id: 'a', text: 'A ACL de saída não cobre a porta efêmera usada pelo parceiro, e a ACL não tem estado', correct: true, feedback: 'A ida passa, a volta é negada na saída.' },
              { id: 'b', text: 'O security group do servidor bloqueia a porta 443', correct: false, feedback: 'A entrada na 443 foi aceita.' },
              { id: 'c', text: 'Falta rota para o internet gateway', correct: false, feedback: 'O pacote chegou; o problema é a resposta.' },
            ],
          },
          remediations: {
            prompt: 'Quais correções fazem sentido?',
            options: [
              { id: 'a', text: 'Liberar a saída para 1024-65535 e negar antes as portas maliciosas dessa faixa', correct: true, feedback: 'Cobre as portas efêmeras de clientes variados.' },
              { id: 'b', text: 'Validar a mudança com o Reachability Analyzer antes de avisar o parceiro', correct: true, feedback: 'Confirma o caminho sem depender de novos testes do parceiro.' },
              { id: 'c', text: 'Adicionar uma regra de saída no security group para a porta 55012', correct: false, feedback: 'O security group já deixa a resposta sair; o bloqueio é da ACL.' },
            ],
          },
        },
      ],
      debrief: { takeaways: ['Flow Logs mostram o que foi aceito e rejeitado, sem conteúdo.', 'O Reachability Analyzer aponta o bloqueio sem enviar pacotes.', 'Ida aceita e volta rejeitada é sinal de ACL sem regra de resposta.'] },
    },
    // -----------------------------------------------------------------------
    {
      id: 'net.f03.boss',
      title: 'A defesa da escola',
      type: 'boss',
      summary: 'Ligue as regras de security group e de ACL para cada fluxo passar ou ser barrado como pede o requisito.',
      briefing: {
        company: 'Escola Online Saber Mais',
        role: 'Você monta as duas camadas de defesa da escola.',
        situation: 'A sub-rede pública ganhou uma ACL personalizada, e a privada também. Os alunos precisam abrir o site, o servidor web precisa do banco, e a faixa que está atacando, o SSH aberto e o acesso direto ao banco precisam ser barrados.',
        objective: 'Ligar só as regras necessárias.',
        successCriteria: ['Os dois fluxos legítimos funcionam', 'Os três fluxos proibidos são barrados'],
      },
      intel: [
        { conceptId: 'sg.stateful-stateless', body: ['Cada fluxo que atravessa uma ACL personalizada precisa de **ida** e de **volta** nas duas sub-redes.'] },
        { conceptId: 'sg.nacl-order', body: ['A negação do atacante tem número **menor** que a permissão da porta 443.'] },
      ],
      activities: [
        {
          id: 'net.f03.boss.a1',
          kind: 'lab',
          lab: 'reach',
          title: 'Cinco fluxos',
          prompt: 'Marque as regras que devem existir. A tabela mostra, ao vivo, o resultado de cada fluxo.',
          concepts: [{ id: 'ec2.security-group' }, { id: 'sg.reference' }, { id: 'sg.nacl' }, { id: 'sg.nacl-order' }, { id: 'sg.stateful-stateless' }, { id: 'sg.ephemeral-ports' }],
          xp: 220,
          difficulty: 3,
          hints: ['O banco aceita o grupo sg-web, e não 0.0.0.0/0.', 'Cada sub-rede precisa da regra de resposta para as portas efêmeras, na saída e na entrada.'],
          explanation: [
            'Security groups: sg-web com HTTPS de 0.0.0.0/0, sem SSH; sg-db com 5432 do grupo sg-web.',
            'ACL pública, entrada: 50 nega 198.51.100.0/24, 100 permite 443, 110 permite as respostas do banco (1024-65535 de 10.50.2.0/24). Saída: 100 permite 1024-65535 para 0.0.0.0/0 e 110 permite 5432 para a sub-rede privada.',
            'ACL privada: entrada 100 permite 5432 da sub-rede pública; saída 100 permite 1024-65535 para a sub-rede pública.',
          ],
          config: SABER_LAB,
        },
        {
          id: 'net.f03.boss.a2',
          kind: 'decision',
          title: 'A camada principal',
          prompt: 'Depois do ataque, alguém sugere apagar todos os security groups e controlar tudo pelas ACLs. O que dizer?',
          concepts: [{ id: 'sg.nacl' }, { id: 'ec2.security-group', weight: 0.5 }],
          xp: 50,
          difficulty: 2,
          explanation: ['A AWS recomenda os security groups como mecanismo principal: têm estado e referenciam outros grupos. As ACLs servem como segunda camada, para negar faixas específicas ou como trava da sub-rede.'],
          options: [
            { id: 'a', text: 'Os security groups continuam como controle principal; a ACL fica como segunda camada', correct: true, consequence: 'Cada camada faz o que faz melhor.' },
            { id: 'b', text: 'Concordar: ACLs são mais seguras porque negam', correct: false, consequence: 'Sem estado e sem referência a grupos, as ACLs ficam difíceis de manter como controle único.' },
          ],
        },
      ],
      debrief: { takeaways: ['Security group como controle principal; ACL como segunda camada.', 'Em ACL personalizada, cada fluxo precisa de ida e volta.', 'A negação de um atacante vem antes da permissão ampla.'] },
    },
  ],
}
